// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword , onAuthStateChanged} from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDG5_ULuhY1lnnVb3VXmQzfoHw6oQn8U1o",
    authDomain: "wanderer-9ca69.firebaseapp.com",
    projectId: "wanderer-9ca69",
    storageBucket: "wanderer-9ca69.firebasestorage.app",
    messagingSenderId: "150837882297",
    appId: "1:150837882297:web:a3c57d3bc66eaf496f9a68"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Export app as default
export default app;

// Named exports
export { auth, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, onAuthStateChanged, app };