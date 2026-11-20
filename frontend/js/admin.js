// ==========================================
// IFEXA ACADEMY — ADMIN DASHBOARD JAVASCRIPT
// Connected to Django REST Framework Admin API
// ==========================================

const API_BASE_URL = (
    window.VITE_API_URL ||
    window.API_BASE_URL ||
    "http://127.0.0.1:8000/api"
).replace(/\/+$/, "");

const LOGIN_PAGE_URL = "../home/login.html";

const DEFAULT_TECH_COURSES = [
    { id: "CSC-101", code: "CSC-101", title: "Full-Stack Web Development", category: "Web Development" },
    { id: "CSC-102", code: "CSC-102", title: "Frontend Engineering with React & Next.js", category: "Frontend Development" },
    { id: "CSC-103", code: "CSC-103", title: "Backend Engineering with Python & Django", category: "Backend Development" },
    { id: "CSC-104", code: "CSC-104", title: "JavaScript & TypeScript Mastery", category: "Programming" },
    { id: "CSC-105", code: "CSC-105", title: "UI/UX Product Design & Prototyping", category: "Product Design" },
    { id: "CSC-106", code: "CSC-106", title: "Data Science & Machine Learning", category: "Data & AI" },
    { id: "CSC-107", code: "CSC-107", title: "Artificial Intelligence & Deep Learning", category: "Data & AI" },
    { id: "CSC-108", code: "CSC-108", title: "Cybersecurity & Ethical Hacking", category: "Cybersecurity" },
    { id: "CSC-109", code: "CSC-109", title: "Cloud Computing with AWS & Azure", category: "Cloud & DevOps" },
    { id: "CSC-110", code: "CSC-110", title: "DevOps, CI/CD, Docker & Kubernetes", category: "Cloud & DevOps" },
    { id: "CSC-111", code: "CSC-111", title: "Mobile App Development with Flutter & Dart", category: "Mobile Development" },
    { id: "CSC-112", code: "CSC-112", title: "React Native Mobile App Engineering", category: "Mobile Development" },
    { id: "CSC-113", code: "CSC-113", title: "Database Engineering, SQL & PostgreSQL", category: "Backend Development" },
    { id: "CSC-114", code: "CSC-114", title: "Data Analytics with Python, SQL & Power BI", category: "Data & AI" },
    { id: "CSC-115", code: "CSC-115", title: "Blockchain & Web3 Smart Contract Development", category: "Software Engineering" },
    { id: "CSC-116", code: "CSC-116", title: "Software Engineering & System Design", category: "Software Engineering" },
    { id: "CSC-117", code: "CSC-117", title: "Node.js, Express & Microservices API Development", category: "Backend Development" },
    { id: "CSC-118", code: "CSC-118", title: "Quality Assurance (QA) & Automated Software Testing", category: "Software Engineering" },
    { id: "CSC-119", code: "CSC-119", title: "Linux Server Administration & Bash Scripting", category: "Cloud & DevOps" },
    { id: "CSC-120", code: "CSC-120", title: "Tech Product Management & Agile Delivery", category: "Product Design" },
];

let students = [];
let instructors = [];
let courses = [...DEFAULT_TECH_COURSES];
let activities = [];
let adminProfile = {
    name: "",
    username: "",
    email: "",
    phone: "",
    department: "Administration",
    role: "Administration",
    bio: "",
    avatar_url: "",
};

let profileImageData = "";
let toastTimer = null;

const $ = id => document.getElementById(id);

// ==========================================
// AUTHENTICATION & CENTRAL API CLIENT
// ==========================================

function getAccessToken() {
    return (
        sessionStorage.getItem("accessToken") ||
        localStorage.getItem("accessToken") ||
        ""
    );
}

function getRefreshToken() {
    return (
        sessionStorage.getItem("refreshToken") ||
        localStorage.getItem("refreshToken") ||
        ""
    );
}

