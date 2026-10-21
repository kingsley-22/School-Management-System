// ========================================
// ANNOUNCEMENTS PAGE JAVASCRIPT
// ========================================

document.addEventListener("DOMContentLoaded", () => {

    // ---- STORAGE ----
    const STORAGE_KEY = "createdAnnouncements";

    function loadSaved() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
        catch { return []; }
    }
    function persistSaved(arr) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    }


    // ---- ELEMENTS ----
    const searchInput = document.getElementById("announcementSearch");
    const filterSelect = document.getElementById("announcementFilter");
    const announcementsGrid = document.getElementById("announcementsGrid");
    const createButton = document.querySelector(".create-announcement-btn");
    const menuToggle = document.querySelector(".menu-toggle");
    const sidebar = document.querySelector(".sidebar");


    // ---- MOBILE SIDEBAR ----
    if (menuToggle && sidebar) {
        menuToggle.addEventListener("click", (e) => {
            e.stopPropagation();
            sidebar.classList.toggle("show");
        });

        document.addEventListener("click", (e) => {
            if (
                sidebar.classList.contains("show") &&
                !sidebar.contains(e.target) &&
                !menuToggle.contains(e.target)
            ) {
                sidebar.classList.remove("show");
            }
        });
    }

    document.querySelectorAll(".sidebar .menu-item").forEach(link => {
        link.addEventListener("click", () => {
            if (window.innerWidth <= 768) sidebar.classList.remove("show");
        });
    });


    // ---- SEARCH + FILTER ----
    function filterAnnouncements() {
        const s = searchInput.value.trim().toLowerCase();
        const cat = filterSelect.value;

        announcementsGrid.querySelectorAll(".announcement-card").forEach(card => {
            const title = card.querySelector("h3")?.textContent.toLowerCase() || "";
            const desc = card.querySelector("p")?.textContent.toLowerCase() || "";
            const cardCat = card.dataset.category || "";

            const matchSearch = title.includes(s) || desc.includes(s);
            const matchCat = cat === "all" || cardCat === cat;

            card.style.display = (matchSearch && matchCat) ? "" : "none";
        });
    }

    if (searchInput) searchInput.addEventListener("input", filterAnnouncements);
    if (filterSelect) filterSelect.addEventListener("change", filterAnnouncements);


    // ---- ICON / LABEL HELPERS ----
    function iconClassFor(cat) {
        if (cat === "important") return "fa-triangle-exclamation";
        if (cat === "course") return "fa-book-open";
        return "fa-bullhorn";
    }
    function iconWrapClassFor(cat) {
        if (cat === "important") return "important-icon";
        if (cat === "course") return "course-icon";
        return "general-icon";
    }
    function categoryLabelFor(cat) {
        if (cat === "important") return "Important";
        if (cat === "course") return "Course Update";
        return "General";
    }
    function categoryClassFor(cat) {
        if (cat === "important") return "important-category";
        if (cat === "course") return "course-category";
        return "general-category";
    }


    // ---- BUILD CARD ----
    function buildCard(data) {
        const card = document.createElement("div");
        card.className = "announcement-card";
        card.dataset.category = data.category;
        card.dataset.date = data.isoDate;   // "2026-09-24"

        card.innerHTML = `
            <div class="announcement-card-header">
                <div class="announcement-icon ${iconWrapClassFor(data.category)}">
                    <i class="fa-solid ${iconClassFor(data.category)}"></i>
                </div>
                <span class="announcement-category ${categoryClassFor(data.category)}">
                    ${categoryLabelFor(data.category)}
                </span>
            </div>

            <h3>${data.title}</h3>
            <p>${data.description}</p>

            <div class="announcement-meta">
                <span>
                    <i class="fa-solid fa-calendar"></i>
                    ${data.displayDate}
                </span>
                <span>
                    <i class="fa-solid fa-users"></i>
                    All Students
                </span>
            </div>

            <div class="announcement-buttons">
                <button class="view-announcement-btn">View</button>
                <button class="edit-announcement-btn">Edit</button>
                <button class="delete-announcement-btn">Delete</button>
            </div>
        `;
        return card;
    }


    // ---- VIEW / EDIT / DELETE ----
    function viewCard(card) {
        const title = card.querySelector("h3").textContent.trim();
        const desc = card.querySelector("p").textContent.trim();
        const category = card.querySelector(".announcement-category").textContent.trim();
        const meta = card.querySelectorAll(".announcement-meta span");
        const date = meta[0]?.textContent.trim() || "";
        const audience = meta[1]?.textContent.trim() || "";

        alert(
            `Announcement\n\n` +
            `Title: ${title}\n\n` +
            `Category: ${category}\n\n` +
            `${desc}\n\n` +
            `${date}\n${audience}`
        );
    }

    function editCard(card) {
        const titleEl = card.querySelector("h3");
        const descEl = card.querySelector("p");

        const oldTitle = titleEl.textContent.trim();
        const oldDesc = descEl.textContent.trim();

        const newTitle = prompt("Edit announcement title:", oldTitle);
        if (!newTitle || newTitle.trim() === "") return;

        const newDesc = prompt("Edit announcement description:", oldDesc);
        if (!newDesc || newDesc.trim() === "") return;

        titleEl.textContent = newTitle.trim();
        descEl.textContent = newDesc.trim();

        // Persist the edit in localStorage (if user-created)
        const saved = loadSaved();
        const idx = saved.findIndex(a => a.title === oldTitle);
        if (idx !== -1) {
            saved[idx].title = newTitle.trim();
            saved[idx].description = newDesc.trim();
            persistSaved(saved);
        }

        alert("Announcement updated successfully!");
    }

    function deleteCard(card) {
        const title = card.querySelector("h3").textContent.trim();
        if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

        const saved = loadSaved();
        persistSaved(saved.filter(a => a.title !== title));

        card.remove();
        updateStats();
        alert("Announcement deleted successfully!");
    }


    // ---- ATTACH BUTTONS ----
    function attachCardHandlers(card) {
        card.querySelector(".view-announcement-btn")
            ?.addEventListener("click", () => viewCard(card));
        card.querySelector(".edit-announcement-btn")
            ?.addEventListener("click", () => editCard(card));
        card.querySelector(".delete-announcement-btn")
            ?.addEventListener("click", () => deleteCard(card));
    }

    announcementsGrid?.querySelectorAll(".announcement-card")
        .forEach(attachCardHandlers);


    // ---- STATS ----
    function updateStats() {
        const cards = announcementsGrid.querySelectorAll(".announcement-card");

        const total = cards.length;

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);

        let thisMonth = 0;
        let recent = 0;

        cards.forEach(card => {
            const iso = card.dataset.date;
            if (!iso) return;
            const d = new Date(iso + "T00:00:00");
            if (isNaN(d.getTime())) return;

            if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
                thisMonth++;
            }
            if (d >= sevenDaysAgo) recent++;
        });

        const totalEl = document.getElementById("totalAnnouncementsCount");
        const monthEl = document.getElementById("thisMonthCount");
        const recentEl = document.getElementById("recentPostsCount");

        if (totalEl) totalEl.textContent = total;
        if (monthEl) monthEl.textContent = thisMonth;
        if (recentEl) recentEl.textContent = recent;

        // Also expose to dashboard for later use
        localStorage.setItem("totalAnnouncements", String(total));
    }


    // ---- CREATE ANNOUNCEMENT ----
    if (createButton) {
        createButton.addEventListener("click", () => {

            const title = prompt("Enter announcement title:");
            if (!title || title.trim() === "") return;

            const description = prompt("Enter announcement description:");
            if (!description || description.trim() === "") return;

            const category = prompt(
                "Enter category:\n\n" +
                "general\n" +
                "course\n" +
                "important"
            );

            if (!category || !["general", "course", "important"]
                    .includes(category.toLowerCase())) {
                alert("Please enter a valid category.");
                return;
            }

            const normalizedCategory = category.toLowerCase();

            // Format today's date
            const today = new Date();
            const displayDate = today.toLocaleDateString("en-GB", {
                day: "2-digit", month: "short", year: "numeric"
            });
            const isoDate = today.toISOString().slice(0, 10);

            const record = {
                title: title.trim(),
                description: description.trim(),
                category: normalizedCategory,
                displayDate,
                isoDate
            };

            const saved = loadSaved();
            saved.unshift(record);   // newest first
            persistSaved(saved);


            window.logActivity?.(
                "announcement",
                "New announcement posted",
                `"${record.title}" (${categoryLabelFor(record.category)})`,
                "/instructor/announcements/"
            );
            window.logActivity?.("delete", "Announcement deleted", `"${title}" was removed`, "/instructor/announcements/");

            const newCard = buildCard(record);
            announcementsGrid.prepend(newCard);
            attachCardHandlers(newCard);
            updateStats();
                
                

            alert("Announcement created successfully!");
        });
    }


    // ---- RESTORE SAVED ANNOUNCEMENTS ----
    const savedAnnouncements = loadSaved();
    if (announcementsGrid && savedAnnouncements.length) {
        // Reverse so the newest ends up first after prepends
        savedAnnouncements.slice().reverse().forEach(a => {
            const exists = Array.from(
                announcementsGrid.querySelectorAll("h3")
            ).some(el => el.textContent.trim() === a.title);
            if (exists) return;

            const card = buildCard(a);
            announcementsGrid.prepend(card);
            attachCardHandlers(card);
        });
    }


    // ---- INITIAL STATS ----
    updateStats();


   
});