// // ========================================
// // INSTRUCTOR DASHBOARD JAVASCRIPT
// // ========================================

// document.addEventListener("DOMContentLoaded", () => {

//     // ========================================
//     // 1. MOBILE SIDEBAR
//     // ========================================

//     const menuToggle = document.querySelector(".menu-toggle");
//     const sidebar = document.querySelector(".sidebar");

//     if (menuToggle && sidebar) {
//         menuToggle.addEventListener("click", () => {
//             sidebar.classList.toggle("active");
//             sidebar.classList.toggle("show");
//             document.body.classList.toggle("menu-open");
//         });
//     }


//     // ========================================
//     // 2. CLOSE SIDEBAR ON MOBILE
//     // ========================================

//     const sidebarLinks =
//         document.querySelectorAll(".sidebar .menu-item");

//     sidebarLinks.forEach(link => {

//         link.addEventListener("click", () => {

//             if (window.innerWidth <= 768) {

//                 sidebar.classList.remove("active");
//                 sidebar.classList.remove("show");

//                 document.body.classList.remove("menu-open");
//             }

//         });

//     });


// // ========================================
// // NOTIFICATION PANEL
// // ========================================

// const notificationButton =
//     document.getElementById("notificationBtn");

// const notificationPanel =
//     document.getElementById("notificationPanel");

// const markAllRead =
//     document.getElementById("markAllRead");

// const notificationDot =
//     document.querySelector(".notification-dot");


// if (notificationButton && notificationPanel) {

//     // Open / close notification panel
//     notificationButton.addEventListener("click", (event) => {

//         event.stopPropagation();

//         notificationPanel.classList.toggle("show");

//     });


//     // Prevent panel click from closing itself
//     notificationPanel.addEventListener("click", (event) => {

//         event.stopPropagation();

//     });


//     // Close when clicking outside
//     document.addEventListener("click", () => {

//         notificationPanel.classList.remove("show");

//     });

// }


// // ========================================
// // MARK ALL NOTIFICATIONS AS READ
// // ========================================

// if (markAllRead) {

//     markAllRead.addEventListener("click", () => {

//         const unreadNotifications =
//             document.querySelectorAll(
//                 ".notification-item.unread"
//             );

//         unreadNotifications.forEach(notification => {

//             notification.classList.remove("unread");

//         });


//         // Remove red notification dot
//         if (notificationDot) {

//             notificationDot.style.display = "none";

//         }


//         // Update notification count
//         const notificationCount =
//             document.querySelector(
//                 ".notification-header span"
//             );

//         if (notificationCount) {

//             notificationCount.textContent =
//                 "No new notifications";

//         }

//     });

// }


//     // ========================================
//     // 4. PROFILE
//     // ========================================

//  // ========================================
// // PROFILE DROPDOWN
// // ========================================

// const profileBtn =
//     document.getElementById("profileBtn");

// const profileWrapper =
//     document.querySelector(".profile-wrapper");

// const profileDropdown =
//     document.getElementById("profileDropdown");


// if (profileBtn && profileWrapper) {

//     profileBtn.addEventListener("click", (event) => {

//         event.stopPropagation();

//         profileWrapper.classList.toggle("open");

//     });

// }


// // ========================================
// // CLOSE PROFILE DROPDOWN
// // ========================================

// if (profileDropdown) {

//     profileDropdown.addEventListener("click", (event) => {

//         event.stopPropagation();

//     });

// }


// document.addEventListener("click", () => {

//     if (profileWrapper) {

//         profileWrapper.classList.remove("open");

//     }

// });


// // ========================================
// // PROFILE MENU ACTIONS
// // ========================================

// const profileLinks =
//     document.querySelectorAll(
//         ".profile-dropdown-menu a"
//     );

// profileLinks.forEach(link => {

//     link.addEventListener("click", (event) => {

//         const text =
//             link.textContent.trim();

//         if (text === "My Profile") {

//             event.preventDefault();

