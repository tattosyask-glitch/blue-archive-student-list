import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('wiki.html', 'utf-8');
const $ = cheerio.load(html);

const tables = $('table');
console.log("Total tables:", tables.length);

tables.each((i, tbl) => {
  const headerText = $(tbl).find('th').text().replace(/\s+/g, ' ');
  console.log(`Table ${i} headers: ${headerText.substring(0, 50)}`);
});
