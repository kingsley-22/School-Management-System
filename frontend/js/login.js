/* =========================================================
   IFEXA ACADEMY
   LOGIN + SIGN UP
   NO LOCALSTORAGE
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       HELPER FUNCTIONS
    ===================================================== */

    function showError(input, errorElement, message) {
        if (errorElement) {
            errorElement.textContent = message;
        }

        if (input) {
            input.classList.add("error");
        }
    }

    function clearError(input, errorElement) {
        if (errorElement) {
            errorElement.textContent = "";
        }

        if (input) {
            input.classList.remove("error");
        }
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }


    /* =====================================================
       PASSWORD SHOW / HIDE
    ===================================================== */

    function setupPasswordToggle(toggleId, inputId) {

        const toggle = document.getElementById(toggleId);
        const input = document.getElementById(inputId);

        if (!toggle || !input) {
            return;
        }

        toggle.addEventListener("click", () => {

            if (input.type === "password") {

                input.type = "text";

                toggle.classList.remove("fa-eye");
                toggle.classList.add("fa-eye-slash");

            } else {

                input.type = "password";

                toggle.classList.remove("fa-eye-slash");
                toggle.classList.add("fa-eye");
            }
        });
    }


    /* =====================================================
       LOGIN PASSWORD TOGGLE
    ===================================================== */

    setupPasswordToggle(
        "passwordToggle",
        "password"
    );


    /* =====================================================
       SIGNUP PASSWORD TOGGLE
    ===================================================== */

    setupPasswordToggle(
        "signupPasswordToggle",
        "password"
    );


    /* =====================================================
       SIGN UP FORM
    ===================================================== */

    const signupForm =
        document.getElementById("signupForm");

    if (signupForm) {

        const firstName =
            document.getElementById("first-name");

        const lastName =
            document.getElementById("last-name");

        const email =
            document.getElementById("email");

        const password =
            document.getElementById("password");

        const confirmPassword =
            document.getElementById("confirm-password");

        const terms =
            document.getElementById("terms");


        /* Error messages */

        const firstNameError =
            document.getElementById("firstNameError");

        const lastNameError =
            document.getElementById("lastNameError");

        const emailError =
            document.getElementById("signupEmailError");

        const passwordError =
            document.getElementById("signupPasswordError");

        const confirmPasswordError =
            document.getElementById("confirmPasswordError");

        const termsError =
            document.getElementById("termsError");


        /* =================================================
           PASSWORD VALIDATION
        ================================================= */

        function validatePassword(passwordValue) {

            const commonPasswords = [
                "password",
                "password1",
                "password123",
                "12345678",
                "123456789",
                "1234567890",
                "qwerty",
                "qwerty123",
                "admin",
                "admin123",
                "letmein",
                "welcome",
                "welcome123",
                "iloveyou",
                "abc123",
                "11111111",
                "00000000"
            ];


            /* At least 8 characters */

            if (passwordValue.length < 8) {
                return "Password must contain at least 8 characters.";
            }


            /* Cannot be entirely numeric */

            if (/^\d+$/.test(passwordValue)) {
                return "Your password can't be entirely numeric.";
            }


            /* Cannot be commonly used */

            if (
                commonPasswords.includes(
                    passwordValue.toLowerCase()
                )
            ) {
                return "Your password can't be commonly used.";
            }


            return "";
        }


        /* =================================================
           SIGN UP SUBMIT
        ================================================= */

        signupForm.addEventListener("submit", (event) => {

            event.preventDefault();

            /* Clear previous errors */

            clearError(firstName, firstNameError);
            clearError(lastName, lastNameError);
            clearError(email, emailError);
            clearError(password, passwordError);
            clearError(
                confirmPassword,
                confirmPasswordError
            );

            if (termsError) {
                termsError.textContent = "";
            }


            let isValid = true;


            /* =============================================
               FIRST NAME
            ============================================= */

            const firstNameValue =
                firstName.value.trim();

            if (firstNameValue === "") {

                showError(
                    firstName,
                    firstNameError,
                    "Please enter your first name."
                );

                isValid = false;
            }


            /* =============================================
               LAST NAME
            ============================================= */

            const lastNameValue =
                lastName.value.trim();

            if (lastNameValue === "") {

                showError(
                    lastName,
                    lastNameError,
                    "Please enter your last name."
                );

                isValid = false;
            }


            /* =============================================
               EMAIL
            ============================================= */

            const emailValue =
                email.value.trim().toLowerCase();

            if (emailValue === "") {

                showError(
                    email,
                    emailError,
                    "Please enter your email address."
                );

                isValid = false;

            } else if (!isValidEmail(emailValue)) {

                showError(
                    email,
                    emailError,
                    "Please enter a valid email address."
                );

                isValid = false;
            }


            /* =============================================
               PASSWORD
            ============================================= */

            const passwordValue =
                password.value;

            const passwordMessage =
                validatePassword(passwordValue);

            if (passwordMessage !== "") {

                showError(
                    password,
                    passwordError,
                    passwordMessage
                );

                isValid = false;
            }


            /* =============================================
               CONFIRM PASSWORD
            ============================================= */

            const confirmPasswordValue =
                confirmPassword.value;

            if (confirmPasswordValue === "") {

                showError(
                    confirmPassword,
                    confirmPasswordError,
                    "Please confirm your password."
                );

                isValid = false;

            } else if (
                passwordValue !== confirmPasswordValue
            ) {

                showError(
                    confirmPassword,
                    confirmPasswordError,
                    "Passwords do not match."
                );

                isValid = false;
            }


            /* =============================================
               TERMS
            ============================================= */

            if (!terms.checked) {

                if (termsError) {
                    termsError.textContent =
                        "You must agree to the Terms of Service and Privacy Policy.";
                }

                isValid = false;
            }


            /* =============================================
               STOP IF INVALID
            ============================================= */

            if (!isValid) {
                return;
            }


            /* =============================================
               TEMPORARY SUCCESS
               
               NO LOCALSTORAGE
               NO PASSWORD STORAGE
            ============================================= */

            alert(
                "Your information has been validated successfully."
            );

            /*
             * Django will be connected here later.
             *
             * Example:
             *
             * fetch("/accounts/register/", {
             *     method: "POST",
             *     body: new FormData(signupForm)
             * });
             */

        });


        /* =================================================
           CLEAR ERRORS WHILE TYPING
        ================================================= */

        firstName.addEventListener("input", () => {
            clearError(firstName, firstNameError);
        });

        lastName.addEventListener("input", () => {
            clearError(lastName, lastNameError);
        });

        email.addEventListener("input", () => {
            clearError(email, emailError);
        });

        password.addEventListener("input", () => {
            clearError(password, passwordError);
        });

        confirmPassword.addEventListener("input", () => {
            clearError(
                confirmPassword,
                confirmPasswordError
            );
        });

        terms.addEventListener("change", () => {

            if (termsError) {
                termsError.textContent = "";
            }
        });
    }


    /* =====================================================
       LOGIN FORM
    ===================================================== */

    const loginForm =
        document.getElementById("loginForm");

    if (loginForm) {

        const email =
            document.getElementById("email");

        const password =
            document.getElementById("password");

        const emailError =
            document.getElementById("emailError");

        const passwordError =
            document.getElementById("passwordError");

        const rememberMe =
            loginForm.querySelector(
                'input[name="remember"]'
            );


        /* =================================================
           LOGIN SUBMIT
        ================================================= */

        loginForm.addEventListener("submit", (event) => {

            event.preventDefault();

            clearError(email, emailError);
            clearError(password, passwordError);

            let isValid = true;


            const emailValue =
                email.value.trim().toLowerCase();

            const passwordValue =
                password.value;


            /* =============================================
               EMAIL
            ============================================= */

            if (emailValue === "") {

                showError(
                    email,
                    emailError,
                    "Please enter your email address."
                );

                isValid = false;

            } else if (!isValidEmail(emailValue)) {

                showError(
                    email,
                    emailError,
                    "Please enter a valid email address."
                );

                isValid = false;
            }


            /* =============================================
               PASSWORD
            ============================================= */

            if (passwordValue === "") {

                showError(
                    password,
                    passwordError,
                    "Please enter your password."
                );

                isValid = false;
            }


            if (!isValid) {
                return;
            }


            /* =============================================
               NO LOCALSTORAGE AUTHENTICATION
            ============================================= */

            /*
             * Django authentication will be connected here.
             *
             * Example:
             *
             * fetch("/accounts/login/", {
             *     method: "POST",
             *     body: new FormData(loginForm)
             * });
             */


            alert(
                "Login information is valid. Django authentication will be connected here."
            );

        });


        /* =================================================
           CLEAR ERRORS WHILE TYPING
        ================================================= */

        email.addEventListener("input", () => {
            clearError(email, emailError);
        });

        password.addEventListener("input", () => {
            clearError(password, passwordError);
        });

    }

});