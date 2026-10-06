/* =====================================================
   RESET PASSWORD
===================================================== */

const resetPasswordForm =
    document.getElementById("resetPasswordForm");


if (resetPasswordForm) {

    /* ---------------------------------------------
       PASSWORD TOGGLE
    --------------------------------------------- */

    const newPassword =
        document.getElementById("new-password");

    const confirmNewPassword =
        document.getElementById("confirm-new-password");

    const newPasswordToggle =
        document.getElementById("newPasswordToggle");

    const confirmNewPasswordToggle =
        document.getElementById("confirmNewPasswordToggle");


    function setupPasswordToggle(input, toggle) {

        if (!input || !toggle) return;

        toggle.addEventListener("click", function () {

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


    setupPasswordToggle(
        newPassword,
        newPasswordToggle
    );


    setupPasswordToggle(
        confirmNewPassword,
        confirmNewPasswordToggle
    );


    /* ---------------------------------------------
       PASSWORD REQUIREMENTS
    --------------------------------------------- */

    const lengthRequirement =
        document.getElementById("lengthRequirement");

    const letterRequirement =
        document.getElementById("letterRequirement");

    const numberRequirement =
        document.getElementById("numberRequirement");


    newPassword.addEventListener("input", function () {

        const password = newPassword.value;


        /* 8 characters */

        if (password.length >= 8) {

            lengthRequirement.classList.add("valid");

        } else {

            lengthRequirement.classList.remove("valid");

        }


        /* Letter */

        if (/[A-Za-z]/.test(password)) {

            letterRequirement.classList.add("valid");

        } else {

            letterRequirement.classList.remove("valid");

        }


        /* Number */

        if (/[0-9]/.test(password)) {

            numberRequirement.classList.add("valid");

        } else {

            numberRequirement.classList.remove("valid");

        }

    });


    /* ---------------------------------------------
       SUBMIT FORM
    --------------------------------------------- */

    resetPasswordForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const newPasswordError =
                document.getElementById(
                    "newPasswordError"
                );

            const confirmNewPasswordError =
                document.getElementById(
                    "confirmNewPasswordError"
                );


            /* Clear errors */

            newPasswordError.textContent = "";
            confirmNewPasswordError.textContent = "";

            newPassword.classList.remove("error");
            confirmNewPassword.classList.remove("error");


            /* -----------------------------------------
               GET RESET EMAIL
            ----------------------------------------- */

            const resetEmail =
                sessionStorage.getItem("resetEmail");


            if (!resetEmail) {

                alert(
                    "Your password reset session has expired. Please request a new reset link."
                );

                window.location.href =
                    "./forgot-password.html";

                return;

            }


            /* -----------------------------------------
               PASSWORD VALIDATION
            ----------------------------------------- */

            if (newPassword.value.length < 8) {

                newPasswordError.textContent =
                    "Password must be at least 8 characters.";

                newPassword.classList.add("error");

                return;

            }


            if (!/[A-Za-z]/.test(newPassword.value)) {

                newPasswordError.textContent =
                    "Password must contain at least one letter.";

                newPassword.classList.add("error");

                return;

            }


            if (!/[0-9]/.test(newPassword.value)) {

                newPasswordError.textContent =
                    "Password must contain at least one number.";

                newPassword.classList.add("error");

                return;

            }


            /* -----------------------------------------
               CONFIRM PASSWORD
            ----------------------------------------- */

            if (
                newPassword.value !==
                confirmNewPassword.value
            ) {

                confirmNewPasswordError.textContent =
                    "Passwords do not match.";

                confirmNewPassword.classList.add("error");

                return;

            }


            /* -----------------------------------------
               GET SAVED USER
            ----------------------------------------- */

            const savedUser =
                JSON.parse(
                    localStorage.getItem("academyUser")
                );


            if (!savedUser) {

                alert(
                    "Account information could not be found."
                );

                window.location.href =
                    "./forgot-password.html";

                return;

            }


            /* -----------------------------------------
               UPDATE PASSWORD
            ----------------------------------------- */

            savedUser.password =
                newPassword.value;


            localStorage.setItem(
                "academyUser",
                JSON.stringify(savedUser)
            );


            /* Remove reset session */

            sessionStorage.removeItem(
                "resetEmail"
            );


            /* Success */

            alert(
                "Your password has been reset successfully. You can now login."
            );


            /* Return to Reset-password */

            window.location. href="./reset-password.html";

        }
    );

}