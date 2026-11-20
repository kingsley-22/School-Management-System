from decimal import Decimal
from django.db.models import Avg, Q, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Announcement,
    Assignment,
    AssignmentSubmission,
    Attendance,
    Course,
    Enrollment,
    StudentNotification,
    StudentPayment,
    StudentProfile,
    StudentResult,
    calculate_letter_grade,
)
from .permissions import IsStudent
from .serializers import (
    AnnouncementSerializer,
    AssignmentSubmissionSerializer,
    AttendanceSerializer,
    CourseSerializer,
    EnrolledCourseSerializer,
    StudentAssignmentSerializer,
    StudentNotificationSerializer,
    StudentPaymentSerializer,
    StudentProfileSerializer,
    StudentResultSerializer,
    format_naira,
)


def get_time_greeting():
    hour = timezone.localtime().hour
    if hour < 12:
        return "Good morning"
    if hour < 17:
        return "Good afternoon"
    return "Good evening"


def build_attendance_summary(student):
    qs = Attendance.objects.filter(student=student)
    total = qs.count()
    present = qs.filter(status=Attendance.StatusChoices.PRESENT).count()
    absent = qs.filter(status=Attendance.StatusChoices.ABSENT).count()
    late = qs.filter(status=Attendance.StatusChoices.LATE).count()
    excused = qs.filter(status=Attendance.StatusChoices.EXCUSED).count()
    attended = present + late + excused
    rate = round((attended / total) * 100.0, 1) if total > 0 else 0.0
    return {
        "total_classes": total,
        "present_count": present,
        "absent_count": absent,
        "late_count": late,
        "excused_count": excused,
        "attendance_rate": rate,
    }


def build_payment_summary(student, profile):
    paid_agg = StudentPayment.objects.filter(
        student=student,
        status=StudentPayment.StatusChoices.PAID,
    ).aggregate(total_paid=Sum("amount"))
    amount_paid = paid_agg["total_paid"] or Decimal("0.00")
    outstanding = profile.outstanding_balance or Decimal("0.00")
    total_fees = profile.total_fees if profile.total_fees > 0 else (amount_paid + outstanding)
    return {
        "current_balance": float(outstanding),
        "outstanding_balance": float(outstanding),
        "total_fees": float(total_fees),
        "amount_paid": float(amount_paid),
        "currency": "NGN",
        "currency_symbol": "₦",
        "formatted_balance": format_naira(outstanding),
    }


