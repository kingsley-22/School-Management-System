
/* =====================================
   LEARNHUB COURSE DATA
===================================== */

const courses = [
    {
        title: "Complete Web Development",
        category: "Development",
        description: "Learn how to build modern websites using HTML, CSS and JavaScript.",
        duration: "12 weeks",
        rating: "4.9",
        price: 120000,
        icon: "fa-code",
        color: "purple"
    },
    {
        title: "UI/UX Design Masterclass",
        category: "Design",
        description: "Learn to research, plan and design beautiful, user-friendly digital experiences.",
        duration: "8 weeks",
        rating: "4.8",
        price: 150000,
        icon: "fa-pen-ruler",
        color: "pink"
    },
    {
        title: "Python Programming",
        category: "Development",
        description: "Build your programming foundation and create practical projects with Python.",
        duration: "10 weeks",
        rating: "4.7",
        price: 200000,
        icon: "fa-python",
        color: "blue"
    },
    {
        title: "Business Management",
        category: "Business",
        description: "Develop practical leadership, planning and business management skills.",
        duration: "6 weeks",
        rating: "4.6",
        price: 150000,
        icon: "fa-chart-line",
        color: "orange"
    },
    {
        title: "Digital Marketing",
        category: "Marketing",
        description: "Master social media, content creation and online marketing fundamentals.",
        duration: "7 weeks",
        rating: "4.8",
        price: 160000,
        icon: "fa-bullhorn",
        color: "green"
    },
    {
        title: "Graphic Design Essentials",
        category: "Design",
        description: "Learn design fundamentals and create attractive graphics and visual content.",
        duration: "5 weeks",
        rating: "4.7",
        price: 75000,
        icon: "fa-palette",
        color: "yellow"
    }
];

const money = amount =>
    "₦" + Number(amount).toLocaleString("en-NG");

/* =====================================
   ELEMENTS
===================================== */
const pageTitle = document.getElementById("pageTitle");
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");

const pages = [...document.querySelectorAll(".page")];
const courseCards = [...document.querySelectorAll(".course-card")];

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const courseCount = document.getElementById("courseCount");
const availableCount = document.getElementById("availableCount");
const emptyMessage = document.getElementById("emptyMessage");

const enrolledCoursesGrid =
    document.getElementById("enrolledCoursesGrid");
const enrolledCount = document.getElementById("enrolledCount");
const registeredLabel = document.getElementById("registeredLabel");
const noEnrolledCourses =
    document.getElementById("noEnrolledCourses");

const selectedCourseSelect =
    document.getElementById("selectedCourse");
const enrollmentForm = document.getElementById("enrollmentForm");
const enrollmentPrice = document.getElementById("enrollmentPrice");
const formMessage = document.getElementById("formMessage");
const toast = document.getElementById("toast");

let selectedCourseIndex = 0;
let lastPage = "details";
let toastTimer;

/* =====================================
   TEMPORARY ENROLLMENT DATA
   Registrations reset when the page refreshes.
===================================== */

let enrollments = [];

/* =====================================
   PAGE NAVIGATION
===================================== */

function showPage(pageId, title) {
    const targetPage = document.getElementById(pageId);

    if (!targetPage || !targetPage.classList.contains("page")) {
        return;
    }

    pages.forEach(page => {
        page.classList.toggle("active", page.id === pageId);
    });

    if (pageTitle && title) {
        pageTitle.textContent = title;
    }

    if (sidebar) {
        sidebar.querySelectorAll("nav a").forEach(link => {
            link.classList.remove("active-link");
        });

        const activeLink = sidebar.querySelector(
            `nav a[data-page="${pageId}"]`
        );

        const dashboardLink = sidebar.querySelector("nav a.Dash");

        if (activeLink) {
            activeLink.classList.add("active-link");
        } else if (pageId === "courses" && dashboardLink) {
            dashboardLink.classList.add("active-link");
        }
    }

    closeSidebar();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

/* =====================================
   MOBILE SIDEBAR
===================================== */

function openSidebar() {
    if (!sidebar || !menuToggle) return;
    sidebar.classList.add("open");
    sidebarBackdrop?.classList.add("show");
    document.body.classList.add("sidebar-open");
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Close navigation menu");
    menuToggle.innerHTML = '<i class="fas fa-times"></i>';
}

function closeSidebar() {
    if (!sidebar || !menuToggle) return;
    sidebar.classList.remove("open");
    sidebarBackdrop?.classList.remove("show");
    document.body.classList.remove("sidebar-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation menu");
    menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
}

menuToggle?.addEventListener("click", () => {
    if (sidebar?.classList.contains("open")) {
        closeSidebar();
    } else {
        openSidebar();
    }
});

sidebarBackdrop?.addEventListener("click", closeSidebar);

document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeSidebar();
});

