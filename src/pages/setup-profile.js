import { auth } from '../services/firebase.js';
import { createUserProfile, isUsernameTaken } from '../services/db.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const setupForm = document.getElementById('setup-form');
const errorMsg = document.getElementById('error-message');
const usernameInput = document.getElementById('username');
const usernameStatus = document.getElementById('username-status');

let currentUser = null;
let usernameDebounce;

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
    } else {
        window.location.href = 'login.html';
    }
});

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
        }
    }, 500);
});

setupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const username = usernameInput.value.trim();

    if (usernameStatus.textContent === "Username taken") {
        errorMsg.textContent = "Please choose a different username.";
        errorMsg.style.display = 'block';
        return;
    }

    try {
        await createUserProfile(currentUser.uid, currentUser.email, username);
        window.location.href = 'friends.html';
    } catch (error) {
        errorMsg.textContent = error.message;
        errorMsg.style.display = 'block';
    }
});
