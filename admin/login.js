/**
 * KEBABO - Admin Login Logic
 * Firebase Authentication Integration with Uzbek Localization
 */

import { 
  firebaseConfig, 
  isFirebaseConfigured, 
  FIREBASE_APP_URL, 
  FIREBASE_AUTH_URL 
} from '../firebase-config.js';

let auth = null;
let signInWithEmailAndPassword = null;
let sendPasswordResetEmail = null;
let onAuthStateChanged = null;

// DOM Elements
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const togglePasswordBtn = document.getElementById('toggle-password');
const eyeIcon = document.getElementById('eye-icon');
const btnSubmit = document.getElementById('btn-submit');
const btnSpinner = document.getElementById('btn-spinner');
const authAlert = document.getElementById('auth-alert');
const demoBanner = document.getElementById('demo-banner');

// Reset Password Modal Elements
const btnForgotPassword = document.getElementById('btn-forgot-password');
const resetModal = document.getElementById('reset-modal');
const btnCloseReset = document.getElementById('btn-close-reset');
const btnCancelReset = document.getElementById('btn-cancel-reset');
const resetForm = document.getElementById('reset-form');
const resetEmailInput = document.getElementById('reset-email');
const resetAlert = document.getElementById('reset-alert');

// 1. Initialize Firebase Auth or Demo Mode
async function initAuth() {
  if (isFirebaseConfigured()) {
    try {
      const { initializeApp, getApps } = await import(FIREBASE_APP_URL);
      const authModule = await import(FIREBASE_AUTH_URL);

      signInWithEmailAndPassword = authModule.signInWithEmailAndPassword;
      sendPasswordResetEmail = authModule.sendPasswordResetEmail;
      onAuthStateChanged = authModule.onAuthStateChanged;

      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      auth = authModule.getAuth(app);

      // Check if user is already logged in
      onAuthStateChanged(auth, (user) => {
        if (user) {
          window.location.replace('dashboard.html');
        }
      });
    } catch (err) {
      console.warn("Firebase Auth yuklanmadi, demo rejimiga o'tildi:", err);
      enableDemoMode();
    }
  } else {
    enableDemoMode();
  }
}

function enableDemoMode() {
  if (demoBanner) demoBanner.hidden = false;
  // If already authenticated in demo session, redirect
  if (sessionStorage.getItem('kebabo_demo_admin')) {
    window.location.replace('dashboard.html');
  }
}

// 2. Password Visibility Toggle
if (togglePasswordBtn && passwordInput) {
  togglePasswordBtn.addEventListener('click', () => {
    const isPass = passwordInput.type === 'password';
    passwordInput.type = isPass ? 'text' : 'password';

    if (isPass) {
      // Eye Slash Icon
      eyeIcon.innerHTML = `
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
        <line x1="2" y1="2" x2="22" y2="22"></line>
      `;
    } else {
      // Normal Eye Icon
      eyeIcon.innerHTML = `
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      `;
    }
  });
}

// 3. Login Submission
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showAlert("Iltimos, elektron pochta va parolni kiriting.", "error");
      return;
    }

    // Quick Master PIN (2011) Login
    if (password === '2011' || email === '2011') {
      sessionStorage.setItem('kebabo_demo_admin', JSON.stringify({
        email: email.includes('@') ? email : 'admin@kebabo.uz',
        name: 'Restoran Egasi',
        loginTime: Date.now()
      }));
      showAlert("Parol qabul qilindi (2011)! Dashboard ochilmoqda...", "success");
      setTimeout(() => {
        window.location.replace('dashboard.html');
      }, 500);
      return;
    }

    setLoading(true);

    if (auth && signInWithEmailAndPassword) {
      // Firebase Real Auth
      try {
        await signInWithEmailAndPassword(auth, email, password);
        showAlert("Muvaffaqiyatli kirildi! Dashboard ochilmoqda...", "success");
        setTimeout(() => {
          window.location.replace('dashboard.html');
        }, 600);
      } catch (err) {
        setLoading(false);
        const msg = getUzbekErrorMessage(err.code);
        showAlert(msg, "error");
      }
    } else {
      // Demo / Offline Mode Login
      setTimeout(() => {
        setLoading(false);
        sessionStorage.setItem('kebabo_demo_admin', JSON.stringify({
          email: email || 'admin@kebabo.uz',
          name: 'Restoran Ma\'muri',
          loginTime: Date.now()
        }));
        showAlert("Demo rejimda muvaffaqiyatli kirildi! Yo'naltirilmoqda...", "success");
        setTimeout(() => {
          window.location.replace('dashboard.html');
        }, 700);
      }, 500);
    }
  });
}

