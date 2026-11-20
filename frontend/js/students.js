// ========================================
// INSTRUCTOR STUDENTS PAGE JAVASCRIPT
// Connected to /api/instructor/students/
// ========================================

document.addEventListener("DOMContentLoaded", async () => {
    const api = window.InstructorAPI;
    if (!api || !api.enforceInstructorAuth()) return;

    const menuToggle = document.querySelector(".menu-toggle");
    const sidebar = document.querySelector(".sidebar");
    if (menuToggle && sidebar) {
        menuToggle.addEventListener("click", () => sidebar.classList.toggle("show"));
    }
    document.querySelectorAll(".sidebar .menu-item").forEach((link) => {
        link.addEventListener("click", () => {
            if (window.innerWidth <= 768) sidebar?.classList.remove("show");
        });
    });

    const tableBody = document.querySelector("#studentsTable tbody");
    const searchInput = document.getElementById("studentSearch");
    const courseFilter = document.getElementById("courseFilter");

    const studentModal = document.getElementById("studentModal");
    const closeStudentModal = document.getElementById("closeStudentModal");
    const modalCloseButton = document.getElementById("modalCloseButton");

    const addStudentBtn = document.getElementById("addStudentBtn");
    const addStudentModal = document.getElementById("addStudentModal");
    const closeAddStudentModal = document.getElementById("closeAddStudentModal");
    const cancelAddStudent = document.getElementById("cancelAddStudent");
    const addStudentForm = document.getElementById("addStudentForm");
    const studentNameInput = document.getElementById("studentNameInput");
    const studentEmailInput = document.getElementById("studentEmailInput");
    const studentCourseInput = document.getElementById("studentCourseInput");
    const studentStatusInput = document.getElementById("studentStatusInput");

    let allEnrollments = [];
    let instructorCourses = [];

    function updateStatCards(stats) {
        const cards = document.querySelectorAll(".student-stats .stat-card h3, .student-stats .stat-card h2");
        if (cards.length >= 4 && stats) {
            cards[0].textContent = String(stats.total_students ?? 0);
            cards[1].textContent = String(stats.active_students ?? 0);
            cards[2].textContent = String(stats.students_in_courses ?? 0);
            cards[3].textContent = String(stats.top_performers ?? 0);
        }
    }

    function populateCourseSelects(courses) {
        instructorCourses = courses || [];
        if (courseFilter) {
            const currentVal = courseFilter.value || "all";
            courseFilter.innerHTML =
                `<option value="all">All Courses</option>` +
                instructorCourses
                    .map((c) => `<option value="${c.id}">${api.escapeHtml(c.title)}</option>`)
                    .join("");
            if (Array.from(courseFilter.options).some((o) => o.value === currentVal)) {
                courseFilter.value = currentVal;
            }
        }
        if (studentCourseInput) {
            if (!instructorCourses.length) {
                studentCourseInput.innerHTML = `<option value="">No assigned courses available</option>`;
            } else {
                studentCourseInput.innerHTML =
                    `<option value="">Select Course</option>` +
                    instructorCourses
                        .map((c) => `<option value="${c.id}">${api.escapeHtml(c.title)}</option>`)
                        .join("");
            }
        }
    }

    function renderStudents(list) {
        if (!tableBody) return;
        if (!list.length) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center;padding:28px;color:#64748b;">
                        No students enrolled in your courses yet.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = list
            .map((s) => {
                const isActive = s.status === "Active";
                const progress = s.progress ?? 0;
                return `
                    <tr data-id="${s.id}" data-enrollment-id="${s.enrollment_id}">
                        <td>
                            <div class="student-cell" style="display:flex;align-items:center;gap:10px;">
                                <div class="student-avatar">${api.escapeHtml(s.initials)}</div>
                                <div>
                                    <h4>${api.escapeHtml(s.full_name)}</h4>
                                    <span>ID: ${api.escapeHtml(s.student_id)}</span>
                                </div>
                            </div>
                        </td>
                        <td>${api.escapeHtml(s.email)}</td>
                        <td>${api.escapeHtml(s.course)}</td>
                        <td>
                            <div class="progress-wrapper">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width:${progress}%"></div>
                                </div>
                                <span>${progress}%</span>
                            </div>
                        </td>
                        <td>
                            <span class="status ${isActive ? "active" : "inactive"}">${api.escapeHtml(s.status)}</span>
                        </td>
                        <td>
                            <button type="button" class="view-btn" data-enrollment-id="${s.enrollment_id}">View</button>
                        </td>
                    </tr>
                `;
            })
            .join("");

        tableBody.querySelectorAll(".view-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                const record = allEnrollments.find((e) => String(e.enrollment_id) === String(btn.dataset.enrollmentId));
                if (!record || !studentModal) return;
                const set = (id, val) => {
                    const el = document.getElementById(id);
                    if (el) el.textContent = val;
                };
                set("modalStudentAvatar", record.initials);
                set("modalStudentName", record.full_name);
                set("modalStudentId", `ID: ${record.student_id}`);
                set("modalStudentEmail", record.email);
                set("modalStudentCourse", record.course);
                set("modalStudentProgress", `${record.progress ?? 0}%${record.grade ? ` (Grade: ${record.grade})` : ""}`);
                set("modalStudentStatus", record.status);
                studentModal.classList.add("show");
            });
        });
    }

    function applyFilters() {
        const q = (searchInput?.value || "").trim().toLowerCase();
        const cf = (courseFilter?.value || "all").toLowerCase();
        const filtered = allEnrollments.filter((s) => {
            const matchesSearch =
                !q ||
                (s.full_name || "").toLowerCase().includes(q) ||
                (s.email || "").toLowerCase().includes(q) ||
                (s.student_id || "").toLowerCase().includes(q) ||
                (s.course || "").toLowerCase().includes(q);
            const matchesCourse = cf === "all" || String(s.course_id) === cf;
            return matchesSearch && matchesCourse;
        });
        renderStudents(filtered);
    }

    async function loadStudents() {
        try {
            const data = await api.request("/instructor/students/");
            allEnrollments = data.results || [];
            updateStatCards(data.stats);
            populateCourseSelects(data.courses || []);
            applyFilters();
        } catch (err) {
            console.error("Failed to load students:", err);
        }
    }

    closeStudentModal?.addEventListener("click", () => studentModal?.classList.remove("show"));
    modalCloseButton?.addEventListener("click", () => studentModal?.classList.remove("show"));
    studentModal?.addEventListener("click", (e) => {
        if (e.target === studentModal) studentModal.classList.remove("show");
    });

    addStudentBtn?.addEventListener("click", () => {
        addStudentForm?.reset();
        addStudentModal?.classList.add("show");
    });
    closeAddStudentModal?.addEventListener("click", () => addStudentModal?.classList.remove("show"));
    cancelAddStudent?.addEventListener("click", () => addStudentModal?.classList.remove("show"));

    addStudentForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            name: (studentNameInput?.value || "").trim(),
            email: (studentEmailInput?.value || "").trim(),
            course_id: studentCourseInput?.value || "",
            status: studentStatusInput?.value || "Active",
        };
        if (!payload.email || !payload.course_id) {
            alert("Please enter the student's email and select a course.");
            return;
        }
        try {
            await api.request("/instructor/students/", {
                method: "POST",
                body: JSON.stringify(payload),
            });
            addStudentModal?.classList.remove("show");
            addStudentForm.reset();
            await loadStudents();
        } catch (err) {
            alert(err.message || "Failed to enroll student.");
        }
    });

    searchInput?.addEventListener("input", applyFilters);
    courseFilter?.addEventListener("change", applyFilters);

    await loadStudents();
});
