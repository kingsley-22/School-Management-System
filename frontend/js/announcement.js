// ==========================================
// IFEXA ACADEMY — ADMIN ANNOUNCEMENTS
// Connected to Django REST Framework Admin API
// ==========================================

const API_BASE_URL = (
    window.VITE_API_URL ||
    window.API_BASE_URL ||
    "http://127.0.0.1:8000/api"
).replace(/\/+$/, "");

const LOGIN_PAGE_URL = "../home/login.html";

const $ = id => document.getElementById(id);

let announcements = [];

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

async function refreshAccessToken() {
    const refresh = getRefreshToken();
    if (!refresh) return null;

    try {
        const res = await fetch(`${API_BASE_URL}/token/refresh/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify({ refresh }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (data?.access) {
            sessionStorage.setItem("accessToken", data.access);
            localStorage.setItem("accessToken", data.access);
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
        if (newToken) return apiRequest(endpoint, options, true);
        redirectToLogin();
        throw new Error("Session expired.");
    }

    if (response.status === 403) {
        redirectToLogin();
        throw new Error("Admin access required.");
    }

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    if (!response.ok) {
        throw new Error(data.error || data.detail || "Request failed.");
    }
    return data;
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[ch]));
}

function formatDate(value) {
    if (!value) return "Not scheduled";
    const d = new Date(value + "T00:00:00");
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function iconFor(category) {
    return {
        Academic: "fa-book-open",
        Events: "fa-calendar-days",
        Finance: "fa-wallet",
        General: "fa-circle-info",
        Staff: "fa-people-group"
    }[category] || "fa-bullhorn";
}

async function loadAnnouncementsFromBackend() {
    try {
        const data = await apiRequest("/admin/announcements/");
        announcements = Array.isArray(data.results) ? data.results : [];
        render();
    } catch (error) {
        showToast(error.message || "Failed to load announcements.");
    }
}

function render() {
    const query = $("searchInput").value.trim().toLowerCase();
    const cat = $("categoryFilter").value;
    const status = $("statusFilter").value;
    const audience = $("audienceFilter").value;

    const filtered = announcements.filter(a =>
        (cat === "All" || a.category === cat) &&
        (status === "All" || a.status === status) &&
        (audience === "All" || a.audience === audience) &&
        (`${a.title} ${a.body} ${a.category} ${a.audience}`
            .toLowerCase()
            .includes(query))
    );

    $("announcementRows").innerHTML = filtered.map(a => `
        <tr>
            <td>
                <div class="announcement-cell">
                    <span class="announcement-icon tag-${escapeHTML(a.category)}">
                        <i class="fa-solid ${iconFor(a.category)}"></i>
                    </span>

                    <div>
                        <strong>${escapeHTML(a.title)}</strong>
                        <small>${escapeHTML(a.body)}</small>
                    </div>
                </div>
            </td>

            <td>
                <span class="category-tag tag-${escapeHTML(a.category)}">
                    ${escapeHTML(a.category)}
                </span>
            </td>

            <td>${escapeHTML(a.audience)}</td>

            <td>${formatDate(a.date)}</td>

            <td>
                <span class="status-tag status-${a.status.toLowerCase()}">
                    ${escapeHTML(a.status)}
                </span>
            </td>

            <td>
                <div class="action-buttons">
                    <button
                        class="action-btn"
                        title="Edit"
                        data-action="edit"
                        data-id="${a.id}"
                    >
                        <i class="fa-regular fa-pen-to-square"></i>
                    </button>

                    <button
                        class="action-btn"
                        title="${a.status === "Published" ? "Move to draft" : "Publish"}"
                        data-action="toggle"
                        data-id="${a.id}"
                    >
                        <i class="fa-solid ${a.status === "Published" ? "fa-box-archive" : "fa-paper-plane"}"></i>
                    </button>

                    <button
                        class="action-btn delete"
                        title="Delete"
                        data-action="delete"
                        data-id="${a.id}"
                    >
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");

    $("emptyState").hidden = filtered.length > 0;

    $("resultCount").textContent =
        `Showing ${filtered.length} of ${announcements.length} announcements`;

    $("totalStat").textContent = announcements.length;

    $("publishedStat").textContent = announcements.filter(
        a => a.status === "Published"
    ).length;

    $("draftStat").textContent = announcements.filter(
        a => a.status === "Draft"
    ).length;

    if ($("navCount")) $("navCount").textContent = announcements.length;
}

function showToast(message) {
    const toast = $("toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2600);
}

function openModal(item = null) {
    $("announcementForm").reset();
    $("editId").value = item ? item.id : "";

    $("modalTitle").textContent = item
        ? "Edit announcement"
        : "Create announcement";

    $("titleInput").value = item?.title || "";
    $("categoryInput").value = item?.category || "Academic";
    $("audienceInput").value = item?.audience || "All users";
    $("bodyInput").value = item?.body || "";
    $("dateInput").value =
        item?.date || new Date().toISOString().slice(0, 10);
    $("statusInput").value = item?.status || "Published";

    $("modalOverlay").classList.add("show");
    document.body.style.overflow = "hidden";

    setTimeout(() => $("titleInput").focus(), 100);
}

function closeModal() {
    $("modalOverlay").classList.remove("show");
    document.body.style.overflow = "";
}

$("openCreate").addEventListener("click", () => openModal());
$("closeModal").addEventListener("click", closeModal);
$("cancelModal").addEventListener("click", closeModal);

$("modalOverlay").addEventListener("click", e => {
    if (e.target === $("modalOverlay")) {
        closeModal();
    }
});

document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
        closeModal();
        $("sidebar").classList.remove("open");
        $("menuToggle")?.setAttribute("aria-expanded", "false");
    }
});

