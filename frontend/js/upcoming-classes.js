// ========================================
// UPCOMING CLASSES (DASHBOARD)
// Powered by /api/instructor/classes/ & /api/instructor/courses/
// ========================================

document.addEventListener("DOMContentLoaded", () => {
    const api = window.InstructorAPI;
    if (!api) return;

    const listEl = document.getElementById("upcomingClassesList");
    const addClassBtn = document.getElementById("addClassBtn");
    const addClassModal = document.getElementById("addClassModal");
    const closeClassModal = document.getElementById("closeClassModal");
    const cancelClassModal = document.getElementById("cancelClassModal");
    const addClassForm = document.getElementById("addClassForm");
    const courseSelect = document.getElementById("classCourseSelect");
    const dateInput = document.getElementById("classDateInput");
    const timeInput = document.getElementById("classTimeInput");

    const allClassesModal = document.getElementById("allClassesModal");
    const closeAllClasses = document.getElementById("closeAllClasses");
    const allClassesList = document.getElementById("allClassesList");

    const deleteClassModal = document.getElementById("deleteClassModal");
    const deleteClassName = document.getElementById("deleteClassName");
    const cancelDeleteClass = document.getElementById("cancelDeleteClass");
    const confirmDeleteClass = document.getElementById("confirmDeleteClass");

    let classesCache = [];
    let coursesCache = [];
    let pendingDeleteId = null;

    function populateCourseDropdown(courses) {
        coursesCache = courses || [];
        if (!courseSelect) return;
        if (!coursesCache.length) {
            courseSelect.innerHTML = `<option value="">No assigned courses available</option>`;
            return;
        }
        courseSelect.innerHTML = `<option value="">Select a course</option>` + coursesCache
            .map((c) => `<option value="${c.id}">${api.escapeHtml(c.title)}</option>`)
            .join("");
    }

    function buildClassItemHtml(item) {
        const pastStyle = item.is_past ? "opacity:0.6;" : "";
        return `
            <div class="class-item ${item.is_past ? "past" : ""}" data-id="${item.id}" style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid #f1f5f9;gap:10px;${pastStyle}">
                <div>
                    <strong style="display:block;font-size:14px;color:#0f172a;">${api.escapeHtml(item.course || item.subject)}</strong>
                    <span style="font-size:12px;color:#64748b;">
                        <i class="fa-regular fa-calendar"></i> ${api.escapeHtml(item.date)} &nbsp;
                        <i class="fa-regular fa-clock"></i> ${api.escapeHtml(item.time || item.start_time)}
                        ${item.is_past ? " • Held" : " • Upcoming"}
                    </span>
                </div>
                <button type="button" class="delete-class-btn" data-id="${item.id}" data-name="${api.escapeHtml(item.course || item.subject)}" title="Remove class" style="border:none;background:transparent;color:#ef4444;cursor:pointer;padding:6px;">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
    }

    function wireDeleteButtons(container) {
        if (!container) return;
        container.querySelectorAll(".delete-class-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                pendingDeleteId = btn.dataset.id;
                if (deleteClassName) deleteClassName.textContent = btn.dataset.name || "this class";
                deleteClassModal?.classList.add("show");
            });
        });
    }

    function renderClasses(items) {
        classesCache = items || [];
        if (!listEl) return;

        if (!classesCache.length) {
            listEl.innerHTML = `<div style="padding:18px;text-align:center;color:#64748b;font-size:13px;">No classes scheduled yet.</div>`;
            return;
        }

        const MAX_VISIBLE = 6;
        const visible = classesCache.slice(0, MAX_VISIBLE);
        let html = visible.map(buildClassItemHtml).join("");

        if (classesCache.length > MAX_VISIBLE) {
            html += `
                <button type="button" id="showMoreClassesBtn" style="width:100%;margin-top:8px;padding:8px;border:1px solid #e2e8f0;background:#f8fafc;border-radius:8px;color:#2563eb;font-weight:600;cursor:pointer;">
                    +${classesCache.length - MAX_VISIBLE} more scheduled
                </button>
            `;
        }
        listEl.innerHTML = html;
        wireDeleteButtons(listEl);

        document.getElementById("showMoreClassesBtn")?.addEventListener("click", () => {
            if (allClassesList) {
                allClassesList.innerHTML = classesCache.map(buildClassItemHtml).join("");
                wireDeleteButtons(allClassesList);
            }
            allClassesModal?.classList.add("show");
        });
    }

    async function refreshClasses() {
        try {
            const res = await api.request("/instructor/classes/");
            renderClasses(res.results || []);
            if (allClassesModal?.classList.contains("show") && allClassesList) {
                allClassesList.innerHTML = classesCache.map(buildClassItemHtml).join("");
                wireDeleteButtons(allClassesList);
            }
        } catch (err) {
            console.error("Failed to load classes:", err);
        }
    }

    addClassBtn?.addEventListener("click", () => {
        addClassForm?.reset();
        addClassModal?.classList.add("show");
    });
    closeClassModal?.addEventListener("click", () => addClassModal?.classList.remove("show"));
    cancelClassModal?.addEventListener("click", () => addClassModal?.classList.remove("show"));
    closeAllClasses?.addEventListener("click", () => allClassesModal?.classList.remove("show"));

    cancelDeleteClass?.addEventListener("click", () => {
        pendingDeleteId = null;
        deleteClassModal?.classList.remove("show");
    });

    confirmDeleteClass?.addEventListener("click", async () => {
        if (!pendingDeleteId) return;
        try {
            await api.request(`/instructor/classes/${pendingDeleteId}/`, { method: "DELETE" });
            pendingDeleteId = null;
            deleteClassModal?.classList.remove("show");
            await refreshClasses();
            if (typeof window.reloadInstructorDashboard === "function") {
                await window.reloadInstructorDashboard();
            }
        } catch (err) {
            alert(err.message || "Failed to delete class.");
        }
    });

    addClassForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const course_id = courseSelect?.value;
        const date = dateInput?.value;
        const time = timeInput?.value;
        if (!course_id || !date || !time) {
            alert("Please select a course, date, and time.");
            return;
        }
        try {
            await api.request("/instructor/classes/", {
                method: "POST",
                body: JSON.stringify({ course_id, date, time }),
            });
            addClassModal?.classList.remove("show");
            addClassForm.reset();
            await refreshClasses();
            if (typeof window.reloadInstructorDashboard === "function") {
                await window.reloadInstructorDashboard();
            }
        } catch (err) {
            alert(err.message || "Failed to schedule class.");
        }
    });

    if (window.__instructorDashboardData) {
        populateCourseDropdown(window.__instructorDashboardData.course_overview || []);
        renderClasses(window.__instructorDashboardData.upcoming_classes || []);
    }

    window.addEventListener("instructor:dashboardLoaded", (event) => {
        populateCourseDropdown(event.detail?.course_overview || []);
        renderClasses(event.detail?.upcoming_classes || []);
    });
});
