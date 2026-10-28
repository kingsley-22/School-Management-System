// ==========================================
// LEARNHUB SCHOOL MANAGEMENT SYSTEM
// ADMIN DASHBOARD JAVASCRIPT
// NO LOCAL STORAGE OR SESSION STORAGE
// ==========================================


// ==========================================
// 1. GLOBAL VARIABLES
// ==========================================

let students = [];
let instructors = [];
let activities = [];

let studentCounter = 1;
let instructorCounter = 1;

let profileImageData = "";

let toastTimer = null;

const $ = id => document.getElementById(id);


// ==========================================
// 2. HELPER FUNCTIONS
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
// 3. UNIQUE ID GENERATORS
// ==========================================

function generateStudentID() {
    const id = `STU-${getCurrentYear()}-${String(studentCounter).padStart(4, "0")}`;

    studentCounter++;

    return id;
}


function generateInstructorID() {
    const id = `INS-${getCurrentYear()}-${String(instructorCounter).padStart(4, "0")}`;

    instructorCounter++;

    return id;
}




// ==========================================
// 5. ACTIVITY MANAGEMENT
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
// 6. DASHBOARD STATISTICS
// ==========================================

function updateDashboardStats() {

    if ($("totalStudents")) {
        $("totalStudents").textContent = students.length;
    }

    if ($("totalInstructors")) {
        $("totalInstructors").textContent = instructors.length;
    }

    const pendingStudents = students.filter(student =>
        student.status === "Pending"
    ).length;

    if ($("totalPending")) {
        $("totalPending").textContent = pendingStudents;
    }

    // Course count:
    // Uses a course count supplied by another script if available.
    // Otherwise, keeps the current HTML value (11).

    updateCourseCount();
}


function updateCourseCount() {

    const courseElement = $("totalCourses");

    if (!courseElement) return;

    if (
        typeof window.learnHubCourseCount === "number" &&
        Number.isFinite(window.learnHubCourseCount)
    ) {
        courseElement.textContent = window.learnHubCourseCount;
    }
}


// ==========================================
// 7. STUDENT MANAGEMENT
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

        const searchableText = [
            student.id,
            student.name,
            student.email,
            student.phone,
            student.department,
            student.username
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
                <td colspan="8" class="empty-state">
                    No student records found.
                </td>
            </tr>
        `;

    } else {

        studentList.innerHTML = filteredStudents.map(student => `

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

                <td>${escapeHTML(student.phone)}</td>

                <td>${escapeHTML(student.department)}</td>

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
                                    onclick="approveStudent('${student.id}')"
                                    title="Approve student"
                                >
                                    <i class="fa-solid fa-check"></i>
                                </button>
                            `
                            : ""
                        }

                        <button
                            type="button"
                            class="delete-btn"
                            onclick="deleteStudent('${student.id}')"
                            title="Delete student"
                        >
                            <i class="fa-solid fa-trash"></i>
                        </button>

                    </div>
                </td>
            </tr>

        `).join("");
    }


    if ($("recordCount")) {
        $("recordCount").textContent =
            `Showing ${filteredStudents.length} of ${students.length} students`;
    }

    updateDashboardStats();
}


// ==========================================
// 8. ADD STUDENT
// ==========================================

function addStudent(event) {

    event.preventDefault();

    const name = $("inputName").value.trim();
    const email = $("inputEmail").value.trim();
    const phone = $("inputPhoneNumber").value.trim();
    const department = $("inputDepartment").value.trim();
    const username = $("inputUsername").value.trim();

    if (!name || !email || !phone || !department || !username) {
        showToast("Please complete all student fields.");
        return;
    }


    // Check duplicate email and username

    const duplicate = students.some(student =>
        student.email.toLowerCase() === email.toLowerCase() ||
        student.username.toLowerCase() === username.toLowerCase()
    );

    if (duplicate) {
        showToast("Student email or username already exists.");
        return;
    }


    const student = {
        id: generateStudentID(),
        name,
        email,
        phone,
        department,
        username,
        status: "Pending",
        dateAdded: new Date().toISOString()
    };


    students.push(student);

    $("Add_student").reset();

    renderStudents();

    logActivity(
        "New student registered",
        `${name} was added successfully.`,
        "fa-user-plus"
    );

    showToast(`Student added! ID: ${student.id}`);
}


