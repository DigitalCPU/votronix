async function loadProfile() {
    let token = localStorage.getItem("token");
    if (!token) {
        alert("You must be logged in!");
        window.location.href = "index.html"; // Redirect to login
        return;
    }

    let response = await fetch("https://votronix-backend.onrender.com/profile", {
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
        window.location.href = "index.html"; // Redirect to login if error
    }
}
