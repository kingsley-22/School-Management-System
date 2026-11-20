/* =========================================================
   IFEXA ACADEMY — STUDENT DASHBOARD JAVASCRIPT
   Authenticated Student Dashboard connected to Django REST API
========================================================= */

const API_BASE_URL = (
    window.VITE_API_URL ||
    window.API_BASE_URL ||
    "http://127.0.0.1:8000/api"
).replace(/\/+$/, "");

const LOGIN_PAGE_URL = "../home/login.html";

/* =========================================================
   AUTHENTICATION & TOKEN MANAGEMENT
========================================================= */

function captureUrlAuthTokens() {
    const params = new URLSearchParams(window.location.search);
    const access = params.get("access");
    const refresh = params.get("refresh");

    if (access) {
        sessionStorage.setItem("accessToken", access);
        localStorage.setItem("accessToken", access);
    }
    if (refresh) {
        sessionStorage.setItem("refreshToken", refresh);
        localStorage.setItem("refreshToken", refresh);
    }

    if (access || refresh) {
        params.delete("access");
        params.delete("refresh");
        const remaining = params.toString();
        const cleanUrl = `${window.location.pathname}${remaining ? `?${remaining}` : ""}${window.location.hash}`;
        window.history.replaceState({}, document.title, cleanUrl);
    }
}

function getAccessToken() {
    return (
        sessionStorage.getItem("accessToken") ||
        localStorage.getItem("accessToken") ||
        ""
    );
}

function getRefreshToken() {
    return (
        sessionStorage.getItem("refreshToken") ||
        localStorage.getItem("refreshToken") ||
        ""
    );
}

function getStoredUser() {
    try {
        const raw =
            sessionStorage.getItem("user") ||
            localStorage.getItem("user");
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function clearAuthState() {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
}

function redirectToLogin() {
    clearAuthState();
    window.location.replace(LOGIN_PAGE_URL);
}

function enforceProtectedRoute() {
    captureUrlAuthTokens();

    const access = getAccessToken();
    const refresh = getRefreshToken();

    if (!access && !refresh) {
        redirectToLogin();
        return false;
    }

    const user = getStoredUser();
    if (user && user.role && user.role !== "STUDENT") {
        if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
            window.location.replace("../admin/admin.html");
            return false;
        }
        if (user.role === "INSTRUCTOR") {
            window.location.replace("../instructor/dashboard.html");
            return false;
        }
        redirectToLogin();
        return false;
    }

    return true;
}

async function refreshAccessToken() {
    const refresh = getRefreshToken();
    if (!refresh) {
        return null;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify({ refresh }),
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        if (data && data.access) {
            sessionStorage.setItem("accessToken", data.access);
            localStorage.setItem("accessToken", data.access);
            if (data.refresh) {
                sessionStorage.setItem("refreshToken", data.refresh);
                localStorage.setItem("refreshToken", data.refresh);
            }
            return data.access;
        }
        return null;
    } catch {
        return null;
    }
}

async function apiRequest(endpoint, options = {}, retried = false) {
    let token = getAccessToken();
    if (!token && !retried) {
        token = await refreshAccessToken();
        if (!token) {
            redirectToLogin();
            throw new Error("Authentication required.");
        }
    }

    const headers = {
        "Accept": "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        ...(options.headers || {}),
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401 && !retried) {
        const newToken = await refreshAccessToken();
        if (newToken) {
            return apiRequest(endpoint, options, true);
        }
        redirectToLogin();
        throw new Error("Session expired. Please log in again.");
    }

    if (response.status === 403) {
        redirectToLogin();
        throw new Error("You do not have permission to access the student dashboard.");
    }

    const text = await response.text();
    let data = {};
    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            data = { error: "Unexpected response from server." };
        }
    }

    if (!response.ok) {
        const errorMessage =
            data.error ||
            data.detail ||
            (typeof data === "object" ? Object.values(data).flat().join(" ") : "") ||
            `Request failed with status ${response.status}`;
        const err = new Error(errorMessage);
        err.status = response.status;
        throw err;
    }

    return data;
}

/* =========================================================
   STUDENT DASHBOARD API SERVICE LAYER
========================================================= */

