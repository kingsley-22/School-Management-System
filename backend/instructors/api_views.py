from datetime import date, time, timedelta
from decimal import Decimal, InvalidOperation

from django.contrib.auth import get_user_model
from django.db.models import Avg, Q
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from accounts.models import InstructorProfile
from accounts.permissions import IsInstructor
from students.models import (
    Announcement,
    Assignment,
    AssignmentSubmission,
    Course,
    Enrollment,
    StudentNotification,
    StudentProfile,
    StudentResult,
    calculate_letter_grade,
)
from .models import ClassSchedule, InstructorActivity
from .serializers import (
    InstructorCourseWriteSerializer,
    get_user_full_name,
    serialize_class_schedule,
    serialize_instructor_activity,
    serialize_instructor_announcement,
    serialize_instructor_assignment,
    serialize_instructor_course,
    serialize_instructor_notification,
    serialize_instructor_profile,
    serialize_instructor_student_enrollment,
    serialize_submission,
)

User = get_user_model()


def _log_instructor_activity(user, activity_type, title, description="", link=""):
    default_links = {
        "student": "/instructor/students/",
        "course": "/instructor/courses/",
        "assignment": "/instructor/assignments/",
        "announcement": "/instructor/announcements/",
        "schedule": "/instructor/",
        "grade": "/instructor/assignments/",
    }
    return InstructorActivity.objects.create(
        instructor=user,
        activity_type=activity_type,
        title=title[:200],
        description=description,
        link=link or default_links.get(activity_type, "/instructor/"),
    )


def _resolve_instructor_course(user, course_ref):
    """Resolve a course owned by this instructor by numeric ID, code, or title."""
    if course_ref is None or str(course_ref).strip() == "":
        return None
    raw = str(course_ref).strip()
    qs = Course.objects.filter(instructor=user)
    if raw.isdigit():
        course = qs.filter(id=int(raw)).first()
        if course:
            return course
    course = qs.filter(code__iexact=raw).first()
    if course:
        return course
    return qs.filter(title__iexact=raw).first()


def _parse_date(value):
    if not value:
        return None
    if isinstance(value, date):
        return value
    try:
        return date.fromisoformat(str(value).strip())
    except ValueError:
        return None


def _parse_time(value):
    if not value:
        return None
    if isinstance(value, time):
        return value
    raw = str(value).strip()
    for fmt in ("%H:%M", "%H:%M:%S"):
        try:
            return timezone.datetime.strptime(raw, fmt).time()
        except ValueError:
            continue
    return None


# =========================================================
# 1. PROFILE & SETTINGS
# =========================================================

@api_view(["GET", "PATCH", "PUT"])
@permission_classes([IsInstructor])
def instructor_profile_api(request):
    user = request.user
    profile = InstructorProfile.get_or_create_for_user(user)

    if request.method in ("PATCH", "PUT"):
        full_name = (request.data.get("name") or request.data.get("full_name") or "").strip()
        first_name = request.data.get("first_name")
        last_name = request.data.get("last_name")

        if full_name and first_name is None and last_name is None:
            parts = full_name.split(None, 1)
            user.first_name = parts[0]
            user.last_name = parts[1] if len(parts) > 1 else ""
        else:
            if first_name is not None:
                user.first_name = str(first_name).strip()
            if last_name is not None:
                user.last_name = str(last_name).strip()

        user.save(update_fields=["first_name", "last_name"])

        for field in ("username", "phone", "department", "specialization"):
            if field in request.data:
                setattr(profile, field, str(request.data.get(field) or "").strip())
        profile.save()

        # Keep denormalized instructor_name in sync on owned courses
        Course.objects.filter(instructor=user).update(instructor_name=get_user_full_name(user))

    data = serialize_instructor_profile(user)
    return Response(
        {
            "message": "Welcome to the instructor API.",
            "instructor": data,
            **data,
        }
    )


# =========================================================
# 2. DASHBOARD SUMMARY
# =========================================================

