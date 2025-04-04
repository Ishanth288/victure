
// Firebase configuration
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCtW9ppKIg5nvkGDTKCxnhhMU0YZwfq7X8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "victure-990aa.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "victure-990aa",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "victure-990aa.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "492159173082",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:492159173082:web:4bece0978700d199f3c0e3",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-0Q0N9Q2ZRC"
};
