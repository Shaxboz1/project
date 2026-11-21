/**
 * KEBABO - Firebase Configuration & Central SDK Helper
 * 
 * Ushbu faylga Firebase Console'dan olingan kalitlarni qo'ying.
 * Qanday sozlash bo'yicha batafsil qo'llanma: ADMIN-README.md
 */

// 1. Firebase loyihangiz ma'lumotlarini quyidagi qavslar ichiga kiriting:
export const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY_HERE",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

/**
 * Firebase sozlanganligini tekshirish yordamchisi.
 * Agar kalitlar kiritilmagan bo'lsa, tizim lokal / demo rejimida ishlaydi,
 * shunda siz Firebase'ni ulamasdan ham admin panelni bemalol sinab ko'rishingiz mumkin!
 */
export function isFirebaseConfigured() {
  return firebaseConfig.apiKey && 
         firebaseConfig.apiKey !== "PASTE_YOUR_API_KEY_HERE" &&
         firebaseConfig.projectId !== "your-project-id";
}

// Firebase Modular SDK v10 CDN havolalari
export const FIREBASE_APP_URL = "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
export const FIREBASE_AUTH_URL = "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
export const FIREBASE_FIRESTORE_URL = "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
export const FIREBASE_STORAGE_URL = "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// Firestore kolleksiyalari va hujjat identifikatorlari
export const COLLECTIONS = {
  MENU_DATA: "menu_data",      // Asosiy menyu hujjati
  DOCUMENT_ID: "kebab_main"   // Yagona restoran hujjati (Spark tarifida qulay va tez)
};
