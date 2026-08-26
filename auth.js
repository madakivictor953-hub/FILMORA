const authUsersKey = 'filmora-users';
const authSessionKey = 'filmora-session';

async function hashPassword(password) {
    const data = new TextEncoder().encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function getUsers() {
    try {
        const users = JSON.parse(localStorage.getItem(authUsersKey));
        return Array.isArray(users) ? users : [];
    } catch (error) {
        return [];
    }
}

function getCurrentUser() {
    try {
        return JSON.parse(sessionStorage.getItem(authSessionKey));
    } catch (error) {
        return null;
    }
}

function getUserRecord() {
    const session = getCurrentUser();
    return session ? getUsers().find((user) => user.id === session.id) : null;
}

function updateUserRecord(updatedUser) {
    const users = getUsers().map((user) => user.id === updatedUser.id ? updatedUser : user);
    localStorage.setItem(authUsersKey, JSON.stringify(users));
    sessionStorage.setItem(authSessionKey, JSON.stringify({ id: updatedUser.id, name: updatedUser.name, email: updatedUser.email }));
}

function showAuthMessage(message, type = 'error') {
    const element = document.getElementById('authMessage');
    if (!element) return;
    element.textContent = message;
    element.hidden = false;
    element.className = type === 'success' ? 'success-box' : 'error';
}

function updateAuthNavigation() {
    const user = getCurrentUser();
    const userChip = document.getElementById('userChip');
    const loginLink = document.getElementById('loginLink');
    const signupLink = document.getElementById('signupLink');
    const logoutLink = document.getElementById('logoutLink');
    if (!userChip || !loginLink || !signupLink || !logoutLink) return;
    userChip.textContent = `Hi, ${user.name}`;
    userChip.hidden = !user;
    loginLink.hidden = Boolean(user);
    signupLink.hidden = Boolean(user);
    logoutLink.hidden = !user;
}

async function registerUser(name, email, password) {
    const users = getUsers();
    const normalizedEmail = email.trim().toLowerCase();
    if (users.some((user) => user.email === normalizedEmail)) {
        throw new Error('An account with that email already exists.');
    }
    const user = { id: Date.now(), name: name.trim(), email: normalizedEmail, password: await hashPassword(password) };
    users.push(user);
    localStorage.setItem(authUsersKey, JSON.stringify(users));
    sessionStorage.setItem(authSessionKey, JSON.stringify({ id: user.id, name: user.name, email: user.email }));
}

async function loginUser(email, password) {
    const passwordHash = await hashPassword(password);
    const user = getUsers().find((item) => item.email === email.trim().toLowerCase() && item.password === passwordHash);
    if (!user) throw new Error('Email or password is incorrect.');
    sessionStorage.setItem(authSessionKey, JSON.stringify({ id: user.id, name: user.name, email: user.email }));
}

function logoutUser() {
    sessionStorage.removeItem(authSessionKey);
}

document.addEventListener('DOMContentLoaded', () => {
    updateAuthNavigation();

    document.querySelectorAll('[data-password-toggle]').forEach((button) => {
        button.addEventListener('click', () => {
            const input = document.getElementById(button.dataset.passwordToggle);
            if (!input) return;
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            button.textContent = isPassword ? 'Hide' : 'Show';
            button.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
        });
    });

    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const form = new FormData(signupForm);
            if (form.get('password') !== form.get('confirmPassword')) {
                showAuthMessage('Passwords do not match.');
                return;
            }
            try {
                await registerUser(form.get('name'), form.get('email'), form.get('password'));
                window.location.href = 'index.html';
            } catch (error) {
                showAuthMessage(error.message);
            }
        });
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const form = new FormData(loginForm);
            try {
                await loginUser(form.get('email'), form.get('password'));
                window.location.href = 'index.html';
            } catch (error) {
                showAuthMessage(error.message);
            }
        });
    }

    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            logoutUser();
            window.location.href = 'index.html';
        });
    }
});
