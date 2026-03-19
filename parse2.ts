import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('wiki.html', 'utf-8');
const $ = cheerio.load(html);

// Find the table that contains characters. Usually it's under an id like "allcharacters"
const h2 = $('#allcharacters').parent();
const table = h2.nextAll('div').find('table').first();

if (table.length === 0) {
  console.log("Table not found by nextAll('div'). Trying just 'table'");
  const tables = $('table');
  console.log("Total tables:", tables.length);
  
  // Let's look for a table that has "レア" or "名前" in its header
  tables.each((i, tbl) => {
    const headerText = $(tbl).find('th').text();
    if (headerText.includes('名前') && headerText.includes('レア')) {
      console.log('Found character table at index', i);
      const rows = $(tbl).find('tr');
      console.log('Rows:', rows.length);
      
      const chars = [];
      rows.each((j, row) => {
        if (j === 0) return; // header
        const tds = $(row).find('td');
        if (tds.length > 0) {
          const name = $(tds[1]).text().trim();
          const img = $(tds[0]).find('img').attr('src');
          const school = $(tds[6]).text().trim();
          const rarity = $(tds[2]).text().trim();
          chars.push({ name, img, school, rarity });
        }
      });
      console.log(JSON.stringify(chars.slice(0, 5), null, 2));
    }
  });
}