class StudentDashboardView(APIView):
    """
    GET /api/students/dashboard/
    Returns the complete Student Dashboard payload for the authenticated student.
    """

    permission_classes = [IsStudent]

    def get(self, request):
        student = request.user
        profile = StudentProfile.get_or_create_for_user(student)

        enrollments = (
            Enrollment.objects.filter(student=student)
            .exclude(status=Enrollment.StatusChoices.DROPPED)
            .select_related("course", "course__instructor")
        )
        enrolled_course_ids = list(enrollments.values_list("course_id", flat=True))

        enrolled_courses_count = len(enrolled_course_ids)
        avg_progress_val = enrollments.aggregate(avg_prog=Avg("progress"))["avg_prog"]
        overall_progress = int(round(avg_progress_val)) if avg_progress_val is not None else 0

        assignments_qs = (
            Assignment.objects.filter(course_id__in=enrolled_course_ids, is_active=True)
            .select_related("course")
            .order_by("due_date", "id")
        )
        submissions = AssignmentSubmission.objects.filter(
            student=student,
            assignment__in=assignments_qs,
        ).select_related("assignment", "assignment__course")
        submissions_map = {sub.assignment_id: sub for sub in submissions}

        total_assignments_count = assignments_qs.count()
        submitted_assignment_ids = {
            sub_id
            for sub_id, sub in submissions_map.items()
            if sub.status != AssignmentSubmission.StatusChoices.PENDING
        }
        submitted_assignments_count = len(submitted_assignment_ids)
        assignments_due_count = max(0, total_assignments_count - submitted_assignments_count)

        recent_assignments_data = StudentAssignmentSerializer(
            assignments_qs[:5],
            many=True,
            context={"request": request, "submissions_map": submissions_map},
        ).data

        pending_assignments = [
            a for a in assignments_qs if a.id not in submitted_assignment_ids
        ][:5]
        upcoming_deadlines = [
            {
                "id": a.id,
                "title": a.title,
                "course_id": a.course_id,
                "course_title": a.course.title,
                "due_date": a.due_date.isoformat(),
                "due_date_display": a.due_date.strftime("%b %d"),
                "dot_color": a.dot_color or "green-dot",
                "status": "pending",
            }
            for a in pending_assignments
        ]

        courses_data = EnrolledCourseSerializer(enrollments, many=True).data
        skill_list = [
            {
                "course_id": e.course_id,
                "title": e.course.title,
                "short_title": e.course.short_title or e.course.title,
                "progress": e.progress,
                "score": float(e.score) if e.score is not None else None,
                "grade": e.grade,
            }
            for e in enrollments
        ]

        announcements_qs = Announcement.objects.filter(
            is_active=True
        ).filter(
            Q(course__isnull=True) | Q(course_id__in=enrolled_course_ids)
        ).select_related("course")[:5]
        announcements_data = AnnouncementSerializer(announcements_qs, many=True).data
        latest_announcement = announcements_data[0] if announcements_data else None

        notifications_qs = StudentNotification.objects.filter(user=student)
        unread_notifications_count = notifications_qs.filter(is_read=False).count()
        notifications_data = StudentNotificationSerializer(notifications_qs[:10], many=True).data

        attendance_summary = build_attendance_summary(student)
        payment_summary = build_payment_summary(student, profile)
        profile_data = StudentProfileSerializer(profile).data

        return Response(
            {
                "greeting": get_time_greeting(),
                "profile": profile_data,
                "stats": {
                    "enrolled_courses_count": enrolled_courses_count,
                    "assignments_due_count": assignments_due_count,
                    "pending_assignments_count": assignments_due_count,
                    "total_assignments_count": total_assignments_count,
                    "submitted_assignments_count": submitted_assignments_count,
                    "overall_progress": overall_progress,
                    "outstanding_balance": payment_summary["outstanding_balance"],
                    "formatted_balance": payment_summary["formatted_balance"],
                    "attendance_rate": attendance_summary["attendance_rate"],
                    "unread_notifications_count": unread_notifications_count,
                },
                "courses": courses_data,
                "progress_overview": {
                    "overall_progress": overall_progress,
                    "courses": skill_list,
                },
                "recent_assignments": recent_assignments_data,
                "upcoming_deadlines": upcoming_deadlines,
                "payment_summary": payment_summary,
                "latest_announcement": latest_announcement,
                "announcements": announcements_data,
                "notifications": {
                    "unread_count": unread_notifications_count,
                    "results": notifications_data,
                },
                "attendance_summary": attendance_summary,
            }
        )