function getStoredUser() {
    try {
        const raw =
            sessionStorage.getItem("user") ||
            localStorage.getItem("user");
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function clearAuthState() {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("adminLoggedIn");
}

function redirectToLogin() {
    clearAuthState();
    window.location.replace(LOGIN_PAGE_URL);
}

function enforceAdminAuth() {
    const access = getAccessToken();
    const refresh = getRefreshToken();

    if (!access && !refresh) {
        redirectToLogin();
        return false;
    }

    const user = getStoredUser();
    if (user && user.role && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
        if (user.role === "STUDENT") {
            window.location.replace("../student/dashboard.html");
            return false;
        }
        if (user.role === "INSTRUCTOR") {
            window.location.replace("../instructor/dashboard.html");
            return false;
        }
        redirectToLogin();
        return false;
    }

    return true;
}

async function refreshAccessToken() {
    const refresh = getRefreshToken();
    if (!refresh) return null;

    try {
        const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify({ refresh }),
        });

        if (!response.ok) return null;

        const data = await response.json();
        if (data && data.access) {
            sessionStorage.setItem("accessToken", data.access);
            localStorage.setItem("accessToken", data.access);
            if (data.refresh) {
                sessionStorage.setItem("refreshToken", data.refresh);
                localStorage.setItem("refreshToken", data.refresh);
            }
            return data.access;
        }
        return null;
    } catch {
        return null;
    }
}

