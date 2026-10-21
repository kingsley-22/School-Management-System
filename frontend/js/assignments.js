// ========================================
// ASSIGNMENTS PAGE JAVASCRIPT
// ========================================

document.addEventListener("DOMContentLoaded", () => {

    // ---- STORAGE ----
    const STORAGE_KEY = "createdAssignments";

    function loadSaved() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
        catch { return []; }
    }
    function persistSaved(arr) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    }

    const COURSE_LABELS = {
        "web-development": "Web Development",
        "python": "Python",
        "ui-ux": "UI/UX Design"
    };
    const COURSE_VALUES = {
        "Web Development": "web-development",
        "Python": "python",
        "UI/UX Design": "ui-ux"
    };


    // ---- ELEMENTS ----
    const searchInput = document.getElementById("assignmentSearch");
    const filterSelect = document.getElementById("assignmentFilter");
    const tableBody = document.getElementById("assignmentsTable");
    const createButton = document.querySelector(".create-assignment-btn");
    const menuToggle = document.querySelector(".menu-toggle");
    const sidebar = document.querySelector(".sidebar");

    const createModal = document.getElementById("assignmentModal");
    const closeCreateModal = document.getElementById("closeModal");
    const cancelCreateModal = document.getElementById("cancelModal");
    const createForm = document.getElementById("assignmentForm");

    const editModal = document.getElementById("editAssignmentModal");
    const closeEditModal = document.getElementById("closeEditModal");
    const cancelEditModal = document.getElementById("cancelEditModal");
    const editForm = document.getElementById("editAssignmentForm");

    let editingRow = null;


    // ---- MOBILE SIDEBAR ----
    if (menuToggle && sidebar) {
        menuToggle.addEventListener("click", () => sidebar.classList.toggle("show"));
    }

    document.querySelectorAll(".sidebar .menu-item").forEach(link => {
        link.addEventListener("click", () => {
            if (window.innerWidth <= 768) sidebar.classList.remove("show");
        });
    });


    // ---- SEARCH + FILTER ----
    function filterAssignments() {
        const s = searchInput.value.trim().toLowerCase();
        const selected = filterSelect.value;
        const courseMap = {
            "web-development": "web development",
            "python": "python",
            "ui-ux": "ui/ux design"
        };

        tableBody.querySelectorAll("tr").forEach(row => {
            const name = row.querySelector(".assignment-name strong")
                ?.textContent.toLowerCase() || "";
            const course = row.querySelector("td:nth-child(2)")
                ?.textContent.trim().toLowerCase() || "";

            const matchSearch = name.includes(s);
            const matchCourse = selected === "all" || course === courseMap[selected];

            row.style.display = (matchSearch && matchCourse) ? "" : "none";
        });
    }

    if (searchInput) searchInput.addEventListener("input", filterAssignments);
    if (filterSelect) filterSelect.addEventListener("change", filterAssignments);


    // ---- BUILD ROW ----
    function generateId() {
        return "AS" + String(
            tableBody.querySelectorAll("tr").length + 1
        ).padStart(3, "0");
    }

    function buildRow(data) {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>
                <div class="assignment-name">
                    <div class="assignment-icon">
                        <i class="fa-solid fa-file-lines"></i>
                    </div>
                    <div>
                        <strong>${data.title}</strong>
                        <small>Assignment ID: ${data.id}</small>
                    </div>
                </div>
            </td>
            <td>${data.courseLabel}</td>
            <td>${data.formattedDate}</td>
            <td><strong>0 / ${data.score || 100}</strong></td>
            <td><span class="status active-status">Active</span></td>
            <td>
                <div class="action-buttons">
                    <button class="view-btn"><i class="fa-solid fa-eye"></i> View</button>
                    <button class="edit-btn"><i class="fa-solid fa-pen"></i> Edit</button>
                    <button class="delete-btn"><i class="fa-solid fa-trash"></i> Delete</button>
                </div>
            </td>
        `;
        return row;
    }

    function attachRowHandlers(row) {
        row.querySelector(".view-btn")?.addEventListener("click", () => {
            const name = row.querySelector(".assignment-name strong").textContent.trim();
            const course = row.children[1].textContent.trim();
            const due = row.children[2].textContent.trim();
            alert(`Assignment: ${name}\n\nCourse: ${course}\nDue Date: ${due}`);
        });

        row.querySelector(".edit-btn")?.addEventListener("click", () => openEdit(row));

        row.querySelector(".delete-btn")?.addEventListener("click", () => {
            const name = row.querySelector(".assignment-name strong").textContent.trim();
            if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

            const saved = loadSaved();
            persistSaved(saved.filter(a => a.title !== name));

            row.remove();
            alert("Assignment deleted successfully!");
        });
    }

    tableBody.querySelectorAll("tr").forEach(attachRowHandlers);


    // ---- CREATE MODAL ----
    function openCreate() { createModal.classList.add("show"); }
    function closeCreate() { createModal.classList.remove("show"); }

    if (createButton) createButton.addEventListener("click", openCreate);
    if (closeCreateModal) closeCreateModal.addEventListener("click", closeCreate);
    if (cancelCreateModal) cancelCreateModal.addEventListener("click", closeCreate);
    if (createModal) {
        createModal.addEventListener("click", (e) => {
            if (e.target === createModal) closeCreate();
        });
    }

    if (createForm) {
        createForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const title = document.getElementById("assignmentTitle").value.trim();
            const course = document.getElementById("assignmentCourse").value;
            const description = document.getElementById("assignmentDescription").value.trim();
            const dueDate = document.getElementById("assignmentDueDate").value;
            const score = document.getElementById("assignmentScore").value;

            if (!title || !course || !dueDate) {
                alert("Please fill in all required fields.");
                return;
            }

            const courseLabel = COURSE_LABELS[course] || course;
            const d = new Date(dueDate + "T00:00:00");
            const formattedDate = d.toLocaleDateString("en-GB", {
                day: "2-digit", month: "short", year: "numeric"
            });

            const record = {
                id: generateId(),
                title, course, courseLabel,
                description, dueDate, formattedDate,
                score
            };

            const saved = loadSaved();
            saved.push(record);
            persistSaved(saved);

            const row = buildRow(record);
            tableBody.appendChild(row);
            attachRowHandlers(row);

            alert("Assignment created successfully!");
            createForm.reset();
            closeCreate();
        });
    }


    // ---- EDIT MODAL ----
    function openEdit(row) {
        editingRow = row;

        const title = row.querySelector(".assignment-name strong").textContent.trim();
        const course = row.children[1].textContent.trim();
        const dueDate = row.children[2].textContent.trim();
        const score = row.children[3].textContent.match(/\d+/g)?.[1] || "100";

        document.getElementById("editAssignmentTitle").value = title;
        document.getElementById("editAssignmentCourse").value = COURSE_VALUES[course] || "";
        document.getElementById("editAssignmentDescription").value = "Update the assignment description.";
        document.getElementById("editAssignmentScore").value = score;

        const dt = new Date(dueDate);
        if (!isNaN(dt.getTime())) {
            const y = dt.getFullYear();
            const m = String(dt.getMonth() + 1).padStart(2, "0");
            const d = String(dt.getDate()).padStart(2, "0");
            document.getElementById("editAssignmentDueDate").value = `${y}-${m}-${d}`;
        }

        editModal.classList.add("show");
    }

    function closeEdit() {
        editModal.classList.remove("show");
        editingRow = null;
    }

    if (closeEditModal) closeEditModal.addEventListener("click", closeEdit);
    if (cancelEditModal) cancelEditModal.addEventListener("click", closeEdit);
    if (editModal) {
        editModal.addEventListener("click", (e) => {
            if (e.target === editModal) closeEdit();
        });
    }

    if (editForm) {
        editForm.addEventListener("submit", (e) => {
            e.preventDefault();
            if (!editingRow) return;

            const newTitle = document.getElementById("editAssignmentTitle").value.trim();
            const newCourse = document.getElementById("editAssignmentCourse").value;
            const newDueDate = document.getElementById("editAssignmentDueDate").value;
            const newScore = document.getElementById("editAssignmentScore").value;

            const oldTitle = editingRow.querySelector(".assignment-name strong").textContent.trim();

            editingRow.querySelector(".assignment-name strong").textContent = newTitle;
            editingRow.children[1].textContent = COURSE_LABELS[newCourse] || newCourse;

            if (newDueDate) {
                const d = new Date(newDueDate + "T00:00:00");
                editingRow.children[2].textContent = d.toLocaleDateString("en-GB", {
                    day: "2-digit", month: "short", year: "numeric"
                });
            }
            if (newScore) {
                editingRow.children[3].innerHTML = `<strong>0 / ${newScore}</strong>`;
            }

            const saved = loadSaved();
            const idx = saved.findIndex(a => a.title === oldTitle);
            if (idx !== -1) {
                saved[idx].title = newTitle;
                saved[idx].course = newCourse;
                saved[idx].courseLabel = COURSE_LABELS[newCourse] || newCourse;
                saved[idx].score = newScore;
                if (newDueDate) {
                    const d = new Date(newDueDate + "T00:00:00");
                    saved[idx].dueDate = newDueDate;
                    saved[idx].formattedDate = d.toLocaleDateString("en-GB", {
                        day: "2-digit", month: "short", year: "numeric"
                    });
                }
                persistSaved(saved);
                
                            window.logActivity?.(
                "assignment",
                "New assignment created",
                `"${title}" for ${courseLabel}`,
                "/instructor/assignments/"
            );
                        window.logActivity?.(
                "delete",
                "Assignment deleted",
                `"${name}" was removed`,
                "/instructor/assignments/"
            );
                       window.logActivity?.("delete", "Assignment deleted", `"${name}" was removed`, "/instructor/assignments/");
            }

            alert("Assignment updated successfully!");
            closeEdit();
        });
    }


    // ---- RESTORE ----
    const savedAssignments = loadSaved();
    if (tableBody && savedAssignments.length) {
        savedAssignments.forEach(a => {
            const exists = Array.from(tableBody.querySelectorAll(".assignment-name strong"))
                .some(el => el.textContent.trim() === a.title);
            if (exists) return;

            const row = buildRow(a);
            tableBody.appendChild(row);
            attachRowHandlers(row);
        });
    }

});