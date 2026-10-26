
let courses = [];
let selectedCourseId = null;
let toastTimer = null;

// No localStorage or sessionStorage.
// Course data and bookmarks exist only in memory.
const bookmarkedCourses = new Set();

const $ = id => document.getElementById(id);

// DEFAULT COURSE CATALOGUE
const defaultCourses = [
    {
        id: 1,
        title: "Web Development Fundamentals",
        category: "Technology",
        level: "Beginner",
        instructor: "Ada James",
        hours: 40,
        active: true,
        theme: "art-tech",
        icon: "fa-code",
        description: "Learn HTML, CSS and JavaScript to build responsive websites from scratch.",
        outcomes: [
            "Structure pages using semantic HTML.",
            "Style responsive websites using CSS.",
            "Add interactivity using JavaScript."
        ]
    },
    {
        id: 2,
        title: "Advanced JavaScript",
        category: "Technology",
        level: "Advanced",
        instructor: "David Okafor",
        hours: 45,
        active: true,
        theme: "art-tech",
        icon: "fa-laptop-code",
        description: "Master modern JavaScript, asynchronous programming, APIs and advanced concepts.",
        outcomes: [
            "Use modern ES6+ syntax.",
            "Understand promises and async/await.",
            "Work with APIs and asynchronous data."
        ]
    },
    {
        id: 3,
        title: "Python Programming",
        category: "Technology",
        level: "Beginner",
        instructor: "Chika Eze",
        hours: 35,
        active: true,
        theme: "art-tech",
        icon: "fa-terminal",
        description: "Build a strong programming foundation with Python, functions and practical projects.",
        outcomes: [
            "Understand Python variables and data types.",
            "Write functions and loops.",
            "Build beginner-friendly applications."
        ]
    },
    {
        id: 4,
        title: "Database Management",
        category: "Technology",
        level: "Intermediate",
        instructor: "Michael Obi",
        hours: 32,
        active: true,
        theme: "art-tech",
        icon: "fa-database",
        description: "Learn relational databases, SQL queries, data modelling and database design.",
        outcomes: [
            "Write SQL queries.",
            "Design relational database tables.",
            "Retrieve and organise information."
        ]
    },
    {
        id: 5,
        title: "Cybersecurity Essentials",
        category: "Technology",
        level: "Intermediate",
        instructor: "Emeka Nwosu",
        hours: 38,
        active: true,
        theme: "art-tech",
        icon: "fa-shield-halved",
        description: "Explore online threats, security principles, access control and safe computing.",
        outcomes: [
            "Recognise common cyber threats.",
            "Apply basic security practices.",
            "Understand authentication and access control."
        ]
    },
    {
        id: 6,
        title: "Business Management",
        category: "Business",
        level: "Beginner",
        instructor: "Grace Williams",
        hours: 30,
        active: true,
        theme: "art-business",
        icon: "fa-briefcase",
        description: "Understand business operations, leadership, planning and decision-making.",
        outcomes: [
            "Explain essential management principles.",
            "Develop basic business plans.",
            "Understand leadership responsibilities."
        ]
    },
    {
        id: 7,
        title: "Entrepreneurship and Innovation",
        category: "Business",
        level: "Intermediate",
        instructor: "Samuel Peters",
        hours: 28,
        active: true,
        theme: "art-business",
        icon: "fa-lightbulb",
        description: "Turn ideas into business opportunities through planning and innovation.",
        outcomes: [
            "Identify business opportunities.",
            "Develop a business model.",
            "Evaluate startup costs and risks."
        ]
    },
    {
        id: 8,
        title: "Financial Accounting",
        category: "Business",
        level: "Intermediate",
        instructor: "Ruth Johnson",
        hours: 36,
        active: true,
        theme: "art-business",
        icon: "fa-calculator",
        description: "Learn bookkeeping, financial statements, transactions and accounting principles.",
        outcomes: [
            "Record financial transactions.",
            "Understand basic financial statements.",
            "Interpret accounting information."
        ]
    },
    {
        id: 9,
        title: "UI/UX Design",
        category: "Design",
        level: "Beginner",
        instructor: "Precious Daniel",
        hours: 30,
        active: true,
        theme: "art-design",
        icon: "fa-pen-ruler",
        description: "Design user-friendly digital products through research, wireframes and prototyping.",
        outcomes: [
            "Create wireframes and prototypes.",
            "Understand user-centred design.",
            "Evaluate usability and accessibility."
        ]
    },
    {
        id: 10,
        title: "Graphic Design Principles",
        category: "Design",
        level: "Beginner",
        instructor: "Daniel Okoro",
        hours: 24,
        active: true,
        theme: "art-design",
        icon: "fa-palette",
        description: "Explore typography, colour theory, layout and visual communication.",
        outcomes: [
            "Apply colour theory.",
            "Create balanced visual layouts.",
            "Choose appropriate typography."
        ]
    },
    {
        id: 11,
        title: "Introduction to Biology",
        category: "Science",
        level: "Beginner",
        instructor: "Dr. Esther Bello",
        hours: 34,
        active: true,
        theme: "art-science",
        icon: "fa-dna",
        description: "Explore living organisms, cells, genetics and essential biological processes.",
        outcomes: [
            "Describe cell structures.",
            "Explain basic genetics.",
            "Understand biological systems."
        ]
    },
    
];