@api_view(["GET"])
@permission_classes([IsInstructor])
def instructor_dashboard_api(request):
    user = request.user
    courses_qs = Course.objects.filter(instructor=user).order_by("id")
    course_ids = list(courses_qs.values_list("id", flat=True))

    enrollments_qs = Enrollment.objects.filter(course_id__in=course_ids)
    total_students = enrollments_qs.values("student_id").distinct().count()
    avg_perf_val = enrollments_qs.aggregate(avg=Avg("progress")).get("avg") or 0

    assignments_qs = Assignment.objects.filter(course_id__in=course_ids)
    total_assignments = assignments_qs.count()

    announcements_qs = Announcement.objects.filter(
        Q(created_by=user) | Q(course_id__in=course_ids)
    ).distinct()

    schedules_qs = ClassSchedule.objects.filter(
        Q(instructor_user=user) | Q(course_id__in=course_ids)
    ).distinct().order_by("date", "start_time", "id")

    activities_qs = InstructorActivity.objects.filter(instructor=user)[:6]
    unread_notifications = StudentNotification.objects.filter(user=user, is_read=False).count()

    course_overview = [serialize_instructor_course(c) for c in courses_qs]

    return Response(
        {
            "instructor": serialize_instructor_profile(user),
            "stats": {
                "total_courses": len(course_ids),
                "total_students": total_students,
                "total_assignments": total_assignments,
                "total_announcements": announcements_qs.count(),
                "average_performance": round(float(avg_perf_val), 1),
                "unread_notifications": unread_notifications,
            },
            "course_overview": course_overview,
            "upcoming_classes": [serialize_class_schedule(s) for s in schedules_qs],
            "recent_activities": [serialize_instructor_activity(a) for a in activities_qs],
        }
    )


# =========================================================
# 3. COURSES (CRUD)
# =========================================================

