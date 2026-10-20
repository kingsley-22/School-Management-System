// ==========================================
// IN-MEMORY DATA
// ==========================================

let adminProfile = null;
let adminImage = null;
let students = [];


// ==========================================
// ADMIN PROFILE DROPDOWN
// ==========================================

const administration = document.getElementById("administration");
const Bot = document.getElementById("Bot");
const Edits = document.getElementById("Edit");

administration.addEventListener("click", function () {

    if (Bot.style.display === "block") {
        Bot.style.display = "none";
    } else {
        Bot.style.display = "block";
    }

});


// ==========================================
// EDIT PROFILE
// ==========================================

function Editprofile() {

    if (adminProfile) {

        document.getElementById("fullName").value =
            adminProfile.named || "";

        document.getElementById("username").value =
            adminProfile.userName || "";

        document.getElementById("email").value =
            adminProfile.email || "";

        document.getElementById("phone").value =
            adminProfile.phone || "";

        document.getElementById("department").value =
            adminProfile.department || "";

        document.getElementById("role").value =
            adminProfile.role || "";

        document.getElementById("bio").value =
            adminProfile.bio || "";
    }

    Edits.style.display = "block";
    Bot.style.display = "none";
}


// ==========================================
// SAVE PROFILE
// ==========================================

function saveProfile() {

    const named =
        document.getElementById("fullName").value.trim();

    const userName =
        document.getElementById("username").value.trim();

    const email =
        document.getElementById("email").value.trim();

    const phone =
        document.getElementById("phone").value.trim();

    const department =
        document.getElementById("department").value.trim();

    const role =
        document.getElementById("role").value.trim();

    const bio =
        document.getElementById("bio").value.trim();


    // Store profile in memory only
    adminProfile = {

        named: named,
        userName: userName,
        email: email,
        phone: phone,
        department: department,
        role: role,
        bio: bio

    };


    // ======================================
    // DISPLAY PROFILE INFORMATION
    // ======================================

    document.getElementById("showName").textContent =
        named;

    document.getElementById("showRole").textContent =
        role;

    document.getElementById("showEmail").textContent =
        email;

    document.getElementById("showPhone").textContent =
        phone;

    document.getElementById("showDepartment").textContent =
        department;

    document.getElementById("showUsername").textContent =
        userName;

    document.getElementById("showBio").textContent =
        bio;

    document.getElementById("userFullName").textContent =
        named;


    // ======================================
    // PROFILE IMAGE
    // ======================================

    const imageInput =
        document.getElementById("profileImage");

    if (imageInput.files.length > 0) {

        const image = imageInput.files[0];

        const reader = new FileReader();

        reader.onload = function () {

            // Store image in memory only
            adminImage = reader.result;

            document.getElementById("showImage").src =
                adminImage;

            document.getElementById("showAdmin").src =
                adminImage;

        };

        reader.readAsDataURL(image);
    }


    // Show profile
    Edits.style.display = "none";
    Bot.style.display = "block";

}


// ==========================================
// LOAD EVERYTHING WHEN PAGE OPENS
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    loadAdminProfile();

    loadStudents();

    updateDashboard();

});


// ==========================================
// LOAD ADMIN PROFILE
// ==========================================

function loadAdminProfile() {

    if (adminProfile) {

        document.getElementById("showName").textContent =
            adminProfile.named || "Admin Name";

        document.getElementById("showRole").textContent =
            adminProfile.role || "Administration";

        document.getElementById("showEmail").textContent =
            adminProfile.email || "---";

        document.getElementById("showPhone").textContent =
            adminProfile.phone || "---";

        document.getElementById("showDepartment").textContent =
            adminProfile.department || "---";

        document.getElementById("showUsername").textContent =
            adminProfile.userName || "---";

        document.getElementById("showBio").textContent =
            adminProfile.bio || "---";

        document.getElementById("userFullName").textContent =
            adminProfile.named || "";
    }


    // Load image from memory
    if (adminImage) {

        document.getElementById("showImage").src =
            adminImage;

        document.getElementById("showAdmin").src =
            adminImage;
    }

}


// ==========================================
// HAMBURGER BUTTON
// ==========================================

function HamButton() {

    const sidebar =
        document.querySelector(".Sidebar");

    sidebar.classList.toggle("bar");

}


// ==========================================
// STUDENT MANAGEMENT
// ==========================================

const form =
    document.getElementById("Add_student");

const studentList =
    document.getElementById("studentList");


// ==========================================
// ADD STUDENT
// ==========================================

form.addEventListener("submit", function (event) {

    event.preventDefault();


    const name =
        document.getElementById("inputName").value.trim();

    const email =
        document.getElementById("inputEmail").value.trim();

    const phone =
        document.getElementById("inputPhoneNumber").value.trim();

    const department =
        document.getElementById("inputDepartment").value.trim();

    const username =
        document.getElementById("inputUsername").value.trim();


    // Create student
    const student = {

        id: Date.now(),

        name: name,

        email: email,

        phone: phone,

        department: department,

        username: username,

        status: "Pending"

    };


    // Add student to memory
    students.push(student);


    // Refresh table
    loadStudents();


    // Update dashboard
    updateDashboard();


    // Clear form
    form.reset();

});


// ==========================================
// LOAD STUDENTS
// ==========================================

function loadStudents() {

    studentList.innerHTML = "";


    students.forEach(function (student) {

        const row =
            document.createElement("tr");


        // Status class
        let statusClass = "pending";


        if (student.status === "Approved") {

            statusClass = "approved";

        }


        row.innerHTML = `

            <td>${student.name}</td>

            <td>${student.email}</td>

            <td>${student.phone}</td>

            <td>${student.department}</td>

            <td>${student.username}</td>

            <td>

                <span class="${statusClass}">

                    ${student.status}

                </span>

            </td>

            <td>

                ${
                    student.status === "Pending"

                    ?

                    `<button
                        class="approve"
                        onclick="approveStudent(${student.id})">
                        Approve
                    </button>`

                    :

                    ""
                }

                <button
                    class="delete"
                    onclick="deleteStudent(${student.id})">
                    Delete
                </button>

            </td>

        `;


        studentList.appendChild(row);

    });

}


// ==========================================
// APPROVE STUDENT
// ==========================================

function approveStudent(id) {

    students.forEach(function (student) {

        if (student.id === id) {

            student.status = "Approved";

        }

    });


    // Refresh table
    loadStudents();


    // Update dashboard
    updateDashboard();

}


// ==========================================
// DELETE STUDENT
// ==========================================

function deleteStudent(id) {

    students =
        students.filter(function (student) {

            return student.id !== id;

        });


    // Refresh table
    loadStudents();


    // Update dashboard
    updateDashboard();

}


// ==========================================
// UPDATE DASHBOARD CARDS
// ==========================================

function updateDashboard() {

    // Total students
    const totalStudents =
        document.querySelector(".card_Students p");


    if (totalStudents) {

        totalStudents.textContent =
            students.length;

    }


    // Pending students
    const pendingStudents =
        students.filter(function (student) {

            return student.status === "Pending";

        });


    const pendingCount =
        document.querySelector(".card_Approval p");


    if (pendingCount) {

        pendingCount.textContent =
            pendingStudents.length;

    }

}


// ==========================================
// LOGOUT
// ==========================================

function logout() {

    // No localStorage is used.
    // Login state should be handled by your
    // authentication system or backend.

    adminProfile = null;
    adminImage = null;
    students = [];

}

