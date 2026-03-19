import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('wiki.html', 'utf-8');
const $ = cheerio.load(html);

const table = $('table').eq(46);
const rows = table.find('tr');

const characters = [];

rows.each((i, row) => {
  if (i === 0) return; // header
  const tds = $(row).find('td');
  if (tds.length > 0) {
    const rarityText = $(tds[0]).text().trim();
    let defaultStars = 3;
    if (rarityText.includes('★1')) defaultStars = 1;
    else if (rarityText.includes('★2')) defaultStars = 2;
    else if (rarityText.includes('★3')) defaultStars = 3;

    const name = $(tds[1]).text().trim();
    
    // The image is usually in the first or second column. Let's check td[1] or td[0]
    let img = $(tds[1]).find('img').attr('src') || $(tds[1]).find('img').attr('data-src');
    if (!img) {
      img = $(tds[0]).find('img').attr('src') || $(tds[0]).find('img').attr('data-src');
    }
    
    if (img && !img.startsWith('http')) {
      img = 'https://bluearchive.wikiru.jp/' + img;
    }

    const school = $(tds[7]).text().trim(); // "学校" is the 8th column (index 7)

    if (name) {
      characters.push({
        id: name.toLowerCase().replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, ''),
        name,
        school,
        defaultStars,
        imageUrl: img || `https://picsum.photos/seed/${name}/200/200`
      });
    }
  }
});

fs.writeFileSync('src/data/characters.ts', `export interface Character {
  id: string;
  name: string;
  school: string;
  defaultStars: number;
  imageUrl: string;
}

export const CHARACTERS: Character[] = ${JSON.stringify(characters, null, 2)};

export interface UserCharacterData {
  characterId: string;
  isOwned: boolean;
  level: number;
  stars: number;
  weaponLevel: number;
  gear1Level: number;
  gear2Level: number;
  gear3Level: number;
  exSkill: number;
  nsSkill: number;
  psSkill: number;
  ssSkill: number;
  favoriteItemLevel: number;
}

export const defaultUserCharacter = (characterId: string, defaultStars: number): UserCharacterData => ({
  characterId,
  isOwned: false,
  level: 1,
  stars: defaultStars,
  weaponLevel: 0,
  gear1Level: 1,
  gear2Level: 1,
  gear3Level: 1,
  exSkill: 1,
  nsSkill: 1,
  psSkill: 1,
  ssSkill: 1,
  favoriteItemLevel: 0,
});
`);

console.log('Extracted', characters.length, 'characters.');
