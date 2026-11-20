// ========================================
// INSTRUCTOR ASSIGNMENTS & GRADING JAVASCRIPT
// Connected to /api/instructor/assignments/ & /submissions/
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

    const tableBody = document.querySelector("#assignmentsTable tbody");
    const searchInput = document.getElementById("assignmentSearch");
    const filterSelect = document.getElementById("assignmentFilter");

    const createBtn = document.querySelector(".create-assignment-btn");
    const createModal = document.getElementById("assignmentModal");
    const closeCreateModal = document.getElementById("closeModal");
    const cancelCreateModal = document.getElementById("cancelModal");
    const createForm = document.getElementById("assignmentForm");

    const editModal = document.getElementById("editAssignmentModal");
    const closeEditModal = document.getElementById("closeEditModal");
    const cancelEditModal = document.getElementById("cancelEditModal");
    const editForm = document.getElementById("editAssignmentForm");

    let allAssignments = [];
    let instructorCourses = [];
    let editingAssignmentId = null;

    function updateStatCards(stats) {
        const cards = document.querySelectorAll(".assignment-stats .stat-card h3, .assignment-stats .stat-card h2");
        if (cards.length >= 4 && stats) {
            cards[0].textContent = String(stats.total_assignments ?? 0);
            cards[1].textContent = String(stats.active_assignments ?? 0);
            cards[2].textContent = String(stats.completed_assignments ?? 0);
            cards[3].textContent = String(stats.total_submissions ?? 0);
        }
    }

    function populateCourseSelects(courses) {
        instructorCourses = courses || [];
        const optionsHtml = instructorCourses.length
            ? `<option value="">Select Course</option>` +
              instructorCourses.map((c) => `<option value="${c.id}">${api.escapeHtml(c.title)}</option>`).join("")
            : `<option value="">No assigned courses available</option>`;

        const createCourse = document.getElementById("assignmentCourse");
        const editCourse = document.getElementById("editAssignmentCourse");
        if (createCourse) createCourse.innerHTML = optionsHtml;
        if (editCourse) editCourse.innerHTML = optionsHtml;

        if (filterSelect) {
            const prev = filterSelect.value || "all";
            filterSelect.innerHTML =
                `<option value="all">All Courses</option>` +
                instructorCourses.map((c) => `<option value="${c.id}">${api.escapeHtml(c.title)}</option>`).join("");
            if (Array.from(filterSelect.options).some((o) => o.value === prev)) {
                filterSelect.value = prev;
            }
        }
    }

    function formatDisplayDate(iso) {
        if (!iso) return "—";
        const d = new Date(iso + "T00:00:00");
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    }

    // ========================================
    // SUBMISSIONS & GRADING MODAL
    // ========================================
    function ensureSubmissionsModal() {
        let modal = document.getElementById("submissionsGradingModal");
        if (modal) return modal;
        modal = document.createElement("div");
        modal.id = "submissionsGradingModal";
        modal.style.cssText = `
            position:fixed;inset:0;background:rgba(15,23,42,0.55);display:none;
            align-items:center;justify-content:center;z-index:2600;padding:16px;
        `;
        modal.innerHTML = `
            <div style="background:#fff;border-radius:14px;width:100%;max-width:720px;max-height:85vh;overflow-y:auto;padding:22px;box-shadow:0 20px 50px rgba(15,23,42,0.22);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                    <div>
                        <h3 id="subModalTitle" style="margin:0;font-size:18px;color:#0f172a;">Submissions</h3>
                        <p id="subModalMeta" style="margin:4px 0 0;font-size:13px;color:#64748b;"></p>
                    </div>
                    <button type="button" id="closeSubModal" style="border:none;background:#f1f5f9;width:32px;height:32px;border-radius:8px;cursor:pointer;font-size:15px;">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div id="subModalBody"></div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector("#closeSubModal").addEventListener("click", () => {
            modal.style.display = "none";
        });
        modal.addEventListener("click", (e) => {
            if (e.target === modal) modal.style.display = "none";
        });
        return modal;
    }

    async function openSubmissionsModal(assignmentId) {
        const modal = ensureSubmissionsModal();
        const titleEl = modal.querySelector("#subModalTitle");
        const metaEl = modal.querySelector("#subModalMeta");
        const bodyEl = modal.querySelector("#subModalBody");
        bodyEl.innerHTML = `<p style="color:#64748b;padding:16px 0;">Loading submissions...</p>`;
        modal.style.display = "flex";

        try {
            const data = await api.request(`/instructor/assignments/${assignmentId}/submissions/`);
            const asgn = data.assignment || {};
            const subs = data.results || [];
            titleEl.textContent = `${asgn.title || "Assignment"} — Submissions`;
            metaEl.textContent = `${asgn.course_title || ""} • Due ${formatDisplayDate(asgn.due_date)} • Max Score: ${asgn.max_score || 100}`;

            if (!subs.length) {
                bodyEl.innerHTML = `<div style="padding:24px;text-align:center;color:#64748b;background:#f8fafc;border-radius:10px;">No student submissions yet.</div>`;
                return;
            }

            bodyEl.innerHTML = `
                <div id="gradeFeedbackBanner" style="display:none;margin-bottom:12px;padding:10px 14px;border-radius:10px;background:#dcfce7;color:#15803d;font-size:13px;font-weight:600;border:1px solid #bbf7d0;"></div>
            ` + subs
                .map(
                    (s) => `
                <div style="border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:12px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px;">
                        <div>
                            <strong style="color:#0f172a;">${api.escapeHtml(s.student_name)}</strong>
                            <span style="font-size:12px;color:#64748b;"> (${api.escapeHtml(s.student_email)})</span>
                        </div>
                        <span class="sub-status-badge" style="font-size:12px;font-weight:600;padding:3px 10px;border-radius:999px;background:${s.status === "GRADED" ? "#dcfce7;color:#15803d" : "#dbeafe;color:#1d4ed8"};">
                            ${api.escapeHtml(s.status)}${s.score != null ? ` (${s.score}/${s.max_score})` : ""}
                        </span>
                    </div>
                    ${s.submission_text ? `<p style="margin:6px 0;font-size:13px;color:#334155;background:#f8fafc;padding:10px;border-radius:8px;">${api.escapeHtml(s.submission_text)}</p>` : ""}
                    ${s.submission_url ? `<p style="margin:6px 0;font-size:13px;"><a href="${api.escapeHtml(s.submission_url)}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;font-weight:600;"><i class="fa-brands fa-github"></i> View Submission Link</a></p>` : ""}
                    <form class="grade-sub-form" data-sub-id="${s.id}" data-student-name="${api.escapeHtml(s.student_name)}" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;align-items:center;">
                        <input type="number" name="score" min="0" max="${s.max_score || 100}" step="any" value="${s.score != null ? s.score : ""}" placeholder="Score (0-${s.max_score || 100})" required style="width:130px;padding:7px 10px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px;">
                        <input type="text" name="feedback" value="${api.escapeHtml(s.feedback || "")}" placeholder="Feedback for student" style="flex:1;min-width:180px;padding:7px 10px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px;">
                        <button type="submit" style="padding:8px 14px;border:none;border-radius:8px;background:#1769f5;color:#fff;font-size:13px;font-weight:600;cursor:pointer;">${s.status === "GRADED" ? "Update Grade" : "Save Grade"}</button>
                    </form>
                </div>
            `
                )
                .join("");

            bodyEl.querySelectorAll(".grade-sub-form").forEach((form) => {
                form.addEventListener("submit", async (e) => {
                    e.preventDefault();
                    const subId = form.dataset.subId;
                    const studentName = form.dataset.studentName || "Student";
                    const scoreInput = form.querySelector('input[name="score"]');
                    const feedbackInput = form.querySelector('input[name="feedback"]');
                    const submitBtn = form.querySelector('button[type="submit"]');
                    const score = scoreInput.value;
                    const feedback = feedbackInput.value;

                    submitBtn.disabled = true;
                    submitBtn.textContent = "Saving...";

                    try {
                        const res = await api.request(`/instructor/submissions/${subId}/grade/`, {
                            method: "POST",
                            body: JSON.stringify({ score, feedback }),
                        });
                        const graded = res.submission || {};
                        await openSubmissionsModal(assignmentId);
                        const banner = document.getElementById("gradeFeedbackBanner");
                        if (banner) {
                            banner.textContent = `Grade saved for ${studentName}: ${graded.score ?? score}/${graded.max_score ?? asgn.max_score ?? 100}. Student has been notified.`;
                            banner.style.display = "block";
                        }
                        await loadAssignments();
                    } catch (err) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = "Save Grade";
                        alert(err.message || "Failed to grade submission.");
                    }
                });
            });
        } catch (err) {
            bodyEl.innerHTML = `<p style="color:#dc2626;">${api.escapeHtml(err.message || "Failed to load submissions.")}</p>`;
        }
    }

    function renderAssignments(list) {
        if (!tableBody) return;
        if (!list.length) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center;padding:28px;color:#64748b;">
                        No assignments created yet.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = list
            .map((a) => {
                const isCompleted = a.status === "Completed";
                return `
                    <tr data-id="${a.id}">
                        <td>
                            <div class="assignment-cell" style="display:flex;align-items:center;gap:10px;">
                                <div class="assignment-icon"><i class="fa-solid fa-file-lines"></i></div>
                                <div>
                                    <h4>${api.escapeHtml(a.title)}</h4>
                                    <span>Assignment ID: ${api.escapeHtml(a.assignment_code)}</span>
                                </div>
                            </div>
                        </td>
                        <td>${api.escapeHtml(a.course_title)}</td>
                        <td>${api.escapeHtml(formatDisplayDate(a.due_date))}</td>
                        <td>${a.submissions_count ?? 0} / ${a.total_students ?? 0}</td>
                        <td>
                            <span class="status ${isCompleted ? "completed" : "active"}">${api.escapeHtml(a.status)}</span>
                        </td>
                        <td>
                            <div class="action-buttons" style="display:flex;gap:6px;">
                                <button type="button" class="view-btn" data-id="${a.id}" title="View & Grade Submissions">View</button>
                                <button type="button" class="edit-btn" data-id="${a.id}">Edit</button>
                                <button type="button" class="delete-btn" data-id="${a.id}" data-title="${api.escapeHtml(a.title)}">Delete</button>
                            </div>
                        </td>
                    </tr>
                `;
            })
            .join("");

        tableBody.querySelectorAll(".view-btn").forEach((btn) => {
            btn.addEventListener("click", () => openSubmissionsModal(btn.dataset.id));
        });

        tableBody.querySelectorAll(".edit-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                const item = allAssignments.find((a) => String(a.id) === String(btn.dataset.id));
                if (!item || !editModal) return;
                editingAssignmentId = item.id;
                const setVal = (id, val) => {
                    const el = document.getElementById(id);
                    if (el) el.value = val;
                };
                setVal("editAssignmentTitle", item.title || "");
                setVal("editAssignmentCourse", String(item.course_id || ""));
                setVal("editAssignmentDescription", item.description || "");
                setVal("editAssignmentDueDate", item.due_date || "");
                setVal("editAssignmentScore", String(item.max_score || 100));
                editModal.classList.add("show");
            });
        });

        tableBody.querySelectorAll(".delete-btn").forEach((btn) => {
            btn.addEventListener("click", async () => {
                if (!confirm(`Delete assignment "${btn.dataset.title}"?`)) return;
                try {
                    await api.request(`/instructor/assignments/${btn.dataset.id}/`, { method: "DELETE" });
                    await loadAssignments();
                } catch (err) {
                    alert(err.message || "Failed to delete assignment.");
                }
            });
        });
    }

    function applyFilters() {
        const q = (searchInput?.value || "").trim().toLowerCase();
        const cf = (filterSelect?.value || "all").toLowerCase();
        const filtered = allAssignments.filter((a) => {
            const matchesSearch =
                !q ||
                (a.title || "").toLowerCase().includes(q) ||
                (a.assignment_code || "").toLowerCase().includes(q) ||
                (a.course_title || "").toLowerCase().includes(q);
            const matchesCourse = cf === "all" || String(a.course_id) === cf;
            return matchesSearch && matchesCourse;
        });
        renderAssignments(filtered);
    }

    async function loadAssignments() {
        try {
            const data = await api.request("/instructor/assignments/");
            allAssignments = data.results || [];
            updateStatCards(data.stats);
            populateCourseSelects(data.courses || []);
            applyFilters();
        } catch (err) {
            console.error("Failed to load assignments:", err);
        }
    }

    createBtn?.addEventListener("click", () => {
        createForm?.reset();
        createModal?.classList.add("show");
    });
    closeCreateModal?.addEventListener("click", () => createModal?.classList.remove("show"));
    cancelCreateModal?.addEventListener("click", () => createModal?.classList.remove("show"));
    closeEditModal?.addEventListener("click", () => editModal?.classList.remove("show"));
    cancelEditModal?.addEventListener("click", () => editModal?.classList.remove("show"));

    createForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            title: (document.getElementById("assignmentTitle")?.value || "").trim(),
            course_id: document.getElementById("assignmentCourse")?.value || "",
            description: (document.getElementById("assignmentDescription")?.value || "").trim(),
            due_date: document.getElementById("assignmentDueDate")?.value || "",
            max_score: parseInt(document.getElementById("assignmentScore")?.value || "100", 10) || 100,
        };
        try {
            await api.request("/instructor/assignments/", {
                method: "POST",
                body: JSON.stringify(payload),
            });
            createModal?.classList.remove("show");
            createForm.reset();
            await loadAssignments();
        } catch (err) {
            alert(err.message || "Failed to create assignment.");
        }
    });

    editForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!editingAssignmentId) return;
        const payload = {
            title: (document.getElementById("editAssignmentTitle")?.value || "").trim(),
            course_id: document.getElementById("editAssignmentCourse")?.value || "",
            description: (document.getElementById("editAssignmentDescription")?.value || "").trim(),
            due_date: document.getElementById("editAssignmentDueDate")?.value || "",
            max_score: parseInt(document.getElementById("editAssignmentScore")?.value || "100", 10) || 100,
        };
        try {
            await api.request(`/instructor/assignments/${editingAssignmentId}/`, {
                method: "PATCH",
                body: JSON.stringify(payload),
            });
            editModal?.classList.remove("show");
            editingAssignmentId = null;
            await loadAssignments();
        } catch (err) {
            alert(err.message || "Failed to update assignment.");
        }
    });

    searchInput?.addEventListener("input", applyFilters);
    filterSelect?.addEventListener("change", applyFilters);

    await loadAssignments();
});
