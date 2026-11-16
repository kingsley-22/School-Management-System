from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .api_views import (
    admin_announcement_detail,
    admin_announcements,
    admin_assign_course,
    admin_course_detail,
    admin_courses,
    admin_dashboard,
    admin_instructor_detail,
    admin_instructors,
    admin_profile,
    admin_student_detail,
    admin_students,
    admin_unassign_course,
    approve_instructor,
    approve_student,
    create_staff_user,
    forgot_password,
    instructor_profile,
    list_users,
    login,
    my_profile,
    register,
    reset_password,
    student_profile,
    user_management,
    verify_email,
)

urlpatterns = [
    path('register/', register, name='register'),
    path('verify-email/<uid>/<token>/', verify_email, name='verify_email'),
    path('login/', login, name='login'),
    path('my-profile/', my_profile, name='my-profile'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('forgot-password/', forgot_password, name='forgot-password'),
    path('reset-password/<uid>/<token>/', reset_password, name='reset-password'),
    path('student/profile/', student_profile, name='student-profile'),
    path('instructor/profile/', instructor_profile, name='instructor-profile'),

    # Admin API routes
    path('admin/dashboard/', admin_dashboard, name='admin-dashboard'),
    path('admin/profile/', admin_profile, name='admin-profile'),
    path('admin/users/', list_users, name='list-users'),
    path('admin/users/<int:user_id>/', user_management, name='user-management'),
    path('admin/create-user/', create_staff_user, name='create-user'),
    path('admin/approve-instructor/<str:user_id>/', approve_instructor, name='approve-instructor'),

    # Admin student management & course assignment
    path('admin/students/', admin_students, name='admin-students'),
    path('admin/students/<str:student_identifier>/', admin_student_detail, name='admin-student-detail'),
    path('admin/students/<str:student_identifier>/approve/', approve_student, name='admin-approve-student'),
    path('admin/students/<str:student_identifier>/assign-course/', admin_assign_course, name='admin-student-assign-course'),
    path('admin/students/<str:student_identifier>/unassign-course/<int:course_id>/', admin_unassign_course, name='admin-student-unassign-course'),
    path('admin/assign-course/', admin_assign_course, name='admin-assign-course'),

    # Admin instructor management
    path('admin/instructors/', admin_instructors, name='admin-instructors'),
    path('admin/instructors/<str:instructor_identifier>/', admin_instructor_detail, name='admin-instructor-detail'),

    # Admin course management
    path('admin/courses/', admin_courses, name='admin-courses'),
    path('admin/courses/<int:course_id>/', admin_course_detail, name='admin-course-detail'),

    # Admin announcement management
    path('admin/announcements/', admin_announcements, name='admin-announcements'),
    path('admin/announcements/<int:announcement_id>/', admin_announcement_detail, name='admin-announcement-detail'),
]
