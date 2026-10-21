from django.urls import path
from .api_views import (register, verify_email, login, my_profile,approve_instructor, list_users, forgot_password, reset_password,student_profile,
                        create_staff_user, instructor_profile, admin_profile, user_management)
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', register, name='register'),
    path('verify-email/<uid>/<token>/', verify_email, name='verify_email'),
    path('login/', login, name='login'),
    path('my-profile/', my_profile, name='my-profile'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('admin/approve-instructor/<int:user_id>/', approve_instructor, name='approve-instructor'),
    path('admin/users/', list_users, name='list-users'),
    path('forgot-password/', forgot_password, name='forgot-password'),
    path('reset-password/<uid>/<token>/', reset_password, name='reset-password'),
    path('admin/create-user/', create_staff_user, name='create-user'),
    path('student/profile/', student_profile, name='student-profile'),
    path('instructor/profile/', instructor_profile, name='instructor-profile'),
    path('admin/profile/', admin_profile, name='admin-profile'),
    path('admin/users/<int:user_id>/', user_management, name='user-management'),
    
]