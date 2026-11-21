# 🍢 KEBABO — Admin Panel & Firebase Qo'llanmasi

Ushbu qo'llanmada **KEBABO** restoranining raqamli menyusini kodga tegmasdan to'liq boshqarish, yangi taomlar qo'shish, narxlarni o'zgartirish, stop-list (mavjud emas) qilish va Firebase bepul Spark tarifini ulash bo'yicha batafsil ko'rsatmalar berilgan.

---

## 📋 Mundarija
1. [Admin Panelga kirish](#1-admin-panelga-kirish)
2. [Firebase loyihasini bepul yaratish va ulash](#2-firebase-loyihasini-yaratish-va-ulash)
3. [Xavfsizlik qoidalarini (Rules) o'rnatish](#3-xavfsizlik-qoidalarini-rules-ornatish)
4. [Admin foydalanuvchisini yaratish](#4-admin-foydalanuvchisini-yaratish)
5. [Admin paneldan foydalanish bo'yicha qo'llanma](#5-admin-paneldan-foydalanish-boyicha-qollanma)
   - [Taomlarni boshqarish va Stop-list](#a-taomlarni-boshqarish-va-stop-list)
   - [Tezkor narx tahrirlash](#b-tezkor-narx-tahrirlash)
   - [Ommaviy amallar (Bulk actions)](#c-ommaviy-amallar-narxlarni-foizga-oshirish)
   - [Rasmlarni yuklash va avtomatik siqish](#d-rasmlarni-yuklash-va-avtomatik-siqish)
   - [Kategoriyalarni surib tartiblash (Drag & Drop)](#e-kategoriyalarni-boshqarish-va-surib-tartiblash)
   - [Restoran sozlamalari va Mavzu rangi](#f-restoran-sozlamalari-va-mavzu-rangi)
   - [Asboblar, Zaxiralash (Backup) va QR Kod](#g-asboblar-zaxiralash-va-qr-kod)
6. [Saytni internetga bepul joylash (Deploy)](#6-saytni-internetga-bepul-joylash-deploy)

---

## 1. Admin Panelga kirish

Admin panel asosiy menyu bilan to'liq ulangan, ammo **oddiy mehmonlardan butunlay maxfiy saqlangan** (hech qanday ko'rinuvchi "Admin" havolasi yoki tugmasi yo'q):

### 🔒 Asosiy menyudan maxfiy kirish usullari (Restoran egasi uchun):
1. **Logotipni 3 marta tez bosish (Triple-Tap)**: Sahifaning yuqorisidagi olov rangli logotipni ketma-ket 3 marta bosing.
2. **Logotipni bosib turish (Long-Press)**: Logotip ustiga barmog'ingizni 1.4 soniya bosib turing.
3. **URL orqali kirish**: Brauzer manziliga `#admin` qo'shib bosing (masalan: `http://127.0.0.1:3000/#admin` yoki `https://sizningsaytingiz.uz/#admin`).
4. **Footer 5-Tap**: Sahifa eng pastidagi "Mobile-first QR Menyu tizimi" yozuvini 5 marta ketma-ket bosing.
5. **Klaviatura orqali (kompyuterda)**: `Alt + A` yoki `Ctrl + Shift + A`.

To'g'ridan-to'g'ri havola: [http://127.0.0.1:3000/admin/](http://127.0.0.1:3000/admin/)

- **Sinov (Demo) rejimi**: Agar Firebase kalitlari hali kiritilmagan bo'lsa, tizim avtomatik ravishda demo rejimida ishlaydi. Sinash uchun istalgan email va parolni kiriting (masalan: `admin@kebabo.uz` / `admin123`). Barcha funksiyalar brauzeringizda to'liq ishlaydi va o'zgarishlar asosiy menyuda darhol jonli ko'rinadi!

---

## 2. Firebase loyihasini yaratish va ulash

Firebase mutlaqo bepul (**Spark Plan**) bo'lib, uning bepul limitlari kichik va o'rta restoranlar uchun bir necha yilga bemalol yetadi.

### 1-qadam: Firebase Console'da loyiha ochish
1. [console.firebase.google.com](https://console.firebase.google.com/) saytiga kiring (Google hisobingiz orqali).
2. **"Add project"** (Loyiha qo'shish) tugmasini bosing.
3. Loyiha nomini kiriting (masalan: `kebabo-menu`) va **Continue** ni bosing.
4. Google Analytics so'ralsa, uni o'chirib qo'yishingiz mumkin (shart emas) va **Create project** ni bosing.

### 2-qadam: Web App qo'shish va kalitlarni olish
1. Loyiha bosh sahifasida veb belgisi **`</>` (Web)** ustiga bosing.
2. Ilova nomini kiriting (masalan: `kebabo-web`) va **Register app** tugmasini bosing.
3. Ekranda `const firebaseConfig = { ... }` kodi chiqadi.
4. Ushbu qiymatlarni nusxalab, loyihangizdagi `firebase-config.js` fayliga qo'ying:

```javascript
// firebase-config.js
export const firebaseConfig = {
  apiKey: "AIzaSyBxxxxxx...",
  authDomain: "kebabo-menu.firebaseapp.com",
  projectId: "kebabo-menu",
  storageBucket: "kebabo-menu.appspot.com",
  messagingSenderId: "123456789...",
  appId: "1:123456789:web:abcdef..."
};
```

### 3-qadam: Authentication (Kirish tizimi)ni yoqish
1. Firebase chap menyusidan **Build -> Authentication** bo'limiga kiring.
2. **"Get started"** tugmasini bosing.
3. **Sign-in method** ro'yxatidan **"Email/Password"** ni tanlang.
4. **Enable** tugmachasini yoqing va **Save** ni bosing.

### 4-qadam: Firestore Database (Ma'lumotlar bazasi)ni yoqish
1. Chap menyudan **Build -> Firestore Database** bo'limiga kiring.
2. **"Create database"** tugmasini bosing.
3. Joylashuvni tanlang (masalan: `eur3 (europe-west)` yoki `nam5 (us-central)`) va **Next** bosing.
4. **"Start in production mode"** ni tanlang va **Create** bosing.

### 5-qadam: Firebase Storage (Rasmlar ombori)ni yoqish
1. Chap menyudan **Build -> Storage** bo'limiga kiring.
2. **"Get started"** tugmasini bosing.
3. **"Start in production mode"** ni tanlang va **Done** bosing.

---

## 3. Xavfsizlik qoidalarini (Rules) o'rnatish

Tizim xavfsiz bo'lishi va begona kishilar menyuni o'zgartira olmasligi uchun loyihada tayyor `firestore.rules` va `storage.rules` fayllari yaratilgan.

### Firestore qoidalarini joylash:
1. Firebase Console -> **Firestore Database** -> **Rules** tabiga kiring.
2. Loyihangizdagi `firestore.rules` fayli ichidagi matnni to'liq ko'chirib, o'sha yerga qo'ying:
```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /menu_data/{documentId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```
3. **Publish** (Chop etish) tugmasini bosing.

### Storage qoidalarini joylash:
1. Firebase Console -> **Storage** -> **Rules** tabiga kiring.
2. `storage.rules` fayli ichidagi matnni ko'chirib qo'ying va **Publish** tugmasini bosing.

> 🔒 **Xavfsizlik kafolati:** Endi oddiy mehmonlar menyuni faqat o'qiy oladi; taomlarni qo'shish, o'chirish yoki narxini o'zgartirish faqat tizimga kirgan adminga ruxsat etiladi!

---

## 4. Admin foydalanuvchisini yaratish

1. Firebase Console -> **Authentication** -> **Users** tabiga kiring.
2. **"Add user"** tugmasini bosing.
3. Restoran ma'murining elektron pochtasi va xavfsiz parolini kiriting (masalan: `admin@kebabo.uz` va kuchli parol).
4. **Add user** tugmasini bosing.
5. Endi ushbu email va parol bilan `admin/index.html` orqali panelga kirishingiz mumkin!

---

## 5. Admin paneldan foydalanish bo'yicha qo'llanma

### A) Taomlarni boshqarish va Stop-list
- **Yangi taom (kabob, salat, non, ichimlik) qo'shish**: Yuqoridagi **"+ Yangi taom qo'shish"** tugmasini bosing. O'zbekcha, Ruscha va Inglizcha nom, narx, porsiya va toifani tanlang.
- **Tezkor bo'lim qo'shish (`+ Yangi bo'lim`)**: Taom qo'shish oynasidan chiqmasdan toifalar ro'yxati yonidagi `+ Yangi bo'lim` tugmasini bosib, yangi kategoriya (masalan: "Salatlar", "Desertlar", "Qo'shimchalar") nomini kiritishingiz mumkin. Kategoriya mos emoji bilan avtomatik yaratiladi va tanlanadi!
- **Stop-list ("Tugagan")**: Agar ma'lum bir taom oshxonada qolmagan bo'lsa, uni o'chirish shart emas! Kartochkadagi **"Sotuvda"** tugmachasini bitta bosish kifoya — taom darhol qizil **"⛔ TUGAGAN"** holatiga o'tadi va ommaviy menyuda mehmonlarga tugaganligi ko'rinadi. Ertasi kuni yana bitta bosish bilan sotuvga qaytarasiz.
- **Nusxalash (Duplicate)**: O'xshash taomlarni qayta kiritmaslik uchun nusxa ko'chirish tugmasidan foydalaning.
- **O'chirish va Bekor qilish (Undo)**: Agar taom adashib o'chirib yuborilsa, pastda paydo bo'ladigan **"Bekor qilish"** tugmasi orqali 5 soniya ichida uni asl holiga qaytarishingiz mumkin.

### B) Tezkor narx tahrirlash
- Taom kartochkasidagi narx ustiga (masalan: `18 000 so'm`) bosing.
- Kichik maydon ochiladi: yangi narxni yozing va `Enter` yoki `✓` tugmasini bosing. Narx butun menyuda darhol yangilanadi!

### C) Ommaviy amallar (Narxlarni foizga oshirish)
- Bir nechta yoki barcha taomlarning katakchasini (checkbox) belgilang.
- Pastda maxsus boshqaruv paneli chiqadi:
  - Tanlanganlarni birdaniga **"Mavjud qilish"** yoki **"Stop-list ga olish"**.
  - **"Narxni foizga o'zgartirish"**: Masalan barcha go'sht narxi oshgan bo'lsa, `+10%` yoki `+15%` tanlab bir marta bosish orqali barcha tanlangan taomlar narxini 500 so'mgacha yaxlitlab oshirishingiz mumkin.

### D) Rasmlarni yuklash va tayyor fotosuratlar kutubxonasi
- **Telefon kamerasi yoki galereyadan yuklash**: Katta va sifatli rasm tanlansa ham, brauzer uni avtomatik tarzda **1000px WebP** formatiga siqadi (xotirani 90% gacha tejaydi).
- **🖼️ Tayyor fotosuratlar kutubxonasi**: Taom oynasida "🖼️ Tayyor sifatli fotosuratlar" tugmasini bosing:
  - 🍢 **Shashliklar**: Lula kebab, Tikka mol go'shti, Qo'y go'shti, Tovuq, Tabaki, Qovurg'a, Jigar, Lavash rulet...
  - 🥗 **Salatlar**: Achichuk (pomidor-piyoz), Grek salat, Suzma/Qatiq, Bahor salati...
  - 🥖 **Non & Somsa**: Tandir non, Patir non, Issiq somsa...
  - 🥤 **Ichimliklar**: Choynakda choy, Yaxna limonad, Mineral suv, Coca-Cola...
  - 🍔 **Fast food**: Burger, Cheeseburger, Fri, Nuggets...
  Bitta bosish orqali istalgan taomga ajoyib, professional rasm o'rnatiladi!
- **URL orqali qo'yish**: Istasangiz internetdagi to'g'ridan-to'g'ri rasm havolasini ham kiritishingiz mumkin.

### E) Kategoriyalarni boshqarish va surib tartiblash
- **Kategoriyalar** bo'limida yangi bo'limlar ochish, ularning emojisini o'zgartirish yoki vaqtincha yashirib qo'yish mumkin.
- **Surib tartiblash (Drag & Drop)**: Sichqoncha yoki barmoq bilan `☰` belgisidan ushlab, toifalarni o'zingiz xohlagan tartibda yuqoriga-pastga siljiting.

### F) Restoran sozlamalari va Mavzu rangi
- **Sozlamalar** bo'limida restoran nomi, shior, telefon, ish vaqti, Wi-Fi nomi va parolini o'zgartirishingiz mumkin.
- **Mavzu asosiy rangi (Theme Accent)**: Maxsus rang tanlagich orqali restoraningiz brend rangini (masalan: olovrang `#ff5722`, qahrabo `#ff9800`, zumrad `#10b981`) tanlang. Bu rang ommaviy menyu dizayniga ham bir zumda qo'llaniladi!

### G) Asboblar, Zaxiralash va QR Kod
- **Statistika**: Menyudagi jami taomlar soni, kategoriyalar va stop-listdagi taomlar sonini ko'rib turasiz.
- **QR Kod vositasi**: Havolani o'zgartirish, SVG/PNG formatida yuklab olish va bosmaga tayyor A5 stol kartasini (`qr-print.html`) ochish.
- **Zaxiralash (Backup)**: "JSON Eksport qilish" tugmasi orqali menyu nusxasini kompyuteringizga saqlab oling.
- **Bir bosishda menu.json ni ko'chirish**: Yangi Firebase loyihasini ochganingizda, **"Hozirgi menu.json ni import qilish"** tugmasini bosing — mavjud 34 ta taom darhol bazaga yuklanadi!

---

## 6. Saytni internetga bepul joylash (Deploy)

Ushbu loyihani istalgan bepul hostingga bir necha daqiqada joylash mumkin:

### Usul 1: Firebase Hosting (Tavsiya etiladi)
Firebase loyihangiz bo'lgani uchun uni o'zining bepul xostingiga chiqarish juda qulay:
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Usul 2: Netlify (Eng osoni — 1 daqiqa)
1. [app.netlify.com](https://app.netlify.com) saytiga kiring.
2. Butun `KEBABO` papkasini sudrab (drag & drop) tashlang.
3. Saytingiz internetda ishga tushadi (masalan: `https://kebabo.netlify.app`).
4. Admin panel esa `https://kebabo.netlify.app/admin/` manzilida ishlaydi.

### Usul 3: Vercel yoki GitHub Pages
Xuddi shu tartibda Vercel yoki GitHub Pages xizmatlariga ham yuklashingiz mumkin.

---

&copy; 2026 **KEBABO**. Barcha huquqlar himoyalangan.
