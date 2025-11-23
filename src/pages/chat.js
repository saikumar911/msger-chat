import { auth } from '../services/firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { sendMessage, subscribeToMessages, getUserProfile } from '../services/db.js';

const messagesContainer = document.getElementById('messages-container');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const backBtn = document.getElementById('back-btn');
const chatName = document.getElementById('chat-name');
const chatAvatar = document.getElementById('chat-avatar');

// Get params
const urlParams = new URLSearchParams(window.location.search);
const targetUid = urlParams.get('uid');
const targetName = urlParams.get('name');

if (!targetUid) {
    window.location.href = 'friends.html';
}

chatName.textContent = targetName || 'User';
if (targetName) chatAvatar.textContent = targetName[0].toUpperCase();

backBtn.onclick = () => window.location.href = 'friends.html';

let currentUser = null;
let unsubscribe = null;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const profile = await getUserProfile(user.uid);
        if (profile && profile.theme) {
            document.body.setAttribute('data-theme', profile.theme);
        }

        const chatId = getChatId(user.uid, targetUid);
        unsubscribe = subscribeToMessages(chatId, renderMessages);
    } else {
        window.location.href = 'login.html';
    }
});

function getChatId(uid1, uid2) {
    return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}

sendBtn.addEventListener('click', handleSend);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
});

async function handleSend() {
    const text = messageInput.value.trim();
    if (!text) return;

    messageInput.value = '';
    try {
        await sendMessage(currentUser.uid, targetUid, text);
        scrollToBottom();
    } catch (error) {
        console.error("Error sending message:", error);
    }
}

function renderMessages(messages) {
    messagesContainer.innerHTML = '';
    let lastDate = null;

    messages.forEach(msg => {
        const date = msg.timestamp ? msg.timestamp.toDate() : new Date();
        const dateStr = getDateString(date);

        if (dateStr !== lastDate) {
            const divider = document.createElement('div');
            divider.className = 'date-divider';
            divider.innerHTML = `<span>${dateStr}</span>`;
            messagesContainer.appendChild(divider);
            lastDate = dateStr;
        }

        const isMe = msg.senderId === currentUser.uid;
        const el = document.createElement('div');
        el.className = `message-bubble ${isMe ? 'message-sent' : 'message-received'}`;

        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        el.innerHTML = `
            ${msg.text}
            <div class="timestamp">${timeStr}</div>
        `;
        messagesContainer.appendChild(el);
    });

    scrollToBottom();
}

function getDateString(date) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString();
}

function scrollToBottom() {
    messagesContainer.scrollTo({
        top: messagesContainer.scrollHeight,
        behavior: 'smooth'
    });
}
