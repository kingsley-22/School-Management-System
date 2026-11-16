from django.urls import path

from .views import (
    MarkAllNotificationsReadView,
    MarkNotificationReadView,
    StudentAnnouncementListView,
    StudentAssignmentDetailView,
    StudentAssignmentListView,
    StudentAssignmentSubmitView,
    StudentAttendanceView,
    StudentCourseDetailView,
    StudentCourseListView,
    StudentDashboardView,
    StudentDeadlinesView,
    StudentGradesView,
    StudentNotificationListView,
    StudentPaymentSummaryView,
    StudentProfileView,
    StudentSubmissionListView,
)

app_name = "students"

urlpatterns = [
    path("dashboard/", StudentDashboardView.as_view(), name="student-dashboard"),
    path("profile/", StudentProfileView.as_view(), name="student-profile-detail"),
    path("courses/", StudentCourseListView.as_view(), name="student-courses"),
    path("courses/<int:course_id>/", StudentCourseDetailView.as_view(), name="student-course-detail"),
    path("assignments/", StudentAssignmentListView.as_view(), name="student-assignments"),
    path("assignments/<int:assignment_id>/", StudentAssignmentDetailView.as_view(), name="student-assignment-detail"),
    path("assignments/<int:assignment_id>/submit/", StudentAssignmentSubmitView.as_view(), name="student-assignment-submit"),
    path("submissions/", StudentSubmissionListView.as_view(), name="student-submissions"),
    path("grades/", StudentGradesView.as_view(), name="student-grades"),
    path("results/", StudentGradesView.as_view(), name="student-results"),
    path("attendance/", StudentAttendanceView.as_view(), name="student-attendance"),
    path("deadlines/", StudentDeadlinesView.as_view(), name="student-deadlines"),
    path("announcements/", StudentAnnouncementListView.as_view(), name="student-announcements"),
    path("notifications/", StudentNotificationListView.as_view(), name="student-notifications"),
    path("notifications/<int:notification_id>/read/", MarkNotificationReadView.as_view(), name="student-notification-read"),
    path("notifications/mark-all-read/", MarkAllNotificationsReadView.as_view(), name="student-notifications-mark-all-read"),
    path("payments/", StudentPaymentSummaryView.as_view(), name="student-payments"),
]

