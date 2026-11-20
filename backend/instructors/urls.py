from django.urls import path
from .views import (
    instructor_dashboard,
    instructor_students,
    instructor_announcements,
    instructor_assignments,
    instructor_courses,

    )


urlpatterns = [
    path('', instructor_dashboard, name='instructor_dashboard'),
    path('courses/', instructor_courses, name='instructor_courses'),
    path('students/', instructor_students, name='instructor_students'),
    path('announcements/', instructor_announcements, name='instructor_announcements'),
    path('assignments/', instructor_assignments, name='instructor_assignments'),
]