window.addEventListener("resize", () => {
    if (window.innerWidth > 850) closeSidebar();
});

sidebar?.querySelectorAll("nav a").forEach(link => {
    link.addEventListener("click", event => {
        const pageId = link.dataset.page;
        const notice = link.dataset.notice;

        if (pageId) {
            event.preventDefault();
            showPage(pageId, link.textContent.trim());
        } else if (notice) {
            event.preventDefault();
            const noticeTitle = document.getElementById("noticeTitle");
            if (noticeTitle) noticeTitle.textContent = notice;
            showPage("noticePage", notice);
            showToast(notice + " page has not been connected yet.");
        } else if (link.classList.contains("Dash")) {
            event.preventDefault();
            showPage("courses", "Dashboard");
        } else if (window.innerWidth <= 850) {
            closeSidebar();
        }
    });
});

/* =====================================
   COURSE SEARCH AND FILTER
===================================== */

function filterCourses() {
    const query = (searchInput?.value || "")
        .trim()
        .toLowerCase();

    const category = categoryFilter?.value || "all";
    let visible = 0;

    courseCards.forEach(card => {
        const title = card.dataset.title || "";
        const cardCategory = card.dataset.category || "";

        const matches =
            title.toLowerCase().includes(query) &&
            (category === "all" || cardCategory === category);

        card.hidden = !matches;

        if (matches) visible++;
    });

    if (courseCount) {
        courseCount.textContent =
            `${visible} course${visible === 1 ? "" : "s"} available`;
    }

    if (emptyMessage) {
        emptyMessage.hidden = visible !== 0;
    }
}

searchInput?.addEventListener("input", filterCourses);
categoryFilter?.addEventListener("change", filterCourses);

/* =====================================
   COURSE DETAILS
===================================== */

function openCourse(index) {
    const course = courses[index];

    if (!course) return;

    selectedCourseIndex = index;

    document.getElementById("detailCategory").textContent =
        course.category;

    document.getElementById("detailTitle").textContent =
        course.title;

    document.getElementById("detailDescription").textContent =
        course.description;

    document.getElementById("detailRating").textContent =
        course.rating;

    document.getElementById("detailDuration").textContent =
        course.duration;

    document.getElementById("detailPrice").textContent =
        money(course.price);

    const banner = document.getElementById("detailsBanner");

    if (banner) {
        banner.className = `details-banner ${course.color}`;

        const icon = document.createElement("i");

        icon.className =
            `${course.icon === "fa-python" ? "fab" : "fas"} ${course.icon}`;

        banner.replaceChildren(icon);
    }

    if (selectedCourseSelect) {
        selectedCourseSelect.value = String(index);
        updateEnrollmentPrice();
    }

    lastPage = "details";

    showPage("details", "Course Details");
}

courseCards.forEach((card, index) => {
    const button = card.querySelector(".view-btn");

    button?.addEventListener("click", () => {
        const courseIndex = Number(button.dataset.course ?? index);
        openCourse(courseIndex);
    });
});

document.getElementById("backToCourses")?.addEventListener(
    "click",
    () => showPage("courses", "Dashboard")
);

document.getElementById("backToDetails")?.addEventListener(
    "click",
    () => showPage(lastPage, "Course Details")
);

/* =====================================
   COURSE SELECTION
===================================== */

function populateCourseOptions() {
    if (!selectedCourseSelect) return;

    courses.forEach((course, index) => {
        const option = document.createElement("option");

        option.value = String(index);
        option.textContent =
            `${course.title} — ${money(course.price)}`;

        selectedCourseSelect.appendChild(option);
    });
}

function updateEnrollmentPrice() {
    if (!selectedCourseSelect || !enrollmentPrice) return;

    const value = selectedCourseSelect.value;

    const course = value === ""
        ? null
        : courses[Number(value)];

    enrollmentPrice.textContent = course
        ? money(course.price)
        : money(0);
}

populateCourseOptions();

selectedCourseSelect?.addEventListener(
    "change",
    updateEnrollmentPrice
);

/* =====================================
   ENROLLMENT NAVIGATION
===================================== */

document.getElementById("enrollNow")?.addEventListener(
    "click",
    () => {
        lastPage = "details";

        if (selectedCourseSelect) {
            selectedCourseSelect.value =
                String(selectedCourseIndex);
        }

        updateEnrollmentPrice();

        if (formMessage) {
            formMessage.textContent = "";
        }

        showPage("enrollment", "Course Enrollment");
    }
);

