from decimal import Decimal
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers

from accounts.models import InstructorProfile
from students.models import (
    Announcement,
    Assignment,
    AssignmentSubmission,
    Course,
    Enrollment,
    StudentNotification,
    StudentProfile,
    calculate_letter_grade,
)
from .models import ClassSchedule, InstructorActivity

User = get_user_model()


def get_user_full_name(user):
    full_name = f"{user.first_name} {user.last_name}".strip()
    return full_name or user.email


def get_user_initials(user):
    first = (user.first_name or "").strip()
    last = (user.last_name or "").strip()
    if first and last:
        return f"{first[0]}{last[0]}".upper()
    name = get_user_full_name(user)
    parts = [p for p in name.replace("@", " ").split() if p]
    if len(parts) >= 2:
        return f"{parts[0][0]}{parts[1][0]}".upper()
    return (name[:2] or "IN").upper()


def serialize_instructor_profile(user):
    profile = InstructorProfile.get_or_create_for_user(user)
    full_name = get_user_full_name(user)
    assigned_courses = list(
        Course.objects.filter(instructor=user).values("id", "code", "title", "category", "is_active")
    )
    return {
        "id": user.id,
        "instructor_id": profile.instructor_id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "full_name": full_name,
        "name": full_name,
        "initials": get_user_initials(user),
        "username": profile.username or user.email.split("@")[0],
        "email": user.email,
        "phone": profile.phone,
        "department": profile.department,
        "specialization": profile.specialization,
        "role": user.role,
        "is_verified": user.is_verified,
        "is_approved": user.is_approved,
        "is_active": user.is_active,
        "courses": assigned_courses,
        "courses_count": len(assigned_courses),
    }


def serialize_instructor_course(course):
    enrollments = list(Enrollment.objects.filter(course=course))
    students_count = len(enrollments)
    avg_progress = (
        round(sum(e.progress for e in enrollments) / students_count)
        if students_count
        else 0
    )
    schedules = list(ClassSchedule.objects.filter(course=course))
    classes_held = sum(1 for s in schedules if s.is_past)
    classes_scheduled = sum(1 for s in schedules if not s.is_past)
    return {
        "id": course.id,
        "code": course.code,
        "title": course.title,
        "short_title": course.short_title or course.title[:30],
        "description": course.description,
        "category": course.category or "other",
        "level": course.level,
        "hours": course.hours,
        "lessons_count": course.total_lessons,
        "total_lessons": course.total_lessons,
        "status": "Active" if course.is_active else "Draft",
        "is_active": course.is_active,
        "students_count": students_count,
        "progress_percent": avg_progress,
        "classes_held": classes_held,
        "classes_scheduled": classes_scheduled,
        "instructor_id": course.instructor_id,
        "instructor_name": course.get_instructor_display(),
        "created_at": course.created_at.isoformat() if course.created_at else None,
        "updated_at": course.updated_at.isoformat() if course.updated_at else None,
    }


class InstructorCourseWriteSerializer(serializers.ModelSerializer):
    lessons = serializers.IntegerField(required=False, min_value=0, write_only=True)
    lessons_count = serializers.IntegerField(required=False, min_value=0, write_only=True)
    status = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = Course
        fields = [
            "title",
            "code",
            "description",
            "category",
            "level",
            "hours",
            "total_lessons",
            "lessons",
            "lessons_count",
            "is_active",
            "status",
        ]
        extra_kwargs = {
            "code": {"required": False, "allow_blank": True},
            "description": {"required": False, "allow_blank": True},
            "category": {"required": False, "allow_blank": True},
            "level": {"required": False, "allow_blank": True},
            "hours": {"required": False},
            "total_lessons": {"required": False},
            "is_active": {"required": False},
        }

    def validate(self, attrs):
        lessons = attrs.pop("lessons", None)
        lessons_count = attrs.pop("lessons_count", None)
        if lessons is not None:
            attrs["total_lessons"] = lessons
        elif lessons_count is not None:
            attrs["total_lessons"] = lessons_count

        status_val = attrs.pop("status", None)
        if status_val is not None and status_val.strip():
            attrs["is_active"] = status_val.strip().lower() == "active"

        return attrs


def serialize_class_schedule(schedule):
    return {
        "id": schedule.id,
        "course_id": schedule.course_id,
        "course": schedule.course.title if schedule.course else schedule.subject,
        "subject": schedule.subject or (schedule.course.title if schedule.course else ""),
        "date": schedule.date.isoformat(),
        "time": schedule.start_time.strftime("%H:%M"),
        "start_time": schedule.start_time.strftime("%H:%M"),
        "end_time": schedule.end_time.strftime("%H:%M") if schedule.end_time else "",
        "room": schedule.room,
        "students": schedule.students,
        "is_past": schedule.is_past,
        "created_at": schedule.created_at.isoformat() if schedule.created_at else None,
    }


