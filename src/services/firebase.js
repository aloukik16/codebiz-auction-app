import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
// TODO: Add SDKs for Firebase products that you want to use

const firebaseConfig = {
  apiKey: "AIzaSyCzHQEvH7g64STAKgQPX4Z_n11ccci0CpU",
  authDomain: "codebidz-auction-eca65.firebaseapp.com",
  projectId: "codebidz-auction-eca65",
  storageBucket: "codebidz-auction-eca65.firebasestorage.app",
  messagingSenderId: "715077557070",
  appId: "1:715077557070:web:3bafa5bfdc082ab2f69c1f"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app)
export const db = getFirestore(app)