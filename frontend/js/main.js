// // MOBILE NAVIGATION

// const hamburger = document.getElementById("hamburger"); 
// const mobileMenu = document.getElementById("mobileMenu");

// if (hamburger && mobileMenu) {
    
// hamburger.addEventListener("click", () => {
    
//     // Open / close mobile menu

//      mobileMenu.classList.toggle("active"); 

// // Check if menu is open
//  const isOpen = mobileMenu.classList.contains("active");


//  // Update accessibility
//   hamburger.setAttribute("aria-expanded", isOpen);
//  //  // Change hamburger icon
//   if (isOpen) {

//  hamburger.innerHTML = '<i class="fa-solid fa-xmark"></i>';
//  hamburger.setAttribute( "aria-label", "Close navigation menu" ); 

// } else {
 
// hamburger.innerHTML = '<i class="fa-solid fa-bars"></i>';
// hamburger.setAttribute( "aria-label", "Open navigation menu" );

//  } 

// });

// /* Close menu when a link is clicked */ 
// const mobileLinks = mobileMenu.querySelectorAll("a");
// mobileLinks.forEach((link) => {
// link.addEventListener("click", () => {
// mobileMenu.classList.remove("active"); 
// hamburger.innerHTML = '<i class="fa-solid fa-bars"></i>';
// hamburger.setAttribute( "aria-expanded", "false");

// hamburger.setAttribute( "aria-label", "Open navigation menu"); 

// });

//  });

//  }

// //  DARK / LIGHT MODE


//  const backgroundChanger = document.getElementById("background"); 
 
//  if (backgroundChanger){ backgroundChanger.addEventListener("click", () => {
// document.body.classList.toggle("dark-mode"); 
// const darkMode = document.body.classList.contains("dark-mode"); if (darkMode) {
//  backgroundChanger.innerHTML = '<i class="fa-solid fa-sun"></i>'; 
//  backgroundChanger.setAttribute( "aria-label", "Switch to light mode" );
// } else {
    
// backgroundChanger.innerHTML = '<i class="fa-solid fa-moon"></i>';
//  backgroundChanger.setAttribute( "aria-label", "Switch to dark mode" );
//  }

//  });

// }

// // CLOSE MOBILE MENU WHEN SCREEN GETS BIGGER

// window.addEventListener("resize", () => {
// if (window.innerWidth > 767) { if (mobileMenu) { 
// mobileMenu.classList.remove("active"); 

// }

// if (hamburger) { 
// hamburger.innerHTML = '<i class="fa-solid fa-bars"></i>';
// hamburger.setAttribute( "aria-expanded", "false" );
// hamburger.setAttribute( "aria-label", "Open navigation menu" );
//  }
  
//   }

//   });








// =========================================
// MOBILE NAVIGATION
// =========================================

const hamburger = document.getElementById("hamburger");
const mobileMenu = document.getElementById("mobileMenu");

if (hamburger && mobileMenu) {

    hamburger.addEventListener("click", () => {

        // Open / close mobile menu
        mobileMenu.classList.toggle("active");

        // Check if menu is open
        const isOpen = mobileMenu.classList.contains("active");

        // Update accessibility
        hamburger.setAttribute("aria-expanded", isOpen);

        // Change hamburger icon
        if (isOpen) {

            hamburger.innerHTML =
                '<i class="fa-solid fa-xmark"></i>';

            hamburger.setAttribute(
                "aria-label",
                "Close navigation menu"
            );

        } else {

            hamburger.innerHTML =
                '<i class="fa-solid fa-bars"></i>';

            hamburger.setAttribute(
                "aria-label",
                "Open navigation menu"
            );
        }

    });


    /* =========================================
       CLOSE MENU WHEN A LINK IS CLICKED
    ========================================= */

    const mobileLinks = mobileMenu.querySelectorAll("a");

    mobileLinks.forEach((link) => {

        link.addEventListener("click", () => {

            mobileMenu.classList.remove("active");

            hamburger.innerHTML =
                '<i class="fa-solid fa-bars"></i>';

            hamburger.setAttribute(
                "aria-expanded",
                "false"
            );

            hamburger.setAttribute(
                "aria-label",
                "Open navigation menu"
            );

        });

    });

}


// =========================================
// DARK / LIGHT MODE WITH LOCAL STORAGE
// =========================================

const backgroundChanger =
    document.getElementById("background");


// Get saved theme from Local Storage
const savedTheme =
    localStorage.getItem("theme");


// Apply saved theme when page loads
if (savedTheme === "dark-mode") {

    document.body.classList.add("dark-mode");

    if (backgroundChanger) {

        backgroundChanger.innerHTML =
            '<i class="fa-solid fa-sun"></i>';

        backgroundChanger.setAttribute(
            "aria-label",
            "Switch to light mode"
        );
    }

} else {

    // Default theme is light mode
    document.body.classList.remove("dark-mode");

    if (backgroundChanger) {

        backgroundChanger.innerHTML =
            '<i class="fa-solid fa-moon"></i>';

        backgroundChanger.setAttribute(
            "aria-label",
            "Switch to dark mode"
        );
    }
}


// =========================================
// CHANGE THEME
// =========================================

if (backgroundChanger) {

    backgroundChanger.addEventListener("click", () => {

        // Toggle dark mode
        document.body.classList.toggle("dark-mode");

        // Check current mode
        const darkMode =
            document.body.classList.contains("dark-mode");


        if (darkMode) {

            // Save dark mode
            localStorage.setItem(
                "theme",
                "dark-mode"
            );

            // Change icon to sun
            backgroundChanger.innerHTML =
                '<i class="fa-solid fa-sun"></i>';

            backgroundChanger.setAttribute(
                "aria-label",
                "Switch to light mode"
            );

        } else {

            // Save light mode
            localStorage.setItem(
                "theme",
                "light-mode"
            );

            // Change icon to moon
            backgroundChanger.innerHTML =
                '<i class="fa-solid fa-moon"></i>';

            backgroundChanger.setAttribute(
                "aria-label",
                "Switch to dark mode"
            );
        }

    });

}


// =========================================
// CLOSE MOBILE MENU WHEN SCREEN GETS BIGGER
// =========================================

window.addEventListener("resize", () => {

    if (window.innerWidth > 767) {

        if (mobileMenu) {

            mobileMenu.classList.remove("active");

        }

        if (hamburger) {

            hamburger.innerHTML =
                '<i class="fa-solid fa-bars"></i>';

            hamburger.setAttribute(
                "aria-expanded",
                "false"
            );

            hamburger.setAttribute(
                "aria-label",
                "Open navigation menu"
            );
        }

    }

});