def serialize_instructor_student_enrollment(enrollment):
    student = enrollment.student
    profile = StudentProfile.get_or_create_for_user(student)
    full_name = get_user_full_name(student)
    status_label = "Active" if (student.is_active and enrollment.status != Enrollment.StatusChoices.DROPPED and profile.status == StudentProfile.StatusChoices.ACTIVE) else "Inactive"
    return {
        "id": student.id,
        "enrollment_id": enrollment.id,
        "student_id": profile.student_id,
        "full_name": full_name,
        "name": full_name,
        "initials": get_user_initials(student),
        "email": student.email,
        "phone": profile.phone,
        "course_id": enrollment.course_id,
        "course": enrollment.course.title,
        "course_code": enrollment.course.code,
        "course_category": enrollment.course.category,
        "progress": enrollment.progress,
        "score": float(enrollment.score) if enrollment.score is not None else None,
        "grade": enrollment.grade or calculate_letter_grade(enrollment.score if enrollment.score is not None else enrollment.progress),
        "enrollment_status": enrollment.status,
        "status": status_label,
        "enrolled_at": enrollment.enrolled_at.isoformat() if enrollment.enrolled_at else None,
    }


def serialize_instructor_assignment(assignment):
    total_students = Enrollment.objects.filter(course=assignment.course).count()
    submissions_qs = AssignmentSubmission.objects.filter(assignment=assignment)
    submissions_count = submissions_qs.count()
    graded_count = submissions_qs.filter(status=AssignmentSubmission.StatusChoices.GRADED).count()
    today = timezone.localdate()
    is_completed = (not assignment.is_active) or (assignment.due_date < today) or (total_students > 0 and submissions_count >= total_students)
    return {
        "id": assignment.id,
        "assignment_code": f"AS{assignment.id:03d}",
        "title": assignment.title,
        "description": assignment.description,
        "course_id": assignment.course_id,
        "course": assignment.course.title,
        "course_title": assignment.course.title,
        "course_code": assignment.course.code,
        "course_category": assignment.course.category,
        "due_date": assignment.due_date.isoformat(),
        "max_score": assignment.max_score,
        "submissions_count": submissions_count,
        "graded_count": graded_count,
        "total_students": total_students,
        "is_active": assignment.is_active,
        "status": "Completed" if is_completed else "Active",
        "created_at": assignment.created_at.isoformat() if assignment.created_at else None,
    }


def serialize_submission(submission):
    student = submission.student
    profile = StudentProfile.get_or_create_for_user(student)
    return {
        "id": submission.id,
        "assignment_id": submission.assignment_id,
        "assignment_title": submission.assignment.title,
        "max_score": submission.assignment.max_score,
        "student_id": student.id,
        "student_code": profile.student_id,
        "student_name": get_user_full_name(student),
        "student_email": student.email,
        "submission_text": submission.submission_text,
        "submission_url": submission.submission_url,
        "status": submission.status,
        "score": float(submission.score) if submission.score is not None else None,
        "feedback": submission.feedback,
        "submitted_at": submission.submitted_at.isoformat() if submission.submitted_at else None,
        "graded_at": submission.graded_at.isoformat() if submission.graded_at else None,
    }


def serialize_instructor_announcement(announcement):
    return {
        "id": announcement.id,
        "title": announcement.title,
        "description": announcement.message,
        "message": announcement.message,
        "category": (announcement.category or "general").lower(),
        "audience": announcement.audience or (f"{announcement.course.title} Students" if announcement.course else "All Students"),
        "course_id": announcement.course_id,
        "course_title": announcement.course.title if announcement.course else "",
        "publish_date": announcement.publish_date.isoformat() if announcement.publish_date else None,
        "iso_date": (announcement.created_at.date().isoformat() if announcement.created_at else timezone.localdate().isoformat()),
        "created_at": announcement.created_at.isoformat() if announcement.created_at else None,
        "updated_at": announcement.updated_at.isoformat() if announcement.updated_at else None,
    }


def serialize_instructor_notification(notification):
    return {
        "id": notification.id,
        "title": notification.title,
        "message": notification.message,
        "notification_type": notification.notification_type,
        "is_read": notification.is_read,
        "created_at": notification.created_at.isoformat() if notification.created_at else None,
    }


def serialize_instructor_activity(activity):
    return {
        "id": activity.id,
        "type": activity.activity_type,
        "activity_type": activity.activity_type,
        "title": activity.title,
        "description": activity.description,
        "link": activity.link,
        "timestamp": activity.created_at.isoformat() if activity.created_at else None,
    }

