from datetime import datetime

from django.conf import settings
from django.db import models
from django.utils import timezone


class ClassSchedule(models.Model):
    instructor_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="class_schedules",
    )
    course = models.ForeignKey(
        "students.Course",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="class_schedules",
    )
    subject = models.CharField(max_length=200, blank=True, default="")
    instructor = models.CharField(max_length=150, blank=True, default="")
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField(null=True, blank=True)
    room = models.CharField(max_length=100, blank=True, default="")
    students = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["date", "start_time", "id"]

    @property
    def is_past(self):
        scheduled_dt = datetime.combine(self.date, self.start_time)
        if timezone.is_aware(timezone.now()):
            scheduled_dt = timezone.make_aware(scheduled_dt, timezone.get_current_timezone())
            return scheduled_dt < timezone.localtime(timezone.now())
        return scheduled_dt < datetime.now()

    def save(self, *args, **kwargs):
        if self.course and not self.subject:
            self.subject = self.course.title
        if self.instructor_user and not self.instructor:
            full_name = f"{self.instructor_user.first_name} {self.instructor_user.last_name}".strip()
            self.instructor = full_name or self.instructor_user.email
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.subject or 'Class'} ({self.date} {self.start_time})"


class InstructorActivity(models.Model):
    class TypeChoices(models.TextChoices):
        STUDENT = "student", "Student"
        COURSE = "course", "Course"
        ASSIGNMENT = "assignment", "Assignment"
        ANNOUNCEMENT = "announcement", "Announcement"
        SCHEDULE = "schedule", "Schedule"
        GRADE = "grade", "Grade"
        EDIT = "edit", "Edit"
        DELETE = "delete", "Delete"
        GENERAL = "general", "General"

    instructor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="instructor_activities",
    )
    activity_type = models.CharField(
        max_length=30,
        choices=TypeChoices.choices,
        default=TypeChoices.GENERAL,
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    link = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return f"{self.instructor.email} - {self.title}"
