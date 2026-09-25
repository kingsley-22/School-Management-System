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


    // ========================================
    // 2. COURSE SEARCH
    // ========================================

    const courseSearch = document.getElementById("courseSearch");
    const courseCards = document.querySelectorAll(".course-card");

    if (courseSearch) {
        courseSearch.addEventListener("input", () => {

            const searchValue = courseSearch.value.toLowerCase().trim();

            courseCards.forEach(card => {

                const title = card.querySelector("h3")?.textContent.toLowerCase() || "";
                const description = card.querySelector("p")?.textContent.toLowerCase() || "";

                if (
                    title.includes(searchValue) ||
                    description.includes(searchValue)
                ) {
                    card.style.display = "";
                } else {
                    card.style.display = "none";
                }

            });

        });
    }


    // ========================================
    // 3. COURSE FILTER
    // ========================================

    const courseFilter = document.getElementById("courseFilter");

    if (courseFilter) {
        courseFilter.addEventListener("change", () => {

            const selectedFilter = courseFilter.value;

            courseCards.forEach(card => {

                const statusElement = card.querySelector(".status");

                if (!statusElement) return;

                const status = statusElement.textContent
                    .toLowerCase()
                    .trim();

                if (
                    selectedFilter === "all" ||
                    status === selectedFilter
                ) {
                    card.style.display = "";
                } else {
                    card.style.display = "none";
                }

            });

        });
    }


    // ========================================
    // 4. VIEW COURSE
    // ========================================

    const viewButtons = document.querySelectorAll(".view-course");

    viewButtons.forEach(button => {

        button.addEventListener("click", () => {

            const courseCard = button.closest(".course-card");

            const courseTitle =
                courseCard.querySelector("h3").textContent;

            alert(
                `Opening ${courseTitle}...\n\n` +
                `Course details will be connected to the backend later.`
            );

        });

    });


    // ========================================
    // 5. EDIT COURSE
    // ========================================

    const editButtons = document.querySelectorAll(".edit-course");

    editButtons.forEach(button => {

        button.addEventListener("click", () => {

            const courseCard = button.closest(".course-card");

            const titleElement = courseCard.querySelector("h3");
            const descriptionElement = courseCard.querySelector("p");

            const currentTitle = titleElement.textContent;
            const currentDescription = descriptionElement.textContent;

            const newTitle = prompt(
                "Edit course title:",
                currentTitle
            );

            if (newTitle === null || newTitle.trim() === "") {
                return;
            }

            const newDescription = prompt(
                "Edit course description:",
                currentDescription
            );

            if (newDescription === null || newDescription.trim() === "") {
                return;
            }

            titleElement.textContent = newTitle.trim();
            descriptionElement.textContent = newDescription.trim();

            alert("Course updated successfully!");

        });

    });


    // ========================================
    // 6. CREATE COURSE
    // ========================================

    const createCourseButton =
        document.querySelector(".create-course-btn");

    const coursesGrid =
        document.getElementById("coursesGrid");

    if (createCourseButton && coursesGrid) {

        createCourseButton.addEventListener("click", () => {

            const courseTitle = prompt("Enter course title:");

            if (!courseTitle || courseTitle.trim() === "") {
                return;
            }

            const courseDescription =
                prompt("Enter course description:");

            if (!courseDescription || courseDescription.trim() === "") {
                return;
            }

            const newCourse = document.createElement("div");

            newCourse.classList.add("course-card");

            newCourse.innerHTML = `
                <div class="course-image web">
                    <i class="fa-solid fa-book"></i>
                </div>

                <div class="course-card-content">

                    <div class="course-status">
                        <span class="status draft-status">
                            Draft
                        </span>

                        <button class="course-menu">
                            <i class="fa-solid fa-ellipsis"></i>
                        </button>
                    </div>

                    <h3>${courseTitle}</h3>

                    <p>${courseDescription}</p>

                    <div class="course-meta">

                        <span>
                            <i class="fa-solid fa-users"></i>
                            0 Students
                        </span>

                        <span>
                            <i class="fa-solid fa-book-open"></i>
                            0 Lessons
                        </span>

                    </div>

                    <div class="course-progress-info">

                        <div>
                            <span>Course Progress</span>
                            <strong>0%</strong>
                        </div>

                        <div class="progress">
                            <div
                                class="progress-bar"
                                style="width: 0%;">
                            </div>
                        </div>

                    </div>

                    <div class="course-actions">

                        <button class="view-course">
                            View Course
                        </button>

                        <button class="edit-course">
                            <i class="fa-solid fa-pen"></i>
                            Edit
                        </button>

                    </div>

                </div>
            `;

            coursesGrid.appendChild(newCourse);

            setupCourseButtons(newCourse);

            alert("Course created successfully!");

        });

    }


    // ========================================
    // 7. COURSE BUTTONS FOR NEW COURSES
    // ========================================

    function setupCourseButtons(card) {

        const viewButton = card.querySelector(".view-course");
        const editButton = card.querySelector(".edit-course");

        // VIEW
        if (viewButton) {

            viewButton.addEventListener("click", () => {

                const courseTitle =
                    card.querySelector("h3").textContent;

                alert(
                    `Opening ${courseTitle}...\n\n` +
                    `Course details will be connected to the backend later.`
                );

            });

        }


        // EDIT
        if (editButton) {

            editButton.addEventListener("click", () => {

                const titleElement = card.querySelector("h3");
                const descriptionElement = card.querySelector("p");

                const newTitle = prompt(
                    "Edit course title:",
                    titleElement.textContent
                );

                if (!newTitle || newTitle.trim() === "") {
                    return;
                }

                const newDescription = prompt(
                    "Edit course description:",
                    descriptionElement.textContent
                );

                if (!newDescription || newDescription.trim() === "") {
                    return;
                }

                titleElement.textContent = newTitle.trim();
                descriptionElement.textContent =
                    newDescription.trim();

                alert("Course updated successfully!");

            });

        }

    }


    // ========================================
    // 8. CLOSE SIDEBAR WHEN MENU ITEM IS CLICKED
    // ========================================

    const sidebarLinks =
        document.querySelectorAll(".sidebar .menu-item");

    sidebarLinks.forEach(link => {

        link.addEventListener("click", () => {

            if (window.innerWidth <= 768) {
                sidebar.classList.remove("show");
            }

        });

    });


    // ========================================
    // 9. FUTURE DJANGO API CONNECTION
    // ========================================

    /*
        Later, courses will come from Django:

        fetch("YOUR_API_ENDPOINT")
            .then(response => response.json())
            .then(data => {
                console.log(data);
            });

        We will do this when the backend API
        is ready.
    */

});