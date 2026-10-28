const seedAnnouncements = [
    {
        id: 1,
        title: "First Semester Examination Timetable",
        category: "Academic",
        audience: "Students",
        date: "2026-10-24",
        status: "Published",
        body: "The first semester examination timetable is now available. Students should check their course schedules and contact their department if they notice any conflict."
    },
    {
        id: 2,
        title: "Course Registration Deadline",
        category: "Academic",
        audience: "Students",
        date: "2026-10-22",
        status: "Published",
        body: "All students are reminded to complete course registration before the deadline. Late registration may require departmental approval."
    },
    {
        id: 3,
        title: "Campus Clean-Up Day",
        category: "Events",
        audience: "All users",
        date: "2026-10-25",
        status: "Published",
        body: "Join the campus clean-up exercise this Saturday. Please meet at the main assembly point at 8:00 AM and bring reusable gloves if available."
    },
    {
        id: 4,
        title: "Outstanding School Fees Reminder",
        category: "Finance",
        audience: "Parents",
        date: "2026-10-21",
        status: "Published",
        body: "Parents and guardians are encouraged to review outstanding school fees and contact the finance office if they need assistance with payment records."
    },
    {
        id: 5,
        title: "New Student Orientation",
        category: "Events",
        audience: "Students",
        date: "2026-10-28",
        status: "Published",
        body: "New students are invited to orientation for an introduction to campus facilities, academic policies, student support services and the LearnHub portal."
    },
    {
        id: 6,
        title: "Staff Development Workshop",
        category: "Staff",
        audience: "Teaching staff",
        date: "2026-10-29",
        status: "Published",
        body: "Teaching staff are invited to a professional development workshop on effective classroom engagement and digital learning tools."
    },
    {
        id: 7,
        title: "Library Opening Hours Update",
        category: "General",
        audience: "All users",
        date: "2026-10-20",
        status: "Published",
        body: "The library will operate from 8:00 AM to 7:00 PM on weekdays during the examination preparation period."
    },
    {
        id: 8,
        title: "Continuous Assessment Results",
        category: "Academic",
        audience: "Students",
        date: "2026-10-23",
        status: "Published",
        body: "Continuous assessment results will be uploaded to the student portal. Please contact your lecturer for questions about a recorded score."
    },
    {
        id: 9,
        title: "Interdepartmental Sports Festival",
        category: "Events",
        audience: "All users",
        date: "2026-11-02",
        status: "Published",
        body: "The annual sports festival is coming soon. Departments should submit team entries to the student affairs office."
    },
    {
        id: 10,
        title: "Student Portal Maintenance",
        category: "General",
        audience: "All users",
        date: "2026-10-26",
        status: "Published",
        body: "The student portal may be unavailable briefly for scheduled maintenance. Please save your work before the maintenance window."
    },
    {
        id: 11,
        title: "Teaching Staff Meeting",
        category: "Staff",
        audience: "Teaching staff",
        date: "2026-10-27",
        status: "Draft",
        body: "Agenda includes academic progress, examination preparation and updates to departmental reporting."
    },
    {
        id: 12,
        title: "Scholarship Application Information",
        category: "Finance",
        audience: "Students",
        date: "2026-11-04",
        status: "Draft",
        body: "Eligible students should prepare the required documents and check the scholarship noticeboard for application guidance."
    },
    {
        id: 13,
        title: "Parent-Teacher Engagement Day",
        category: "Events",
        audience: "Parents",
        date: "2026-11-06",
        status: "Draft",
        body: "Parents and guardians will have an opportunity to discuss student progress with teachers and school administrators."
    }
];

const $ = id => document.getElementById(id);

let announcements = seedAnnouncements.map(a => ({ ...a }));

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[ch]));
}

