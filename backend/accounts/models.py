from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils import timezone


# Create your models here.
class UserRole(models.TextChoices):
    STUDENT = 'STUDENT', 'Student'
    INSTRUCTOR = 'INSTRUCTOR', 'Instructor'
    ADMIN = 'ADMIN', 'Admin'
    SUPER_ADMIN = 'SUPER_ADMIN', 'Super Admin'


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    username = None
    email = models.EmailField(unique=True)
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.STUDENT,
    )
    is_verified = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=False)
    objects = UserManager()
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email


class InstructorProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='instructor_profile',
    )
    instructor_id = models.CharField(max_length=30, unique=True, blank=True)
    username = models.CharField(max_length=100, blank=True, default='')
    phone = models.CharField(max_length=30, blank=True, default='')
    department = models.CharField(max_length=150, blank=True, default='')
    specialization = models.CharField(max_length=150, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.instructor_id:
            year = timezone.localdate().year
            uid = self.user_id or 0
            candidate = f"INS-{year}-{uid:04d}"
            counter = 1
            while InstructorProfile.objects.filter(instructor_id=candidate).exclude(pk=self.pk).exists():
                candidate = f"INS-{year}-{uid:04d}-{counter}"
                counter += 1
            self.instructor_id = candidate
        if not self.username and self.user_id and self.user.email:
            self.username = self.user.email.split('@')[0]
        super().save(*args, **kwargs)

    @classmethod
    def get_or_create_for_user(cls, user):
        profile, _ = cls.objects.get_or_create(
            user=user,
            defaults={
                'username': user.email.split('@')[0] if user.email else '',
            },
        )
        return profile

    def __str__(self):
        return f"{self.instructor_id} - {self.user.email}"


class AdminProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='admin_profile',
    )
    username = models.CharField(max_length=100, blank=True, default='')
    phone = models.CharField(max_length=30, blank=True, default='')
    department = models.CharField(max_length=150, blank=True, default='Administration')
    role_title = models.CharField(max_length=100, blank=True, default='Administration')
    bio = models.TextField(blank=True, default='')
    avatar_url = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @classmethod
    def get_or_create_for_user(cls, user):
        profile, _ = cls.objects.get_or_create(
            user=user,
            defaults={
                'username': user.email.split('@')[0] if user.email else 'admin',
                'department': 'Administration',
                'role_title': 'Super Admin' if user.role == 'SUPER_ADMIN' else 'Administration',
            },
        )
        return profile

    def __str__(self):
        return f"AdminProfile({self.user.email})"
