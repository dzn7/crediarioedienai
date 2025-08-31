import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAxqq1pV7UGRjs2scCJXqUr02QITguGzgl",
  authDomain: "edienailanches.firebaseapp.com", 
  projectId: "edienailanches",
  storageBucket: "edienailanches.appspot.com",
  appId: "1:235757072392:web:7a87479b0862dcda7161bd"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const BACKEND_URL = "https://southamerica-east1-edienailanches.cloudfunctions.net";
