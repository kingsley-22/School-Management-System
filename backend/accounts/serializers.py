from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import AdminProfile, InstructorProfile
from students.models import Announcement, Course, Enrollment, StudentProfile

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'first_name',
            'last_name',
            'email',
            'password',
            'confirm_password',
        ]

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({
                'password': 'Passwords do not match. '
            })
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')

        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            role='STUDENT',
        )
        return user


class AdminCreateUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True, default='')
    department = serializers.CharField(required=False, allow_blank=True, default='')
    specialization = serializers.CharField(required=False, allow_blank=True, default='')
    username = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = User
        fields = [
            'first_name',
            'last_name',
            'email',
            'password',
            'confirm_password',
            'role',
            'phone',
            'department',
            'specialization',
            'username',
        ]

    def validate_email(self, value):
        normalized = (value or '').strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return normalized

    def validate(self, data):
        password = data.get('password')
        confirm_password = data.get('confirm_password')
        if confirm_password and password != confirm_password:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        try:
            validate_password(password)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({'password': list(exc.messages)})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password', None)
        phone = validated_data.pop('phone', '')
        department = validated_data.pop('department', '')
        specialization = validated_data.pop('specialization', '')
        username = validated_data.pop('username', '')
        password = validated_data.pop('password')

        role = validated_data.get('role', 'INSTRUCTOR')
        user = User.objects.create_user(
            password=password,
            is_verified=True,
            is_approved=True,
            **validated_data,
        )
        if role == 'INSTRUCTOR':
            profile = InstructorProfile.get_or_create_for_user(user)
            profile.phone = phone
            profile.department = department
            profile.specialization = specialization
            if username:
                profile.username = username
            profile.save()
        elif role in ('ADMIN', 'SUPER_ADMIN'):
            profile = AdminProfile.get_or_create_for_user(user)
            profile.phone = phone
            if department:
                profile.department = department
            if username:
                profile.username = username
            profile.save()
        return user


class AdminCreateInstructorSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True, default='')
    department = serializers.CharField(max_length=150, required=False, allow_blank=True, default='')
    specialization = serializers.CharField(max_length=150, required=False, allow_blank=True, default='')
    username = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')

    def validate_email(self, value):
        normalized = (value or '').strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return normalized

    def validate_first_name(self, value):
        val = (value or '').strip()
        if not val:
            raise serializers.ValidationError('First name is required.')
        return val

    def validate_last_name(self, value):
        val = (value or '').strip()
        if not val:
            raise serializers.ValidationError('Last name is required.')
        return val

    def validate(self, data):
        password = data.get('password', '')
        confirm_password = data.get('confirm_password', '')
        if password != confirm_password:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        try:
            validate_password(password)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({'password': list(exc.messages)})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password', None)
        password = validated_data.pop('password')
        phone = (validated_data.pop('phone', '') or '').strip()
        department = (validated_data.pop('department', '') or '').strip()
        specialization = (validated_data.pop('specialization', '') or '').strip()
        username = (validated_data.pop('username', '') or '').strip()

        user = User.objects.create_user(
            email=validated_data['email'],
            password=password,
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            role='INSTRUCTOR',
            is_verified=True,
            is_approved=True,
        )
        profile = InstructorProfile.get_or_create_for_user(user)
        profile.phone = phone
        profile.department = department
        profile.specialization = specialization
        if username:
            profile.username = username
        profile.save()
        return user


def serialize_admin_student(user):
    profile = StudentProfile.get_or_create_for_user(user)
    enrollments = (
        Enrollment.objects.filter(student=user)
        .exclude(status=Enrollment.StatusChoices.DROPPED)
        .select_related('course')
    )
    assigned_courses = [
        {
            'id': e.course_id,
            'enrollment_id': e.id,
            'code': e.course.code,
            'title': e.course.title,
            'category': e.course.category,
            'progress': e.progress,
            'status': e.status,
        }
        for e in enrollments
    ]
    full_name = f"{user.first_name} {user.last_name}".strip() or user.email.split('@')[0]
    username = profile.username or (user.email.split('@')[0] if user.email else '')
    is_approved = bool(user.is_approved or user.is_verified)
    return {
        'id': profile.student_id,
        'student_id': profile.student_id,
        'user_id': user.id,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'name': full_name,
        'full_name': full_name,
        'email': user.email,
        'phone': profile.phone or '',
        'department': profile.course or '',
        'course': profile.course or '',
        'username': username,
        'status': 'Approved' if is_approved else 'Pending',
        'is_approved': user.is_approved,
        'is_verified': user.is_verified,
        'is_active': user.is_active,
        'assigned_courses': assigned_courses,
        'date_added': user.date_joined.isoformat() if user.date_joined else '',
    }