const StudentDashboardAPI = {
    getDashboard: () => apiRequest("/students/dashboard/"),
    getProfile: () => apiRequest("/students/profile/"),
    updateProfile: (payload) =>
        apiRequest("/students/profile/", {
            method: "PATCH",
            body: JSON.stringify(payload),
        }),
    getCourses: (params = "") =>
        apiRequest(`/students/courses/${params ? `?${params}` : ""}`),
    getCourseDetail: (courseId) => apiRequest(`/students/courses/${courseId}/`),
    getAssignments: (params = "") =>
        apiRequest(`/students/assignments/${params ? `?${params}` : ""}`),
    submitAssignment: (assignmentId, payload) =>
        apiRequest(`/students/assignments/${assignmentId}/submit/`, {
            method: "POST",
            body: JSON.stringify(payload),
        }),
    getGrades: () => apiRequest("/students/grades/"),
    getResults: () => apiRequest("/students/results/"),
    getAttendance: () => apiRequest("/students/attendance/"),
    getDeadlines: () => apiRequest("/students/deadlines/"),
    getAnnouncements: () => apiRequest("/students/announcements/"),
    getNotifications: () => apiRequest("/students/notifications/"),
    markNotificationRead: (notificationId) =>
        apiRequest(`/students/notifications/${notificationId}/read/`, {
            method: "POST",
        }),
    markAllNotificationsRead: () =>
        apiRequest("/students/notifications/mark-all-read/", {
            method: "POST",
        }),
    getPayments: () => apiRequest("/students/payments/"),
};

window.StudentDashboardAPI = StudentDashboardAPI;

/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    if (!enforceProtectedRoute()) {
        return;
    }

    setupMobileMenu();
    setupDashboardSearch();
    setupNotifications();
    setupActiveNavigation();
    setupLogout();
    loadStudentDashboard();
});

async function loadStudentDashboard() {
    setLoadingStates();

    try {
        const data = await StudentDashboardAPI.getDashboard();

        renderProfile(data.profile, data.greeting);
        renderStats(data.stats);
        renderCourses(data.courses);
        renderProgressOverview(data.progress_overview);
        renderAssignments(data.recent_assignments);
        renderDeadlines(data.upcoming_deadlines);
        renderPaymentSummary(data.payment_summary);
        renderLatestAnnouncement(data.latest_announcement);
        renderNotifications(data.notifications);
    } catch (error) {
        renderErrorStates(error.message || "Unable to load student dashboard data.");
    }
}

function setLoadingStates() {
    setText("topbarStudentName", "Loading...");
    setText("welcomeStudentName", "Loading profile...");
    setText("profileFullName", "Loading profile...");
    setText("profileStudentId", "Loading...");
    setText("profileEmail", "Loading...");
    setText("profileCourse", "Loading...");
    setText("profileJoined", "Loading...");

    setHtml("coursesGrid", '<p class="dashboard-loading">Loading courses...</p>');
    setHtml("gradesSkillList", '<p class="dashboard-loading">Loading grades...</p>');
    setHtml("assignmentsList", '<p class="dashboard-loading">Loading assignments...</p>');
    setHtml("deadlinesList", '<p class="dashboard-loading">Loading deadlines...</p>');
    setHtml("announcementContent", '<p class="dashboard-loading">Loading announcement...</p>');
}

function renderErrorStates(message) {
    const safeMsg = escapeHtml(message);
    setText("welcomeStudentName", "Unable to load profile");
    setText("profileFullName", "Error loading profile");
    setHtml("coursesGrid", `<p class="dashboard-error">${safeMsg}</p>`);
    setHtml("gradesSkillList", `<p class="dashboard-error">${safeMsg}</p>`);
    setHtml("assignmentsList", `<p class="dashboard-error">${safeMsg}</p>`);
    setHtml("deadlinesList", `<p class="dashboard-error">${safeMsg}</p>`);
    setHtml("announcementContent", `<p class="dashboard-error">${safeMsg}</p>`);
}

/* =========================================================
   SECTION RENDERERS
========================================================= */

