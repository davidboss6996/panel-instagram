// Pobiera dane profili Instagram przez Apify i zapisuje wynik do data/stats.json
// Wymaga zmiennej środowiskowej APIFY_TOKEN (ustawianej jako GitHub Secret).
//
// UWAGA: dokładne nazwy pól zwracanych przez aktor "apify/instagram-profile-scraper"
// mogą się nieznacznie różnić w zależności od wersji. Po pierwszym uruchomieniu
// sprawdź surowy JSON (np. w logu Actions) i w razie potrzeby popraw nazwy pól
// poniżej (followersCount, postsCount, latestPosts, videoViewCount itd.).

import fs from "fs";

const TOKEN = process.env.APIFY_TOKEN;
if (!TOKEN) {
  console.error("Brak APIFY_TOKEN w zmiennych środowiskowych.");
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync("config/usernames.json", "utf8"));
const usernames = config.map((c) => c.handle);

const ACTOR = "apify~instagram-profile-scraper";
const url = `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?token=${TOKEN}`;

console.log(`Pobieram dane dla ${usernames.length} kont...`);

const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ usernames }),
});

if (!res.ok) {
  console.error("Błąd wywołania Apify:", res.status, await res.text());
  process.exit(1);
}

const items = await res.json();
const now = Date.now();
const DAY_MS = 24 * 60 * 60 * 1000;

const results = config.map((c) => {
  const item = items.find(
    (i) => (i.username || "").toLowerCase() === c.handle.toLowerCase()
  );

  // Brak wyniku / błąd dla danego loginu = konto prawdopodobnie zbanowane,
  // usunięte albo zmieniło nazwę. Oznaczamy jako "banned" i zostawiamy
  // ostatnie znane liczby puste, żeby to było widoczne w panelu.
  if (!item || item.error) {
    return {
      handle: c.handle,
      name: c.name,
      followers: null,
      posts: null,
      views24h: null,
      status: "banned",
      updatedAt: new Date().toISOString(),
    };
  }

  const posts = item.latestPosts || item.posts || [];
  const views24h = posts
    .filter((p) => {
      if (!p.timestamp) return false;
      return now - new Date(p.timestamp).getTime() < DAY_MS;
    })
    .reduce((sum, p) => sum + (p.videoViewCount || p.videoPlayCount || 0), 0);

  return {
    handle: c.handle,
    name: c.name,
    followers: item.followersCount ?? null,
    posts: item.postsCount ?? posts.length,
    views24h,
    status: "live",
    updatedAt: new Date().toISOString(),
  };
});

fs.mkdirSync("data", { recursive: true });
fs.writeFileSync("data/stats.json", JSON.stringify(results, null, 2));

console.log(`Zapisano data/stats.json (${results.length} kont).`);
