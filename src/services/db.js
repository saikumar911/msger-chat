import { db } from './firebase.js';
import { collection, query, where, getDocs, doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Check if a username already exists
export async function isUsernameTaken(username) {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
}

// Check if current user has a username set
export async function checkUsernameExists(uid) {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return !!docSnap.data().username;
    }
    return false;
}

// Create or update user document
export async function createUserProfile(uid, email, username) {
    // Add a new document in collection "users"
    await setDoc(doc(db, "users", uid), {
        username: username,
        email: email,
        searchKeywords: generateSearchKeywords(username),
        createdAt: new Date(),
        friends: [],
        friendRequestsSent: [],
        friendRequestsReceived: [],
        theme: 'dark' // Default theme
    }, { merge: true });
}

// Helper to generate search keywords for partial matching
function generateSearchKeywords(username) {
    const arr = [];
    let cur = '';
    for (let i = 0; i < username.length; i++) {
        cur += username[i].toLowerCase();
        arr.push(cur);
    }
    return arr;
}

// Get All Users
export async function getAllUsers() {
    const usersRef = collection(db, "users");
    const querySnapshot = await getDocs(usersRef);
    const users = [];
    querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
    });
    return users;
}

// Search Users
export async function searchUsers(term) {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("searchKeywords", "array-contains", term.toLowerCase()));
    const querySnapshot = await getDocs(q);
    const users = [];
    querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
    });
    return users;
}

// Send Friend Request
export async function sendFriendRequest(currentUid, targetUid) {
    const targetRef = doc(db, "users", targetUid);
    const currentRef = doc(db, "users", currentUid);

    await updateDoc(targetRef, {
        friendRequestsReceived: arrayUnion(currentUid)
    });

    await updateDoc(currentRef, {
        friendRequestsSent: arrayUnion(targetUid)
    });
}

// Accept Friend Request
export async function acceptFriendRequest(currentUid, senderUid) {
    const currentRef = doc(db, "users", currentUid);
    const senderRef = doc(db, "users", senderUid);

    // Add to friends list and remove from requests
    await updateDoc(currentRef, {
        friends: arrayUnion(senderUid),
        friendRequestsReceived: arrayRemove(senderUid)
    });

    await updateDoc(senderRef, {
        friends: arrayUnion(currentUid),
        friendRequestsSent: arrayRemove(currentUid)
    });
}

// Get User Profile
export async function getUserProfile(uid) {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
}

// Get Friend Requests
export async function getFriendRequests(uid) {
    const userProfile = await getUserProfile(uid);
    if (!userProfile || !userProfile.friendRequestsReceived) return [];

    const requests = [];
    for (const reqUid of userProfile.friendRequestsReceived) {
        const profile = await getUserProfile(reqUid);
        if (profile) requests.push(profile);
    }
    return requests;
}

// Get Friends List
export async function getFriends(uid) {
    const userProfile = await getUserProfile(uid);
    if (!userProfile || !userProfile.friends) return [];

    const friends = [];
    for (const friendUid of userProfile.friends) {
        const profile = await getUserProfile(friendUid);
        if (profile) friends.push(profile);
    }
    return friends;
}

// Subscribe to User Profile (Real-time)
export function subscribeToUserProfile(uid, callback) {
    const docRef = doc(db, "users", uid);
    return onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
            callback({ id: doc.id, ...doc.data() });
        } else {
            callback(null);
        }
    });
}

// Chat Functions
import { addDoc, orderBy, onSnapshot, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export function getChatId(uid1, uid2) {
    return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}

export async function sendMessage(senderUid, receiverUid, text) {
    const chatId = getChatId(senderUid, receiverUid);
    const messagesRef = collection(db, "chats", chatId, "messages");

    // Ensure chat document exists and update metadata first
    await setDoc(doc(db, "chats", chatId), {
        lastMessage: text,
        lastMessageTime: new Date(),
        participants: [senderUid, receiverUid]
    }, { merge: true });

    // Then add the message
    await addDoc(messagesRef, {
        text,
        senderId: senderUid,
        timestamp: new Date()
    });
}

export function subscribeToMessages(chatId, callback) {
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"), limit(100));

    return onSnapshot(q, (snapshot) => {
        const messages = [];
        snapshot.forEach((doc) => {
            messages.push({ id: doc.id, ...doc.data() });
        });
        callback(messages);
    });
}

// Settings Functions
export async function updateTheme(uid, theme) {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, { theme });
}

export async function updateUsername(uid, newUsername) {
    // Check if taken first
    const taken = await isUsernameTaken(newUsername);
    if (taken) throw new Error("Username already taken");

    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
        username: newUsername,
        searchKeywords: generateSearchKeywords(newUsername)
    });
}