$("announcementForm").addEventListener("submit", async e => {
    e.preventDefault();

    const id = $("editId").value;
    const payload = {
        title: $("titleInput").value.trim(),
        category: $("categoryInput").value,
        audience: $("audienceInput").value,
        body: $("bodyInput").value.trim(),
        date: $("dateInput").value,
        status: $("statusInput").value,
    };

    try {
        if (id) {
            await apiRequest(`/admin/announcements/${id}/`, {
                method: "PATCH",
                body: JSON.stringify(payload),
            });
            showToast("Announcement updated successfully.");
        } else {
            await apiRequest("/admin/announcements/", {
                method: "POST",
                body: JSON.stringify(payload),
            });
            showToast("Announcement created successfully.");
        }
        closeModal();
        await loadAnnouncementsFromBackend();
    } catch (error) {
        showToast(error.message || "Failed to save announcement.");
    }
});

$("announcementRows").addEventListener("click", async e => {
    const button = e.target.closest("button[data-action]");
    if (!button) return;

    const id = Number(button.dataset.id);
    const item = announcements.find(a => a.id === id);
    if (!item) return;

    switch (button.dataset.action) {
        case "edit":
            openModal(item);
            break;

        case "toggle": {
            const nextStatus = item.status === "Published" ? "Draft" : "Published";
            try {
                await apiRequest(`/admin/announcements/${id}/`, {
                    method: "PATCH",
                    body: JSON.stringify({ status: nextStatus }),
                });
                await loadAnnouncementsFromBackend();
                showToast(
                    nextStatus === "Published"
                        ? "Announcement published."
                        : "Announcement moved to drafts."
                );
            } catch (error) {
                showToast(error.message || "Failed to update status.");
            }
            break;
        }

        case "delete":
            if (confirm(`Delete "${item.title}"? This cannot be undone.`)) {
                try {
                    await apiRequest(`/admin/announcements/${id}/`, {
                        method: "DELETE",
                    });
                    await loadAnnouncementsFromBackend();
                    showToast("Announcement deleted.");
                } catch (error) {
                    showToast(error.message || "Failed to delete announcement.");
                }
            }
            break;
    }
});

[
    "searchInput",
    "categoryFilter",
    "statusFilter",
    "audienceFilter"
].forEach(id => {
    $(id).addEventListener(
        id === "searchInput" ? "input" : "change",
        render
    );
});

$("menuToggle").addEventListener("click", () => {
    const isOpen = $("sidebar").classList.toggle("open");
    $("menuToggle").setAttribute("aria-expanded", String(isOpen));
});

document.addEventListener("click", e => {
    if (
        window.innerWidth <= 760 &&
        !$("sidebar").contains(e.target) &&
        !$("menuToggle").contains(e.target)
    ) {
        $("sidebar").classList.remove("open");
        $("menuToggle").setAttribute("aria-expanded", "false");
    }
});

$("helpBtn").addEventListener("click", () => {
    showToast("Please contact your school system administrator for support.");
});

document.addEventListener("DOMContentLoaded", () => {
    if (!getAccessToken() && !getRefreshToken()) {
        redirectToLogin();
        return;
    }
    loadAnnouncementsFromBackend();
});
