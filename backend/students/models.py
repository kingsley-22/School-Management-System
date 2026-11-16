from decimal import Decimal
from django.conf import settings
from django.db import models
from django.utils import timezone


def calculate_letter_grade(percentage):
    """Return a standard letter grade for a numeric percentage (0-100)."""
    if percentage is None:
        return ""
    score = float(percentage)
    if score >= 70:
        return "A"
    if score >= 60:
        return "B"
    if score >= 50:
        return "C"
    if score >= 45:
        return "D"
    if score >= 40:
        return "E"
    return "F"


class StudentProfile(models.Model):
    class StatusChoices(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        INACTIVE = "INACTIVE", "Inactive"
        SUSPENDED = "SUSPENDED", "Suspended"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="student_profile",
    )
    student_id = models.CharField(max_length=30, unique=True, blank=True)
    course = models.CharField(max_length=150, default="Computer Science", blank=True)
    phone = models.CharField(max_length=30, blank=True, default="")
    bio = models.TextField(blank=True, default="")
    avatar_url = models.CharField(
        max_length=500,
        blank=True,
        default="../../image/female.jpg",
    )
    status = models.CharField(
        max_length=20,
        choices=StatusChoices.choices,
        default=StatusChoices.ACTIVE,
    )
    total_fees = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    outstanding_balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    joined_date = models.DateField(default=timezone.localdate)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.student_id:
            year = self.joined_date.year if self.joined_date else timezone.localdate().year
            uid = self.user_id or 0
            candidate = f"STU{year}{uid:03d}"
            counter = 1
            while StudentProfile.objects.filter(student_id=candidate).exclude(pk=self.pk).exists():
                candidate = f"STU{year}{uid:03d}-{counter}"
                counter += 1
            self.student_id = candidate
        super().save(*args, **kwargs)

    @classmethod
    def get_or_create_for_user(cls, user):
        profile, _ = cls.objects.get_or_create(
            user=user,
            defaults={
                "joined_date": user.date_joined.date() if getattr(user, "date_joined", None) else timezone.localdate(),
            },
        )
        return profile

    def __str__(self):
        return f"{self.student_id} - {self.user.email}"


class Course(models.Model):
    title = models.CharField(max_length=200)
    code = models.CharField(max_length=50, unique=True)
    short_title = models.CharField(max_length=50, blank=True, default="")
    category = models.CharField(max_length=150, default="Web Development")
    art_style = models.CharField(max_length=50, default="html-art", blank=True)
    description = models.TextField(blank=True, default="")
    instructor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="instructed_student_courses",
    )
    instructor_name = models.CharField(max_length=150, blank=True, default="")
    total_lessons = models.PositiveIntegerField(default=10)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["id"]

    def save(self, *args, **kwargs):
        if not self.short_title:
            self.short_title = self.title[:30]
        super().save(*args, **kwargs)

    def get_instructor_display(self):
        if self.instructor_name:
            return self.instructor_name
        if self.instructor:
            full_name = f"{self.instructor.first_name} {self.instructor.last_name}".strip()
            return full_name or self.instructor.email
        return "IFEXA Instructor"

    def __str__(self):
        return f"{self.code} - {self.title}"


class Enrollment(models.Model):
    class StatusChoices(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        COMPLETED = "COMPLETED", "Completed"
        DROPPED = "DROPPED", "Dropped"

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="enrollments",
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="enrollments",
    )
    progress = models.PositiveIntegerField(default=0)
    completed_lessons = models.PositiveIntegerField(default=0)
    status = models.CharField(
        max_length=20,
        choices=StatusChoices.choices,
        default=StatusChoices.ACTIVE,
    )
    score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
    )
    grade = models.CharField(max_length=5, blank=True, default="")
    enrolled_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("student", "course")
        ordering = ["course__id"]

    def save(self, *args, **kwargs):
        if self.progress > 100:
            self.progress = 100
        if self.progress == 100 and self.status == self.StatusChoices.ACTIVE:
            self.status = self.StatusChoices.COMPLETED
        if not self.grade:
            basis = self.score if self.score is not None else self.progress
            self.grade = calculate_letter_grade(basis)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student.email} -> {self.course.title} ({self.progress}%)"


