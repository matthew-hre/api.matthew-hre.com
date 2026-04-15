import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { getCurrentTrack, subscribe } from "../lib/lastfm";

const activity = new Hono();

activity.get("/music", (c) => {
  return c.json({ track: getCurrentTrack() });
});

activity.get("/music/stream", (c) => {
  return streamSSE(c, async (stream) => {
    const track = getCurrentTrack();
    await stream.writeSSE({
      data: JSON.stringify({ track }),
      event: "track",
    });

    const unsubscribe = subscribe((track) => {
      stream.writeSSE({
        data: JSON.stringify({ track }),
        event: "track",
      });
    });

    stream.onAbort(() => {
      unsubscribe();
    });

    // Keep the connection open
    while (true) {
      await stream.sleep(30_000);
    }
  });
});

export { activity };
