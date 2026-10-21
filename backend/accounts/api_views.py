from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.tokens import default_token_generator
from django.urls import reverse
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
import threading
from django.shortcuts import redirect

from .serializers import RegisterSerializer, AdminCreateUserSerializer

from .permissions import IsAdmin, IsStudent, IsInstructor


User = get_user_model()

@api_view(['POST'])
def register(request):
    serializer = RegisterSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.save()

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        verification_url = (f"http://127.0.0.1:8000/api/verify-email/{uid}/{token}/")
        threading.Thread(
          target=send_mail,
          args=(
         'Verify your Ifexa Academy account',
         f'Hello {user.first_name},\n\n'
         f'Click the link below to verify your email:\n\n'
         f'{verification_url}\n\n'
         f'If you did not create this account, you can ignore this email.',
         'mikelchisom127@gmail.com',
         [user.email],
            ),
         kwargs={
         'fail_silently': False,
    }
    ).start()

        return Response({
            'message': 'Registration successful. Please check your email to verify your account. ',
            'user': {
                'id': user.id,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'role': user.role,
                'is_verified': user.is_verified,
            }
        }, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




@api_view(['GET'])
def verify_email(request, uid, token):
    try:
        uid = urlsafe_base64_decode(uid).decode()
        user = User.objects.get(pk=uid)
    except (User.DoesNotExist, ValueError, TypeError, OverflowError):
        return Response(
            {'error': 'Invalid verification link.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not default_token_generator.check_token(user, token):
        return Response(
            {'error': 'Invalid or expired verification link.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user.is_verified = True
    user.save(update_fields=['is_verified'])

    return redirect(
        'http://127.0.0.1:8080/pages/student/dashboard.html'
        '?verified=success'
    )


@api_view(['POST'])
def login(request):
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response({
            'error': 'Email and password are required. '
        }, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(
        request,
        email=email,
        password=password
    )

    if user is None:
        return Response({
            'error': 'Invalid email or password. '
        }, status=status.HTTP_401_UNAUTHORIZED)
    if not user.is_verified:
        return Response({
            'error': 'Please verify your email. '
        }, status=status.HTTP_403_FORBIDDEN)

    refresh = RefreshToken.for_user(user)

    return Response({
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
        }
    })


# Forgot password
@api_view(['POST'])
def forgot_password(request):
    email = request.data.get('email', '').strip().lower()

    if not email:
        return Response(
            {'error': 'Email is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    User = get_user_model()

    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        # Don't reveal whether an email is registered.
        return Response({
            'message': 'If an account with that email exists, a reset link has been sent.'
        })

    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)

    # Open the FRONTEND reset page, not the Django API.
    reset_url = (
        f"http://127.0.0.1:8080/pages/home/reset-password.html"
        f"?uid={uid}&token={token}"
    )

    send_mail(
        'Reset your Ifexa Academy password',
        f"Hello {user.first_name},\n\n"
        f"Click the link below to reset your password:\n\n"
        f"{reset_url}\n\n"
        f"If you did not request this, you can ignore this email.",
        'mikelchisom127@gmail.com',
        [user.email],
        fail_silently=False,
    )

    return Response({
        'message': 'If an account with that email exists, a reset link has been sent.'
    })


# Reset password
@api_view(['POST'])
def reset_password(request, uid, token):
    new_password = request.data.get('new_password')
    confirm_password = request.data.get('confirm_password')

    if not new_password or not confirm_password:
        return Response({
            'error': 'New password and confirm password are required.'
        }, status=status.HTTP_400_BAD_REQUEST)

    if new_password != confirm_password:
        return Response({
            'error': 'Passwords do not match.'
        }, status=status.HTTP_400_BAD_REQUEST)

    User = get_user_model()

    try:
        decoded_uid = urlsafe_base64_decode(uid).decode()
        user = User.objects.get(pk=decoded_uid)
    except (
        User.DoesNotExist,
        ValueError,
        TypeError,
        OverflowError
    ):
        return Response({
            'error': 'Invalid or expired reset link.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Verify the token before allowing a password change.
    if not default_token_generator.check_token(user, token):
        return Response({
            'error': 'Invalid or expired reset link.'
        }, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()

    return Response({
        'message': 'Password reset successful. You can now log in with your new password.'
    })



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_profile(request):
    return Response({
        'id': request.user.id,
        'first_name': request.user.first_name,
        'last_name': request.user.last_name,
        'email': request.user.email,
        'role': request.user.role,
        'is_verified': request.user.is_verified,
    })



@api_view(['POST'])
@permission_classes([IsAdmin])
def approve_instructor(request, user_id):
    try:
        instructor = User.objects.get(
            id=user_id,
            role='INSTRUCTOR',
        )
    except User.DoesNotExist:
        return Response({
            'error': 'Instructor not found.'
        }, status=status.HTTP_404_NOT_FOUND)

    instructor.is_approved = True
    instructor.save(update_fields=['is_approved'])

    return Response({
        'message':'Instructor approved successfully.',
        'instructor': {
            'id': instructor.id,
            'email': instructor.email,
            'is_approved': instructor.is_approved,
        }
    })

# User management
@api_view(['GET'])
@permission_classes([IsAdmin])
def list_users(request):
    User = get_user_model()

    users = User.objects.all().order_by('-date_joined')
   
    data = []

    for user in users:
        data.append({
            'id': user.id,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'role': user.role,
            'is_verified': user.is_verified,
            'is_approved': user.is_approved,
        })
    return Response(data)

# Admin user creation api
@api_view(['POST'])
@permission_classes([IsAdmin])
def create_staff_user(request):
    role = request.data.get('role')

    if role not in ['INSTRUCTOR', 'ADMIN']:
        return Response({
            'error': 'Admin can only create Instructor or Admin accounts.'
        }, status=status.HTTP_400_BAD_REQUEST)

    serializer = AdminCreateUserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({
            'message': 'User account created successfuly.',
            'user': {
                'id': user.id,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'role': user.role,
                'is_verified': user.is_verified,
                'is_approved': user.is_approved,
            }
        },status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Student profile API
@api_view(['GET'])
@permission_classes([IsStudent])
def student_profile(request):
    return Response({
        'message': 'Welcome to the student API.',
        'student': {
            'id': request.user.id,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
            'email': request.user.email,
            'role': request.user.role
        }
    })


# INstructor profile API
@api_view(['GET'])
@permission_classes([IsInstructor])
def instructor_profile(request):
    return Response({
        'message': 'Welcome to the instructor API.',
        'instructor': {
            'id': request.user.id,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
            'email': request.user.email,
            'role': request.user.role,
            'is_approved': request.user.is_approved,
        }
    })

# Admin profile API
@api_view(['GET'])
@permission_classes([IsAdmin])
def admin_profile(request):
    return Response({
        'message': 'Welcome to the admin API,',
        'admin': {
            'id': request.user.id,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
            'email': request.user.email,
            'role': request.user.role,
        }
    })

#Admin ability to delete users
#Admin ability to modify users and change their roles
@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAdmin])
def user_management(request, user_id):
    User = get_user_model()
    
    try:
            user = User.objects.get(id=user_id)
    except User.DoesNotExist:
            return Response({
                'error': 'User not found.'
            },status=status.HTTP_404_NOT_FOUND)
    
    if user.role == 'SUPER_ADMIN':
         return Response({
                'error': 'You cannot modify a Super Admin. '
            }, status=status.HTTP_403_FORBIDDEN)

    # UPDATE USER
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
        return Response({
                'message': 'User updated sucessfully. ',
                'user': {
                    'id': user.id,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'email': user.email,
                    'role': user.role,
                    'is_verified': user.is_verified,
                    'is_approved': user.is_approved,
                }
            })

    # DELETE USER
    if request.method == 'DELETE':
        user.delete()

        return Response({
            'message': 'User deleted successfully.'
        })
        






 
    

