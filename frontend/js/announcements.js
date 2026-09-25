document.addEventListener("DOMContentLoaded", () => {

    // ========================================
    // ELEMENTS
    // ========================================

    const searchInput =
        document.getElementById("announcementSearch");

    const filterSelect =
        document.getElementById("announcementFilter");

    const announcementsGrid =
        document.getElementById("announcementsGrid");

    const createButton =
        document.querySelector(".create-announcement-btn");

    const menuToggle =
        document.querySelector(".menu-toggle");

    const sidebar =
        document.querySelector(".sidebar");


    // ========================================
    // MOBILE SIDEBAR
    // ========================================

// ========================================
// MOBILE SIDEBAR
// ========================================

if (menuToggle && sidebar) {

    // Open and close sidebar
    menuToggle.addEventListener("click", (event) => {
        event.stopPropagation();
        sidebar.classList.toggle("show");
    });

    // Close sidebar when clicking outside
    document.addEventListener("click", (event) => {
        if (
            sidebar.classList.contains("show") &&
            !sidebar.contains(event.target) &&
            !menuToggle.contains(event.target)
        ) {
            sidebar.classList.remove("show");
        }
    });

    // Close sidebar when clicking a menu link
    sidebar.querySelectorAll(".menu-item").forEach(link => {
        link.addEventListener("click", () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove("show");
            }
        });
    });

}

    // ========================================
    // SEARCH + FILTER
    // ========================================

    function filterAnnouncements() {

        const searchValue =
            searchInput.value.trim().toLowerCase();

        const selectedCategory =
            filterSelect.value;

        const cards =
            announcementsGrid.querySelectorAll(
                ".announcement-card"
            );


        cards.forEach(card => {

            const title =
                card.querySelector("h3")
                    ?.textContent
                    .toLowerCase() || "";


            const description =
                card.querySelector("p")
                    ?.textContent
                    .toLowerCase() || "";


            const category =
                card.dataset.category || "";


            const matchesSearch =
                title.includes(searchValue) ||
                description.includes(searchValue);


            const matchesCategory =
                selectedCategory === "all" ||
                category === selectedCategory;


            if (
                matchesSearch &&
                matchesCategory
            ) {

                card.style.display = "";

            } else {

                card.style.display = "none";

            }

        });

    }


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            filterAnnouncements
        );

    }


    if (filterSelect) {

        filterSelect.addEventListener(
            "change",
            filterAnnouncements
        );

    }


    // ========================================
    // VIEW ANNOUNCEMENT
    // ========================================

    function setupViewButtons() {

        document
            .querySelectorAll(".view-announcement-btn")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const card =
                            button.closest(
                                ".announcement-card"
                            );


                        const title =
                            card.querySelector("h3")
                                .textContent
                                .trim();


                        const description =
                            card.querySelector("p")
                                .textContent
                                .trim();


                        const category =
                            card.querySelector(
                                ".announcement-category"
                            )
                                .textContent
                                .trim();


                        const meta =
                            card.querySelectorAll(
                                ".announcement-meta span"
                            );


                        const date =
                            meta[0]
                                ?.textContent
                                .trim() || "";


                        const audience =
                            meta[1]
                                ?.textContent
                                .trim() || "";


                        alert(
                            `Announcement\n\n` +
                            `Title: ${title}\n\n` +
                            `Category: ${category}\n\n` +
                            `${description}\n\n` +
                            `${date}\n` +
                            `${audience}`
                        );

                    }
                );

            });

    }


    setupViewButtons();


    // ========================================
    // CREATE ANNOUNCEMENT
    // ========================================

    if (createButton) {

        createButton.addEventListener(
            "click",
            () => {

                const title =
                    prompt(
                        "Enter announcement title:"
                    );


                if (!title) {

                    return;

                }


                const description =
                    prompt(
                        "Enter announcement description:"
                    );


                if (!description) {

                    return;

                }


                const category =
                    prompt(
                        "Enter category:\n\n" +
                        "general\n" +
                        "course\n" +
                        "important"
                    );


                if (
                    !category ||
                    ![
                        "general",
                        "course",
                        "important"
                    ].includes(
                        category.toLowerCase()
                    )
                ) {

                    alert(
                        "Please enter a valid category."
                    );

                    return;

                }


                const normalizedCategory =
                    category.toLowerCase();


                const newCard =
                    document.createElement("div");


                newCard.className =
                    "announcement-card";


                newCard.dataset.category =
                    normalizedCategory;


                let iconClass =
                    "fa-bullhorn";


                if (
                    normalizedCategory ===
                    "important"
                ) {

                    iconClass =
                        "fa-triangle-exclamation";

                }


                if (
                    normalizedCategory ===
                    "course"
                ) {

                    iconClass =
                        "fa-book-open";

                }


                let categoryName =
                    "General";


                if (
                    normalizedCategory ===
                    "course"
                ) {

                    categoryName =
                        "Course Update";

                }


                if (
                    normalizedCategory ===
                    "important"
                ) {

                    categoryName =
                        "Important";

                }


                newCard.innerHTML = `

                    <div class="announcement-card-header">

                        <div class="announcement-icon">

                            <i class="fa-solid ${iconClass}"></i>

                        </div>

                        <span class="announcement-category">

                            ${categoryName}

                        </span>

                    </div>


                    <h3>
                        ${title}
                    </h3>


                    <p>
                        ${description}
                    </p>


                    <div class="announcement-meta">

                        <span>

                            <i class="fa-solid fa-calendar"></i>

                            Sept 24, 2026

                        </span>


                        <span>

                            <i class="fa-solid fa-users"></i>

                            All Students

                        </span>

                    </div>


                    <div class="announcement-buttons">

                        <button class="view-announcement-btn">
                            View
                        </button>

                        <button class="edit-announcement-btn">
                            Edit
                        </button>

                        <button class="delete-announcement-btn">
                            Delete
                        </button>

                    </div>

                `;


                announcementsGrid.prepend(
                    newCard
                );


                setupCardButtons(
                    newCard
                );


                alert(
                    "Announcement created successfully!"
                );

            }
        );

    }


    // ========================================
    // EDIT ANNOUNCEMENT
    // ========================================

    function editAnnouncement(card) {

        const titleElement =
            card.querySelector("h3");


        const descriptionElement =
            card.querySelector("p");


        const newTitle =
            prompt(
                "Edit announcement title:",
                titleElement.textContent.trim()
            );


        if (!newTitle) {

            return;

        }


        const newDescription =
            prompt(
                "Edit announcement description:",
                descriptionElement.textContent.trim()
            );


        if (!newDescription) {

            return;

        }


        titleElement.textContent =
            newTitle;


        descriptionElement.textContent =
            newDescription;


        alert(
            "Announcement updated successfully!"
        );

    }


    // ========================================
    // DELETE ANNOUNCEMENT
    // ========================================

    function deleteAnnouncement(card) {

        const title =
            card.querySelector("h3")
                .textContent
                .trim();


        const confirmDelete =
            confirm(
                `Are you sure you want to delete "${title}"?`
            );


        if (!confirmDelete) {

            return;

        }


        card.remove();


        alert(
            "Announcement deleted successfully!"
        );

    }


    // ========================================
    // CARD BUTTONS
    // ========================================

    function setupCardButtons(card) {

        const viewButton =
            card.querySelector(
                ".view-announcement-btn"
            );


        const editButton =
            card.querySelector(
                ".edit-announcement-btn"
            );


        const deleteButton =
            card.querySelector(
                ".delete-announcement-btn"
            );


        if (viewButton) {

            viewButton.addEventListener(
                "click",
                () => {

                    const title =
                        card.querySelector("h3")
                            .textContent
                            .trim();


                    const description =
                        card.querySelector("p")
                            .textContent
                            .trim();


                    const category =
                        card.querySelector(
                            ".announcement-category"
                        )
                            .textContent
                            .trim();


                    alert(
                        `Announcement\n\n` +
                        `Title: ${title}\n\n` +
                        `Category: ${category}\n\n` +
                        `${description}`
                    );

                }
            );

        }


        if (editButton) {

            editButton.addEventListener(
                "click",
                () => {

                    editAnnouncement(card);

                }
            );

        }


        if (deleteButton) {

            deleteButton.addEventListener(
                "click",
                () => {

                    deleteAnnouncement(card);

                }
            );

        }

    }


    // ========================================
    // SETUP EXISTING CARDS
    // ========================================

    document
        .querySelectorAll(".announcement-card")
        .forEach(card => {

            setupCardButtons(card);

        });


    // ========================================
    // CLOSE MOBILE SIDEBAR
    // ========================================

    document
        .querySelectorAll(".sidebar .menu-item")
        .forEach(link => {

            link.addEventListener(
                "click",
                () => {

                    if (
                        window.innerWidth <= 768
                    ) {

                        sidebar.classList.remove(
                            "show"
                        );

                    }

                }
            );

        });


    // ========================================
    // API READY
    // ========================================
    //
    // Later, when the Django backend is ready,
    // we can replace the temporary prompt/alert
    // functionality with fetch() requests.
    //
    // Example:
    //
    // fetch("/api/announcements/")
    //
    // POST    -> Create
    // GET     -> Read
    // PATCH   -> Edit
    // DELETE  -> Delete
    //
    // ========================================

});