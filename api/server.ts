import express from "express";
import cors from "cors";
import * as cheerio from "cheerio";

const app = express();
app.use(cors());
app.use(express.json());

// キャッシュの設定
let charactersCache: any[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1時間

async function fetchAndParseCharacters() {
  try {
    const response = await fetch(
      "https://bluearchive.wikiru.jp/?%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC%E4%B8%80%E8%A6%A7"
    );
    const html = await response.text();
    const $ = cheerio.load(html);

    let table = null;
    $("table").each((i, el) => {
      const headerText = $(el).find("th").first().text().trim();
      if (headerText.includes("レア")) {
        const headers = $(el).find("th").map((_, th) => $(th).text().trim()).get();
        if (headers.includes("名前") && headers.includes("学校")) {
          table = $(el);
          return false;
        }
      }
    });

    if (!table) return charactersCache;

    const rows = (table as any).find("tr");
    const characters: any[] = [];
    const seenIds = new Set();

    rows.each((i: number, row: any) => {
      if (i === 0) return;
      const tds = $(row).find("td, th");
      if (tds.length >= 14) {
        const name = $(tds[2]).text().trim();
        if (name) {
          const id = name.toLowerCase().replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, "");
          if (!seenIds.has(id)) {
            seenIds.add(id);
            characters.push({
              id,
              name,
              school: $(tds[8]).text().trim(),
              defaultStars: $(tds[0]).text().includes("★3") ? 3 : ($(tds[0]).text().includes("★2") ? 2 : 1),
              imageUrl: $(tds[1]).find("img").attr("src")?.startsWith("http") 
                        ? $(tds[1]).find("img").attr("src") 
                        : "https://bluearchive.wikiru.jp/" + $(tds[1]).find("img").attr("src"),
              weaponType: $(tds[3]).text().trim(),
              role: $(tds[5]).text().trim(),
              attackType: $(tds[9]).text().trim(),
              defenseType: $(tds[10]).text().trim(),
            });
          }
        }
      }
    });

    if (characters.length > 0) {
      charactersCache = characters;
      lastFetchTime = Date.now();
    }
    return charactersCache;
  } catch (error) {
    console.error("Fetch error:", error);
    return charactersCache;
  }
}

// --- APIルート ---

app.get("/api/characters", async (req, res) => {
  if (charactersCache.length === 0 || Date.now() - lastFetchTime > CACHE_DURATION) {
    await fetchAndParseCharacters();
  }
  res.json(charactersCache);
});

app.post("/api/characters/sync", async (req, res) => {
  await fetchAndParseCharacters();
  res.json({ success: true, count: charactersCache.length });
});

// Vercelでは app.listen は不要なので export だけにする
export default app;
