import { Hono } from "hono";
import { sql } from "../db";

const vinyl = new Hono();

vinyl.get("/", async (c) => {
  const page = Math.max(1, Number(c.req.query("page") || "1"));
  const perPage = 20;
  const sort = c.req.query("sort") || "added";
  const order = c.req.query("order") || "desc";

  const sortColumn: Record<string, string> = {
    title: "title",
    artist: "artist_name",
    added: "date_added",
  };

  const col = sortColumn[sort] || "date_added";
  const dir = order === "asc" ? "asc" : "desc";
  const offset = (page - 1) * perPage;

  const [{ count }] = await sql`SELECT count(*)::int as count FROM releases`;

  const releases = await sql`
    SELECT
      discogs_id,
      title,
      artist_name,
      cover_image,
      date_added
    FROM releases
    ORDER BY ${sql(col)} ${sql.unsafe(dir)}
    LIMIT ${perPage}
    OFFSET ${offset}
  `;

  const pages = Math.ceil(count / perPage);

  return c.json({
    pagination: { page, pages, per_page: perPage, items: count },
    releases,
  });
});

export { vinyl };
