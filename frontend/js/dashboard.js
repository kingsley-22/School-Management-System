/* =========================================================
   IFEXA ACADEMY — STUDENT DASHBOARD JAVASCRIPT
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    setupMobileMenu();
    setupDashboardSearch();
    setupNotifications();
    setupActiveNavigation();
});

/* MOBILE MENU: open, close, outside click, Escape key */
function setupMobileMenu() {
    const hamburger = document.getElementById("hamburger");
    const mobileMenu = document.getElementById("mobileMenu");
    if (!hamburger || !mobileMenu) return;

    const icon = hamburger.querySelector("i");

    function setMenuOpen(open) {
        mobileMenu.hidden = !open;
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
        setMenuOpen(mobileMenu.hidden);
    });

    mobileMenu.addEventListener("click", (event) => {
        if (event.target.closest("a")) setMenuOpen(false);
    });

    document.addEventListener("click", (event) => {
        if (
            !mobileMenu.hidden &&
            !mobileMenu.contains(event.target) &&
            !hamburger.contains(event.target)
        ) setMenuOpen(false);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !mobileMenu.hidden) {
            setMenuOpen(false);
            hamburger.focus();
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 700) setMenuOpen(false);
    });
}

/* SEARCH COURSES AND ASSIGNMENTS */
function setupDashboardSearch() {
    const searchInput = document.getElementById("courseSearch");
    if (!searchInput) return;

    const searchableItems = [
        ...document.querySelectorAll(".course-card"),
        ...document.querySelectorAll(".assignment-item"),
        ...document.querySelectorAll(".deadline-item")
    ];

    searchInput.addEventListener("input", () => {
        const query = searchInput.value.trim().toLowerCase();
        searchableItems.forEach((item) => {
            item.hidden = !item.textContent.toLowerCase().includes(query);
        });
    });
}

/* NOTIFICATION DROPDOWN */
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
            <div class="notification-item">
                <span class="notification-item-icon"><i class="fa-solid fa-file-lines"></i></span>
                <div>
                    <strong>Assignment reminder</strong>
                    <p>Your Web Development assignment is awaiting submission.</p>
                    <small>Recently</small>
                </div>
            </div>
            <div class="notification-item">
                <span class="notification-item-icon"><i class="fa-solid fa-bullhorn"></i></span>
                <div>
                    <strong>Academy announcement</strong>
                    <p>Check the latest academy announcements for updates.</p>
                    <small>Recently</small>
                </div>
            </div>`;
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

    panel.addEventListener("click", (event) => {
        event.stopPropagation();
        if (event.target.closest(".mark-notifications-read")) {
            const badge = bell.querySelector("span");
            if (badge) badge.remove();
            panel.querySelectorAll(".notification-item").forEach((item) => {
                item.classList.add("is-read");
            });
        }
    });

    document.addEventListener("click", (event) => {
        if (!container.contains(event.target)) setPanelOpen(false);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") setPanelOpen(false);
    });
}

/* Keep desktop and mobile active navigation in sync */
function setupActiveNavigation() {
    const links = document.querySelectorAll(
        ".sidebar-nav .nav-link, .mobile-links .nav-link"
    );

    links.forEach((link) => {
        link.addEventListener("click", () => {
            const target = link.getAttribute("href");
            if (!target || !target.startsWith("#")) return;
            links.forEach((item) => {
                item.classList.toggle("active", item.getAttribute("href") === target);
            });
        });
    });
}

/* Notification panel styles */
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
}
.notification-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 13px 0;
    border-bottom: 1px solid #edf1f7;
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
@media (max-width: 700px) {
    .notification-panel { position: fixed; top: 65px; right: 12px; }
}`;
document.head.appendChild(notificationStyles);