// Get safe instructor initials
function initials(name) {
    return String(name || "LH")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(word => word[0] || "")
        .join("")
        .toUpperCase();
}

// Escape text before inserting it into HTML
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// Toast notifications
function showToast(message) {
    const toast = $("toast");

    if (!toast) {
        console.log(message);
        return;
    }

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2600);
}

// Initialise courses in memory only
function loadCourses() {
    courses = defaultCourses.map(course => ({
        ...course,
        outcomes: [...course.outcomes]
    }));

    bookmarkedCourses.clear();
}

// Update dashboard metrics and category counts
function renderMetrics() {
    const total = courses.length;
    const active = courses.filter(course => course.active).length;

    const categories = [
        ...new Set(courses.map(course => course.category))
    ];

    if ($("totalCourses")) {
        $("totalCourses").textContent = total;
    }

    if ($("activeCourses")) {
        $("activeCourses").textContent = active;
    }

    if ($("categoryCount")) {
        $("categoryCount").textContent = categories.length;
    }

    if ($("totalHours")) {
        $("totalHours").textContent = courses.reduce(
            (sum, course) => sum + (Number(course.hours) || 0),
            0
        );
    }

    // Update category chip counts without duplicating spans
    document.querySelectorAll(".chip[data-category]").forEach(chip => {
        const category = chip.dataset.category;

        const count = category === "All"
            ? total
            : courses.filter(course =>
                course.category === category
            ).length;

        let countElement = chip.querySelector("span");

        if (!countElement) {
            countElement = document.createElement("span");
            chip.appendChild(countElement);
        }

        countElement.textContent = count;
    });

    // Keep category dropdown options synchronised
    const categoryFilter = $("categoryFilter");

    if (categoryFilter) {
        const previousCategory = categoryFilter.value || "All";

        categoryFilter.replaceChildren();

        const allOption = document.createElement("option");
        allOption.value = "All";
        allOption.textContent = "All categories";
        categoryFilter.appendChild(allOption);

        categories.sort().forEach(category => {
            const option = document.createElement("option");
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });

        categoryFilter.value = categories.includes(previousCategory)
            ? previousCategory
            : "All";
    }
}

// Get active filter values
function currentFilters() {
    return {
        search: ($("searchInput")?.value || "")
            .trim()
            .toLowerCase(),
        category: $("categoryFilter")?.value || "All",
        level: $("levelFilter")?.value || "All",
        sort: $("sortFilter")?.value || "featured"
    };
}

