import express from "express";
import { createServer as createViteServer } from "vite";
import * as cheerio from "cheerio";
import path from "path";
let charactersCache = [];
let lastFetchTime = 0;
const CACHE_DURATION = 1e3 * 60 * 60;
async function fetchAndParseCharacters() {
  try {
    const response = await fetch(
      "https://bluearchive.wikiru.jp/?%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC%E4%B8%80%E8%A6%A7"
    );
    const html = await response.text();
    const $ = cheerio.load(html);
    let table = null;
    let headers = [];
    $("table").each((i, el) => {
      const headerText = $(el).find("th").first().text().trim();
      if (headerText === "\u30EC\u30A2" || headerText.includes("\u30EC\u30A2")) {
        headers = $(el).find("th").map((_, th) => $(th).text().trim()).get();
        if (headers.includes("\u540D\u524D") && headers.includes("\u5B66\u6821")) {
          table = $(el);
          return false;
        }
      }
    });
    if (!table) {
      console.error("Could not find character table on Wiki.");
      return charactersCache;
    }
    const rows = table.find("tr");
    const characters = [];
    const seenIds = /* @__PURE__ */ new Set();
    rows.each((i, row) => {
      if (i === 0) return;
      const tds = $(row).find("td, th");
      if (tds.length >= 14) {
        const rarityText = $(tds[0]).text().trim();
        let defaultStars = 3;
        if (rarityText.includes("\u26051")) defaultStars = 1;
        else if (rarityText.includes("\u26052")) defaultStars = 2;
        else if (rarityText.includes("\u26053")) defaultStars = 3;
        const name = $(tds[2]).text().trim();
        const weaponType = $(tds[3]).text().trim();
        const role = $(tds[5]).text().trim();
        const position = $(tds[6]).text().trim();
        const characterClass = $(tds[7]).text().trim();
        let img = $(tds[1]).find("img").attr("data-src") || $(tds[1]).find("img").attr("src");
        if (img && !img.startsWith("http")) {
          img = "https://bluearchive.wikiru.jp/" + img;
        }
        const school = $(tds[8]).text().trim();
        const attackType = $(tds[9]).text().trim();
        const defenseType = $(tds[10]).text().trim();
        const urban = $(tds[11]).text().trim().replace(/[0-9]/g, "");
        const outdoors = $(tds[12]).text().trim().replace(/[0-9]/g, "");
        const indoors = $(tds[13]).text().trim().replace(/[0-9]/g, "");
        if (name) {
          const id = name.toLowerCase().replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, "");
          if (!seenIds.has(id)) {
            seenIds.add(id);
            characters.push({
              id,
              name,
              school,
              defaultStars,
              imageUrl: img || `https://picsum.photos/seed/${name}/200/200`,
              weaponType,
              role,
              position,
              class: characterClass,
              attackType,
              defenseType,
              urban,
              outdoors,
              indoors
            });
          }
        }
      }
    });
    if (characters.length > 0) {
      charactersCache = characters;
      lastFetchTime = Date.now();
      console.log(
        `Successfully fetched ${characters.length} characters from Wiki.`
      );
    }
    return charactersCache;
  } catch (error) {
    console.error("Error fetching characters:", error);
    return charactersCache;
  }
}
async function startServer() {
  const app = express();
  const PORT = 3e3;
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
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
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    fetchAndParseCharacters();
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { server } },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}
startServer();