// ==========================================
// 9. APPROVE STUDENT
// ==========================================

function approveStudent(studentID) {

    const student = students.find(item => item.id === studentID);

    if (!student) return;

    if (student.status === "Approved") {
        showToast("This student is already approved.");
        return;
    }

    student.status = "Approved";

    renderStudents();

    logActivity(
        "Student approved",
        `${student.name} has been approved.`,
        "fa-user-check"
    );

    showToast("Student approved successfully!");
}


// ==========================================
// 10. DELETE STUDENT
// ==========================================

function deleteStudent(studentID) {

    const student = students.find(item => item.id === studentID);

    if (!student) return;

    const confirmDelete = confirm(
        `Are you sure you want to delete ${student.name}?`
    );

    if (!confirmDelete) return;

    students = students.filter(item => item.id !== studentID);

    renderStudents();

    logActivity(
        "Student deleted",
        `${student.name} was removed from the records.`,
        "fa-trash"
    );

    showToast("Student deleted successfully.");
}


// ==========================================
// 11. INSTRUCTOR MANAGEMENT
// ==========================================

function renderInstructors() {

    const instructorList = $("instructorList");

    if (!instructorList) return;

    const searchValue = $("instructorSearch")
        ? $("instructorSearch").value.toLowerCase().trim()
        : "";


    const filteredInstructors = instructors.filter(instructor => {

        const searchableText = [
            instructor.id,
            instructor.name,
            instructor.email,
            instructor.phone,
            instructor.department,
            instructor.specialization,
            instructor.username
        ].join(" ").toLowerCase();

        return searchableText.includes(searchValue);
    });


    if (filteredInstructors.length === 0) {

        instructorList.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    No instructor records found.
                </td>
            </tr>
        `;

    } else {

        instructorList.innerHTML = filteredInstructors.map(instructor => `

            <tr>

                <td>
                    <strong>${escapeHTML(instructor.id)}</strong>
                </td>

                <td>${escapeHTML(instructor.name)}</td>

                <td>${escapeHTML(instructor.email)}</td>

                <td>${escapeHTML(instructor.phone)}</td>

                <td>${escapeHTML(instructor.department)}</td>

                <td>${escapeHTML(instructor.specialization)}</td>

                <td>${escapeHTML(instructor.username)}</td>

                <td>
                    <div class="action-buttons">

                        <button
                            type="button"
                            class="delete-btn"
                            onclick="deleteInstructor('${instructor.id}')"
                            title="Delete instructor"
                        >
                            <i class="fa-solid fa-trash"></i>
                        </button>

                    </div>
                </td>

            </tr>

        `).join("");
    }


    if ($("instructorRecordCount")) {
        $("instructorRecordCount").textContent =
            `Showing ${filteredInstructors.length} of ${instructors.length} instructors`;
    }

    updateDashboardStats();
}


// ==========================================
// 12. ADD INSTRUCTOR
// ==========================================

function addInstructor(event) {

    event.preventDefault();

    const name = $("instructorName").value.trim();
    const email = $("instructorEmail").value.trim();
    const phone = $("instructorPhone").value.trim();
    const department = $("instructorDepartment").value.trim();
    const specialization = $("instructorSpecialization").value.trim();
    const username = $("instructorUsername").value.trim();


    if (
        !name ||
        !email ||
        !phone ||
        !department ||
        !specialization ||
        !username
    ) {
        showToast("Please complete all instructor fields.");
        return;
    }


    // Check duplicate email and username

    const duplicate = instructors.some(instructor =>
        instructor.email.toLowerCase() === email.toLowerCase() ||
        instructor.username.toLowerCase() === username.toLowerCase()
    );

    if (duplicate) {
        showToast("Instructor email or username already exists.");
        return;
    }


    const instructor = {
        id: generateInstructorID(),
        name,
        email,
        phone,
        department,
        specialization,
        username,
        dateAdded: new Date().toISOString()
    };


    instructors.push(instructor);

    $("Add_instructor").reset();

    renderInstructors();

    logActivity(
        "New instructor registered",
        `${name} was added successfully.`,
        "fa-chalkboard-user"
    );

    showToast(`Instructor added! ID: ${instructor.id}`);
}


// ==========================================
// 13. DELETE INSTRUCTOR
// ==========================================

function deleteInstructor(instructorID) {

    const instructor = instructors.find(
        item => item.id === instructorID
    );

    if (!instructor) return;

    const confirmDelete = confirm(
        `Are you sure you want to delete ${instructor.name}?`
    );

    if (!confirmDelete) return;

    instructors = instructors.filter(
        item => item.id !== instructorID
    );

    renderInstructors();

    logActivity(
        "Instructor deleted",
        `${instructor.name} was removed from the records.`,
        "fa-trash"
    );

    showToast("Instructor deleted successfully.");
}




// ==========================================
// 15. ADMIN PROFILE
// ==========================================

const defaultProfile = {
    name: "Administrator",
    username: "admin",
    email: "admin@learnhub.com",
    phone: "Not provided",
    department: "Administration",
    role: "Administration",
    bio: "Welcome to LearnHub."
};


let adminProfile = { ...defaultProfile };


function renderProfile() {

    const profile = adminProfile;

    if ($("showName")) {
        $("showName").textContent = profile.name;
    }

    if ($("topAdminName")) {
        $("topAdminName").textContent = profile.name;
    }

    if ($("userFullName")) {
        $("userFullName").textContent = profile.name;
    }

    if ($("showRole")) {
        $("showRole").textContent = profile.role;
    }

    if ($("showEmail")) {
        $("showEmail").textContent = profile.email;
    }

    if ($("showPhone")) {
        $("showPhone").textContent = profile.phone;
    }

    if ($("showDepartment")) {
        $("showDepartment").textContent = profile.department;
    }

    if ($("showUsername")) {
        $("showUsername").textContent = profile.username;
    }

    if ($("showBio")) {
        $("showBio").textContent = profile.bio;
    }


    const avatar = profileImageData ||
        `https://placehold.co/100x100/e8eef8/17366b?text=${encodeURIComponent(getInitials(profile.name))}`;

    if ($("showAdmin")) {
        $("showAdmin").src = avatar;
    }

    if ($("showImage")) {
        $("showImage").src = avatar;
    }
}


// ==========================================
// 16. TOGGLE PROFILE
// ==========================================

function toggleProfile() {
    const profile = $("Bot");
    const toggle = $("profileToggle");
    if (!profile) return;
    const isOpen = profile.classList.toggle("active");
    toggle?.setAttribute("aria-expanded", String(isOpen));
}


// ==========================================
// 17. OPEN EDIT PROFILE
// ==========================================

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


// ==========================================
// 18. CLOSE EDIT PROFILE
// ==========================================

function closeEdit() {

    if ($("Edit")) {
        $("Edit").classList.remove("active");
    }
}


// Backward-compatible function name

function closeEditProfile() {
    closeEdit();
}


// ==========================================
// 19. SAVE ADMIN PROFILE
// ==========================================

function saveProfile(event) {
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
    adminProfile = {
        name: valueOf("fullName"),
        username: valueOf("username"),
        email,
        phone: valueOf("phone") || "Not provided",
        department: valueOf("department"),
        role: valueOf("role"),
        bio: valueOf("bio") || "No bio provided."
    };
    renderProfile();

    closeEdit();

    logActivity(
        "Admin profile updated",
        "Your administrator profile was updated.",
        "fa-user-pen"
    );

    showToast("Profile updated successfully!");
}


// ==========================================
// 20. PROFILE IMAGE UPLOAD
// ==========================================

function handleProfileImage(event) {

    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
        showToast("Please select a valid image.");
        event.target.value = "";
        return;
    }
    if (file.size > 2 * 1024 * 1024) {
        showToast("Please choose an image smaller than 2 MB.");
        event.target.value = "";
        return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        if (typeof e.target.result !== "string") {
            showToast("Unable to load the selected image.");
            return;
        }
        profileImageData = e.target.result;
        renderProfile();
        logActivity("Profile photo updated", "Your administrator profile photo was changed.", "fa-camera");
        showToast("Profile photo updated.");
    };
    reader.onerror = function() {
        showToast("Unable to load the selected image.");
        event.target.value = "";
    };
    reader.readAsDataURL(file);
}


// ==========================================
// 21. SIDEBAR / HAMBURGER
// ==========================================

function HamButton() {
    const sidebar = $("Sidebar");
    const overlay = $("sidebarOverlay");
    const hamburger = $("hamburger");
    if (!sidebar) return;
    const isOpen = sidebar.classList.toggle("active");
    overlay?.classList.toggle("active", isOpen);
    hamburger?.setAttribute("aria-expanded", String(isOpen));
}

function closeSidebar() {
    $("Sidebar")?.classList.remove("active");
    $("sidebarOverlay")?.classList.remove("active");
    $("hamburger")?.setAttribute("aria-expanded", "false");
}


// ==========================================
// 22. LOGOUT
// ==========================================

function logout(event) {

    if (event) {
        event.preventDefault();
    }

    const confirmLogout = confirm(
        "Are you sure you want to log out?"
    );

    if (!confirmLogout) return;

    showToast("You have logged out.");

    logActivity(
        "Admin logged out",
        "The administrator logged out of LearnHub.",
        "fa-right-from-bracket"
    );

    // No login page has been specified.
    // Add your login page redirect here when ready.
}


// ==========================================
// 23. PAGE INITIALIZATION
// ==========================================

document.addEventListener("DOMContentLoaded", function() {


    // Current year

    if ($("currentYear")) {
        $("currentYear").textContent = getCurrentYear();
    }

    if ($("footerYear")) {
        $("footerYear").textContent = getCurrentYear();
    }


    // Current date

    if ($("todayDate")) {
        $("todayDate").textContent = formatDate();
    }


    // Add student form

    if ($("Add_student")) {
        $("Add_student").addEventListener(
            "submit",
            addStudent
        );
    }


    // Add instructor form

    if ($("Add_instructor")) {
        $("Add_instructor").addEventListener(
            "submit",
            addInstructor
        );
    }


    // Student search

    if ($("studentSearch")) {
        $("studentSearch").addEventListener(
            "input",
            renderStudents
        );
    }


    // Student status filter

    if ($("statusFilter")) {
        $("statusFilter").addEventListener(
            "change",
            renderStudents
        );
    }


    // Instructor search

    if ($("instructorSearch")) {
        $("instructorSearch").addEventListener(
            "input",
            renderInstructors
        );
    }


    // Admin profile form

    if ($("profileForm")) {
        $("profileForm").addEventListener(
            "submit",
            saveProfile
        );
    }


    // Profile image upload

    if ($("profileImage")) {
        $("profileImage").addEventListener(
            "change",
            handleProfileImage
        );
    }


    // Close profile dropdown when clicking outside

    document.addEventListener("click", function(event) {

        const profileWrap = document.querySelector(".profile-wrap");

        const profile = $("Bot");

        if (
            profileWrap &&
            profile &&
            !profileWrap.contains(event.target)
        ) {
            profile.classList.remove("active");
            $("profileToggle")?.setAttribute("aria-expanded", "false");
        }

    });


    // Close sidebar when a navigation link is clicked

    document.querySelectorAll(".side-nav a").forEach(link => {

        link.addEventListener("click", function() {
            closeSidebar();
        });

    });


    // Close sidebar with Escape key

    document.addEventListener("keydown", function(event) {

        if (event.key === "Escape") {

            closeSidebar();

            $("Bot")?.classList.remove("active");
            $("profileToggle")?.setAttribute("aria-expanded", "false");
            closeEdit();
        }

    });


    // Initial rendering

    renderStudents();

    renderInstructors();

    renderActivities();

    renderProfile();

    updateDashboardStats();


    // Initial dashboard activity

    logActivity(
        "Dashboard opened",
        "You're ready to manage your school records.",
        "fa-right-to-bracket"
    );

});