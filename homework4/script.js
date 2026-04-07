// ================= HW4 PAGE SETUP =================
document.addEventListener("DOMContentLoaded", () => {
    setTodayInHeaderFrame();
    fetchStates();
    loadUserFromCookieAndStorage();
    attachStorageHandlers();
    document.getElementById("submitBtn").style.display = "none";
});

// ================= HEADER / TODAY =================
function setTodayInHeaderFrame() {
    const frame = document.getElementById("headerFrame");
    if (!frame) return;

    frame.addEventListener("load", () => {
        try {
            const doc = frame.contentDocument || frame.contentWindow.document;
            const todayEl = doc.getElementById("today");
            if (todayEl) {
                const d = new Date();
                todayEl.textContent =
                    "Today is: " + d.toLocaleDateString(undefined, {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                    });
            }
        } catch (e) {
            console.log("Could not access iframe content.");
        }
    });
}

// ================= FETCH API =================
async function fetchStates() {
    const stateSelect = document.getElementById("state");
    if (!stateSelect) return;

    try {
        const response = await fetch("states.json");
        if (!response.ok) {
            throw new Error("Could not load states.json");
        }

        const states = await response.json();

        stateSelect.innerHTML = '<option value="">Select State</option>';

        states.forEach(state => {
            const option = document.createElement("option");
            option.value = state.value;
            option.textContent = state.label;
            stateSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Fetch error:", error);
        setError("stateError", "Could not load state list.");
    }
}

// ================= COOKIE FUNCTIONS =================
function setCookie(name, value, hours) {
    const date = new Date();
    date.setTime(date.getTime() + (hours * 60 * 60 * 1000));
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${date.toUTCString()}; path=/`;
}

function getCookie(name) {
    const cookieName = name + "=";
    const decoded = decodeURIComponent(document.cookie);
    const cookies = decoded.split(";");

    for (let i = 0; i < cookies.length; i++) {
        let c = cookies[i].trim();
        if (c.indexOf(cookieName) === 0) {
            return c.substring(cookieName.length, c.length);
        }
    }
    return "";
}

function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

// ================= LOCAL STORAGE =================
const NON_SECURE_FIELDS = [
    "fname", "mi", "lname", "dob", "email", "phone",
    "address1", "address2", "city", "state", "zip",
    "symptoms", "healthScale", "userid"
];

const RADIO_GROUPS = ["sex", "vaccine", "insurance"];
const CHECKBOX_GROUP = "history";

function attachStorageHandlers() {
    NON_SECURE_FIELDS.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        el.addEventListener("blur", saveSingleFieldToStorage);
        el.addEventListener("change", saveSingleFieldToStorage);
    });

    RADIO_GROUPS.forEach(name => {
        const radios = document.getElementsByName(name);
        radios.forEach(radio => {
            radio.addEventListener("change", saveRadioGroupToStorage);
        });
    });

    const checkboxes = document.getElementsByName(CHECKBOX_GROUP);
    checkboxes.forEach(box => {
        box.addEventListener("change", saveCheckboxGroupToStorage);
    });
}

function saveSingleFieldToStorage(event) {
    const el = event.target;
    if (!el || !el.id) return;

    localStorage.setItem(el.id, el.value);

    if (el.id === "fname" && el.value.trim() !== "") {
        setCookie("firstName", el.value.trim(), 48);
        updateWelcomeArea(el.value.trim());
    }
}

function saveRadioGroupToStorage(event) {
    const name = event.target.name;
    const value = getRadioValue(name);
    localStorage.setItem(name, value);
}

function saveCheckboxGroupToStorage() {
    const values = getCheckedValues("history");
    localStorage.setItem("history", JSON.stringify(values));
}

function loadLocalStorageToForm() {
    NON_SECURE_FIELDS.forEach(id => {
        const el = document.getElementById(id);
        const stored = localStorage.getItem(id);
        if (el && stored !== null) {
            el.value = stored;
            if (id === "healthScale") {
                const out = document.getElementById("hsValue");
                if (out) out.value = stored;
            }
        }
    });

    RADIO_GROUPS.forEach(name => {
        const stored = localStorage.getItem(name);
        if (stored) {
            const radios = document.getElementsByName(name);
            radios.forEach(radio => {
                radio.checked = (radio.value === stored);
            });
        }
    });

    const historyStored = localStorage.getItem("history");
    if (historyStored) {
        const historyValues = JSON.parse(historyStored);
        const checkboxes = document.getElementsByName("history");
        checkboxes.forEach(box => {
            box.checked = historyValues.includes(box.value);
        });
    }
}

function clearAllUserData() {
    deleteCookie("firstName");

    NON_SECURE_FIELDS.forEach(id => localStorage.removeItem(id));
    RADIO_GROUPS.forEach(name => localStorage.removeItem(name));
    localStorage.removeItem("history");

    const form = document.getElementById("patientForm");
    if (form) form.reset();

    const out = document.getElementById("hsValue");
    if (out) out.value = "5";

    resetValidationMessages();
    clearWelcomeArea();
}

// ================= WELCOME / RETURN USER =================
function loadUserFromCookieAndStorage() {
    const firstName = getCookie("firstName");

    if (firstName) {
        updateWelcomeArea(firstName);

        const fnameEl = document.getElementById("fname");
        if (fnameEl) fnameEl.value = firstName;

        loadLocalStorageToForm();
    } else {
        const welcome = document.getElementById("welcomeMessage");
        if (welcome) {
            welcome.innerHTML = "<h3>Welcome new user</h3>";
        }
    }
}

function updateWelcomeArea(firstName) {
    const welcome = document.getElementById("welcomeMessage");
    const newUserArea = document.getElementById("newUserArea");

    if (welcome) {
        welcome.innerHTML = `<h3>Welcome back, ${escapeHtml(firstName)}</h3>`;
    }

    if (newUserArea) {
        newUserArea.innerHTML = `
            <label>
                <input type="checkbox" id="notUserCheckbox" onchange="startAsNewUser()">
                Not ${escapeHtml(firstName)}? Click here to start as a new user.
            </label>
        `;
    }
}

function clearWelcomeArea() {
    const welcome = document.getElementById("welcomeMessage");
    const newUserArea = document.getElementById("newUserArea");

    if (welcome) {
        welcome.innerHTML = "<h3>Welcome new user</h3>";
    }

    if (newUserArea) {
        newUserArea.innerHTML = "";
    }
}

function startAsNewUser() {
    clearAllUserData();
}

// ================= PASSWORD CHECK =================
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
        errorSpan.textContent = "Password cannot contain double quotes.";
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

// ================= SUBMIT VALIDATION =================
function validateForm() {
    const dob = document.getElementById("dob").value;
    const today = new Date().toISOString().split("T")[0];

    if (dob !== "" && dob > today) {
        setError("dobError", "Date of Birth cannot be in the future.");
        return false;
    }

    if (!checkPasswords()) {
        return false;
    }

    return true;
}

// ================= REVIEW FORM =================
function reviewForm() {
    const form = document.getElementById("patientForm");

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    if (!checkPasswords()) {
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

// ================= HELPER FUNCTIONS =================
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

// ================= HW3 / HW4 VALIDATION FUNCTIONS =================
function setError(id, message) {
    const el = document.getElementById(id);
    if (el) el.textContent = message;
}

function clearError(id) {
    const el = document.getElementById(id);
    if (el) el.textContent = "";
}

// -------- NAME --------
function validateFirstName() {
    const val = document.getElementById("fname").value;
    if (!/^[A-Za-z'-]{1,30}$/.test(val)) {
        setError("fnameError", "Invalid first name.");
        return false;
    }
    clearError("fnameError");
    return true;
}

function validateMI() {
    const val = document.getElementById("mi").value;
    if (val !== "" && !/^[A-Za-z]$/.test(val)) {
        setError("miError", "MI must be one letter.");
        return false;
    }
    clearError("miError");
    return true;
}

function validateLastName() {
    const val = document.getElementById("lname").value;
    if (!/^[A-Za-z'-]{1,30}$/.test(val)) {
        setError("lnameError", "Invalid last name.");
        return false;
    }
    clearError("lnameError");
    return true;
}

// -------- SEX --------
function validateSex() {
    const val = getRadioValue("sex");
    if (val === "") {
        setError("sexError", "Please select a sex.");
        return false;
    }
    clearError("sexError");
    return true;
}

// -------- DOB --------
function validateDOB() {
    const dob = document.getElementById("dob").value;
    const today = new Date();
    const date = new Date(dob);

    const min = new Date();
    min.setFullYear(today.getFullYear() - 120);

    if (!dob || date > today || date < min) {
        setError("dobError", "Invalid birth date.");
        return false;
    }
    clearError("dobError");
    return true;
}

// -------- SSN --------
function formatSSN(input) {
    let val = input.value.replace(/\D/g, "");
    if (val.length > 3 && val.length <= 5) {
        val = val.slice(0, 3) + "-" + val.slice(3);
    } else if (val.length > 5) {
        val = val.slice(0, 3) + "-" + val.slice(3, 5) + "-" + val.slice(5, 9);
    }

    input.value = val;
}

function validateSSN() {
    const val = document.getElementById("ssn").value;
    if (!/^(\d{3}-\d{2}-\d{4}|\d{9})$/.test(val)) {
        setError("ssnError", "Invalid SSN format.");
        return false;
    }
    clearError("ssnError");
    return true;
}

// -------- EMAIL --------
function validateEmail() {
    const val = document.getElementById("email").value;
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(val)) {
        setError("emailError", "Invalid email.");
        return false;
    }
    clearError("emailError");
    return true;
}

// -------- PHONE --------
function formatPhone(input) {
    let val = input.value.replace(/\D/g, "");
    if (val.length > 6) {
        val = val.slice(0, 3) + "-" + val.slice(3, 6) + "-" + val.slice(6, 10);
    } else if (val.length > 3) {
        val = val.slice(0, 3) + "-" + val.slice(3);
    }

    input.value = val;
}

function validatePhone() {
    const val = document.getElementById("phone").value;
    if (val && !/^\d{3}-\d{3}-\d{4}$/.test(val)) {
        setError("phoneError", "Invalid phone.");
        return false;
    }
    clearError("phoneError");
    return true;
}

// -------- ADDRESS --------
function validateAddress1() {
    const val = document.getElementById("address1").value.trim();
    if (val.length < 2 || val.length > 30) {
        setError("address1Error", "Address 1 must be 2-30 characters.");
        return false;
    }
    clearError("address1Error");
    return true;
}

function validateAddress2() {
    const val = document.getElementById("address2").value.trim();
    if (val !== "" && (val.length < 2 || val.length > 30)) {
        setError("address2Error", "Address 2 must be 2-30 characters if entered.");
        return false;
    }
    clearError("address2Error");
    return true;
}

function validateCity() {
    const val = document.getElementById("city").value.trim();
    if (!/^[A-Za-z .'-]{2,30}$/.test(val)) {
        setError("cityError", "Invalid city.");
        return false;
    }
    clearError("cityError");
    return true;
}

function validateState() {
    const val = document.getElementById("state").value;
    if (val === "") {
        setError("stateError", "Please select a state.");
        return false;
    }
    clearError("stateError");
    return true;
}

// -------- ZIP --------
function formatZip(input) {
    let val = input.value.replace(/\D/g, "");
    if (val.length > 5) {
        val = val.slice(0, 5) + "-" + val.slice(5, 9);
    }
    input.value = val;
}

function validateZip() {
    const val = document.getElementById("zip").value;
    if (!/^\d{5}(-\d{4})?$/.test(val)) {
        setError("zipError", "Invalid ZIP.");
        return false;
    }
    clearError("zipError");
    return true;
}

// -------- VACCINE / INSURANCE / HISTORY --------
function validateVaccine() {
    const val = getRadioValue("vaccine");
    if (val === "") {
        setError("vaccineError", "Please choose yes or no.");
        return false;
    }
    clearError("vaccineError");
    return true;
}

function validateInsurance() {
    const val = getRadioValue("insurance");
    if (val === "") {
        setError("insuranceError", "Please choose yes or no.");
        return false;
    }
    clearError("insuranceError");
    return true;
}

function validateHistory() {
    clearError("historyError");
    return true;
}

function validateSymptoms() {
    clearError("symptomsError");
    return true;
}

function validateHealthScale() {
    clearError("healthScaleError");
    return true;
}

// -------- USER ID --------
function validateUserId() {
    const val = document.getElementById("userid").value;
    if (!/^[A-Za-z][A-Za-z0-9_-]{4,29}$/.test(val)) {
        setError("useridError", "Invalid username.");
        return false;
    }
    clearError("useridError");
    return true;
}

// -------- PASSWORD --------
function validatePassword() {
    const val = document.getElementById("password").value;

    if (val.includes('"')) {
        setError("passwordRuleError", "No double quotes allowed.");
        return false;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,30}$/.test(val)) {
        setError("passwordRuleError", "Weak password.");
        return false;
    }

    clearError("passwordRuleError");
    return true;
}

// -------- VALIDATE ALL --------
function validateAll() {
    let valid = true;

    if (!validateFirstName()) valid = false;
    if (!validateMI()) valid = false;
    if (!validateLastName()) valid = false;
    if (!validateSex()) valid = false;
    if (!validateDOB()) valid = false;
    if (!validateSSN()) valid = false;
    if (!validateEmail()) valid = false;
    if (!validatePhone()) valid = false;
    if (!validateAddress1()) valid = false;
    if (!validateAddress2()) valid = false;
    if (!validateCity()) valid = false;
    if (!validateState()) valid = false;
    if (!validateZip()) valid = false;
    if (!validateVaccine()) valid = false;
    if (!validateInsurance()) valid = false;
    if (!validateHistory()) valid = false;
    if (!validateSymptoms()) valid = false;
    if (!validateHealthScale()) valid = false;
    if (!validateUserId()) valid = false;
    if (!validatePassword()) valid = false;
    if (!checkPasswords()) valid = false;

    const submitBtn = document.getElementById("submitBtn");
    submitBtn.style.display = valid ? "inline-block" : "none";

    if (valid) {
        reviewForm();
        document.getElementById("reviewArea").scrollIntoView({ behavior: "smooth" });
    }

    return valid;
}

// -------- RESET --------
function resetValidationMessages() {
    const errors = document.querySelectorAll(".error");
    errors.forEach(e => e.textContent = "");
    document.getElementById("submitBtn").style.display = "none";
}