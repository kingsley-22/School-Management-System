// ========================================
// INSTRUCTOR ANNOUNCEMENTS PAGE JAVASCRIPT
// Connected to /api/instructor/announcements/
// ========================================

document.addEventListener("DOMContentLoaded", async () => {
    const api = window.InstructorAPI;
    if (!api || !api.enforceInstructorAuth()) return;

    const menuToggle = document.querySelector(".menu-toggle");
    const sidebar = document.querySelector(".sidebar");
    if (menuToggle && sidebar) {
        menuToggle.addEventListener("click", () => sidebar.classList.toggle("show"));
    }
    document.querySelectorAll(".sidebar .menu-item").forEach((link) => {
        link.addEventListener("click", () => {
            if (window.innerWidth <= 768) sidebar?.classList.remove("show");
        });
    });

    const grid = document.getElementById("announcementsGrid");
    const searchInput = document.getElementById("announcementSearch");
    const filterSelect = document.getElementById("announcementFilter");
    const createBtn = document.querySelector(".create-announcement-btn");

    let allAnnouncements = [];

    function updateStats(stats) {
        if (!stats) return;
        const set = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = String(val ?? 0);
        };
        set("totalAnnouncementsCount", stats.total_announcements);
        set("thisMonthCount", stats.this_month);
        set("studentsReachedCount", stats.students_reached);
        set("recentPostsCount", stats.recent_posts);
    }

    function formatDisplayDate(iso) {
        if (!iso) return "";
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    }

    function categoryMeta(cat) {
        const c = (cat || "general").toLowerCase();
        if (c === "important") return { label: "Important", icon: "fa-triangle-exclamation" };
        if (c === "course") return { label: "Course Update", icon: "fa-book-open" };
        return { label: "General", icon: "fa-bullhorn" };
    }

    function renderAnnouncements(list) {
        if (!grid) return;
        if (!list.length) {
            grid.innerHTML = `
                <div style="grid-column:1/-1;background:#fff;border-radius:14px;padding:36px;text-align:center;color:#64748b;border:1px solid #e2e8f0;">
                    <i class="fa-solid fa-bullhorn" style="font-size:26px;margin-bottom:8px;color:#94a3b8;"></i>
                    <p style="margin:0;font-weight:600;color:#334155;">No announcements yet</p>
                    <p style="margin:6px 0 0;font-size:13px;">Click "Create Announcement" to share an update with your students.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = list
            .map((a) => {
                const cat = (a.category || "general").toLowerCase();
                const meta = categoryMeta(cat);
                return `
                    <div class="announcement-card" data-id="${a.id}" data-category="${api.escapeHtml(cat)}" data-date="${api.escapeHtml(a.iso_date || "")}">
                        <div class="announcement-top">
                            <span class="announcement-badge ${api.escapeHtml(cat)}">
                                <i class="fa-solid ${meta.icon}"></i> ${meta.label}
                            </span>
                            <span class="announcement-date">${api.escapeHtml(formatDisplayDate(a.created_at || a.iso_date))}</span>
                        </div>
                        <h3>${api.escapeHtml(a.title)}</h3>
                        <p>${api.escapeHtml(a.description || a.message)}</p>
                        <div class="announcement-meta">
                            <span><i class="fa-solid fa-users"></i> ${api.escapeHtml(a.audience || "All Students")}</span>
                        </div>
                        <div class="announcement-card-actions">
                            <button type="button" class="view-announcement-btn" data-id="${a.id}">View</button>
                            <button type="button" class="edit-announcement-btn" data-id="${a.id}">Edit</button>
                            <button type="button" class="delete-announcement-btn" data-id="${a.id}" data-title="${api.escapeHtml(a.title)}">Delete</button>
                        </div>
                    </div>
                `;
            })
            .join("");

        grid.querySelectorAll(".view-announcement-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                const item = allAnnouncements.find((a) => String(a.id) === String(btn.dataset.id));
                if (!item) return;
                alert(`${item.title}\n\nAudience: ${item.audience}\nCategory: ${item.category}\n\n${item.description}`);
            });
        });

        grid.querySelectorAll(".edit-announcement-btn").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const item = allAnnouncements.find((a) => String(a.id) === String(btn.dataset.id));
                if (!item) return;
                const newTitle = prompt("Edit Announcement Title:", item.title);
                if (newTitle === null || !newTitle.trim()) return;
                const newDesc = prompt("Edit Announcement Message:", item.description);
                if (newDesc === null || !newDesc.trim()) return;
                const newCat = prompt("Category (general, course, important):", item.category) || item.category;
                try {
                    await api.request(`/instructor/announcements/${item.id}/`, {
                        method: "PATCH",
                        body: JSON.stringify({
                            title: newTitle.trim(),
                            description: newDesc.trim(),
                            category: newCat.trim().toLowerCase(),
                        }),
                    });
                    await loadAnnouncements();
                } catch (err) {
                    alert(err.message || "Failed to update announcement.");
                }
            });
        });

        grid.querySelectorAll(".delete-announcement-btn").forEach((btn) => {
            btn.addEventListener("click", async () => {
                if (!confirm(`Delete announcement "${btn.dataset.title}"?`)) return;
                try {
                    await api.request(`/instructor/announcements/${btn.dataset.id}/`, { method: "DELETE" });
                    await loadAnnouncements();
                } catch (err) {
                    alert(err.message || "Failed to delete announcement.");
                }
            });
        });
    }

    function applyFilters() {
        const q = (searchInput?.value || "").trim().toLowerCase();
        const cat = (filterSelect?.value || "all").toLowerCase();
        const filtered = allAnnouncements.filter((a) => {
            const matchesSearch =
                !q ||
                (a.title || "").toLowerCase().includes(q) ||
                (a.description || "").toLowerCase().includes(q);
            const matchesCat = cat === "all" || (a.category || "").toLowerCase() === cat;
            return matchesSearch && matchesCat;
        });
        renderAnnouncements(filtered);
    }

    async function loadAnnouncements() {
        try {
            const data = await api.request("/instructor/announcements/");
            allAnnouncements = data.results || [];
            updateStats(data.stats);
            applyFilters();
        } catch (err) {
            console.error("Failed to load announcements:", err);
        }
    }

    createBtn?.addEventListener("click", async () => {
        const title = prompt("Announcement Title:");
        if (title === null || !title.trim()) return;
        const description = prompt("Announcement Message:");
        if (description === null || !description.trim()) return;
        const category = (prompt("Category (general, course, important):", "general") || "general").trim().toLowerCase();
        try {
            await api.request("/instructor/announcements/", {
                method: "POST",
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim(),
                    category,
                }),
            });
            await loadAnnouncements();
        } catch (err) {
            alert(err.message || "Failed to post announcement.");
        }
    });

    searchInput?.addEventListener("input", applyFilters);
    filterSelect?.addEventListener("change", applyFilters);

    await loadAnnouncements();
});
