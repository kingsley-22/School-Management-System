// ========================================
// INSTRUCTOR API CLIENT, AUTH & ACTIVITY LOG
// Connected to Django REST Framework (/api/instructor/)
// ========================================

(function () {
    const API_BASE_URL = (
        window.VITE_API_URL ||
        window.API_BASE_URL ||
        "http://127.0.0.1:8000/api"
    ).replace(/\/+$/, "");

    function isStaticFrontendPath() {
        return window.location.pathname.includes("/pages/instructor/");
    }

    function getLoginUrl() {
        if (isStaticFrontendPath()) {
            return "../home/login.html";
        }
        return "http://127.0.0.1:8080/pages/home/login.html";
    }

    function resolveInstructorRoute(route) {
        if (!route) return isStaticFrontendPath() ? "dashboard.html" : "/instructor/";
        if (!isStaticFrontendPath()) return route;
        const map = {
            "/instructor/": "dashboard.html",
            "/instructor/courses/": "courses.html",
            "/instructor/students/": "students.html",
            "/instructor/assignments/": "assignments.html",
            "/instructor/announcements/": "announcements.html",
        };
        return map[route] || route;
    }

    function normalizeInstructorLinks() {
        if (!isStaticFrontendPath()) return;
        document.querySelectorAll('a[href^="/instructor/"]').forEach((a) => {
            const href = a.getAttribute("href");
            const mapped = resolveInstructorRoute(href);
            if (mapped !== href) a.setAttribute("href", mapped);
        });
    }

    function getAccessToken() {
        return sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken") || "";
    }

    function getRefreshToken() {
        return sessionStorage.getItem("refreshToken") || localStorage.getItem("refreshToken") || "";
    }

    function getStoredUser() {
        try {
            const raw = sessionStorage.getItem("user") || localStorage.getItem("user");
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    function saveStoredUser(user) {
        if (!user) return;
        try {
            const json = JSON.stringify(user);
            sessionStorage.setItem("user", json);
            localStorage.setItem("user", json);
        } catch {
            // ignore storage errors
        }
    }

    function clearAuthState() {
        ["accessToken", "refreshToken", "user"].forEach((key) => {
            sessionStorage.removeItem(key);
            localStorage.removeItem(key);
        });
    }

    function redirectToLogin() {
        clearAuthState();
        window.location.replace(getLoginUrl());
    }

    function enforceInstructorAuth() {
        const access = getAccessToken();
        const refresh = getRefreshToken();
        if (!access && !refresh) {
            redirectToLogin();
            return false;
        }
        const user = getStoredUser();
        if (user && user.role && user.role !== "INSTRUCTOR") {
            if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
                window.location.replace(isStaticFrontendPath() ? "../admin/admin.html" : "http://127.0.0.1:8080/pages/admin/admin.html");
                return false;
            }
            if (user.role === "STUDENT") {
                window.location.replace(isStaticFrontendPath() ? "../student/dashboard.html" : "http://127.0.0.1:8080/pages/student/dashboard.html");
                return false;
            }
        }
        return true;
    }

    async function refreshAccessToken() {
        const refresh = getRefreshToken();
        if (!refresh) return "";
        try {
            const res = await fetch(`${API_BASE_URL}/token/refresh/`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ refresh }),
            });
            if (!res.ok) return "";
            const data = await res.json();
            if (data.access) {
                sessionStorage.setItem("accessToken", data.access);
                localStorage.setItem("accessToken", data.access);
                return data.access;
            }
            return "";
        } catch {
            return "";
        }
    }

    async function request(path, options = {}, retried = false) {
        const url = path.startsWith("http")
            ? path
            : `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

        const headers = {
            Accept: "application/json",
            ...(options.headers || {}),
        };
        if (options.body && !(options.body instanceof FormData) && !headers["Content-Type"]) {
            headers["Content-Type"] = "application/json";
        }
        const token = getAccessToken();
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const res = await fetch(url, { ...options, headers });

        if (res.status === 401 && !retried) {
            const newToken = await refreshAccessToken();
            if (newToken) {
                return request(path, options, true);
            }
            redirectToLogin();
            throw new Error("Session expired. Please log in again.");
        }

        const text = await res.text();
        let data = {};
        if (text) {
            try {
                data = JSON.parse(text);
            } catch {
                data = { error: text };
            }
        }

        if (!res.ok) {
            const errMsg =
                data.error ||
                data.detail ||
                (typeof data === "object"
                    ? Object.entries(data)
                          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
                          .join(" | ")
                    : "Request failed.");
            const err = new Error(errMsg || `Request failed (${res.status})`);
            err.status = res.status;
            err.data = data;
            throw err;
        }
        return data;
    }

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str == null ? "" : String(str);
        return div.innerHTML;
    }

    function formatRelativeTime(isoStr) {
        if (!isoStr) return "Just now";
        const diffSec = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
        if (Number.isNaN(diffSec) || diffSec < 60) return "Just now";
        if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
        if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
        if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
        return new Date(isoStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    }

    function hydrateTopbarProfile(profile) {
        if (!profile) return;
        const fullName = profile.full_name || profile.name || profile.email || "Instructor";
        const firstName = (profile.first_name || fullName.split(" ")[0] || "Instructor").trim();
        const initials = profile.initials || fullName.slice(0, 2).toUpperCase();

        document.querySelectorAll(".profile-avatar, .topbar-avatar-initials").forEach((el) => {
            el.textContent = initials;
        });
        document.querySelectorAll("#topbarInstructorName, .profile-info h4, .profile-info .profile-name, .profile-header-text h4").forEach((el) => {
            el.textContent = fullName;
        });
        document.querySelectorAll("#topbarInstructorRole, .profile-info span, .profile-info .profile-role, .profile-header-text span").forEach((el) => {
            el.textContent = "Instructor";
        });
        const welcomeName = document.getElementById("welcomeInstructorName");
        if (welcomeName) {
            welcomeName.textContent = fullName;
        }
        const greetingP = document.querySelector(".topbar-left p");
        if (greetingP && /welcome back/i.test(greetingP.textContent || "")) {
            greetingP.textContent = `Welcome back, ${firstName}`;
        }
    }

    function logout() {
        if (!confirm("Are you sure you want to log out?")) return;
        redirectToLogin();
    }

    async function loadActivityLog() {
        const res = await request("/instructor/activities/");
        return res.results || [];
    }

    async function removeActivity(activityId) {
        return request(`/instructor/activities/${activityId}/`, { method: "DELETE" });
    }

    // Backwards-compatible no-op shim (activities are now recorded server-side automatically)
    function logActivity() {
        // Activities are persisted by the Django backend on each API mutation.
    }

    window.InstructorAPI = {
        API_BASE_URL,
        getAccessToken,
        getRefreshToken,
        getStoredUser,
        saveStoredUser,
        clearAuthState,
        redirectToLogin,
        enforceInstructorAuth,
        resolveInstructorRoute,
        normalizeInstructorLinks,
        request,
        escapeHtml,
        formatRelativeTime,
        hydrateTopbarProfile,
        logout,
        loadActivityLog,
        removeActivity,
    };

    window.logActivity = logActivity;
    window.loadActivityLog = loadActivityLog;
    window.removeActivity = removeActivity;

    document.addEventListener("DOMContentLoaded", () => {
        normalizeInstructorLinks();

        const resetMsg = sessionStorage.getItem("postResetNotification");
        if (resetMsg) {
            sessionStorage.removeItem("postResetNotification");
            const banner = document.createElement("div");
            banner.setAttribute("role", "status");
            banner.style.cssText = `
                position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:9999;
                display:flex;align-items:center;gap:10px;padding:13px 20px;border-radius:12px;
                background:#10b981;color:#ffffff;font-family:Inter,sans-serif;font-size:14px;font-weight:600;
                box-shadow:0 12px 30px rgba(16,185,129,0.35);max-width:calc(100vw - 24px);
            `;
            banner.innerHTML = `
                <i class="fa-solid fa-circle-check" style="font-size:17px;"></i>
                <span></span>
                <button type="button" aria-label="Close notification" style="margin-left:8px;border:none;background:rgba(255,255,255,0.2);color:#fff;width:24px;height:24px;border-radius:6px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            `;
            banner.querySelector("span").textContent = resetMsg;
            banner.querySelector("button").addEventListener("click", () => banner.remove());
            document.body.appendChild(banner);
            setTimeout(() => banner.remove(), 6000);
        }

        // Close any open .academy-modal on backdrop click or Escape key
        document.addEventListener("click", (e) => {
            if (e.target && e.target.classList && e.target.classList.contains("academy-modal")) {
                e.target.classList.remove("show");
            }
        });
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                document.querySelectorAll(".academy-modal.show").forEach((m) => m.classList.remove("show"));
                const subModal = document.getElementById("submissionsGradingModal");
                if (subModal) subModal.style.display = "none";
            }
        });
    });
})();
