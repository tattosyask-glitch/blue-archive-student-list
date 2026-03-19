const fs = require('fs');

const characters = fs.readFileSync('src/data/characters.ts', 'utf8');
const app = fs.readFileSync('src/App.tsx', 'utf8');

const charactersClean = characters
  .replace(/export interface Character \{[\s\S]*?\}/, '')
  .replace('export const CHARACTERS: Character[] =', 'const CHARACTERS =');

const appClean = app
  .replace(/import .* from .*/g, '')
  .replace(/export default function App/g, 'function App')
  .replace(/export function cn[\s\S]*?\}/, '');

const codepenContent = `import React, { useState, useMemo, useEffect } from 'https://esm.sh/react@18';
import ReactDOM from 'https://esm.sh/react-dom@18/client';
import { Search, Filter, X, ChevronDown, ChevronUp, Star } from 'https://esm.sh/lucide-react';
import { clsx } from 'https://esm.sh/clsx';
import { twMerge } from 'https://esm.sh/tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

${charactersClean}

${appClean}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
`;

fs.writeFileSync('public/CODEPEN_EXPORT.jsx', codepenContent);
console.log('public/CODEPEN_EXPORT.jsx created!');
