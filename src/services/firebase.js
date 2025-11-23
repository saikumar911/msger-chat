import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object
const firebaseConfig = {
  apiKey: "AIzaSyBvWpErRIp_GR8pg7B1F4vC2mgs_uj50pY",
  authDomain: "task-maker17.firebaseapp.com",
  projectId: "task-maker17",
  storageBucket: "task-maker17.firebasestorage.app",
  messagingSenderId: "906251964068",
  appId: "1:906251964068:web:602b3f461730041f706031",
  measurementId: "G-JBQ2BZ11TG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