function renderProfile(profile, greeting) {
    if (!profile) return;

    const userObj = {
        id: profile.user_id || profile.id,
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        email: profile.email || "",
        role: profile.role || "STUDENT",
        is_verified: Boolean(profile.is_verified),
    };
    sessionStorage.setItem("user", JSON.stringify(userObj));
    localStorage.setItem("user", JSON.stringify(userObj));

    const fullName = profile.full_name || profile.name || profile.email || "Student";
    const roleDisplay = profile.role_display || "Student";

    setText("topbarStudentName", fullName);
    setText("topbarStudentRole", roleDisplay);
    setText("welcomeGreeting", `${greeting || "Welcome back"},`);
    setText("welcomeStudentName", `${fullName} 👋`);

    setText("profileFullName", fullName);
    setText("profileRole", roleDisplay);
    setText("profileStatus", `● ${profile.status || "Active"}`);
    setText("profileStudentId", profile.student_id || "—");
    setText("profileEmail", profile.email || "—");
    setText("profileCourse", profile.course || "—");
    setText("profileJoined", profile.joined_display || profile.joined_date || "—");

    const topbarAvatar = document.getElementById("topbarAvatar");
    const profileAvatar = document.getElementById("profileAvatar");
    if (profile.avatar_url) {
        if (topbarAvatar) {
            topbarAvatar.src = profile.avatar_url;
            topbarAvatar.alt = fullName;
        }
        if (profileAvatar) {
            profileAvatar.src = profile.avatar_url;
            profileAvatar.alt = fullName;
        }
    }
}

function renderStats(stats) {
    if (!stats) return;

    const enrolledCount = Number(stats.enrolled_courses_count ?? 0);
    const dueCount = Number(stats.assignments_due_count ?? 0);
    const progress = Number(stats.overall_progress ?? 0);
    const balance = stats.formatted_balance || "₦0";

    setText("statEnrolledCourses", String(enrolledCount));
    setText("statAssignmentsDue", String(dueCount));
    setText("statOverallProgress", `${progress}%`);
    setText("statOutstandingBalance", balance);

    const progressFill = document.getElementById("statProgressFill");
    if (progressFill) {
        progressFill.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }

    ["sidebarAssignmentBadge", "mobileAssignmentBadge"].forEach((id) => {
        const badge = document.getElementById(id);
        if (!badge) return;
        badge.textContent = String(dueCount);
        badge.hidden = dueCount <= 0;
    });
}

function renderCourses(courses) {
    const grid = document.getElementById("coursesGrid");
    if (!grid) return;

    if (!Array.isArray(courses) || courses.length === 0) {
        grid.innerHTML = '<p class="dashboard-empty">You are not enrolled in any courses yet.</p>';
        return;
    }

    grid.innerHTML = courses
        .map((course) => {
            const progress = Math.min(100, Math.max(0, Number(course.progress) || 0));
            return `
                <article class="course-card" data-course-id="${course.id}">
                    <div class="course-art ${escapeHtml(course.art_style || "html-art")}">
                        ${escapeHtml(course.short_title || course.title)}
                    </div>

                    <h3>${escapeHtml(course.title)}</h3>
                    <p>${escapeHtml(course.category || "")}</p>

                    <div class="course-progress">
                        <span><i style="width: ${progress}%"></i></span>
                        <small>${progress}%</small>
                    </div>
                </article>
            `;
        })
        .join("");
}

function renderProgressOverview(progressOverview) {
    if (!progressOverview) return;

    const overall = Number(progressOverview.overall_progress ?? 0);
    setText("gradesOverallProgress", `${overall}%`);

    const skillList = document.getElementById("gradesSkillList");
    if (!skillList) return;

    const courses = progressOverview.courses || [];
    if (courses.length === 0) {
        skillList.innerHTML = '<p class="dashboard-empty">No course grades or progress recorded yet.</p>';
        return;
    }

    skillList.innerHTML = courses
        .map((course) => {
            const pct = Math.min(100, Math.max(0, Number(course.progress) || 0));
            return `<p>${escapeHtml(course.title)} <b>${pct}%</b></p>`;
        })
        .join("");
}

