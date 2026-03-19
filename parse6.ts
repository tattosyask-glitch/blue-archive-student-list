import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('wiki.html', 'utf-8');
const $ = cheerio.load(html);

const table = $('table').eq(46);
const rows = table.find('tr');

console.log('Total rows:', rows.length);
if (rows.length > 1) {
  const row1 = rows.eq(1);
  console.log('Row 1 html:', row1.html().substring(0, 500));
}
