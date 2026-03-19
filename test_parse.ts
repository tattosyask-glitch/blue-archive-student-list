import * as cheerio from "cheerio";
import fs from "fs";

const html = fs.readFileSync("wiki.html", "utf-8");
const $ = cheerio.load(html);

let table = null;
$('table').each((i, el) => {
  const headerText = $(el).find('th').first().text().trim();
  if (headerText === 'レア' || headerText.includes('レア')) {
    const headers = $(el).find('th').map((_, th) => $(th).text().trim()).get();
    if (headers.includes('名前') && headers.includes('学校')) {
      table = $(el);
      console.log("Found table at index", i);
      console.log("Headers:", headers);
      return false; // break
    }
  }
});

if (table) {
  const rows = table.find('tr');
  console.log("Rows:", rows.length);
  const firstRow = rows.eq(1);
  const tds = firstRow.find('td, th');
  console.log("td[11] html:", $(tds[11]).html());
  tds.each((i, td) => {
    console.log(`td[${i}]:`, $(td).text().trim());
  });
} else {
  console.log("Table not found");
}