function formatDate(value) {
    if (!value) return "Not scheduled";

    const d = new Date(value + "T00:00:00");

    return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function iconFor(category) {
    return {
        Academic: "fa-book-open",
        Events: "fa-calendar-days",
        Finance: "fa-wallet",
        General: "fa-circle-info",
        Staff: "fa-people-group"
    }[category] || "fa-bullhorn";
}

function render() {
    const query = $("searchInput").value.trim().toLowerCase();
    const cat = $("categoryFilter").value;
    const status = $("statusFilter").value;
    const audience = $("audienceFilter").value;

    const filtered = announcements.filter(a =>
        (cat === "All" || a.category === cat) &&
        (status === "All" || a.status === status) &&
        (audience === "All" || a.audience === audience) &&
        (`${a.title} ${a.body} ${a.category} ${a.audience}`
            .toLowerCase()
            .includes(query))
    );

    $("announcementRows").innerHTML = filtered.map(a => `
        <tr>
            <td>
                <div class="announcement-cell">
                    <span class="announcement-icon tag-${escapeHTML(a.category)}">
                        <i class="fa-solid ${iconFor(a.category)}"></i>
                    </span>

                    <div>
                        <strong>${escapeHTML(a.title)}</strong>
                        <small>${escapeHTML(a.body)}</small>
                    </div>
                </div>
            </td>

            <td>
                <span class="category-tag tag-${escapeHTML(a.category)}">
                    ${escapeHTML(a.category)}
                </span>
            </td>

            <td>${escapeHTML(a.audience)}</td>

            <td>${formatDate(a.date)}</td>

            <td>
                <span class="status-tag status-${a.status.toLowerCase()}">
                    ${escapeHTML(a.status)}
                </span>
            </td>

            <td>
                <div class="action-buttons">
                    <button
                        class="action-btn"
                        title="Edit"
                        data-action="edit"
                        data-id="${a.id}"
                    >
                        <i class="fa-regular fa-pen-to-square"></i>
                    </button>

                    <button
                        class="action-btn"
                        title="${a.status === "Published" ? "Move to draft" : "Publish"}"
                        data-action="toggle"
                        data-id="${a.id}"
                    >
                        <i class="fa-solid ${a.status === "Published" ? "fa-box-archive" : "fa-paper-plane"}"></i>
                    </button>

                    <button
                        class="action-btn delete"
                        title="Delete"
                        data-action="delete"
                        data-id="${a.id}"
                    >
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");

    $("emptyState").hidden = filtered.length > 0;

    $("resultCount").textContent =
        `Showing ${filtered.length} of ${announcements.length} announcements`;

    $("totalStat").textContent = announcements.length;

    $("publishedStat").textContent = announcements.filter(
        a => a.status === "Published"
    ).length;

    $("draftStat").textContent = announcements.filter(
        a => a.status === "Draft"
    ).length;

    if ($("navCount")) $("navCount").textContent = announcements.length;
}

function showToast(message) {
    const toast = $("toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2600);
}

function openModal(item = null) {
    $("announcementForm").reset();

    $("editId").value = item ? item.id : "";

    $("modalTitle").textContent = item
        ? "Edit announcement"
        : "Create announcement";

    $("titleInput").value = item?.title || "";
    $("categoryInput").value = item?.category || "Academic";
    $("audienceInput").value = item?.audience || "All users";
    $("bodyInput").value = item?.body || "";

    $("dateInput").value =
        item?.date || new Date().toISOString().slice(0, 10);

    $("statusInput").value = item?.status || "Published";

    $("modalOverlay").classList.add("show");
    document.body.style.overflow = "hidden";

    setTimeout(() => $("titleInput").focus(), 100);
}

function closeModal() {
    $("modalOverlay").classList.remove("show");
    document.body.style.overflow = "";
}

/* MODAL EVENT LISTENERS */

$("openCreate").addEventListener("click", () => openModal());

$("closeModal").addEventListener("click", closeModal);

$("cancelModal").addEventListener("click", closeModal);

$("modalOverlay").addEventListener("click", e => {
    if (e.target === $("modalOverlay")) {
        closeModal();
    }
});

document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
        closeModal();
        $("sidebar").classList.remove("open");
        $("menuToggle")?.setAttribute("aria-expanded", "false");
    }
});

/* CREATE AND UPDATE ANNOUNCEMENTS */

$("announcementForm").addEventListener("submit", e => {
    e.preventDefault();

    const id = $("editId").value;

    const item = {
        id: id ? Number(id) : Date.now(),
        title: $("titleInput").value.trim(),
        category: $("categoryInput").value,
        audience: $("audienceInput").value,
        body: $("bodyInput").value.trim(),
        date: $("dateInput").value,
        status: $("statusInput").value
    };

    if (id) {
        announcements = announcements.map(a =>
            a.id === Number(id) ? item : a
        );

        showToast("Announcement updated successfully.");
    } else {
        announcements.unshift(item);

        showToast("Announcement created successfully.");
    }

    render();
    closeModal();
});

/* EDIT, PUBLISH, AND DELETE */

$("announcementRows").addEventListener("click", e => {
    const button = e.target.closest("button[data-action]");

    if (!button) return;

    const id = Number(button.dataset.id);

    const item = announcements.find(a => a.id === id);

    if (!item) return;

    switch (button.dataset.action) {
        case "edit":
            openModal(item);
            break;

        case "toggle":
            item.status = item.status === "Published"
                ? "Draft"
                : "Published";

            render();

            showToast(
                item.status === "Published"
                    ? "Announcement published."
                    : "Announcement moved to drafts."
            );
            break;

        case "delete":
            if (confirm(`Delete "${item.title}"? This cannot be undone.`)) {
                announcements = announcements.filter(a => a.id !== id);

                render();

                showToast("Announcement deleted.");
            }
            break;
    }
});

/* SEARCH AND FILTERS */

[
    "searchInput",
    "categoryFilter",
    "statusFilter",
    "audienceFilter"
].forEach(id => {
    $(id).addEventListener(
        id === "searchInput" ? "input" : "change",
        render
    );
});

/* MOBILE SIDEBAR */

$("menuToggle").addEventListener("click", () => {
    const isOpen = $("sidebar").classList.toggle("open");
    $("menuToggle").setAttribute("aria-expanded", String(isOpen));
});

document.addEventListener("click", e => {
    if (
        window.innerWidth <= 760 &&
        !$("sidebar").contains(e.target) &&
        !$("menuToggle").contains(e.target)
    ) {
        $("sidebar").classList.remove("open");
        $("menuToggle").setAttribute("aria-expanded", "false");
    }
});

/* HELP BUTTON */

$("helpBtn").addEventListener("click", () => {
    showToast(
        "Please contact your school system administrator for support."
    );
});


/* INITIAL RENDER */

render();