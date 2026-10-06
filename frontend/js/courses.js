// ========================================
// COURSES PAGE JAVASCRIPT
// ========================================

document.addEventListener("DOMContentLoaded", () => {

    // ========================================
    // 1. MOBILE SIDEBAR
    // ========================================
    const menuToggle = document.querySelector(".menu-toggle");
    const sidebar = document.querySelector(".sidebar");

    if (menuToggle && sidebar) {
        menuToggle.addEventListener("click", () => {
            sidebar.classList.toggle("show");
        });
    }

    const sidebarLinks = document.querySelectorAll(".sidebar .menu-item");
    sidebarLinks.forEach(link => {
        link.addEventListener("click", () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove("show");
            }
        });
    });


    // ========================================
    // 2. STORAGE HELPERS
    // ========================================
    const STORAGE_KEY = "createdCourses";

    function loadSavedCourses() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        } catch {
            return [];
        }
    }

    function persistSavedCourses(arr) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    }


    // ========================================
    // 3. BUILD A COURSE CARD
    // ========================================
    function buildCourseCard(title, description) {
        const card = document.createElement("div");
        card.classList.add("course-card");
        card.innerHTML = `
            <div class="course-image web">
                <i class="fa-solid fa-book"></i>
            </div>

            <div class="course-card-content">
                <div class="course-status">
                    <span class="status draft-status">Draft</span>
                    <button class="course-menu">
                        <i class="fa-solid fa-ellipsis"></i>
                    </button>
                </div>

                <h3>${title}</h3>
                <p>${description}</p>

                <div class="course-meta">
                    <span><i class="fa-solid fa-users"></i> 0 Students</span>
                    <span><i class="fa-solid fa-book-open"></i> 0 Lessons</span>
                </div>

                <div class="course-progress-info">
                    <div>
                        <span>Course Progress</span>
                        <strong>0%</strong>
                    </div>
                    <div class="progress">
                        <div class="progress-bar" style="width: 0%;"></div>
                    </div>
                </div>

                <div class="course-actions">
                    <button class="view-course">View Course</button>
                    <button class="edit-course">
                        <i class="fa-solid fa-pen"></i>
                        Edit
                    </button>
                </div>
            </div>
        `;
        return card;
    }


    // ========================================
    // 4. WIRE VIEW / EDIT BUTTONS ON A CARD
    // ========================================
    function setupCourseButtons(card) {
        const viewButton = card.querySelector(".view-course");
        const editButton = card.querySelector(".edit-course");

        if (viewButton) {
            viewButton.addEventListener("click", () => {
                const courseTitle = card.querySelector("h3").textContent.trim();
                alert(
                    `Opening ${courseTitle}...\n\n` +
                    `Course details will be connected to the backend later.`
                );
            });
        }

        if (editButton) {
            editButton.addEventListener("click", () => {
                const titleEl = card.querySelector("h3");
                const descEl = card.querySelector("p");

                const oldTitle = titleEl.textContent.trim();
                const oldDesc = descEl.textContent.trim();

                const newTitle = prompt("Edit course title:", oldTitle);
                if (newTitle === null || newTitle.trim() === "") return;

                const newDesc = prompt("Edit course description:", oldDesc);
                if (newDesc === null || newDesc.trim() === "") return;

                titleEl.textContent = newTitle.trim();
                descEl.textContent = newDesc.trim();

                // Persist the edit if this is a user-created course
                const saved = loadSavedCourses();
                const idx = saved.findIndex(c => c.title === oldTitle);
                if (idx !== -1) {
                    saved[idx].title = newTitle.trim();
                    saved[idx].description = newDesc.trim();
                    persistSavedCourses(saved);
                }

                alert("Course updated successfully!");
            });
        }
    }


    // ========================================
    // 5. SEARCH
    // ========================================
    const courseSearch = document.getElementById("courseSearch");

    if (courseSearch) {
        courseSearch.addEventListener("input", () => {
            const searchValue = courseSearch.value.toLowerCase().trim();
            const cards = document.querySelectorAll(".course-card");

            cards.forEach(card => {
                const title = card.querySelector("h3")?.textContent.toLowerCase() || "";
                const description = card.querySelector("p")?.textContent.toLowerCase() || "";

                const match =
                    title.includes(searchValue) ||
                    description.includes(searchValue);

                card.style.display = match ? "" : "none";
            });
        });
    }


    // ========================================
    // 6. FILTER
    // ========================================
    const courseFilter = document.getElementById("courseFilter");

    if (courseFilter) {
        courseFilter.addEventListener("change", () => {
            const selectedFilter = courseFilter.value;
            const cards = document.querySelectorAll(".course-card");

            cards.forEach(card => {
                const statusElement = card.querySelector(".status");
                if (!statusElement) return;

                const status = statusElement.textContent.toLowerCase().trim();

                const match =
                    selectedFilter === "all" || status === selectedFilter;

                card.style.display = match ? "" : "none";
            });
        });
    }


    // ========================================
    // 7. CREATE COURSE
    // ========================================
    const createCourseButton = document.querySelector(".create-course-btn");
    const coursesGrid = document.getElementById("coursesGrid");

    if (createCourseButton && coursesGrid) {
        createCourseButton.addEventListener("click", () => {

            const courseTitle = prompt("Enter course title:");
            if (!courseTitle || courseTitle.trim() === "") return;

            const courseDescription = prompt("Enter course description:");
            if (!courseDescription || courseDescription.trim() === "") return;

            // Save to storage
            const saved = loadSavedCourses();
            saved.push({
                title: courseTitle.trim(),
                description: courseDescription.trim()
            });
            persistSavedCourses(saved);
                        window.logActivity?.(
                "course",
                "New course created",
                `"${courseTitle.trim()}" was added to your courses`,
                "/instructor/courses/"
            );
                            window.logActivity?.(
                                "edit", "Course updated", `"${oldTitle}" renamed to "${newTitle.trim()}"`, "/instructor/courses/");

            // Add to DOM
            const newCourse = buildCourseCard(
                courseTitle.trim(),
                courseDescription.trim()
            );
            coursesGrid.appendChild(newCourse);
            setupCourseButtons(newCourse);

            alert("Course created successfully!");
        });
    }


    // ========================================
    // 8. WIRE UP EXISTING (HARDCODED) CARDS
    // ========================================
    document.querySelectorAll(".course-card").forEach(card => {
        setupCourseButtons(card);
    });


    // ========================================
    // 9. RESTORE USER-CREATED COURSES
    // ========================================
    const savedCourses = loadSavedCourses();

    if (coursesGrid && savedCourses.length) {
        savedCourses.forEach(item => {
            // Skip if a hardcoded card already has the same title
            const exists = Array.from(coursesGrid.querySelectorAll("h3"))
                .some(h => h.textContent.trim() === item.title);
            if (exists) return;

            const card = buildCourseCard(item.title, item.description);
            coursesGrid.appendChild(card);
            setupCourseButtons(card);
        });
    }


    // ========================================
    // 10. FUTURE DJANGO API
    // ========================================
    /*
        Later, courses will come from Django:

        fetch("/api/courses/")
            .then(response => response.json())
            .then(data => { ... });
    */

});