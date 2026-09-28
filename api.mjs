import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

const db = new Pool({
  host: process.env.PGHOST || "localhost",
  user: process.env.PGUSER || process.env.USER || "postgres",
  database: process.env.PGDATABASE || "myapp",
  password: process.env.PGPASSWORD,
  port: Number(process.env.PGPORT || 5432),
});
const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../frontend");
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".jpg": "image/jpeg", ".mov": "video/quicktime" };

function send(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

async function readJson(req) {
  let body = "";
  for await (const chunk of req) body += chunk;
  return JSON.parse(body);
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.writeHead(204).end();

  try {
    if (req.method === "GET" && req.url === "/users") {
      const { rows } = await db.query("SELECT id, username, email FROM users ORDER BY id");
      return send(res, 200, rows);
    }

    if (req.method === "POST" && ["/register", "/login"].includes(req.url)) {
      const { username, email, password } = await readJson(req);
      if (!email?.trim() || !password || (req.url === "/register" && !username?.trim())) {
        return send(res, 400, { error: "Username, email and password are required" });
      }

      if (req.url === "/register") {
        await db.query("INSERT INTO users (username, email, password) VALUES ($1, $2, $3)", [
          username.trim(), email.trim(), password,
        ]);
        return send(res, 201, { message: "Account created successfully" });
      }

      const { rows } = await db.query(
        "SELECT username FROM users WHERE email = $1 AND password = $2",
        [email.trim(), password],
      );
      return rows.length
        ? send(res, 200, { message: `Welcome ${rows[0].username}!` })
        : send(res, 401, { error: "Incorrect email or password" });
    }

    if (req.method === "GET") {
      const requested = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
      const file = path.resolve(site, requested === "/" ? "home.html" : `.${requested}`);
      if (!file.startsWith(`${site}${path.sep}`)) return send(res, 404, { error: "Not found" });
      const content = await readFile(file);
      res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
      return res.end(content);
    }

    return send(res, 404, { error: "Not found" });
  } catch (error) {
    if (error.code === "23505") return send(res, 400, { error: "Email already exists" });
    if (error instanceof SyntaxError) return send(res, 400, { error: "Invalid JSON" });
    if (error.code === "ENOENT") return send(res, 404, { error: "File not found" });
    console.error(error);
    return send(res, 500, { error: "Something went wrong" });
  }
});

server.listen(3000, () => console.log("Listening on http://localhost:3000"));
