// ========================================
// STUDENTS PAGE JAVASCRIPT
// ========================================

document.addEventListener("DOMContentLoaded", () => {

    // ========================================
    // 1. MOBILE SIDEBAR
    // ========================================

    const menuToggle = document.querySelector(".menu-toggle");
    const sidebar = document.querySelector(".sidebar");

    if (menuToggle && sidebar) {
        menuToggle.addEventListener("click", () => {
            sidebar.classList.toggle("show");
        });
    }


    // ========================================
    // 2. SEARCH STUDENTS
    // ========================================

    const studentSearch = document.getElementById("studentSearch");
    const studentsTable = document.getElementById("studentsTable");

    if (studentSearch && studentsTable) {

        studentSearch.addEventListener("input", () => {

            const searchValue =
                studentSearch.value.toLowerCase().trim();

            const rows = studentsTable.querySelectorAll("tr");

            rows.forEach(row => {

                const rowText =
                    row.textContent.toLowerCase();

                if (rowText.includes(searchValue)) {
                    row.style.display = "";
                } else {
                    row.style.display = "none";
                }

            });

        });

    }


    // ========================================
    // 3. COURSE FILTER
    // ========================================

    const courseFilter =
        document.getElementById("courseFilter");

    if (courseFilter && studentsTable) {

        courseFilter.addEventListener("change", () => {

            const selectedCourse =
                courseFilter.value.toLowerCase();

            const rows =
                studentsTable.querySelectorAll("tr");

            rows.forEach(row => {

                const courseCell =
                    row.querySelector("td:nth-child(3)");

                if (!courseCell) return;

                const course =
                    courseCell.textContent.toLowerCase().trim();

                if (
                    selectedCourse === "all" ||
                    courseMatches(course, selectedCourse)
                ) {
                    row.style.display = "";
                } else {
                    row.style.display = "none";
                }

            });

        });

    }


    // ========================================
    // 4. COURSE MATCHING
    // ========================================

    function courseMatches(course, selectedCourse) {

        if (selectedCourse === "web") {
            return course.includes("web");
        }

        if (selectedCourse === "python") {
            return course.includes("python");
        }

        if (selectedCourse === "design") {
            return course.includes("ui/ux");
        }

        if (selectedCourse === "forex") {
            return course.includes("forex");
        }

        return true;
    }

// ========================================
// 5. VIEW STUDENT MODAL
// ========================================

const viewButtons =
    document.querySelectorAll(".view-btn");

const studentModal =
    document.getElementById("studentModal");

const closeStudentModal =
    document.getElementById("closeStudentModal");

const modalCloseButton =
    document.getElementById("modalCloseButton");


viewButtons.forEach(button => {

    button.addEventListener("click", () => {

        const row = button.closest("tr");

        if (!row) return;

        const name =
            row.querySelector(".student-name strong")
                ?.textContent.trim();

        const studentId =
            row.querySelector(".student-name small")
                ?.textContent.trim();

        const avatar =
            row.querySelector(".student-avatar")
                ?.textContent.trim();

        const email =
            row.children[1]?.textContent.trim();

        const course =
            row.children[2]?.textContent.trim();

        const progress =
            row.children[3]?.textContent.trim();

        const status =
            row.children[4]?.textContent.trim();


        // Put student information inside modal

        document.getElementById("modalStudentName")
            .textContent = name;

        document.getElementById("modalStudentId")
            .textContent = studentId;

        document.getElementById("modalStudentAvatar")
            .textContent = avatar;

        document.getElementById("modalStudentEmail")
            .textContent = email;

        document.getElementById("modalStudentCourse")
            .textContent = course;

        document.getElementById("modalStudentProgress")
            .textContent = progress;

        document.getElementById("modalStudentStatus")
            .textContent = status;


        // Show modal

        studentModal.classList.add("show");

    });

});


// ========================================
// CLOSE MODAL
// ========================================

function closeModal() {
    studentModal.classList.remove("show");
}


if (closeStudentModal) {
    closeStudentModal.addEventListener("click", closeModal);
}

if (modalCloseButton) {
    modalCloseButton.addEventListener("click", closeModal);
}


// Close when clicking outside modal

if (studentModal) {

    studentModal.addEventListener("click", (event) => {

        if (event.target === studentModal) {
            closeModal();
        }

    });

}


// Close with ESC key

document.addEventListener("keydown", (event) => {

    if (event.key === "Escape") {
        closeModal();
    }

});

    // ========================================
    // 6. CLOSE SIDEBAR ON MOBILE
    // ========================================

    const sidebarLinks =
        document.querySelectorAll(".sidebar .menu-item");

    sidebarLinks.forEach(link => {

        link.addEventListener("click", () => {

            if (window.innerWidth <= 768) {
                sidebar.classList.remove("show");
            }

        });

    });

    // ========================================
// 7. ADD STUDENT
// ========================================

const addStudentBtn =
    document.getElementById("addStudentBtn");

const addStudentModal =
    document.getElementById("addStudentModal");

const closeAddStudentModal =
    document.getElementById("closeAddStudentModal");

const cancelAddStudent =
    document.getElementById("cancelAddStudent");

const addStudentForm =
    document.getElementById("addStudentForm");


if (addStudentBtn) {

    addStudentBtn.addEventListener("click", () => {
        addStudentModal.classList.add("show");
    });

}


function closeAddModal() {
    addStudentModal.classList.remove("show");
}


if (closeAddStudentModal) {
    closeAddStudentModal.addEventListener(
        "click",
        closeAddModal
    );
}


if (cancelAddStudent) {
    cancelAddStudent.addEventListener(
        "click",
        closeAddModal
    );
}


// ========================================
// SUBMIT NEW STUDENT
// ========================================

if (addStudentForm) {

    addStudentForm.addEventListener("submit", (event) => {

        event.preventDefault();

        const name =
            document.getElementById("studentNameInput")
                .value.trim();

        const email =
            document.getElementById("studentEmailInput")
                .value.trim();

        const course =
            document.getElementById("studentCourseInput")
                .value;

        const status =
            document.getElementById("studentStatusInput")
                .value;


        if (!name || !email || !course) {
            alert("Please fill in all required fields.");
            return;
        }


        // Generate simple student ID

        const studentCount =
            studentsTable.querySelectorAll("tr").length + 1;

        const studentId =
            "ST" + String(studentCount).padStart(3, "0");


        // Generate initials

        const initials =
            name
                .split(" ")
                .map(word => word.charAt(0))
                .join("")
                .substring(0, 2)
                .toUpperCase();


        // Create new row

        const newRow =
            document.createElement("tr");

        const statusClass =
            status === "Active"
                ? "active-status"
                : "inactive-status";


        newRow.innerHTML = `
            <td>
                <div class="student-name">

                    <div class="student-avatar">
                        ${initials}
                    </div>

                    <div>
                        <strong>${name}</strong>
                        <small>ID: ${studentId}</small>
                    </div>

                </div>
            </td>

            <td>${email}</td>

            <td>${course}</td>

            <td>
                <div class="progress-container">

                    <div class="progress-bar">
                        <span style="width: 0%;"></span>
                    </div>

                    <small>0%</small>

                </div>
            </td>

            <td>
                <span class="status ${statusClass}">
                    ${status}
                </span>
            </td>

            <td>
                <button class="view-btn">
                    View
                </button>
            </td>
        `;


        studentsTable.appendChild(newRow);


        // Add View button functionality

        const newViewButton =
            newRow.querySelector(".view-btn");

        newViewButton.addEventListener("click", () => {

            const name =
                newRow.querySelector(".student-name strong")
                    .textContent.trim();

            alert(
                `Student: ${name}\n\n` +
                `Student added successfully.`
            );

        });


        // Reset form

        addStudentForm.reset();

        closeAddModal();

        alert(
            `${name} has been added successfully!`
        );

    });

}


    // ========================================
    // 7. FUTURE DJANGO API
    // ========================================

    /*
        Later, students will come from Django.

        Example:

        fetch("YOUR_API_ENDPOINT")
            .then(response => response.json())
            .then(data => {
                console.log(data);
            });

        We will connect this page to the
        Django backend when the API is ready.
    */

});