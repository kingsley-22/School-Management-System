from django.utils import timezone
from rest_framework import serializers

from .models import (
    Announcement,
    Assignment,
    AssignmentSubmission,
    Attendance,
    Course,
    Enrollment,
    StudentNotification,
    StudentPayment,
    StudentProfile,
    StudentResult,
)


def format_naira(amount):
    """Format a numeric amount as a Naira currency string (e.g. '₦45,000')."""
    if amount is None:
        return "₦0"
    value = float(amount)
    if value.is_integer():
        return f"₦{int(value):,}"
    return f"₦{value:,.2f}"


def format_relative_time(dt):
    """Format a datetime into a concise relative string like '2 hours ago' or 'Recently'."""
    if not dt:
        return "Recently"
    now = timezone.now()
    diff = now - dt
    seconds = int(diff.total_seconds())
    if seconds < 60:
        return "Just now"
    minutes = seconds // 60
    if minutes < 60:
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
    hours = minutes // 60
    if hours < 24:
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    days = hours // 24
    if days == 1:
        return "Yesterday"
    if days < 30:
        return f"{days} days ago"
    return dt.strftime("%b %d, %Y")


class StudentProfileSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    first_name = serializers.CharField(source="user.first_name", required=False, allow_blank=True)
    last_name = serializers.CharField(source="user.last_name", required=False, allow_blank=True)
    full_name = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()
    email = serializers.EmailField(source="user.email", read_only=True)
    role = serializers.CharField(source="user.role", read_only=True)
    role_display = serializers.SerializerMethodField()
    is_verified = serializers.BooleanField(source="user.is_verified", read_only=True)
    is_active = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    joined_display = serializers.SerializerMethodField()
    formatted_balance = serializers.SerializerMethodField()

    class Meta:
        model = StudentProfile
        fields = [
            "id",
            "user_id",
            "student_id",
            "first_name",
            "last_name",
            "full_name",
            "name",
            "email",
            "role",
            "role_display",
            "course",
            "phone",
            "bio",
            "avatar_url",
            "status",
            "is_active",
            "is_verified",
            "total_fees",
            "outstanding_balance",
            "formatted_balance",
            "joined_date",
            "joined_display",
        ]
        read_only_fields = [
            "id",
            "user_id",
            "student_id",
            "email",
            "role",
            "role_display",
            "status",
            "is_active",
            "is_verified",
            "total_fees",
            "outstanding_balance",
            "formatted_balance",
            "joined_date",
            "joined_display",
        ]

    def get_full_name(self, obj):
        full = f"{obj.user.first_name} {obj.user.last_name}".strip()
        return full or obj.user.email

    def get_name(self, obj):
        return self.get_full_name(obj)

    def get_role_display(self, obj):
        return obj.user.get_role_display() if hasattr(obj.user, "get_role_display") else obj.user.role

    def get_is_active(self, obj):
        return bool(obj.user.is_active and obj.status == StudentProfile.StatusChoices.ACTIVE)

    def get_status(self, obj):
        return obj.get_status_display()

    def get_joined_display(self, obj):
        if obj.joined_date:
            return obj.joined_date.strftime("%b %Y")
        return ""

    def get_formatted_balance(self, obj):
        return format_naira(obj.outstanding_balance)

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})
        user_updated = False
        for field in ("first_name", "last_name"):
            if field in user_data:
                setattr(instance.user, field, user_data[field].strip())
                user_updated = True
        if user_updated:
            instance.user.save(update_fields=["first_name", "last_name"])

        allowed_profile_fields = ("course", "phone", "bio", "avatar_url")
        for field in allowed_profile_fields:
            if field in validated_data:
                setattr(instance, field, validated_data[field])
        instance.save()
        return instance


class CourseSerializer(serializers.ModelSerializer):
    instructor_name = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id",
            "code",
            "title",
            "short_title",
            "category",
            "art_style",
            "description",
            "instructor_name",
            "total_lessons",
            "is_active",
        ]

    def get_instructor_name(self, obj):
        return obj.get_instructor_display()


class EnrolledCourseSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="course.id", read_only=True)
    enrollment_id = serializers.IntegerField(source="id", read_only=True)
    code = serializers.CharField(source="course.code", read_only=True)
    title = serializers.CharField(source="course.title", read_only=True)
    short_title = serializers.CharField(source="course.short_title", read_only=True)
    category = serializers.CharField(source="course.category", read_only=True)
    art_style = serializers.CharField(source="course.art_style", read_only=True)
    description = serializers.CharField(source="course.description", read_only=True)
    instructor_name = serializers.SerializerMethodField()
    total_lessons = serializers.IntegerField(source="course.total_lessons", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            "id",
            "enrollment_id",
            "code",
            "title",
            "short_title",
            "category",
            "art_style",
            "description",
            "instructor_name",
            "total_lessons",
            "completed_lessons",
            "progress",
            "status",
            "status_display",
            "score",
            "grade",
            "enrolled_at",
        ]
        read_only_fields = [
            "id",
            "enrollment_id",
            "code",
            "title",
            "short_title",
            "category",
            "art_style",
            "description",
            "instructor_name",
            "total_lessons",
            "score",
            "grade",
            "enrolled_at",
        ]

    def get_instructor_name(self, obj):
        return obj.course.get_instructor_display()


