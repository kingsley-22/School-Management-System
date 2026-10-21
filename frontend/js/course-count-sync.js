// ========================================
// COURSE COUNT SYNC
// Keeps localStorage["totalCourses"] in
// sync with the number of course cards.
// ========================================

document.addEventListener("DOMContentLoaded", () => {

    const grid = document.getElementById("coursesGrid");
    if (!grid) return;   // not the courses page, bail

    function syncCount() {
        const count = document.querySelectorAll(".course-card").length;
        localStorage.setItem("totalCourses", String(count));
    }

    // Seed on first load
    syncCount();

    // Watch for cards added/removed
    const observer = new MutationObserver(syncCount);
    observer.observe(grid, { childList: true, subtree: true });

    // Belt and braces
    window.addEventListener("beforeunload", syncCount);
});