if (location.port === "3001") {
    location.replace("http://" + location.hostname + ":3000/users.html");
}

async function loadUsers() {
    let table = document.getElementById("table");
    let message = document.getElementById("message");

    try {
        let response = await fetch("/users");
        if (!response.ok) {
            throw new Error("Could not load users.");
        }
        let users = await response.json();
        message.textContent = "";
        if (users.length === 0) {
            message.textContent = "No registered users.";
        }

        for (let i = 0; i < users.length; i++) {
            let row = table.insertRow();
            row.insertCell().textContent = i + 1;
            row.insertCell().textContent = users[i].username;
        }
    } catch (error) {
        message.textContent = "Could not load users. Run node backend/api.mjs and refresh.";
    }
}

loadUsers();
