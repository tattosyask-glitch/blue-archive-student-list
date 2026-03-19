import fs from 'fs';
import * as cheerio from 'cheerio';
import { CHARACTERS } from './src/data/characters';

const html = fs.readFileSync('wiki.html', 'utf-8');
const $ = cheerio.load(html);

const charDataMap = new Map<string, any>();

$('table.style_table tbody tr').each((i, el) => {
  if (i === 0) return;
  const tds = $(el).find('td');
  if (tds.length >= 14) {
    let name = $(tds[2]).text().trim();
    name = name.replace(/\n/g, '').replace(/\s/g, '');
    
    const weaponType = $(tds[3]).text().trim();
    const attackType = $(tds[9]).text().trim();
    const defenseType = $(tds[10]).text().trim();
    
    const getTerrain = (td: any) => {
      const text = $(td).text().trim();
      return text.charAt(text.length - 1);
    };
    
    const urban = getTerrain(tds[11]);
    const outdoors = getTerrain(tds[12]);
    const indoors = getTerrain(tds[13]);
    
    if (name) {
      charDataMap.set(name, {
        weaponType,
        attackType,
        defenseType,
        urban,
        outdoors,
        indoors
      });
    }
  }
});

const updatedCharacters = CHARACTERS.map(char => {
  let nameKey = char.name.replace(/\s/g, '');
  let data = charDataMap.get(nameKey);
  
  if (!data) {
     for (const [key, val] of charDataMap.entries()) {
       if (key.includes(nameKey) || nameKey.includes(key)) {
         data = val;
         break;
       }
     }
  }

  return {
    ...char,
    ...(data || {})
  };
});

let fileContent = fs.readFileSync('./src/data/characters.ts', 'utf-8');

// Add weaponType to Character interface if not exists
if (!fileContent.includes('weaponType?: string;')) {
  fileContent = fileContent.replace('attackType?: string;', 'weaponType?: string;\n  attackType?: string;');
}

const startIdx = fileContent.indexOf('export const CHARACTERS: Character[] = [');
const endIdx = fileContent.indexOf('];\n\nexport interface UserCharacterData');

if (startIdx !== -1 && endIdx !== -1) {
  const newArrayStr = 'export const CHARACTERS: Character[] = ' + JSON.stringify(updatedCharacters, null, 2) + ';\n\nexport interface UserCharacterData';
  const newFileContent = fileContent.substring(0, startIdx) + newArrayStr + fileContent.substring(endIdx + '];\n\nexport interface UserCharacterData'.length);
  fs.writeFileSync('./src/data/characters.ts', newFileContent);
  console.log('Successfully updated characters.ts');
} else {
  console.log('Could not find CHARACTERS array in file');
}