class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    assignment_title = serializers.CharField(source="assignment.title", read_only=True)
    course_id = serializers.IntegerField(source="assignment.course_id", read_only=True)
    course_title = serializers.CharField(source="assignment.course.title", read_only=True)
    max_score = serializers.IntegerField(source="assignment.max_score", read_only=True)
    status = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = AssignmentSubmission
        fields = [
            "id",
            "assignment",
            "assignment_title",
            "course_id",
            "course_title",
            "submission_text",
            "submission_url",
            "status",
            "status_display",
            "score",
            "max_score",
            "feedback",
            "submitted_at",
            "graded_at",
        ]
        read_only_fields = [
            "id",
            "assignment",
            "assignment_title",
            "course_id",
            "course_title",
            "status",
            "status_display",
            "score",
            "max_score",
            "feedback",
            "submitted_at",
            "graded_at",
        ]

    def get_status(self, obj):
        return obj.status.lower()

    def validate(self, attrs):
        text = (attrs.get("submission_text") or "").strip()
        url = (attrs.get("submission_url") or "").strip()
        if not text and not url:
            raise serializers.ValidationError(
                "Please provide either submission_text or submission_url."
            )
        attrs["submission_text"] = text
        attrs["submission_url"] = url
        return attrs


class StudentAssignmentSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source="course.title", read_only=True)
    course_category = serializers.CharField(source="course.category", read_only=True)
    due_date_display = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    is_submitted = serializers.SerializerMethodField()
    submission = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = [
            "id",
            "title",
            "description",
            "course",
            "course_title",
            "course_category",
            "due_date",
            "due_date_display",
            "max_score",
            "dot_color",
            "status",
            "status_display",
            "is_submitted",
            "submission",
        ]

    def _get_student_submission(self, obj):
        submissions_map = self.context.get("submissions_map")
        if submissions_map is not None:
            return submissions_map.get(obj.id)
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            return obj.submissions.filter(student=request.user).first()
        return None

    def get_due_date_display(self, obj):
        if obj.due_date:
            return obj.due_date.strftime("%b %d")
        return ""

    def get_status(self, obj):
        sub = self._get_student_submission(obj)
        if sub:
            return sub.status.lower()
        return "pending"

    def get_status_display(self, obj):
        sub = self._get_student_submission(obj)
        if sub:
            return sub.get_status_display()
        return "Pending"

    def get_is_submitted(self, obj):
        sub = self._get_student_submission(obj)
        return bool(sub and sub.status != AssignmentSubmission.StatusChoices.PENDING)

    def get_submission(self, obj):
        sub = self._get_student_submission(obj)
        if not sub:
            return None
        return AssignmentSubmissionSerializer(sub).data


class StudentResultSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source="course.title", read_only=True)
    course_code = serializers.CharField(source="course.code", read_only=True)
    percentage = serializers.FloatField(read_only=True)

    class Meta:
        model = StudentResult
        fields = [
            "id",
            "course",
            "course_code",
            "course_title",
            "assessment_title",
            "score",
            "max_score",
            "percentage",
            "grade",
            "remarks",
            "recorded_at",
        ]


class AttendanceSerializer(serializers.ModelSerializer):
    course_title = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Attendance
        fields = [
            "id",
            "course",
            "course_title",
            "date",
            "status",
            "status_display",
            "topic",
            "remarks",
        ]

    def get_course_title(self, obj):
        return obj.course.title if obj.course else ""


class AnnouncementSerializer(serializers.ModelSerializer):
    description = serializers.CharField(source="message", read_only=True)
    course_title = serializers.SerializerMethodField()
    time_ago = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = [
            "id",
            "title",
            "message",
            "description",
            "category",
            "course",
            "course_title",
            "is_active",
            "created_at",
            "time_ago",
        ]

    def get_course_title(self, obj):
        return obj.course.title if obj.course else ""

    def get_time_ago(self, obj):
        return format_relative_time(obj.created_at)


class StudentNotificationSerializer(serializers.ModelSerializer):
    icon = serializers.SerializerMethodField()
    time_ago = serializers.SerializerMethodField()

    class Meta:
        model = StudentNotification
        fields = [
            "id",
            "title",
            "message",
            "notification_type",
            "icon",
            "is_read",
            "created_at",
            "time_ago",
        ]

    def get_icon(self, obj):
        icon_map = {
            "assignment": "fa-solid fa-file-lines",
            "announcement": "fa-solid fa-bullhorn",
            "grade": "fa-solid fa-chart-column",
            "payment": "fa-solid fa-wallet",
            "general": "fa-solid fa-bell",
        }
        return icon_map.get(obj.notification_type, "fa-solid fa-bell")

    def get_time_ago(self, obj):
        return format_relative_time(obj.created_at)


class StudentPaymentSerializer(serializers.ModelSerializer):
    formatted_amount = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = StudentPayment
        fields = [
            "id",
            "reference",
            "amount",
            "formatted_amount",
            "description",
            "status",
            "status_display",
            "paid_at",
        ]

    def get_formatted_amount(self, obj):
        return format_naira(obj.amount)