async function apiRequest(endpoint, options = {}, retried = false) {
    let token = getAccessToken();
    if (!token && !retried) {
        token = await refreshAccessToken();
        if (!token) {
            redirectToLogin();
            throw new Error("Authentication required.");
        }
    }

    const headers = {
        "Accept": "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        ...(options.headers || {}),
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401 && !retried) {
        const newToken = await refreshAccessToken();
        if (newToken) {
            return apiRequest(endpoint, options, true);
        }
        redirectToLogin();
        throw new Error("Session expired. Please log in again.");
    }

    if (response.status === 403) {
        redirectToLogin();
        throw new Error("You do not have permission to access admin resources.");
    }

    const text = await response.text();
    let data = {};
    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            data = { error: "Unexpected response from server." };
        }
    }

    if (!response.ok) {
        const msg =
            data.error ||
            data.detail ||
            (typeof data === "object"
                ? Object.entries(data)
                      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(" ") : v}`)
                      .join(" ")
                : "") ||
            `Request failed (${response.status})`;
        throw new Error(msg);
    }

    return data;
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[char]));
}

function getInitials(name) {
    return String(name || "Admin")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(word => word.charAt(0).toUpperCase())
        .join("");
}

function getCurrentYear() {
    return new Date().getFullYear();
}

function formatDate() {
    return new Date().toLocaleDateString("en-NG", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function formatTime() {
    return new Date().toLocaleTimeString("en-NG", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

// ==========================================
// ACTIVITY MANAGEMENT
// ==========================================

function logActivity(title, description, icon = "fa-circle-check") {
    const activity = {
        title,
        description,
        icon,
        time: formatTime()
    };

    activities.unshift(activity);
    activities = activities.slice(0, 8);
    renderActivities();
}

function renderActivities() {
    const activityList = $("activityList");
    if (!activityList) return;

    if (activities.length === 0) {
        activityList.innerHTML = `
            <li>
                <span class="activity-mark">
                    <i class="fa-solid fa-clock"></i>
                </span>
                <div>
                    <strong>No recent activity</strong>
                    <p>Your recent actions will appear here.</p>
                </div>
            </li>
        `;
        return;
    }

    activityList.innerHTML = activities.map(activity => `
        <li>
            <span class="activity-mark">
                <i class="fa-solid ${escapeHTML(activity.icon)}"></i>
            </span>
            <div>
                <strong>${escapeHTML(activity.title)}</strong>
                <p>${escapeHTML(activity.description)}</p>
                <small>${escapeHTML(activity.time)}</small>
            </div>
        </li>
    `).join("");
}

// ==========================================
// LOAD DASHBOARD DATA FROM BACKEND
// ==========================================

async function loadAdminDashboard() {
    try {
        const data = await apiRequest("/admin/dashboard/");
        students = Array.isArray(data.students) ? data.students : [];
        instructors = Array.isArray(data.instructors) ? data.instructors : [];
        courses =
            Array.isArray(data.courses) && data.courses.length > 0
                ? data.courses
                : [...DEFAULT_TECH_COURSES];

        if (data.profile) {
            adminProfile = {
                name: data.profile.name || data.profile.full_name || data.profile.email,
                username: data.profile.username || "",
                email: data.profile.email || "",
                phone: data.profile.phone || "Not provided",
                department: data.profile.department || "Administration",
                role: data.profile.role || "Administration",
                bio: data.profile.bio || "",
                avatar_url: data.profile.avatar_url || "",
            };
            profileImageData = adminProfile.avatar_url || "";
        }

        renderProfile();
        populateAssignmentSelects();
        renderStudents();
        renderInstructors();
        updateDashboardStats(data.stats);
    } catch (error) {
        showToast(error.message || "Failed to load admin dashboard data.");
    }
}

// ==========================================
// DASHBOARD STATISTICS
// ==========================================

function updateDashboardStats(serverStats = null) {
    const totalStudentsCount = serverStats?.total_students ?? students.length;
    const totalInstructorsCount = serverStats?.total_instructors ?? instructors.length;
    const totalCoursesCount = serverStats?.total_courses ?? courses.length;
    const pendingStudentsCount =
        serverStats?.pending_approvals ??
        students.filter(student => student.status === "Pending").length;

    if ($("totalStudents")) {
        $("totalStudents").textContent = totalStudentsCount;
    }

    if ($("totalInstructors")) {
        $("totalInstructors").textContent = totalInstructorsCount;
    }

    if ($("totalCourses")) {
        $("totalCourses").textContent = totalCoursesCount;
    }

    if ($("totalPending")) {
        $("totalPending").textContent = pendingStudentsCount;
    }
}

function populateAssignmentSelects() {
    const studentSelect = $("assignStudentSelect");
    if (studentSelect) {
        const currentStudentVal = studentSelect.value;
        studentSelect.innerHTML =
            '<option value="">Select a student...</option>' +
            students
                .map(
                    s =>
                        `<option value="${escapeHTML(s.user_id)}">${escapeHTML(s.name)} (${escapeHTML(s.id)})</option>`
                )
                .join("");
        if (currentStudentVal) studentSelect.value = currentStudentVal;
    }

    const instructorSelect = $("assignInstructorSelect");
    if (instructorSelect) {
        const currentInstVal = instructorSelect.value;
        instructorSelect.innerHTML =
            '<option value="">Select an instructor...</option>' +
            instructors
                .map(
                    inst =>
                        `<option value="${escapeHTML(inst.user_id)}">${escapeHTML(inst.name)} (${escapeHTML(inst.id)})</option>`
                )
                .join("");
        if (currentInstVal) instructorSelect.value = currentInstVal;
    }

    const availableCourses =
        Array.isArray(courses) && courses.length > 0 ? courses : DEFAULT_TECH_COURSES;
    const courseOptionsHtml = availableCourses
        .map(
            c =>
                `<option value="${escapeHTML(c.id)}">${escapeHTML(c.title)}</option>`
        )
        .join("");

    const assignCourseSelect = $("assignCourseSelect");
    if (assignCourseSelect) {
        const currentCourseVal = assignCourseSelect.value;
        assignCourseSelect.innerHTML =
            '<option value="">Select a course...</option>' + courseOptionsHtml;
        if (currentCourseVal) assignCourseSelect.value = currentCourseVal;
    }

    const inputStudentCourse = $("inputStudentCourse");
    if (inputStudentCourse) {
        inputStudentCourse.innerHTML =
            '<option value="">Select a course (optional)</option>' + courseOptionsHtml;
    }

    const instructorCourseSelect = $("instructorCourseSelect");
    if (instructorCourseSelect) {
        instructorCourseSelect.innerHTML =
            '<option value="">Select a course (optional)</option>' + courseOptionsHtml;
    }

    const assignInstructorCourseSelect = $("assignInstructorCourseSelect");
    if (assignInstructorCourseSelect) {
        const currentInstCourseVal = assignInstructorCourseSelect.value;
        assignInstructorCourseSelect.innerHTML =
            '<option value="">Select a course...</option>' + courseOptionsHtml;
        if (currentInstCourseVal) assignInstructorCourseSelect.value = currentInstCourseVal;
    }
}

// ==========================================
// STUDENT MANAGEMENT
// ==========================================

function renderStudents() {
    const studentList = $("studentList");
    if (!studentList) return;

    const searchValue = $("studentSearch")
        ? $("studentSearch").value.toLowerCase().trim()
        : "";

    const statusValue = $("statusFilter")
        ? $("statusFilter").value
        : "all";

    const filteredStudents = students.filter(student => {
        const courseTitles = (student.assigned_courses || [])
            .map(c => c.title)
            .join(" ");
        const searchableText = [
            student.id,
            student.name,
            student.email,
            student.phone,
            student.department,
            student.username,
            courseTitles,
        ].join(" ").toLowerCase();

        const matchesSearch = searchableText.includes(searchValue);
        const matchesStatus =
            statusValue === "all" ||
            student.status === statusValue;

        return matchesSearch && matchesStatus;
    });

    if (filteredStudents.length === 0) {
        studentList.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    No student records found.
                </td>
            </tr>
        `;
    } else {
        studentList.innerHTML = filteredStudents.map(student => {
            const assignedList = Array.isArray(student.assigned_courses) && student.assigned_courses.length > 0
                ? student.assigned_courses.map(c => escapeHTML(c.title)).join(", ")
                : "None assigned";

            return `
            <tr>
                <td>
                    <strong>${escapeHTML(student.id)}</strong>
                </td>

                <td>
                    <div class="student-name">
                        <strong>${escapeHTML(student.name)}</strong>
                    </div>
                </td>

                <td>${escapeHTML(student.email)}</td>

                <td>${escapeHTML(student.phone || "—")}</td>

                <td>${escapeHTML(student.department || "—")}</td>

                <td>${assignedList}</td>

                <td>${escapeHTML(student.username)}</td>

                <td>
                    <span class="status-badge ${student.status === "Approved" ? "approved" : "pending"}">
                        ${escapeHTML(student.status)}
                    </span>
                </td>

                <td>
                    <div class="action-buttons">
                        ${
                            student.status === "Pending"
                            ? `
                                <button
                                    type="button"
                                    class="approve-btn"
                                    onclick="approveStudent('${escapeHTML(student.user_id)}')"
                                    title="Approve student"
                                >
                                    <i class="fa-solid fa-check"></i>
                                </button>
                            `
                            : ""
                        }

                        <button
                            type="button"
                            class="approve-btn"
                            onclick="selectStudentForCourse('${escapeHTML(student.user_id)}')"
                            title="Assign course to student"
                        >
                            <i class="fa-solid fa-book-open"></i>
                        </button>

                        <button
                            type="button"
                            class="delete-btn"
                            onclick="deleteStudent('${escapeHTML(student.user_id)}')"
                            title="Delete student"
                        >
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        }).join("");
    }

    if ($("recordCount")) {
        $("recordCount").textContent =
            `Showing ${filteredStudents.length} of ${students.length} students`;
    }

    updateDashboardStats();
}

function selectStudentForCourse(userId) {
    const select = $("assignStudentSelect");
    if (select) {
        select.value = String(userId);
        $("assignCoursePanel")?.scrollIntoView({ behavior: "smooth", block: "center" });
        $("assignCourseSelect")?.focus();
    }
}

async function addStudent(event) {
    event.preventDefault();

    const name = $("inputName").value.trim();
    const email = $("inputEmail").value.trim();
    const phone = $("inputPhoneNumber").value.trim();
    const department = $("inputDepartment").value.trim();
    const username = $("inputUsername").value.trim();
    const courseId = $("inputStudentCourse")?.value || "";

    if (!name || !email || !phone || !department || !username) {
        showToast("Please complete all student fields.");
        return;
    }

    try {
        const res = await apiRequest("/admin/students/", {
            method: "POST",
            body: JSON.stringify({
                name,
                email,
                phone,
                department,
                username,
                course_id: courseId || null,
            }),
        });

        $("Add_student").reset();
        await loadAdminDashboard();

        logActivity(
            "New student registered",
            `${res.student.name} (${res.student.id}) was added to the database.`,
            "fa-user-plus"
        );
        showToast(`Student added! ID: ${res.student.id}`);
    } catch (error) {
        showToast(error.message || "Could not add student.");
    }
}

async function assignCourseToStudent(event) {
    event.preventDefault();

    const studentId = $("assignStudentSelect")?.value;
    const courseId = $("assignCourseSelect")?.value;

    if (!studentId || !courseId) {
        showToast("Please select both a student and a course.");
        return;
    }

    try {
        const res = await apiRequest("/admin/assign-course/", {
            method: "POST",
            body: JSON.stringify({
                student_id: studentId,
                course_id: courseId,
            }),
        });

        $("Assign_course")?.reset();
        await loadAdminDashboard();

        logActivity(
            "Course assigned",
            res.message || "Course assigned to student.",
            "fa-book-open"
        );
        showToast(res.message || "Course assigned successfully!");
    } catch (error) {
        showToast(error.message || "Failed to assign course.");
    }
}

async function approveStudent(studentUserId) {
    const student = students.find(
        item => String(item.user_id) === String(studentUserId) || String(item.id) === String(studentUserId)
    );
    if (!student) return;

    try {
        await apiRequest(`/admin/students/${student.user_id}/approve/`, {
            method: "POST",
        });
        await loadAdminDashboard();

        logActivity(
            "Student approved",
            `${student.name} has been approved.`,
            "fa-user-check"
        );
        showToast("Student approved successfully!");
    } catch (error) {
        showToast(error.message || "Failed to approve student.");
    }
}

async function deleteStudent(studentUserId) {
    const student = students.find(
        item => String(item.user_id) === String(studentUserId) || String(item.id) === String(studentUserId)
    );
    if (!student) return;

    const confirmDelete = confirm(
        `Are you sure you want to delete ${student.name}?`
    );
    if (!confirmDelete) return;

    try {
        await apiRequest(`/admin/students/${student.user_id}/`, {
            method: "DELETE",
        });
        await loadAdminDashboard();

        logActivity(
            "Student deleted",
            `${student.name} was removed from the database.`,
            "fa-trash"
        );
        showToast("Student deleted successfully.");
    } catch (error) {
        showToast(error.message || "Failed to delete student.");
    }
}

// ==========================================
// INSTRUCTOR MANAGEMENT
// ==========================================

function renderInstructors() {
    const instructorList = $("instructorList");
    if (!instructorList) return;

    const searchValue = $("instructorSearch")
        ? $("instructorSearch").value.toLowerCase().trim()
        : "";

    const filteredInstructors = instructors.filter(instructor => {
        const courseTitles = (instructor.assigned_courses || [])
            .map(c => c.title)
            .join(" ");
        const searchableText = [
            instructor.id,
            instructor.name,
            instructor.email,
            instructor.phone,
            instructor.department,
            instructor.specialization,
            instructor.username,
            courseTitles
        ].join(" ").toLowerCase();

        return searchableText.includes(searchValue);
    });

    if (filteredInstructors.length === 0) {
        instructorList.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    No instructor records found.
                </td>
            </tr>
        `;
    } else {
        instructorList.innerHTML = filteredInstructors.map(instructor => {
            const assignedList = Array.isArray(instructor.assigned_courses) && instructor.assigned_courses.length > 0
                ? instructor.assigned_courses.map(c => escapeHTML(c.title)).join(", ")
                : "None assigned";

            return `
            <tr>
                <td>
                    <strong>${escapeHTML(instructor.id)}</strong>
                </td>
                <td>${escapeHTML(instructor.name)}</td>
                <td>${escapeHTML(instructor.email)}</td>
                <td>${escapeHTML(instructor.phone || "—")}</td>
                <td>${escapeHTML(instructor.department || "—")}</td>
                <td>${escapeHTML(instructor.specialization || "—")}</td>
                <td>${assignedList}</td>
                <td>${escapeHTML(instructor.username)}</td>
                <td>
                    <div class="action-buttons">
                        <button
                            type="button"
                            class="approve-btn"
                            onclick="selectInstructorForCourse('${escapeHTML(instructor.user_id)}')"
                            title="Assign course to instructor"
                        >
                            <i class="fa-solid fa-book-open"></i>
                        </button>
                        <button
                            type="button"
                            class="delete-btn"
                            onclick="deleteInstructor('${escapeHTML(instructor.user_id)}')"
                            title="Delete instructor"
                        >
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        }).join("");
    }

    if ($("instructorRecordCount")) {
        $("instructorRecordCount").textContent =
            `Showing ${filteredInstructors.length} of ${instructors.length} instructors`;
    }

    updateDashboardStats();
}

async function addInstructor(event) {
    event.preventDefault();

    const firstName = $("instructorFirstName")
        ? $("instructorFirstName").value.trim()
        : ($("instructorName")?.value.trim().split(/\s+/)[0] || "");
    const lastName = $("instructorLastName")
        ? $("instructorLastName").value.trim()
        : ($("instructorName")?.value.trim().split(/\s+/).slice(1).join(" ") || "");
    const email = $("instructorEmail").value.trim().toLowerCase();
    const phone = $("instructorPhone").value.trim();
    const department = $("instructorDepartment") ? $("instructorDepartment").value.trim() : "";
    const specialization = $("instructorSpecialization").value.trim();
    const username = $("instructorUsername") ? $("instructorUsername").value.trim() : "";
    const password = $("instructorPassword")?.value || "";
    const confirmPassword = $("instructorConfirmPassword")?.value || "";
    const courseId = $("instructorCourseSelect")?.value || "";

    if (
        !firstName ||
        !lastName ||
        !email ||
        !phone ||
        !specialization ||
        !password ||
        !confirmPassword
    ) {
        showToast("Please complete all instructor fields including password.");
        return;
    }

    if (password.length < 8) {
        showToast("Password must be at least 8 characters long.");
        return;
    }

    if (password !== confirmPassword) {
        showToast("Instructor passwords do not match.");
        return;
    }

    try {
        const res = await apiRequest("/admin/instructors/", {
            method: "POST",
            body: JSON.stringify({
                first_name: firstName,
                last_name: lastName,
                email,
                phone,
                department,
                specialization,
                username,
                password,
                confirm_password: confirmPassword,
                course_id: courseId || null,
            }),
        });

        $("Add_instructor").reset();
        await loadAdminDashboard();

        logActivity(
            "New instructor registered",
            `${res.instructor.name} (${res.instructor.id}) account created.`,
            "fa-chalkboard-user"
        );
        showToast(`Instructor account created! ID: ${res.instructor.id}`);
    } catch (error) {
        showToast(error.message || "Could not create instructor account.");
    }
}

function selectInstructorForCourse(userId) {
    const select = $("assignInstructorSelect");
    if (select) {
        select.value = String(userId);
        $("assignInstructorPanel")?.scrollIntoView({ behavior: "smooth", block: "center" });
        $("assignInstructorCourseSelect")?.focus();
    }
}

async function assignInstructorToCourse(event) {
    event.preventDefault();

    const instructorId = $("assignInstructorSelect")?.value;
    const courseId = $("assignInstructorCourseSelect")?.value;

    if (!instructorId || !courseId) {
        showToast("Please select both an instructor and a course.");
        return;
    }

    try {
        const res = await apiRequest("/admin/assign-instructor/", {
            method: "POST",
            body: JSON.stringify({
                instructor_id: instructorId,
                course_id: courseId,
            }),
        });

        $("Assign_instructor_course")?.reset();
        await loadAdminDashboard();

        logActivity(
            "Instructor assigned to course",
            res.message || "Instructor assigned to course.",
            "fa-chalkboard-user"
        );
        showToast(res.message || "Instructor assigned to course successfully!");
    } catch (error) {
        showToast(error.message || "Failed to assign instructor to course.");
    }
}

async function deleteInstructor(instructorUserId) {
    const instructor = instructors.find(
        item => String(item.user_id) === String(instructorUserId) || String(item.id) === String(instructorUserId)
    );
    if (!instructor) return;

    const confirmDelete = confirm(
        `Are you sure you want to delete ${instructor.name}?`
    );
    if (!confirmDelete) return;

    try {
        await apiRequest(`/admin/instructors/${instructor.user_id}/`, {
            method: "DELETE",
        });
        await loadAdminDashboard();

        logActivity(
            "Instructor deleted",
            `${instructor.name} was removed from the database.`,
            "fa-trash"
        );
        showToast("Instructor deleted successfully.");
    } catch (error) {
        showToast(error.message || "Failed to delete instructor.");
    }
}

// ==========================================
// ADMIN PROFILE
// ==========================================

function renderProfile() {
    const profile = adminProfile;
    const displayName = profile.name || "Administrator";

    if ($("showName")) $("showName").textContent = displayName;
    if ($("topAdminName")) $("topAdminName").textContent = displayName;
    if ($("userFullName")) $("userFullName").textContent = displayName;
    if ($("showRole")) $("showRole").textContent = profile.role || "Administration";
    if ($("showEmail")) $("showEmail").textContent = profile.email || "---";
    if ($("showPhone")) $("showPhone").textContent = profile.phone || "Not provided";
    if ($("showDepartment")) $("showDepartment").textContent = profile.department || "Administration";
    if ($("showUsername")) $("showUsername").textContent = profile.username || "---";
    if ($("showBio")) $("showBio").textContent = profile.bio || "---";

    const avatar = profileImageData ||
        `https://placehold.co/100x100/e8eef8/17366b?text=${encodeURIComponent(getInitials(displayName))}`;

    if ($("showAdmin")) $("showAdmin").src = avatar;
    if ($("showImage")) $("showImage").src = avatar;
}

function toggleProfile() {
    const profile = $("Bot");
    const toggle = $("profileToggle");
    if (!profile) return;
    const isOpen = profile.classList.toggle("active");
    toggle?.setAttribute("aria-expanded", String(isOpen));
}

function Editprofile() {
    const editPanel = $("Edit");
    if (!editPanel) {
        showToast("The edit profile panel could not be found.");
        return;
    }
    const values = {
        fullName: adminProfile.name,
        username: adminProfile.username,
        email: adminProfile.email,
        phone: adminProfile.phone === "Not provided" ? "" : adminProfile.phone,
        department: adminProfile.department,
        role: adminProfile.role,
        bio: adminProfile.bio
    };
    Object.entries(values).forEach(([id, value]) => {
        const field = $(id);
        if (field) field.value = value;
    });
    $("Bot")?.classList.remove("active");
    $("profileToggle")?.setAttribute("aria-expanded", "false");
    editPanel.classList.add("active");
}

function closeEdit() {
    if ($("Edit")) {
        $("Edit").classList.remove("active");
    }
}

function closeEditProfile() {
    closeEdit();
}

async function saveProfile(event) {
    event.preventDefault();
    const required = ["fullName", "username", "email", "department", "role"];
    for (const id of required) {
        const field = $(id);
        if (!field || !field.value.trim()) {
            showToast("Please complete all required profile fields.");
            field?.focus();
            return;
        }
    }
    const email = $("email").value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast("Please enter a valid email address.");
        $("email")?.focus();
        return;
    }
    const valueOf = (id, fallback = "") => $(id)?.value.trim() ?? fallback;

    const payload = {
        name: valueOf("fullName"),
        username: valueOf("username"),
        email,
        phone: valueOf("phone"),
        department: valueOf("department"),
        role: valueOf("role"),
        bio: valueOf("bio"),
    };

    const imageInput = $("profileImage");
    const file = imageInput?.files?.[0];
    if (file) {
        const dataUrl = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target?.result || "");
            reader.readAsDataURL(file);
        });
        payload.avatar_url = dataUrl;
        profileImageData = dataUrl;
    }

    try {
        const res = await apiRequest("/admin/profile/", {
            method: "PATCH",
            body: JSON.stringify(payload),
        });
        adminProfile = {
            name: res.name || payload.name,
            username: res.username || payload.username,
            email: res.email || payload.email,
            phone: res.phone || "Not provided",
            department: res.department || payload.department,
            role: res.role || payload.role,
            bio: res.bio || payload.bio,
            avatar_url: res.avatar_url || profileImageData,
        };
        renderProfile();
        closeEdit();
        logActivity("Profile updated", "Administrator profile details were updated.", "fa-user-pen");
        showToast("Profile updated successfully!");
    } catch (error) {
        showToast(error.message || "Failed to update admin profile.");
    }
}

