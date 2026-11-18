// ========================================
// COURSE OVERVIEW (dashboard)
// Builds one row per course, showing:
//   - Course name
//   - Student count
//   - Classes held (past scheduled classes)
//   - Classes scheduled (future scheduled classes)
// ========================================

(function () {

    const HARDCODED_COURSES = [
        "Web Development",
        "Python Programming",
        "Database Systems",
        "JavaScript Fundamentals",
        "Backend Development",
        "Cybersecurity Basics"
    ];

    function loadJSON(key) {
        try { return JSON.parse(localStorage.getItem(key) || "[]"); }
        catch (e) { return []; }
    }

    // All visible courses: hardcoded (minus deleted) + user-created (minus deleted)
    function getAllCourses() {
        const deleted = loadJSON("deletedCourses");
        const created = loadJSON("createdCourses");

        const fromHardcoded = HARDCODED_COURSES.filter(function (c) {
            return !deleted.includes(c);
        });

        const fromCreated = created
            .filter(function (c) { return !deleted.includes(c.title); })
            .map(function (c) { return c.title; });

        const merged = fromHardcoded.slice();
        fromCreated.forEach(function (t) {
            if (!merged.includes(t)) merged.push(t);
        });
        return merged;
    }

    function computeStats(courseName) {
        const students = loadJSON("allStudents").filter(function (s) {
            return (s.course || "").toLowerCase() === courseName.toLowerCase();
        });

        const classes = loadJSON("upcomingClasses").filter(function (c) {
            return (c.course || "").toLowerCase() === courseName.toLowerCase();
        });

        const now = new Date();
        let held = 0;
        let scheduled = 0;

        classes.forEach(function (c) {
            const dt = new Date(c.date + "T" + c.time);
            if (isNaN(dt.getTime())) return;
            if (dt < now) held++;
            else scheduled++;
        });

        return {
            studentCount: students.length,
            held: held,
            scheduled: scheduled
        };
    }

    function render() {
        const container = document.getElementById("courseOverviewRows");
        if (!container) return;

        const courses = getAllCourses();

        if (courses.length === 0) {
            container.innerHTML =
                '<div class="table-row" style="grid-template-columns: 1fr; justify-content: center; color: #94a3b8; padding: 30px 15px; text-align: center;">' +
                    'No courses yet. Create one from the Courses page.' +
                '</div>';
            return;
        }

        let html = "";
        courses.forEach(function (name) {
            const s = computeStats(name);
            const studentLabel = s.studentCount + " Student" + (s.studentCount === 1 ? "" : "s");

            html +=
                '<div class="table-row" data-course="' + name + '">' +
                    '<span class="course-name">' + name + '</span>' +
                    '<span>' + studentLabel + '</span>' +
                    '<span class="held-value">' + s.held + '</span>' +
                    '<span class="scheduled-value">' + s.scheduled + '</span>' +
                '</div>';
        });

        container.innerHTML = html;
    }

    function boot() {
        render();
        // Refresh every 60 seconds so classes flip from scheduled → held
        setInterval(render, 60000);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }

    window.addEventListener("focus", render);
    window.addEventListener("pageshow", render);

})();