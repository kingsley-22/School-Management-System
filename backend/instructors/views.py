from django.shortcuts import render

# Create your views here.
def instructor_dashboard(request):
    return render(request, 'instructor/dashboard.html')

def instructor_courses(request):
    return render(request, 'instructor/courses.html')

def instructor_announcements(request):
    return render(request, 'instructor/announcements.html')

def instructor_students(request):
    return render(request, 'instructor/students.html')

def instructor_assignments(request):
    return render(request, 'instructor/assignments.html')