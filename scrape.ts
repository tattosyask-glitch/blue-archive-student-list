import fs from 'fs';

async function scrape() {
  try {
    const res = await fetch('https://bluearchive.wikiru.jp/?%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC%E4%B8%80%E8%A6%A7');
    const html = await res.text();
    fs.writeFileSync('wiki.html', html);
    console.log('Saved wiki.html, length:', html.length);
  } catch (e) {
    console.error(e);
  }
}
scrape();
