from django.contrib import admin

from .models import ClassSchedule, InstructorActivity


@admin.register(ClassSchedule)
class ClassScheduleAdmin(admin.ModelAdmin):
    list_display = ("subject", "course", "instructor_user", "date", "start_time", "room")
    list_filter = ("date",)
    search_fields = ("subject", "instructor", "room")


@admin.register(InstructorActivity)
class InstructorActivityAdmin(admin.ModelAdmin):
    list_display = ("title", "activity_type", "instructor", "created_at")
    list_filter = ("activity_type", "created_at")
    search_fields = ("title", "description", "instructor__email")