function renderAssignments(assignments) {
    const container = document.getElementById("assignmentsList");
    if (!container) return;

    if (!Array.isArray(assignments) || assignments.length === 0) {
        container.innerHTML = '<p class="dashboard-empty">No assignments available for your courses.</p>';
        return;
    }

    container.innerHTML = assignments
        .map((item) => {
            const isPending = item.status === "pending";
            const statusClass = isPending ? "pending" : "submitted";
            const duePart = item.due_date_display ? ` · Due ${item.due_date_display}` : "";
            const subtitle = `${item.course_category || item.course_title || ""}${duePart}`;
            const titleAttr = isPending ? 'title="Click to submit this assignment"' : "";
            const cursorStyle = isPending ? 'style="cursor: pointer;"' : "";

            return `
                <div class="assignment-item" data-assignment-id="${item.id}" data-status="${escapeHtml(item.status)}" ${titleAttr} ${cursorStyle}>
                    <i class="fa-regular fa-file-lines"></i>

                    <div>
                        <strong>${escapeHtml(item.title)}</strong>
                        <small>${escapeHtml(subtitle)}</small>
                    </div>

                    <span class="status ${statusClass}">${escapeHtml(item.status_display || item.status)}</span>
                </div>
            `;
        })
        .join("");

    function ensureGithubSubmitModal() {
        let modal = document.getElementById("studentGithubSubmitModal");
        if (modal) return modal;

        modal = document.createElement("div");
        modal.id = "studentGithubSubmitModal";
        modal.style.cssText = `
            position:fixed;inset:0;background:rgba(13,27,56,0.55);backdrop-filter:blur(2px);
            display:none;align-items:center;justify-content:center;z-index:2500;padding:16px;
        `;
        modal.innerHTML = `
            <div style="background:#fff;border-radius:16px;width:100%;max-width:460px;padding:22px;box-shadow:0 20px 50px rgba(13,27,56,0.25);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                    <h3 id="ghSubmitTitle" style="margin:0;font-size:17px;font-weight:800;color:#0f1d36;">Submit Assignment</h3>
                    <button type="button" id="closeGhSubmitModal" aria-label="Close" style="width:32px;height:32px;border-radius:8px;border:1px solid #e7edf5;background:#f4f7fc;color:#0f1d36;cursor:pointer;">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <p style="margin:0 0 14px;font-size:13.5px;color:#475874;">Paste your GitHub repository link for this assignment.</p>
                <form id="studentGithubSubmitForm">
                    <div style="margin-bottom:12px;">
                        <label for="ghRepoUrlInput" style="display:block;font-size:13px;font-weight:600;color:#0f1d36;margin-bottom:6px;">
                            GitHub Repository Link
                        </label>
                        <input
                            type="url"
                            id="ghRepoUrlInput"
                            placeholder="https://github.com/username/repository"
                            required
                            style="width:100%;padding:10px 12px;border:1px solid #cbd5e1;border-radius:10px;font-size:14px;color:#0f1d36;box-sizing:border-box;">
                        <small id="ghRepoUrlError" style="display:block;margin-top:5px;color:#dc2626;font-size:12.5px;"></small>
                    </div>
                    <div style="margin-bottom:14px;">
                        <label for="ghNotesInput" style="display:block;font-size:13px;font-weight:600;color:#0f1d36;margin-bottom:6px;">
                            Notes (Optional)
                        </label>
                        <textarea
                            id="ghNotesInput"
                            rows="3"
                            placeholder="Optional notes for your instructor..."
                            style="width:100%;padding:10px 12px;border:1px solid #cbd5e1;border-radius:10px;font-size:14px;color:#0f1d36;box-sizing:border-box;resize:vertical;"></textarea>
                    </div>
                    <div style="display:flex;justify-content:flex-end;gap:10px;">
                        <button type="button" id="cancelGhSubmitModal" style="padding:9px 15px;border-radius:10px;border:1px solid #e7edf5;background:#f4f7fc;color:#0f1d36;font-size:13.5px;font-weight:600;cursor:pointer;">Cancel</button>
                        <button type="submit" id="confirmGhSubmitBtn" style="padding:9px 16px;border-radius:10px;border:none;background:#1769f5;color:#fff;font-size:13.5px;font-weight:600;cursor:pointer;">Submit GitHub Repo</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        const closeModal = () => { modal.style.display = "none"; };
        modal.querySelector("#closeGhSubmitModal").addEventListener("click", closeModal);
        modal.querySelector("#cancelGhSubmitModal").addEventListener("click", closeModal);
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeModal();
        });
        return modal;
    }

    container.querySelectorAll('.assignment-item[data-status="pending"]').forEach((itemEl) => {
        itemEl.addEventListener("click", () => {
            const assignmentId = itemEl.getAttribute("data-assignment-id");
            const assignmentTitle = itemEl.querySelector("strong")?.textContent || "Assignment";
            const modal = ensureGithubSubmitModal();
            const titleEl = modal.querySelector("#ghSubmitTitle");
            const form = modal.querySelector("#studentGithubSubmitForm");
            const urlInput = modal.querySelector("#ghRepoUrlInput");
            const notesInput = modal.querySelector("#ghNotesInput");
            const errorEl = modal.querySelector("#ghRepoUrlError");
            const submitBtn = modal.querySelector("#confirmGhSubmitBtn");

            titleEl.textContent = `Submit: ${assignmentTitle}`;
            urlInput.value = "";
            notesInput.value = "";
            errorEl.textContent = "";
            modal.style.display = "flex";
            urlInput.focus();

            form.onsubmit = async (event) => {
                event.preventDefault();
                const repoUrl = urlInput.value.trim();
                const notes = notesInput.value.trim();
                const isGithubRepo = /^https?:\/\/(www\.)?github\.com\/[^/\s]+\/[^/\s]+/i.test(repoUrl);

                if (!isGithubRepo) {
                    errorEl.textContent = "Please enter a valid GitHub repository URL (e.g. https://github.com/username/repo).";
                    return;
                }

                errorEl.textContent = "";
                submitBtn.disabled = true;
                submitBtn.textContent = "Submitting...";

                try {
                    await StudentDashboardAPI.submitAssignment(assignmentId, {
                        submission_url: repoUrl,
                        submission_text: notes || repoUrl,
                    });
                    modal.style.display = "none";
                    await loadStudentDashboard();
                } catch (error) {
                    errorEl.textContent = error.message || "Could not submit assignment.";
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Submit GitHub Repo";
                }
            };
        });
    });
}

function renderDeadlines(deadlines) {
    const container = document.getElementById("deadlinesList");
    if (!container) return;

    if (!Array.isArray(deadlines) || deadlines.length === 0) {
        container.innerHTML = '<p class="dashboard-empty">No upcoming deadlines.</p>';
        return;
    }

    container.innerHTML = deadlines
        .map(
            (deadline) => `
                <div class="deadline-item">
                    <span class="deadline-dot ${escapeHtml(deadline.dot_color || "green-dot")}"></span>
                    <p>${escapeHtml(deadline.title)}</p>
                    <small>${escapeHtml(deadline.due_date_display || "")}</small>
                </div>
            `
        )
        .join("");
}

function renderPaymentSummary(paymentSummary) {
    if (!paymentSummary) return;
    setText("paymentCurrentBalance", paymentSummary.formatted_balance || "₦0");
}

function renderLatestAnnouncement(announcement) {
    const container = document.getElementById("announcementContent");
    if (!container) return;

    if (!announcement) {
        container.innerHTML = '<p class="dashboard-empty">No announcements at this time.</p>';
        return;
    }

    container.innerHTML = `
        <h3>${escapeHtml(announcement.title)}</h3>
        <p class="announcement-text">${escapeHtml(announcement.message || announcement.description || "")}</p>
        <small>${escapeHtml(announcement.time_ago || "")}</small>
    `;
}

function renderNotifications(notificationsPayload) {
    const badge = document.getElementById("notificationBadge");
    const panel = document.getElementById("notificationPanel");

    const unreadCount = Number(notificationsPayload?.unread_count ?? 0);
    if (badge) {
        badge.textContent = String(unreadCount);
        badge.hidden = unreadCount <= 0;
    }

    if (!panel) return;

    const results = notificationsPayload?.results || [];
    const listHtml =
        results.length === 0
            ? '<p class="dashboard-empty" style="padding: 12px 0; margin: 0;">No notifications yet.</p>'
            : results
                  .map(
                      (item) => `
                        <div class="notification-item ${item.is_read ? "is-read" : ""}" data-notification-id="${item.id}">
                            <span class="notification-item-icon">
                                <i class="${escapeHtml(item.icon || "fa-solid fa-bell")}"></i>
                            </span>
                            <div>
                                <strong>${escapeHtml(item.title)}</strong>
                                <p>${escapeHtml(item.message)}</p>
                                <small>${escapeHtml(item.time_ago || "")}</small>
                            </div>
                        </div>
                    `
                  )
                  .join("");

    panel.innerHTML = `
        <div class="notification-panel-heading">
            <strong>Notifications</strong>
            <button type="button" class="mark-notifications-read">Mark all as read</button>
        </div>
        ${listHtml}
    `;
}

/* =========================================================
   UI INTERACTIONS (MOBILE MENU, SEARCH, NOTIFICATIONS, NAV)
========================================================= */

function setupMobileMenu() {
    const hamburger = document.getElementById("hamburger");
    const sidebar = document.getElementById("sidebar") || document.querySelector(".sidebar");
    const overlay = document.getElementById("sidebarOverlay");
    const sidebarClose = document.getElementById("sidebarClose");
    if (!hamburger || !sidebar) return;

    const icon = hamburger.querySelector("i");

    function setMenuOpen(open) {
        sidebar.classList.toggle("active", open);
        sidebar.classList.toggle("open", open);
        if (overlay) {
            overlay.classList.toggle("active", open);
            overlay.classList.toggle("show", open);
        }
        hamburger.setAttribute("aria-expanded", String(open));
        hamburger.setAttribute(
            "aria-label",
            open ? "Close navigation menu" : "Open navigation menu"
        );
        if (icon) {
            icon.className = open ? "fa-solid fa-xmark" : "fa-solid fa-bars";
        }
    }

    setMenuOpen(false);

    hamburger.addEventListener("click", (event) => {
        event.stopPropagation();
        const isOpen = sidebar.classList.contains("active");
        setMenuOpen(!isOpen);
    });

    if (overlay) {
        overlay.addEventListener("click", () => setMenuOpen(false));
    }

    if (sidebarClose) {
        sidebarClose.addEventListener("click", () => setMenuOpen(false));
    }

    sidebar.addEventListener("click", (event) => {
        if (event.target.closest("a")) setMenuOpen(false);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && sidebar.classList.contains("active")) {
            setMenuOpen(false);
            hamburger.focus();
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 768) setMenuOpen(false);
    });
}

function setupDashboardSearch() {
    const searchInput = document.getElementById("courseSearch");
    if (!searchInput) return;

    searchInput.addEventListener("input", () => {
        const query = searchInput.value.trim().toLowerCase();
        const searchableItems = [
            ...document.querySelectorAll(".course-card"),
            ...document.querySelectorAll(".assignment-item"),
            ...document.querySelectorAll(".deadline-item"),
        ];
        searchableItems.forEach((item) => {
            item.hidden = !item.textContent.toLowerCase().includes(query);
        });
    });
}

function setupNotifications() {
    const bell = document.getElementById("notificationBell");
    const container = document.querySelector(".notification-container");
    if (!bell || !container) return;

    let panel = document.getElementById("notificationPanel");

    if (!panel) {
        panel = document.createElement("div");
        panel.id = "notificationPanel";
        panel.className = "notification-panel";
        panel.hidden = true;
        panel.setAttribute("aria-label", "Notifications");
        panel.innerHTML = `
            <div class="notification-panel-heading">
                <strong>Notifications</strong>
                <button type="button" class="mark-notifications-read">Mark all as read</button>
            </div>
            <p class="dashboard-loading" style="padding: 12px 0; margin: 0;">Loading notifications...</p>
        `;
        container.appendChild(panel);
    }

    function setPanelOpen(open) {
        panel.hidden = !open;
        bell.setAttribute("aria-expanded", String(open));
    }

    setPanelOpen(false);

    bell.addEventListener("click", (event) => {
        event.stopPropagation();
        setPanelOpen(panel.hidden);
    });

    panel.addEventListener("click", async (event) => {
        event.stopPropagation();

        if (event.target.closest(".mark-notifications-read")) {
            try {
                await StudentDashboardAPI.markAllNotificationsRead();
                const badge = document.getElementById("notificationBadge");
                if (badge) {
                    badge.textContent = "0";
                    badge.hidden = true;
                }
                panel.querySelectorAll(".notification-item").forEach((item) => {
                    item.classList.add("is-read");
                });
            } catch (error) {
                console.error("Failed to mark notifications as read:", error);
            }
            return;
        }

        const itemEl = event.target.closest(".notification-item");
        if (itemEl && !itemEl.classList.contains("is-read")) {
            const notificationId = itemEl.getAttribute("data-notification-id");
            if (!notificationId) return;
            try {
                const res = await StudentDashboardAPI.markNotificationRead(notificationId);
                itemEl.classList.add("is-read");
                const badge = document.getElementById("notificationBadge");
                if (badge) {
                    const unread = Number(res.unread_count ?? 0);
                    badge.textContent = String(unread);
                    badge.hidden = unread <= 0;
                }
            } catch (error) {
                console.error("Failed to mark notification as read:", error);
            }
        }
    });

    document.addEventListener("click", (event) => {
        if (!container.contains(event.target)) setPanelOpen(false);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") setPanelOpen(false);
    });
}

function setupActiveNavigation() {
    const links = document.querySelectorAll(
        ".sidebar-nav .nav-link, .mobile-links .nav-link"
    );

    links.forEach((link) => {
        link.addEventListener("click", () => {
            const target = link.getAttribute("href");
            if (!target || !target.startsWith("#") || target === "#logout") return;
            links.forEach((item) => {
                item.classList.toggle("active", item.getAttribute("href") === target);
            });
        });
    });
}

function setupLogout() {
    const logoutLinks = document.querySelectorAll(".logout-link, a[href='#logout']");
    logoutLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            redirectToLogin();
        });
    });
}

/* =========================================================
   DOM HELPERS & STYLES
========================================================= */

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function setHtml(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

const notificationStyles = document.createElement("style");
notificationStyles.textContent = `
.notification-container { position: relative; }
.notification-panel {
    position: absolute;
    top: calc(100% + 12px);
    right: 0;
    z-index: 3000;
    width: min(340px, calc(100vw - 24px));
    max-height: min(440px, calc(100dvh - 100px));
    overflow-y: auto;
    padding: 14px;
    border: 1px solid #e7edf5;
    border-radius: 14px;
    background: #fff;
    color: #152440;
    box-shadow: 0 12px 35px rgba(13, 27, 56, .18);
}
.notification-panel[hidden] { display: none !important; }
.notification-panel-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e7edf5;
}
.mark-notifications-read {
    padding: 5px 7px;
    border: 0;
    border-radius: 6px;
    background: #edf4ff;
    color: #1769f5;
    font-size: 10px;
    cursor: pointer;
}
.notification-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 13px 0;
    border-bottom: 1px solid #edf1f7;
    cursor: pointer;
}
.notification-item:last-child { border-bottom: 0; }
.notification-item.is-read { opacity: .55; }
.notification-item-icon {
    display: grid;
    place-items: center;
    flex: 0 0 34px;
    width: 34px;
    height: 34px;
    border-radius: 9px;
    background: #edf4ff;
    color: #1769f5;
}
.notification-item strong { display: block; font-size: 11px; }
.notification-item p { margin: 3px 0; color: #53627a; font-size: 11px; }
.notification-item small { color: #8290a5; font-size: 10px; }
.dashboard-loading, .dashboard-empty {
    color: #53627a;
    font-size: 13px;
    padding: 10px 0;
}
.dashboard-error {
    color: #d92d20;
    font-size: 13px;
    padding: 10px 0;
}
@media (max-width: 768px) {
    .notification-panel { position: fixed; top: 65px; right: 12px; }
}`;
document.head.appendChild(notificationStyles);