//             alert("Profile page coming soon.");

//         }

//         if (text === "Settings") {

//             event.preventDefault();

//             alert("Settings page coming soon.");

//         }

//         if (text === "Logout") {

//             event.preventDefault();

//             const confirmLogout =
//                 confirm("Are you sure you want to logout?");

//             if (confirmLogout) {

//                 alert("Logout will be connected to Django authentication.");

//             }

//         }

//     });

// });


//     // ========================================
//     // 5. VIEW ALL ACTIVITY
//     // ========================================

//     const cardLinks =
//         document.querySelectorAll(".card-header a");

//     cardLinks.forEach(link => {

//         link.addEventListener("click", (event) => {

//             event.preventDefault();

//             const text =
//                 link.textContent.trim();

//             if (text === "View All") {

//                 alert(
//                     "All recent activities will appear here."
//                 );

//             }

//             if (text === "View Courses") {

//                 window.location.href = "courses.html";

//             }

//         });

//     });


//     // ========================================
//     // 6. QUICK ACTIONS
//     // ========================================

//     const addStudentAction =
//         document.getElementById("addStudentAction");

//     const createCourseAction =
//         document.getElementById("createCourseAction");

//     const createAssignmentAction =
//         document.getElementById("createAssignmentAction");

//     const postAnnouncementAction =
//         document.getElementById("postAnnouncementAction");


//     // ADD STUDENT

//     if (addStudentAction) {

//         addStudentAction.addEventListener("click", () => {

//             window.location.href = "students.html";

//         });

//     }


//     // CREATE COURSE

//     if (createCourseAction) {

//         createCourseAction.addEventListener("click", () => {

//             window.location.href = "courses.html";

//         });

//     }


//     // CREATE ASSIGNMENT

//     if (createAssignmentAction) {

//         createAssignmentAction.addEventListener("click", () => {

//             window.location.href = "assignments.html";

//         });

//     }


//     // POST ANNOUNCEMENT

//     if (postAnnouncementAction) {

//         postAnnouncementAction.addEventListener("click", () => {

//             window.location.href = "announcements.html";

//         });

//     }


//     // ========================================
//     // 7. STAT CARD CLICK EFFECT
//     // ========================================

//     const statCards =
//         document.querySelectorAll(".stat-card");

//     statCards.forEach(card => {

//         card.addEventListener("click", () => {

//             card.style.transform = "scale(0.98)";

//             setTimeout(() => {

//                 card.style.transform = "";

//             }, 150);

//         });

//     });


//     // ========================================
//     // 8. ESCAPE KEY
//     // ========================================

//     document.addEventListener("keydown", (event) => {

//         if (event.key === "Escape") {

//             if (sidebar) {

//                 sidebar.classList.remove("active");
//                 sidebar.classList.remove("show");

//             }

//             document.body.classList.remove("menu-open");

//         }

//     });


//     // ========================================
//     // 9. FUTURE DJANGO API
//     // ========================================

//     /*
//         Later, the dashboard will receive
//         real information from Django.

//         Example:

//         fetch("YOUR_API_ENDPOINT")
//             .then(response => response.json())
//             .then(data => {
//                 console.log(data);
//             });
//     */

