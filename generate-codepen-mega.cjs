const fs = require('fs');

const firebaseConfig = fs.readFileSync('firebase-applet-config.json', 'utf8');
const characters = fs.readFileSync('src/data/characters.ts', 'utf8');
const app = fs.readFileSync('src/App.tsx', 'utf8');

const charactersClean = characters
  .replace(/export interface Character \{[\s\S]*?\}/, '')
  .replace('export const CHARACTERS: Character[] =', 'const CHARACTERS =');

const appClean = app
  .replace(/import .* from .*/g, '')
  .replace(/export default function App/g, 'function App')
  .replace(/export function cn[\s\S]*?\}/, '')
  .replace(/export interface UserCharacterData \{[\s\S]*?\}/, 'interface UserCharacterData {')
  .replace(/export const defaultUserCharacter/g, 'const defaultUserCharacter')
  .replace(/export const getFormalSchoolName/g, 'const getFormalSchoolName');

const codepenContent = `import React, { useState, useMemo, useEffect, useCallback } from 'https://esm.sh/react@18';
import ReactDOM from 'https://esm.sh/react-dom@18/client';
import { Search, Filter, X, ChevronDown, ChevronUp, Star } from 'https://esm.sh/lucide-react';
import { clsx } from 'https://esm.sh/clsx';
import { twMerge } from 'https://esm.sh/tailwind-merge';

import { initializeApp } from 'https://esm.sh/firebase@10.8.0/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://esm.sh/firebase@10.8.0/auth';
import { getFirestore, collection, doc, onSnapshot, setDoc, getDocFromServer } from 'https://esm.sh/firebase@10.8.0/firestore';

const firebaseConfig = ${firebaseConfig};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const auth = getAuth(app);

const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Error signing in with Google", error);
  }
};

const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
};

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

${charactersClean}

${appClean}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
`;

fs.writeFileSync('public/CODEPEN_EXPORT.txt', codepenContent);
console.log('public/CODEPEN_EXPORT.txt created!');
