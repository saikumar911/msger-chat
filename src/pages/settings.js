import { auth } from '../services/firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getUserProfile, updateTheme, updateUsername, subscribeToUserProfile } from '../services/db.js';
import { logout } from '../services/auth.js';
import { renderNavBar } from '../components/navbar.js';

// Render Navbar
renderNavBar('settings');

const usernameInput = document.getElementById('username-input');
const saveUsernameBtn = document.getElementById('save-username-btn');
const usernameMsg = document.getElementById('username-msg');
const userEmail = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');
const themeBtns = document.querySelectorAll('.theme-btn');

let currentUser = null;

let unsubscribe = null;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        userEmail.textContent = user.email;

        if (unsubscribe) unsubscribe();

        unsubscribe = subscribeToUserProfile(user.uid, (profile) => {
            if (profile) {
                usernameInput.value = profile.username;
                if (profile.theme) {
                    document.body.setAttribute('data-theme', profile.theme);
                    highlightTheme(profile.theme);
                }
            }
        });
    } else {
        window.location.href = 'login.html';
    }
});

saveUsernameBtn.addEventListener('click', async () => {
    const newName = usernameInput.value.trim();
    if (newName.length < 3) {
        usernameMsg.textContent = "Username too short";
        usernameMsg.style.color = "var(--error-color)";
        return;
    }

    saveUsernameBtn.textContent = "Saving...";
    saveUsernameBtn.disabled = true;

    try {
        await updateUsername(currentUser.uid, newName);
        usernameMsg.textContent = "Username updated!";
        usernameMsg.style.color = "var(--success-color)";
    } catch (error) {
        console.error(error);
        usernameMsg.textContent = error.message;
        usernameMsg.style.color = "var(--error-color)";
    } finally {
        saveUsernameBtn.textContent = "Save";
        saveUsernameBtn.disabled = false;
    }
});

themeBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
        const theme = btn.dataset.theme;
        document.body.setAttribute('data-theme', theme);
        highlightTheme(theme);

        try {
            await updateTheme(currentUser.uid, theme);
        } catch (error) {
            console.error("Failed to save theme", error);
        }
    });
});

function highlightTheme(theme) {
    themeBtns.forEach(btn => {
        if (btn.dataset.theme === theme) {
            btn.style.outline = "2px solid var(--primary-color)";
        } else {
            btn.style.outline = "none";
        }
    });
}

logoutBtn.addEventListener('click', async () => {
    try {
        await logout();
        window.location.href = 'login.html';
    } catch (error) {
        console.error(error);
    }
});
