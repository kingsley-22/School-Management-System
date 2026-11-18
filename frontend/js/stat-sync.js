// ========================================
// STAT SYNC
// Watches the students table and the
// assignments table, and keeps:
//   - totalStudents
//   - averagePerformance
//   - totalAssignments
// in localStorage in sync with what's on screen.
// ========================================

document.addEventListener("DOMContentLoaded", () => {
    

        // ---- STUDENTS ----
    const studentsTable = document.getElementById("studentsTable");

    if (studentsTable) {
        function syncStudents() {
            const rows = studentsTable.querySelectorAll("tr");

            // Count + average (existing behavior)
            let total = 0, count = 0;

            // Full list for the dashboard's Course Overview
            const allStudents = [];

            rows.forEach(row => {
                const name = row.querySelector(".student-name strong")?.textContent.trim() || "";
                const course = row.children[2]?.textContent.trim() || "";
                const small = row.querySelector(".progress-container small");
                const progressText = small ? small.textContent : "0%";
                const progress = parseInt(progressText, 10) || 0;

                if (name && course) {
                    allStudents.push({ name, course, progress });
                }

                total += progress;
                count++;
            });

            // Save counts
            localStorage.setItem("totalStudents", String(rows.length));

            const avg = count > 0 ? Math.round(total / count) : 0;
            localStorage.setItem("averagePerformance", String(avg));

            // Save full list for Course Overview
            localStorage.setItem("allStudents", JSON.stringify(allStudents));
        }

        syncStudents();
        new MutationObserver(syncStudents).observe(studentsTable, {
            childList: true, subtree: true
        });
        window.addEventListener("beforeunload", syncStudents);
    }

    // ========================================
    // ASSIGNMENTS PAGE
    // ========================================
    const assignmentsTable = document.getElementById("assignmentsTable");

    if (assignmentsTable) {
        function syncAssignments() {
            const rows = assignmentsTable.querySelectorAll("tr");
            localStorage.setItem("totalAssignments", String(rows.length));
        }

        syncAssignments();
        new MutationObserver(syncAssignments).observe(assignmentsTable, {
            childList: true,
            subtree: true
        });
        window.addEventListener("beforeunload", syncAssignments);
    }
});