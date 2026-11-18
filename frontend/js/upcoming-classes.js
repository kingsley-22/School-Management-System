// ========================================
// UPCOMING CLASSES
// ========================================

(function () {

    const STORAGE_KEY = "upcomingClasses";
    const MAX_VISIBLE = 6;

    function loadClasses() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
        catch { return []; }
    }
    function saveClasses(arr) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    }

    function getAllCourses() {
        const hardcoded = [
            "Web Development",
            "Python Programming",
            "Database Systems",
            "JavaScript Fundamentals",
            "Backend Development",
            "Cybersecurity Basics"
        ];

        let deleted = [];
        let created = [];
        try { deleted = JSON.parse(localStorage.getItem("deletedCourses") || "[]"); } catch (e) {}
        try { created = JSON.parse(localStorage.getItem("createdCourses") || "[]"); } catch (e) {}

        const visibleHardcoded = hardcoded.filter(c => !deleted.includes(c));
        const createdTitles = created
            .filter(c => !deleted.includes(c.title))
            .map(c => c.title);

        return [...visibleHardcoded, ...createdTitles];
    }

    function formatDayDate(isoDate) {
        const d = new Date(isoDate + "T00:00:00");
        if (isNaN(d)) return isoDate;
        return d.toLocaleDateString("en-GB", {
            weekday: "long",
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    function formatTime(time) {
        const parts = time.split(":");
        let hours = parseInt(parts[0], 10);
        const mins = (parts[1] || "00").padStart(2, "0");
        const period = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;
        return { display: hours + ":" + mins, period };
    }

    function generateId() {
        return "cls_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
    }

    // ---- DOM refs ----
    const list           = document.getElementById("upcomingClassesList");
    const modal          = document.getElementById("addClassModal");
    const form           = document.getElementById("addClassForm");
    const closeBtn       = document.getElementById("closeClassModal");
    const cancelBtn      = document.getElementById("cancelClassModal");
    const courseSelect   = document.getElementById("classCourseSelect");
    const dateInput      = document.getElementById("classDateInput");
    const timeInput      = document.getElementById("classTimeInput");
    const addBtn         = document.getElementById("addClassBtn");

    const deleteModal    = document.getElementById("deleteClassModal");
    const deleteNameEl   = document.getElementById("deleteClassName");
    const cancelDeleteBtn = document.getElementById("cancelDeleteClass");
    const confirmDeleteBtn = document.getElementById("confirmDeleteClass");

    let pendingDeleteId = null;

    if (!list) {
        console.warn("[UpcomingClasses] #upcomingClassesList not found in HTML");
        return;
    }

    // ---- RENDER ----
    function render() {
        const classes = loadClasses();

        if (classes.length === 0) {
            list.innerHTML =
                '<div class="class-empty">' +
                    '<i class="fa-regular fa-calendar"></i>' +
                    '<p>No upcoming classes scheduled.</p>' +
                    '<button type="button" class="class-empty-btn" id="emptyAddClassBtn">' +
                        '<i class="fa-solid fa-plus"></i> Schedule your first class' +
                    '</button>' +
                '</div>';
            const emptyBtn = document.getElementById("emptyAddClassBtn");
            if (emptyBtn) emptyBtn.addEventListener("click", openModal);
            return;
        }

        const now = new Date();
        const visible = [...classes]
            .sort(function (a, b) {
                return new Date(a.date + "T" + a.time) - new Date(b.date + "T" + b.time);
            })
            .slice(0, MAX_VISIBLE);

        let html = "";
        visible.forEach(function (c) {
            const t = formatTime(c.time);
            const dayDate = formatDayDate(c.date);
            const isPast = new Date(c.date + "T" + c.time) < now;

            html +=
                '<div class="class-item ' + (isPast ? "past" : "") + '" data-id="' + c.id + '">' +
                    '<div class="class-time">' +
                        '<strong>' + t.display + '</strong>' +
                        '<span>' + t.period + '</span>' +
                    '</div>' +
                    '<div class="class-info">' +
                        '<h4>' + c.course + '</h4>' +
                        '<p>' + dayDate + '</p>' +
                    '</div>' +
                    '<button class="class-delete" data-id="' + c.id + '" type="button" title="Remove">' +
                        '<i class="fa-solid fa-xmark"></i>' +
                    '</button>' +
                '</div>';
        });

               if (classes.length > MAX_VISIBLE) {
            html += '<button type="button" class="class-more" id="viewAllClassesBtn">+' +
                    (classes.length - MAX_VISIBLE) + ' more scheduled</button>';
        }

        list.innerHTML = html;

                const viewAllBtn = document.getElementById("viewAllClassesBtn");
        if (viewAllBtn) {
            viewAllBtn.addEventListener("click", openAllClassesModal);
        }

        list.querySelectorAll(".class-delete").forEach(function (btn) {
            btn.addEventListener("click", function (e) {
                e.stopPropagation();
                openDeleteModal(btn.dataset.id);
            });
        });
    }

    // ---- DELETE MODAL ----
    function openDeleteModal(id) {
        if (!deleteModal) {
            console.error("[UpcomingClasses] #deleteClassModal missing");
            return;
        }
        const cls = loadClasses().find(function (c) { return c.id === id; });
        if (!cls) return;

        const t = formatTime(cls.time);
        const dayDate = formatDayDate(cls.date);

        if (deleteNameEl) {
            deleteNameEl.textContent = cls.course + " — " + dayDate + " at " + t.display + " " + t.period;
        }

        pendingDeleteId = id;
        deleteModal.classList.add("show");
    }

    function closeDeleteModal() {
        if (deleteModal) deleteModal.classList.remove("show");
        pendingDeleteId = null;
    }

    function confirmDelete() {
        if (!pendingDeleteId) return;

        const classes = loadClasses();
        const removed = classes.find(function (c) { return c.id === pendingDeleteId; });
        if (!removed) { closeDeleteModal(); return; }

        saveClasses(classes.filter(function (c) { return c.id !== pendingDeleteId; }));

        if (window.logActivity) {
            const t = formatTime(removed.time);
            window.logActivity(
                "delete",
                "Class removed from schedule",
                removed.course + " on " + formatDayDate(removed.date) + " at " + t.display + " " + t.period,
                "/instructor/"
            );
        }

        closeDeleteModal();
        render();
    }

        // ---- ALL CLASSES MODAL ----
    const allClassesModal     = document.getElementById("allClassesModal");
    const allClassesList      = document.getElementById("allClassesList");
    const closeAllClassesBtn  = document.getElementById("closeAllClasses");

    function renderAllClasses() {
        if (!allClassesList) return;

        const classes = loadClasses();

        if (classes.length === 0) {
            allClassesList.innerHTML =
                '<div class="class-empty"><p>No classes scheduled.</p></div>';
            return;
        }

        const now = new Date();
        const sorted = [...classes].sort(function (a, b) {
            return new Date(a.date + "T" + a.time) - new Date(b.date + "T" + b.time);
        });

        allClassesList.innerHTML = sorted.map(function (c) {
            const t = formatTime(c.time);
            const dayDate = formatDayDate(c.date);
            const isPast = new Date(c.date + "T" + c.time) < now;
            return `
                <div class="class-item ${isPast ? "past" : ""}" data-id="${c.id}">
                    <div class="class-time">
                        <strong>${t.display}</strong>
                        <span>${t.period}</span>
                    </div>
                    <div class="class-info">
                        <h4>${c.course}</h4>
                        <p>${dayDate}</p>
                    </div>
                    <button class="class-delete" data-id="${c.id}" type="button" title="Remove">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            `;
        }).join("");

        allClassesList.querySelectorAll(".class-delete").forEach(function (btn) {
            btn.addEventListener("click", function (e) {
                e.stopPropagation();
                openDeleteModal(btn.dataset.id);
            });
        });
    }

    function openAllClassesModal() {
        renderAllClasses();
        if (allClassesModal) allClassesModal.classList.add("show");
    }

    if (closeAllClassesBtn) {
        closeAllClassesBtn.addEventListener("click", function () {
            if (allClassesModal) allClassesModal.classList.remove("show");
        });
    }

    if (allClassesModal) {
        allClassesModal.addEventListener("click", function (e) {
            if (e.target === allClassesModal) allClassesModal.classList.remove("show");
        });
    }

    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener("click", closeDeleteModal);
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener("click", confirmDelete);
    if (deleteModal) {
        deleteModal.addEventListener("click", function (e) {
            if (e.target === deleteModal) closeDeleteModal();
        });
    }

    // ---- ADD MODAL ----
    function openModal() {
        if (!modal) {
            console.error("[UpcomingClasses] #addClassModal missing");
            return;
        }

        if (courseSelect) {
            const courses = getAllCourses();
            let options = '<option value="">Select a course</option>';
            courses.forEach(function (c) {
                options += '<option value="' + c + '">' + c + '</option>';
            });
            courseSelect.innerHTML = options;
        }

        if (dateInput && !dateInput.value) {
            dateInput.value = new Date().toISOString().slice(0, 10);
        }

        modal.classList.add("show");
    }

    function closeModal() {
        if (modal) modal.classList.remove("show");
        if (form) form.reset();
    }

    if (addBtn) addBtn.addEventListener("click", openModal);
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
    if (modal) {
        modal.addEventListener("click", function (e) {
            if (e.target === modal) closeModal();
        });
    }

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            if (deleteModal && deleteModal.classList.contains("show")) closeDeleteModal();
            else if (modal && modal.classList.contains("show")) closeModal();
        }
    });

    // ---- SUBMIT ----
    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();

            const course = courseSelect.value;
            const date = dateInput.value;
            const time = timeInput.value;

            if (!course || !date || !time) {
                alert("Please fill in all fields.");
                return;
            }

            const record = {
                id: generateId(),
                course: course,
                date: date,
                time: time,
                createdAt: Date.now()
            };

            const classes = loadClasses();
            classes.push(record);
            saveClasses(classes);

            if (window.logActivity) {
                const t = formatTime(time);
                window.logActivity(
                    "schedule",
                    "New class scheduled",
                    course + " on " + formatDayDate(date) + " at " + t.display + " " + t.period,
                    "/instructor/"
                );
            }

            render();
            closeModal();
        });
    }

    // ---- BOOT ----
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", render);
    } else {
        render();
    }

})();