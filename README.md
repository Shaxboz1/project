# 🍢 KEBABO (marinade) — Raqamli QR Menyu (Mobile-First)

Zamonaviy, tez yuklanuvchi va smartfonlar uchun maxsus moslashtirilgan raqamli restoran menyusi. Mehmonlar stoldagi QR kodni skanerlab KEBABO menyusini ko'rishlari, taomlar va narxlar bilan tanishishlari mumkin.

---

## 📋 Mundarija
1. [Loyiha afzalliklari](#1-loyiha-afzalliklari)
2. [Fayllar tuzilishi](#2-fayllar-tuzilishi)
3. [Taomlar va narxlarni o'zgartirish](#3-taomlar-va-narxlarni-ozgartirish-menujson)
4. [Rasmlar va logotipni almashtirish](#4-rasmlar-va-logotipni-almashtirish)
5. [Internetga bepul joylash (Hosting / Deploy)](#5-saytni-bepul-internetga-joylash)
6. [QR kodni yangi havola bilan yangilash](#6-qr-kodni-yangilash)
7. [Stollar uchun A5 QR kartani chop etish](#7-stollar-uchun-a5-qr-kartani-chop-etish)
8. [Lokal kompyuterda ochish](#8-lokal-kompyuterda-ishga-tushirish)

---

## 1. Loyiha afzalliklari
- **Tez va yengil**: Og'ir kutubxonalarsiz (sof HTML5, zamonaviy CSS3 va Vanilla JavaScript).
- **Mobile-First dizayn**: Smartfonlarda ilova (PWA) kabi qulay va ravon ishlaydi.
- **Ko'p tilli (Multilingual)**: O'zbek (UZ), Rus (RU) va Ingliz (EN) tillarini sahifani qayta yuklamasdan lahzada almashtirish.
- **Mavzuli qorong'i dizayn**: Ko'mir va olov taassurotini beruvchi to'q ranglar, olovrang va tillarang urg'ular.
- **Qidiruv va filtrlar**: Jonli qidiruv hamda `Hit`, `Achchiq`, `Yangi` tezkor teglari.
- **Batafsil modal oyna**: Taom bosilganda pastdan chiquvchi qulay bottom-sheet modal.
- **Bir marta bosishda Wi-Fi**: Mehmonlar Wi-Fi parolini bitta tugma bilan nusxalashlari mumkin.
- **Bosmaga tayyor A5 QR karta**: Stollar uchun hashamatli A5 tent formati (`qr-print.html`).

---

## 2. Fayllar tuzilishi

```text
KEBABO/
├── index.html        # Asosiy menyu veb-sahifasi
├── style.css         # Dark & Fire premium dizayn stillari
├── script.js         # Ko'p tillilik, qidiruv, filtr va modal interaktivligi
├── menu.json         # Barcha taomlar, narxlar va restoran ma'lumotlari (bitta faylda)
├── menu-data.js      # Lokal 'file://' rejimida ochilganda uzluksiz ishlash uchun zaxira
├── qr-print.html     # Stol ustiga qo'yiladigan A5 formatdagi chop etish sahifasi
├── generate-qr.js    # QR kodlarni qayta generatsiya qiluvchi skript (SVG va PNG)
├── qr-code.svg       # Vektorli, istalgan o'lchamda xiralashmaydigan QR kod
├── qr-code.png       # Yuqori aniqlikdagi (888x888 px) QR kod rasmi
├── serve.js          # Lokal kompyuterda sinash uchun yengil server
└── README.md         # Ushbu qo'llanma
```

---

## 3. Taomlar va narxlarni o'zgartirish (`menu.json`)

Barcha ma'lumotlar `menu.json` faylida saqlanadi. Dasturchisiz ham istalgan kishi uni oddiy matn muharririda (Notepad, VS Code) o'zgartirishi mumkin.

### Restoran umumiy ma'lumotlari:
```json
"restaurant": {
  "name": "KEBAB HOUSE",
  "phone_display": "+998 (71) 200-00-00",
  "phone": "+998 71 200 00 00",
  "wifi": {
    "ssid": "KebabHouse_Guest",
    "password": "kebabhouse2026"
  },
  "menu_url": "https://kebabhouse.uz/menu"
}
```

### Taom qo'shish yoki narxini tahrirlash:
Har bir taom quyidagi oddiy strukturaga ega:
```json
{
  "id": "lula-kebab",
  "name": {
    "uz": "Lula kebab",
    "ru": "Люля-кебаб",
    "en": "Lula Kebab"
  },
  "description": {
    "uz": "Mol va qo'y go'shti qiyma aralashmasi...",
    "ru": "Нежнейший фарш из отборной говядины...",
    "en": "Minced beef and lamb blend..."
  },
  "price": 28000,
  "weight": "180 g",
  "badge": "hit",
  "image": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=700&q=80"
}
```

- **`price`**: Son ko'rinishida yoziladi (masalan, `28000`). Sayt uni avtomatik tarzda `"28 000 so'm"` qilib chiqaradi.
- **`badge`**:
  - `"hit"` — Oltin rangdagi `⭐ Hit` yorlig'i
  - `"yangi"` — Yashil rangdagi `✨ Yangi` yorlig'i
  - `"achchiq"` — Qizil rangdagi `🔥 Achchiq` yorlig'i
  - `null` — Yorliqsiz oddiy taom
- **`weight`**: Porsiya yoki hajm (masalan: `"180 g"`, `"0.5 l"`, `"1 choynak"`).

---

## 4. Rasmlar va logotipni almashtirish

1. **Unsplash yoki tashqi rasm havolalari**:
   - `menu.json` ichidagi `"image"` maydoniga yangi rasm havolasini qo'yishingiz kifoya.
   - Tez yuklanishi uchun havolaga `?auto=format&fit=crop&w=700&q=80` parametrlarini qo'shish tavsiya etiladi.
2. **O'z rasmlaringizdan foydalanish**:
   - Loyiha ichida `images/` nomli papka yarating.
   - Rasmni o'sha yerga joylang (masalan, `images/shashlik.jpg`).
   - `menu.json` faylida `"image": "images/shashlik.jpg"` deb ko'rsating.
3. **Logotip**:
   - `index.html` va `qr-print.html` ichidagi `.brand-name` matnini o'zgartirishingiz yoki o'rniga o'z logotipingiz bo'lgan `<img src="logo.png">` qo'yishingiz mumkin.

---

## 5. Saytni bepul internetga joylash

Ushbu sayt statik fayllardan iborat bo'lgani uchun uni bir necha daqiqada quyidagi bepul xizmatlarga joylashtirish mumkin:

### Usul 1: Netlify (Eng osoni — 1 daqiqa)
1. [app.netlify.com](https://app.netlify.com) saytiga kiring yoki ro'yxatdan o'ting.
2. Sahifadagi **"Drag and drop your site folder here"** maydoniga ushbu `KEBABO` papkasini sudrab tashlang.
3. Bir necha soniyada Netlify sizga bepul ishlovchi havola beradi (masalan: `https://kebabhouse-menu.netlify.app`).

### Usul 2: Vercel
1. [vercel.com](https://vercel.com) saytiga kiring.
2. Loyihani yuklang yoki GitHub repositoriyangizni ulang.
3. "Deploy" tugmasini bosing — tayyor!

### Usul 3: GitHub Pages
1. GitHub'da yangi ochiq (public) repozitoriy yarating.
2. Ushbu fayllarni yuklang (`git push`).
3. Repozitoriyaning **Settings -> Pages** bo'limiga kiring.
4. "Branch: main" tanlab, **Save** tugmasini bosing. Sayt `https://login.github.io/repo-nomi/` manzilida ishga tushadi.

---

## 6. QR kodni yangilash

Saytingiz internetga joylangandan so'ng (masalan, `https://menyu.kebabhouse.uz`), yangi manzil uchun QR kodni yaratish juda oson:

1. `menu.json` faylini oching va `"menu_url"` qatoriga yangi manzilingizni yozing:
   ```json
   "menu_url": "https://menyu.kebabhouse.uz"
   ```
2. Terminalda quyidagi buyruqni ishga tushiring:
   ```bash
   node generate-qr.js
   ```
3. Skript bir zumda `qr-code.svg` va `qr-code.png` fayllarini yangi havola bilan qayta chizib beradi. `qr-print.html` sahifasi esa avtomatik ravishda yangi QR kodni ko'rsatadi!

---

## 7. Stollar uchun A5 QR kartani chop etish

Stol ustiga qo'yiladigan maxsus taklifnoma kartasi tayyorlangan:
1. Brauzerda `qr-print.html` faylini oching.
2. Yuqoridagi **"Chop etish (Print A5)"** tugmasini bosing yoki klaviaturada `Ctrl + P` bosing.
3. Chop etish oynasida:
   - **Printer**: Rangli printer yoki "Save as PDF" (PDF sifatida saqlash).
   - **Qog'oz o'lchami**: `A5` (yoki A4 da 2 ta qilib chiqarish mumkin).
   - **Layout**: `Portrait` (tikka).
   - **Options**: "Background graphics" (Fon grafikasi) katakchasiga belgi qo'ying.
4. Kartada stol raqamini yozish uchun maxsus `STOL №: [ ___ ]` joyi, bepul Wi-Fi paroli va Instagram manzili ko'rsatilgan.

---

## 8. Lokal kompyuterda ishga tushirish

Lokal ravishda sinab ko'rish uchun:
1. Terminalda quyidagilarni bajaring:
   ```bash
   node serve.js
   ```
2. Brauzerda oching:
   - Menyu: [http://127.0.0.1:3000/](http://127.0.0.1:3000/)
   - Stol QR chop etish sahifasi: [http://127.0.0.1:3000/qr-print.html](http://127.0.0.1:3000/qr-print.html)

---

&copy; 2026 **KEBAB HOUSE**. Barcha huquqlar himoyalangan.
