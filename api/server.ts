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

            // 画像URLの取得処理を強化
            const imgElement = $(tds[1]).find("img");
            // data-src があればそれを使い、なければ src を使う
            let rawImgUrl = imgElement.attr("data-src") || imgElement.attr("src") || "";
            let finalImgUrl = "";

            if (rawImgUrl) {
              if (rawImgUrl.startsWith("http")) {
                finalImgUrl = rawImgUrl;
              } else {
                // 先頭のスラッシュを整理して結合
                const cleanPath = rawImgUrl.startsWith("/") ? rawImgUrl.substring(1) : rawImgUrl;
                finalImgUrl = `https://bluearchive.wikiru.jp/${cleanPath}`;
              }
            } else {
              // 画像がない場合のプレースホルダー
              finalImgUrl = `https://picsum.photos/seed/${encodeURIComponent(name)}/200/200`;
            }

            characters.push({
              id,
              name,
              school: $(tds[8]).text().trim(),
              defaultStars: $(tds[0]).text().includes("★3") ? 3 : ($(tds[0]).text().includes("★2") ? 2 : 1),
              imageUrl: finalImgUrl, // ここを強化したURLに差し替え
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
      console.log(`Fetched ${characters.length} characters successfully.`);
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

export default app;
