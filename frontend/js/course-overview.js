// ========================================
// COURSE OVERVIEW TABLE (DASHBOARD)
// Powered by /api/instructor/dashboard/
// ========================================

document.addEventListener("DOMContentLoaded", () => {
    const api = window.InstructorAPI;
    const rowsContainer = document.getElementById("courseOverviewRows");
    if (!api || !rowsContainer) return;

    function renderCourseOverview(courses) {
        if (!courses || !courses.length) {
            rowsContainer.innerHTML = `
                <div style="padding:18px;text-align:center;color:#64748b;font-size:13px;">
                    No courses assigned yet.
                </div>
            `;
            return;
        }

        rowsContainer.innerHTML = courses
            .map(
                (course) => `
            <div class="course-row" style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;align-items:center;padding:12px 14px;border-bottom:1px solid #f1f5f9;font-size:14px;">
                <span style="font-weight:600;color:#0f172a;">${api.escapeHtml(course.title)}</span>
                <span>${course.students_count ?? 0}</span>
                <span>${course.classes_held ?? 0}</span>
                <span>${course.classes_scheduled ?? 0}</span>
            </div>
        `
            )
            .join("");
    }

    if (window.__instructorDashboardData?.course_overview) {
        renderCourseOverview(window.__instructorDashboardData.course_overview);
    }

    window.addEventListener("instructor:dashboardLoaded", (event) => {
        renderCourseOverview(event.detail?.course_overview || []);
    });
});
