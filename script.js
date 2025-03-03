async function signup() {
    const username = document.getElementById("signup-username").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;

    const response = await fetch("https://votronix-backend.onrender.com/auth/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, email, password })
    });

    if (!response.ok) {
        const errorData = await response.text();
        console.error("Server response:", errorData); // Log full server response
        alert(`❌ Error: ${response.status} - ${errorData}`);
        return;
    }

    const data = await response.json();
    alert("✅ Account created successfully!");
    window.location.href = "index.html"; // Redirect after signup
}
