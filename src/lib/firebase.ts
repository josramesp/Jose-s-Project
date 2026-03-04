// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration will be populated automatically.
const firebaseConfig = {
  "apiKey": "AIzaSyBzw2vzNKNqlyUciIsBAEZeEV57ZvZbPZk",
  "authDomain": "etns-grade-portal.firebaseapp.com",
  "projectId": "etns-grade-portal",
  "storageBucket": "etns-grade-portal.appspot.com",
  "messagingSenderId": "113508608393",
  "appId": "1:113508608393:web:78b7e20c2bb57646015958",
  "measurementId": ""
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };