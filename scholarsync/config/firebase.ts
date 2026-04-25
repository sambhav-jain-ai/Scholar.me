import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager
} from "firebase/firestore";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyA_yxezsSWyoHvdHaIeOpAt0E9eJzPTF4A",
  authDomain: "scholar-ly-31180.firebaseapp.com",
  projectId: "scholar-ly-31180",
  storageBucket: "scholar-ly-31180.firebasestorage.app",
  messagingSenderId: "959031489180",
  appId: "1:959031489180:web:26696c5d06a05e84f57359",
  measurementId: "G-LD4HNSSN58"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use persistent local cache for native platforms, and persistentMultipleTabManager for web
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: Platform.OS === 'web' ? persistentMultipleTabManager() : undefined
  })
});

export default app;