// ==========================================
// TOAST & SIDEBAR
// ==========================================

function showToast(message) {
    const toast = $("toast");
    if (!toast) {
        console.log(message);
        return;
    }
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

function HamButton() {
    const sidebar = $("Sidebar");
    const overlay = $("sidebarOverlay");
    const hamburger = $("hamburger");
    if (!sidebar) return;

    const isOpen = sidebar.classList.toggle("active");
    overlay?.classList.toggle("active", isOpen);
    hamburger?.setAttribute("aria-expanded", String(isOpen));
    const icon = hamburger?.querySelector("i");
    if (icon) {
        icon.className = isOpen ? "fa-solid fa-xmark" : "fa-solid fa-bars";
    }
}

function closeSidebar() {
    $("Sidebar")?.classList.remove("active");
    $("sidebarOverlay")?.classList.remove("active");
    const hamburger = $("hamburger");
    hamburger?.setAttribute("aria-expanded", "false");
    const icon = hamburger?.querySelector("i");
    if (icon) {
        icon.className = "fa-solid fa-bars";
    }
}

function logout(event) {
    if (event) {
        event.preventDefault();
    }

    const confirmLogout = confirm("Are you sure you want to log out?");
    if (!confirmLogout) return;

    redirectToLogin();
}

// ==========================================
// PAGE INITIALIZATION
// ==========================================

document.addEventListener("DOMContentLoaded", function () {
    if (!enforceAdminAuth()) {
        return;
    }

    if ($("currentYear")) $("currentYear").textContent = getCurrentYear();
    if ($("footerYear")) $("footerYear").textContent = getCurrentYear();
    if ($("todayDate")) $("todayDate").textContent = formatDate();

    $("Add_student")?.addEventListener("submit", addStudent);
    $("Assign_course")?.addEventListener("submit", assignCourseToStudent);
    $("Add_instructor")?.addEventListener("submit", addInstructor);
    $("Assign_instructor_course")?.addEventListener("submit", assignInstructorToCourse);
    $("profileForm")?.addEventListener("submit", saveProfile);
    $("studentSearch")?.addEventListener("input", renderStudents);
    $("statusFilter")?.addEventListener("change", renderStudents);
    $("instructorSearch")?.addEventListener("input", renderInstructors);

    document.addEventListener("click", function (event) {
        const profileWrap = document.querySelector(".profile-wrap");
        const profile = $("Bot");
        if (profileWrap && profile && !profileWrap.contains(event.target)) {
            profile.classList.remove("active");
            $("profileToggle")?.setAttribute("aria-expanded", "false");
        }
    });

    document.querySelectorAll(".side-nav a").forEach(link => {
        link.addEventListener("click", function () {
            closeSidebar();
        });
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeSidebar();
            $("Bot")?.classList.remove("active");
            $("profileToggle")?.setAttribute("aria-expanded", "false");
            closeEdit();
        }
    });

    logActivity(
        "Dashboard opened",
        "Connected to live school management database.",
        "fa-right-to-bracket"
    );

    loadAdminDashboard();
});
