// ========================================
// INSTRUCTOR SHELL — shared across pages
// Handles: notification panel, profile
// dropdown, settings, logout, mobile sidebar.
// Includes its own CSS so it works on every
// page regardless of the page stylesheet.
// ========================================

document.addEventListener("DOMContentLoaded", () => {

    // ========================================
    // INJECT REQUIRED CSS
    // ========================================
    if (!document.getElementById("instructor-shell-styles")) {
        const style = document.createElement("style");
        style.id = "instructor-shell-styles";
        style.textContent = `
            .notification-wrapper,
            .profile-wrapper {
                position: relative;
            }

            .notification-panel {
                position: absolute;
                top: calc(100% + 12px);
                right: 0;
                width: 380px;
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 14px;
                box-shadow: 0 15px 35px rgba(15, 23, 42, 0.15);
                overflow: hidden;
                z-index: 3000;
                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px);
                transition: opacity 0.25s ease, transform 0.25s ease, visibility 0.25s ease;
            }

            .notification-panel.show {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }

            .notification-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 18px;
                border-bottom: 1px solid #e2e8f0;
            }

            .notification-header h3 {
                margin: 0 0 4px;
                font-size: 17px;
                color: #1e293b;
            }

            .notification-header span {
                font-size: 12px;
                color: #64748b;
            }

            .notification-header button {
                border: none;
                background: transparent;
                color: #2563eb;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
            }

            .notification-list {
                max-height: 420px;
                overflow-y: auto;
            }

            .notification-item {
                display: flex;
                gap: 12px;
                padding: 16px 18px;
                border-bottom: 1px solid #f1f5f9;
                background: #ffffff;
                transition: background 0.2s ease;
            }

            .notification-item.unread {
                background: #eff6ff;
            }

            .notification-icon {
                width: 40px;
                height: 40px;
                min-width: 40px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 15px;
            }

            .notification-icon.blue   { background: #dbeafe; color: #2563eb; }
            .notification-icon.green  { background: #dcfce7; color: #16a34a; }
            .notification-icon.orange { background: #ffedd5; color: #ea580c; }
            .notification-icon.purple { background: #ede9fe; color: #7c3aed; }

            .notification-content { flex: 1; }

            .notification-content h4 {
                margin: 0 0 4px;
                font-size: 13px;
                color: #1e293b;
            }

            .notification-content p {
                margin: 0 0 5px;
                font-size: 12px;
                line-height: 1.5;
                color: #64748b;
            }

            .notification-content span {
                font-size: 11px;
                color: #94a3b8;
            }

            .profile-dropdown {
                position: absolute;
                top: calc(100% + 12px);
                right: 0;
                width: 260px;
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 14px;
                box-shadow: 0 15px 35px rgba(15, 23, 42, 0.15);
                overflow: hidden;
                z-index: 3000;
                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px);
                transition: opacity 0.25s ease, transform 0.25s ease, visibility 0.25s ease;
            }

            .profile-wrapper.open .profile-dropdown {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }

            .profile-dropdown-header {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 18px;
                border-bottom: 1px solid #e2e8f0;
            }

            .profile-dropdown-header h4 {
                margin: 0 0 4px;
                font-size: 14px;
                color: #1e293b;
            }

            .profile-dropdown-header span {
                font-size: 12px;
                color: #64748b;
            }

            .profile-avatar.large {
                width: 42px;
                height: 42px;
                min-width: 42px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                background: #2563eb;
                color: #ffffff;
                font-size: 13px;
                font-weight: 700;
            }

            .profile-dropdown-menu { padding: 8px; }

            .profile-dropdown-menu a {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 11px 12px;
                border-radius: 8px;
                text-decoration: none;
                color: #475569;
                font-size: 13px;
                transition: background 0.2s ease, color 0.2s ease;
            }

            .profile-dropdown-menu a:hover {
                background: #eff6ff;
                color: #2563eb;
            }

            .profile-dropdown-menu a i { width: 18px; text-align: center; font-size: 14px; }

            .profile-dropdown-menu .logout-profile {
                color: #dc2626;
                border-top: 1px solid #f1f5f9;
                margin-top: 5px;
                padding-top: 14px;
            }

            .profile-dropdown-menu .logout-profile:hover {
                background: #fef2f2;
                color: #dc2626;
            }

            @media (max-width: 768px) {
                .notification-panel {
                    position: fixed;
                    top: 70px;
                    right: 15px;
                    left: 15px;
                    width: auto;
                }
                .profile-dropdown {
                    position: fixed;
                    top: 70px;
                    right: 15px;
                    width: 250px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // ========================================
    // NOTIFICATION PANEL
    // ========================================
    const bellBtn = document.querySelector(".notification-btn");

    if (bellBtn && !document.getElementById("notificationPanel")) {

        const wrapper = document.createElement("div");
        wrapper.className = "notification-wrapper";
        bellBtn.parentNode.insertBefore(wrapper, bellBtn);
        wrapper.appendChild(bellBtn);

        wrapper.insertAdjacentHTML("beforeend", `
            <div class="notification-panel" id="notificationPanel">
                <div class="notification-header">
                    <div>
                        <h3>Notifications</h3>
                        <span>3 new notifications</span>
                    </div>
                    <button id="markAllRead">Mark all as read</button>
                </div>
                <div class="notification-list">
                    <div class="notification-item unread">
                        <div class="notification-icon blue"><i class="fa-solid fa-file-arrow-up"></i></div>
                        <div class="notification-content">
                            <h4>New Assignment Submitted</h4>
                            <p>A student submitted a Web Development assignment.</p>
                            <span>10 minutes ago</span>
                        </div>
                    </div>
                    <div class="notification-item unread">
                        <div class="notification-icon green"><i class="fa-solid fa-user-plus"></i></div>
                        <div class="notification-content">
                            <h4>New Student Enrolled</h4>
                            <p>A new student joined your Python course.</p>
                            <span>1 hour ago</span>
                        </div>
                    </div>
                    <div class="notification-item unread">
                        <div class="notification-icon orange"><i class="fa-solid fa-file-circle-check"></i></div>
                        <div class="notification-content">
                            <h4>Assignment Needs Review</h4>
                            <p>3 assignments are waiting for your review.</p>
                            <span>2 hours ago</span>
                        </div>
                    </div>
                </div>
            </div>
        `);

        const panel = document.getElementById("notificationPanel");
        const markAll = document.getElementById("markAllRead");
        const dot = document.querySelector(".notification-dot");

        bellBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            panel.classList.toggle("show");
        });

        panel.addEventListener("click", (e) => e.stopPropagation());

        document.addEventListener("click", () => {
            panel.classList.remove("show");
        });

        if (markAll) {
            markAll.addEventListener("click", () => {
                document.querySelectorAll(".notification-item.unread")
                    .forEach(n => n.classList.remove("unread"));
                if (dot) dot.style.display = "none";
                const count = document.querySelector(".notification-header span");
                if (count) count.textContent = "No new notifications";
            });
        }
    }

    // ========================================
    // PROFILE DROPDOWN
    // ========================================
    const profileBtn = document.querySelector(".profile");

    if (profileBtn && !document.getElementById("profileDropdown")) {

        const wrapper = document.createElement("div");
        wrapper.className = "profile-wrapper";
        profileBtn.parentNode.insertBefore(wrapper, profileBtn);
        wrapper.appendChild(profileBtn);

        wrapper.insertAdjacentHTML("beforeend", `
            <div class="profile-dropdown" id="profileDropdown">
                <div class="profile-dropdown-header">
                    <div class="profile-avatar large">JM</div>
                    <div>
                        <h4>JUNGLE MAN</h4>
                        <span>Instructor</span>
                    </div>
                </div>
                <div class="profile-dropdown-menu">
                    <a href="#"><i class="fa-solid fa-user"></i><span>My Profile</span></a>
                    <a href="#"><i class="fa-solid fa-gear"></i><span>Settings</span></a>
                    <a href="#" class="logout-profile"><i class="fa-solid fa-right-from-bracket"></i><span>Logout</span></a>
                </div>
            </div>
        `);

        const dropdownWrapper = wrapper;
        const dropdown = document.getElementById("profileDropdown");

        profileBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            dropdownWrapper.classList.toggle("open");
        });

        dropdown.addEventListener("click", (e) => e.stopPropagation());

        document.addEventListener("click", () => {
            dropdownWrapper.classList.remove("open");
        });

        dropdown.querySelectorAll(".profile-dropdown-menu a").forEach(link => {
            link.addEventListener("click", (e) => {
                const text = link.textContent.trim();
                if (text === "My Profile") {
                    e.preventDefault();
                    alert("Profile page coming soon.");
                }
                if (text === "Settings") {
                    e.preventDefault();
                    alert("Settings page coming soon.");
                }
                if (text === "Logout") {
                    e.preventDefault();
                    if (confirm("Are you sure you want to logout?")) {
                        alert("Logout will be connected to Django authentication.");
                    }
                }
            });
        });
    }

    // ========================================
    // SIDEBAR: SETTINGS + LOGOUT
    // ========================================
    document.querySelectorAll(".sidebar-bottom .menu-item").forEach(item => {
        const text = item.textContent.trim();
        if (text === "Settings") {
            item.addEventListener("click", (e) => {
                e.preventDefault();
                alert("Settings page coming soon.");
            });
        }
        if (text === "Logout") {
            item.addEventListener("click", (e) => {
                e.preventDefault();
                if (confirm("Are you sure you want to logout?")) {
                    alert("Logout will be connected to Django authentication.");
                }
            });
        }
    });

    // ========================================
    // MOBILE SIDEBAR TOGGLE
    // ========================================
    const menuToggle = document.querySelector(".menu-toggle");
    const sidebar = document.querySelector(".sidebar");

    if (menuToggle && sidebar) {
        menuToggle.addEventListener("click", () => {
            sidebar.classList.toggle("show");
            sidebar.classList.toggle("active");
        });
    }
});