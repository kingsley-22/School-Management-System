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

    const saved = JSON.parse(
        localStorage.getItem("adminProfile")
    );

    if (saved) {

        document.getElementById("fullName").value =
            saved.named || "";

        document.getElementById("username").value =
            saved.userName || "";

        document.getElementById("email").value =
            saved.email || "";

        document.getElementById("phone").value =
            saved.phone || "";

        document.getElementById("department").value =
            saved.department || "";

        document.getElementById("role").value =
            saved.role || "";

        document.getElementById("bio").value =
            saved.bio || "";
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


    // Save profile information
    const admin = {

        named: named,
        userName: userName,
        email: email,
        phone: phone,
        department: department,
        role: role,
        bio: bio

    };


    localStorage.setItem(
        "adminProfile",
        JSON.stringify(admin)
    );


    // Display profile information
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
    // SAVE PROFILE IMAGE
    // ======================================

    const imageInput =
        document.getElementById("profileImage");

    if (imageInput.files.length > 0) {

        const image = imageInput.files[0];

        const reader = new FileReader();

        reader.onload = function () {

            localStorage.setItem(
                "adminImage",
                reader.result
            );

            document.getElementById("showImage").src =
                reader.result;

            document.getElementById("showAdmin").src =
                reader.result;
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

    const saved =
        JSON.parse(
            localStorage.getItem("adminProfile")
        );


    if (saved) {

        document.getElementById("showName").textContent =
            saved.named || "Admin Name";

        document.getElementById("showRole").textContent =
            saved.role || "Administration";

        document.getElementById("showEmail").textContent =
            saved.email || "---";

        document.getElementById("showPhone").textContent =
            saved.phone || "---";

        document.getElementById("showDepartment").textContent =
            saved.department || "---";

        document.getElementById("showUsername").textContent =
            saved.userName || "---";

        document.getElementById("showBio").textContent =
            saved.bio || "---";

        document.getElementById("userFullName").textContent =
            saved.named || "";
    }


    // Load saved image

    const savedImage =
        localStorage.getItem("adminImage");


    if (savedImage) {

        document.getElementById("showImage").src =
            savedImage;

        document.getElementById("showAdmin").src =
            savedImage;
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


    // Get old students

    let students =
        JSON.parse(
            localStorage.getItem("students")
        ) || [];


    // Add new student

    students.push(student);


    // Save students

    localStorage.setItem(
        "students",
        JSON.stringify(students)
    );


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


    const students =
        JSON.parse(
            localStorage.getItem("students")
        ) || [];


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

    let students =
        JSON.parse(
            localStorage.getItem("students")
        ) || [];


    students.forEach(function (student) {

        if (student.id === id) {

            student.status = "Approved";

        }

    });


    // Save updated students

    localStorage.setItem(
        "students",
        JSON.stringify(students)
    );


    // Refresh table

    loadStudents();


    // Update dashboard

    updateDashboard();

}


// ==========================================
// DELETE STUDENT
// ==========================================

function deleteStudent(id) {

    let students =
        JSON.parse(
            localStorage.getItem("students")
        ) || [];


    students =
        students.filter(function (student) {

            return student.id !== id;

        });


    // Save new list

    localStorage.setItem(
        "students",
        JSON.stringify(students)
    );


    // Refresh table

    loadStudents();


    // Update dashboard

    updateDashboard();

}


// ==========================================
// UPDATE DASHBOARD CARDS
// ==========================================

function updateDashboard() {

    const students =
        JSON.parse(
            localStorage.getItem("students")
        ) || [];


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

// function logout() {
//     // Remove saved login information
//     localStorage.removeItem("adminLoggedIn");
// }