// ========================================
// INSTRUCTOR SHELL (SHARED ACROSS SUBPAGES)
// Handles auth guard, profile, notifications, settings modal, logout, mobile sidebar
// ========================================

document.addEventListener("DOMContentLoaded", async () => {
    const api = window.InstructorAPI;
    if (!api || !api.enforceInstructorAuth()) return;

    // ========================================
    // INJECT SHELL STYLES (PRESERVES EXISTING UI)
    // ========================================
    if (!document.getElementById("instructor-shell-styles")) {
        const style = document.createElement("style");
        style.id = "instructor-shell-styles";
        style.textContent = `
            .notification-wrapper { position: relative; }
            .notification-panel {
                position: absolute; top: 52px; right: 0; width: 320px; max-width: calc(100vw - 24px);
                background: #ffffff; border: 1px solid #e5e7eb; border-radius: 14px;
                box-shadow: 0 14px 36px rgba(15, 23, 42, 0.14); z-index: 1500;
                display: none; overflow: hidden;
            }
            .notification-panel.show { display: block; }
            .notification-header {
                display: flex; justify-content: space-between; align-items: center;
                padding: 14px 16px; border-bottom: 1px solid #f1f5f9;
            }
            .notification-header h3 { font-size: 14px; margin: 0; color: #0f172a; }
            .notification-header span { font-size: 12px; color: #64748b; }
            .notification-header button {
                border: none; background: transparent; color: #2563eb;
                font-size: 12px; font-weight: 600; cursor: pointer;
            }
            .notification-list { max-height: 300px; overflow-y: auto; }
            .notification-item {
                display: flex; gap: 10px; padding: 12px 16px; border-bottom: 1px solid #f8fafc;
                cursor: pointer; transition: background 0.15s ease;
            }
            .notification-item.unread { background: #eff6ff; }
            .notification-item:hover { background: #f8fafc; }
            .notif-icon {
                width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
                display: flex; align-items: center; justify-content: center;
                background: #dbeafe; color: #1d4ed8; font-size: 14px;
            }
            .notif-content p { margin: 0 0 3px; font-size: 13px; color: #1e293b; line-height: 1.35; }
            .notif-content span { font-size: 11px; color: #64748b; }
            .profile-wrapper { position: relative; }
            .profile-dropdown {
                position: absolute; top: 54px; right: 0; width: 220px;
                background: #ffffff; border: 1px solid #e5e7eb; border-radius: 14px;
                box-shadow: 0 14px 36px rgba(15, 23, 42, 0.14); z-index: 1500;
                display: none; overflow: hidden;
            }
            .profile-dropdown.show { display: block; }
            .profile-dropdown-header {
                display: flex; align-items: center; gap: 10px;
                padding: 14px; border-bottom: 1px solid #f1f5f9;
            }
            .profile-dropdown-header h4 { margin: 0; font-size: 14px; color: #0f172a; }
            .profile-dropdown-header span { font-size: 12px; color: #64748b; }
            .profile-dropdown-item {
                display: flex; align-items: center; gap: 10px; width: 100%;
                padding: 11px 14px; border: none; background: transparent;
                color: #334155; font-size: 13px; text-decoration: none; cursor: pointer;
                text-align: left;
            }
            .profile-dropdown-item:hover { background: #f8fafc; }
            .profile-dropdown-item.logout-item { color: #dc2626; border-top: 1px solid #f1f5f9; }
            .inst-profile-modal {
                position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5);
                display: none; align-items: center; justify-content: center; z-index: 2500; padding: 16px;
            }
            .inst-profile-modal.show { display: flex; }
            .inst-profile-modal-box {
                background: #fff; border-radius: 14px; width: 100%; max-width: 440px;
                padding: 22px; box-shadow: 0 20px 50px rgba(15, 23, 42, 0.2);
            }
            .inst-profile-modal-box h3 { margin: 0 0 14px; font-size: 17px; color: #0f172a; }
            .inst-profile-field { margin-bottom: 12px; }
            .inst-profile-field label { display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 4px; }
            .inst-profile-field input {
                width: 100%; padding: 9px 11px; border: 1px solid #cbd5e1; border-radius: 8px;
                font-size: 13px; box-sizing: border-box;
            }
            .inst-profile-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }
            .inst-profile-actions button {
                padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;
            }
            .inst-btn-cancel { background: #f1f5f9; border: 1px solid #e2e8f0; color: #334155; }
            .inst-btn-save { background: #2563eb; border: none; color: #fff; }
        `;
        document.head.appendChild(style);
    }

    // ========================================
    // PROFILE MODAL (SHARED FOR PROFILE / SETTINGS)
    // ========================================
    let currentProfile = null;

    function openProfileModal() {
        let modal = document.getElementById("instructorProfileModal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "instructorProfileModal";
            modal.className = "inst-profile-modal";
            modal.innerHTML = `
                <div class="inst-profile-modal-box">
                    <h3>Instructor Profile & Settings</h3>
                    <form id="instructorProfileForm">
                        <div class="inst-profile-field">
                            <label for="instFirstName">First Name</label>
                            <input type="text" id="instFirstName" required>
                        </div>
                        <div class="inst-profile-field">
                            <label for="instLastName">Last Name</label>
                            <input type="text" id="instLastName" required>
                        </div>
                        <div class="inst-profile-field">
                            <label for="instPhone">Phone</label>
                            <input type="text" id="instPhone" placeholder="Optional">
                        </div>
                        <div class="inst-profile-field">
                            <label for="instDepartment">Department</label>
                            <input type="text" id="instDepartment" placeholder="e.g. Computer Science">
                        </div>
                        <div class="inst-profile-field">
                            <label for="instSpecialization">Specialization</label>
                            <input type="text" id="instSpecialization" placeholder="e.g. Backend Engineering">
                        </div>
                        <div class="inst-profile-actions">
                            <button type="button" class="inst-btn-cancel" id="closeInstProfileModal">Cancel</button>
                            <button type="submit" class="inst-btn-save">Save Changes</button>
                        </div>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);

            modal.querySelector("#closeInstProfileModal").addEventListener("click", () => {
                modal.classList.remove("show");
            });
            modal.addEventListener("click", (e) => {
                if (e.target === modal) modal.classList.remove("show");
            });
            modal.querySelector("#instructorProfileForm").addEventListener("submit", async (e) => {
                e.preventDefault();
                try {
                    const updated = await api.request("/instructor/profile/", {
                        method: "PATCH",
                        body: JSON.stringify({
                            first_name: modal.querySelector("#instFirstName").value.trim(),
                            last_name: modal.querySelector("#instLastName").value.trim(),
                            phone: modal.querySelector("#instPhone").value.trim(),
                            department: modal.querySelector("#instDepartment").value.trim(),
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
            modal.querySelector("#instDepartment").value = currentProfile.department || "";
            modal.querySelector("#instSpecialization").value = currentProfile.specialization || "";
        }
        modal.classList.add("show");
    }

    // ========================================
    // NOTIFICATIONS DROPDOWN (LIVE API)
    // ========================================
    const notifBtn = document.querySelector(".notification-button, .notification-btn");
    let notifPanel = document.getElementById("notificationPanel");

    if (notifBtn && !notifPanel) {
        const wrapper = document.createElement("div");
        wrapper.className = "notification-wrapper";
        notifBtn.parentNode.insertBefore(wrapper, notifBtn);
        wrapper.appendChild(notifBtn);

        notifPanel = document.createElement("div");
        notifPanel.className = "notification-panel";
        notifPanel.id = "notificationPanel";
        notifPanel.innerHTML = `
            <div class="notification-header">
                <div>
                    <h3>Notifications</h3>
                    <span id="shellNotifCount">0 new notifications</span>
                </div>
                <button type="button" id="markAllRead">Mark all read</button>
            </div>
            <div class="notification-list" id="shellNotifList"></div>
        `;
        wrapper.appendChild(notifPanel);

        notifBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            notifPanel.classList.toggle("show");
            document.getElementById("profileDropdown")?.classList.remove("show");
        });
        notifPanel.addEventListener("click", (e) => e.stopPropagation());
    }

    async function loadNotifications() {
        if (!notifPanel) return;
        try {
            const data = await api.request("/instructor/notifications/");
            const listEl = notifPanel.querySelector(".notification-list");
            const countEl = notifPanel.querySelector("#shellNotifCount") || notifPanel.querySelector(".notification-header span");
            const dot = document.querySelector(".notification-dot");

            const unread = data.unread_count || 0;
            if (countEl) countEl.textContent = `${unread} unread notification${unread === 1 ? "" : "s"}`;
            if (dot) dot.style.display = unread > 0 ? "block" : "none";

            const items = data.results || [];
            if (!listEl) return;
            if (!items.length) {
                listEl.innerHTML = `<div style="padding:18px;text-align:center;color:#64748b;font-size:13px;">No notifications yet.</div>`;
                return;
            }

            listEl.innerHTML = items
                .map(
                    (n) => `
                <div class="notification-item ${n.is_read ? "" : "unread"}" data-id="${n.id}">
                    <div class="notif-icon"><i class="fa-solid fa-bell"></i></div>
                    <div class="notif-content">
                        <p><strong>${api.escapeHtml(n.title)}</strong><br>${api.escapeHtml(n.message)}</p>
                        <span>${api.formatRelativeTime(n.created_at)}</span>
                    </div>
                </div>
            `
                )
                .join("");

            listEl.querySelectorAll(".notification-item.unread").forEach((el) => {
                el.addEventListener("click", async () => {
                    const id = el.dataset.id;
                    try {
                        await api.request(`/instructor/notifications/${id}/read/`, { method: "POST" });
                        el.classList.remove("unread");
                        loadNotifications();
                    } catch {
                        // ignore
                    }
                });
            });
        } catch {
            // ignore if notifications fail transiently
        }
    }

    const markAllReadBtn = document.getElementById("markAllRead");
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener("click", async () => {
            try {
                await api.request("/instructor/notifications/mark-all-read/", { method: "POST" });
                loadNotifications();
            } catch {
                // ignore
            }
        });
    }

    // ========================================
    // PROFILE DROPDOWN
    // ========================================
    const profileEl = document.querySelector(".topbar-profile-trigger, .profile");
    let profileDropdown = document.getElementById("profileDropdown");

    if (profileEl && !profileDropdown) {
        const wrapper = document.createElement("div");
        wrapper.className = "profile-wrapper";
        profileEl.parentNode.insertBefore(wrapper, profileEl);
        wrapper.appendChild(profileEl);

        profileDropdown = document.createElement("div");
        profileDropdown.className = "profile-dropdown";
        profileDropdown.id = "profileDropdown";
        profileDropdown.innerHTML = `
            <div class="profile-dropdown-header">
                <div class="profile-avatar">IN</div>
                <div class="profile-header-text">
                    <h4>Instructor</h4>
                    <span>Instructor</span>
                </div>
            </div>
            <button type="button" class="profile-dropdown-item" data-action="profile">
                <i class="fa-regular fa-user"></i> My Profile
            </button>
            <button type="button" class="profile-dropdown-item" data-action="settings">
                <i class="fa-solid fa-gear"></i> Settings
            </button>
            <button type="button" class="profile-dropdown-item logout-item" data-action="logout">
                <i class="fa-solid fa-right-from-bracket"></i> Logout
            </button>
        `;
        wrapper.appendChild(profileDropdown);

        profileEl.style.cursor = "pointer";
        profileEl.addEventListener("click", (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle("show");
            notifPanel?.classList.remove("show");
        });
        profileDropdown.addEventListener("click", (e) => e.stopPropagation());

        profileDropdown.querySelectorAll("[data-action='profile'], [data-action='settings']").forEach((btn) => {
            btn.addEventListener("click", () => {
                profileDropdown.classList.remove("show");
                openProfileModal();
            });
        });
        profileDropdown.querySelector("[data-action='logout']")?.addEventListener("click", () => {
            api.logout();
        });
    }

    document.addEventListener("click", () => {
        notifPanel?.classList.remove("show");
        profileDropdown?.classList.remove("show");
    });

    // ========================================
    // SIDEBAR: SETTINGS + LOGOUT
    // ========================================
    document.querySelectorAll(".Sidebar_down a, .sidebar-bottom .menu-item").forEach((item) => {
        const text = (item.textContent || "").trim().toLowerCase();
        if (text.includes("setting")) {
            item.addEventListener("click", (e) => {
                e.preventDefault();
                openProfileModal();
            });
        } else if (text.includes("logout") || text.includes("log out") || item.classList.contains("logout") || item.classList.contains("logout-link")) {
            item.addEventListener("click", (e) => {
                e.preventDefault();
                api.logout();
            });
        }
    });

    // ========================================
    // MOBILE SIDEBAR (MATCHES STUDENT DASHBOARD)
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

    // ========================================
    // HYDRATE PROFILE & NOTIFICATIONS FROM API
    // ========================================
    try {
        const profData = await api.request("/instructor/profile/");
        currentProfile = profData.instructor || profData;
        api.hydrateTopbarProfile(currentProfile);
    } catch {
        // handled by auth guard if 401
    }
    loadNotifications();
});
