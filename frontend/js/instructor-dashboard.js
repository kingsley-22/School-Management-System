// ========================================
// INSTRUCTOR DASHBOARD JAVASCRIPT
// Connected to Django REST Framework (/api/instructor/)
// ========================================

document.addEventListener("DOMContentLoaded", async () => {
    const api = window.InstructorAPI;
    if (!api || !api.enforceInstructorAuth()) return;

    // ========================================
    // 1. MOBILE SIDEBAR (MATCHES STUDENT DASHBOARD)
    // ========================================
    const menuToggle = document.getElementById("hamburger") || document.querySelector(".menu-toggle");
    const sidebar = document.getElementById("sidebar") || document.querySelector(".sidebar");
    const overlay = document.getElementById("sidebarOverlay");
    const sidebarClose = document.getElementById("sidebarClose");

    function setSidebarOpen(isOpen) {
        if (!sidebar) return;
        sidebar.classList.toggle("active", isOpen);
        sidebar.classList.toggle("open", isOpen);
        sidebar.classList.toggle("show", isOpen);
        if (overlay) {
            overlay.classList.toggle("active", isOpen);
            overlay.classList.toggle("show", isOpen);
        }
        menuToggle?.setAttribute("aria-expanded", String(isOpen));
        document.body.classList.toggle("menu-open", isOpen);
    }

    if (menuToggle && sidebar) {
        menuToggle.addEventListener("click", (e) => {
            e.stopPropagation();
            const isOpen = !(sidebar.classList.contains("active") || sidebar.classList.contains("open"));
            setSidebarOpen(isOpen);
        });
    }

    sidebarClose?.addEventListener("click", () => setSidebarOpen(false));
    overlay?.addEventListener("click", () => setSidebarOpen(false));

    document.querySelectorAll(".sidebar .nav-link, .sidebar .menu-item").forEach((link) => {
        link.addEventListener("click", () => {
            if (window.innerWidth <= 768) setSidebarOpen(false);
        });
    });

    // ========================================
    // 2. NOTIFICATION PANEL (LIVE API)
    // ========================================
    const notificationButton = document.getElementById("notificationBtn");
    const notificationPanel = document.getElementById("notificationPanel");
    const markAllRead = document.getElementById("markAllRead");
    const notificationDot = document.querySelector(".notification-dot");

    if (notificationButton && notificationPanel) {
        notificationButton.addEventListener("click", (event) => {
            event.stopPropagation();
            notificationPanel.classList.toggle("show");
            document.getElementById("profileDropdown")?.classList.remove("show");
        });
        notificationPanel.addEventListener("click", (event) => event.stopPropagation());
    }

    async function loadNotifications() {
        if (!notificationPanel) return;
        try {
            const data = await api.request("/instructor/notifications/");
            const list = notificationPanel.querySelector(".notification-list");
            const countSpan = notificationPanel.querySelector(".notification-header span");
            const unread = data.unread_count || 0;
            if (countSpan) countSpan.textContent = `${unread} unread notification${unread === 1 ? "" : "s"}`;
            if (notificationDot) notificationDot.style.display = unread > 0 ? "block" : "none";

            const items = data.results || [];
            if (!list) return;
            if (!items.length) {
                list.innerHTML = `<div style="padding:18px;text-align:center;color:#64748b;font-size:13px;">No notifications yet.</div>`;
                return;
            }
            list.innerHTML = items
                .map(
                    (n) => `
                <div class="notification-item ${n.is_read ? "" : "unread"}" data-id="${n.id}">
                    <div class="notification-icon blue"><i class="fa-solid fa-bell"></i></div>
                    <div class="notification-content">
                        <p><strong>${api.escapeHtml(n.title)}</strong><br>${api.escapeHtml(n.message)}</p>
                        <span>${api.formatRelativeTime(n.created_at)}</span>
                    </div>
                </div>
            `
                )
                .join("");

            list.querySelectorAll(".notification-item.unread").forEach((el) => {
                el.addEventListener("click", async () => {
                    try {
                        await api.request(`/instructor/notifications/${el.dataset.id}/read/`, { method: "POST" });
                        loadNotifications();
                    } catch {
                        // ignore
                    }
                });
            });
        } catch {
            // ignore
        }
    }

    if (markAllRead) {
        markAllRead.addEventListener("click", async () => {
            try {
                await api.request("/instructor/notifications/mark-all-read/", { method: "POST" });
                loadNotifications();
            } catch {
                // ignore
            }
        });
    }

    // ========================================
    // 3. PROFILE DROPDOWN & SETTINGS / LOGOUT
    // ========================================
    const profileBtn = document.getElementById("profileBtn");
    const profileDropdown = document.getElementById("profileDropdown");

    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            profileDropdown.classList.toggle("show");
            notificationPanel?.classList.remove("show");
        });
        profileDropdown.addEventListener("click", (event) => event.stopPropagation());
    }

    document.addEventListener("click", () => {
        notificationPanel?.classList.remove("show");
        profileDropdown?.classList.remove("show");
    });

    let currentProfile = null;
    function openProfileEditor() {
        let modal = document.getElementById("instructorProfileModal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "instructorProfileModal";
            modal.className = "academy-modal";
            modal.innerHTML = `
                <div class="academy-modal-box">
                    <div class="academy-modal-header">
                        <h3>Instructor Profile & Settings</h3>
                        <button type="button" class="academy-modal-close" id="closeInstProfileModal">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <form id="instructorProfileForm">
                        <div class="academy-form-group">
                            <label for="instFirstName">First Name</label>
                            <input type="text" id="instFirstName" required>
                        </div>
                        <div class="academy-form-group">
                            <label for="instLastName">Last Name</label>
                            <input type="text" id="instLastName" required>
                        </div>
                        <div class="academy-form-group">
                            <label for="instPhone">Phone</label>
                            <input type="text" id="instPhone" placeholder="Optional">
                        </div>
                        <div class="academy-form-group">
                            <label for="instSpecialization">Specialization</label>
                            <input type="text" id="instSpecialization" placeholder="e.g. Backend Engineering">
                        </div>
                        <div class="academy-modal-actions">
                            <button type="button" class="btn-secondary" id="cancelInstProfileModal">Cancel</button>
                            <button type="submit" class="primary-button">Save Changes</button>
                        </div>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);

            modal.querySelector("#closeInstProfileModal").addEventListener("click", () => modal.classList.remove("show"));
            modal.querySelector("#cancelInstProfileModal").addEventListener("click", () => modal.classList.remove("show"));
            modal.querySelector("#instructorProfileForm").addEventListener("submit", async (e) => {
                e.preventDefault();
                try {
                    const updated = await api.request("/instructor/profile/", {
                        method: "PATCH",
                        body: JSON.stringify({
                            first_name: modal.querySelector("#instFirstName").value.trim(),
                            last_name: modal.querySelector("#instLastName").value.trim(),
                            phone: modal.querySelector("#instPhone").value.trim(),
                            specialization: modal.querySelector("#instSpecialization").value.trim(),
                        }),
                    });
                    currentProfile = updated.instructor || updated;
                    api.hydrateTopbarProfile(currentProfile);
                    modal.classList.remove("show");
                } catch (err) {
                    alert(err.message || "Failed to update profile.");
                }
            });
        }

        if (currentProfile) {
            modal.querySelector("#instFirstName").value = currentProfile.first_name || "";
            modal.querySelector("#instLastName").value = currentProfile.last_name || "";
            modal.querySelector("#instPhone").value = currentProfile.phone || "";
            modal.querySelector("#instSpecialization").value = currentProfile.specialization || "";
        }
        modal.classList.add("show");
    }

    document.querySelectorAll("#profileDropdown a, #profileDropdown button, .Sidebar_down a, .sidebar-bottom .menu-item").forEach((item) => {
        const text = (item.textContent || "").trim().toLowerCase();
        if (text.includes("logout") || text.includes("log out") || item.classList.contains("logout") || item.classList.contains("logout-link") || item.classList.contains("logout-profile")) {
            item.addEventListener("click", (e) => {
                e.preventDefault();
                api.logout();
            });
        } else if (text.includes("profile") || text.includes("setting")) {
            item.addEventListener("click", (e) => {
                e.preventDefault();
                profileDropdown?.classList.remove("show");
                openProfileEditor();
            });
        }
    });

    // ========================================
    // 4. QUICK ACTIONS & VIEW COURSES LINKS
    // ========================================
    const quickLinks = {
        addStudentAction: "/instructor/students/",
        createCourseAction: "/instructor/courses/",
        createAssignmentAction: "/instructor/assignments/",
        postAnnouncementAction: "/instructor/announcements/",
    };
    Object.entries(quickLinks).forEach(([id, route]) => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("click", () => {
                window.location.href = api.resolveInstructorRoute(route);
            });
        }
    });

    document.querySelectorAll(".card-header a").forEach((link) => {
        if ((link.textContent || "").trim().toLowerCase().includes("view courses")) {
            link.setAttribute("href", api.resolveInstructorRoute("/instructor/courses/"));
        }
    });

    // ========================================
    // 5. ACTIVITIES (RECENT + ALL + DELETE)
    // ========================================
    const activityListEl = document.getElementById("activityList");
    const viewAllActivityBtn = document.getElementById("viewAllActivityBtn");
    const allActivityModal = document.getElementById("allActivityModal");
    const closeAllActivity = document.getElementById("closeAllActivity");
    const allActivityListEl = document.getElementById("allActivityList");

    const deleteActivityModal = document.getElementById("deleteActivityModal");
    const deleteActivityName = document.getElementById("deleteActivityName");
    const cancelDeleteActivity = document.getElementById("cancelDeleteActivity");
    const confirmDeleteActivity = document.getElementById("confirmDeleteActivity");
    let pendingDeleteActivityId = null;

    function getActivityIcon(type) {
        const icons = {
            student: { icon: "fa-user-plus", color: "blue" },
            course: { icon: "fa-book-open", color: "purple" },
            assignment: { icon: "fa-file-lines", color: "green" },
            announcement: { icon: "fa-bullhorn", color: "orange" },
            schedule: { icon: "fa-calendar-days", color: "blue" },
            grade: { icon: "fa-award", color: "green" },
            edit: { icon: "fa-pen-to-square", color: "purple" },
            delete: { icon: "fa-trash", color: "red" },
        };
        return icons[type] || { icon: "fa-bolt", color: "blue" };
    }

    function renderActivityItems(container, items) {
        if (!container) return;
        if (!items.length) {
            container.innerHTML = `<div style="padding:18px;text-align:center;color:#64748b;font-size:13px;">No recent activity yet.</div>`;
            return;
        }
        container.innerHTML = items
            .map((item) => {
                const meta = getActivityIcon(item.type || item.activity_type);
                const href = api.resolveInstructorRoute(item.link || "/instructor/");
                return `
                    <div class="activity-item" data-id="${item.id}" style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
                        <a href="${api.escapeHtml(href)}" style="display:flex;align-items:center;gap:12px;text-decoration:none;color:inherit;flex:1;min-width:0;">
                            <div class="activity-icon ${meta.color}"><i class="fa-solid ${meta.icon}"></i></div>
                            <div class="activity-details" style="min-width:0;">
                                <p><strong>${api.escapeHtml(item.title)}</strong>${item.description ? ` — ${api.escapeHtml(item.description)}` : ""}</p>
                                <span>${api.formatRelativeTime(item.timestamp)}</span>
                            </div>
                        </a>
                        <button type="button" class="delete-activity-btn" data-id="${item.id}" data-title="${api.escapeHtml(item.title)}" title="Remove activity" style="border:none;background:transparent;color:#94a3b8;cursor:pointer;padding:6px;">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                `;
            })
            .join("");

        container.querySelectorAll(".delete-activity-btn").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                pendingDeleteActivityId = btn.dataset.id;
                if (deleteActivityName) deleteActivityName.textContent = btn.dataset.title || "this activity";
                deleteActivityModal?.classList.add("show");
            });
        });
    }

    if (viewAllActivityBtn && allActivityModal) {
        viewAllActivityBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            allActivityModal.classList.add("show");
            try {
                const items = await api.loadActivityLog();
                renderActivityItems(allActivityListEl, items);
            } catch {
                if (allActivityListEl) allActivityListEl.innerHTML = `<p style="padding:14px;color:#ef4444;">Failed to load activities.</p>`;
            }
        });
    }

    closeAllActivity?.addEventListener("click", () => allActivityModal?.classList.remove("show"));
    cancelDeleteActivity?.addEventListener("click", () => {
        pendingDeleteActivityId = null;
        deleteActivityModal?.classList.remove("show");
    });
    confirmDeleteActivity?.addEventListener("click", async () => {
        if (!pendingDeleteActivityId) return;
        try {
            await api.removeActivity(pendingDeleteActivityId);
            deleteActivityModal?.classList.remove("show");
            pendingDeleteActivityId = null;
            await loadDashboard();
            if (allActivityModal?.classList.contains("show")) {
                const items = await api.loadActivityLog();
                renderActivityItems(allActivityListEl, items);
            }
        } catch (err) {
            alert(err.message || "Failed to delete activity.");
        }
    });

    // ========================================
    // 6. DASHBOARD SEARCH FILTER
    // ========================================
    const dashboardSearch = document.getElementById("dashboardSearch");
    if (dashboardSearch) {
        dashboardSearch.addEventListener("input", () => {
            const q = dashboardSearch.value.trim().toLowerCase();
            const full = window.__instructorDashboardData;
            if (!full) return;

            const filteredCourses = q
                ? (full.course_overview || []).filter(
                      (c) =>
                          (c.title || "").toLowerCase().includes(q) ||
                          (c.code || "").toLowerCase().includes(q)
                  )
                : full.course_overview || [];

            const filteredClasses = q
                ? (full.upcoming_classes || []).filter(
                      (cl) =>
                          (cl.course || cl.subject || "").toLowerCase().includes(q) ||
                          (cl.date || "").toLowerCase().includes(q)
                  )
                : full.upcoming_classes || [];

            const filteredActivities = q
                ? (full.recent_activities || []).filter(
                      (a) =>
                          (a.title || "").toLowerCase().includes(q) ||
                          (a.description || "").toLowerCase().includes(q)
                  )
                : full.recent_activities || [];

            renderActivityItems(activityListEl, filteredActivities);
            window.dispatchEvent(
                new CustomEvent("instructor:dashboardLoaded", {
                    detail: {
                        ...full,
                        course_overview: filteredCourses,
                        upcoming_classes: filteredClasses,
                    },
                })
            );
        });
    }

    // ========================================
    // 7. LOAD DASHBOARD DATA FROM API
    // ========================================
    async function loadDashboard() {
        try {
            const data = await api.request("/instructor/dashboard/");
            currentProfile = data.instructor;
            api.hydrateTopbarProfile(currentProfile);

            const stats = data.stats || {};
            const coursesEl = document.getElementById("totalCoursesCount");
            const studentsEl = document.getElementById("totalStudentsCount");
            const assignmentsEl = document.getElementById("totalAssignmentsCount");
            const avgPerfEl = document.getElementById("avgPerformanceStat");
            const avgPerfBar = document.getElementById("avgPerformanceFill");
            if (coursesEl) coursesEl.textContent = String(stats.total_courses ?? 0);
            if (studentsEl) studentsEl.textContent = String(stats.total_students ?? 0);
            if (assignmentsEl) assignmentsEl.textContent = String(stats.total_assignments ?? 0);
            if (avgPerfEl) avgPerfEl.textContent = `${stats.average_performance ?? 0}%`;
            if (avgPerfBar) avgPerfBar.style.width = `${Math.min(100, Math.max(0, stats.average_performance ?? 0))}%`;

            renderActivityItems(activityListEl, data.recent_activities || []);

            // Notify course-overview.js & upcoming-classes.js
            window.__instructorDashboardData = data;
            window.dispatchEvent(new CustomEvent("instructor:dashboardLoaded", { detail: data }));
        } catch (err) {
            console.error("Failed to load instructor dashboard:", err);
        }
    }

    window.reloadInstructorDashboard = loadDashboard;
    await loadDashboard();
    await loadNotifications();
});
