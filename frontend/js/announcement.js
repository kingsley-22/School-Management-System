// ======================================
// GET ELEMENTS
// ======================================

const formContainer = document.getElementById("form_Container");
const form = formContainer.querySelector("form");

const titleInput = document.getElementById("inputText");

// Get the textarea
const messageInput = formContainer.querySelector("textarea");

const cancelButton = document.getElementById("Cancel");
const phase = document.getElementById("phase");


// ======================================
// ANNOUNCEMENTS ARRAY
// ======================================

let announcements = [];


// ======================================
// OPEN ANNOUNCEMENT FORM
// ======================================

function editAnnouncement() {
    formContainer.style.display = "block";
}


// ======================================
// CANCEL
// ======================================

cancelButton.addEventListener("click", function(event) {

    event.preventDefault();

    formContainer.style.display = "none";

    titleInput.value = "";
    messageInput.value = "";

});


// ======================================
// PUBLISH ANNOUNCEMENT
// ======================================

form.addEventListener("submit", function(event) {

    event.preventDefault();

    const title = titleInput.value.trim();
    const message = messageInput.value.trim();


    // Check empty fields

    if (title === "" || message === "") {
        return;
    }


    // Create announcement

    const newAnnouncement = {

        id: Date.now(),

        title: title,

        message: message

    };


    // Add announcement to array

    announcements.push(newAnnouncement);


    // Show announcement

    displayAnnouncements();


    // Clear form

    titleInput.value = "";
    messageInput.value = "";


    // Hide form

    formContainer.style.display = "none";

});


// ======================================
// DISPLAY ANNOUNCEMENTS
// ======================================

function displayAnnouncements() {

    // Clear old announcements

    phase.innerHTML = "";


    // If there are no announcements

    if (announcements.length === 0) {

        phase.innerHTML = `
            <i class="fa fa-bell"></i>

            <div class="phase_one">

                <h1>No Announcements</h1>

                <p>
                    Click "New Announcement" to create an announcement.
                </p>

            </div>
        `;

        return;

    }


    // Display announcements

    announcements.forEach(function(announcement) {

        const icon = document.createElement("i");

        icon.className = "fa fa-bell";


        const box = document.createElement("div");

        box.className = "phase_one";


        const heading = document.createElement("h1");

        heading.textContent = announcement.title;


        const paragraph = document.createElement("p");

        paragraph.textContent = announcement.message;


        const deleteButton = document.createElement("button");

        deleteButton.textContent = "Delete";


        deleteButton.addEventListener("click", function() {

            deleteAnnouncement(announcement.id);

        });


        // Put elements inside box

        box.appendChild(heading);

        box.appendChild(paragraph);

        box.appendChild(deleteButton);


        // Put everything inside phase

        phase.appendChild(icon);

        phase.appendChild(box);

    });

}


// ======================================
// DELETE ANNOUNCEMENT
// ======================================

function deleteAnnouncement(id) {

    announcements = announcements.filter(function(announcement) {

        return announcement.id !== id;

    });

    displayAnnouncements();

}


// ======================================
// HAMBURGER BUTTON
// ======================================

function HamButton() {

    const sidebar = document.querySelector(".Sidebar");

    sidebar.classList.toggle("bar");

}


// ======================================
// LOAD WHEN PAGE OPENS
// ======================================

document.addEventListener("DOMContentLoaded", function() {

    formContainer.style.display = "none";

    displayAnnouncements();

});