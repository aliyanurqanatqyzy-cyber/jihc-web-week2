if (location.port === "3001") {
    location.replace("http://" + location.hostname + ":3000/home.html");
}

let loginModal = document.getElementById("loginModal");
let messageModal = document.getElementById("Modal");
let message = document.getElementById("ModalText");
let loginForm = document.getElementById("loginForm");

document.getElementById("modalBtn").onclick = function () {
    loginModal.style.display = "flex";
};
document.getElementById("loginCloseBtn").onclick = function () {
    loginModal.style.display = "none";
};
document.getElementById("ModalCloseBtn").onclick = function () {
    messageModal.style.display = "none";
};

loginForm.onsubmit = async function (event) {
    event.preventDefault();
    let username = document.getElementById("loginUsername").value.trim();
    let password = document.getElementById("loginPassword").value;

    let user = { username: username, password: password };

    try {
        let response = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(user)
        });
        let result = await response.json();
        message.textContent = result.message;
        if (response.ok) {
            loginModal.style.display = "none";
            loginForm.reset();
        }
    } catch (error) {
        message.textContent = "Start the backend: node backend/api.mjs";
    }
    messageModal.style.display = "flex";
};
