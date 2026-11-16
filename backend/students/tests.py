from datetime import timedelta
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

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

User = get_user_model()


class StudentDashboardAPITests(APITestCase):
    def setUp(self):
        self.student = User.objects.create_user(
            email="stephen@gmail.com",
            password="StrongPassword123!",
            first_name="Ikechukwu",
            last_name="Stephen",
            role="STUDENT",
            is_verified=True,
        )
        self.other_student = User.objects.create_user(
            email="other@gmail.com",
            password="StrongPassword123!",
            first_name="Ada",
            last_name="Obi",
            role="STUDENT",
            is_verified=True,
        )
        self.instructor = User.objects.create_user(
            email="instructor@gmail.com",
            password="StrongPassword123!",
            first_name="Jungle",
            last_name="Man",
            role="INSTRUCTOR",
            is_verified=True,
            is_approved=True,
        )

        self.profile = StudentProfile.get_or_create_for_user(self.student)
        self.profile.course = "Computer Science"
        self.profile.total_fees = Decimal("100000.00")
        self.profile.outstanding_balance = Decimal("45000.00")
        self.profile.save()

        self.course_web = Course.objects.create(
            code="WEB101",
            title="HTML, CSS & JavaScript",
            short_title="HTML · CSS · JS",
            category="Web Development",
            art_style="html-art",
            description="Frontend web development fundamentals.",
            instructor=self.instructor,
            total_lessons=20,
        )
        self.course_python = Course.objects.create(
            code="PY101",
            title="Python",
            short_title="Python",
            category="Programming",
            art_style="python-art",
            description="Core Python programming.",
            instructor=self.instructor,
            total_lessons=15,
        )
        self.course_unregistered = Course.objects.create(
            code="DJ101",
            title="Django",
            short_title="Django",
            category="Full Stack Development",
            art_style="django-art",
            description="Backend web development with Django.",
            instructor=self.instructor,
            total_lessons=18,
        )

        self.enrollment_web = Enrollment.objects.create(
            student=self.student,
            course=self.course_web,
            progress=80,
            completed_lessons=16,
            score=Decimal("82.00"),
        )
        self.enrollment_python = Enrollment.objects.create(
            student=self.student,
            course=self.course_python,
            progress=90,
            completed_lessons=13,
            score=Decimal("91.00"),
        )
        Enrollment.objects.create(
            student=self.other_student,
            course=self.course_unregistered,
            progress=40,
        )

        today = timezone.localdate()
        self.assignment_pending = Assignment.objects.create(
            course=self.course_web,
            title="Build a Portfolio Website",
            description="Create a responsive portfolio website.",
            due_date=today + timedelta(days=5),
            max_score=100,
            dot_color="green-dot",
        )
        self.assignment_submitted = Assignment.objects.create(
            course=self.course_python,
            title="Python Calculator",
            description="Build a CLI calculator in Python.",
            due_date=today + timedelta(days=10),
            max_score=100,
            dot_color="orange-dot",
        )
        self.submission = AssignmentSubmission.objects.create(
            assignment=self.assignment_submitted,
            student=self.student,
            submission_text="Completed calculator code.",
            submission_url="https://github.com/example/python-calc",
            status=AssignmentSubmission.StatusChoices.SUBMITTED,
            score=Decimal("95.00"),
        )

        self.result_record = StudentResult.objects.create(
            student=self.student,
            course=self.course_web,
            assessment_title="Midterm Project",
            score=Decimal("84.00"),
            max_score=Decimal("100.00"),
            remarks="Excellent work",
        )

        Attendance.objects.create(
            student=self.student,
            course=self.course_web,
            date=today - timedelta(days=2),
            status=Attendance.StatusChoices.PRESENT,
            topic="CSS Grid & Flexbox",
        )
        Attendance.objects.create(
            student=self.student,
            course=self.course_python,
            date=today - timedelta(days=1),
            status=Attendance.StatusChoices.ABSENT,
            topic="Python Functions",
        )

        self.announcement = Announcement.objects.create(
            title="End of Semester Exams",
            message="Final exams will hold from Nov 10 – Nov 20.",
            category=Announcement.CategoryChoices.IMPORTANT,
            is_active=True,
        )

        self.notification1 = StudentNotification.objects.create(
            user=self.student,
            title="Assignment reminder",
            message="Your Web Development assignment is awaiting submission.",
            notification_type=StudentNotification.TypeChoices.ASSIGNMENT,
            is_read=False,
        )
        self.notification2 = StudentNotification.objects.create(
            user=self.student,
            title="Academy announcement",
            message="Check the latest academy announcements for updates.",
            notification_type=StudentNotification.TypeChoices.ANNOUNCEMENT,
            is_read=False,
        )
        self.other_notification = StudentNotification.objects.create(
            user=self.other_student,
            title="Private notification",
            message="For other student only.",
            is_read=False,
        )

        self.payment = StudentPayment.objects.create(
            student=self.student,
            reference="PAY-2026-001",
            amount=Decimal("55000.00"),
            description="First Installment Tuition",
            status=StudentPayment.StatusChoices.PAID,
        )

    def authenticate_student(self, user=None):
        target = user or self.student
        self.client.force_authenticate(user=target)

    def test_unauthenticated_access_is_rejected(self):
        endpoints = [
            reverse("students:student-dashboard"),
            reverse("students:student-profile-detail"),
            reverse("students:student-courses"),
            reverse("students:student-assignments"),
            reverse("students:student-grades"),
            reverse("students:student-attendance"),
            reverse("students:student-announcements"),
            reverse("students:student-notifications"),
            reverse("students:student-payments"),
        ]
        for url in endpoints:
            response = self.client.get(url)
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_student_role_cannot_access_student_endpoints(self):
        self.client.force_authenticate(user=self.instructor)
        response = self.client.get(reverse("students:student-dashboard"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_dashboard_endpoint(self):
        self.authenticate_student()
        response = self.client.get(reverse("students:student-dashboard"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertEqual(data["profile"]["full_name"], "Ikechukwu Stephen")
        self.assertEqual(data["profile"]["email"], "stephen@gmail.com")
        self.assertEqual(data["stats"]["enrolled_courses_count"], 2)
        self.assertEqual(data["stats"]["assignments_due_count"], 1)
        self.assertEqual(data["stats"]["overall_progress"], 85)
        self.assertEqual(data["stats"]["formatted_balance"], "₦45,000")
        self.assertEqual(data["stats"]["unread_notifications_count"], 2)
        self.assertEqual(len(data["courses"]), 2)
        self.assertEqual(len(data["upcoming_deadlines"]), 1)
        self.assertEqual(data["latest_announcement"]["title"], "End of Semester Exams")

    def test_student_profile_get_and_patch(self):
        self.authenticate_student()
        url = reverse("students:student-profile-detail")

        get_resp = self.client.get(url)
        self.assertEqual(get_resp.status_code, status.HTTP_200_OK)
        self.assertNotIn("password", get_resp.json())
        self.assertTrue(get_resp.json()["student_id"].startswith("STU"))

        patch_resp = self.client.patch(
            url,
            {
                "first_name": "Stephen",
                "last_name": "Ikechukwu",
                "course": "Software Engineering",
                "phone": "+2348012345678",
                "role": "ADMIN",
                "outstanding_balance": "0.00",
            },
            format="json",
        )
        self.assertEqual(patch_resp.status_code, status.HTTP_200_OK)
        body = patch_resp.json()
        self.assertEqual(body["full_name"], "Stephen Ikechukwu")
        self.assertEqual(body["course"], "Software Engineering")
        self.assertEqual(body["phone"], "+2348012345678")
        # Sensitive fields must remain unchanged
        self.student.refresh_from_db()
        self.profile.refresh_from_db()
        self.assertEqual(self.student.role, "STUDENT")
        self.assertEqual(self.profile.outstanding_balance, Decimal("45000.00"))

    def test_courses_list_enroll_and_progress_update(self):
        self.authenticate_student()
        list_url = reverse("students:student-courses")

        resp = self.client.get(list_url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.json()["count"], 2)

        search_resp = self.client.get(list_url, {"search": "Python"})
        self.assertEqual(search_resp.json()["count"], 1)
        self.assertEqual(search_resp.json()["results"][0]["title"], "Python")

        # Enroll in Django course
        enroll_resp = self.client.post(
            list_url,
            {"course_id": self.course_unregistered.id},
            format="json",
        )
        self.assertEqual(enroll_resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Enrollment.objects.filter(student=self.student).count(), 3)

        # Update course progress
        detail_url = reverse(
            "students:student-course-detail",
            kwargs={"course_id": self.course_unregistered.id},
        )
        patch_resp = self.client.patch(detail_url, {"progress": 55}, format="json")
        self.assertEqual(patch_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_resp.json()["course"]["progress"], 55)

    def test_assignments_and_submission_workflow(self):
        self.authenticate_student()
        list_url = reverse("students:student-assignments")

        resp = self.client.get(list_url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.json()
        self.assertEqual(data["count"], 2)
        self.assertEqual(data["pending_count"], 1)
        self.assertEqual(data["submitted_count"], 1)

        # Empty submission should fail validation
        submit_url = reverse(
            "students:student-assignment-submit",
            kwargs={"assignment_id": self.assignment_pending.id},
        )
        bad_resp = self.client.post(submit_url, {}, format="json")
        self.assertEqual(bad_resp.status_code, status.HTTP_400_BAD_REQUEST)

        # Valid submission
        good_resp = self.client.post(
            submit_url,
            {
                "submission_text": "My portfolio project is live.",
                "submission_url": "https://github.com/stephen/portfolio",
            },
            format="json",
        )
        self.assertEqual(good_resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(good_resp.json()["submission"]["status"], "submitted")

        # Deadlines should now be 0 since both assignments are submitted
        deadlines_resp = self.client.get(reverse("students:student-deadlines"))
        self.assertEqual(deadlines_resp.json()["count"], 0)

    def test_grades_and_results_endpoints(self):
        self.authenticate_student()
        for url_name in ("students:student-grades", "students:student-results"):
            resp = self.client.get(reverse(url_name))
            self.assertEqual(resp.status_code, status.HTTP_200_OK)
            body = resp.json()
            self.assertEqual(body["overall_progress"], 85)
            self.assertEqual(len(body["course_progress"]), 2)
            self.assertEqual(body["count"], 1)
            self.assertEqual(body["results"][0]["grade"], "A")

    def test_attendance_endpoint(self):
        self.authenticate_student()
        resp = self.client.get(reverse("students:student-attendance"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        body = resp.json()
        self.assertEqual(body["total_classes"], 2)
        self.assertEqual(body["present_count"], 1)
        self.assertEqual(body["absent_count"], 1)
        self.assertEqual(body["attendance_rate"], 50.0)

    def test_notifications_isolation_and_mark_read(self):
        self.authenticate_student()
        list_url = reverse("students:student-notifications")
        resp = self.client.get(list_url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.json()["unread_count"], 2)

        # Cannot mark another student's notification as read
        other_read_url = reverse(
            "students:student-notification-read",
            kwargs={"notification_id": self.other_notification.id},
        )
        forbidden_resp = self.client.post(other_read_url)
        self.assertEqual(forbidden_resp.status_code, status.HTTP_404_NOT_FOUND)

        # Mark single notification as read
        read_url = reverse(
            "students:student-notification-read",
            kwargs={"notification_id": self.notification1.id},
        )
        read_resp = self.client.post(read_url)
        self.assertEqual(read_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(read_resp.json()["unread_count"], 1)

        # Mark all notifications as read
        mark_all_resp = self.client.post(reverse("students:student-notifications-mark-all-read"))
        self.assertEqual(mark_all_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(mark_all_resp.json()["unread_count"], 0)

    def test_payments_endpoint(self):
        self.authenticate_student()
        resp = self.client.get(reverse("students:student-payments"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        body = resp.json()
        self.assertEqual(body["formatted_balance"], "₦45,000")
        self.assertEqual(body["amount_paid"], 55000.0)
        self.assertEqual(body["count"], 1)

    def test_email_verification_redirect_includes_jwt_tokens_for_dashboard(self):
        from urllib.parse import parse_qs, urlparse
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode

        unverified_student = User.objects.create_user(
            email="newstudent@gmail.com",
            password="StrongPassword123!",
            first_name="Chinedu",
            last_name="Okafor",
            role="STUDENT",
            is_verified=False,
        )
        uid = urlsafe_base64_encode(force_bytes(unverified_student.pk))
        token = default_token_generator.make_token(unverified_student)

        verify_url = reverse("verify_email", kwargs={"uid": uid, "token": token})
        resp = self.client.get(verify_url)
        self.assertEqual(resp.status_code, status.HTTP_302_FOUND)

        parsed = urlparse(resp["Location"])
        params = parse_qs(parsed.query)
        self.assertEqual(params.get("verified"), ["success"])
        self.assertTrue("access" in params and len(params["access"][0]) > 10)
        self.assertTrue("refresh" in params and len(params["refresh"][0]) > 10)

        # Authenticate using the access token from the redirect URL and fetch dashboard
        access_token = params["access"][0]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        dash_resp = self.client.get(reverse("students:student-dashboard"))
        self.assertEqual(dash_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(dash_resp.json()["profile"]["email"], "newstudent@gmail.com")
        self.assertEqual(dash_resp.json()["profile"]["full_name"], "Chinedu Okafor")

