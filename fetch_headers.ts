import * as cheerio from 'cheerio';

async function fetchHeaders() {
  const res = await fetch('https://bluearchive.wikiru.jp/?%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC%E4%B8%80%E8%A6%A7');
  const html = await res.text();
  const $ = cheerio.load(html);
  
  let table = null;
  $('table').each((i, el) => {
    const headerText = $(el).find('th').first().text().trim();
    if (headerText === 'レア' || headerText.includes('レア')) {
      const headers = $(el).find('th').map((_, th) => $(th).text().trim()).get();
      if (headers.includes('名前') && headers.includes('学校')) {
        table = $(el);
        return false; // break
      }
    }
  });

  if (table) {
    const rows = table.find('tr');
    for (let i = 1; i <= 3; i++) {
      const row = $(rows[i]);
      const tds = row.find('td, th');
      const rowData = tds.map((_, td) => $(td).text().trim()).get();
      console.log(`Data row ${i}:`, rowData);
    }
  }
}

fetchHeaders();