/* =====================================
   REGISTER A COURSE
===================================== */

enrollmentForm?.addEventListener("submit", event => {
    event.preventDefault();

    const name = document.getElementById("fullName")
        .value.trim();

    const email = document.getElementById("email")
        .value.trim().toLowerCase();

    const phone = document.getElementById("phone")
        .value.trim();

    const selectedValue = selectedCourseSelect.value;

    const course = selectedValue === ""
        ? null
        : courses[Number(selectedValue)];

    if (!name || !email || !phone || !course) {
        setFormMessage(
            "Please complete all fields and select a course.",
            false
        );
        return;
    }

    // A student can register for different courses,
    // but cannot register for the same course twice
    // using the same email address.
    const alreadyRegistered = enrollments.some(item =>
        item.email.toLowerCase() === email &&
        item.courseTitle === course.title
    );

    if (alreadyRegistered) {
        setFormMessage(
            "This email is already registered for this course.",
            false
        );
        return;
    }

    const registration = {
        id: createRegistrationId(),
        name: name,
        email: email,
        phone: phone,
        courseTitle: course.title,
        category: course.category,
        price: course.price,
        date: new Date().toLocaleDateString("en-NG"),
        status: "Registered"
    };

    enrollments.push(registration);

    // Refresh the homepage dashboard immediately.
    renderEnrolledCourses();

    setFormMessage(
        `Success! You are registered for ${course.title}.`,
        true
    );

    showToast("Course registered successfully!");

    enrollmentForm.reset();
    updateEnrollmentPrice();

    // Return to the dashboard after a short delay.
    window.setTimeout(() => {
        showPage("courses", "Dashboard");
    }, 1000);
});

function createRegistrationId() {
    if (window.crypto?.randomUUID) {
        return window.crypto.randomUUID();
    }

    return "LH-" + Date.now() + "-" +
        Math.random().toString(36).slice(2, 9);
}

function setFormMessage(message, success) {
    if (!formMessage) return;

    formMessage.textContent = message;
    formMessage.style.color = success
        ? "#16865d"
        : "#d14343";
}

/* =====================================
   RENDER REGISTERED COURSES
===================================== */

function renderEnrolledCourses() {
    if (!enrolledCoursesGrid) return;

    enrolledCoursesGrid.replaceChildren();

    if (enrolledCount) {
        enrolledCount.textContent = String(enrollments.length);
    }

    if (registeredLabel) {
        registeredLabel.textContent =
            `${enrollments.length} enrolled`;
    }

    if (availableCount) {
        availableCount.textContent = String(courses.length);
    }

    if (noEnrolledCourses) {
        noEnrolledCourses.hidden = enrollments.length > 0;
    }

    enrollments.forEach(enrollment => {
        const card = document.createElement("article");
        card.className = "enrolled-card";

        const status = document.createElement("span");
        status.className = "enrolled-status";
        status.textContent = enrollment.status || "Registered";

        const title = document.createElement("h3");
        title.textContent = enrollment.courseTitle;

        const student = document.createElement("p");
        student.textContent = `Student: ${enrollment.name}`;

        const price = document.createElement("p");
        price.className = "enrolled-price";
        price.textContent =
            `Course Fee: ${money(enrollment.price)}`;

        const date = document.createElement("p");
        date.textContent =
            `Registered: ${enrollment.date || "Date unavailable"}`;

        card.append(status, title, student, price, date);

        // Open the course details from the registered course card.
        const courseIndex = courses.findIndex(
            item => item.title === enrollment.courseTitle
        );

        if (courseIndex !== -1) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "view-enrolled-btn";
            button.textContent = "View Course";

            button.addEventListener("click", () => {
                openCourse(courseIndex);
            });

            card.appendChild(button);
        }

        enrolledCoursesGrid.appendChild(card);
    });
}

/* =====================================
   TOAST NOTIFICATIONS
===================================== */

function showToast(message) {
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    window.clearTimeout(toastTimer);

    toastTimer = window.setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

/* =====================================
   OTHER NAVIGATION
===================================== */

document.getElementById("noticeBack")?.addEventListener(
    "click",
    () => showPage("courses", "Dashboard")
);

document.getElementById("logoutButton")?.addEventListener(
    "click",
    event => {
        event.preventDefault();

        showToast(
            "Logout is not connected. Add authentication to enable it."
        );
    }
);

/* =====================================
   INITIALIZE DASHBOARD
===================================== */

renderEnrolledCourses();
filterCourses();
updateEnrollmentPrice();



