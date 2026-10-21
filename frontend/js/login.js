
/* =========================================================
   IFEXA ACADEMY
   LOGIN + SIGN UP
   DJANGO API AUTHENTICATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const API_BASE_URL = "http://127.0.0.1:8000/api/";

    /* =====================================================
       HELPER FUNCTIONS
    ===================================================== */

    function showError(input, errorElement, message) {
        if (errorElement) {
            errorElement.textContent = message;
        }

        if (input) {
            input.classList.add("error");
            input.setAttribute("aria-invalid", "true");
        }
    }

    function clearError(input, errorElement) {
        if (errorElement) {
            errorElement.textContent = "";
        }

        if (input) {
            input.classList.remove("error");
            input.removeAttribute("aria-invalid");
        }
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function validatePassword(password) {
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

        if (password.length < 8) {
            return "Password must contain at least 8 characters.";
        }

        if (/^\d+$/.test(password)) {
            return "Your password can't be entirely numeric.";
        }

        if (commonPasswords.includes(password.toLowerCase())) {
            return "Your password can't be commonly used.";
        }

        return "";
    }

    /* Display messages returned by Django, including field errors. */
    function formatBackendErrors(errors) {
        if (typeof errors === "string") {
            return errors;
        }

        if (Array.isArray(errors)) {
            return errors.map(formatBackendErrors).join(" ");
        }

        if (errors && typeof errors === "object") {
            return Object.entries(errors)
                .map(([field, messages]) => {
                    const fieldName = field
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, letter => letter.toUpperCase());

                    return `${fieldName}: ${formatBackendErrors(messages)}`;
                })
                .join(" ");
        }

        return "Something went wrong. Please try again.";
    }

    async function readResponse(response) {
        const text = await response.text();

        if (!text) {
            return {};
        }

        try {
            return JSON.parse(text);
        } catch {
            return {
                error: "The server returned an unexpected response."
            };
        }
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

        toggle.addEventListener("click", event => {
            event.preventDefault();

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

    setupPasswordToggle("passwordToggle", "password");
    setupPasswordToggle("signupPasswordToggle", "password");

    /* =====================================================
       SIGN UP FORM
    ===================================================== */

    const signupForm = document.getElementById("signupForm");

    if (signupForm) {
        const firstName = document.getElementById("first-name");
        const lastName = document.getElementById("last-name");
        const email = document.getElementById("email");
        const password = document.getElementById("password");
        const confirmPassword = document.getElementById("confirm-password");
        const terms = document.getElementById("terms");

        const firstNameError = document.getElementById("firstNameError");
        const lastNameError = document.getElementById("lastNameError");
        const emailError = document.getElementById("signupEmailError");
        const passwordError = document.getElementById("signupPasswordError");
        const confirmPasswordError = document.getElementById("confirmPasswordError");
        const termsError = document.getElementById("termsError");

        const signupMessage = document.getElementById("signupMessage");
        const submitButton = signupForm.querySelector('[type="submit"]');

        function showSignupMessage(message, type = "error") {
            if (!signupMessage) {
                console[type === "error" ? "error" : "log"](message);
                return;
            }

            signupMessage.textContent = message;
            signupMessage.className = `form-message ${type}`;
            signupMessage.style.display = "block";
        }

        function clearSignupMessage() {
            if (signupMessage) {
                signupMessage.textContent = "";
                signupMessage.className = "form-message";
                signupMessage.style.display = "none";
            }
        }

        signupForm.addEventListener("submit", async event => {
            event.preventDefault();
            
            clearSignupMessage();

            if (!firstName || !lastName || !email ||
                !password || !confirmPassword) {
                showSignupMessage(
                    "A required signup field could not be found. Please check the form HTML."
                );
                return;
            }

            clearError(firstName, firstNameError);
            clearError(lastName, lastNameError);
            clearError(email, emailError);
            clearError(password, passwordError);
            clearError(confirmPassword, confirmPasswordError);

            if (termsError) {
                termsError.textContent = "";
            }

            let isValid = true;

            if (!firstName.value.trim()) {
                showError(firstName, firstNameError, "Please enter your first name.");
                isValid = false;
            }

            if (!lastName.value.trim()) {
                showError(lastName, lastNameError, "Please enter your last name.");
                isValid = false;
            }

            const emailValue = email.value.trim().toLowerCase();
            const passwordValue = password.value;
            const confirmPasswordValue = confirmPassword.value;

            if (!emailValue) {
                showError(email, emailError, "Please enter your email address.");
                isValid = false;
            } else if (!isValidEmail(emailValue)) {
                showError(email, emailError, "Please enter a valid email address.");
                isValid = false;
            }

            const passwordMessage = validatePassword(passwordValue);

            if (passwordMessage) {
                showError(password, passwordError, passwordMessage);
                isValid = false;
            }

            if (passwordValue !== confirmPasswordValue) {
                showError(
                    confirmPassword,
                    confirmPasswordError,
                    "Passwords do not match."
                );
                isValid = false;
            }

            if (terms && !terms.checked) {
                if (termsError) {
                    termsError.textContent = "Please accept the terms and conditions.";
                }
                isValid = false;
            }

            if (!isValid) {
                showSignupMessage("Please correct the highlighted fields.");
                return;
            }

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.dataset.originalText =
                    submitButton.textContent;
                submitButton.textContent = "Creating account...";
            }

            try {
                const response = await fetch(`${API_BASE_URL}register/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({
                        first_name: firstName.value.trim(),
                        last_name: lastName.value.trim(),
                        email: emailValue,
                        password: passwordValue,
                        confirm_password: confirmPasswordValue
                    })
                });

                const data = await readResponse(response);

                if (!response.ok) {
                    const errorMessage = formatBackendErrors(data);
                    showSignupMessage(errorMessage, "error");

                    /* Put Django's field errors beside their inputs too. */
                    if (data.email) {
                        showError(
                            email,
                            emailError,
                            formatBackendErrors(data.email)
                        );
                    }

                    if (data.password) {
                        showError(
                            password,
                            passwordError,
                            formatBackendErrors(data.password)
                        );
                    }

                    if (data.first_name) {
                        showError(
                            firstName,
                            firstNameError,
                            formatBackendErrors(data.first_name)
                        );
                    }

                    if (data.last_name) {
                        showError(
                            lastName,
                            lastNameError,
                            formatBackendErrors(data.last_name)
                        );
                    }

                    if (data.confirm_password) {
                        showError(
                            confirmPassword,
                            confirmPasswordError,
                            formatBackendErrors(data.confirm_password)
                        );
                    }

                    return;
                }
                 
                signupForm.reset();

                showSignupMessage(
                    data.message || "Registration successful. Please check your email.",
                    "success"
                );

                

               

            } catch (error) {
                console.error("Signup request failed:", error);

                showSignupMessage(
                    "Unable to connect to Django. Make sure the backend is running and CORS is configured correctly.",
                    "error"
                );

            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent =
                        submitButton.dataset.originalText || "Create Account";
                }
            }
        });

        /* Clear individual errors as the user types. */
        if (firstName) {
            firstName.addEventListener("input", () =>
                clearError(firstName, firstNameError)
            );
        }

        if (lastName) {
            lastName.addEventListener("input", () =>
                clearError(lastName, lastNameError)
            );
        }

        if (email) {
            email.addEventListener("input", () =>
                clearError(email, emailError)
            );
        }

        if (password) {
            password.addEventListener("input", () =>
                clearError(password, passwordError)
            );
        }

        if (confirmPassword) {
            confirmPassword.addEventListener("input", () =>
                clearError(confirmPassword, confirmPasswordError)
            );
        }

        if (terms) {
            terms.addEventListener("change", () => {
                if (termsError) {
                    termsError.textContent = "";
                }
            });
        }
    }

    /* =====================================================
       LOGIN FORM
    ===================================================== */

    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        const email = document.getElementById("email");
        const password = document.getElementById("password");
        const emailError = document.getElementById("emailError");
        const passwordError = document.getElementById("passwordError");

        loginForm.addEventListener("submit", async event => {
            event.preventDefault();

            clearError(email, emailError);
            clearError(password, passwordError);

            if (!email || !password) {
                console.error("Login email or password field is missing.");
                return;
            }

            let isValid = true;

            const emailValue = email.value.trim().toLowerCase();
            const passwordValue = password.value;

            if (!emailValue) {
                showError(email, emailError, "Please enter your email address.");
                isValid = false;
            } else if (!isValidEmail(emailValue)) {
                showError(email, emailError, "Please enter a valid email address.");
                isValid = false;
            }

            if (!passwordValue) {
                showError(password, passwordError, "Please enter your password.");
                isValid = false;
            }

            if (!isValid) {
                return;
            }

            const submitButton = loginForm.querySelector('[type="submit"]');

            if (submitButton) {
                submitButton.disabled = true;
            }

            try {
                const response = await fetch(`${API_BASE_URL}login/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({
                        email: emailValue,
                        password: passwordValue
                    })
                });

                const data = await readResponse(response);

                if (!response.ok) {
                    const message = formatBackendErrors(data);

                    showError(
                        password,
                        passwordError,
                        message || "Login failed. Please check your credentials."
                    );
                    return;
                }

                sessionStorage.setItem("accessToken", data.access);
                sessionStorage.setItem("refreshToken", data.refresh);
                sessionStorage.setItem("user", JSON.stringify(data.user));

                /* Redirect based on the user's role. */
                if (data.user.role === "ADMIN") {
                    window.location.href = "../admin/admin.html";

                } else if (data.user.role === "INSTRUCTOR") {
                    window.location.href = "../instructor/instructor-dashboard.html";

                } else if (data.user.role === "STUDENT") {
                    window.location.href = "../student/student-dashboard.html";

                } else if (data.user.role === "SUPER_ADMIN") {
                    window.location.href = "../admin/admin.html";

                } else {
                    window.location.href = "../dashboard.html";
                }

            } catch (error) {
                console.error("Login request failed:", error);

                showError(
                    password,
                    passwordError,
                    "Unable to connect to the server. Please make sure Django is running."
                );

            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                }
            }
        });

        /* Clear login errors while typing. */
        if (email) {
            email.addEventListener("input", () =>
                clearError(email, emailError)
            );
        }

        if (password) {
            password.addEventListener("input", () =>
                clearError(password, passwordError)
            );
        }
    }

});
