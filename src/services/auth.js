import { auth } from './firebase.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { isUsernameTaken, createUserProfile, checkUsernameExists } from './db.js';

export async function registerUser(email, password, username) {
    // 1. Check if username exists
    const taken = await isUsernameTaken(username);
    if (taken) {
        throw new Error("Username is already taken.");
    }

    // 2. Create Auth User
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 3. Create User Profile in Firestore
    await createUserProfile(user.uid, email, username);

    return user;
}

export async function loginUser(email, password) {
    return await signInWithEmailAndPassword(auth, email, password);
}

export async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if user has a profile/username
    const hasProfile = await checkUsernameExists(user.uid);
    if (!hasProfile) {
        // If no profile, we need to prompt for username. 
        // For now, we return a flag indicating this.
        return { user, isNew: true };
    }
    return { user, isNew: false };
}

export async function logout() {
    return await signOut(auth);
}
