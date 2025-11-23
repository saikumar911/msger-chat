import { loginUser, loginWithGoogle } from '../services/auth.js';

const loginForm = document.getElementById('login-form');
const googleBtn = document.getElementById('google-btn');
const errorMsg = document.getElementById('error-message');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.style.display = 'none';

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        await loginUser(email, password);
        window.location.href = 'friends.html';
    } catch (error) {
        errorMsg.textContent = error.message;
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
        errorMsg.textContent = "Google Sign-In failed. Please try again.";
        errorMsg.style.display = 'block';
    }
});
