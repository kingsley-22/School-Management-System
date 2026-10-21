
/* =====================================================
   FORGOT PASSWORD
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("forgotPasswordForm");

    if (!form) return;

    const emailInput = document.getElementById("reset-email");
    const emailError = document.getElementById("resetEmailError");
    const resetButton = document.getElementById("resetButton");
    const resetButtonText = document.getElementById("resetButtonText");
    const resetButtonIcon = document.getElementById("resetButtonIcon");

    const forgotPasswordContent =
        document.getElementById("forgotPasswordContent");

    const resetSuccess = document.getElementById("resetSuccess");
    const submittedEmail = document.getElementById("submittedEmail");
    const resendButton = document.getElementById("resendButton");
    const resendButtonText = document.getElementById("resendButtonText");

    // Validate email.
    function validateEmail() {
        const email = emailInput.value.trim();

        emailError.textContent = "";
        emailInput.classList.remove("error");

        if (!email) {
            emailError.textContent = "Please enter your email address.";
            emailInput.classList.add("error");
            return false;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            emailError.textContent = "Please enter a valid email address.";
            emailInput.classList.add("error");
            return false;
        }

        return true;
    }

    // Send a real request to Django.
    async function sendResetRequest(email) {
        const response = await fetch(
            "http://127.0.0.1:8000/api/forgot-password/",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error ||
                data.detail ||
                "Unable to request a password reset."
            );
        }

        return data;
    }

    // Submit the form.
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!validateEmail()) return;

        const email = emailInput.value.trim().toLowerCase();

        resetButton.disabled = true;
        resetButtonText.textContent = "Sending...";
        resetButtonIcon.className = "fa-solid fa-spinner fa-spin";

        try {
            await sendResetRequest(email);

            sessionStorage.setItem("resetEmail", email);

            if (submittedEmail) {
                submittedEmail.textContent = email;
            }

            if (forgotPasswordContent) {
                forgotPasswordContent.hidden = true;
            }

            if (resetSuccess) {
                resetSuccess.hidden = false;
            }

        } catch (error) {
            emailError.textContent =
                error.message || "Could not connect to Django.";

            emailInput.classList.add("error");

        } finally {
            resetButton.disabled = false;
            resetButtonText.textContent = "Send Reset Link";
            resetButtonIcon.className = "fa-solid fa-paper-plane";
        }
    });

    // Send the request again.
    if (resendButton) {
        resendButton.addEventListener("click", async () => {
            const email = sessionStorage.getItem("resetEmail");

            if (!email) {
                if (resetSuccess) resetSuccess.hidden = true;
                if (forgotPasswordContent) {
                    forgotPasswordContent.hidden = false;
                }
                emailInput.focus();
                return;
            }

            resendButton.disabled = true;

            if (resendButtonText) {
                resendButtonText.textContent = "Sending...";
            }

            try {
                await sendResetRequest(email);

                if (resendButtonText) {
                    resendButtonText.textContent = "Link Sent!";
                }

            } catch (error) {
                if (resendButtonText) {
                    resendButtonText.textContent = "Try Again";
                }

                alert(error.message || "Unable to resend the email.");

            } finally {
                resendButton.disabled = false;

                setTimeout(() => {
                    if (resendButtonText) {
                        resendButtonText.textContent = "Send Again";
                    }
                }, 3000);
            }
        });
    }

    // Clear errors while typing.
    emailInput.addEventListener("input", () => {
        emailError.textContent = "";
        emailInput.classList.remove("error");
    });
});
