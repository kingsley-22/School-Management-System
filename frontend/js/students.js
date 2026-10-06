// ========================================
// STUDENTS PAGE JAVASCRIPT
// ========================================

document.addEventListener("DOMContentLoaded", () => {

    // ---- STORAGE ----
    const STORAGE_KEY = "createdStudents";

    function loadSaved() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
        catch { return []; }
    }
    function persistSaved(arr) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    }


    // ---- MOBILE SIDEBAR ----
    const menuToggle = document.querySelector(".menu-toggle");
    const sidebar = document.querySelector(".sidebar");

    if (menuToggle && sidebar) {
        menuToggle.addEventListener("click", () => sidebar.classList.toggle("show"));
    }

    document.querySelectorAll(".sidebar .menu-item").forEach(link => {
        link.addEventListener("click", () => {
            if (window.innerWidth <= 768) sidebar.classList.remove("show");
        });
    });


    // ---- ELEMENTS ----
    const studentSearch = document.getElementById("studentSearch");
    const studentsTable = document.getElementById("studentsTable");
    const courseFilter = document.getElementById("courseFilter");

    const studentModal = document.getElementById("studentModal");
    const closeStudentModal = document.getElementById("closeStudentModal");
    const modalCloseButton = document.getElementById("modalCloseButton");

    const addStudentBtn = document.getElementById("addStudentBtn");
    const addStudentModal = document.getElementById("addStudentModal");
    const closeAddStudentModal = document.getElementById("closeAddStudentModal");
    const cancelAddStudent = document.getElementById("cancelAddStudent");
    const addStudentForm = document.getElementById("addStudentForm");


    // ---- SEARCH ----
    if (studentSearch && studentsTable) {
        studentSearch.addEventListener("input", () => {
            const v = studentSearch.value.toLowerCase().trim();
            studentsTable.querySelectorAll("tr").forEach(row => {
                row.style.display = row.textContent.toLowerCase().includes(v) ? "" : "none";
            });
        });
    }


    // ---- COURSE FILTER ----
    function courseMatches(course, selected) {
        if (selected === "web") return course.includes("web");
        if (selected === "python") return course.includes("python");
        if (selected === "design") return course.includes("ui/ux");
        if (selected === "forex") return course.includes("forex");
        return true;
    }

    if (courseFilter && studentsTable) {
        courseFilter.addEventListener("change", () => {
            const selected = courseFilter.value.toLowerCase();
            studentsTable.querySelectorAll("tr").forEach(row => {
                const cell = row.querySelector("td:nth-child(3)");
                if (!cell) return;
                const course = cell.textContent.toLowerCase().trim();
                row.style.display =
                    (selected === "all" || courseMatches(course, selected)) ? "" : "none";
            });
        });
    }


    // ---- VIEW MODAL ----
    function openViewModal(row) {
        document.getElementById("modalStudentName").textContent =
            row.querySelector(".student-name strong")?.textContent.trim();
        document.getElementById("modalStudentId").textContent =
            row.querySelector(".student-name small")?.textContent.trim();
        document.getElementById("modalStudentAvatar").textContent =
            row.querySelector(".student-avatar")?.textContent.trim();
        document.getElementById("modalStudentEmail").textContent =
            row.children[1]?.textContent.trim();
        document.getElementById("modalStudentCourse").textContent =
            row.children[2]?.textContent.trim();
        document.getElementById("modalStudentProgress").textContent =
            row.children[3]?.textContent.trim();
        document.getElementById("modalStudentStatus").textContent =
            row.children[4]?.textContent.trim();

        studentModal.classList.add("show");
    }

    function closeViewModal() {
        studentModal.classList.remove("show");
    }

    function attachViewButton(row) {
        const btn = row.querySelector(".view-btn");
        if (btn) btn.addEventListener("click", () => openViewModal(row));
    }

    document.querySelectorAll(".view-btn").forEach(btn => {
        btn.addEventListener("click", () => openViewModal(btn.closest("tr")));
    });

    if (closeStudentModal) closeStudentModal.addEventListener("click", closeViewModal);
    if (modalCloseButton) modalCloseButton.addEventListener("click", closeViewModal);

    if (studentModal) {
        studentModal.addEventListener("click", (e) => {
            if (e.target === studentModal) closeViewModal();
        });
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeViewModal();
    });


    // ---- ADD MODAL ----
    function openAddModal() { addStudentModal.classList.add("show"); }
    function closeAddModal() { addStudentModal.classList.remove("show"); }

    if (addStudentBtn) addStudentBtn.addEventListener("click", openAddModal);
    if (closeAddStudentModal) closeAddStudentModal.addEventListener("click", closeAddModal);
    if (cancelAddStudent) cancelAddStudent.addEventListener("click", closeAddModal);

    if (addStudentModal) {
        addStudentModal.addEventListener("click", (e) => {
            if (e.target === addStudentModal) closeAddModal();
        });
    }


    // ---- BUILD ROW ----
    function buildStudentRow(data) {
        const rowCount = studentsTable.querySelectorAll("tr").length + 1;
        const studentId = "ST" + String(rowCount).padStart(3, "0");
        const initials = data.name.split(" ")
            .map(w => w.charAt(0)).join("")
            .substring(0, 2).toUpperCase();
        const statusClass = data.status === "Active" ? "active-status" : "inactive-status";
        const progress = data.progress || 0;

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>
                <div class="student-name">
                    <div class="student-avatar">${initials}</div>
                    <div>
                        <strong>${data.name}</strong>
                        <small>ID: ${studentId}</small>
                    </div>
                </div>
            </td>
            <td>${data.email}</td>
            <td>${data.course}</td>
            <td>
                <div class="progress-container">
                    <div class="progress-bar">
                        <span style="width: ${progress}%;"></span>
                    </div>
                    <small>${progress}%</small>
                </div>
            </td>
            <td><span class="status ${statusClass}">${data.status}</span></td>
            <td><button class="view-btn">View</button></td>
        `;
        return row;
    }


    // ---- SUBMIT NEW STUDENT ----
        if (addStudentForm) {
        addStudentForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const name = document.getElementById("studentNameInput").value.trim();
            const email = document.getElementById("studentEmailInput").value.trim();
            const course = document.getElementById("studentCourseInput").value;
            const status = document.getElementById("studentStatusInput").value;

            if (!name || !email || !course) {
                alert("Please fill in all required fields.");
                return;
            }

            const record = { name, email, course, status, progress: 0 };

            const saved = loadSaved();
            saved.push(record);
            persistSaved(saved);
                        window.logActivity?.(
                "student",
                "New student added",
                `${name} joined ${course}`,
                "/instructor/students/"
            );

            const row = buildStudentRow(record);
            studentsTable.appendChild(row);
            attachViewButton(row);

            addStudentForm.reset();
            closeAddModal();
            alert(`${name} has been added successfully!`);
        });
    }


    // ---- RESTORE ----
    const savedStudents = loadSaved();
    if (studentsTable && savedStudents.length) {
        savedStudents.forEach(s => {
            const exists = Array.from(studentsTable.querySelectorAll(".student-name strong"))
                .some(el => el.textContent.trim() === s.name);
            if (exists) return;

            const row = buildStudentRow(s);
            studentsTable.appendChild(row);
            attachViewButton(row);
        });
    }

});