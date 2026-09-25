import http from "http";
import { json } from "co-body";
import { Pool } from "pg";

const pool = new Pool({
  host: "localhost",
  user: "altynaj",
  database: "myapp",
});

function send(res, status, data) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(data));
}

async function getUsers() {
  const result = await pool.query(
    "SELECT id, username, email, password FROM users",
  );
  return result.rows;
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    if (req.url === "/users" && req.method === "GET") {
      const users = await getUsers();
      return send(res, 200, users);
    }

    if (req.url === "/register" && req.method === "POST") {
      const body = await json(req);
      const { rows } = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [body.email],
      );
      if (rows.length > 0) {
        return send(res, 400, { error: "Email already exists" });
      }
      await pool.query(
        "INSERT INTO users (username, email, password) VALUES ($1, $2, $3)",
        [body.username, body.email, body.password],
      );
      return send(res, 201, { message: "Account created successfully!!!" });
    }

    if (req.url === "/login" && req.method === "POST") {
      const body = await json(req);
      const { rows } = await pool.query(
        "SELECT id, username FROM users WHERE email = $1 AND password = $2",
        [body.email || null, body.password || null],
      );
      if (rows.length > 0) {
        return send(res, 200, { message: `Welcome ${rows[0].username}!` });
      } else {
        return send(res, 401, { error: "Incorrect email or password" });
      }
    }

    const parts = req.url.split("/");
    const id = Number(parts[2]);
    const hasId =
      parts[1] === "users" &&
      parts.length === 3 &&
      Number.isInteger(id) &&
      id > 0;

    if (hasId && req.method === "PUT") {
      const body = await json(req);
      const { rows } = await pool.query(
        `UPDATE users
         SET username = $1
         WHERE id = $2
         RETURNING id, username`,
        [body.username || null, id],
      );
      if (rows.length === 0) {
        return send(res, 404, { error: "User not found" });
      }
      return send(res, 200, { message: "User updated", user: rows[0] });
    }

    if (hasId && req.method === "DELETE") {
      const { rowCount } = await pool.query("DELETE FROM users WHERE id = $1", [
        id,
      ]);
      if (rowCount === 0) {
        return send(res, 404, { error: "User not found" });
      }
      return send(res, 200, { message: "User deleted" });
    }

    res.writeHead(404);
    res.end("Not Found");
  } catch (err) {
    console.error(err);
    send(res, 500, { error: "Something went wrong" });
  }
});

server.listen(3000, () => console.log("listening to 3000..."));
