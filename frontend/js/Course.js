// ==========================================
// IFEXA ACADEMY — ADMIN COURSE MANAGEMENT
// Connected to Django REST Framework Admin API
// ==========================================

const API_BASE_URL = (
    window.VITE_API_URL ||
    window.API_BASE_URL ||
    "http://127.0.0.1:8000/api"
).replace(/\/+$/, "");

const LOGIN_PAGE_URL = "../home/login.html";

let courses = [];
let studentsList = [];
let selectedCourseId = null;
let toastTimer = null;

const bookmarkedCourses = new Set();
const $ = id => document.getElementById(id);

function getAccessToken() {
    return (
        sessionStorage.getItem("accessToken") ||
        localStorage.getItem("accessToken") ||
        ""
    );
}

function getRefreshToken() {
    return (
        sessionStorage.getItem("refreshToken") ||
        localStorage.getItem("refreshToken") ||
        ""
    );
}

function clearAuthState() {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
}

function redirectToLogin() {
    clearAuthState();
    window.location.replace(LOGIN_PAGE_URL);
}

async function refreshAccessToken() {
    const refresh = getRefreshToken();
    if (!refresh) return null;

    try {
        const res = await fetch(`${API_BASE_URL}/token/refresh/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify({ refresh }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (data?.access) {
            sessionStorage.setItem("accessToken", data.access);
            localStorage.setItem("accessToken", data.access);
            return data.access;
        }
        return null;
    } catch {
        return null;
    }
}

async function apiRequest(endpoint, options = {}, retried = false) {
    let token = getAccessToken();
    if (!token && !retried) {
        token = await refreshAccessToken();
        if (!token) {
            redirectToLogin();
            throw new Error("Authentication required.");
        }
    }

    const headers = {
        "Accept": "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        ...(options.headers || {}),
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401 && !retried) {
        const newToken = await refreshAccessToken();
        if (newToken) return apiRequest(endpoint, options, true);
        redirectToLogin();
        throw new Error("Session expired.");
    }

    if (response.status === 403) {
        redirectToLogin();
        throw new Error("Admin access required.");
    }

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    if (!response.ok) {
        throw new Error(data.error || data.detail || "Request failed.");
    }
    return data;
}

function initials(name) {
    return String(name || "IF")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(word => word[0] || "")
        .join("")
        .toUpperCase();
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function showToast(message) {
    const toast = $("toast");
    if (!toast) {
        console.log(message);
        return;
    }
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2800);
}

async function loadCoursesFromBackend() {
    try {
        const [coursesRes, studentsRes] = await Promise.all([
            apiRequest("/admin/courses/"),
            apiRequest("/admin/students/"),
        ]);
        courses = Array.isArray(coursesRes.results) ? coursesRes.results : [];
        studentsList = Array.isArray(studentsRes.results) ? studentsRes.results : [];

        if ($("studentNavCount")) {
            $("studentNavCount").textContent = studentsList.length;
        }

        renderMetrics();
        renderCourses();
    } catch (error) {
        showToast(error.message || "Unable to load courses from server.");
    }
}

function renderMetrics() {
    const total = courses.length;
    const active = courses.filter(course => course.active).length;
    const categories = [...new Set(courses.map(course => course.category).filter(Boolean))];

    if ($("totalCourses")) $("totalCourses").textContent = total;
    if ($("activeCourses")) $("activeCourses").textContent = active;
    if ($("categoryCount")) $("categoryCount").textContent = categories.length;
    if ($("totalHours")) {
        $("totalHours").textContent = courses.reduce(
            (sum, course) => sum + (Number(course.hours) || 0),
            0
        );
    }

    document.querySelectorAll(".chip[data-category]").forEach(chip => {
        const category = chip.dataset.category;
        const count = category === "All"
            ? total
            : courses.filter(course => course.category === category).length;

        let countElement = chip.querySelector("span");
        if (!countElement) {
            countElement = document.createElement("span");
            chip.appendChild(countElement);
        }
        countElement.textContent = count;
    });
}

function currentFilters() {
    return {
        search: ($("searchInput")?.value || "").trim().toLowerCase(),
        category: $("categoryFilter")?.value || "All",
        level: $("levelFilter")?.value || "All",
        sort: $("sortFilter")?.value || "featured"
    };
}

function getFilteredCourses() {
    const filters = currentFilters();

    const list = courses.filter(course => {
        const matchesCategory =
            filters.category === "All" ||
            course.category === filters.category;

        const matchesLevel =
            filters.level === "All" ||
            course.level === filters.level;

        const searchableText = [
            course.title,
            course.category,
            course.instructor,
            course.description,
            course.level
        ].join(" ").toLowerCase();

        return matchesCategory &&
            matchesLevel &&
            searchableText.includes(filters.search);
    });

    if (filters.sort === "title") {
        list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (filters.sort === "hours") {
        list.sort((a, b) => a.hours - b.hours);
    }

    return list;
}

function renderCourses() {
    const container = $("coursesContainer");
    if (!container) return;

    const list = getFilteredCourses();

    container.innerHTML = list.map(course => {
        const isBookmarked = bookmarkedCourses.has(course.id);
        const enrolledCount = Number(course.enrolled_students_count || 0);

        return `
            <article class="course-card">
                <div class="course-art ${escapeHTML(course.theme || "art-tech")}">
                    <span class="art-tag">
                        ${escapeHTML(course.category)}
                    </span>

                    <button
                        class="bookmark ${isBookmarked ? "saved" : ""}"
                        type="button"
                        data-bookmark="${escapeHTML(course.id)}"
                        aria-label="${isBookmarked ? "Remove bookmark" : "Bookmark"} ${escapeHTML(course.title)}"
                        aria-pressed="${isBookmarked}"
                        title="Bookmark course"
                    >
                        <i class="fa-${isBookmarked ? "solid" : "regular"} fa-bookmark"></i>
                    </button>

                    <i class="fa-solid ${escapeHTML(course.icon || "fa-book-open")}"></i>
                </div>

                <div class="course-content">
                    <div class="course-meta">
                        <span class="category-label">
                            ${escapeHTML((course.category || "COURSE").toUpperCase())}
                        </span>
                        <span class="level-label">
                            ${escapeHTML(course.level || "Beginner")}
                        </span>
                    </div>

                    <h3>${escapeHTML(course.title)}</h3>

                    <p class="course-description">
                        ${escapeHTML(course.description)}
                    </p>

                    <div class="instructor">
                        <span class="instructor-avatar">
                            ${escapeHTML(initials(course.instructor))}
                        </span>

                        <div>
                            <small>Course instructor</small>
                            <strong>${escapeHTML(course.instructor)}</strong>
                        </div>

                        <i class="fa-solid fa-circle-check"
                           title="Instructor assigned"></i>
                    </div>

                    <div class="course-bottom">
                        <span class="duration">
                            <i class="fa-regular fa-clock"></i>
                            ${Number(course.hours) || 0} hrs · ${enrolledCount} student${enrolledCount === 1 ? "" : "s"}
                        </span>

                        <div style="display:flex; gap:6px;">
                            <button
                                type="button"
                                class="secondary-btn"
                                data-assign="${escapeHTML(course.id)}"
                                style="padding:5px 9px; font-size:11px;"
                                title="Assign student to this course"
                            >
                                <i class="fa-solid fa-user-plus"></i> Assign
                            </button>
                            <button
                                type="button"
                                class="secondary-btn"
                                data-delete="${escapeHTML(course.id)}"
                                style="padding:5px 9px; font-size:11px; color:#dc2626;"
                                title="Delete course"
                            >
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </article>
        `;
    }).join("");

    if ($("noResults")) {
        $("noResults").hidden = list.length !== 0;
    }

    if ($("resultsCount")) {
        $("resultsCount").textContent =
            `Showing ${list.length} of ${courses.length} courses`;
    }

    document.querySelectorAll(".chip[data-category]").forEach(chip => {
        chip.classList.toggle(
            "active",
            chip.dataset.category === currentFilters().category
        );
    });
}

function applyCategory(category) {
    if ($("categoryFilter")) {
        $("categoryFilter").value = category;
    }
    renderCourses();
}

function openAddModal() {
    const modal = $("addModal");
    modal?.classList.add("open");
    modal?.setAttribute("aria-hidden", "false");
}

function closeAddModal() {
    const modal = $("addModal");
    modal?.classList.remove("open");
    modal?.setAttribute("aria-hidden", "true");
}

async function addCourse(event) {
    event.preventDefault();

    const form = $("addCourseForm");
    if (!form || !form.checkValidity()) {
        form?.reportValidity();
        return;
    }

    const title = $("newTitle").value.trim();
    const instructor = $("newInstructor").value.trim();
    const category = $("newCategory").value;
    const level = $("newLevel").value;
    const hours = Number($("newHours").value);
    const description = $("newDescription").value.trim();

    if (
        !title || !instructor || !category ||
        !level || !description ||
        !Number.isFinite(hours) || hours < 1 || hours > 500
    ) {
        showToast("Please enter valid information in every field.");
        return;
    }

    try {
        await apiRequest("/admin/courses/", {
            method: "POST",
            body: JSON.stringify({
                title,
                instructor,
                category,
                level,
                hours,
                description,
            }),
        });

        if ($("searchInput")) $("searchInput").value = "";
        if ($("categoryFilter")) $("categoryFilter").value = "All";
        if ($("levelFilter")) $("levelFilter").value = "All";
        if ($("sortFilter")) $("sortFilter").value = "featured";

        form.reset();
        closeAddModal();
        await loadCoursesFromBackend();
        showToast("Course added to database successfully.");
    } catch (error) {
        showToast(error.message || "Could not create course.");
    }
}

async function assignStudentToCoursePrompt(courseId) {
    const course = courses.find(c => String(c.id) === String(courseId));
    if (!course) return;

    if (studentsList.length === 0) {
        showToast("No students registered yet.");
        return;
    }

    const studentListing = studentsList
        .map(s => `${s.id} (${s.name} — ${s.email})`)
        .slice(0, 10)
        .join("\n");

    const studentRef = prompt(
        `Assign "${course.title}" to a student.\nEnter Student ID or Email:\n\nAvailable students:\n${studentListing}`
    );
    if (!studentRef || !studentRef.trim()) return;

    try {
        const res = await apiRequest("/admin/assign-course/", {
            method: "POST",
            body: JSON.stringify({
                student_id: studentRef.trim(),
                course_id: course.id,
            }),
        });
        await loadCoursesFromBackend();
        showToast(res.message || "Student assigned to course successfully!");
    } catch (error) {
        showToast(error.message || "Failed to assign student to course.");
    }
}

async function deleteCourseById(courseId) {
    const course = courses.find(c => String(c.id) === String(courseId));
    if (!course) return;

    if (!confirm(`Delete "${course.title}" from the database?`)) return;

    try {
        await apiRequest(`/admin/courses/${course.id}/`, {
            method: "DELETE",
        });
        await loadCoursesFromBackend();
        showToast("Course deleted successfully.");
    } catch (error) {
        showToast(error.message || "Failed to delete course.");
    }
}

function resetFilters() {
    if ($("searchInput")) $("searchInput").value = "";
    if ($("categoryFilter")) $("categoryFilter").value = "All";
    if ($("levelFilter")) $("levelFilter").value = "All";
    if ($("sortFilter")) $("sortFilter").value = "featured";
    renderCourses();
}

function toggleSidebar() {
    $("sidebar")?.classList.toggle("open");
    $("overlay")?.classList.toggle("open");
}

function closeSidebar() {
    $("sidebar")?.classList.remove("open");
    $("overlay")?.classList.remove("open");
}

document.addEventListener("DOMContentLoaded", () => {
    if (!getAccessToken() && !getRefreshToken()) {
        redirectToLogin();
        return;
    }

    if ($("year")) {
        $("year").textContent = new Date().getFullYear();
    }

    loadCoursesFromBackend();

    $("menuBtn")?.addEventListener("click", toggleSidebar);
    $("overlay")?.addEventListener("click", closeSidebar);

    $("sidebar")?.querySelectorAll("nav a").forEach(link => {
        link.addEventListener("click", closeSidebar);
    });

    $("searchInput")?.addEventListener("input", renderCourses);
    $("categoryFilter")?.addEventListener("change", renderCourses);
    $("levelFilter")?.addEventListener("change", renderCourses);
    $("sortFilter")?.addEventListener("change", renderCourses);

    $("filterChips")?.addEventListener("click", event => {
        const chip = event.target.closest(".chip[data-category]");
        if (chip) {
            applyCategory(chip.dataset.category);
        }
    });

    $("coursesContainer")?.addEventListener("click", event => {
        const assignBtn = event.target.closest("[data-assign]");
        if (assignBtn) {
            assignStudentToCoursePrompt(assignBtn.dataset.assign);
            return;
        }

        const deleteBtn = event.target.closest("[data-delete]");
        if (deleteBtn) {
            deleteCourseById(deleteBtn.dataset.delete);
            return;
        }

        const bookmark = event.target.closest("[data-bookmark]");
        if (bookmark) {
            const id = Number(bookmark.dataset.bookmark);
            if (bookmarkedCourses.has(id)) {
                bookmarkedCourses.delete(id);
                showToast("Bookmark removed.");
            } else {
                bookmarkedCourses.add(id);
                showToast("Course bookmarked for this session.");
            }
            renderCourses();
        }
    });

    $("clearFilters")?.addEventListener("click", resetFilters);
    $("addCourseBtn")?.addEventListener("click", openAddModal);
    $("closeAddModal")?.addEventListener("click", closeAddModal);

    $("addModal")?.addEventListener("click", event => {
        if (event.target === $("addModal")) {
            closeAddModal();
        }
    });

    $("addCourseForm")?.addEventListener("submit", addCourse);

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeAddModal();
            closeSidebar();
        }
    });
});
