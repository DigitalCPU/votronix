async function login() { 
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    if (!email || !password) {
        alert("❌ Please enter both email and password!");
        return;
    }

    const backendURL = "https://votronix-backend.onrender.com"; // Ensure this is correct

    try {
        const response = await fetch(`${backendURL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error("Server response:", errorData); // Log full server response
            alert(`❌ Login Failed: ${response.status} - ${errorData}`);
            return;
        }

        const data = await response.json();
        alert("✅ Login successful!");

        // Store authentication token (if applicable)
        localStorage.setItem("token", data.token); 

        // Redirect to dashboard or homepage
        window.location.href = "dashboard.html"; 
    } catch (error) {
        console.error("Error during login:", error);
        alert("❌ Something went wrong. Please try again.");
    }
}