@api_view(["GET", "POST"])
@permission_classes([IsInstructor])
def instructor_courses_api(request):
    user = request.user

    if request.method == "GET":
        qs = Course.objects.filter(instructor=user).order_by("-created_at", "-id")
        search = (request.query_params.get("search") or "").strip()
        status_filter = (request.query_params.get("status") or "all").strip().lower()

        if search:
            qs = qs.filter(
                Q(title__icontains=search)
                | Q(description__icontains=search)
                | Q(code__icontains=search)
                | Q(category__icontains=search)
            )
        if status_filter == "active":
            qs = qs.filter(is_active=True)
        elif status_filter == "draft":
            qs = qs.filter(is_active=False)

        results = [serialize_instructor_course(c) for c in qs]
        return Response({"count": len(results), "results": results})

    serializer = InstructorCourseWriteSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    course = serializer.save(
        instructor=user,
        instructor_name=get_user_full_name(user),
    )
    _log_instructor_activity(
        user,
        "course",
        "New Course Created",
        f'You created the course "{course.title}"',
        "/instructor/courses/",
    )
    return Response(
        {
            "message": "Course created successfully.",
            "course": serialize_instructor_course(course),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET", "PATCH", "PUT", "DELETE"])
@permission_classes([IsInstructor])
def instructor_course_detail_api(request, course_id):
    course = Course.objects.filter(id=course_id, instructor=request.user).first()
    if not course:
        return Response({"error": "Course not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response(serialize_instructor_course(course))

    if request.method in ("PATCH", "PUT"):
        serializer = InstructorCourseWriteSerializer(course, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        course = serializer.save(instructor_name=get_user_full_name(request.user))
        _log_instructor_activity(
            request.user,
            "edit",
            "Course Updated",
            f'Updated course "{course.title}"',
            "/instructor/courses/",
        )
        return Response(
            {
                "message": "Course updated successfully.",
                "course": serialize_instructor_course(course),
            }
        )

    title = course.title
    course.delete()
    _log_instructor_activity(
        request.user,
        "delete",
        "Course Deleted",
        f'Deleted the course "{title}"',
        "/instructor/courses/",
    )
    return Response({"message": f'Course "{title}" deleted successfully.'})


# =========================================================
# 4. UPCOMING CLASSES / SCHEDULE
# =========================================================

@api_view(["GET", "POST"])
@permission_classes([IsInstructor])
def instructor_classes_api(request):
    user = request.user
    course_ids = list(Course.objects.filter(instructor=user).values_list("id", flat=True))

    if request.method == "GET":
        qs = ClassSchedule.objects.filter(
            Q(instructor_user=user) | Q(course_id__in=course_ids)
        ).distinct().order_by("date", "start_time", "id")
        results = [serialize_class_schedule(s) for s in qs]
        return Response({"count": len(results), "results": results})

    course_ref = request.data.get("course_id") or request.data.get("course")
    course = _resolve_instructor_course(user, course_ref)
    if not course:
        return Response(
            {"error": "Please select one of your assigned courses."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    class_date = _parse_date(request.data.get("date"))
    start_time = _parse_time(request.data.get("time") or request.data.get("start_time"))
    end_time = _parse_time(request.data.get("end_time"))

    if not class_date or not start_time:
        return Response(
            {"error": "Valid date (YYYY-MM-DD) and time (HH:MM) are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    enrolled_count = Enrollment.objects.filter(course=course).count()
    schedule = ClassSchedule.objects.create(
        instructor_user=user,
        course=course,
        subject=course.title,
        instructor=get_user_full_name(user),
        date=class_date,
        start_time=start_time,
        end_time=end_time,
        room=(request.data.get("room") or "").strip(),
        students=enrolled_count,
    )
    _log_instructor_activity(
        user,
        "schedule",
        "Class Scheduled",
        f'{course.title} scheduled for {class_date.isoformat()} at {start_time.strftime("%H:%M")}',
        "/instructor/",
    )

    # Notify all students enrolled in this course about the upcoming class
    enrolled_student_ids = (
        Enrollment.objects.filter(course=course)
        .exclude(status=Enrollment.StatusChoices.DROPPED)
        .values_list("student_id", flat=True)
        .distinct()
    )
    StudentNotification.objects.bulk_create(
        [
            StudentNotification(
                user_id=sid,
                title=f"Upcoming Class: {course.title}",
                message=f'{get_user_full_name(user)} scheduled a class for {course.title} on {class_date.isoformat()} at {start_time.strftime("%H:%M")}.',
                notification_type=StudentNotification.TypeChoices.ANNOUNCEMENT,
            )
            for sid in enrolled_student_ids
        ]
    )

    return Response(
        {
            "message": "Class scheduled successfully.",
            "class_schedule": serialize_class_schedule(schedule),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["DELETE"])
@permission_classes([IsInstructor])
def instructor_class_detail_api(request, class_id):
    user = request.user
    course_ids = list(Course.objects.filter(instructor=user).values_list("id", flat=True))
    schedule = ClassSchedule.objects.filter(
        Q(instructor_user=user) | Q(course_id__in=course_ids),
        id=class_id,
    ).first()
    if not schedule:
        return Response({"error": "Scheduled class not found."}, status=status.HTTP_404_NOT_FOUND)

    subject = schedule.subject or (schedule.course.title if schedule.course else "Class")
    schedule.delete()
    _log_instructor_activity(
        user,
        "delete",
        "Class Cancelled",
        f'Removed scheduled class for "{subject}"',
        "/instructor/",
    )
    return Response({"message": "Scheduled class deleted successfully."})


# =========================================================
# 5. STUDENTS & ENROLLMENTS
# =========================================================

@api_view(["GET", "POST"])
@permission_classes([IsInstructor])
def instructor_students_api(request):
    user = request.user
    courses_qs = Course.objects.filter(instructor=user)
    course_ids = list(courses_qs.values_list("id", flat=True))

    if request.method == "GET":
        enrollments_qs = (
            Enrollment.objects.filter(course_id__in=course_ids)
            .select_related("student", "course")
            .order_by("-enrolled_at", "-id")
        )

        search = (request.query_params.get("search") or "").strip()
        course_filter = (request.query_params.get("course") or "all").strip()

        all_serialized = [serialize_instructor_student_enrollment(e) for e in enrollments_qs]
        unique_students = {item["id"]: item for item in all_serialized}
        stats = {
            "total_students": len(unique_students),
            "active_students": sum(1 for s in unique_students.values() if s["status"] == "Active"),
            "students_in_courses": len(all_serialized),
            "top_performers": sum(1 for s in all_serialized if (s["progress"] or 0) >= 80),
        }

        filtered = all_serialized
        if search:
            q = search.lower()
            filtered = [
                item
                for item in filtered
                if q in item["full_name"].lower()
                or q in item["email"].lower()
                or q in item["student_id"].lower()
                or q in item["course"].lower()
            ]
        if course_filter and course_filter.lower() != "all":
            cf = course_filter.lower()
            filtered = [
                item
                for item in filtered
                if str(item["course_id"]) == cf
                or item["course"].lower() == cf
                or cf in item["course"].lower()
                or cf in (item["course_category"] or "").lower()
            ]

        return Response(
            {
                "count": len(filtered),
                "stats": stats,
                "courses": [serialize_instructor_course(c) for c in courses_qs],
                "results": filtered,
            }
        )

    # POST: Enroll an existing student (or create a student account + enroll) into one of this instructor's courses
    name = (request.data.get("name") or request.data.get("full_name") or "").strip()
    email = (request.data.get("email") or "").strip().lower()
    course_ref = request.data.get("course_id") or request.data.get("course")
    status_val = (request.data.get("status") or "Active").strip().lower()

    if not email:
        return Response({"error": "Student email is required."}, status=status.HTTP_400_BAD_REQUEST)

    course = _resolve_instructor_course(user, course_ref)
    if not course:
        return Response(
            {"error": "Please select one of your assigned courses."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    student_user = User.objects.filter(email__iexact=email).first()
    if student_user and student_user.role != "STUDENT":
        return Response(
            {"error": "This email belongs to a non-student account."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not student_user:
        if not name:
            return Response(
                {"error": "Student full name is required to register a new student."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        parts = name.split(None, 1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else ""
        student_user = User(
            email=email,
            first_name=first_name,
            last_name=last_name,
            role="STUDENT",
            is_verified=True,
            is_approved=True,
            is_active=(status_val != "inactive"),
        )
        student_user.set_unusable_password()
        student_user.save()

    profile = StudentProfile.get_or_create_for_user(student_user)
    if not profile.course:
        profile.course = course.title
    profile.status = (
        StudentProfile.StatusChoices.INACTIVE
        if status_val == "inactive"
        else StudentProfile.StatusChoices.ACTIVE
    )
    profile.save()

    enrollment, created = Enrollment.objects.get_or_create(
        student=student_user,
        course=course,
        defaults={
            "status": Enrollment.StatusChoices.DROPPED if status_val == "inactive" else Enrollment.StatusChoices.ACTIVE,
        },
    )
    if not created:
        return Response(
            {"error": f"{get_user_full_name(student_user)} is already enrolled in {course.title}."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    _log_instructor_activity(
        user,
        "student",
        "New Student Enrolled",
        f'{get_user_full_name(student_user)} enrolled in {course.title}',
        "/instructor/students/",
    )
    StudentNotification.objects.create(
        user=student_user,
        title="Enrolled in Course",
        message=f"You have been enrolled in {course.title} by {get_user_full_name(user)}.",
        notification_type=StudentNotification.TypeChoices.GENERAL,
    )
    return Response(
        {
            "message": "Student enrolled successfully.",
            "student": serialize_instructor_student_enrollment(enrollment),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([IsInstructor])
def instructor_student_detail_api(request, student_id):
    course_ids = list(Course.objects.filter(instructor=request.user).values_list("id", flat=True))
    enrollments = list(
        Enrollment.objects.filter(course_id__in=course_ids, student_id=student_id).select_related("student", "course")
    )
    if not enrollments:
        return Response({"error": "Student not found in your courses."}, status=status.HTTP_404_NOT_FOUND)

    primary = serialize_instructor_student_enrollment(enrollments[0])
    primary["enrollments"] = [serialize_instructor_student_enrollment(e) for e in enrollments]
    return Response(primary)


# =========================================================
# 6. ASSIGNMENTS & SUBMISSIONS / GRADING
# =========================================================

@api_view(["GET", "POST"])
@permission_classes([IsInstructor])
def instructor_assignments_api(request):
    user = request.user
    courses_qs = Course.objects.filter(instructor=user)
    course_ids = list(courses_qs.values_list("id", flat=True))

    if request.method == "GET":
        assignments_qs = (
            Assignment.objects.filter(course_id__in=course_ids)
            .select_related("course")
            .order_by("-created_at", "-id")
        )
        all_serialized = [serialize_instructor_assignment(a) for a in assignments_qs]
        stats = {
            "total_assignments": len(all_serialized),
            "active_assignments": sum(1 for a in all_serialized if a["status"] == "Active"),
            "completed_assignments": sum(1 for a in all_serialized if a["status"] == "Completed"),
            "total_submissions": sum(a["submissions_count"] for a in all_serialized),
        }

        search = (request.query_params.get("search") or "").strip().lower()
        course_filter = (request.query_params.get("course") or "all").strip().lower()

        filtered = all_serialized
        if search:
            filtered = [
                a
                for a in filtered
                if search in a["title"].lower()
                or search in a["assignment_code"].lower()
                or search in a["course_title"].lower()
            ]
        if course_filter and course_filter != "all":
            filtered = [
                a
                for a in filtered
                if str(a["course_id"]) == course_filter
                or a["course_title"].lower() == course_filter
                or course_filter in a["course_title"].lower()
            ]

        return Response(
            {
                "count": len(filtered),
                "stats": stats,
                "courses": [serialize_instructor_course(c) for c in courses_qs],
                "results": filtered,
            }
        )

    title = (request.data.get("title") or "").strip()
    description = (request.data.get("description") or "").strip()
    course_ref = request.data.get("course_id") or request.data.get("course")
    due_date = _parse_date(request.data.get("due_date") or request.data.get("dueDate"))
    max_score_raw = request.data.get("max_score", request.data.get("score", 100))

    if not title:
        return Response({"error": "Assignment title is required."}, status=status.HTTP_400_BAD_REQUEST)

    course = _resolve_instructor_course(user, course_ref)
    if not course:
        return Response(
            {"error": "Please select one of your assigned courses."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not due_date:
        return Response({"error": "A valid due date (YYYY-MM-DD) is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        max_score = int(max_score_raw)
        if max_score < 1:
            raise ValueError()
    except (TypeError, ValueError):
        return Response({"error": "Max score must be a positive integer."}, status=status.HTTP_400_BAD_REQUEST)

    assignment = Assignment.objects.create(
        course=course,
        title=title,
        description=description,
        due_date=due_date,
        max_score=max_score,
        is_active=True,
    )
    _log_instructor_activity(
        user,
        "assignment",
        "Assignment Created",
        f'Created "{assignment.title}" for {course.title}',
        "/instructor/assignments/",
    )

    # Notify enrolled students
    enrolled_student_ids = Enrollment.objects.filter(course=course).values_list("student_id", flat=True)
    StudentNotification.objects.bulk_create(
        [
            StudentNotification(
                user_id=sid,
                title=f"New Assignment: {assignment.title}",
                message=f"Due {assignment.due_date.isoformat()} in {course.title}.",
                notification_type=StudentNotification.TypeChoices.ASSIGNMENT,
            )
            for sid in enrolled_student_ids
        ]
    )

    return Response(
        {
            "message": "Assignment created successfully.",
            "assignment": serialize_instructor_assignment(assignment),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET", "PATCH", "PUT", "DELETE"])
@permission_classes([IsInstructor])
def instructor_assignment_detail_api(request, assignment_id):
    user = request.user
    assignment = (
        Assignment.objects.filter(id=assignment_id, course__instructor=user)
        .select_related("course")
        .first()
    )
    if not assignment:
        return Response({"error": "Assignment not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        data = serialize_instructor_assignment(assignment)
        submissions = AssignmentSubmission.objects.filter(assignment=assignment).select_related("student")
        data["submissions"] = [serialize_submission(s) for s in submissions]
        return Response(data)

    if request.method in ("PATCH", "PUT"):
        if "title" in request.data and str(request.data.get("title") or "").strip():
            assignment.title = str(request.data["title"]).strip()
        if "description" in request.data:
            assignment.description = str(request.data.get("description") or "").strip()
        if "course_id" in request.data or "course" in request.data:
            new_course = _resolve_instructor_course(user, request.data.get("course_id") or request.data.get("course"))
            if not new_course:
                return Response(
                    {"error": "Selected course does not belong to you."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            assignment.course = new_course
        if "due_date" in request.data or "dueDate" in request.data:
            parsed_due = _parse_date(request.data.get("due_date") or request.data.get("dueDate"))
            if not parsed_due:
                return Response({"error": "Invalid due date format."}, status=status.HTTP_400_BAD_REQUEST)
            assignment.due_date = parsed_due
        if "max_score" in request.data or "score" in request.data:
            try:
                ms = int(request.data.get("max_score", request.data.get("score")))
                if ms < 1:
                    raise ValueError()
                assignment.max_score = ms
            except (TypeError, ValueError):
                return Response({"error": "Max score must be a positive integer."}, status=status.HTTP_400_BAD_REQUEST)
        if "is_active" in request.data:
            assignment.is_active = bool(request.data["is_active"])

        assignment.save()
        _log_instructor_activity(
            user,
            "edit",
            "Assignment Updated",
            f'Updated assignment "{assignment.title}"',
            "/instructor/assignments/",
        )
        return Response(
            {
                "message": "Assignment updated successfully.",
                "assignment": serialize_instructor_assignment(assignment),
            }
        )

    title = assignment.title
    assignment.delete()
    _log_instructor_activity(
        user,
        "delete",
        "Assignment Deleted",
        f'Deleted assignment "{title}"',
        "/instructor/assignments/",
    )
    return Response({"message": f'Assignment "{title}" deleted successfully.'})


@api_view(["GET"])
@permission_classes([IsInstructor])
def instructor_assignment_submissions_api(request, assignment_id):
    assignment = (
        Assignment.objects.filter(id=assignment_id, course__instructor=request.user)
        .select_related("course")
        .first()
    )
    if not assignment:
        return Response({"error": "Assignment not found."}, status=status.HTTP_404_NOT_FOUND)

    submissions = AssignmentSubmission.objects.filter(assignment=assignment).select_related("student")
    return Response(
        {
            "assignment": serialize_instructor_assignment(assignment),
            "count": submissions.count(),
            "results": [serialize_submission(s) for s in submissions],
        }
    )


@api_view(["POST", "PATCH"])
@permission_classes([IsInstructor])
def instructor_grade_submission_api(request, submission_id):
    user = request.user
    submission = (
        AssignmentSubmission.objects.filter(id=submission_id, assignment__course__instructor=user)
        .select_related("assignment", "assignment__course", "student")
        .first()
    )
    if not submission:
        return Response({"error": "Submission not found."}, status=status.HTTP_404_NOT_FOUND)

    raw_score = request.data.get("score")
    if raw_score is None or str(raw_score).strip() == "":
        return Response({"error": "Score is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        score = Decimal(str(raw_score))
    except (InvalidOperation, TypeError, ValueError):
        return Response({"error": "Score must be a valid number."}, status=status.HTTP_400_BAD_REQUEST)

    max_score = Decimal(str(submission.assignment.max_score or 100))
    if score < 0 or score > max_score:
        return Response(
            {"error": f"Score must be between 0 and {max_score}."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    feedback = (request.data.get("feedback") or "").strip()
    submission.score = score
    submission.feedback = feedback
    submission.status = AssignmentSubmission.StatusChoices.GRADED
    submission.graded_at = timezone.now()
    submission.save()

    percentage = round((float(score) / float(max_score)) * 100.0, 2) if max_score else 0.0
    letter = calculate_letter_grade(percentage)

    # Sync StudentResult so Student dashboard grades view reflects the grade immediately
    StudentResult.objects.update_or_create(
        student=submission.student,
        course=submission.assignment.course,
        assessment_title=submission.assignment.title,
        defaults={
            "score": score,
            "max_score": max_score,
            "grade": letter,
            "remarks": feedback[:255],
        },
    )

    # Update Enrollment average score/grade for this student & course
    enrollment = Enrollment.objects.filter(
        student=submission.student,
        course=submission.assignment.course,
    ).first()
    if enrollment:
        graded_subs = AssignmentSubmission.objects.filter(
            student=submission.student,
            assignment__course=submission.assignment.course,
            status=AssignmentSubmission.StatusChoices.GRADED,
            score__isnull=False,
        ).select_related("assignment")
        if graded_subs.exists():
            pcts = [
                (float(s.score) / float(s.assignment.max_score or 100)) * 100.0
                for s in graded_subs
            ]
            avg_pct = round(sum(pcts) / len(pcts), 2)
            enrollment.score = Decimal(str(avg_pct))
            enrollment.grade = calculate_letter_grade(avg_pct)
            enrollment.save(update_fields=["score", "grade", "updated_at"])

    StudentNotification.objects.create(
        user=submission.student,
        title=f"Assignment Graded: {submission.assignment.title}",
        message=f"You scored {score}/{max_score} ({letter}) in {submission.assignment.course.title}.",
        notification_type=StudentNotification.TypeChoices.GRADE,
    )
    _log_instructor_activity(
        user,
        "grade",
        "Submission Graded",
        f"Graded {get_user_full_name(submission.student)} on {submission.assignment.title} ({score}/{max_score})",
        "/instructor/assignments/",
    )

    return Response(
        {
            "message": "Submission graded successfully.",
            "submission": serialize_submission(submission),
        }
    )


# =========================================================
# 7. ANNOUNCEMENTS (CRUD)
# =========================================================

@api_view(["GET", "POST"])
@permission_classes([IsInstructor])
def instructor_announcements_api(request):
    user = request.user
    courses_qs = Course.objects.filter(instructor=user)
    course_ids = list(courses_qs.values_list("id", flat=True))

    if request.method == "GET":
        qs = Announcement.objects.filter(
            Q(created_by=user) | Q(course_id__in=course_ids)
        ).select_related("course").distinct().order_by("-created_at", "-id")

        all_serialized = [serialize_instructor_announcement(a) for a in qs]
        today = timezone.localdate()
        seven_days_ago = today - timedelta(days=7)
        students_reached = Enrollment.objects.filter(course_id__in=course_ids).values("student_id").distinct().count()

        stats = {
            "total_announcements": len(all_serialized),
            "this_month": sum(
                1 for a in qs
                if a.created_at and a.created_at.year == today.year and a.created_at.month == today.month
            ),
            "students_reached": students_reached,
            "recent_posts": sum(
                1 for a in qs
                if a.created_at and a.created_at.date() >= seven_days_ago
            ),
        }

        search = (request.query_params.get("search") or "").strip().lower()
        category = (request.query_params.get("category") or "all").strip().lower()

        filtered = all_serialized
        if search:
            filtered = [
                a for a in filtered
                if search in a["title"].lower() or search in a["description"].lower()
            ]
        if category and category != "all":
            filtered = [a for a in filtered if a["category"] == category]

        return Response(
            {
                "count": len(filtered),
                "stats": stats,
                "results": filtered,
            }
        )

    title = (request.data.get("title") or "").strip()
    message = (request.data.get("description") or request.data.get("message") or "").strip()
    category = (request.data.get("category") or "general").strip().lower()
    if category not in ("general", "course", "important"):
        category = "general"

    course_ref = request.data.get("course_id") or request.data.get("course")
    course = _resolve_instructor_course(user, course_ref) if course_ref else None
    audience = (request.data.get("audience") or "").strip()
    if not audience:
        audience = f"{course.title} Students" if course else "All Students"

    if not title or not message:
        return Response(
            {"error": "Announcement title and description are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    announcement = Announcement.objects.create(
        title=title,
        message=message,
        category=category,
        audience=audience,
        course=course,
        created_by=user,
        is_active=True,
    )
    _log_instructor_activity(
        user,
        "announcement",
        "Announcement Posted",
        f'Posted "{announcement.title}"',
        "/instructor/announcements/",
    )

    # Notify enrolled students
    target_course_ids = [course.id] if course else course_ids
    student_ids = (
        Enrollment.objects.filter(course_id__in=target_course_ids)
        .values_list("student_id", flat=True)
        .distinct()
    )
    StudentNotification.objects.bulk_create(
        [
            StudentNotification(
                user_id=sid,
                title=f"Announcement: {announcement.title}",
                message=announcement.message[:240],
                notification_type=StudentNotification.TypeChoices.ANNOUNCEMENT,
            )
            for sid in student_ids
        ]
    )

    return Response(
        {
            "message": "Announcement created successfully.",
            "announcement": serialize_instructor_announcement(announcement),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET", "PATCH", "PUT", "DELETE"])
@permission_classes([IsInstructor])
def instructor_announcement_detail_api(request, announcement_id):
    user = request.user
    course_ids = list(Course.objects.filter(instructor=user).values_list("id", flat=True))
    announcement = Announcement.objects.filter(
        Q(created_by=user) | Q(course_id__in=course_ids),
        id=announcement_id,
    ).first()
    if not announcement:
        return Response({"error": "Announcement not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response(serialize_instructor_announcement(announcement))

    if request.method in ("PATCH", "PUT"):
        if "title" in request.data and str(request.data.get("title") or "").strip():
            announcement.title = str(request.data["title"]).strip()
        if "description" in request.data or "message" in request.data:
            msg = str(request.data.get("description", request.data.get("message", "")) or "").strip()
            if msg:
                announcement.message = msg
        if "category" in request.data:
            cat = str(request.data["category"] or "general").strip().lower()
            if cat in ("general", "course", "important"):
                announcement.category = cat
        if "audience" in request.data and str(request.data.get("audience") or "").strip():
            announcement.audience = str(request.data["audience"]).strip()
        announcement.save()
        _log_instructor_activity(
            user,
            "edit",
            "Announcement Updated",
            f'Updated "{announcement.title}"',
            "/instructor/announcements/",
        )
        return Response(
            {
                "message": "Announcement updated successfully.",
                "announcement": serialize_instructor_announcement(announcement),
            }
        )

    title = announcement.title
    announcement.delete()
    _log_instructor_activity(
        user,
        "delete",
        "Announcement Deleted",
        f'Deleted "{title}"',
        "/instructor/announcements/",
    )
    return Response({"message": f'Announcement "{title}" deleted successfully.'})


# =========================================================
# 8. NOTIFICATIONS & ACTIVITIES
# =========================================================

@api_view(["GET"])
@permission_classes([IsInstructor])
def instructor_notifications_api(request):
    qs = StudentNotification.objects.filter(user=request.user).order_by("-created_at", "-id")
    unread_count = qs.filter(is_read=False).count()
    return Response(
        {
            "count": qs.count(),
            "unread_count": unread_count,
            "results": [serialize_instructor_notification(n) for n in qs[:30]],
        }
    )


@api_view(["POST"])
@permission_classes([IsInstructor])
def instructor_mark_all_notifications_read_api(request):
    StudentNotification.objects.filter(user=request.user, is_read=False).update(is_read=True)
    return Response({"message": "All notifications marked as read.", "unread_count": 0})


@api_view(["POST"])
@permission_classes([IsInstructor])
def instructor_mark_notification_read_api(request, notification_id):
    notif = StudentNotification.objects.filter(id=notification_id, user=request.user).first()
    if not notif:
        return Response({"error": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)
    notif.is_read = True
    notif.save(update_fields=["is_read"])
    unread_count = StudentNotification.objects.filter(user=request.user, is_read=False).count()
    return Response({"message": "Notification marked as read.", "unread_count": unread_count})


@api_view(["GET"])
@permission_classes([IsInstructor])
def instructor_activities_api(request):
    qs = InstructorActivity.objects.filter(instructor=request.user).order_by("-created_at", "-id")
    return Response(
        {
            "count": qs.count(),
            "results": [serialize_instructor_activity(a) for a in qs[:50]],
        }
    )


@api_view(["DELETE"])
@permission_classes([IsInstructor])
def instructor_activity_detail_api(request, activity_id):
    activity = InstructorActivity.objects.filter(id=activity_id, instructor=request.user).first()
    if not activity:
        return Response({"error": "Activity not found."}, status=status.HTTP_404_NOT_FOUND)
    activity.delete()
    return Response({"message": "Activity removed."})

