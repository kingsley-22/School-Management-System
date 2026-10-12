# IFEXA Academy Management System

A full-stack Academy Management System built with Python and Django to help manage student records, courses, instructors, attendance, assignments, and academic performance.

The project aims to simplify the daily operations of an academy by providing a centralized platform for administrators, instructors, and students.

## Project Objectives

- Centralize student and instructor records.
- Organize courses and academic activities.
- Track attendance and assignment grades.
- Provide secure user authentication.
- Restrict access according to user roles.
- Improve the efficiency of academy administration.

## Planned Features

### 1. User Authentication
- User registration
- Secure login and logout
- Password validation and authentication
- Role-based access control

### 2. Administrator
- Manage student and instructor records.
- Create, view, update, and delete platform records.
- Manage courses, assignments, and announcements.
- Oversee attendance and academic activities.

### 3. Instructor
- View student lists.
- Record student attendance.
- Grade assignments.
- Access relevant course information.

### 4. Student
- View personal profile information.
- Access attendance records.
- View assignment grades.
- Access relevant course information.

## Technology Stack

**Backend**
- Python
- Django
- SQLite for development

**Frontend**
- The frontend implementation is maintained in the `frontend/` directory.

## Project Structure

```text
School-Management-System/
├── backend/
│   ├── accounts/
│   ├── announcements/
│   ├── assignments/
│   ├── config/
│   ├── courses/
│   ├── instructors/
│   ├── payments/
│   ├── students/
│   ├── manage.py
│   └── requirements.txt
├── frontend/
└── README.md
```

## Getting Started

### Prerequisites

- Python compatible with the project's Django version
- Git
- A terminal or command-line application

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/kingsley-22/School-Management-System.git
   ```

2. Navigate to the backend directory:

   ```bash
   cd School-Management-System/backend
   ```

3. Create and activate a virtual environment:

   ```bash
   python -m venv venv
   ```

   Windows:

   ```bash
   venv\Scripts\activate
   ```

   macOS/Linux:

   ```bash
   source venv/bin/activate
   ```

4. Install the dependencies:

   ```bash
   pip install -r requirements.txt
   ```

5. Apply database migrations:

   ```bash
   python manage.py migrate
   ```

6. Create an administrator account:

   ```bash
   python manage.py createsuperuser
   ```

7. Start the development server:

   ```bash
   python manage.py runserver
   ```

8. Open `http://127.0.0.1:8000/` in your browser.

## Contributing

Contributions are welcome from developers working to improve the Academy Management System.

1. Review existing issues before starting new work.
2. Create a feature branch for your changes.
3. Write clear, maintainable code.
4. Test your changes before submitting them.
5. Open a pull request describing the changes and their purpose.
6. Respond to review feedback and update your pull request when necessary.

Suggested branch naming convention:

- `feature/feature-name`
- `fix/issue-name`
- `docs/documentation-update`

## Development Status

This project is under active development. Features may be incomplete or subject to change as the team implements and tests the system.

## Project Repository

[School-Management-System on GitHub](https://github.com/kingsley-22/School-Management-System)
