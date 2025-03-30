import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/functions';
import 'firebase/compat/storage';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBLudO4g_NIo09Q-r-54-bIhcKXs84Wdk4",
  authDomain: "q-cea-3b4bf.firebaseapp.com",
  projectId: "q-cea-3b4bf",
  storageBucket: "q-cea-3b4bf.appspot.com", // This should be .appspot.com, not .firebasestorage.app
  messagingSenderId: "318731421747",
  appId: "1:318731421747:web:1e0ab1e07c6db9f5e3fb46",
  measurementId: "G-S64DNW6KP1"
};

// Initialize Firebase if it hasn't been initialized yet
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Initialize a secondary app using the modular API
const secondaryApp = initializeApp(firebaseConfig, "userManagement");

// Export the Firebase services
export const auth = firebase.auth();
export const db = firebase.firestore();
export const functions = firebase.functions();
export const storage = firebase.storage();
export const userManagementAuth = getAuth(secondaryApp);

export default firebase;
