// ========================================
// INSTRUCTOR DASHBOARD JAVASCRIPT
// ========================================

document.addEventListener("DOMContentLoaded", () => {

    // ========================================
    // 1. MOBILE SIDEBAR
    // ========================================

    const menuToggle = document.querySelector(".menu-toggle");
    const sidebar = document.querySelector(".sidebar");

    if (menuToggle && sidebar) {
        menuToggle.addEventListener("click", () => {
            sidebar.classList.toggle("active");
            sidebar.classList.toggle("show");
            document.body.classList.toggle("menu-open");
        });
    }


    // ========================================
    // 2. CLOSE SIDEBAR ON MOBILE
    // ========================================

    const sidebarLinks =
        document.querySelectorAll(".sidebar .menu-item");

    sidebarLinks.forEach(link => {

        link.addEventListener("click", () => {

            if (window.innerWidth <= 768) {

                sidebar.classList.remove("active");
                sidebar.classList.remove("show");

                document.body.classList.remove("menu-open");
            }

        });

    });


// ========================================
// NOTIFICATION PANEL
// ========================================

const notificationButton =
    document.getElementById("notificationBtn");

const notificationPanel =
    document.getElementById("notificationPanel");

const markAllRead =
    document.getElementById("markAllRead");

const notificationDot =
    document.querySelector(".notification-dot");


if (notificationButton && notificationPanel) {

    // Open / close notification panel
    notificationButton.addEventListener("click", (event) => {

        event.stopPropagation();

        notificationPanel.classList.toggle("show");

    });


    // Prevent panel click from closing itself
    notificationPanel.addEventListener("click", (event) => {

        event.stopPropagation();

    });


    // Close when clicking outside
    document.addEventListener("click", () => {

        notificationPanel.classList.remove("show");

    });

}


// ========================================
// MARK ALL NOTIFICATIONS AS READ
// ========================================

if (markAllRead) {

    markAllRead.addEventListener("click", () => {

        const unreadNotifications =
            document.querySelectorAll(
                ".notification-item.unread"
            );

        unreadNotifications.forEach(notification => {

            notification.classList.remove("unread");

        });


        // Remove red notification dot
        if (notificationDot) {

            notificationDot.style.display = "none";

        }


        // Update notification count
        const notificationCount =
            document.querySelector(
                ".notification-header span"
            );

        if (notificationCount) {

            notificationCount.textContent =
                "No new notifications";

        }

    });

}


    // ========================================
    // 4. PROFILE
    // ========================================

 // ========================================
// PROFILE DROPDOWN
// ========================================

const profileBtn =
    document.getElementById("profileBtn");

const profileWrapper =
    document.querySelector(".profile-wrapper");

const profileDropdown =
    document.getElementById("profileDropdown");


if (profileBtn && profileWrapper) {

    profileBtn.addEventListener("click", (event) => {

        event.stopPropagation();

        profileWrapper.classList.toggle("open");

    });

}


// ========================================
// CLOSE PROFILE DROPDOWN
// ========================================

if (profileDropdown) {

    profileDropdown.addEventListener("click", (event) => {

        event.stopPropagation();

    });

}


document.addEventListener("click", () => {

    if (profileWrapper) {

        profileWrapper.classList.remove("open");

    }

});


// ========================================
// PROFILE MENU ACTIONS
// ========================================

const profileLinks =
    document.querySelectorAll(
        ".profile-dropdown-menu a"
    );

profileLinks.forEach(link => {

    link.addEventListener("click", (event) => {

        const text =
            link.textContent.trim();

        if (text === "My Profile") {

            event.preventDefault();

            alert("Profile page coming soon.");

        }

        if (text === "Settings") {

            event.preventDefault();

            alert("Settings page coming soon.");

        }

        if (text === "Logout") {

            event.preventDefault();

            const confirmLogout =
                confirm("Are you sure you want to logout?");

            if (confirmLogout) {

                alert("Logout will be connected to Django authentication.");

            }

        }

    });

});


    // ========================================
    // 5. VIEW ALL ACTIVITY
    // ========================================

    const cardLinks =
        document.querySelectorAll(".card-header a");

    cardLinks.forEach(link => {

        link.addEventListener("click", (event) => {

            event.preventDefault();

            const text =
                link.textContent.trim();

            if (text === "View All") {

                alert(
                    "All recent activities will appear here."
                );

            }

            if (text === "View Courses") {

                window.location.href = "courses.html";

            }

        });

    });


    // ========================================
    // 6. QUICK ACTIONS
    // ========================================

    const addStudentAction =
        document.getElementById("addStudentAction");

    const createCourseAction =
        document.getElementById("createCourseAction");

    const createAssignmentAction =
        document.getElementById("createAssignmentAction");

    const postAnnouncementAction =
        document.getElementById("postAnnouncementAction");


    // ADD STUDENT

    if (addStudentAction) {

        addStudentAction.addEventListener("click", () => {

            window.location.href = "students.html";

        });

    }


    // CREATE COURSE

    if (createCourseAction) {

        createCourseAction.addEventListener("click", () => {

            window.location.href = "courses.html";

        });

    }


    // CREATE ASSIGNMENT

    if (createAssignmentAction) {

        createAssignmentAction.addEventListener("click", () => {

            window.location.href = "assignments.html";

        });

    }


    // POST ANNOUNCEMENT

    if (postAnnouncementAction) {

        postAnnouncementAction.addEventListener("click", () => {

            window.location.href = "announcements.html";

        });

    }


    // ========================================
    // 7. STAT CARD CLICK EFFECT
    // ========================================

    const statCards =
        document.querySelectorAll(".stat-card");

    statCards.forEach(card => {

        card.addEventListener("click", () => {

            card.style.transform = "scale(0.98)";

            setTimeout(() => {

                card.style.transform = "";

            }, 150);

        });

    });


    // ========================================
    // 8. ESCAPE KEY
    // ========================================

    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {

            if (sidebar) {

                sidebar.classList.remove("active");
                sidebar.classList.remove("show");

            }

            document.body.classList.remove("menu-open");

        }

    });


    // ========================================
    // 9. FUTURE DJANGO API
    // ========================================

    /*
        Later, the dashboard will receive
        real information from Django.

        Example:

        fetch("YOUR_API_ENDPOINT")
            .then(response => response.json())
            .then(data => {
                console.log(data);
            });
    */

});