def serialize_admin_instructor(user):
    profile = InstructorProfile.get_or_create_for_user(user)
    full_name = f"{user.first_name} {user.last_name}".strip() or user.email.split('@')[0]
    username = profile.username or (user.email.split('@')[0] if user.email else '')
    assigned_courses = [
        {
            'id': c.id,
            'code': c.code,
            'title': c.title,
            'category': c.category,
        }
        for c in Course.objects.filter(instructor=user).order_by('id')
    ]
    return {
        'id': profile.instructor_id,
        'instructor_id': profile.instructor_id,
        'user_id': user.id,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'name': full_name,
        'full_name': full_name,
        'email': user.email,
        'phone': profile.phone or '',
        'department': profile.department or '',
        'specialization': profile.specialization or '',
        'username': username,
        'role': user.role,
        'is_approved': user.is_approved,
        'is_verified': user.is_verified,
        'is_active': user.is_active,
        'assigned_courses': assigned_courses,
        'date_added': user.date_joined.isoformat() if user.date_joined else '',
    }


def serialize_admin_profile(user):
    profile = AdminProfile.get_or_create_for_user(user)
    full_name = f"{user.first_name} {user.last_name}".strip() or user.email.split('@')[0]
    username = profile.username or (user.email.split('@')[0] if user.email else 'admin')
    return {
        'id': user.id,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'name': full_name,
        'full_name': full_name,
        'username': username,
        'email': user.email,
        'phone': profile.phone or '',
        'department': profile.department or 'Administration',
        'role': profile.role_title or ('Super Admin' if user.role == 'SUPER_ADMIN' else 'Administration'),
        'system_role': user.role,
        'bio': profile.bio or '',
        'avatar_url': profile.avatar_url or '',
    }


def serialize_admin_course(course):
    theme_map = {
        'Technology': ('art-tech', 'fa-laptop-code'),
        'Web Development': ('art-tech', 'fa-code'),
        'Frontend Development': ('art-tech', 'fa-laptop-code'),
        'Backend Development': ('art-science', 'fa-database'),
        'Programming': ('art-tech', 'fa-terminal'),
        'Full Stack Development': ('art-tech', 'fa-layer-group'),
        'Software Engineering': ('art-tech', 'fa-microchip'),
        'Data & AI': ('art-math', 'fa-brain'),
        'Cybersecurity': ('art-business', 'fa-shield-halved'),
        'Cloud & DevOps': ('art-science', 'fa-cloud'),
        'Mobile Development': ('art-language', 'fa-mobile-screen-button'),
        'Business': ('art-business', 'fa-briefcase'),
        'Design': ('art-design', 'fa-pen-ruler'),
        'Product Design': ('art-design', 'fa-pen-ruler'),
        'Science': ('art-science', 'fa-flask'),
        'Languages': ('art-language', 'fa-language'),
        'Mathematics': ('art-math', 'fa-square-root-variable'),
    }
    theme, default_icon = theme_map.get(course.category, ('art-tech', 'fa-laptop-code'))
    icon = course.art_style if (course.art_style and course.art_style.startswith('fa-')) else default_icon
    enrollments = (
        Enrollment.objects.filter(course=course)
        .exclude(status=Enrollment.StatusChoices.DROPPED)
        .select_related('student')
    )
    enrolled_students = []
    for e in enrollments:
        s_profile = StudentProfile.get_or_create_for_user(e.student)
        s_name = f"{e.student.first_name} {e.student.last_name}".strip() or e.student.email
        enrolled_students.append({
            'user_id': e.student_id,
            'student_id': s_profile.student_id,
            'name': s_name,
            'email': e.student.email,
            'progress': e.progress,
            'status': e.status,
        })
    instructor_display = course.get_instructor_display() or 'Unassigned'
    return {
        'id': course.id,
        'code': course.code,
        'title': course.title,
        'short_title': course.short_title or course.title[:30],
        'category': course.category or 'Technology',
        'level': course.level or 'Beginner',
        'hours': course.hours or 24,
        'total_lessons': course.total_lessons or 10,
        'instructor': instructor_display,
        'instructor_name': instructor_display,
        'instructor_id': course.instructor_id,
        'description': course.description or '',
        'active': bool(course.is_active),
        'is_active': bool(course.is_active),
        'theme': theme,
        'icon': icon,
        'outcomes': [
            f"Understand the core principles covered in {course.title}.",
            'Build practical skills through guided coursework and assignments.',
            'Apply concepts to real-world projects.',
        ],
        'enrolled_students_count': len(enrolled_students),
        'enrolled_students': enrolled_students,
    }


def serialize_admin_announcement(announcement):
    return {
        'id': announcement.id,
        'title': announcement.title,
        'category': announcement.category or 'General',
        'audience': announcement.audience or 'All users',
        'date': (announcement.publish_date or announcement.created_at.date()).isoformat(),
        'status': 'Published' if announcement.is_active else 'Draft',
        'is_active': bool(announcement.is_active),
        'body': announcement.message,
        'message': announcement.message,
        'course_id': announcement.course_id,
        'created_at': announcement.created_at.isoformat(),
    }
