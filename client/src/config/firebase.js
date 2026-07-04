// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBPE04Cmx4sWCuzuA2dnO_-bJeqLLueNso",
  authDomain: "presto-fitness.firebaseapp.com",
  projectId: "presto-fitness",
  storageBucket: "presto-fitness.firebasestorage.app",
  messagingSenderId: "471310710123",
  appId: "1:471310710123:web:ab594c7fa766ce3ebd482e",
  measurementId: "G-MVRPH2LBJ9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);