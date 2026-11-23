import threading
import secrets
from datetime import date

from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.db.models import Q
from django.shortcuts import get_object_or_404, redirect
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from students.models import (
    Announcement,
    Course,
    Enrollment,
    StudentNotification,
    StudentProfile,
)
from .models import AdminProfile, InstructorProfile
from .permissions import IsAdmin, IsInstructor, IsStudent
from .serializers import (
    AdminCreateInstructorSerializer,
    AdminCreateUserSerializer,
    RegisterSerializer,
    serialize_admin_announcement,
    serialize_admin_course,
    serialize_admin_instructor,
    serialize_admin_profile,
    serialize_admin_student,
)

User = get_user_model()


def _resolve_student_user(identifier):
    """Resolve a student User by integer pk or by StudentProfile.student_id."""
    if identifier is None:
        return None
    ident_str = str(identifier).strip()
    if ident_str.isdigit():
        return User.objects.filter(pk=int(ident_str), role='STUDENT').first()
    profile = StudentProfile.objects.filter(student_id__iexact=ident_str).select_related('user').first()
    if profile and profile.user.role == 'STUDENT':
        return profile.user
    return User.objects.filter(email__iexact=ident_str, role='STUDENT').first()


def _resolve_instructor_user(identifier):
    """Resolve an instructor User by integer pk or by InstructorProfile.instructor_id."""
    if identifier is None:
        return None
    ident_str = str(identifier).strip()
    if ident_str.isdigit():
        return User.objects.filter(pk=int(ident_str), role='INSTRUCTOR').first()
    profile = InstructorProfile.objects.filter(instructor_id__iexact=ident_str).select_related('user').first()
    if profile and profile.user.role == 'INSTRUCTOR':
        return profile.user
    return User.objects.filter(email__iexact=ident_str, role='INSTRUCTOR').first()


