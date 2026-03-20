import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// お客様のFirebase設定
const firebaseConfig = {
  apiKey: "AIzaSyAKJZQQRUpivUEKsMegFBgNQ0PQNKlD9lI",
  authDomain: "blue-archive-student-lis-5aa0f.firebaseapp.com",
  projectId: "blue-archive-student-lis-5aa0f",
  storageBucket: "blue-archive-student-lis-5aa0f.firebasestorage.app",
  messagingSenderId: "36446250920",
  appId: "1:36446250920:web:c766e068a3ca5240429f9d",
  measurementId: "G-5VQ784BS1G",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error: any) {
    console.error("Error signing in with Google", error);
    // エラーが起きたら画面にアラートを出すように追加
    alert(`ログインエラー: ${error.message || error}`);
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
};
