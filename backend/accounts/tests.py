from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from students.models import Course, Enrollment

User = get_user_model()


class AdminIntegrationAPITests(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            email='admin@ifexa.com',
            password='AdminStrongPass123!',
            first_name='Ifexa',
            last_name='Admin',
            role='ADMIN',
            is_verified=True,
            is_approved=True,
        )
        self.student_a = User.objects.create_user(
            email='student.a@ifexa.com',
            password='StudentAPass123!',
            first_name='Chika',
            last_name='Okafor',
            role='STUDENT',
            is_verified=True,
        )
        self.student_b = User.objects.create_user(
            email='student.b@ifexa.com',
            password='StudentBPass123!',
            first_name='Emeka',
            last_name='Nwosu',
            role='STUDENT',
            is_verified=True,
        )
        self.course = Course.objects.create(
            title='Web Development Fundamentals',
            code='WEB101',
            category='Technology',
            level='Beginner',
            hours=40,
            description='Learn HTML, CSS, and JavaScript.',
            instructor_name='Ada James',
            is_active=True,
        )

    def test_role_permissions_block_students_and_instructors_from_admin_endpoints(self):
        # Student cannot access admin endpoints
        self.client.force_authenticate(user=self.student_a)
        for url in [
            reverse('admin-dashboard'),
            reverse('admin-students'),
            reverse('admin-instructors'),
            reverse('admin-courses'),
            reverse('admin-assign-course'),
        ]:
            resp = self.client.get(url) if 'assign' not in url else self.client.post(url, {})
            self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_create_instructor_hashes_password_and_allows_instructor_login(self):
        self.client.force_authenticate(user=self.admin_user)

        # Password mismatch must fail
        mismatch_resp = self.client.post(
            reverse('admin-instructors'),
            {
                'first_name': 'Daniel',
                'last_name': 'Okoro',
                'email': 'daniel.okoro@ifexa.com',
                'phone': '+2348011112222',
                'department': 'Computer Science',
                'specialization': 'Backend Engineering',
                'username': 'daniel.okoro',
                'password': 'InstructorSecure123!',
                'confirm_password': 'DifferentPassword123!',
            },
            format='json',
        )
        self.assertEqual(mismatch_resp.status_code, status.HTTP_400_BAD_REQUEST)

        # Valid instructor creation
        create_resp = self.client.post(
            reverse('admin-instructors'),
            {
                'first_name': 'Daniel',
                'last_name': 'Okoro',
                'email': 'daniel.okoro@ifexa.com',
                'phone': '+2348011112222',
                'department': 'Computer Science',
                'specialization': 'Backend Engineering',
                'username': 'daniel.okoro',
                'password': 'InstructorSecure123!',
                'confirm_password': 'InstructorSecure123!',
            },
            format='json',
        )
        self.assertEqual(create_resp.status_code, status.HTTP_201_CREATED)
        instructor_data = create_resp.json()['instructor']
        self.assertNotIn('password', instructor_data)
        self.assertEqual(instructor_data['email'], 'daniel.okoro@ifexa.com')
        self.assertTrue(instructor_data['instructor_id'].startswith('INS-'))

        # Verify database stores a Django password hash, never plaintext
        instructor_user = User.objects.get(email='daniel.okoro@ifexa.com')
        self.assertNotEqual(instructor_user.password, 'InstructorSecure123!')
        self.assertTrue(instructor_user.password.startswith('pbkdf2_'))
        self.assertTrue(instructor_user.check_password('InstructorSecure123!'))
        self.assertEqual(instructor_user.role, 'INSTRUCTOR')
        self.assertTrue(instructor_user.is_approved)
        self.assertTrue(instructor_user.is_verified)

        # Instructor logs in using the existing login endpoint
        self.client.force_authenticate(user=None)
        login_resp = self.client.post(
            reverse('login'),
            {
                'email': 'daniel.okoro@ifexa.com',
                'password': 'InstructorSecure123!',
            },
            format='json',
        )
        self.assertEqual(login_resp.status_code, status.HTTP_200_OK)
        tokens = login_resp.json()
        self.assertIn('access', tokens)
        self.assertEqual(tokens['user']['role'], 'INSTRUCTOR')

        # Instructor can access instructor profile endpoint with JWT
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        inst_prof_resp = self.client.get(reverse('instructor-profile'))
        self.assertEqual(inst_prof_resp.status_code, status.HTTP_200_OK)

        # Instructor cannot access Admin endpoints
        admin_dash_resp = self.client.get(reverse('admin-dashboard'))
        self.assertEqual(admin_dash_resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_assign_course_to_student_and_student_visibility(self):
        self.client.force_authenticate(user=self.admin_user)

        # Assign course to Student A
        assign_resp = self.client.post(
            reverse('admin-assign-course'),
            {
                'student_id': self.student_a.id,
                'course_id': self.course.id,
            },
            format='json',
        )
        self.assertEqual(assign_resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            Enrollment.objects.filter(student=self.student_a, course=self.course).exists()
        )

        # Duplicate assignment must be prevented
        dup_resp = self.client.post(
            reverse('admin-assign-course'),
            {
                'student_id': self.student_a.id,
                'course_id': self.course.id,
            },
            format='json',
        )
        self.assertEqual(dup_resp.status_code, status.HTTP_400_BAD_REQUEST)

        # Invalid student ID or course ID must fail
        bad_student_resp = self.client.post(
            reverse('admin-assign-course'),
            {'student_id': 999999, 'course_id': self.course.id},
            format='json',
        )
        self.assertEqual(bad_student_resp.status_code, status.HTTP_404_NOT_FOUND)

        # Student A logs in and sees the assigned course on their dashboard
        self.client.force_authenticate(user=self.student_a)
        dash_a = self.client.get(reverse('students:student-dashboard')).json()
        self.assertEqual(dash_a['stats']['enrolled_courses_count'], 1)
        self.assertEqual(dash_a['courses'][0]['title'], 'Web Development Fundamentals')

        # Student B logs in and does NOT see Student A's course
        self.client.force_authenticate(user=self.student_b)
        dash_b = self.client.get(reverse('students:student-dashboard')).json()
        self.assertEqual(dash_b['stats']['enrolled_courses_count'], 0)

    def test_admin_course_and_announcement_crud(self):
        self.client.force_authenticate(user=self.admin_user)

        # Create course
        c_resp = self.client.post(
            reverse('admin-courses'),
            {
                'title': 'Python Data Science',
                'instructor': 'Dr. Ada James',
                'category': 'Science',
                'level': 'Intermediate',
                'hours': 36,
                'description': 'Data analysis and visualization in Python.',
            },
            format='json',
        )
        self.assertEqual(c_resp.status_code, status.HTTP_201_CREATED)
        course_id = c_resp.json()['course']['id']

        # Create announcement
        a_resp = self.client.post(
            reverse('admin-announcements'),
            {
                'title': 'Orientation Schedule',
                'category': 'Events',
                'audience': 'Students',
                'date': '2026-11-20',
                'status': 'Published',
                'body': 'Welcome orientation starts at 9:00 AM.',
            },
            format='json',
        )
        self.assertEqual(a_resp.status_code, status.HTTP_201_CREATED)
        ann_id = a_resp.json()['announcement']['id']

        # Toggle announcement status to Draft
        patch_resp = self.client.patch(
            reverse('admin-announcement-detail', kwargs={'announcement_id': ann_id}),
            {'status': 'Draft'},
            format='json',
        )
        self.assertEqual(patch_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_resp.json()['announcement']['status'], 'Draft')

        # Delete course
        del_resp = self.client.delete(
            reverse('admin-course-detail', kwargs={'course_id': course_id})
        )
        self.assertEqual(del_resp.status_code, status.HTTP_200_OK)