// });













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
    // 3. NOTIFICATION PANEL
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
    // 4. PROFILE DROPDOWN
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

                window.location.href = "/instructor/courses/";

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

            window.location.href = "/instructor/students/";

        });

    }


    // CREATE COURSE

    if (createCourseAction) {

        createCourseAction.addEventListener("click", () => {

            window.location.href = "/instructor/courses/";

        });

    }


    // CREATE ASSIGNMENT

    if (createAssignmentAction) {

        createAssignmentAction.addEventListener("click", () => {

            window.location.href = "/instructor/assignments/";

        });

    }


    // POST ANNOUNCEMENT

    if (postAnnouncementAction) {

        postAnnouncementAction.addEventListener("click", () => {

            window.location.href = "/instructor/announcements/";

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
    // 10. LOAD STATS FROM STORAGE
    // ========================================
    function setStat(id, key, suffix = "") {
        const el = document.getElementById(id);
        if (!el) return;
        const stored = localStorage.getItem(key);
        if (stored !== null) {
            el.textContent = stored + suffix;
        }
    }

    setStat("totalCoursesCount", "totalCourses");
    setStat("totalStudentsCount", "totalStudents");
    setStat("totalAssignmentsCount", "totalAssignments");
    setStat("averagePerformanceCount", "averagePerformance", "%");



    // ========================================
    // 11. RECENT ACTIVITY
    // ========================================
    const activityList = document.getElementById("activityList");

    function relativeTime(ts) {
        const diff = Date.now() - ts;
        const s = Math.floor(diff / 1000);
        if (s < 60) return "just now";
        const m = Math.floor(s / 60);
        if (m < 60) return m + (m === 1 ? " minute ago" : " minutes ago");
        const h = Math.floor(m / 60);
        if (h < 24) return h + (h === 1 ? " hour ago" : " hours ago");
        const d = Math.floor(h / 24);
        if (d === 1) return "Yesterday";
        if (d < 30) return d + " days ago";
        return new Date(ts).toLocaleDateString("en-GB", {
            day: "2-digit", month: "short", year: "numeric"
        });
    }

    function iconFor(type) {
        const map = {
            student:      { icon: "fa-user-plus",        colorClass: "green"  },
            course:       { icon: "fa-book",             colorClass: "blue"   },
            assignment:   { icon: "fa-file-circle-plus", colorClass: "orange" },
            announcement: { icon: "fa-bullhorn",         colorClass: "purple" },
            edit:         { icon: "fa-pen",              colorClass: "blue"   },
            delete:       { icon: "fa-trash",            colorClass: "red"    },
            grade:        { icon: "fa-circle-check",     colorClass: "green"  }
        };
        return map[type] || { icon: "fa-circle-info", colorClass: "blue" };
    }

    function seedInitialActivity() {
        if (!window.loadActivityLog) return;
        const existing = window.loadActivityLog();
        if (existing.length > 0) return;

        const now = Date.now();
        const seed = [
            { type: "grade",      title: "Assignment graded",        description: "You graded 12 student assignments",                timestamp: now - 3 * 3600 * 1000 },
            { type: "student",    title: "New student enrolled",     description: "JUNGLE MAN joined your Python Programming course",  timestamp: now - 1 * 3600 * 1000 },
            { type: "assignment", title: "New assignment submitted", description: "JUNGLE MAN submitted Web Development Assignment",    timestamp: now - 10 * 60 * 1000 }
        ];
        localStorage.setItem("activityLog", JSON.stringify(seed));
    }

            function renderActivity() {
        if (!activityList) return;
        if (!window.loadActivityLog) {
            console.warn("activity-log.js not loaded — Recent Activity will not work.");
            return;
        }

        const entries = window.loadActivityLog();

        if (entries.length === 0) {
            activityList.innerHTML = `
                <div class="activity-empty">
                    <i class="fa-regular fa-clock"></i>
                    <p>No activity yet. Start by adding a student or creating a course.</p>
                </div>
            `;
            return;
        }

        activityList.innerHTML = entries.map(e => {
            const meta = iconFor(e.type);
            const link = e.link || "/instructor/";
            return `
                <a class="activity-item" href="${link}">
                    <div class="activity-icon ${meta.colorClass}">
                        <i class="fa-solid ${meta.icon}"></i>
                    </div>
                    <div class="activity-info">
                        <h4>${e.title}</h4>
                        <p>${e.description}</p>
                        <span>${relativeTime(e.timestamp)}</span>
                    </div>
                    <i class="fa-solid fa-chevron-right activity-go"></i>
                </a>
            `;
        }).join("");
    }

    seedInitialActivity();
    renderActivity();

    window.addEventListener("focus", renderActivity);
  

});