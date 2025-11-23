import { auth } from '../services/firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { searchUsers, sendFriendRequest, getUserProfile, getAllUsers, subscribeToUserProfile } from '../services/db.js';
import { renderNavBar } from '../components/navbar.js';

const usersList = document.getElementById('users-list');
const searchInput = document.getElementById('search-input');

// Render Navbar
renderNavBar('userlist');

let currentUser = null;
let currentUserProfile = null;

let unsubscribe = null;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        if (unsubscribe) unsubscribe();

        unsubscribe = subscribeToUserProfile(user.uid, async (profile) => {
            currentUserProfile = profile || { friends: [], friendRequestsSent: [], friendRequestsReceived: [] };

            if (currentUserProfile.theme) {
                document.body.setAttribute('data-theme', currentUserProfile.theme);
            }
            // Re-render current list to update button states
            // If we are searching, re-search. If listing all, re-list.
            const term = searchInput.value.trim();
            if (term.length > 0) {
                const users = await searchUsers(term);
                renderUsers(users);
            } else {
                loadAllUsers();
            }
        });
    } else {
        window.location.href = 'login.html';
    }
});

let searchDebounce;

searchInput.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    const term = searchInput.value.trim();

    if (term.length < 1) {
        usersList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); margin-top: 20px;">Type to search users...</p>';
        return;
    }

    searchDebounce = setTimeout(async () => {
        try {
            usersList.innerHTML = '<div class="loading-screen" style="height: 100px;"><div class="spinner"></div></div>';
            const users = await searchUsers(term);
            renderUsers(users);
        } catch (error) {
            console.error(error);
            usersList.innerHTML = '<p style="color: var(--error-color); text-align: center;">Search failed.</p>';
        }
    }, 500);
});

async function loadAllUsers() {
    try {
        usersList.innerHTML = '<div class="loading-screen" style="height: 100px;"><div class="spinner"></div></div>';
        const users = await getAllUsers();
        renderUsers(users);
    } catch (error) {
        console.error(error);
        usersList.innerHTML = '<p style="color: var(--error-color); text-align: center;">Failed to load users.</p>';
    }
}

function renderUsers(users) {
    usersList.innerHTML = '';

    if (users.length === 0) {
        usersList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); margin-top: 20px;">No users found.</p>';
        return;
    }

    users.forEach(user => {
        if (user.id === currentUser.uid) return; // Don't show self

        const isFriend = currentUserProfile.friends && currentUserProfile.friends.includes(user.id);
        const isRequested = currentUserProfile.friendRequestsSent && currentUserProfile.friendRequestsSent.includes(user.id);
        const hasRequestedMe = currentUserProfile.friendRequestsReceived && currentUserProfile.friendRequestsReceived.includes(user.id);

        const el = document.createElement('div');
        el.className = 'user-item';
        el.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 15px;
            background: var(--surface-color);
            margin-bottom: 10px;
            border-radius: 12px;
        `;

        let actionBtn = '';
        if (isFriend) {
            actionBtn = `<span style="color: var(--success-color); font-size: 0.9rem;">Friend</span>`;
        } else if (isRequested) {
            actionBtn = `<span style="color: var(--text-secondary); font-size: 0.9rem;">Requested</span>`;
        } else if (hasRequestedMe) {
            actionBtn = `<span style="color: var(--primary-color); font-size: 0.9rem;">Check Alerts</span>`;
        } else {
            actionBtn = `<button class="add-btn" style="padding: 8px 16px; width: auto; margin: 0; font-size: 0.9rem;">Add</button>`;
        }

        // Calculate mutual friends
        let mutualCount = 0;
        if (currentUserProfile.friends && user.friends) {
            mutualCount = user.friends.filter(id => currentUserProfile.friends.includes(id)).length;
        }
        const mutualText = mutualCount > 0 ? `<div style="font-size: 0.8rem; color: var(--text-secondary);">${mutualCount} Mutual Friends</div>` : '';

        el.innerHTML = `
            <div style="display: flex; align-items: center;">
                <div style="width: 40px; height: 40px; background: var(--secondary-color); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #000; margin-right: 15px;">
                    ${user.username[0].toUpperCase()}
                </div>
                <div>
                    <div style="font-weight: 600; color: var(--text-color);">${user.username}</div>
                    ${mutualText}
                </div>
            </div>
            <div>${actionBtn}</div>
        `;

        if (!isFriend && !isRequested && !hasRequestedMe) {
            const btn = el.querySelector('.add-btn');
            btn.onclick = async () => {
                btn.textContent = 'Sending...';
                btn.disabled = true;
                try {
                    await sendFriendRequest(currentUser.uid, user.id);
                    btn.replaceWith(document.createTextNode('Requested'));
                    // Update local profile cache
                    if (!currentUserProfile.friendRequestsSent) currentUserProfile.friendRequestsSent = [];
                    currentUserProfile.friendRequestsSent.push(user.id);
                } catch (e) {
                    console.error(e);
                    btn.textContent = 'Error';
                    btn.disabled = false;
                }
            };
        }

        usersList.appendChild(el);
    });
}
