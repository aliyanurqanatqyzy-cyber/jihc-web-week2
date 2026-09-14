let http = require("http");
let fs = require("fs");
let dataFile = __dirname + "/../backend/data.json";

function readUsers() {
    return JSON.parse(fs.readFileSync(dataFile, "utf8"));
}

function reply(response, status, data) {
    response.writeHead(status, { "Content-Type": "application/json" });
    response.end(JSON.stringify(data));
}

function showPage(request, response) {
    let name = request.url.split("?")[0].slice(1);
    if (name === "") {
        name = "home.html";
    }
    let types = { html: "text/html", css: "text/css", js: "text/javascript",
        jpg: "image/jpeg", mov: "video/quicktime" };
    let type = types[name.split(".").pop()];

    if (request.method !== "GET" || name.includes("/") || !type ||
        name === "api.js" || !fs.existsSync(__dirname + "/" + name)) {
        response.writeHead(404);
        return response.end("Not found.");
    }
    let file = fs.readFileSync(__dirname + "/" + name);
    response.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
    response.end(file);
}

let server = http.createServer(function (request, response) {
    let url = request.url.split("?")[0];
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (request.method === "OPTIONS") {
        response.writeHead(204);
        return response.end();
    }

    let text = "";
    request.setEncoding("utf8");
    request.on("data", function (piece) {
        text = text + piece;
    });
    request.on("end", function () {
        try {
            if (request.method === "GET" && url === "/users") {
                return reply(response, 200, readUsers());
            }
            if (request.method !== "POST") {
                return showPage(request, response);
            }
            if (url !== "/register" && url !== "/login") {
                return reply(response, 404, { message: "Not found." });
            }

            let form = JSON.parse(text);
            if (!form || typeof form.username !== "string" || !form.username.trim() ||
                typeof form.password !== "string" || !form.password.trim()) {
                return reply(response, 400, { message: "Enter a username and password." });
            }
            let username = form.username;
            let password = form.password;
            let users = readUsers();

            if (url === "/register") {
                for (let user of users) {
                    if (user.username == username) {
                        return reply(response, 409, { message: "Username already exists." });
                    }
                }
                users.push({ username: username, password: password });
                fs.writeFileSync(dataFile, JSON.stringify(users, null, 2));
                return reply(response, 201, { message: "Registered! You can now log in." });
            }

            for (let user of users) {
                if (user.username == username && user.password == password) {
                    return reply(response, 200, { message: "Hello, " + username + "!" });
                }
            }
            reply(response, 401, { message: "Wrong username or password." });
        } catch (error) {
            reply(response, 500, { message: "Could not read the request or users file." });
        }
    });
});

server.listen(3000, function () {
    console.log("Open http://localhost:3000");
});
