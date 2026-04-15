# api.matthew-hre.com

Personal API powering [matthew-hre.com](https://matthew-hre.com). Built with [Hono](https://hono.dev) on [Bun](https://bun.sh), deployed via [Dokploy](https://dokploy.com).

## Endpoints

### `GET /vinyl`

Paginated vinyl collection, synced nightly from Discogs.

| Param   | Default   | Options                      |
| ------- | --------- | ---------------------------- |
| `page`  | `1`       |                              |
| `sort`  | `added`   | `title`, `artist`, `added`   |
| `order` | `desc`    | `asc`, `desc`                |

### `GET /activity/music`

Currently playing (or last played) track from Last.fm.

### `GET /activity/music/stream`

SSE stream that pushes track changes in real-time. Polls Last.fm every ~10 seconds server-side and broadcasts to all connected clients.

## Local Development

```bash
cp .env.example .env   # fill in your tokens
docker compose up -d   # start Postgres
bun install
bun run sync           # seed the database from Discogs
bun run dev            # start the API on :3000
```

## Environment Variables

| Variable                         | Description                  |
| -------------------------------- | ---------------------------- |
| `DATABASE_URL`                   | Postgres connection string   |
| `DISCOGS_PERSONAL_ACCESS_TOKEN`  | Discogs API token            |
| `LASTFM_API_KEY`                 | Last.fm API key              |
| `LASTFM_USERNAME`                | Last.fm username             |
