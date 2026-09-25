
document.addEventListener("DOMContentLoaded", () => {

    // ========================================
    // ELEMENTS
    // ========================================

    const searchInput =
        document.getElementById("assignmentSearch");

    const filterSelect =
        document.getElementById("assignmentFilter");

    const tableBody =
        document.getElementById("assignmentsTable");

    const createButton =
        document.querySelector(".create-assignment-btn");

    const menuToggle =
        document.querySelector(".menu-toggle");

    const sidebar =
        document.querySelector(".sidebar");


    // ========================================
    // CREATE MODAL
    // ========================================

    const createModal =
        document.getElementById("assignmentModal");

    const closeCreateModal =
        document.getElementById("closeModal");

    const cancelCreateModal =
        document.getElementById("cancelModal");

    const createForm =
        document.getElementById("assignmentForm");


    // ========================================
    // EDIT MODAL
    // ========================================

    const editModal =
        document.getElementById("editAssignmentModal");

    const closeEditModal =
        document.getElementById("closeEditModal");

    const cancelEditModal =
        document.getElementById("cancelEditModal");

    const editForm =
        document.getElementById("editAssignmentForm");


    let editingRow = null;


    // ========================================
    // MOBILE SIDEBAR
    // ========================================

    if (menuToggle && sidebar) {

        menuToggle.addEventListener("click", () => {

            sidebar.classList.toggle("show");

        });

    }


    // ========================================
    // SEARCH + FILTER
    // ========================================

    function filterAssignments() {

        const searchValue =
            searchInput.value.trim().toLowerCase();

        const selectedCourse =
            filterSelect.value;

        const rows =
            tableBody.querySelectorAll("tr");


        rows.forEach(row => {

            const assignmentName =
                row.querySelector(
                    ".assignment-name strong"
                )?.textContent
                .toLowerCase() || "";


            const course =
                row.querySelector(
                    "td:nth-child(2)"
                )?.textContent
                .trim()
                .toLowerCase() || "";


            const matchesSearch =
                assignmentName.includes(searchValue);


            let matchesCourse = true;


            if (selectedCourse !== "all") {

                const courseMap = {

                    "web-development":
                        "web development",

                    "python":
                        "python",

                    "ui-ux":
                        "ui/ux design"

                };


                matchesCourse =
                    course === courseMap[selectedCourse];

            }


            row.style.display =
                matchesSearch && matchesCourse
                    ? ""
                    : "none";

        });

    }


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            filterAssignments
        );

    }


    if (filterSelect) {

        filterSelect.addEventListener(
            "change",
            filterAssignments
        );

    }


    // ========================================
    // VIEW BUTTONS
    // ========================================

    function setupViewButtons() {

        document
            .querySelectorAll(".view-btn")
            .forEach(button => {

                button.addEventListener("click", () => {

                    const row =
                        button.closest("tr");


                    const name =
                        row.querySelector(
                            ".assignment-name strong"
                        ).textContent.trim();


                    const course =
                        row.querySelector(
                            "td:nth-child(2)"
                        ).textContent.trim();


                    const dueDate =
                        row.querySelector(
                            "td:nth-child(3)"
                        ).textContent.trim();


                    alert(
                        `Assignment: ${name}\n\n` +
                        `Course: ${course}\n` +
                        `Due Date: ${dueDate}`
                    );

                });

            });

    }


    setupViewButtons();


    // ========================================
    // CREATE MODAL
    // ========================================

    function openCreateModal() {

        if (createModal) {

            createModal.classList.add("show");

        }

    }


    function closeCreateModalFunction() {

        if (createModal) {

            createModal.classList.remove("show");

        }

    }


    if (createButton) {

        createButton.addEventListener(
            "click",
            openCreateModal
        );

    }


    if (closeCreateModal) {

        closeCreateModal.addEventListener(
            "click",
            closeCreateModalFunction
        );

    }


    if (cancelCreateModal) {

        cancelCreateModal.addEventListener(
            "click",
            closeCreateModalFunction
        );

    }


    // ========================================
    // CREATE ASSIGNMENT
    // ========================================

    if (createForm) {

        createForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const title =
                    document.getElementById(
                        "assignmentTitle"
                    ).value.trim();


                const course =
                    document.getElementById(
                        "assignmentCourse"
                    ).value;


                const description =
                    document.getElementById(
                        "assignmentDescription"
                    ).value.trim();


                const dueDate =
                    document.getElementById(
                        "assignmentDueDate"
                    ).value;


                const score =
                    document.getElementById(
                        "assignmentScore"
                    ).value;


                const newAssignment = {

                    title,
                    course,
                    description,
                    dueDate,
                    maximumScore: score

                };


                console.log(
                    "New Assignment:",
                    newAssignment
                );


                alert(
                    "Assignment created successfully!"
                );


                createForm.reset();

                closeCreateModalFunction();

            }
        );

    }


    // ========================================
    // EDIT ASSIGNMENT
    // ========================================

    function openEditModal(row) {

        editingRow = row;


        const title =
            row.querySelector(
                ".assignment-name strong"
            ).textContent.trim();


        const course =
            row.querySelector(
                "td:nth-child(2)"
            ).textContent.trim();


        const dueDate =
            row.querySelector(
                "td:nth-child(3)"
            ).textContent.trim();


        document.getElementById(
            "editAssignmentTitle"
        ).value = title;


        const courseSelect =
            document.getElementById(
                "editAssignmentCourse"
            );


        const courseMap = {

            "Web Development":
                "web-development",

            "Python":
                "python",

            "UI/UX Design":
                "ui-ux"

        };


        courseSelect.value =
            courseMap[course] || "";


        document.getElementById(
            "editAssignmentDescription"
        ).value =
            "Update the assignment description.";


        document.getElementById(
            "editAssignmentScore"
        ).value = 100;


        // Convert date
        // 25 Sept 2026 -> 2026-09-25

        const date =
            new Date(dueDate);


        if (!isNaN(date.getTime())) {

            const year =
                date.getFullYear();


            const month =
                String(
                    date.getMonth() + 1
                ).padStart(2, "0");


            const day =
                String(
                    date.getDate()
                ).padStart(2, "0");


            document.getElementById(
                "editAssignmentDueDate"
            ).value =
                `${year}-${month}-${day}`;

        }


        editModal.classList.add("show");

    }


    function setupEditButtons() {

        document
            .querySelectorAll(".edit-btn")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const row =
                            button.closest("tr");

                        openEditModal(row);

                    }
                );

            });

    }


    setupEditButtons();


    // ========================================
    // CLOSE EDIT MODAL
    // ========================================

    function closeEditModalFunction() {

        if (editModal) {

            editModal.classList.remove("show");

        }

        editingRow = null;

    }


    if (closeEditModal) {

        closeEditModal.addEventListener(
            "click",
            closeEditModalFunction
        );

    }


    if (cancelEditModal) {

        cancelEditModal.addEventListener(
            "click",
            closeEditModalFunction
        );

    }


    // ========================================
    // SAVE EDITED ASSIGNMENT
    // ========================================

    if (editForm) {

        editForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                if (!editingRow) {

                    return;

                }


                const newTitle =
                    document.getElementById(
                        "editAssignmentTitle"
                    ).value.trim();


                const newCourse =
                    document.getElementById(
                        "editAssignmentCourse"
                    ).value;


                const newDueDate =
                    document.getElementById(
                        "editAssignmentDueDate"
                    ).value;


                const courseMap = {

                    "web-development":
                        "Web Development",

                    "python":
                        "Python",

                    "ui-ux":
                        "UI/UX Design"

                };


                // Update title

                editingRow.querySelector(
                    ".assignment-name strong"
                ).textContent = newTitle;


                // Update course

                editingRow.querySelector(
                    "td:nth-child(2)"
                ).textContent =
                    courseMap[newCourse];


                // Update date

                if (newDueDate) {

                    const date =
                        new Date(
                            newDueDate + "T00:00:00"
                        );


                    const formattedDate =
                        date.toLocaleDateString(
                            "en-GB",
                            {
                                day: "2-digit",
                                month: "short",
                                year: "numeric"
                            }
                        );


                    editingRow.querySelector(
                        "td:nth-child(3)"
                    ).textContent =
                        formattedDate;

                }


                console.log(
                    "Assignment updated:",
                    {
                        title: newTitle,
                        course: newCourse,
                        dueDate: newDueDate
                    }
                );


                alert(
                    "Assignment updated successfully!"
                );


                closeEditModalFunction();

            }
        );

    }


    // ========================================
    // CLOSE MODALS WHEN CLICKING OUTSIDE
    // ========================================

    if (createModal) {

        createModal.addEventListener(
            "click",
            event => {

                if (
                    event.target === createModal
                ) {

                    closeCreateModalFunction();

                }

            }
        );

    }


    if (editModal) {

        editModal.addEventListener(
            "click",
            event => {

                if (
                    event.target === editModal
                ) {

                    closeEditModalFunction();

                }

            }
        );

    }


    // ========================================
    // DELETE ASSIGNMENT
    // ========================================

    document
        .querySelectorAll(".delete-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const row =
                        button.closest("tr");


                    const assignmentName =
                        row.querySelector(
                            ".assignment-name strong"
                        ).textContent.trim();


                    const confirmDelete =
                        confirm(
                            `Are you sure you want to delete "${assignmentName}"?`
                        );


                    if (confirmDelete) {

                        row.remove();


                        alert(
                            "Assignment deleted successfully!"
                        );

                    }

                }
            );

        });

});


