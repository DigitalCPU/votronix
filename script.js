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
                "Authorization": token
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
