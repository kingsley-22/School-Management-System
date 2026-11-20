from django.urls import path

from .api_views import (
    instructor_activities_api,
    instructor_activity_detail_api,
    instructor_announcement_detail_api,
    instructor_announcements_api,
    instructor_assignment_detail_api,
    instructor_assignment_submissions_api,
    instructor_assignments_api,
    instructor_class_detail_api,
    instructor_classes_api,
    instructor_course_detail_api,
    instructor_courses_api,
    instructor_dashboard_api,
    instructor_grade_submission_api,
    instructor_mark_all_notifications_read_api,
    instructor_mark_notification_read_api,
    instructor_notifications_api,
    instructor_profile_api,
    instructor_student_detail_api,
    instructor_students_api,
)

app_name = "instructors_api"

urlpatterns = [
    path("profile/", instructor_profile_api, name="instructor-profile-api"),
    path("dashboard/", instructor_dashboard_api, name="instructor-dashboard-api"),
    path("courses/", instructor_courses_api, name="instructor-courses-api"),
    path("courses/<int:course_id>/", instructor_course_detail_api, name="instructor-course-detail-api"),
    path("classes/", instructor_classes_api, name="instructor-classes-api"),
    path("classes/<int:class_id>/", instructor_class_detail_api, name="instructor-class-detail-api"),
    path("students/", instructor_students_api, name="instructor-students-api"),
    path("students/<int:student_id>/", instructor_student_detail_api, name="instructor-student-detail-api"),
    path("assignments/", instructor_assignments_api, name="instructor-assignments-api"),
    path("assignments/<int:assignment_id>/", instructor_assignment_detail_api, name="instructor-assignment-detail-api"),
    path("assignments/<int:assignment_id>/submissions/", instructor_assignment_submissions_api, name="instructor-assignment-submissions-api"),
    path("submissions/<int:submission_id>/grade/", instructor_grade_submission_api, name="instructor-grade-submission-api"),
    path("announcements/", instructor_announcements_api, name="instructor-announcements-api"),
    path("announcements/<int:announcement_id>/", instructor_announcement_detail_api, name="instructor-announcement-detail-api"),
    path("notifications/", instructor_notifications_api, name="instructor-notifications-api"),
    path("notifications/mark-all-read/", instructor_mark_all_notifications_read_api, name="instructor-notifications-mark-all-read"),
    path("notifications/<int:notification_id>/read/", instructor_mark_notification_read_api, name="instructor-notification-read"),
    path("activities/", instructor_activities_api, name="instructor-activities-api"),
    path("activities/<int:activity_id>/", instructor_activity_detail_api, name="instructor-activity-detail-api"),
]

