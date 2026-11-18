// ========================================
// COURSES PAGE JAVASCRIPT
// ========================================

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // STORAGE
    // ==========================================
    const CREATED_KEY = "createdCourses";
    const DELETED_KEY = "deletedCourses";

    function loadCreated() {
        try { return JSON.parse(localStorage.getItem(CREATED_KEY) || "[]"); }
        catch { return []; }
    }
    function saveCreated(arr) {
        localStorage.setItem(CREATED_KEY, JSON.stringify(arr));
    }
    function loadDeleted() {
        try { return JSON.parse(localStorage.getItem(DELETED_KEY) || "[]"); }
        catch { return []; }
    }
    function saveDeleted(arr) {
        localStorage.setItem(DELETED_KEY, JSON.stringify(arr));
    }


    // ==========================================
    // DOM REFERENCES (all at top, no TDZ issues)
    // ==========================================
    const coursesGrid      = document.getElementById("coursesGrid");
    const courseSearch     = document.getElementById("courseSearch");
    const courseFilter     = document.getElementById("courseFilter");
    const createCourseBtn  = document.querySelector(".create-course-btn");

    const createModal      = document.getElementById("createCourseModal");
    const closeModalBtn    = document.getElementById("closeCourseModal");
    const cancelModalBtn   = document.getElementById("cancelCourseModal");
    const createForm       = document.getElementById("createCourseForm");

    const deleteModal      = document.getElementById("deleteCourseModal");
    const deleteNameEl     = document.getElementById("deleteCourseName");
    const cancelDeleteBtn  = document.getElementById("cancelDeleteCourse");
    const confirmDeleteBtn = document.getElementById("confirmDeleteCourse");

    let pendingCard = null;


        // ==========================================
    // SUCCESS TOAST (bottom)
    // ==========================================
    function showSuccessToast(title, message, duration = 6000) {
        const container = document.getElementById("successToastContainer");
        if (!container) {
            alert(`${title}\n\n${message}`);
            return;
        }

        const toast = document.createElement("div");
        toast.className = "success-toast";
        toast.innerHTML = `
            <div class="success-toast-icon">
                <i class="fa-solid fa-check"></i>
            </div>
            <div class="success-toast-body">
                <h4>${title}</h4>
                <p>${message}</p>
            </div>
            <button class="success-toast-close" type="button" aria-label="Close">
                <i class="fa-solid fa-xmark"></i>
            </button>
            <div class="success-toast-progress" style="animation-duration: ${duration}ms;"></div>
        `;

        container.appendChild(toast);

        // Trigger slide-up animation on the next frame
        requestAnimationFrame(() => {
            requestAnimationFrame(() => toast.classList.add("show"));
        });

        const dismiss = () => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 500);
        };

        const timer = setTimeout(dismiss, duration);

        toast.querySelector(".success-toast-close").addEventListener("click", () => {
            clearTimeout(timer);
            dismiss();
        });
    }


    // ==========================================
    // DELETE FLOW
    // ==========================================
    function openDeleteModal(card) {
        if (!deleteModal) {
            console.error("[Delete] #deleteCourseModal missing from HTML");
            return;
        }

        const title = card.querySelector("h3")?.textContent.trim() || "this course";

        if (deleteNameEl) deleteNameEl.textContent = title;

        pendingCard = card;
        deleteModal.classList.add("show");
    }

    function closeDeleteModal() {
        if (deleteModal) deleteModal.classList.remove("show");
        pendingCard = null;
    }

    function performDelete() {
        if (!pendingCard) return;

        const card = pendingCard;
        const title = card.querySelector("h3")?.textContent.trim();
        if (!title) { closeDeleteModal(); return; }

        // 1. Remove from createdCourses (if it was user-created)
        const created = loadCreated();
        const remaining = created.filter(c => c.title !== title);
        if (remaining.length !== created.length) {
            saveCreated(remaining);
        }

        // 2. Mark as deleted (works for hardcoded + created)
        const deleted = loadDeleted();
        if (!deleted.includes(title)) {
            deleted.push(title);
            saveDeleted(deleted);
        }

        // 3. Fade out and remove from the page
        card.style.transition = "opacity 0.3s ease, transform 0.3s ease";
        card.style.opacity = "0";
        card.style.transform = "scale(0.85)";
        setTimeout(() => card.remove(), 300);

        // 4. Log activity
        if (window.logActivity) {
            window.logActivity(
                "delete",
                "Course deleted",
                `"${title}" was permanently removed`,
                "/instructor/courses/"
            );
        }

        closeDeleteModal();
    }

    if (cancelDeleteBtn)  cancelDeleteBtn.addEventListener("click", closeDeleteModal);
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener("click", performDelete);

    if (deleteModal) {
        deleteModal.addEventListener("click", (e) => {
            if (e.target === deleteModal) closeDeleteModal();
        });
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && deleteModal?.classList.contains("show")) {
            closeDeleteModal();
        }
    });


    // ==========================================
    // WIRE DELETE BUTTON ON A CARD
    // ==========================================
    function wireDeleteButton(card) {
        const actions = card.querySelector(".course-actions");
        if (!actions) return;

        // Ensure a delete button exists
        let btn = actions.querySelector(".delete-course");

        // Remove any old listeners by replacing the node
        if (btn) {
            const clone = btn.cloneNode(true);
            btn.replaceWith(clone);
            btn = clone;
        } else {
            btn = document.createElement("button");
            btn.type = "button";
            btn.className = "delete-course";
            btn.title = "Delete course";
            btn.innerHTML = '<i class="fa-solid fa-trash"></i>';
            actions.appendChild(btn);
        }

        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            openDeleteModal(card);
        });
    }


    // ==========================================
    // BUILD CARD (for user-created courses)
    // ==========================================
    function buildCard(item) {
        const card = document.createElement("div");
        card.className = "course-card";
        card.innerHTML = `
            <div class="course-image web">
                <i class="fa-solid fa-book"></i>
            </div>
            <div class="course-card-content">
                <div class="course-status">
                    <span class="status ${item.status === "Active" ? "active-status" : "draft-status"}">${item.status || "Draft"}</span>
                    <button class="course-menu"><i class="fa-solid fa-ellipsis"></i></button>
                </div>
                <h3>${item.title}</h3>
                <p>${item.description}</p>
                <div class="course-meta">
                    <span><i class="fa-solid fa-users"></i> 0 Students</span>
                    <span><i class="fa-solid fa-book-open"></i> ${item.lessons || 0} Lessons</span>
                </div>
                <div class="course-progress-info">
                    <div><span>Course Progress</span><strong>0%</strong></div>
                    <div class="progress">
                        <div class="progress-bar" style="width: 0%;"></div>
                    </div>
                </div>
                <div class="course-actions">
                    <button class="view-course">View Course</button>
                    <button class="edit-course"><i class="fa-solid fa-pen"></i> Edit</button>
                    <button class="delete-course" title="Delete course"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;
        return card;
    }


    // ==========================================
    // BOOT
    // ==========================================

    // 1. Remove previously-deleted cards
    const hidden = loadDeleted();
    document.querySelectorAll(".course-card").forEach(card => {
        const title = card.querySelector("h3")?.textContent.trim();
        if (title && hidden.includes(title)) {
            card.remove();
            return;
        }
        wireDeleteButton(card);
    });

    // 2. Restore created courses (skipping any that were deleted)
    if (coursesGrid) {
        loadCreated().forEach(item => {
            if (hidden.includes(item.title)) return;

            const exists = Array.from(coursesGrid.querySelectorAll(".course-card h3"))
                .some(h => h.textContent.trim() === item.title);
            if (exists) return;

            const card = buildCard(item);
            coursesGrid.appendChild(card);
            wireDeleteButton(card);
        });
    }


    // ==========================================
    // SEARCH + FILTER
    // ==========================================
    if (courseSearch) {
        courseSearch.addEventListener("input", () => {
            const s = courseSearch.value.toLowerCase().trim();
            document.querySelectorAll(".course-card").forEach(card => {
                const t = card.querySelector("h3")?.textContent.toLowerCase() || "";
                const d = card.querySelector("p")?.textContent.toLowerCase() || "";
                card.style.display = (t.includes(s) || d.includes(s)) ? "" : "none";
            });
        });
    }

    if (courseFilter) {
        courseFilter.addEventListener("change", () => {
            const f = courseFilter.value;
            document.querySelectorAll(".course-card").forEach(card => {
                const st = card.querySelector(".status")?.textContent.toLowerCase().trim() || "";
                card.style.display = (f === "all" || st === f) ? "" : "none";
            });
        });
    }


    // ==========================================
    // CREATE FLOW
    // ==========================================
    function openCreateModal() {
        if (!createModal) return;
        if (createForm) createForm.reset();
        createModal.classList.add("show");
    }
    function closeCreateModal() {
        if (createModal) createModal.classList.remove("show");
    }

    if (createCourseBtn) createCourseBtn.addEventListener("click", openCreateModal);
    if (closeModalBtn)   closeModalBtn.addEventListener("click", closeCreateModal);
    if (cancelModalBtn)  cancelModalBtn.addEventListener("click", closeCreateModal);

    if (createModal) {
        createModal.addEventListener("click", (e) => {
            if (e.target === createModal) closeCreateModal();
        });
    }

    if (createForm) {
        createForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const title = document.getElementById("courseTitleInput").value.trim();
            const description = document.getElementById("courseDescriptionInput").value.trim();
            const category = document.getElementById("courseCategoryInput").value;
            const status = document.getElementById("courseStatusInput").value;
            const lessons = parseInt(document.getElementById("courseLessonsInput").value, 10) || 0;

            if (!title || !description) {
                alert("Please fill in the title and description.");
                return;
            }

            const record = { title, description, category, status, lessons };

            // Save
            const created = loadCreated();
            created.push(record);
            saveCreated(created);

            // If this title was previously deleted, un-mark it
            const deleted = loadDeleted();
            const filtered = deleted.filter(t => t !== title);
            if (filtered.length !== deleted.length) {
                saveDeleted(filtered);
            }

            // Add card
            const card = buildCard(record);
            if (coursesGrid) coursesGrid.appendChild(card);
            wireDeleteButton(card);

            // Log
            if (window.logActivity) {
                window.logActivity(
                    "course",
                    "New course created",
                    `"${title}" (${lessons} lessons)`,
                    "/instructor/courses/"
                );
            }

            closeCreateModal();
            showSuccessToast( "Course Created Successfully!",
                `"${title}" has been added to your course list.`,
                6000);
        });
    }

});