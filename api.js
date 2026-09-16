import http from 'http';
import fs from 'fs';
import coBody from 'co-body';

let frontendFolder = import.meta.dirname + "/../frontend";
let dataFile = import.meta.dirname + "/data.json";

export function readUsers() {
    let text = fs.readFileSync(dataFile, "utf8");
    let users = JSON.parse(text);
    return users;
}

function saveUsers(users) {
    let text = JSON.stringify(users, null, 2);
    fs.writeFileSync(dataFile, text);
}

function sendJSON(response, status, data) {
    response.statusCode = status;
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify(data));
}

function validUser(user) {
    if (!user) return false;
    if (typeof user.username !== "string") return false;
    if (typeof user.password !== "string") return false;
    if (user.username.trim() === "") return false;
    if (user.password.trim() === "") return false;
    return true;
}

function showUsers(response) {
    let users = readUsers();
    let result = [];

    for (let user of users) {
        result.push({ username: user.username });
    }

    sendJSON(response, 200, result);
}

async function register(request, response) {
    let form = await coBody.json(request);

    if (!validUser(form)) {
        sendJSON(response, 400, { message: "Enter a username and password." });
        return;
    }

    let users = readUsers();
    let username = form.username;
    let password = form.password;

    for (let user of users) {
        if (user.username == username) {
            sendJSON(response, 409, { message: "Username already exists." });
            return;
        }
    }

    let newUser = { username: username, password: password };
    users.push(newUser);
    saveUsers(users);
    sendJSON(response, 201, { message: "Registered! You can now log in." });
}

async function login(request, response) {
    let form = await coBody.json(request);

    if (!validUser(form)) {
        sendJSON(response, 400, { message: "Enter a username and password." });
        return;
    }

    let users = readUsers();
    let username = form.username;
    let password = form.password;

    for (let user of users) {
        if (user.username == username && user.password == password) {
            sendJSON(response, 200, { message: "Hello, " + username + "!" });
            return;
        }
    }

    sendJSON(response, 401, { message: "Wrong username or password." });
}

function showPage(url, response) {
    let name = url.slice(1);

    if (name.startsWith("frontend/")) {
        name = name.slice(9);
    }
    if (name === "" || name === "index.html") {
        name = "home.html";
    }

    let type = "";
    if (name.endsWith(".html")) type = "text/html";
    if (name.endsWith(".css")) type = "text/css";
    if (name.endsWith(".js")) type = "text/javascript";
    if (name.endsWith(".jpg")) type = "image/jpeg";
    if (name.endsWith(".mov")) type = "video/quicktime";

    let file = frontendFolder + "/" + name;
    if (name.includes("/") || type === "" || !fs.existsSync(file)) {
        sendJSON(response, 404, { message: "Page not found." });
        return;
    }

    let content = fs.readFileSync(file);
    response.setHeader("Content-Type", type);
    response.setHeader("Cache-Control", "no-store");
    response.end(content);
}

let server = http.createServer(async function (request, response) {
    let url = request.url.split("?")[0];
    let method = request.method;

    try {
        if (method === "GET" && url === "/users") {
            showUsers(response);
        } else if (method === "POST" && url === "/register") {
            await register(request, response);
        } else if (method === "POST" && url === "/login") {
            await login(request, response);
        } else if (method === "GET") {
            showPage(url, response);
        } else {
            sendJSON(response, 404, { message: "Not found." });
        }
    } catch (error) {
        let status = error.status || 500;
        if (error instanceof SyntaxError) status = 400;
        sendJSON(response, status, { message: "Could not read the request or users file." });
    }
});

server.listen(3000, "0.0.0.0", function () {
    console.log("Open http://localhost:3000");
});
