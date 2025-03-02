const API_URL = "https://votronix-backend.onrender.com"; // Your backend URL

// ✅ Sign Up Function
async function signup() {
    let username = document.getElementById('signup-username').value;
    let email = document.getElementById('signup-email').value;
    let password = document.getElementById('signup-password').value;

    let response = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, email, password })
    });

    let data = await response.json();

    if (response.ok) {
        alert("Signup successful! You can now log in.");
        window.location.href = "login.html"; // Redirect to login page
    } else {
        alert("Error: " + data.message);
    }
}

// ✅ Login Function
async function login() {
    let email = document.getElementById('login-email').value;
    let password = document.getElementById('login-password').value;

    let response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
    });

    let data = await response.json();

    if (response.ok) {
        alert("Login successful!");
        localStorage.setItem("token", data.token); // Store token for authentication
        window.location.href = "profile.html"; // Redirect to profile page
    } else {
        alert("Error: " + data.message);
    }
}

// ✅ Load Profile Data
async function loadProfile() {
    let token = localStorage.getItem("token");

    let response = await fetch(`${API_URL}/profile`, {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    let data = await response.json();

    if (response.ok) {
        document.getElementById("profile-username").innerText = data.username;
        document.getElementById("profile-email").innerText = data.email;
    } else {
        alert("Error loading profile: " + data.message);
        window.location.href = "login.html"; // Redirect to login if not authenticated
    }
}

// ✅ Logout Function
function logout() {
    localStorage.removeItem("token");
    alert("Logged out successfully!");
    window.location.href = "login.html"; // Redirect to login page
}
