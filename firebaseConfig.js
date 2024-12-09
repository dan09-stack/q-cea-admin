//
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore'; 
import 'firebase/compat/functions';

const firebaseConfig = {
  apiKey: "AIzaSyCjwCicGxM9cAhEslWlx6Eq2-2P1ymELbQ",
  authDomain: "q-cea-90f91.firebaseapp.com",
  projectId: "q-cea-90f91",
  storageBucket: "q-cea-90f91.firebasestorage.app",
  messagingSenderId: "408022763213",
  appId: "1:408022763213:web:13af141ef37c6568e58b84",
  measurementId: "G-DJ8KTGFJDK"
};


if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const db = firebase.firestore();
export default firebase;
