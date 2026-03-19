import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('wiki.html', 'utf-8');
const $ = cheerio.load(html);

const characters = [];

// The wiki has a table with class "style_table" under "全キャラクター一覧"
// Let's find the table rows.
$('table.style_table tbody tr').each((i, el) => {
  if (i === 0) return; // skip header
  const tds = $(el).find('td');
  if (tds.length >= 6) {
    // Usually: Icon, Name, Role, Position, Attack Type, Defense Type, School, etc.
    // Let's try to extract name, school, defaultStars, imageUrl
    const imgTag = $(tds[0]).find('img');
    let imageUrl = imgTag.attr('src') || imgTag.attr('data-src') || '';
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = 'https://bluearchive.wikiru.jp/' + imageUrl;
    }
    
    const name = $(tds[1]).text().trim();
    const school = $(tds[6]).text().trim() || $(tds[7]).text().trim(); // School is usually column 6 or 7
    
    // Stars might be in the name or a separate column. Let's look for ★
    let defaultStars = 3;
    const starText = $(el).text();
    if (starText.includes('★1')) defaultStars = 1;
    else if (starText.includes('★2')) defaultStars = 2;
    else if (starText.includes('★3')) defaultStars = 3;

    if (name && imageUrl) {
      characters.push({
        id: name.toLowerCase().replace(/[^a-z0-9]/g, ''), // simple ID
        name,
        school: school.substring(0, 10), // truncate just in case
        defaultStars,
        imageUrl
      });
    }
  }
});

console.log(JSON.stringify(characters.slice(0, 5), null, 2));
console.log('Total found:', characters.length);