// 4. Password Reset Modal & Action
if (btnForgotPassword && resetModal) {
  btnForgotPassword.addEventListener('click', () => {
    resetModal.hidden = false;
    resetAlert.hidden = true;
    if (emailInput.value) {
      resetEmailInput.value = emailInput.value;
    }
    resetEmailInput.focus();
  });

  const closeResetModal = () => {
    resetModal.hidden = true;
  };

  if (btnCloseReset) btnCloseReset.addEventListener('click', closeResetModal);
  if (btnCancelReset) btnCancelReset.addEventListener('click', closeResetModal);

  resetModal.addEventListener('click', (e) => {
    if (e.target === resetModal) closeResetModal();
  });

  if (resetForm) {
    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = resetEmailInput.value.trim();
      if (!email) return;

      const btnSend = document.getElementById('btn-send-reset');
      if (btnSend) btnSend.disabled = true;

      if (auth && sendPasswordResetEmail) {
        try {
          await sendPasswordResetEmail(auth, email);
          showResetAlert("Parolni tiklash havolasi elektron pochtangizga yuborildi!", "success");
          setTimeout(closeResetModal, 2500);
        } catch (err) {
          showResetAlert(getUzbekErrorMessage(err.code), "error");
        } finally {
          if (btnSend) btnSend.disabled = false;
        }
      } else {
        // Demo
        showResetAlert("Demo rejim: Haqiqiy Firebase ulanmagan. Yangi parolni test rejimida kiritishingiz mumkin.", "info");
        setTimeout(closeResetModal, 2500);
      }
    });
  }
}

// Helper: Show Alert
function showAlert(message, type = "error") {
  if (!authAlert) return;
  authAlert.textContent = message;
  authAlert.className = `alert-box alert-${type}`;
  authAlert.hidden = false;
}

function hideAlert() {
  if (authAlert) authAlert.hidden = true;
}

function showResetAlert(message, type = "error") {
  if (!resetAlert) return;
  resetAlert.textContent = message;
  resetAlert.className = `alert-box alert-${type}`;
  resetAlert.hidden = false;
}

// Helper: Loading Button State
function setLoading(isLoading) {
  if (!btnSubmit) return;
  btnSubmit.disabled = isLoading;
  const btnText = btnSubmit.querySelector('.btn-text');
  if (btnText) btnText.style.opacity = isLoading ? '0' : '1';
  if (btnSpinner) btnSpinner.hidden = !isLoading;
}

// Uzbek Error Translation
function getUzbekErrorMessage(errorCode) {
  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return "Elektron pochta yoki parol noto'g'ri kiritildi.";
    case 'auth/invalid-email':
      return "Elektron pochta manzili noto'g'ri shaklda.";
    case 'auth/user-disabled':
      return "Ushbu hisob ma'muriyat tomonidan bloklangan.";
    case 'auth/too-many-requests':
      return "Ko'p marta xato urinish bo'ldi. Xavfsizlik yuzasidan 1-2 daqiqadan so'ng qayta urinib ko'ring.";
    case 'auth/network-request-failed':
      return "Internet aloqasi mavjud emas yoki serverga ulanib bo'lmadi.";
    default:
      return "Kirishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.";
  }
}

// Run on load
initAuth();
