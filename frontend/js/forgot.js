/* =====================================================
   FORGOT PASSWORD
===================================================== */

const forgotPasswordForm =
    document.getElementById("forgotPasswordForm");


if (forgotPasswordForm) {

    /* =================================================
       GET ELEMENTS
    ================================================= */

    const emailInput =
        document.getElementById("reset-email");

    const emailError =
        document.getElementById("resetEmailError");

    const resetButton =
        document.getElementById("resetButton");

    const resetButtonText =
        document.getElementById("resetButtonText");

    const resetButtonIcon =
        document.getElementById("resetButtonIcon");

    const forgotPasswordContent =
        document.getElementById("forgotPasswordContent");

    const resetSuccess =
        document.getElementById("resetSuccess");

    const submittedEmail =
        document.getElementById("submittedEmail");

    const resendButton =
        document.getElementById("resendButton");

    const resendButtonText =
        document.getElementById("resendButtonText");


    /* =================================================
       EMAIL VALIDATION
    ================================================= */

    function validateResetEmail() {

        const email =
            emailInput.value.trim().toLowerCase();


        emailError.textContent = "";

        emailInput.classList.remove("error");


        if (email === "") {

            emailError.textContent =
                "Please enter your email address.";

            emailInput.classList.add("error");

            return false;
        }


        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (!emailPattern.test(email)) {

            emailError.textContent =
                "Please enter a valid email address.";

            emailInput.classList.add("error");

            return false;
        }


        return true;
    }


    /* =================================================
       SUBMIT FORM
    ================================================= */

    forgotPasswordForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            /* Validate */

            if (!validateResetEmail()) {

                return;

            }


            const email =
                emailInput.value.trim().toLowerCase();


            /* =================================================
               LOADING STATE
            ================================================= */

            resetButton.disabled = true;

            resetButtonText.textContent =
                "Checking...";

            resetButtonIcon.className =
                "fa-solid fa-spinner fa-spin";


            /*
             * TEMPORARY FRONTEND DEMO
             *
             * Later, Django will replace this section.
             */

            setTimeout(function () {


                /* Save email */

                sessionStorage.setItem(
                    "resetEmail",
                    email
                );


                /* Show email */

                submittedEmail.textContent =
                    email;


                /* Hide form */

                forgotPasswordContent.hidden =
                    true;


                /* Show success */

                resetSuccess.hidden =
                    false;


                /* Restore button */

                resetButton.disabled =
                    false;

                resetButtonText.textContent =
                    "Send Reset Link";

                resetButtonIcon.className =
                    "fa-solid fa-paper-plane";


            }, 1200);

        }
    );


    /* =================================================
       SEND AGAIN
    ================================================= */

    if (resendButton) {

        resendButton.addEventListener(
            "click",
            function () {


                const email =
                    sessionStorage.getItem(
                        "resetEmail"
                    );


                if (!email) {

                    resetSuccess.hidden =
                        true;

                    forgotPasswordContent.hidden =
                        false;

                    emailInput.focus();

                    return;

                }


                /* Loading */

                resendButton.disabled =
                    true;

                resendButtonText.textContent =
                    "Sending...";


                /* Temporary simulation */

                setTimeout(function () {

                    resendButton.disabled =
                        false;

                    resendButtonText.textContent =
                        "Link Sent!";


                    /*
                     * Return button text
                     * after 3 seconds.
                     */

                    setTimeout(function () {

                        resendButtonText.textContent =
                            "Send Again";

                    }, 3000);


                }, 1200);

            }
        );

    }


    /* =================================================
       CLEAR ERROR WHILE TYPING
    ================================================= */

    emailInput.addEventListener(
        "input",
        function () {

            emailError.textContent = "";

            emailInput.classList.remove("error");

        }
    );

}