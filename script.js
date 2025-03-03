async function signup() {
    const username = document.getElementById("signup-username").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;

    const response = await fetch("https://votronix-backend.onrender.com/auth/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username,
            email,
            password
        })
    });

    const data = await response.json();

    if (response.ok) {
        alert("✅ Account created successfully! Redirecting to login...");
        window.location.href = "index.html"; // Redirect to login page
    } else {
        alert(`❌ Error: ${data.message}`);
    }
}
