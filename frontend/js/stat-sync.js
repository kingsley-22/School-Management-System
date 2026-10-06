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

    // ========================================
    // STUDENTS PAGE
    // ========================================
    const studentsTable = document.getElementById("studentsTable");

    if (studentsTable) {
        function syncStudents() {
            const rows = studentsTable.querySelectorAll("tr");
            localStorage.setItem("totalStudents", String(rows.length));

            // Average performance from each row's progress <small> (e.g. "80%")
            let total = 0, count = 0;
            rows.forEach(row => {
                const small = row.querySelector(".progress-container small");
                if (!small) return;
                const match = small.textContent.match(/(\d+)/);
                if (!match) return;
                total += parseInt(match[1], 10);
                count++;
            });

            const avg = count > 0 ? Math.round(total / count) : 0;
            localStorage.setItem("averagePerformance", String(avg));
        }

        syncStudents();
        new MutationObserver(syncStudents).observe(studentsTable, {
            childList: true,
            subtree: true
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