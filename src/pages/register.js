import { registerUser, loginWithGoogle } from '../services/auth.js';
import { isUsernameTaken } from '../services/db.js';

const registerForm = document.getElementById('register-form');
const googleBtn = document.getElementById('google-btn');
const errorMsg = document.getElementById('error-message');
const usernameInput = document.getElementById('username');
const usernameStatus = document.getElementById('username-status');

let usernameDebounce;

usernameInput.addEventListener('input', () => {
    clearTimeout(usernameDebounce);
    const username = usernameInput.value.trim();

    if (username.length < 3) {
        usernameStatus.textContent = "Username too short";
        usernameStatus.style.color = "var(--text-secondary)";
        return;
    }

    usernameStatus.textContent = "Checking...";
    usernameStatus.style.color = "var(--text-secondary)";

    usernameDebounce = setTimeout(async () => {
        try {
            const taken = await isUsernameTaken(username);
            if (taken) {
                usernameStatus.textContent = "Username taken";
                usernameStatus.style.color = "var(--error-color)";
            } else {
                usernameStatus.textContent = "Username available";
                usernameStatus.style.color = "var(--success-color)";
            }
        } catch (e) {
            console.error(e);
            usernameStatus.textContent = "Error checking username";
            usernameStatus.style.color = "var(--error-color)";
        }
    }, 500);
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.style.display = 'none';

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const username = document.getElementById('username').value.trim();

    if (usernameStatus.textContent === "Username taken") {
        errorMsg.textContent = "Please choose a different username.";
        errorMsg.style.display = 'block';
        return;
    }

    try {
        await registerUser(email, password, username);
        window.location.href = 'friends.html';
    } catch (error) {
        console.error("Registration Error:", error);
        let msg = "Registration failed.";
        if (error.code === 'auth/email-already-in-use') {
            msg = "Email is already registered.";
        } else if (error.code === 'auth/invalid-email') {
            msg = "Invalid email address.";
        } else if (error.code === 'auth/weak-password') {
            msg = "Password should be at least 6 characters.";
        } else if (error.code === 'auth/operation-not-allowed') {
            msg = "Email/Password accounts are not enabled in Firebase Console.";
        } else if (error.message) {
            msg = error.message;
        }
        errorMsg.textContent = msg;
        errorMsg.style.display = 'block';
    }
});

googleBtn.addEventListener('click', async () => {
    try {
        const { user, isNew } = await loginWithGoogle();
        if (isNew) {
            window.location.href = 'setup-profile.html';
        } else {
            window.location.href = 'friends.html';
        }
    } catch (error) {
        console.error(error);
        errorMsg.textContent = "Google Sign-In failed.";
        errorMsg.style.display = 'block';
    }
});
