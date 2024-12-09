//
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore'; 
import 'firebase/compat/functions';

const firebaseConfig = {
  apiKey: "AIzaSyBLudO4g_NIo09Q-r-54-bIhcKXs84Wdk4",
  authDomain: "q-cea-3b4bf.firebaseapp.com",
  projectId: "q-cea-3b4bf",
  storageBucket: "q-cea-3b4bf.firebasestorage.app",
  messagingSenderId: "318731421747",
  appId: "1:318731421747:web:1e0ab1e07c6db9f5e3fb46",
  measurementId: "G-S64DNW6KP1"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const db = firebase.firestore();
export default firebase;
