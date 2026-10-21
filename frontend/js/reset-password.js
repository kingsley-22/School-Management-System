
/* =====================================================
   RESET PASSWORD
===================================================== */

const resetPasswordForm = document.getElementById("resetPasswordForm");

if (resetPasswordForm) {
    const newPassword = document.getElementById("new-password");
    const confirmNewPassword = document.getElementById("confirm-new-password");

    const newPasswordError = document.getElementById("newPasswordError");
    const confirmNewPasswordError = document.getElementById("confirmNewPasswordError");

    const resetMessage = document.getElementById("resetMessage");
    const submitButton = resetPasswordForm.querySelector('button[type="submit"]');

    // Get the UID and token from the reset link sent by Django.
    const params = new URLSearchParams(window.location.search);
    const uid = params.get("uid");
    const token = params.get("token");

    // Show and hide passwords.
    function setupPasswordToggle(input, toggle) {
        if (!input || !toggle) return;

        toggle.addEventListener("click", function () {
            const showPassword = input.type === "password";

            input.type = showPassword ? "text" : "password";

            toggle.classList.toggle("fa-eye", !showPassword);
            toggle.classList.toggle("fa-eye-slash", showPassword);
        });
    }

    setupPasswordToggle(
        newPassword,
        document.getElementById("newPasswordToggle")
    );

    setupPasswordToggle(
        confirmNewPassword,
        document.getElementById("confirmNewPasswordToggle")
    );

    // Display the password reset requirements.
    const lengthRequirement = document.getElementById("lengthRequirement");
    const letterRequirement = document.getElementById("letterRequirement");
    const numberRequirement = document.getElementById("numberRequirement");

    newPassword.addEventListener("input", function () {
        const password = newPassword.value;

        if (lengthRequirement) {
            lengthRequirement.classList.toggle("valid", password.length >= 8);
        }

        if (letterRequirement) {
            letterRequirement.classList.toggle("valid", /[A-Za-z]/.test(password));
        }

        if (numberRequirement) {
            numberRequirement.classList.toggle("valid", /[0-9]/.test(password));
        }

        newPasswordError.textContent = "";
        newPassword.classList.remove("error");
    });

    confirmNewPassword.addEventListener("input", function () {
        confirmNewPasswordError.textContent = "";
        confirmNewPassword.classList.remove("error");
    });

    function showMessage(message, type) {
        if (!resetMessage) {
            alert(message);
            return;
        }

        resetMessage.textContent = message;
        resetMessage.className = `form-message ${type}`;
        resetMessage.hidden = false;
    }

    // A valid reset link must contain both values.
    if (!uid || !token) {
        showMessage(
            "This reset link is invalid or incomplete. Please request a new one.",
            "error"
        );

        submitButton.disabled = true;
    }

    // Submit the new password to Django.
    resetPasswordForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        newPasswordError.textContent = "";
        confirmNewPasswordError.textContent = "";

        newPassword.classList.remove("error");
        confirmNewPassword.classList.remove("error");

        if (resetMessage) {
            resetMessage.hidden = true;
        }

        const password = newPassword.value;
        const confirmation = confirmNewPassword.value;

        if (password.length < 8) {
            newPasswordError.textContent =
                "Password must be at least 8 characters.";
            newPassword.classList.add("error");
            return;
        }

        if (!/[A-Za-z]/.test(password)) {
            newPasswordError.textContent =
                "Password must contain at least one letter.";
            newPassword.classList.add("error");
            return;
        }

        if (!/[0-9]/.test(password)) {
            newPasswordError.textContent =
                "Password must contain at least one number.";
            newPassword.classList.add("error");
            return;
        }

        if (password !== confirmation) {
            confirmNewPasswordError.textContent =
                "Passwords do not match.";
            confirmNewPassword.classList.add("error");
            return;
        }

        const originalButtonHTML = submitButton.innerHTML;

        submitButton.disabled = true;
        submitButton.textContent = "Resetting password...";

        try {
            const response = await fetch(
                `http://127.0.0.1:8000/api/reset-password/${encodeURIComponent(uid)}/${encodeURIComponent(token)}/`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        new_password: password,
                        confirm_password: confirmation
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                showMessage(
                    data.error || data.detail ||
                    "Could not reset your password. Please request a new link.",
                    "error"
                );
                return;
            }

            // Clear the form and display success.
            resetPasswordForm.reset();

            if (lengthRequirement) lengthRequirement.classList.remove("valid");
            if (letterRequirement) letterRequirement.classList.remove("valid");
            if (numberRequirement) numberRequirement.classList.remove("valid");

            showMessage(
                data.message ||
                "Password reset successful! You can now log in.",
                "success"
            );

            // Add a link back to login.
            if (resetMessage) {
                const loginLink = document.createElement("a");
                loginLink.href = "./login.html";
                loginLink.textContent = "Go to Login";
                loginLink.style.display = "inline-block";
                loginLink.style.marginTop = "12px";

                resetMessage.appendChild(document.createElement("br"));
                resetMessage.appendChild(loginLink);
            }

        } catch (error) {
            showMessage(
                "Unable to connect to the server. Please try again.",
                "error"
            );
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonHTML;
        }
    });
}
