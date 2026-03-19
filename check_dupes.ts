import fs from 'fs';

const filePath = 'src/data/characters.ts';
let content = fs.readFileSync(filePath, 'utf-8');

const match = content.match(/export const CHARACTERS: Character\[\] = (\[[\s\S]*?\]);\n\nexport interface UserCharacterData/);

if (match) {
  const characters = JSON.parse(match[1]);
  
  const nameCounts = {};
  for (const char of characters) {
    nameCounts[char.name] = (nameCounts[char.name] || 0) + 1;
  }
  
  for (const name in nameCounts) {
    if (nameCounts[name] > 1) {
      console.log(`Duplicate name found: ${name} (${nameCounts[name]} times)`);
    }
  }
  console.log('Duplicate check finished.');
}