@api_view(['POST'])
def register(request):
    serializer = RegisterSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.save()

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        from urllib.parse import urlencode
        from django.conf import settings as django_settings
        from_email = getattr(django_settings, 'DEFAULT_FROM_EMAIL', None) or 'mikelchisom127@gmail.com'

        requested_dashboard = (request.data.get('dashboard_base_url') or '').strip()
        verify_path = request.build_absolute_uri(f"/api/verify-email/{uid}/{token}/")
        if requested_dashboard.startswith(('http://127.0.0.1:', 'http://localhost:', 'https://')):
            verification_url = f"{verify_path}?{urlencode({'next': requested_dashboard.split('?', 1)[0]})}"
        else:
            verification_url = verify_path

        threading.Thread(
            target=send_mail,
            args=(
                'Verify your Ifexa Academy account',
                f'Hello {user.first_name},\n\n'
                f'Click the link below to verify your email and open your dashboard:\n\n'
                f'{verification_url}\n\n'
                f'If you did not create this account, you can ignore this email.',
                from_email,
                [user.email],
            ),
            kwargs={
                'fail_silently': False,
            },
        ).start()

        # Notify admins that a new user has registered
        admin_emails = list(
            User.objects.filter(role__in=['ADMIN', 'SUPER_ADMIN'], is_active=True)
            .exclude(email='')
            .values_list('email', flat=True)
            .distinct()
        )
        if not admin_emails and from_email:
            admin_emails = [from_email]

        if admin_emails:
            full_name = f"{user.first_name} {user.last_name}".strip() or user.email
            threading.Thread(
                target=send_mail,
                args=(
                    'New User Registered — Ifexa Academy',
                    f'Hello Admin,\n\n'
                    f'A new user has registered on Ifexa Academy:\n\n'
                    f'Name: {full_name}\n'
                    f'Email: {user.email}\n'
                    f'Role: {user.role}\n\n'
                    f'Log in to the Admin Dashboard to review or assign courses to this user.',
                    from_email,
                    admin_emails,
                ),
                kwargs={
                    'fail_silently': True,
                },
            ).start()

        return Response(
            {
                'message': 'Registration successful. Please check your email to verify your account. ',
                'user': {
                    'id': user.id,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'email': user.email,
                    'role': user.role,
                    'is_verified': user.is_verified,
                },
            },
            status=status.HTTP_201_CREATED,
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def verify_email(request, uid, token):
    try:
        uid = urlsafe_base64_decode(uid).decode()
        user = User.objects.get(pk=uid)
    except (User.DoesNotExist, ValueError, TypeError, OverflowError):
        return Response(
            {'error': 'Invalid verification link.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not default_token_generator.check_token(user, token):
        return Response(
            {'error': 'Invalid or expired verification link.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.is_verified = True
    user.save(update_fields=['is_verified'])

    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)

    next_url = (request.query_params.get('next') or '').strip()
    if next_url.startswith(('http://127.0.0.1:', 'http://localhost:', 'https://')):
        dashboard_url = next_url.split('?', 1)[0]
    elif user.role in ('ADMIN', 'SUPER_ADMIN'):
        dashboard_url = 'http://127.0.0.1:8080/pages/admin/admin.html'
    elif user.role == 'INSTRUCTOR':
        dashboard_url = 'http://127.0.0.1:8080/pages/instructor/dashboard.html'
    else:
        dashboard_url = 'http://127.0.0.1:8080/pages/student/dashboard.html'

    return redirect(
        f'{dashboard_url}'
        f'?verified=success&access={access_token}&refresh={refresh_token}'
    )


@api_view(['POST'])
def login(request):
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response(
            {'error': 'Email and password are required. '},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(
        request,
        email=email,
        password=password,
    )

    if user is None:
        return Response(
            {'error': 'Invalid email or password. '},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    if not user.is_verified:
        return Response(
            {'error': 'Please verify your email. '},
            status=status.HTTP_403_FORBIDDEN,
        )

    refresh = RefreshToken.for_user(user)

    return Response(
        {
            'message': 'Login successful. ',
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'role': user.role,
                'is_verified': user.is_verified,
                'is_approved': user.is_approved,
            },
        }
    )


@api_view(['POST'])
def forgot_password(request):
    email = request.data.get('email', '').strip().lower()

    if not email:
        return Response(
            {'error': 'Email is required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        return Response(
            {
                'message': 'If an account with that email exists, a reset link has been sent.'
            }
        )

    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)

    requested_base = (request.data.get('reset_base_url') or '').strip()
    if requested_base.startswith(('http://127.0.0.1:', 'http://localhost:', 'https://')):
        base_reset_url = requested_base.split('?', 1)[0]
    else:
        base_reset_url = "http://127.0.0.1:8080/pages/home/reset-password.html"

    reset_url = f"{base_reset_url}?uid={uid}&token={token}"

    from django.conf import settings as django_settings
    from_email = getattr(django_settings, 'DEFAULT_FROM_EMAIL', None) or 'mikelchisom127@gmail.com'

    try:
        send_mail(
            'Reset your Ifexa Academy password',
            f"Hello {user.first_name},\n\n"
            f"Click the link below to reset your password:\n\n"
            f"{reset_url}\n\n"
            f"If you did not request this, you can ignore this email.",
            from_email,
            [user.email],
            fail_silently=False,
        )
    except Exception as exc:
        if not getattr(django_settings, 'DEBUG', False):
            return Response(
                {'error': 'Unable to send password reset email right now. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    response_payload = {
        'message': 'If an account with that email exists, a reset link has been sent.',
    }
    if getattr(django_settings, 'DEBUG', False):
        response_payload['reset_url'] = reset_url

    return Response(response_payload)


@api_view(['POST'])
def reset_password(request, uid, token):
    new_password = request.data.get('new_password')
    confirm_password = request.data.get('confirm_password')

    if not new_password or not confirm_password:
        return Response(
            {'error': 'New password and confirm password are required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if new_password != confirm_password:
        return Response(
            {'error': 'Passwords do not match.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        decoded_uid = urlsafe_base64_decode(uid).decode()
        user = User.objects.get(pk=decoded_uid)
    except (User.DoesNotExist, ValueError, TypeError, OverflowError):
        return Response(
            {'error': 'Invalid or expired reset link.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not default_token_generator.check_token(user, token):
        return Response(
            {'error': 'Invalid or expired reset link.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.set_password(new_password)
    user.save()

    refresh = RefreshToken.for_user(user)

    return Response(
        {
            'message': 'Password reset successfully.',
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'role': user.role,
                'is_verified': user.is_verified,
                'is_approved': user.is_approved,
            },
        }
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_profile(request):
    return Response(
        {
            'id': request.user.id,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
            'email': request.user.email,
            'role': request.user.role,
            'is_verified': request.user.is_verified,
            'is_approved': request.user.is_approved,
        }
    )


@api_view(['POST'])
@permission_classes([IsAdmin])
def approve_instructor(request, user_id):
    instructor = _resolve_instructor_user(user_id)
    if not instructor:
        return Response(
            {'error': 'Instructor not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    instructor.is_approved = True
    instructor.is_verified = True
    instructor.save(update_fields=['is_approved', 'is_verified'])

    return Response(
        {
            'message': 'Instructor approved successfully.',
            'instructor': serialize_admin_instructor(instructor),
        }
    )


@api_view(['GET'])
@permission_classes([IsAdmin])
def list_users(request):
    users = User.objects.all().order_by('-date_joined')
    data = [
        {
            'id': user.id,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'role': user.role,
            'is_verified': user.is_verified,
            'is_approved': user.is_approved,
        }
        for user in users
    ]
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAdmin])
def create_staff_user(request):
    role = request.data.get('role', 'INSTRUCTOR')

    if role not in ['INSTRUCTOR', 'ADMIN']:
        return Response(
            {'error': 'Admin can only create Instructor or Admin accounts.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer = AdminCreateUserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        user_payload = (
            serialize_admin_instructor(user)
            if user.role == 'INSTRUCTOR'
            else {
                'id': user.id,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'role': user.role,
                'is_verified': user.is_verified,
                'is_approved': user.is_approved,
            }
        )
        return Response(
            {
                'message': 'User account created successfully.',
                'user': user_payload,
            },
            status=status.HTTP_201_CREATED,
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsStudent])
def student_profile(request):
    return Response(
        {
            'message': 'Welcome to the student API.',
            'student': {
                'id': request.user.id,
                'first_name': request.user.first_name,
                'last_name': request.user.last_name,
                'email': request.user.email,
                'role': request.user.role,
            },
        }
    )


@api_view(['GET'])
@permission_classes([IsInstructor])
def instructor_profile(request):
    data = serialize_admin_instructor(request.user)
    return Response(
        {
            'message': 'Welcome to the instructor API.',
            'instructor': data,
            **data,
        }
    )


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAdmin])
def admin_profile(request):
    user = request.user
    profile = AdminProfile.get_or_create_for_user(user)

    if request.method in ('PUT', 'PATCH'):
        full_name = (request.data.get('name') or request.data.get('full_name') or '').strip()
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')
        if full_name and first_name is None and last_name is None:
            parts = full_name.split(None, 1)
            user.first_name = parts[0]
            user.last_name = parts[1] if len(parts) > 1 else ''
        else:
            if first_name is not None:
                user.first_name = first_name.strip()
            if last_name is not None:
                user.last_name = last_name.strip()

        email = (request.data.get('email') or '').strip().lower()
        if email and email != user.email.lower():
            if User.objects.filter(email__iexact=email).exclude(pk=user.pk).exists():
                return Response(
                    {'error': 'That email is already in use by another account.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            user.email = email
        user.save()

        if 'username' in request.data:
            profile.username = (request.data.get('username') or '').strip()
        if 'phone' in request.data:
            profile.phone = (request.data.get('phone') or '').strip()
        if 'department' in request.data:
            profile.department = (request.data.get('department') or '').strip()
        if 'role' in request.data or 'role_title' in request.data:
            profile.role_title = (request.data.get('role_title') or request.data.get('role') or '').strip()
        if 'bio' in request.data:
            profile.bio = (request.data.get('bio') or '').strip()
        if 'avatar_url' in request.data:
            profile.avatar_url = request.data.get('avatar_url') or ''
        profile.save()

        data = serialize_admin_profile(user)
        return Response(
            {
                'message': 'Admin profile updated successfully.',
                'admin': data,
                **data,
            }
        )

    data = serialize_admin_profile(user)
    return Response(
        {
            'message': 'Welcome to the admin API.',
            'admin': data,
            **data,
        }
    )


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAdmin])
def user_management(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    if user.role == 'SUPER_ADMIN':
        return Response(
            {'error': 'You cannot modify a Super Admin. '},
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.method == 'PATCH':
        allowed_fields = [
            'first_name',
            'last_name',
            'email',
            'role',
            'is_verified',
            'is_approved',
        ]
        for field in allowed_fields:
            if field in request.data:
                setattr(user, field, request.data[field])

        user.save()
        return Response(
            {
                'message': 'User updated sucessfully. ',
                'user': {
                    'id': user.id,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'email': user.email,
                    'role': user.role,
                    'is_verified': user.is_verified,
                    'is_approved': user.is_approved,
                },
            }
        )

    if request.method == 'DELETE':
        user.delete()
        return Response({'message': 'User deleted successfully.'})


# =========================================================
# ADMIN DASHBOARD, STUDENT, INSTRUCTOR, COURSE, ANNOUNCEMENT ENDPOINTS
# =========================================================

DEFAULT_TECH_COURSES = [
    {
        'code': 'CSC-101',
        'title': 'Full-Stack Web Development',
        'short_title': 'Full-Stack Web',
        'category': 'Web Development',
        'level': 'Intermediate',
        'hours': 48,
        'instructor_name': '',
        'icon_class': 'fa-layer-group',
        'description': 'Build end-to-end modern web applications using HTML, CSS, JavaScript, React, and Django REST APIs.',
    },
    {
        'code': 'CSC-102',
        'title': 'Frontend Engineering with React & Next.js',
        'short_title': 'React & Next.js',
        'category': 'Frontend Development',
        'level': 'Intermediate',
        'hours': 40,
        'instructor_name': '',
        'icon_class': 'fa-laptop-code',
        'description': 'Master component architecture, hooks, state management, SSR, and responsive frontend engineering.',
    },
    {
        'code': 'CSC-103',
        'title': 'Backend Engineering with Python & Django',
        'short_title': 'Python & Django',
        'category': 'Backend Development',
        'level': 'Intermediate',
        'hours': 44,
        'instructor_name': '',
        'icon_class': 'fa-server',
        'description': 'Design scalable RESTful APIs, authentication systems, ORM queries, and production backend services.',
    },
    {
        'code': 'CSC-104',
        'title': 'JavaScript & TypeScript Mastery',
        'short_title': 'JS & TypeScript',
        'category': 'Programming',
        'level': 'Beginner',
        'hours': 36,
        'instructor_name': '',
        'icon_class': 'fa-code',
        'description': 'Deep dive into modern ES6+ JavaScript, asynchronous programming, DOM manipulation, and TypeScript types.',
    },
    {
        'code': 'CSC-105',
        'title': 'UI/UX Product Design & Prototyping',
        'short_title': 'UI/UX Design',
        'category': 'Product Design',
        'level': 'Beginner',
        'hours': 32,
        'instructor_name': '',
        'icon_class': 'fa-pen-ruler',
        'description': 'Learn user research, wireframing, design systems, and interactive high-fidelity prototyping in Figma.',
    },
    {
        'code': 'CSC-106',
        'title': 'Data Science & Machine Learning',
        'short_title': 'Data Science & ML',
        'category': 'Data & AI',
        'level': 'Advanced',
        'hours': 52,
        'instructor_name': '',
        'icon_class': 'fa-chart-line',
        'description': 'Analyze complex datasets and train predictive machine learning models using NumPy, Pandas, and Scikit-Learn.',
    },
    {
        'code': 'CSC-107',
        'title': 'Artificial Intelligence & Deep Learning',
        'short_title': 'AI & Deep Learning',
        'category': 'Data & AI',
        'level': 'Advanced',
        'hours': 56,
        'instructor_name': '',
        'icon_class': 'fa-brain',
        'description': 'Build neural networks, computer vision pipelines, and LLM-powered applications with PyTorch and TensorFlow.',
    },
    {
        'code': 'CSC-108',
        'title': 'Cybersecurity & Ethical Hacking',
        'short_title': 'Cybersecurity',
        'category': 'Cybersecurity',
        'level': 'Intermediate',
        'hours': 45,
        'instructor_name': '',
        'icon_class': 'fa-shield-halved',
        'description': 'Protect networks and web applications through vulnerability assessment, penetration testing, and security auditing.',
    },
    {
        'code': 'CSC-109',
        'title': 'Cloud Computing with AWS & Azure',
        'short_title': 'Cloud Computing',
        'category': 'Cloud & DevOps',
        'level': 'Intermediate',
        'hours': 42,
        'instructor_name': '',
        'icon_class': 'fa-cloud',
        'description': 'Architect, deploy, and manage resilient cloud infrastructure, serverless functions, and managed databases.',
    },
    {
        'code': 'CSC-110',
        'title': 'DevOps, CI/CD, Docker & Kubernetes',
        'short_title': 'DevOps & K8s',
        'category': 'Cloud & DevOps',
        'level': 'Advanced',
        'hours': 46,
        'instructor_name': '',
        'icon_class': 'fa-gears',
        'description': 'Automate software delivery pipelines, containerize microservices with Docker, and orchestrate clusters with Kubernetes.',
    },
    {
        'code': 'CSC-111',
        'title': 'Mobile App Development with Flutter & Dart',
        'short_title': 'Flutter & Dart',
        'category': 'Mobile Development',
        'level': 'Intermediate',
        'hours': 40,
        'instructor_name': '',
        'icon_class': 'fa-mobile-screen-button',
        'description': 'Create fast, native-quality iOS and Android applications from a single codebase using Flutter and Dart.',
    },
    {
        'code': 'CSC-112',
        'title': 'React Native Mobile App Engineering',
        'short_title': 'React Native',
        'category': 'Mobile Development',
        'level': 'Intermediate',
        'hours': 38,
        'instructor_name': '',
        'icon_class': 'fa-mobile-screen',
        'description': 'Build cross-platform mobile apps with React Native, Expo, native device APIs, and smooth animations.',
    },
    {
        'code': 'CSC-113',
        'title': 'Database Engineering, SQL & PostgreSQL',
        'short_title': 'SQL & PostgreSQL',
        'category': 'Backend Development',
        'level': 'Beginner',
        'hours': 30,
        'instructor_name': '',
        'icon_class': 'fa-database',
        'description': 'Master relational database design, normalization, indexing, transactions, and high-performance SQL queries.',
    },
    {
        'code': 'CSC-114',
        'title': 'Data Analytics with Python, SQL & Power BI',
        'short_title': 'Data Analytics',
        'category': 'Data & AI',
        'level': 'Beginner',
        'hours': 36,
        'instructor_name': '',
        'icon_class': 'fa-chart-pie',
        'description': 'Transform raw data into actionable business dashboards and reports using SQL, Python, and Power BI.',
    },
    {
        'code': 'CSC-115',
        'title': 'Blockchain & Web3 Smart Contract Development',
        'short_title': 'Blockchain & Web3',
        'category': 'Software Engineering',
        'level': 'Advanced',
        'hours': 44,
        'instructor_name': '',
        'icon_class': 'fa-cubes',
        'description': 'Develop decentralized applications (dApps) and secure Solidity smart contracts on Ethereum-compatible networks.',
    },
    {
        'code': 'CSC-116',
        'title': 'Software Engineering & System Design',
        'short_title': 'System Design',
        'category': 'Software Engineering',
        'level': 'Advanced',
        'hours': 48,
        'instructor_name': '',
        'icon_class': 'fa-sitemap',
        'description': 'Learn distributed systems, load balancing, caching strategies, clean architecture, and design patterns.',
    },
    {
        'code': 'CSC-117',
        'title': 'Node.js, Express & Microservices API Development',
        'short_title': 'Node.js & Express',
        'category': 'Backend Development',
        'level': 'Intermediate',
        'hours': 42,
        'instructor_name': '',
        'icon_class': 'fa-network-wired',
        'description': 'Build event-driven backend services, WebSocket servers, and REST/GraphQL APIs with Node.js and Express.',
    },
    {
        'code': 'CSC-118',
        'title': 'Quality Assurance (QA) & Automated Software Testing',
        'short_title': 'QA & Test Automation',
        'category': 'Software Engineering',
        'level': 'Beginner',
        'hours': 28,
        'instructor_name': '',
        'icon_class': 'fa-vial-circle-check',
        'description': 'Write unit, integration, and end-to-end automated test suites using Pytest, Jest, Playwright, and Cypress.',
    },
    {
        'code': 'CSC-119',
        'title': 'Linux Server Administration & Bash Scripting',
        'short_title': 'Linux & Bash',
        'category': 'Cloud & DevOps',
        'level': 'Beginner',
        'hours': 30,
        'instructor_name': '',
        'icon_class': 'fa-terminal',
        'description': 'Configure Linux servers, permissions, networking, systemd services, and automate tasks with Bash scripts.',
    },
    {
        'code': 'CSC-120',
        'title': 'Tech Product Management & Agile Delivery',
        'short_title': 'Tech Product Mgmt',
        'category': 'Product Design',
        'level': 'Beginner',
        'hours': 26,
        'instructor_name': '',
        'icon_class': 'fa-diagram-project',
        'description': 'Lead software product discovery, roadmapping, user stories, sprint planning, and Agile Scrum execution.',
    },
]


def ensure_default_tech_courses():
    if Course.objects.count() >= len(DEFAULT_TECH_COURSES):
        return
    for item in DEFAULT_TECH_COURSES:
        exists = Course.objects.filter(
            Q(code__iexact=item['code']) | Q(title__iexact=item['title'])
        ).exists()
        if not exists:
            Course.objects.create(
                code=item['code'],
                title=item['title'],
                short_title=item['short_title'],
                category=item['category'],
                level=item['level'],
                hours=item['hours'],
                total_lessons=max(1, item['hours'] // 2),
                instructor_name=item['instructor_name'],
                art_style=item['icon_class'],
                description=item['description'],
                is_active=True,
            )


def _resolve_course_reference(course_ref):
    if not course_ref:
        return None
    ensure_default_tech_courses()
    ref_str = str(course_ref).strip()
    course = None
    if ref_str.isdigit():
        course = Course.objects.filter(pk=int(ref_str)).first()
    if not course:
        course = Course.objects.filter(
            Q(code__iexact=ref_str) | Q(title__iexact=ref_str)
        ).first()
    return course


@api_view(['GET'])
@permission_classes([IsAdmin])
def admin_dashboard(request):
    ensure_default_tech_courses()
    students_qs = User.objects.filter(role='STUDENT').order_by('-date_joined', '-id')
    instructors_qs = User.objects.filter(role='INSTRUCTOR').order_by('-date_joined', '-id')
    courses_qs = Course.objects.all().order_by('id')

    students_data = [serialize_admin_student(u) for u in students_qs]
    instructors_data = [serialize_admin_instructor(u) for u in instructors_qs]
    courses_data = [serialize_admin_course(c) for c in courses_qs]

    pending_students = sum(1 for s in students_data if s['status'] == 'Pending')
    pending_instructors = sum(1 for i in instructors_data if not i['is_approved'])

    return Response(
        {
            'profile': serialize_admin_profile(request.user),
            'stats': {
                'total_students': len(students_data),
                'total_instructors': len(instructors_data),
                'total_courses': len(courses_data),
                'active_courses': sum(1 for c in courses_data if c['active']),
                'pending_approvals': pending_students,
                'pending_instructors': pending_instructors,
            },
            'students': students_data,
            'instructors': instructors_data,
            'courses': courses_data,
        }
    )


@api_view(['GET', 'POST'])
@permission_classes([IsAdmin])
def admin_students(request):
    if request.method == 'GET':
        students_qs = User.objects.filter(role='STUDENT').order_by('-date_joined', '-id')
        data = [serialize_admin_student(u) for u in students_qs]
        return Response({'count': len(data), 'results': data})

    # POST: Create a new student record
    email = (request.data.get('email') or '').strip().lower()
    full_name = (request.data.get('name') or request.data.get('full_name') or '').strip()
    first_name = (request.data.get('first_name') or '').strip()
    last_name = (request.data.get('last_name') or '').strip()
    if full_name and not first_name and not last_name:
        parts = full_name.split(None, 1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else ''

    phone = (request.data.get('phone') or '').strip()
    department = (request.data.get('department') or request.data.get('course') or '').strip()
    username = (request.data.get('username') or '').strip()
    password = request.data.get('password') or secrets.token_urlsafe(12)
    course_id = request.data.get('course_id')

    if not email or not first_name:
        return Response(
            {'error': 'Student name and email are required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(email__iexact=email).exists():
        return Response(
            {'error': 'A user with this email already exists.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if username and StudentProfile.objects.filter(username__iexact=username).exists():
        return Response(
            {'error': 'A student with this username already exists.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    student_user = User.objects.create_user(
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        role='STUDENT',
        is_verified=False,
        is_approved=False,
    )
    profile = StudentProfile.get_or_create_for_user(student_user)
    profile.phone = phone
    profile.course = department
    profile.username = username or email.split('@')[0]
    profile.save()

    if course_id:
        course = _resolve_course_reference(course_id)
        if course:
            Enrollment.objects.get_or_create(
                student=student_user,
                course=course,
                defaults={'status': Enrollment.StatusChoices.ACTIVE, 'progress': 0},
            )

    return Response(
        {
            'message': 'Student created successfully.',
            'student': serialize_admin_student(student_user),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAdmin])
def admin_student_detail(request, student_identifier):
    student_user = _resolve_student_user(student_identifier)
    if not student_user:
        return Response({'error': 'Student not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(serialize_admin_student(student_user))

    if request.method == 'PATCH':
        profile = StudentProfile.get_or_create_for_user(student_user)
        full_name = (request.data.get('name') or request.data.get('full_name') or '').strip()
        if full_name:
            parts = full_name.split(None, 1)
            student_user.first_name = parts[0]
            student_user.last_name = parts[1] if len(parts) > 1 else ''
        if 'first_name' in request.data:
            student_user.first_name = (request.data.get('first_name') or '').strip()
        if 'last_name' in request.data:
            student_user.last_name = (request.data.get('last_name') or '').strip()
        if 'email' in request.data:
            new_email = (request.data.get('email') or '').strip().lower()
            if new_email and new_email != student_user.email.lower():
                if User.objects.filter(email__iexact=new_email).exclude(pk=student_user.pk).exists():
                    return Response({'error': 'Email already in use.'}, status=status.HTTP_400_BAD_REQUEST)
                student_user.email = new_email
        if 'status' in request.data:
            st = (request.data.get('status') or '').strip().lower()
            if st == 'approved':
                student_user.is_approved = True
                student_user.is_verified = True
            elif st == 'pending':
                student_user.is_approved = False
        if 'is_approved' in request.data:
            student_user.is_approved = bool(request.data.get('is_approved'))
            if student_user.is_approved:
                student_user.is_verified = True
        student_user.save()

        if 'phone' in request.data:
            profile.phone = (request.data.get('phone') or '').strip()
        if 'department' in request.data or 'course' in request.data:
            profile.course = (request.data.get('department') or request.data.get('course') or '').strip()
        if 'username' in request.data:
            profile.username = (request.data.get('username') or '').strip()
        profile.save()

        return Response(
            {
                'message': 'Student updated successfully.',
                'student': serialize_admin_student(student_user),
            }
        )

    if request.method == 'DELETE':
        student_user.delete()
        return Response({'message': 'Student deleted successfully.'})


@api_view(['POST'])
@permission_classes([IsAdmin])
def approve_student(request, student_identifier):
    student_user = _resolve_student_user(student_identifier)
    if not student_user:
        return Response({'error': 'Student not found.'}, status=status.HTTP_404_NOT_FOUND)

    student_user.is_approved = True
    student_user.is_verified = True
    student_user.save(update_fields=['is_approved', 'is_verified'])

    profile = StudentProfile.get_or_create_for_user(student_user)
    profile.status = StudentProfile.StatusChoices.ACTIVE
    profile.save(update_fields=['status', 'updated_at'])

    return Response(
        {
            'message': 'Student approved successfully.',
            'student': serialize_admin_student(student_user),
        }
    )


@api_view(['POST'])
@permission_classes([IsAdmin])
def admin_assign_course(request, student_identifier=None):
    student_ref = student_identifier or request.data.get('student_id') or request.data.get('student')
    course_ref = request.data.get('course_id') or request.data.get('course')

    if not student_ref or not course_ref:
        return Response(
            {'error': 'Both student_id and course_id are required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    student_user = _resolve_student_user(student_ref)
    if not student_user:
        return Response(
            {'error': 'Invalid student ID. Student not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    course = _resolve_course_reference(course_ref)
    if not course:
        return Response(
            {'error': 'Invalid course ID. Course not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    existing = Enrollment.objects.filter(student=student_user, course=course).first()
    if existing and existing.status != Enrollment.StatusChoices.DROPPED:
        return Response(
            {'error': f"{student_user.email} is already assigned to {course.title}."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if existing:
        existing.status = Enrollment.StatusChoices.ACTIVE
        existing.save(update_fields=['status', 'updated_at'])
        enrollment = existing
    else:
        enrollment = Enrollment.objects.create(
            student=student_user,
            course=course,
            status=Enrollment.StatusChoices.ACTIVE,
            progress=0,
        )

    StudentNotification.objects.create(
        user=student_user,
        title='New course assigned',
        message=f"You have been enrolled in {course.title} by the administrator.",
        notification_type=StudentNotification.TypeChoices.ANNOUNCEMENT,
        is_read=False,
    )

    profile = StudentProfile.get_or_create_for_user(student_user)
    if not profile.course:
        profile.course = course.title
        profile.save(update_fields=['course', 'updated_at'])

    return Response(
        {
            'message': f"Course '{course.title}' assigned to student successfully.",
            'enrollment': {
                'id': enrollment.id,
                'student_id': profile.student_id,
                'user_id': student_user.id,
                'course_id': course.id,
                'course_code': course.code,
                'course_title': course.title,
                'status': enrollment.status,
                'progress': enrollment.progress,
            },
            'student': serialize_admin_student(student_user),
            'course': serialize_admin_course(course),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['DELETE'])
@permission_classes([IsAdmin])
def admin_unassign_course(request, student_identifier, course_id):
    student_user = _resolve_student_user(student_identifier)
    if not student_user:
        return Response({'error': 'Student not found.'}, status=status.HTTP_404_NOT_FOUND)

    deleted_count, _ = Enrollment.objects.filter(
        student=student_user, course_id=course_id
    ).delete()
    if not deleted_count:
        return Response(
            {'error': 'This student is not assigned to that course.'},
            status=status.HTTP_404_NOT_FOUND,
        )
    return Response(
        {
            'message': 'Course unassigned from student successfully.',
            'student': serialize_admin_student(student_user),
        }
    )


@api_view(['GET', 'POST'])
@permission_classes([IsAdmin])
def admin_instructors(request):
    if request.method == 'GET':
        instructors_qs = User.objects.filter(role='INSTRUCTOR').order_by('-date_joined', '-id')
        data = [serialize_admin_instructor(u) for u in instructors_qs]
        return Response({'count': len(data), 'results': data})

    # POST: Create a real Instructor account with hashed password
    payload = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
    full_name = (payload.get('name') or payload.get('full_name') or '').strip()
    if full_name and not payload.get('first_name') and not payload.get('last_name'):
        parts = full_name.split(None, 1)
        payload['first_name'] = parts[0]
        payload['last_name'] = parts[1] if len(parts) > 1 else parts[0]

    serializer = AdminCreateInstructorSerializer(data=payload)
    if serializer.is_valid():
        instructor_user = serializer.save()
        course_ref = payload.get('course_id') or payload.get('course')
        if course_ref:
            course = _resolve_course_reference(course_ref)
            if course:
                course.instructor = instructor_user
                course.instructor_name = f"{instructor_user.first_name} {instructor_user.last_name}".strip() or instructor_user.email
                course.save(update_fields=['instructor', 'instructor_name', 'updated_at'])
        return Response(
            {
                'message': 'Instructor account created successfully.',
                'instructor': serialize_admin_instructor(instructor_user),
            },
            status=status.HTTP_201_CREATED,
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAdmin])
def admin_assign_instructor(request, instructor_identifier=None):
    instructor_ref = (
        instructor_identifier
        or request.data.get('instructor_id')
        or request.data.get('instructor')
    )
    course_ref = request.data.get('course_id') or request.data.get('course')

    if not instructor_ref or not course_ref:
        return Response(
            {'error': 'Both instructor_id and course_id are required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    instructor_user = _resolve_instructor_user(instructor_ref)
    if not instructor_user:
        return Response(
            {'error': 'Invalid instructor ID. Instructor not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    course = _resolve_course_reference(course_ref)
    if not course:
        return Response(
            {'error': 'Invalid course ID. Course not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    full_name = f"{instructor_user.first_name} {instructor_user.last_name}".strip() or instructor_user.email
    course.instructor = instructor_user
    course.instructor_name = full_name
    course.save(update_fields=['instructor', 'instructor_name', 'updated_at'])

    return Response(
        {
            'message': f"Instructor '{full_name}' assigned to '{course.title}' successfully.",
            'course': serialize_admin_course(course),
            'instructor': serialize_admin_instructor(instructor_user),
        },
        status=status.HTTP_200_OK,
    )


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAdmin])
def admin_instructor_detail(request, instructor_identifier):
    instructor_user = _resolve_instructor_user(instructor_identifier)
    if not instructor_user:
        return Response({'error': 'Instructor not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(serialize_admin_instructor(instructor_user))

    if request.method == 'PATCH':
        profile = InstructorProfile.get_or_create_for_user(instructor_user)
        full_name = (request.data.get('name') or request.data.get('full_name') or '').strip()
        if full_name:
            parts = full_name.split(None, 1)
            instructor_user.first_name = parts[0]
            instructor_user.last_name = parts[1] if len(parts) > 1 else ''
        if 'first_name' in request.data:
            instructor_user.first_name = (request.data.get('first_name') or '').strip()
        if 'last_name' in request.data:
            instructor_user.last_name = (request.data.get('last_name') or '').strip()
        if 'email' in request.data:
            new_email = (request.data.get('email') or '').strip().lower()
            if new_email and new_email != instructor_user.email.lower():
                if User.objects.filter(email__iexact=new_email).exclude(pk=instructor_user.pk).exists():
                    return Response({'error': 'Email already in use.'}, status=status.HTTP_400_BAD_REQUEST)
                instructor_user.email = new_email
        if 'is_approved' in request.data:
            instructor_user.is_approved = bool(request.data.get('is_approved'))
        instructor_user.save()

        for field in ('phone', 'department', 'specialization', 'username'):
            if field in request.data:
                setattr(profile, field, (request.data.get(field) or '').strip())
        profile.save()

        return Response(
            {
                'message': 'Instructor updated successfully.',
                'instructor': serialize_admin_instructor(instructor_user),
            }
        )

    if request.method == 'DELETE':
        instructor_user.delete()
        return Response({'message': 'Instructor deleted successfully.'})


@api_view(['GET', 'POST'])
@permission_classes([IsAdmin])
def admin_courses(request):
    if request.method == 'GET':
        ensure_default_tech_courses()
        courses_qs = Course.objects.all().order_by('id')
        data = [serialize_admin_course(c) for c in courses_qs]
        return Response({'count': len(data), 'results': data})

    # POST: Create a new course
    title = (request.data.get('title') or '').strip()
    instructor_name = (request.data.get('instructor') or request.data.get('instructor_name') or '').strip()
    category = (request.data.get('category') or 'Technology').strip()
    level = (request.data.get('level') or 'Beginner').strip()
    description = (request.data.get('description') or '').strip()
    code = (request.data.get('code') or '').strip()
    instructor_id = request.data.get('instructor_id')

    try:
        hours = int(request.data.get('hours', 24))
    except (ValueError, TypeError):
        return Response({'error': 'hours must be a positive integer.'}, status=status.HTTP_400_BAD_REQUEST)

    if not title or not category or not description:
        return Response(
            {'error': 'Course title, category, and description are required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    instructor_user = None
    if instructor_id:
        instructor_user = _resolve_instructor_user(instructor_id)
        if instructor_user:
            instructor_name = f"{instructor_user.first_name} {instructor_user.last_name}".strip() or instructor_user.email
    elif instructor_name and instructor_name.lower() != 'unassigned':
        resolved_by_name = _resolve_instructor_user(instructor_name)
        if resolved_by_name:
            instructor_user = resolved_by_name
            instructor_name = f"{instructor_user.first_name} {instructor_user.last_name}".strip() or instructor_user.email
    else:
        instructor_name = ''

    course = Course.objects.create(
        title=title,
        code=code,
        category=category,
        level=level,
        hours=max(1, hours),
        total_lessons=max(1, hours // 2),
        instructor=instructor_user,
        instructor_name=instructor_name,
        description=description,
        is_active=bool(request.data.get('active', True)),
    )

    return Response(
        {
            'message': 'Course created successfully.',
            'course': serialize_admin_course(course),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAdmin])
def admin_course_detail(request, course_id):
    course = get_object_or_404(Course, pk=course_id)

    if request.method == 'GET':
        return Response(serialize_admin_course(course))

    if request.method in ('PUT', 'PATCH'):
        for field in ('title', 'category', 'level', 'description', 'code'):
            if field in request.data:
                setattr(course, field, (request.data.get(field) or '').strip())
        if 'instructor_id' in request.data:
            inst_ref = request.data.get('instructor_id')
            if inst_ref:
                inst_user = _resolve_instructor_user(inst_ref)
                if not inst_user:
                    return Response({'error': 'Instructor not found.'}, status=status.HTTP_404_NOT_FOUND)
                course.instructor = inst_user
                course.instructor_name = f"{inst_user.first_name} {inst_user.last_name}".strip() or inst_user.email
            else:
                course.instructor = None
                course.instructor_name = ''
        elif 'instructor' in request.data or 'instructor_name' in request.data:
            raw_inst = (
                request.data.get('instructor') or request.data.get('instructor_name') or ''
            ).strip()
            if not raw_inst or raw_inst.lower() == 'unassigned':
                course.instructor = None
                course.instructor_name = ''
            else:
                inst_user = _resolve_instructor_user(raw_inst)
                if inst_user:
                    course.instructor = inst_user
                    course.instructor_name = f"{inst_user.first_name} {inst_user.last_name}".strip() or inst_user.email
                else:
                    course.instructor_name = raw_inst
        if 'hours' in request.data:
            try:
                course.hours = max(1, int(request.data.get('hours')))
            except (ValueError, TypeError):
                return Response({'error': 'Invalid hours value.'}, status=status.HTTP_400_BAD_REQUEST)
        if 'active' in request.data or 'is_active' in request.data:
            val = request.data.get('active') if 'active' in request.data else request.data.get('is_active')
            course.is_active = bool(val)
        course.save()
        return Response(
            {
                'message': 'Course updated successfully.',
                'course': serialize_admin_course(course),
            }
        )

    if request.method == 'DELETE':
        course.delete()
        return Response({'message': 'Course deleted successfully.'})


@api_view(['GET', 'POST'])
@permission_classes([IsAdmin])
def admin_announcements(request):
    if request.method == 'GET':
        qs = Announcement.objects.all().order_by('-created_at', '-id')
        data = [serialize_admin_announcement(a) for a in qs]
        return Response({'count': len(data), 'results': data})

    title = (request.data.get('title') or '').strip()
    body = (request.data.get('body') or request.data.get('message') or '').strip()
    category = (request.data.get('category') or 'General').strip()
    audience = (request.data.get('audience') or 'All users').strip()
    status_str = (request.data.get('status') or 'Published').strip()
    date_str = (request.data.get('date') or '').strip()

    if not title or not body:
        return Response(
            {'error': 'Announcement title and details are required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    pub_date = timezone.localdate()
    if date_str:
        try:
            pub_date = date.fromisoformat(date_str)
        except ValueError:
            pass

    is_active = status_str.lower() != 'draft'
    announcement = Announcement.objects.create(
        title=title,
        message=body,
        category=category,
        audience=audience,
        publish_date=pub_date,
        is_active=is_active,
    )
    return Response(
        {
            'message': 'Announcement created successfully.',
            'announcement': serialize_admin_announcement(announcement),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAdmin])
def admin_announcement_detail(request, announcement_id):
    announcement = get_object_or_404(Announcement, pk=announcement_id)

    if request.method == 'GET':
        return Response(serialize_admin_announcement(announcement))

    if request.method in ('PUT', 'PATCH'):
        if 'title' in request.data:
            announcement.title = (request.data.get('title') or '').strip()
        if 'body' in request.data or 'message' in request.data:
            announcement.message = (request.data.get('body') or request.data.get('message') or '').strip()
        if 'category' in request.data:
            announcement.category = (request.data.get('category') or '').strip()
        if 'audience' in request.data:
            announcement.audience = (request.data.get('audience') or '').strip()
        if 'date' in request.data and request.data.get('date'):
            try:
                announcement.publish_date = date.fromisoformat(str(request.data.get('date')).strip())
            except ValueError:
                pass
        if 'status' in request.data:
            announcement.is_active = str(request.data.get('status')).strip().lower() != 'draft'
        elif 'is_active' in request.data:
            announcement.is_active = bool(request.data.get('is_active'))
        announcement.save()
        return Response(
            {
                'message': 'Announcement updated successfully.',
                'announcement': serialize_admin_announcement(announcement),
            }
        )

    if request.method == 'DELETE':
        announcement.delete()
        return Response({'message': 'Announcement deleted successfully.'})