// Filter and sort the catalogue
function getFilteredCourses() {
    const filters = currentFilters();

    const list = courses.filter(course => {
        const matchesCategory =
            filters.category === "All" ||
            course.category === filters.category;

        const matchesLevel =
            filters.level === "All" ||
            course.level === filters.level;

        const searchableText = [
            course.title,
            course.category,
            course.instructor,
            course.description,
            course.level
        ].join(" ").toLowerCase();

        return matchesCategory &&
            matchesLevel &&
            searchableText.includes(filters.search);
    });

    if (filters.sort === "title") {
        list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (filters.sort === "hours") {
        list.sort((a, b) => a.hours - b.hours);
    }

    return list;
}

// Render course cards
function renderCourses() {
    const container = $("coursesContainer");

    if (!container) {
        console.error("Missing element: #coursesContainer");
        return;
    }

    const list = getFilteredCourses();

    container.innerHTML = list.map(course => {
        const isBookmarked = bookmarkedCourses.has(course.id);

        return `
            <article class="course-card">
                <div class="course-art ${escapeHTML(course.theme || "art-tech")}">
                    <span class="art-tag">
                        ${escapeHTML(course.category)}
                    </span>

                    <button
                        class="bookmark ${isBookmarked ? "saved" : ""}"
                        type="button"
                        data-bookmark="${escapeHTML(course.id)}"
                        aria-label="${isBookmarked ? "Remove bookmark" : "Bookmark"} ${escapeHTML(course.title)}"
                        aria-pressed="${isBookmarked}"
                        title="Bookmark course"
                    >
                        <i class="fa-${isBookmarked ? "solid" : "regular"} fa-bookmark"></i>
                    </button>

                    <i class="fa-solid ${escapeHTML(course.icon || "fa-book-open")}"></i>
                </div>

                <div class="course-content">
                    <div class="course-meta">
                        <span class="category-label">
                            ${escapeHTML(course.category.toUpperCase())}
                        </span>
                        <span class="level-label">
                            ${escapeHTML(course.level)}
                        </span>
                    </div>

                    <h3>${escapeHTML(course.title)}</h3>

                    <p class="course-description">
                        ${escapeHTML(course.description)}
                    </p>

                    <div class="instructor">
                        <span class="instructor-avatar">
                            ${escapeHTML(initials(course.instructor))}
                        </span>

                        <div>
                            <small>Course instructor</small>
                            <strong>${escapeHTML(course.instructor)}</strong>
                        </div>

                        <i class="fa-solid fa-circle-check"
                           title="Instructor assigned"></i>
                    </div>

                    <div class="course-bottom">
                        <span class="duration">
                            <i class="fa-regular fa-clock"></i>
                            ${Number(course.hours) || 0} learning hours
                        </span>

                        <button
                            class="details-btn"
                            type="button"
                            data-details="${escapeHTML(course.id)}"
                        >
                            View details
                            <i class="fa-solid fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join("");

    if ($("noResults")) {
        $("noResults").hidden = list.length !== 0;
    }

    if ($("resultsCount")) {
        $("resultsCount").textContent =
            `Showing ${list.length} of ${courses.length} courses`;
    }

    document.querySelectorAll(".chip[data-category]").forEach(chip => {
        chip.classList.toggle(
            "active",
            chip.dataset.category === currentFilters().category
        );
    });
}

// Apply a category filter
function applyCategory(category) {
    if ($("categoryFilter")) {
        const optionExists = [...$("categoryFilter").options]
            .some(option => option.value === category);

        $("categoryFilter").value = optionExists ? category : "All";
    }

    renderCourses();
}

// Open course details
function openCourse(id) {
    const course = courses.find(
        item => String(item.id) === String(id)
    );

    if (!course) {
        showToast("Course could not be found.");
        return;
    }

    selectedCourseId = course.id;

    $("modalCategory").textContent =
        `${course.category.toUpperCase()} · COURSE DETAILS`;

    $("modalTitle").textContent = course.title;
    $("modalDescription").textContent = course.description;
    $("modalHours").textContent = course.hours;
    $("modalLevel").textContent = course.level;
    $("modalInstructor").textContent = course.instructor;

    const modalArt = $("modalArt");

    if (modalArt) {
        modalArt.className =
            `modal-art ${course.theme || "art-tech"}`;

        modalArt.innerHTML = `
            <i class="fa-solid ${escapeHTML(course.icon || "fa-book-open")}"></i>
        `;
    }

    const outcomes = $("modalOutcomes");

    if (outcomes) {
        outcomes.innerHTML = course.outcomes.map(item =>
            `<li>${escapeHTML(item)}</li>`
        ).join("");
    }

    const modal = $("courseModal");

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
    const modal = $("courseModal");

    modal?.classList.remove("open");
    modal?.setAttribute("aria-hidden", "true");
    selectedCourseId = null;
}

// Add-course modal
function openAddModal() {
    const modal = $("addModal");

    modal?.classList.add("open");
    modal?.setAttribute("aria-hidden", "false");
}

function closeAddModal() {
    const modal = $("addModal");

    modal?.classList.remove("open");
    modal?.setAttribute("aria-hidden", "true");
}

// Add a new course in memory
function addCourse(event) {
    event.preventDefault();

    const form = $("addCourseForm");

    if (!form || !form.checkValidity()) {
        form?.reportValidity();
        return;
    }

    const title = $("newTitle").value.trim();
    const instructor = $("newInstructor").value.trim();
    const category = $("newCategory").value;
    const level = $("newLevel").value;
    const hours = Number($("newHours").value);
    const description = $("newDescription").value.trim();

    if (
        !title || !instructor || !category ||
        !level || !description ||
        !Number.isFinite(hours) || hours < 1 || hours > 500
    ) {
        showToast("Please enter valid information in every field.");
        return;
    }

    const themes = {
        Technology: ["art-tech", "fa-laptop-code"],
        Business: ["art-business", "fa-briefcase"],
        Design: ["art-design", "fa-pen-ruler"],
        Science: ["art-science", "fa-flask"],
        Languages: ["art-language", "fa-language"],
        Mathematics: ["art-math", "fa-square-root-variable"]
    };

    const [theme, icon] = themes[category] || [
        "art-tech",
        "fa-book-open"
    ];

    const newCourse = {
        id: Date.now(),
        title,
        instructor,
        category,
        level,
        hours,
        description,
        theme,
        icon,
        active: true,
        outcomes: [
            `Understand the main concepts covered in ${title}.`,
            "Practise skills through guided activities.",
            "Apply your learning to practical tasks."
        ]
    };

    courses.unshift(newCourse);

    // Clear filters to make the new course visible
    if ($("searchInput")) $("searchInput").value = "";
    if ($("categoryFilter")) $("categoryFilter").value = "All";
    if ($("levelFilter")) $("levelFilter").value = "All";
    if ($("sortFilter")) $("sortFilter").value = "featured";

    renderMetrics();
    renderCourses();

    form.reset();
    closeAddModal();

    showToast("Course added successfully for this session.");
}

// Reset all filters
function resetFilters() {
    if ($("searchInput")) $("searchInput").value = "";
    if ($("categoryFilter")) $("categoryFilter").value = "All";
    if ($("levelFilter")) $("levelFilter").value = "All";
    if ($("sortFilter")) $("sortFilter").value = "featured";

    renderCourses();
}

// Mobile sidebar
function toggleSidebar() {
    $("sidebar")?.classList.toggle("open");
    $("overlay")?.classList.toggle("open");
}

function closeSidebar() {
    $("sidebar")?.classList.remove("open");
    $("overlay")?.classList.remove("open");
}

// Page initialisation
document.addEventListener("DOMContentLoaded", () => {
    if ($("year")) {
        $("year").textContent = new Date().getFullYear();
    }

    loadCourses();
    renderMetrics();
    renderCourses();

    $("menuBtn")?.addEventListener("click", toggleSidebar);
    $("overlay")?.addEventListener("click", closeSidebar);

    $("sidebar")?.querySelectorAll("nav a").forEach(link => {
        link.addEventListener("click", closeSidebar);
    });

    $("searchInput")?.addEventListener("input", renderCourses);
    $("categoryFilter")?.addEventListener("change", renderCourses);
    $("levelFilter")?.addEventListener("change", renderCourses);
    $("sortFilter")?.addEventListener("change", renderCourses);

    $("filterChips")?.addEventListener("click", event => {
        const chip = event.target.closest(".chip[data-category]");

        if (chip) {
            applyCategory(chip.dataset.category);
        }
    });

    $("coursesContainer")?.addEventListener("click", event => {
        const detailsButton = event.target.closest("[data-details]");

        if (detailsButton) {
            openCourse(detailsButton.dataset.details);
            return;
        }

        const bookmark = event.target.closest("[data-bookmark]");

        if (bookmark) {
            const id = Number(bookmark.dataset.bookmark);

            if (bookmarkedCourses.has(id)) {
                bookmarkedCourses.delete(id);
                showToast("Bookmark removed.");
            } else {
                bookmarkedCourses.add(id);
                showToast("Course bookmarked for this session.");
            }

            renderCourses();
        }
    });

    $("clearFilters")?.addEventListener("click", resetFilters);
    $("addCourseBtn")?.addEventListener("click", openAddModal);

    $("closeModal")?.addEventListener("click", closeModal);
    $("modalCloseBottom")?.addEventListener("click", closeModal);
    $("closeAddModal")?.addEventListener("click", closeAddModal);

    $("courseModal")?.addEventListener("click", event => {
        if (event.target === $("courseModal")) {
            closeModal();
        }
    });

    $("addModal")?.addEventListener("click", event => {
        if (event.target === $("addModal")) {
            closeAddModal();
        }
    });

    $("addCourseForm")?.addEventListener("submit", addCourse);

    $("enrollBtn")?.addEventListener("click", () => {
        const course = courses.find(
            item => item.id === selectedCourseId
        );

        if (course) {
            showToast(
                `Demo only: connect student records to enroll in ${course.title}.`
            );
        }

        closeModal();
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeModal();
            closeAddModal();
            closeSidebar();
        }
    });
});