class Assignment(models.Model):
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="assignments",
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    due_date = models.DateField()
    max_score = models.PositiveIntegerField(default=100)
    dot_color = models.CharField(max_length=30, default="green-dot", blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["due_date", "id"]

    def __str__(self):
        return f"{self.title} ({self.course.title})"


class AssignmentSubmission(models.Model):
    class StatusChoices(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SUBMITTED = "SUBMITTED", "Submitted"
        GRADED = "GRADED", "Graded"
        LATE = "LATE", "Late"

    assignment = models.ForeignKey(
        Assignment,
        on_delete=models.CASCADE,
        related_name="submissions",
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assignment_submissions",
    )
    submission_text = models.TextField(blank=True, default="")
    submission_url = models.URLField(max_length=500, blank=True, default="")
    status = models.CharField(
        max_length=20,
        choices=StatusChoices.choices,
        default=StatusChoices.SUBMITTED,
    )
    score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
    )
    feedback = models.TextField(blank=True, default="")
    submitted_at = models.DateTimeField(auto_now_add=True)
    graded_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("assignment", "student")
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"{self.student.email} - {self.assignment.title} ({self.status})"


class StudentResult(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="results",
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="student_results",
    )
    assessment_title = models.CharField(max_length=200, default="Course Assessment")
    score = models.DecimalField(max_digits=5, decimal_places=2)
    max_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("100.00"),
    )
    grade = models.CharField(max_length=5, blank=True, default="")
    remarks = models.CharField(max_length=255, blank=True, default="")
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-recorded_at"]

    @property
    def percentage(self):
        if not self.max_score:
            return 0.0
        return round((float(self.score) / float(self.max_score)) * 100.0, 2)

    def save(self, *args, **kwargs):
        if not self.grade:
            self.grade = calculate_letter_grade(self.percentage)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student.email} - {self.course.title}: {self.score}/{self.max_score}"


class Attendance(models.Model):
    class StatusChoices(models.TextChoices):
        PRESENT = "PRESENT", "Present"
        ABSENT = "ABSENT", "Absent"
        LATE = "LATE", "Late"
        EXCUSED = "EXCUSED", "Excused"

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="attendance_records",
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="attendance_records",
        null=True,
        blank=True,
    )
    date = models.DateField(default=timezone.localdate)
    status = models.CharField(
        max_length=20,
        choices=StatusChoices.choices,
        default=StatusChoices.PRESENT,
    )
    topic = models.CharField(max_length=200, blank=True, default="")
    remarks = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("student", "course", "date")
        ordering = ["-date", "-id"]

    def __str__(self):
        return f"{self.student.email} - {self.date} ({self.status})"


class Announcement(models.Model):
    class CategoryChoices(models.TextChoices):
        GENERAL = "general", "General"
        COURSE = "course", "Course Update"
        IMPORTANT = "important", "Important"

    title = models.CharField(max_length=200)
    message = models.TextField()
    category = models.CharField(
        max_length=30,
        choices=CategoryChoices.choices,
        default=CategoryChoices.GENERAL,
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="announcements",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class StudentNotification(models.Model):
    class TypeChoices(models.TextChoices):
        ASSIGNMENT = "assignment", "Assignment"
        ANNOUNCEMENT = "announcement", "Announcement"
        GRADE = "grade", "Grade"
        PAYMENT = "payment", "Payment"
        GENERAL = "general", "General"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="student_notifications",
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=30,
        choices=TypeChoices.choices,
        default=TypeChoices.GENERAL,
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} - {self.title}"


class StudentPayment(models.Model):
    class StatusChoices(models.TextChoices):
        PAID = "PAID", "Paid"
        PENDING = "PENDING", "Pending"
        FAILED = "FAILED", "Failed"

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="student_payments",
    )
    reference = models.CharField(max_length=100, unique=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.CharField(max_length=255, default="Tuition Fee Payment")
    status = models.CharField(
        max_length=20,
        choices=StatusChoices.choices,
        default=StatusChoices.PAID,
    )
    paid_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-paid_at", "-id"]

    def __str__(self):
        return f"{self.reference} - {self.student.email} ({self.amount})"
