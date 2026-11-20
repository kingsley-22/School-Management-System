from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from students.models import (
    Announcement,
    Assignment,
    AssignmentSubmission,
    Course,
    Enrollment,
    StudentNotification,
    StudentResult,
)
from .models import ClassSchedule, InstructorActivity

User = get_user_model()


class InstructorBackendIntegrationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email="admin@ifexa.test",
            password="AdminPassword123!",
            first_name="System",
            last_name="Admin",
            role="ADMIN",
            is_verified=True,
            is_approved=True,
        )
        self.student = User.objects.create_user(
            email="student@ifexa.test",
            password="StudentPassword123!",
            first_name="Ada",
            last_name="Lovelace",
            role="STUDENT",
            is_verified=True,
            is_approved=True,
        )
        self.instructor_b = User.objects.create_user(
            email="instructor.b@ifexa.test",
            password="InstructorB123!",
            first_name="Grace",
            last_name="Hopper",
            role="INSTRUCTOR",
            is_verified=True,
            is_approved=True,
        )
        self.unapproved_instructor = User.objects.create_user(
            email="pending.inst@ifexa.test",
            password="PendingInst123!",
            first_name="Pending",
            last_name="Instructor",
            role="INSTRUCTOR",
            is_verified=True,
            is_approved=False,
        )
        self.course_a = Course.objects.create(
            title="Backend Engineering",
            code="BE-101",
            category="python",
            description="Django & REST APIs",
            total_lessons=20,
            is_active=True,
        )
        self.course_b = Course.objects.create(
            title="Cybersecurity Basics",
            code="CS-201",
            category="other",
            description="Security fundamentals",
            instructor=self.instructor_b,
            instructor_name="Grace Hopper",
            total_lessons=12,
            is_active=True,
        )

    def _login(self, email, password):
        res = self.client.post(
            "/api/login/",
            {"email": email, "password": password},
            format="json",
        )
        self.assertEqual(res.status_code, 200, res.data)
        return res.data["access"]

    def _auth_client(self, email, password):
        token = self._login(email, password)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        return client

    def test_permissions_and_role_isolation(self):
        # Unauthenticated
        res = self.client.get("/api/instructor/dashboard/")
        self.assertEqual(res.status_code, 401)

        # Student denied
        student_client = self._auth_client("student@ifexa.test", "StudentPassword123!")
        self.assertEqual(student_client.get("/api/instructor/dashboard/").status_code, 403)
        self.assertEqual(student_client.get("/api/instructor/courses/").status_code, 403)

        # Unapproved instructor denied
        pending_client = self._auth_client("pending.inst@ifexa.test", "PendingInst123!")
        self.assertEqual(pending_client.get("/api/instructor/dashboard/").status_code, 403)

    def test_end_to_end_admin_instructor_student_workflow(self):
        admin_client = self._auth_client("admin@ifexa.test", "AdminPassword123!")

        # 1. Admin creates instructor with real hashed password
        create_res = admin_client.post(
            "/api/admin/instructors/",
            {
                "first_name": "Alan",
                "last_name": "Turing",
                "email": "alan@ifexa.test",
                "password": "StrongPassword123!",
                "confirm_password": "StrongPassword123!",
                "department": "Computer Science",
                "specialization": "Backend",
            },
            format="json",
        )
        self.assertEqual(create_res.status_code, 201, create_res.data)
        instructor_id = create_res.data["instructor"]["id"]

        # 2. Admin assigns course_a to Alan
        assign_res = admin_client.post(
            "/api/admin/assign-instructor/",
            {"instructor_id": instructor_id, "course_id": self.course_a.id},
            format="json",
        )
        self.assertEqual(assign_res.status_code, 200, assign_res.data)

        # 3. Instructor Alan logs in with credentials created by Admin
        inst_client = self._auth_client("alan@ifexa.test", "StrongPassword123!")

        # Profile GET & PATCH
        prof_res = inst_client.get("/api/instructor/profile/")
        self.assertEqual(prof_res.status_code, 200)
        self.assertEqual(prof_res.data["full_name"], "Alan Turing")
        self.assertEqual(prof_res.data["initials"], "AT")

        patch_res = inst_client.patch(
            "/api/instructor/profile/",
            {"phone": "08012345678", "department": "Engineering"},
            format="json",
        )
        self.assertEqual(patch_res.status_code, 200)
        self.assertEqual(patch_res.data["phone"], "08012345678")

        # 4. Instructor sees assigned course_a, NOT instructor_b's course_b
        courses_res = inst_client.get("/api/instructor/courses/")
        self.assertEqual(courses_res.status_code, 200)
        course_ids = [c["id"] for c in courses_res.data["results"]]
        self.assertIn(self.course_a.id, course_ids)
        self.assertNotIn(self.course_b.id, course_ids)

        # Instructor A cannot modify or delete Instructor B's course
        self.assertEqual(
            inst_client.patch(f"/api/instructor/courses/{self.course_b.id}/", {"title": "Hacked"}, format="json").status_code,
            404,
        )
        self.assertEqual(
            inst_client.delete(f"/api/instructor/courses/{self.course_b.id}/").status_code,
            404,
        )

        # 5. Instructor creates, edits, and deletes own course
        new_course_res = inst_client.post(
            "/api/instructor/courses/",
            {
                "title": "Algorithms 101",
                "description": "Data structures and algorithms",
                "category": "python",
                "status": "Active",
                "lessons": 16,
            },
            format="json",
        )
        self.assertEqual(new_course_res.status_code, 201, new_course_res.data)
        new_course_id = new_course_res.data["course"]["id"]

        edit_course_res = inst_client.patch(
            f"/api/instructor/courses/{new_course_id}/",
            {"status": "Draft", "lessons": 18},
            format="json",
        )
        self.assertEqual(edit_course_res.status_code, 200)
        self.assertEqual(edit_course_res.data["course"]["status"], "Draft")
        self.assertEqual(edit_course_res.data["course"]["lessons_count"], 18)

        # 6. Instructor enrolls student into course_a
        enroll_res = inst_client.post(
            "/api/instructor/students/",
            {
                "name": "Ada Lovelace",
                "email": "student@ifexa.test",
                "course_id": self.course_a.id,
                "status": "Active",
            },
            format="json",
        )
        self.assertEqual(enroll_res.status_code, 201, enroll_res.data)
        self.assertTrue(Enrollment.objects.filter(student=self.student, course=self.course_a).exists())

        students_list = inst_client.get("/api/instructor/students/")
        self.assertEqual(students_list.status_code, 200)
        self.assertEqual(students_list.data["stats"]["total_students"], 1)

        # 7. Instructor schedules a class -> enrolled student gets a notification
        tomorrow = (timezone.localdate() + timedelta(days=1)).isoformat()
        sched_res = inst_client.post(
            "/api/instructor/classes/",
            {"course_id": self.course_a.id, "date": tomorrow, "time": "10:30"},
            format="json",
        )
        self.assertEqual(sched_res.status_code, 201, sched_res.data)
        class_id = sched_res.data["class_schedule"]["id"]
        self.assertTrue(
            StudentNotification.objects.filter(
                user=self.student,
                title=f"Upcoming Class: {self.course_a.title}",
            ).exists()
        )

        # 8. Instructor creates assignment -> student submits -> instructor grades -> student sees grade
        due_date = (timezone.localdate() + timedelta(days=5)).isoformat()
        asgn_res = inst_client.post(
            "/api/instructor/assignments/",
            {
                "title": "Build REST API",
                "course_id": self.course_a.id,
                "description": "Implement DRF endpoints",
                "due_date": due_date,
                "max_score": 100,
            },
            format="json",
        )
        self.assertEqual(asgn_res.status_code, 201, asgn_res.data)
        assignment_id = asgn_res.data["assignment"]["id"]

        student_client = self._auth_client("student@ifexa.test", "StudentPassword123!")
        submit_res = student_client.post(
            f"/api/students/assignments/{assignment_id}/submit/",
            {"submission_text": "Here is my completed API.", "submission_url": "https://example.com/repo"},
            format="json",
        )
        self.assertEqual(submit_res.status_code, 201, submit_res.data)

        # Instructor receives submission notification
        notif_res = inst_client.get("/api/instructor/notifications/")
        self.assertEqual(notif_res.status_code, 200)
        self.assertGreaterEqual(notif_res.data["unread_count"], 1)

        # Instructor views submissions and grades it
        subs_res = inst_client.get(f"/api/instructor/assignments/{assignment_id}/submissions/")
        self.assertEqual(subs_res.status_code, 200)
        self.assertEqual(subs_res.data["count"], 1)
        submission_id = subs_res.data["results"][0]["id"]

        # Instructor B cannot grade Instructor A's submission
        inst_b_client = self._auth_client("instructor.b@ifexa.test", "InstructorB123!")
        self.assertEqual(
            inst_b_client.post(f"/api/instructor/submissions/{submission_id}/grade/", {"score": 50}, format="json").status_code,
            404,
        )

        grade_res = inst_client.post(
            f"/api/instructor/submissions/{submission_id}/grade/",
            {"score": 92, "feedback": "Excellent architecture!"},
            format="json",
        )
        self.assertEqual(grade_res.status_code, 200, grade_res.data)
        self.assertEqual(grade_res.data["submission"]["status"], "GRADED")
        self.assertEqual(grade_res.data["submission"]["score"], 92.0)

        # Student sees the grade on /api/students/grades/
        student_grades = student_client.get("/api/students/grades/")
        self.assertEqual(student_grades.status_code, 200)
        self.assertTrue(StudentResult.objects.filter(student=self.student, course=self.course_a, score=92).exists())

        # 9. Announcements CRUD
        ann_res = inst_client.post(
            "/api/instructor/announcements/",
            {
                "title": "Exam Prep",
                "description": "Review REST serializers before Friday.",
                "category": "important",
                "course_id": self.course_a.id,
            },
            format="json",
        )
        self.assertEqual(ann_res.status_code, 201, ann_res.data)
        ann_id = ann_res.data["announcement"]["id"]
        self.assertEqual(
            inst_client.patch(f"/api/instructor/announcements/{ann_id}/", {"title": "Final Exam Prep"}, format="json").status_code,
            200,
        )
        self.assertEqual(inst_client.delete(f"/api/instructor/announcements/{ann_id}/").status_code, 200)

        # 10. Dashboard summary, notifications mark-all-read, activities delete, class delete
        dash_res = inst_client.get("/api/instructor/dashboard/")
        self.assertEqual(dash_res.status_code, 200)
        self.assertEqual(dash_res.data["stats"]["total_courses"], 2)
        self.assertEqual(dash_res.data["stats"]["total_students"], 1)
        self.assertEqual(dash_res.data["stats"]["total_assignments"], 1)
        self.assertGreaterEqual(len(dash_res.data["recent_activities"]), 1)

        mark_res = inst_client.post("/api/instructor/notifications/mark-all-read/")
        self.assertEqual(mark_res.status_code, 200)
        self.assertEqual(mark_res.data["unread_count"], 0)

        act_id = dash_res.data["recent_activities"][0]["id"]
        self.assertEqual(inst_client.delete(f"/api/instructor/activities/{act_id}/").status_code, 200)
        self.assertEqual(inst_client.delete(f"/api/instructor/classes/{class_id}/").status_code, 200)
        self.assertEqual(inst_client.delete(f"/api/instructor/courses/{new_course_id}/").status_code, 200)
