import { Hono } from "hono";
import { cors } from "hono/cors";
import { vinyl } from "./routes/vinyl";
import { activity } from "./routes/activity";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: [
      "https://matthew-hre.com",
      "https://beta.matthew-hre.com",
      "http://localhost:3000",
    ],
  })
);

app.route("/vinyl", vinyl);
app.route("/activity", activity);

app.get("/", (c) => c.json({ status: "ok" }));

export default {
  port: 3000,
  fetch: app.fetch,
};
