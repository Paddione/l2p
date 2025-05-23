// auth/public/auth_client.js
document.addEventListener('DOMContentLoaded', () => {
    // Firebase App Initialization
    console.log("auth_client.js: DOMContentLoaded. Checking for window.FIREBASE_CONFIG...");
    console.log("auth_client.js: Current window.FIREBASE_CONFIG is:", JSON.stringify(window.FIREBASE_CONFIG, null, 2));

    if (!window.FIREBASE_CONFIG ||
        !window.FIREBASE_CONFIG.apiKey ||
        !window.FIREBASE_CONFIG.authDomain ||
        !window.FIREBASE_CONFIG.projectId) {
        console.error("auth_client.js: Firebase configuration is missing or incomplete (apiKey, authDomain, or projectId missing)!");
        console.log("auth_client.js: Detailed window.FIREBASE_CONFIG at error point:", window.FIREBASE_CONFIG);
        document.body.innerHTML = '<p style="color:red; text-align:center;">Fehler: Firebase Konfiguration nicht geladen oder unvollständig. Bitte Administrator kontaktieren. Überprüfen Sie die Server-Logs und die .env.auth Datei.</p>';
        return;
    }

    console.log("auth_client.js: Firebase configuration seems present. Initializing Firebase...");
    firebase.initializeApp(window.FIREBASE_CONFIG);
    const auth = firebase.auth();
    console.log("auth_client.js: Firebase initialized.");

    const csrfMetaTag = document.querySelector('meta[name="csrf-token"]');
    const csrfToken = csrfMetaTag ? csrfMetaTag.getAttribute('content') : null;
    if (!csrfToken) {
        console.warn('auth_client.js: CSRF token meta tag not found. Form submissions might fail if CSRF protection is active on the server.');
    } else {
        console.log("auth_client.js: CSRF token found:", csrfToken);
    }

    const gameUrl = window.GAME_CONFIG?.gameUrl ||
        (window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://game.korczewski.de/game/');
    console.log("auth_client.js: Target gameUrl for redirect:", gameUrl);

    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const forgotPasswordSection = document.getElementById('forgot-password-section');

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const forgotPasswordForm = document.getElementById('forgot-password-form');

    const loginErrorP = document.getElementById('login-error');
    const registerMessageP = document.getElementById('register-message');
    const registerErrorP = document.getElementById('register-error');
    const forgotMessageP = document.getElementById('forgot-message');
    const forgotErrorP = document.getElementById('forgot-error');

    const showRegisterBtn = document.getElementById('show-register-btn');
    const showForgotPasswordBtn = document.getElementById('show-forgot-password-btn');
    const showLoginBtnFromRegister = document.getElementById('show-login-btn-from-register');
    const showLoginBtnFromForgot = document.getElementById('show-login-btn-from-forgot');

    function showSection(sectionToShow) {
        if (loginSection) loginSection.style.display = 'none';
        if (registerSection) registerSection.style.display = 'none';
        if (forgotPasswordSection) forgotPasswordSection.style.display = 'none';
        if (sectionToShow) sectionToShow.style.display = 'block';
    }

    if (showRegisterBtn) showRegisterBtn.addEventListener('click', () => showSection(registerSection));
    if (showForgotPasswordBtn) showForgotPasswordBtn.addEventListener('click', () => showSection(forgotPasswordSection));
    if (showLoginBtnFromRegister) showLoginBtnFromRegister.addEventListener('click', () => showSection(loginSection));
    if (showLoginBtnFromForgot) showLoginBtnFromForgot.addEventListener('click', () => showSection(loginSection));

    auth.onAuthStateChanged(user => {
        // ADDED CONSOLE LOG HERE
        console.log("auth_client.js: onAuthStateChanged triggered. User object:", user ? user.uid : 'null');
        if (user) {
            console.log("auth_client.js: User is signed in (onAuthStateChanged), redirecting to gameUrl:", gameUrl);
            window.location.href = gameUrl;
        } else {
            console.log("auth_client.js: User is signed out (onAuthStateChanged). Ensuring login form is visible if appropriate.");
            if (loginSection && (!registerSection || registerSection.style.display === 'none') && (!forgotPasswordSection || forgotPasswordSection.style.display === 'none')) {
                showSection(loginSection);
            }
        }
    });

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if(loginErrorP) loginErrorP.textContent = '';
            const email = loginForm.email.value;
            const password = loginForm.password.value;
            console.log("auth_client.js: Login form submitted. Email:", email);

            try {
                await auth.signInWithEmailAndPassword(email, password);
                // ADDED CONSOLE LOG HERE
                console.log("auth_client.js: signInWithEmailAndPassword successful. Waiting for onAuthStateChanged to redirect.");
                // onAuthStateChanged will handle the redirect.
            } catch (error) {
                console.error("auth_client.js: Login error from signInWithEmailAndPassword:", error);
                if(loginErrorP) loginErrorP.textContent = error.message || "Login fehlgeschlagen.";
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if(registerErrorP) registerErrorP.textContent = '';
            if(registerMessageP) registerMessageP.textContent = '';
            const displayName = registerForm.displayName.value;
            const email = registerForm.email.value;
            const password = registerForm.password.value;
            console.log("auth_client.js: Register form submitted.");


            if (!csrfToken) {
                if(registerErrorP) registerErrorP.textContent = "Sicherheitsfehler (CSRF-Token fehlt). Bitte Seite neu laden.";
                console.error("auth_client.js: CSRF token missing for registration.");
                return;
            }

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'CSRF-Token': csrfToken },
                    body: JSON.stringify({ displayName, email, password })
                });
                const data = await response.json();
                if (!response.ok) { throw new Error(data.error || `Serverfehler: ${response.status}`); }
                if(registerMessageP) registerMessageP.textContent = data.message + " Sie können sich jetzt einloggen.";
                registerForm.reset();
                setTimeout(() => showSection(loginSection), 2000);
            } catch (error) {
                console.error('auth_client.js: Registration API error:', error);
                if(registerErrorP) registerErrorP.textContent = error.message || "Registrierung fehlgeschlagen.";
            }
        });
    }

    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if(forgotErrorP) forgotErrorP.textContent = '';
            if(forgotMessageP) forgotMessageP.textContent = '';
            const email = forgotPasswordForm.email.value;
            console.log("auth_client.js: Forgot password form submitted for email:", email);

            try {
                await auth.sendPasswordResetEmail(email);
                if(forgotMessageP) forgotMessageP.textContent = "Reset-Link wurde an Ihre Email gesendet, falls ein Konto existiert.";
                forgotPasswordForm.reset();
            } catch (error) {
                console.error("auth_client.js: Forgot password error:", error);
                if(forgotErrorP) forgotErrorP.textContent = "Fehler beim Senden des Reset-Links.";
            }
        });
    }

    // Ensure login section is shown by default if no user is signed in initially and other sections aren't active
    // This relies on onAuthStateChanged to potentially redirect if a user session already exists
    if (!auth.currentUser) {
        if (loginSection && (!registerSection || registerSection.style.display === 'none') && (!forgotPasswordSection || forgotPasswordSection.style.display === 'none')) {
            showSection(loginSection);
        }
    }
});
