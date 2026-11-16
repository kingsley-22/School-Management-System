from django.contrib import admin

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
)


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ("student_id", "user", "course", "status", "outstanding_balance", "joined_date")
    search_fields = ("student_id", "user__email", "user__first_name", "user__last_name", "course")
    list_filter = ("status", "course")


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("code", "title", "category", "instructor_name", "total_lessons", "is_active")
    search_fields = ("code", "title", "category")
    list_filter = ("category", "is_active")


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ("student", "course", "progress", "status", "score", "grade", "enrolled_at")
    search_fields = ("student__email", "course__title", "course__code")
    list_filter = ("status", "grade")


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "due_date", "max_score", "is_active")
    search_fields = ("title", "course__title")
    list_filter = ("is_active", "due_date")


@admin.register(AssignmentSubmission)
class AssignmentSubmissionAdmin(admin.ModelAdmin):
    list_display = ("student", "assignment", "status", "score", "submitted_at")
    search_fields = ("student__email", "assignment__title")
    list_filter = ("status",)


@admin.register(StudentResult)
class StudentResultAdmin(admin.ModelAdmin):
    list_display = ("student", "course", "assessment_title", "score", "max_score", "grade", "recorded_at")
    search_fields = ("student__email", "course__title", "assessment_title")
    list_filter = ("grade",)


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ("student", "course", "date", "status", "topic")
    search_fields = ("student__email", "course__title", "topic")
    list_filter = ("status", "date")


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "course", "is_active", "created_at")
    search_fields = ("title", "message")
    list_filter = ("category", "is_active")


@admin.register(StudentNotification)
class StudentNotificationAdmin(admin.ModelAdmin):
    list_display = ("user", "title", "notification_type", "is_read", "created_at")
    search_fields = ("user__email", "title", "message")
    list_filter = ("notification_type", "is_read")


@admin.register(StudentPayment)
class StudentPaymentAdmin(admin.ModelAdmin):
    list_display = ("reference", "student", "amount", "status", "paid_at")
    search_fields = ("reference", "student__email", "description")
    list_filter = ("status",)
