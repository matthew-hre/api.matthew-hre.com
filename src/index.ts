import { Hono } from "hono";
import { cors } from "hono/cors";
import { vinyl } from "./routes/vinyl";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: ["https://matthew-hre.com", "https://beta.matthew-hre.com"],
  })
);

app.route("/vinyl", vinyl);

app.get("/", (c) => c.json({ status: "ok" }));

export default {
  port: 3000,
  fetch: app.fetch,
};
