import { auth } from '../services/firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFriendRequests, acceptFriendRequest, getUserProfile } from '../services/db.js';
import { renderNavBar } from '../components/navbar.js';

const notifList = document.getElementById('notifications-list');

// Render Navbar
renderNavBar('notifications');

let currentUser = null;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const profile = await getUserProfile(user.uid);
        if (profile && profile.theme) {
            document.body.setAttribute('data-theme', profile.theme);
        }
        loadNotifications(user.uid);
    } else {
        window.location.href = 'login.html';
    }
});

async function loadNotifications(uid) {
    try {
        const requests = await getFriendRequests(uid);
        notifList.innerHTML = '';

        if (requests.length === 0) {
            notifList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); margin-top: 50px;">No new notifications.</p>';
            return;
        }

        requests.forEach(reqUser => {
            const el = document.createElement('div');
            el.className = 'notif-item';
            el.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 15px;
                background: var(--surface-color);
                margin-bottom: 10px;
                border-radius: 12px;
            `;

            el.innerHTML = `
                <div style="display: flex; align-items: center;">
                    <div style="width: 40px; height: 40px; background: var(--primary-color); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #fff; margin-right: 15px;">
                        ${reqUser.username[0].toUpperCase()}
                    </div>
                    <div>
                        <div style="font-weight: 600; color: var(--text-color);">${reqUser.username}</div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary);">Sent you a friend request</div>
                    </div>
                </div>
                <button class="accept-btn" style="padding: 8px 16px; width: auto; margin: 0; font-size: 0.9rem; background-color: var(--success-color); color: #000;">Accept</button>
            `;

            const btn = el.querySelector('.accept-btn');
            btn.onclick = async () => {
                btn.textContent = 'Accepting...';
                btn.disabled = true;
                try {
                    await acceptFriendRequest(currentUser.uid, reqUser.id);
                    el.style.opacity = '0.5';
                    btn.textContent = 'Accepted';
                } catch (e) {
                    console.error(e);
                    btn.textContent = 'Error';
                    btn.disabled = false;
                }
            };

            notifList.appendChild(el);
        });
    } catch (error) {
        console.error(error);
        notifList.innerHTML = '<p style="color: var(--error-color); text-align: center;">Failed to load notifications.</p>';
    }
}