class StudentProfileView(APIView):
    """
    GET, PUT, PATCH /api/students/profile/
    View or update the authenticated student's profile.
    """

    permission_classes = [IsStudent]

    def get(self, request):
        profile = StudentProfile.get_or_create_for_user(request.user)
        data = StudentProfileSerializer(profile).data
        return Response({**data, "profile": data})

    def put(self, request):
        return self._update(request, partial=False)

    def patch(self, request):
        return self._update(request, partial=True)

    def _update(self, request, partial=True):
        profile = StudentProfile.get_or_create_for_user(request.user)
        serializer = StudentProfileSerializer(profile, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            data = serializer.data
            return Response(
                {
                    "message": "Profile updated successfully.",
                    **data,
                    "profile": data,
                }
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StudentCourseListView(APIView):
    """
    GET /api/students/courses/ -> List enrolled courses (or available courses if ?available=true)
    POST /api/students/courses/ -> Enroll the authenticated student in a course
    """

    permission_classes = [IsStudent]

    def get(self, request):
        search = (request.query_params.get("search") or "").strip()
        status_filter = (request.query_params.get("status") or "").strip().upper()
        available = (request.query_params.get("available") or "").strip().lower() == "true"

        if available:
            courses_qs = Course.objects.filter(is_active=True)
            if search:
                courses_qs = courses_qs.filter(
                    Q(title__icontains=search)
                    | Q(category__icontains=search)
                    | Q(description__icontains=search)
                    | Q(code__icontains=search)
                )
            data = CourseSerializer(courses_qs, many=True).data
            return Response({"count": len(data), "results": data})

        enrollments = Enrollment.objects.filter(student=request.user).select_related(
            "course", "course__instructor"
        )
        if status_filter in dict(Enrollment.StatusChoices.choices):
            enrollments = enrollments.filter(status=status_filter)
        else:
            enrollments = enrollments.exclude(status=Enrollment.StatusChoices.DROPPED)

        if search:
            enrollments = enrollments.filter(
                Q(course__title__icontains=search)
                | Q(course__category__icontains=search)
                | Q(course__description__icontains=search)
                | Q(course__code__icontains=search)
            )

        data = EnrolledCourseSerializer(enrollments, many=True).data
        return Response({"count": len(data), "results": data})

    def post(self, request):
        course_id = request.data.get("course_id") or request.data.get("course")
        if not course_id:
            return Response(
                {"error": "course_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        course = get_object_or_404(Course, pk=course_id, is_active=True)
        enrollment, created = Enrollment.objects.get_or_create(
            student=request.user,
            course=course,
            defaults={"status": Enrollment.StatusChoices.ACTIVE, "progress": 0},
        )
        if not created and enrollment.status == Enrollment.StatusChoices.DROPPED:
            enrollment.status = Enrollment.StatusChoices.ACTIVE
            enrollment.save(update_fields=["status", "updated_at"])
            created = True

        data = EnrolledCourseSerializer(enrollment).data
        return Response(
            {
                "message": "Enrolled in course successfully." if created else "Already enrolled in this course.",
                "course": data,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class StudentCourseDetailView(APIView):
    """
    GET, PATCH /api/students/courses/<int:course_id>/
    View details or update lesson progress for an enrolled course.
    """

    permission_classes = [IsStudent]

    def get(self, request, course_id):
        enrollment = get_object_or_404(
            Enrollment.objects.select_related("course", "course__instructor"),
            student=request.user,
            course_id=course_id,
        )
        course_data = EnrolledCourseSerializer(enrollment).data
        assignments = Assignment.objects.filter(course_id=course_id, is_active=True)
        submissions_map = {
            s.assignment_id: s
            for s in AssignmentSubmission.objects.filter(
                student=request.user, assignment__in=assignments
            )
        }
        course_data["assignments"] = StudentAssignmentSerializer(
            assignments,
            many=True,
            context={"request": request, "submissions_map": submissions_map},
        ).data
        return Response(course_data)

    def patch(self, request, course_id):
        enrollment = get_object_or_404(
            Enrollment.objects.select_related("course"),
            student=request.user,
            course_id=course_id,
        )
        if "progress" in request.data:
            try:
                prog = int(request.data["progress"])
            except (ValueError, TypeError):
                return Response(
                    {"error": "progress must be an integer between 0 and 100."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if prog < 0 or prog > 100:
                return Response(
                    {"error": "progress must be between 0 and 100."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            enrollment.progress = prog

        if "completed_lessons" in request.data:
            try:
                completed = int(request.data["completed_lessons"])
            except (ValueError, TypeError):
                return Response(
                    {"error": "completed_lessons must be a non-negative integer."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if completed < 0:
                return Response(
                    {"error": "completed_lessons cannot be negative."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            enrollment.completed_lessons = min(completed, enrollment.course.total_lessons)
            if "progress" not in request.data and enrollment.course.total_lessons > 0:
                enrollment.progress = int(
                    round((enrollment.completed_lessons / enrollment.course.total_lessons) * 100)
                )

        enrollment.save()
        return Response(
            {
                "message": "Course progress updated successfully.",
                "course": EnrolledCourseSerializer(enrollment).data,
            }
        )


class StudentAssignmentListView(APIView):
    """
    GET /api/students/assignments/
    List assignments for the authenticated student's enrolled courses.
    """

    permission_classes = [IsStudent]

    def get(self, request):
        enrolled_course_ids = list(
            Enrollment.objects.filter(student=request.user)
            .exclude(status=Enrollment.StatusChoices.DROPPED)
            .values_list("course_id", flat=True)
        )
        assignments_qs = (
            Assignment.objects.filter(course_id__in=enrolled_course_ids, is_active=True)
            .select_related("course")
            .order_by("due_date", "id")
        )

        course_filter = (request.query_params.get("course") or "").strip()
        if course_filter:
            if course_filter.isdigit():
                assignments_qs = assignments_qs.filter(course_id=int(course_filter))
            else:
                assignments_qs = assignments_qs.filter(
                    Q(course__title__icontains=course_filter)
                    | Q(course__category__icontains=course_filter)
                    | Q(course__code__icontains=course_filter)
                )

        search = (request.query_params.get("search") or "").strip()
        if search:
            assignments_qs = assignments_qs.filter(
                Q(title__icontains=search)
                | Q(description__icontains=search)
                | Q(course__title__icontains=search)
                | Q(course__category__icontains=search)
            )

        submissions_map = {
            sub.assignment_id: sub
            for sub in AssignmentSubmission.objects.filter(
                student=request.user,
                assignment__in=assignments_qs,
            ).select_related("assignment", "assignment__course")
        }

        serialized = StudentAssignmentSerializer(
            assignments_qs,
            many=True,
            context={"request": request, "submissions_map": submissions_map},
        ).data

        status_filter = (request.query_params.get("status") or "").strip().lower()
        if status_filter:
            serialized = [item for item in serialized if item["status"] == status_filter]

        pending_count = sum(1 for item in serialized if item["status"] == "pending")
        submitted_count = sum(1 for item in serialized if item["status"] != "pending")

        return Response(
            {
                "count": len(serialized),
                "pending_count": pending_count,
                "submitted_count": submitted_count,
                "results": serialized,
            }
        )


class StudentAssignmentDetailView(APIView):
    """
    GET /api/students/assignments/<int:assignment_id>/
    Retrieve details of an assignment for an enrolled course.
    """

    permission_classes = [IsStudent]

    def get(self, request, assignment_id):
        enrolled_course_ids = Enrollment.objects.filter(student=request.user).exclude(
            status=Enrollment.StatusChoices.DROPPED
        ).values_list("course_id", flat=True)
        assignment = get_object_or_404(
            Assignment.objects.select_related("course"),
            pk=assignment_id,
            course_id__in=enrolled_course_ids,
            is_active=True,
        )
        data = StudentAssignmentSerializer(
            assignment,
            context={"request": request},
        ).data
        return Response(data)


class StudentAssignmentSubmitView(APIView):
    """
    POST, PUT, PATCH /api/students/assignments/<int:assignment_id>/submit/
    Submit or update an assignment submission for the authenticated student.
    """

    permission_classes = [IsStudent]

    def post(self, request, assignment_id):
        return self._submit(request, assignment_id)

    def put(self, request, assignment_id):
        return self._submit(request, assignment_id)

    def patch(self, request, assignment_id):
        return self._submit(request, assignment_id)

    def _submit(self, request, assignment_id):
        enrolled_course_ids = Enrollment.objects.filter(student=request.user).exclude(
            status=Enrollment.StatusChoices.DROPPED
        ).values_list("course_id", flat=True)
        assignment = get_object_or_404(
            Assignment.objects.select_related("course"),
            pk=assignment_id,
            course_id__in=enrolled_course_ids,
            is_active=True,
        )

        existing = AssignmentSubmission.objects.filter(
            assignment=assignment,
            student=request.user,
        ).first()

        serializer = AssignmentSubmissionSerializer(
            instance=existing,
            data=request.data,
            partial=bool(existing),
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        today = timezone.localdate()
        sub_status = (
            AssignmentSubmission.StatusChoices.LATE
            if assignment.due_date and today > assignment.due_date
            else AssignmentSubmission.StatusChoices.SUBMITTED
        )
        if existing and existing.status == AssignmentSubmission.StatusChoices.GRADED:
            sub_status = AssignmentSubmission.StatusChoices.GRADED

        submission = serializer.save(
            assignment=assignment,
            student=request.user,
            status=sub_status,
        )
        if assignment.course and assignment.course.instructor_id:
            student_name = f"{request.user.first_name} {request.user.last_name}".strip() or request.user.email
            StudentNotification.objects.create(
                user=assignment.course.instructor,
                title=f"New Submission: {assignment.title}",
                message=f"{student_name} submitted work for {assignment.title} ({assignment.course.title}).",
                notification_type=StudentNotification.TypeChoices.ASSIGNMENT,
            )
        return Response(
            {
                "message": "Assignment submitted successfully.",
                "submission": AssignmentSubmissionSerializer(submission).data,
            },
            status=status.HTTP_200_OK if existing else status.HTTP_201_CREATED,
        )


class StudentSubmissionListView(APIView):
    """
    GET /api/students/submissions/
    List all assignment submissions by the authenticated student.
    """

    permission_classes = [IsStudent]

    def get(self, request):
        submissions = AssignmentSubmission.objects.filter(
            student=request.user
        ).select_related("assignment", "assignment__course")
        data = AssignmentSubmissionSerializer(submissions, many=True).data
        return Response({"count": len(data), "results": data})


class StudentGradesView(APIView):
    """
    GET /api/students/grades/ and GET /api/students/results/
    Returns the student's course progress overview, grades, and assessment results.
    """

    permission_classes = [IsStudent]

    def get(self, request):
        student = request.user
        enrollments = (
            Enrollment.objects.filter(student=student)
            .exclude(status=Enrollment.StatusChoices.DROPPED)
            .select_related("course")
        )

        avg_prog = enrollments.aggregate(avg_prog=Avg("progress"))["avg_prog"]
        overall_progress = int(round(avg_prog)) if avg_prog is not None else 0

        course_progress = [
            {
                "course_id": e.course_id,
                "code": e.course.code,
                "title": e.course.title,
                "short_title": e.course.short_title or e.course.title,
                "category": e.course.category,
                "progress": e.progress,
                "score": float(e.score) if e.score is not None else None,
                "grade": e.grade or calculate_letter_grade(e.score if e.score is not None else e.progress),
            }
            for e in enrollments
        ]

        results_qs = StudentResult.objects.filter(student=student).select_related("course")
        results_data = StudentResultSerializer(results_qs, many=True).data

        graded_submissions = AssignmentSubmission.objects.filter(
            student=student,
            score__isnull=False,
        ).select_related("assignment", "assignment__course")
        graded_assignments_data = AssignmentSubmissionSerializer(
            graded_submissions, many=True
        ).data

        score_values = [item["percentage"] for item in results_data]
        if not score_values:
            score_values = [
                float(e.score) if e.score is not None else float(e.progress)
                for e in enrollments
            ]
        average_score = round(sum(score_values) / len(score_values), 2) if score_values else 0.0
        overall_grade = calculate_letter_grade(average_score) if score_values else ""

        return Response(
            {
                "overall_progress": overall_progress,
                "average_score": average_score,
                "overall_grade": overall_grade,
                "course_progress": course_progress,
                "graded_assignments": graded_assignments_data,
                "count": len(results_data),
                "results": results_data,
            }
        )


class StudentAttendanceView(APIView):
    """
    GET /api/students/attendance/
    Returns the authenticated student's attendance summary and attendance records.
    """

    permission_classes = [IsStudent]

    def get(self, request):
        student = request.user
        records_qs = Attendance.objects.filter(student=student).select_related("course")

        course_id = (request.query_params.get("course") or "").strip()
        if course_id.isdigit():
            records_qs = records_qs.filter(course_id=int(course_id))

        status_filter = (request.query_params.get("status") or "").strip().upper()
        if status_filter in dict(Attendance.StatusChoices.choices):
            records_qs = records_qs.filter(status=status_filter)

        summary = build_attendance_summary(student)
        records_data = AttendanceSerializer(records_qs, many=True).data

        return Response(
            {
                "summary": summary,
                **summary,
                "count": len(records_data),
                "results": records_data,
            }
        )


class StudentDeadlinesView(APIView):
    """
    GET /api/students/deadlines/
    Returns upcoming unsubmitted assignment deadlines for the authenticated student.
    """

    permission_classes = [IsStudent]

    def get(self, request):
        enrolled_course_ids = list(
            Enrollment.objects.filter(student=request.user)
            .exclude(status=Enrollment.StatusChoices.DROPPED)
            .values_list("course_id", flat=True)
        )
        submitted_ids = set(
            AssignmentSubmission.objects.filter(student=request.user)
            .exclude(status=AssignmentSubmission.StatusChoices.PENDING)
            .values_list("assignment_id", flat=True)
        )
        assignments_qs = (
            Assignment.objects.filter(course_id__in=enrolled_course_ids, is_active=True)
            .exclude(id__in=submitted_ids)
            .select_related("course")
            .order_by("due_date", "id")
        )
        results = [
            {
                "id": a.id,
                "title": a.title,
                "course_id": a.course_id,
                "course_title": a.course.title,
                "due_date": a.due_date.isoformat(),
                "due_date_display": a.due_date.strftime("%b %d"),
                "dot_color": a.dot_color or "green-dot",
                "status": "pending",
            }
            for a in assignments_qs
        ]
        return Response({"count": len(results), "results": results})


class StudentAnnouncementListView(APIView):
    """
    GET /api/students/announcements/
    Returns active announcements for the authenticated student.
    """

    permission_classes = [IsStudent]

    def get(self, request):
        enrolled_course_ids = list(
            Enrollment.objects.filter(student=request.user)
            .exclude(status=Enrollment.StatusChoices.DROPPED)
            .values_list("course_id", flat=True)
        )
        qs = (
            Announcement.objects.filter(is_active=True)
            .filter(Q(course__isnull=True) | Q(course_id__in=enrolled_course_ids))
            .select_related("course")
        )

        category = (request.query_params.get("category") or "").strip().lower()
        if category in dict(Announcement.CategoryChoices.choices):
            qs = qs.filter(category=category)

        search = (request.query_params.get("search") or "").strip()
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(message__icontains=search))

        data = AnnouncementSerializer(qs, many=True).data
        return Response(
            {
                "count": len(data),
                "latest": data[0] if data else None,
                "results": data,
            }
        )


class StudentNotificationListView(APIView):
    """
    GET /api/students/notifications/
    Returns notifications belonging to the authenticated student.
    """

    permission_classes = [IsStudent]

    def get(self, request):
        qs = StudentNotification.objects.filter(user=request.user)
        unread_count = qs.filter(is_read=False).count()

        unread_only = (request.query_params.get("unread_only") or "").strip().lower() == "true"
        if unread_only:
            qs = qs.filter(is_read=False)

        data = StudentNotificationSerializer(qs, many=True).data
        return Response(
            {
                "count": len(data),
                "unread_count": unread_count,
                "results": data,
            }
        )


class MarkNotificationReadView(APIView):
    """
    POST, PATCH /api/students/notifications/<int:notification_id>/read/
    Marks a single notification belonging to the authenticated student as read.
    """

    permission_classes = [IsStudent]

    def post(self, request, notification_id):
        return self._mark_read(request, notification_id)

    def patch(self, request, notification_id):
        return self._mark_read(request, notification_id)

    def _mark_read(self, request, notification_id):
        notification = get_object_or_404(
            StudentNotification,
            pk=notification_id,
            user=request.user,
        )
        if not notification.is_read:
            notification.is_read = True
            notification.save(update_fields=["is_read"])

        unread_count = StudentNotification.objects.filter(
            user=request.user, is_read=False
        ).count()
        return Response(
            {
                "message": "Notification marked as read.",
                "unread_count": unread_count,
                "notification": StudentNotificationSerializer(notification).data,
            }
        )


class MarkAllNotificationsReadView(APIView):
    """
    POST, PATCH /api/students/notifications/mark-all-read/
    Marks all notifications belonging to the authenticated student as read.
    """

    permission_classes = [IsStudent]

    def post(self, request):
        return self._mark_all_read(request)

    def patch(self, request):
        return self._mark_all_read(request)

    def _mark_all_read(self, request):
        updated = StudentNotification.objects.filter(
            user=request.user, is_read=False
        ).update(is_read=True)
        return Response(
            {
                "message": "All notifications marked as read.",
                "updated_count": updated,
                "unread_count": 0,
            }
        )


class StudentPaymentSummaryView(APIView):
    """
    GET /api/students/payments/
    Returns the authenticated student's payment summary and payment history.
    """

    permission_classes = [IsStudent]

    def get(self, request):
        profile = StudentProfile.get_or_create_for_user(request.user)
        summary = build_payment_summary(request.user, profile)
        payments = StudentPayment.objects.filter(student=request.user)
        payments_data = StudentPaymentSerializer(payments, many=True).data
        return Response(
            {
                **summary,
                "summary": summary,
                "count": len(payments_data),
                "results": payments_data,
            }
        )
