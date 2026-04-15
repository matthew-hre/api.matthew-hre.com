const LASTFM_API_KEY = process.env.LASTFM_API_KEY!;
const LASTFM_USERNAME = process.env.LASTFM_USERNAME!;
const POLL_INTERVAL = 10_000;

export interface Track {
  name: string;
  artist: string;
  album: string;
  image: string;
  url: string;
  nowPlaying: boolean;
  timestamp: string | null;
}

type Listener = (track: Track | null) => void;

let currentTrack: Track | null = null;
const listeners = new Set<Listener>();
let polling = false;

function parseTrack(raw: Record<string, unknown>): Track {
  const artist = raw.artist as Record<string, string>;
  const album = raw.album as Record<string, string>;
  const images = raw.image as Array<Record<string, string>>;
  const attr = raw["@attr"] as Record<string, string> | undefined;
  const date = raw.date as Record<string, string> | undefined;

  return {
    name: raw.name as string,
    artist: artist["#text"],
    album: album["#text"],
    image:
      images.find((i) => i.size === "large")?.["#text"] ||
      images.find((i) => i.size === "medium")?.["#text"] ||
      "",
    url: raw.url as string,
    nowPlaying: attr?.nowplaying === "true",
    timestamp: date?.uts || null,
  };
}

function trackChanged(a: Track | null, b: Track | null): boolean {
  if (a === null || b === null) return a !== b;
  return (
    a.name !== b.name ||
    a.artist !== b.artist ||
    a.nowPlaying !== b.nowPlaying
  );
}

async function poll() {
  try {
    const res = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USERNAME}&api_key=${LASTFM_API_KEY}&format=json&limit=1`
    );

    if (!res.ok) return;

    const data = await res.json();
    const rawTrack = data?.recenttracks?.track?.[0];
    const track = rawTrack ? parseTrack(rawTrack) : null;

    if (trackChanged(currentTrack, track)) {
      currentTrack = track;
      for (const listener of listeners) {
        listener(track);
      }
    }
  } catch (err) {
    console.error("Last.fm poll failed:", err);
  }
}

function startPolling() {
  if (polling) return;
  polling = true;
  poll();
  setInterval(poll, POLL_INTERVAL);
}

export function getCurrentTrack(): Track | null {
  return currentTrack;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  startPolling();
  return () => listeners.delete(listener);
}
