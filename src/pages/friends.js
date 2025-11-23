import { auth } from '../services/firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFriends, getUserProfile, subscribeToUserProfile } from '../services/db.js';
import { renderNavBar } from '../components/navbar.js';

const friendsList = document.getElementById('friends-list');

// Render Navbar
renderNavBar('friends');

let unsubscribe = null;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        if (unsubscribe) unsubscribe();

        // Subscribe to user profile changes
        unsubscribe = subscribeToUserProfile(user.uid, async (profile) => {
            if (profile && profile.theme) {
                document.body.setAttribute('data-theme', profile.theme);
            }
            // Reload friends list regardless of profile existence (handles new users)
            await loadFriends(user.uid);
        });
    } else {
        window.location.href = 'login.html';
    }
});

async function loadFriends(uid) {
    try {
        const friends = await getFriends(uid);
        friendsList.innerHTML = '';

        if (friends.length === 0) {
            friendsList.innerHTML = `
                <div style="text-align: center; margin-top: 50px; color: var(--text-secondary);">
                    <p>No friends yet.</p>
                    <a href="userlist.html" class="btn" style="display: inline-block; width: auto; margin-top: 10px;">Find Users</a>
                </div>
            `;
            return;
        }

        friends.forEach(friend => {
            const el = document.createElement('div');
            el.className = 'friend-item';
            el.style.cssText = `
                display: flex;
                align-items: center;
                padding: 15px;
                background: var(--surface-color);
                margin-bottom: 10px;
                border-radius: 12px;
                cursor: pointer;
                transition: transform 0.2s;
            `;
            el.innerHTML = `
                <div style="width: 40px; height: 40px; background: var(--primary-color); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #fff; margin-right: 15px;">
                    ${friend.username[0].toUpperCase()}
                </div>
                <div>
                    <div style="font-weight: 600; color: var(--text-color);">${friend.username}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Tap to chat</div>
                </div>
            `;
            el.onclick = () => {
                window.location.href = `chat.html?uid=${friend.id}&name=${friend.username}`;
            };
            friendsList.appendChild(el);
        });
    } catch (error) {
        console.error(error);
        friendsList.innerHTML = '<p style="color: var(--error-color); text-align: center;">Failed to load friends.</p>';
    }
}
