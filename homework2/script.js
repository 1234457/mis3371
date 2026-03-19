function checkPasswords() {
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const userId = document.getElementById("userid").value.toLowerCase();
    const firstName = document.getElementById("fname").value.toLowerCase();
    const lastName = document.getElementById("lname").value.toLowerCase();
    const errorSpan = document.getElementById("passwordError");

    errorSpan.style.color = "red";
    errorSpan.textContent = "";

    if (password === "" || confirmPassword === "") {
        return true;
    }

    if (password.includes('"')) {
        errorSpan.textContent = 'Password cannot contain double quotes.';
        return false;
    }

    const htmlPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,30}$/;
    if (!htmlPattern.test(password)) {
        errorSpan.textContent = "Password must be 8-30 characters and include uppercase, lowercase, number, and special character.";
        return false;
    }

    if (password !== confirmPassword) {
        errorSpan.textContent = "Passwords do not match.";
        return false;
    }

    const lowerPassword = password.toLowerCase();

    if (userId !== "" && lowerPassword.includes(userId)) {
        errorSpan.textContent = "Password cannot contain your user ID.";
        return false;
    }

    if (firstName !== "" && lowerPassword.includes(firstName)) {
        errorSpan.textContent = "Password cannot contain your first name.";
        return false;
    }

    if (lastName !== "" && lowerPassword.includes(lastName)) {
        errorSpan.textContent = "Password cannot contain your last name.";
        return false;
    }

    errorSpan.style.color = "green";
    errorSpan.textContent = "Passwords match.";
    return true;
}

function validateForm() {
    const dob = document.getElementById("dob").value;
    const today = new Date().toISOString().split("T")[0];

    if (dob !== "" && dob > today) {
        alert("Date of Birth cannot be in the future.");
        return false;
    }

    if (!checkPasswords()) {
        alert("Please fix the password issue before submitting.");
        return false;
    }

    return true;
}

function reviewForm() {
    const form = document.getElementById("patientForm");

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    if (!checkPasswords()) {
        alert("Please fix the password issue before reviewing.");
        return;
    }

    const fname = document.getElementById("fname").value;
    const mi = document.getElementById("mi").value;
    const lname = document.getElementById("lname").value;
    const fullName = `${fname} ${mi} ${lname}`.replace(/\s+/g, " ").trim();

    const sex = getRadioValue("sex");
    const dob = document.getElementById("dob").value;
    const ssn = document.getElementById("ssn").value;

    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;

    const address1 = document.getElementById("address1").value;
    const address2 = document.getElementById("address2").value;
    const city = document.getElementById("city").value;
    const state = document.getElementById("state").value;
    const zipRaw = document.getElementById("zip").value;
    const zip = zipRaw.substring(0, 5);

    const vaccine = getRadioValue("vaccine");
    const insurance = getRadioValue("insurance");
    const history = getCheckedValues("history").join(", ");

    const symptoms = document.getElementById("symptoms").value;
    const healthScale = document.getElementById("healthScale").value;

    const userIdInput = document.getElementById("userid");
    userIdInput.value = userIdInput.value.toLowerCase();
    const userid = userIdInput.value;

    const reviewArea = document.getElementById("reviewArea");

    const maskedId = ssn === "" ? "" : "*".repeat(ssn.length);
    const today = new Date().toISOString().split("T")[0];

    const fullAddress = `
        ${escapeHtml(address1)}
        ${address2 ? "<br>" + escapeHtml(address2) : ""}
        <br>${escapeHtml(city)}, ${escapeHtml(state)} ${escapeHtml(zip)}
    `;

    function status(condition, errorMsg = "") {
        return condition
            ? `<span style="color:green;">pass</span>`
            : `<span style="color:red;">ERROR: ${escapeHtml(errorMsg)}</span>`;
    }

    reviewArea.innerHTML = `
        <h2>PLEASE REVIEW THIS INFORMATION</h2>

        <table style="width:100%; border-collapse:collapse;">
            <tr>
                <td><strong>First, MI, Last Name</strong></td>
                <td>${escapeHtml(fullName)}</td>
                <td>${status(fullName.length > 0, "Missing name")}</td>
            </tr>

            <tr>
                <td><strong>Sex</strong></td>
                <td>${escapeHtml(sex)}</td>
                <td>${status(sex !== "", "Missing sex selection")}</td>
            </tr>

            <tr>
                <td><strong>Date of Birth</strong></td>
                <td>${escapeHtml(dob)}</td>
                <td>${status(dob !== "" && dob <= today, "Cannot be in the future")}</td>
            </tr>

            <tr>
                <td><strong>SSN / ID Number</strong></td>
                <td>${escapeHtml(maskedId)}</td>
                <td>${status(ssn !== "", "Missing ID number")}</td>
            </tr>

            <tr>
                <td><strong>Email address</strong></td>
                <td>${escapeHtml(email)}</td>
                <td>${status(email.includes("@"), "Invalid email")}</td>
            </tr>

            <tr>
                <td><strong>Phone number</strong></td>
                <td>${escapeHtml(phone)}</td>
                <td>${status(/^\d{3}-\d{3}-\d{4}$/.test(phone), "Format must be 000-000-0000")}</td>
            </tr>

            <tr>
                <td><strong>Address</strong></td>
                <td>${fullAddress}</td>
                <td>${status(zip.length === 5, "Missing Zip Code")}</td>
            </tr>
        </table>

        <h3>REQUESTED INFO</h3>

        <table style="width:100%; border-collapse:collapse;">
            <tr>
                <td><strong>Vaccinated?</strong></td>
                <td>${escapeHtml(vaccine)}</td>
            </tr>

            <tr>
                <td><strong>Do you have insurance?</strong></td>
                <td>${escapeHtml(insurance)}</td>
            </tr>

            <tr>
                <td><strong>Medical History</strong></td>
                <td>${escapeHtml(history)}</td>
            </tr>

            <tr>
                <td><strong>Described Symptoms</strong></td>
                <td>${escapeHtml(symptoms)}</td>
            </tr>

            <tr>
                <td><strong>Health Scale</strong></td>
                <td>${escapeHtml(healthScale)}</td>
            </tr>

            <tr>
                <td><strong>User ID</strong></td>
                <td>${escapeHtml(userid)}</td>
            </tr>

            <tr>
                <td><strong>Password</strong></td>
                <td>Password entered and confirmed.</td>
            </tr>
        </table>
    `;
}

function getRadioValue(name) {
    const radios = document.getElementsByName(name);

    for (let i = 0; i < radios.length; i++) {
        if (radios[i].checked) {
            return radios[i].value;
        }
    }

    return "";
}

function getCheckedValues(name) {
    const checkboxes = document.getElementsByName(name);
    const values = [];

    for (let i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked) {
            values.push(checkboxes[i].value);
        }
    }

    return values.length > 0 ? values : ["None selected"];
}

function escapeHtml(text) {
    if (text === null || text === undefined) {
        return "";
    }

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}