// ========================================
// INSTRUCTOR COURSES PAGE JAVASCRIPT
// Connected to /api/instructor/courses/
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

    const coursesGrid = document.getElementById("coursesGrid");
    const courseSearch = document.getElementById("courseSearch");
    const courseFilter = document.getElementById("courseFilter");

    const createBtn = document.querySelector(".create-course-btn");
    const createModal = document.getElementById("createCourseModal");
    const closeCourseModal = document.getElementById("closeCourseModal");
    const cancelCourseModal = document.getElementById("cancelCourseModal");
    const createForm = document.getElementById("createCourseForm");
    const titleInput = document.getElementById("courseTitleInput");
    const descInput = document.getElementById("courseDescriptionInput");
    const catInput = document.getElementById("courseCategoryInput");
    const statusInput = document.getElementById("courseStatusInput");
    const lessonsInput = document.getElementById("courseLessonsInput");
    const modalHeading = createModal?.querySelector("h2, h3");
    const modalSubmitBtn = createForm?.querySelector('button[type="submit"]');

    const deleteModal = document.getElementById("deleteCourseModal");
    const deleteCourseName = document.getElementById("deleteCourseName");
    const cancelDeleteCourse = document.getElementById("cancelDeleteCourse");
    const confirmDeleteCourse = document.getElementById("confirmDeleteCourse");

    let allCourses = [];
    let editingCourseId = null;
    let deletingCourseId = null;

    function showToast(message, isError = false) {
        const container = document.getElementById(isError ? "toastContainer" : "successToastContainer") || document.body;
        const toast = document.createElement("div");
        toast.textContent = message;
        toast.style.cssText = `
            position:fixed;bottom:20px;right:20px;z-index:3000;padding:12px 18px;border-radius:10px;
            color:#fff;font-size:13px;font-weight:600;box-shadow:0 10px 25px rgba(0,0,0,0.15);
            background:${isError ? "#dc2626" : "#16a34a"};
        `;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    function categoryMeta(category) {
        const c = (category || "").toLowerCase();
        if (c.includes("web") || c.includes("front")) return { cls: "web", icon: "fa-code" };
        if (c.includes("python") || c.includes("back") || c.includes("data")) return { cls: "python", icon: "fa-laptop-code" };
        if (c.includes("data") || c.includes("sql") || c.includes("db")) return { cls: "database", icon: "fa-database" };
        return { cls: "web", icon: "fa-book-open" };
    }

    function renderCourses(list) {
        if (!coursesGrid) return;
        if (!list.length) {
            coursesGrid.innerHTML = `
                <div style="grid-column:1/-1;background:#fff;border-radius:14px;padding:36px;text-align:center;color:#64748b;border:1px solid #e2e8f0;">
                    <i class="fa-solid fa-book-open" style="font-size:28px;margin-bottom:10px;color:#94a3b8;"></i>
                    <p style="margin:0;font-size:15px;font-weight:600;color:#334155;">No courses found</p>
                    <p style="margin:6px 0 0;font-size:13px;">Create a new course or ask an Admin to assign one to you.</p>
                </div>
            `;
            return;
        }

        coursesGrid.innerHTML = list
            .map((course) => {
                const meta = categoryMeta(course.category);
                const isActive = course.status === "Active";
                const progress = course.progress_percent ?? 0;
                return `
                    <div class="course-card" data-id="${course.id}" data-status="${isActive ? "active" : "draft"}">
                        <div class="course-card-header">
                            <div class="course-image ${meta.cls}">
                                <i class="fa-solid ${meta.icon}"></i>
                            </div>
                            <span class="status ${isActive ? "active-status" : "draft-status"}">
                                ${isActive ? "Active" : "Draft"}
                            </span>
                        </div>
                        <div class="course-body">
                            <h3>${api.escapeHtml(course.title)}</h3>
                            <p>${api.escapeHtml(course.description || "No description provided.")}</p>
                            <div class="course-meta">
                                <span><i class="fa-solid fa-users"></i> ${course.students_count ?? 0} Students</span>
                                <span><i class="fa-solid fa-book"></i> ${course.lessons_count ?? 0} Lessons</span>
                            </div>
                            <div class="course-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width:${progress}%"></div>
                                </div>
                                <span>${progress}%</span>
                            </div>
                        </div>
                        <div class="course-actions">
                            <button type="button" class="view-course" data-id="${course.id}">View Course</button>
                            <button type="button" class="edit-course" data-id="${course.id}">Edit</button>
                            <button type="button" class="delete-course" data-id="${course.id}" data-title="${api.escapeHtml(course.title)}" style="background:#fee2e2;color:#dc2626;border:none;border-radius:8px;padding:8px 12px;cursor:pointer;font-weight:600;">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            })
            .join("");

        coursesGrid.querySelectorAll(".view-course").forEach((btn) => {
            btn.addEventListener("click", () => {
                const course = allCourses.find((c) => String(c.id) === String(btn.dataset.id));
                if (!course) return;
                alert(
                    `${course.title} (${course.code || "N/A"})\n` +
                    `Status: ${course.status}\n` +
                    `Category: ${course.category || "General"}\n` +
                    `Lessons: ${course.lessons_count ?? 0}\n` +
                    `Enrolled Students: ${course.students_count ?? 0}\n` +
                    `Average Progress: ${course.progress_percent ?? 0}%\n\n` +
                    `${course.description || ""}`
                );
            });
        });

        coursesGrid.querySelectorAll(".edit-course").forEach((btn) => {
            btn.addEventListener("click", () => {
                const course = allCourses.find((c) => String(c.id) === String(btn.dataset.id));
                if (!course) return;
                editingCourseId = course.id;
                if (titleInput) titleInput.value = course.title || "";
                if (descInput) descInput.value = course.description || "";
                if (catInput) {
                    const matched = Array.from(catInput.options).some((o) => o.value === course.category);
                    catInput.value = matched ? course.category : "other";
                }
                if (statusInput) statusInput.value = course.status === "Active" ? "Active" : "Draft";
                if (lessonsInput) lessonsInput.value = String(course.lessons_count ?? 0);
                if (modalHeading) modalHeading.textContent = "Edit Course";
                if (modalSubmitBtn) modalSubmitBtn.textContent = "Save Changes";
                createModal?.classList.add("show");
            });
        });

        coursesGrid.querySelectorAll(".delete-course").forEach((btn) => {
            btn.addEventListener("click", () => {
                deletingCourseId = btn.dataset.id;
                if (deleteCourseName) deleteCourseName.textContent = btn.dataset.title || "this course";
                deleteModal?.classList.add("show");
            });
        });
    }

    function applyFilters() {
        const q = (courseSearch?.value || "").trim().toLowerCase();
        const filter = (courseFilter?.value || "all").toLowerCase();
        const filtered = allCourses.filter((c) => {
            const matchesSearch =
                !q ||
                (c.title || "").toLowerCase().includes(q) ||
                (c.description || "").toLowerCase().includes(q) ||
                (c.code || "").toLowerCase().includes(q);
            const matchesStatus = filter === "all" || (c.status || "").toLowerCase() === filter;
            return matchesSearch && matchesStatus;
        });
        renderCourses(filtered);
    }

    async function loadCourses() {
        try {
            const data = await api.request("/instructor/courses/");
            allCourses = data.results || [];
            applyFilters();
        } catch (err) {
            showToast(err.message || "Failed to load courses.", true);
        }
    }

    createBtn?.addEventListener("click", () => {
        editingCourseId = null;
        createForm?.reset();
        if (modalHeading) modalHeading.textContent = "Create New Course";
        if (modalSubmitBtn) modalSubmitBtn.textContent = "Create Course";
        createModal?.classList.add("show");
    });

    closeCourseModal?.addEventListener("click", () => createModal?.classList.remove("show"));
    cancelCourseModal?.addEventListener("click", () => createModal?.classList.remove("show"));
    cancelDeleteCourse?.addEventListener("click", () => {
        deletingCourseId = null;
        deleteModal?.classList.remove("show");
    });

    createForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            title: (titleInput?.value || "").trim(),
            description: (descInput?.value || "").trim(),
            category: catInput?.value || "other",
            status: statusInput?.value || "Active",
            lessons: parseInt(lessonsInput?.value || "0", 10) || 0,
        };
        if (!payload.title) {
            showToast("Course title is required.", true);
            return;
        }
        try {
            if (editingCourseId) {
                await api.request(`/instructor/courses/${editingCourseId}/`, {
                    method: "PATCH",
                    body: JSON.stringify(payload),
                });
                showToast("Course updated successfully.");
            } else {
                await api.request("/instructor/courses/", {
                    method: "POST",
                    body: JSON.stringify(payload),
                });
                showToast("Course created successfully.");
            }
            createModal?.classList.remove("show");
            editingCourseId = null;
            await loadCourses();
        } catch (err) {
            showToast(err.message || "Failed to save course.", true);
        }
    });

    confirmDeleteCourse?.addEventListener("click", async () => {
        if (!deletingCourseId) return;
        try {
            await api.request(`/instructor/courses/${deletingCourseId}/`, { method: "DELETE" });
            deleteModal?.classList.remove("show");
            deletingCourseId = null;
            showToast("Course deleted successfully.");
            await loadCourses();
        } catch (err) {
            showToast(err.message || "Failed to delete course.", true);
        }
    });

    courseSearch?.addEventListener("input", applyFilters);
    courseFilter?.addEventListener("change", applyFilters);

    await loadCourses();
});
