import fs from 'fs';

const filePath = 'src/data/characters.ts';
let content = fs.readFileSync(filePath, 'utf-8');

// The file exports CHARACTERS as a JSON array stringified.
// Let's extract the JSON part.
const match = content.match(/export const CHARACTERS: Character\[\] = (\[[\s\S]*?\]);\n\nexport interface UserCharacterData/);

if (match) {
  const characters = JSON.parse(match[1]);
  
  const uniqueCharacters = [];
  const seenIds = new Set();
  
  for (const char of characters) {
    if (!seenIds.has(char.id)) {
      seenIds.add(char.id);
      uniqueCharacters.push(char);
    }
  }
  
  const newContent = content.replace(
    match[1],
    JSON.stringify(uniqueCharacters, null, 2)
  );
  
  fs.writeFileSync(filePath, newContent);
  console.log(`Deduplicated. Original: ${characters.length}, New: ${uniqueCharacters.length}`);
} else {
  console.log("Could not find CHARACTERS array.");
}
