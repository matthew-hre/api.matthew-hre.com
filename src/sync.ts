import { sql } from "./db";

const DISCOGS_TOKEN = process.env.DISCOGS_PERSONAL_ACCESS_TOKEN!;
const DISCOGS_USER = "matthew_hre";
const PER_PAGE = 100;

function cleanArtistName(name: string): string {
  return name.replace(/\s*\(\d+\)$/, "");
}

interface DiscogsRelease {
  id: number;
  date_added: string;
  basic_information: {
    title: string;
    cover_image: string;
    artists: { name: string }[];
  };
}

async function fetchPage(page: number): Promise<{
  releases: DiscogsRelease[];
  pages: number;
}> {
  const url = `https://api.discogs.com/users/${DISCOGS_USER}/collection/folders/0/releases?token=${DISCOGS_TOKEN}&per_page=${PER_PAGE}&page=${page}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "api.matthew-hre.com/1.0" },
  });

  if (res.status === 429) {
    const retryAfter = Number(res.headers.get("Retry-After") || "60");
    console.log(`Rate limited, waiting ${retryAfter}s...`);
    await new Promise((r) => setTimeout(r, retryAfter * 1000));
    return fetchPage(page);
  }

  if (!res.ok) {
    throw new Error(`Discogs API error: ${res.status}`);
  }

  const data = await res.json();
  return {
    releases: data.releases,
    pages: data.pagination.pages,
  };
}

async function sync() {
  console.log("Starting Discogs sync...");

  // Create table if it doesn't exist
  await sql`
    CREATE TABLE IF NOT EXISTS releases (
      discogs_id   INTEGER PRIMARY KEY,
      title        TEXT NOT NULL,
      artist_name  TEXT NOT NULL,
      cover_image  TEXT NOT NULL,
      date_added   TIMESTAMPTZ NOT NULL
    )
  `;

  let page = 1;
  let totalPages = 1;
  let synced = 0;

  while (page <= totalPages) {
    const data = await fetchPage(page);
    totalPages = data.pages;

    for (const release of data.releases) {
      await sql`
        INSERT INTO releases (discogs_id, title, artist_name, cover_image, date_added)
        VALUES (
          ${release.id},
          ${release.basic_information.title},
          ${cleanArtistName(release.basic_information.artists[0]?.name || "Unknown")},
          ${release.basic_information.cover_image},
          ${release.date_added}
        )
        ON CONFLICT (discogs_id) DO UPDATE SET
          title = EXCLUDED.title,
          artist_name = EXCLUDED.artist_name,
          cover_image = EXCLUDED.cover_image,
          date_added = EXCLUDED.date_added
      `;
      synced++;
    }

    console.log(`Page ${page}/${totalPages} — ${synced} releases synced`);
    page++;

    // Be nice to the Discogs API
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`Sync complete. ${synced} total releases.`);
  await sql.end();
}

sync().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
