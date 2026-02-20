import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCVN3MhxCtbf7ER8bTpxZrhwW3_b6OHNSA",
    authDomain: "catalystwebathon.firebaseapp.com",
    projectId: "catalystwebathon",
    storageBucket: "catalystwebathon.firebasestorage.app",
    messagingSenderId: "1051472531090",
    appId: "1:1051472531090:web:77cc45a1eb49b62912a04b",
    measurementId: "G-JK4GGP95VS"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);