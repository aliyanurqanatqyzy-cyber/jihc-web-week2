let form = document.getElementById("form");
let message = document.getElementById("message");

form.onsubmit = async function (event) {
    event.preventDefault();
    let username = document.getElementById("username").value.trim();
    let password = document.getElementById("password").value;

    let user = { username: username, password: password };

    try {
        let response = await fetch("http://localhost:3000/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(user)
        });
        let result = await response.json();
        message.textContent = result.message;
        if (response.ok) {
            form.reset();
        }
    } catch (error) {
        message.textContent = "Start the backend: node frontend/api.js";
    }
};
