from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import StudentProfile


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_student_profile_for_new_student(sender, instance, created, **kwargs):
    """Automatically create a StudentProfile when a student account is created."""
    if getattr(instance, "role", None) == "STUDENT":
        StudentProfile.get_or_create_for_user(instance)

