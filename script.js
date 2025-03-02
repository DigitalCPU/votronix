// ✅ Signup Function
async function login() {
    let email = document.getElementById("login-email").value.trim();
    let password = document.getElementById("login-password").value.trim();

    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }

    try {
        let response = await fetch("https://votronix-backend.onrender.com/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email: email, password: password })
        });

        let data = await response.json();
        if (response.ok) {
            localStorage.setItem("token", data.token);
            alert("Login successful!");
            window.location.href = "profile.html"; // Redirect to profile page
        } else {
            console.error("Login failed:", data);
            alert("Login failed: " + (data.message || "Unknown error"));
        }
    } catch (error) {
        console.error("Login error:", error);
        alert("An error occurred while logging in.");
    }
}


// ✅ Login Function
async function login() {
    let email = document.getElementById("login-email").value;
    let password = document.getElementById("login-password").value;

    let response = await fetch("https://votronix-backend.onrender.com/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
    });

    let data = await response.json();
    if (response.ok) {
        localStorage.setItem("token", data.token);
        alert("Login successful!");
        window.location.href = "profile.html"; // Redirect to profile page
    } else {
        alert("Error: " + data.message);
    }
}

// ✅ Load Profile Function
async function loadProfile() {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("You are not logged in!");
        window.location.href = "index.html"; // Redirect to login
        return;
    }

    try {
        const response = await fetch("https://votronix-backend.onrender.com/profile", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (response.ok) {
            document.getElementById("username").textContent = data.username;
            document.getElementById("email").textContent = data.email;
        } else {
            alert("Error loading profile: " + data.message);
            window.location.href = "index.html"; // Redirect if unauthorized
        }
    } catch (error) {
        console.error("Profile fetch error:", error);
        alert("Error loading profile");
        window.location.href = "index.html"; // Redirect on failure
    }
}

// ✅ Call `loadProfile()` when `profile.html` loads
if (window.location.pathname.includes("profile.html")) {
    loadProfile();
}

// ✅ Log Out Function
function logout() {
    localStorage.removeItem("token");
    window.location.href = "index.html";
}
