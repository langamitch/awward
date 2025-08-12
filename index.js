import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
import { getFirestore, setDoc, doc, getDoc, query, where, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

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
const profileMenu = document.getElementById('profile-menu');
const logoutBtn = document.getElementById('logout-btn');
const collectionBtn = document.getElementById('collection-btn');
const dashboardBtn = document.getElementById('dashboard-btn');

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

// Show or hide auth forms/profile menu based on auth state
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User logged in, get user data
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            userNameDisplay.textContent = userDoc.data().fullName;
            userDisplay.classList.remove("hidden");
        }
        // Hide auth overlay and forms
        authOverlay.classList.remove("visible");
        signupForm.classList.add("hidden");
        loginForm.classList.add("hidden");

        // Change profile icon title to something else if you want
        profileIcon.title = "Profile menu";

        // Show profile icon
        profileIcon.style.display = "block";
    } else {
        // No user logged in
        userNameDisplay.textContent = "";
        userDisplay.classList.add("hidden");

        // Show login form by default
        signupForm.classList.add("hidden");
        loginForm.classList.remove("hidden");

        // Show auth overlay on clicking profile icon (login/signup)
        profileIcon.title = "Login or Sign Up";

        profileMenu.style.display = "none"; // hide profile menu if open
    }
});

// SIGNUP
signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = signupForm.querySelector("button[type='submit']");
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = "Signing up...";
    submitBtn.disabled = true;
    showLoader();

    const fullName = signupForm.querySelector('input[placeholder="Enter your full name"]').value.trim();
    const username = signupForm.querySelector('input[placeholder="Choose a username"]').value.trim().toLowerCase();
    const email = signupForm.querySelector('input[placeholder="Your email address"]').value.trim();
    const password = signupForm.querySelector('input[placeholder="Create a password"]').value;

    try {
        if (await isUsernameTaken(username)) {
            hideLoader();
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
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
        // Auth state listener will handle UI update

    } catch (error) {
        alert("❌ Error: " + error.message);
    } finally {
        hideLoader();
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
    }
});

// LOGIN
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = loginForm.querySelector("button[type='submit']");
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = "Logging in...";
    submitBtn.disabled = true;
    showLoader();

    const emailOrUsername = document.querySelector('#login-email').value.trim().toLowerCase();
    const password = document.querySelector('#login-password').value;

    try {
        let emailToUse = emailOrUsername;

        if (!emailOrUsername.includes("@")) {
            const q = query(collection(db, "users"), where("username", "==", emailOrUsername));
            const snapshot = await getDocs(q);
            if (snapshot.empty) throw new Error("Username not found");
            emailToUse = snapshot.docs[0].data().email;
        }

        const userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);

        alert("✅ Login successful!");
        // Auth state listener will handle UI update

    } catch (error) {
        alert("❌ Error: " + error.message);
    } finally {
        hideLoader();
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
    }
});

// Open auth overlay only if user not logged in
profileIcon.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (user) {
        // Toggle profile menu overlay
        if (profileMenu.style.display === "block") {
            profileMenu.style.display = "none";
        } else {
            profileMenu.style.display = "block";
        }
        authOverlay.classList.remove('visible'); // make sure auth overlay is hidden
    } else {
        // Show login/signup overlay
        authOverlay.classList.add('visible');
    }
});

// Close auth overlay button
closeBtn.addEventListener('click', () => authOverlay.classList.remove('visible'));

// Switch forms
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

// Profile menu button handlers
logoutBtn.addEventListener('click', async () => {
    await signOut(auth);
    profileMenu.style.display = "none";
    alert("Logged out successfully.");
});

collectionBtn.addEventListener('click', () => {
    alert("Go to Collection (implement navigation)");
    profileMenu.style.display = "none";
});

dashboardBtn.addEventListener('click', () => {
    alert("Go to Dashboard (implement navigation)");
    profileMenu.style.display = "none";
});

