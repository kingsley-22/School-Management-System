// ========================================
// ACTIVITY LOG (shared across pages)
// Usage:
//   logActivity("student", "New student added", "Moses joined Web Dev")
//   logActivity("edit", "Course updated", "...", "/instructor/courses/")
// Types: student, course, assignment, announcement, edit, delete, grade
// ========================================

(function () {
    const KEY = "activityLog";
    const MAX = 20;

    // Default destination for each activity type
    const TYPE_LINKS = {
        student:      "/instructor/students/",
        course:       "/instructor/courses/",
        assignment:   "/instructor/assignments/",
        announcement: "/instructor/announcements/",
        edit:         "/instructor/",
        delete:       "/instructor/",
        grade:        "/instructor/assignments/"
    };

    function load() {
        try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
        catch { return []; }
    }

    function save(arr) {
        localStorage.setItem(KEY, JSON.stringify(arr.slice(0, MAX)));
    }

    function logActivity(type, title, description, link) {
        const arr = load();
        arr.unshift({
            type,
            title,
            description,
            link: link || TYPE_LINKS[type] || "/instructor/",
            timestamp: Date.now()
        });
        save(arr);
    }

    function clearActivity() {
        localStorage.removeItem(KEY);
    }

    window.logActivity = logActivity;
    window.loadActivityLog = load;
    window.clearActivityLog = clearActivity;
})();