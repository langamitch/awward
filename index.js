
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
import { getFirestore, setDoc, doc, getDoc, query, where, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {

    const firebaseConfig = {
        apiKey: "AIzaSyDlyR-POe1lSy09eh0yKOiElYRhndhQBnM",
        authDomain: "detto-f706a.firebaseapp.com",
        projectId: "detto-f706a",
        storageBucket: "detto-f706a.firebasestorage.app",
        messagingSenderId: "221862826558",
        appId: "1:221862826558:web:537ec8aabce53d414db76f"
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // Elements
    const loader = document.getElementById("loader");
    const userDisplay = document.getElementById("user-display");
    const userNameDisplay = document.getElementById("user-name");

    const signupForm = document.getElementById("signup-form");
    const loginForm = document.getElementById("login-form");

    const profileIcon = document.getElementById('profile-icon');
    const authOverlay = document.getElementById('auth-overlay');
    const closeBtn = document.getElementById('close-btn');
    const showSignupLink = document.getElementById('show-signup-link');
    const showLoginLink = document.getElementById('show-login-link');

    function showLoader() { loader.classList.remove("hidden"); }
    function hideLoader() { loader.classList.add("hidden"); }

    async function isUsernameTaken(username) {
        const q = query(collection(db, "users"), where("username", "==", username.toLowerCase()));
        const snapshot = await getDocs(q);
        return !snapshot.empty;
    }

    function suggestUsernames(username) {
        const suggestions = [];
        for (let i = 1; i <= 3; i++) {
            suggestions.push(username + i);
        }
        return suggestions;
    }

    // SIGNUP
    signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fullName = signupForm.querySelector('input[placeholder="Enter your full name"]').value.trim();
        const username = signupForm.querySelector('input[placeholder="Choose a username"]').value.trim().toLowerCase();
        const email = signupForm.querySelector('input[placeholder="Your email address"]').value.trim();
        const password = signupForm.querySelector('input[placeholder="Create a password"]').value;

        showLoader();

        try {
            if (await isUsernameTaken(username)) {
                hideLoader();
                const suggestions = suggestUsernames(username);
                alert(`❌ Username taken! Try: ${suggestions.join(", ")}`);
                return;
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, "users", user.uid), {
                fullName,
                username,
                email,
                createdAt: new Date()
            });

            alert("✅ Sign up successful!");
            userNameDisplay.textContent = fullName;
            userDisplay.classList.remove("hidden");

        } catch (error) {
            alert("❌ Error: " + error.message);
        } finally {
            hideLoader();
        }
    });

    // LOGIN (Email or Username)
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const emailOrUsername = document.querySelector('#login-email').value.trim().toLowerCase();
        const password = document.querySelector('#login-password').value;

        showLoader();

        try {
            let emailToUse = emailOrUsername;

            if (!emailOrUsername.includes("@")) {
                const q = query(collection(db, "users"), where("username", "==", emailOrUsername));
                const snapshot = await getDocs(q);
                if (snapshot.empty) {
                    throw new Error("Username not found");
                }
                emailToUse = snapshot.docs[0].data().email;
            }

            const userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);
            const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

            if (userDoc.exists()) {
                userNameDisplay.textContent = userDoc.data().fullName;
                userDisplay.classList.remove("hidden");
            }

            alert("✅ Login successful!");

        } catch (error) {
            alert("❌ Error: " + error.message);
        } finally {
            hideLoader();
        }
    });

    // UI Interactions
    profileIcon.addEventListener('click', () => authOverlay.classList.add('visible'));
    closeBtn.addEventListener('click', () => authOverlay.classList.remove('visible'));

    showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });

});

