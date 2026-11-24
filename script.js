/**
 * KEBAB HOUSE - Interactive Digital Menu Script
 * Vanilla JavaScript (Zero Dependencies)
 */

(function () {
  'use strict';

  // State Management
  const state = {
    menuData: null,
    currentLang: localStorage.getItem('kebab_menu_lang') || 'uz',
    activeFilter: 'all',
    searchQuery: '',
    activeCategoryId: null,
    tableTray: JSON.parse(sessionStorage.getItem('kebabo_table_tray') || '{}')
  };

  // DOM Elements
  const elements = {
    // Nav & Hero
    navBrandName: document.getElementById('nav-brand-name'),
    langBtns: document.querySelectorAll('.lang-btn'),
    heroStatus: document.getElementById('hero-status'),
    heroTitleMain: document.getElementById('hero-title-main'),
    heroTagline: document.getElementById('hero-tagline'),
    heroDesc: document.getElementById('hero-desc'),
    featHalal: document.getElementById('feat-halal'),
    featCharcoal: document.getElementById('feat-charcoal'),
    featSpeed: document.getElementById('feat-speed'),

    // Category Tabs & Sections
    categoryTabs: document.getElementById('category-tabs'),
    menuSections: document.getElementById('menu-sections'),
    menuLoading: document.getElementById('menu-loading'),

    // Search & Filter
    menuSearch: document.getElementById('menu-search'),
    searchClear: document.getElementById('search-clear'),
    filterChips: document.querySelectorAll('.chip'),
    emptyState: document.getElementById('empty-state'),
    emptyTitle: document.getElementById('empty-title'),
    emptyDesc: document.getElementById('empty-desc'),
    btnResetSearch: document.getElementById('btn-reset-search'),

    // Modal
    dishModal: document.getElementById('dish-modal'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    modalCloseAction: document.getElementById('modal-close-action'),
    modalImage: document.getElementById('modal-image'),
    modalBadges: document.getElementById('modal-badges'),
    modalTitle: document.getElementById('modal-title'),
    modalWeight: document.getElementById('modal-weight'),
    modalDescription: document.getElementById('modal-description'),
    modalPriceLabel: document.getElementById('modal-price-label'),
    modalPrice: document.getElementById('modal-price'),
    modalOrderTip: document.getElementById('modal-order-tip'),

    // Back to top & Toast
    backToTop: document.getElementById('back-to-top'),
    bttLabel: document.getElementById('btt-label'),
    toast: document.getElementById('toast'),

    // Footer & Wi-Fi
    wifiCardTitle: document.getElementById('wifi-card-title'),
    wifiCardSub: document.getElementById('wifi-card-sub'),
    wifiSsid: document.getElementById('wifi-ssid'),
    wifiPassword: document.getElementById('wifi-password'),
    copyWifiBtn: document.getElementById('copy-wifi-btn'),
    footerContactTitle: document.getElementById('footer-contact-title'),
    footerPhone: document.getElementById('footer-phone'),
    footerAddress: document.getElementById('footer-address'),
    footerHoursTitle: document.getElementById('footer-hours-title'),
    footerWorkingHours: document.getElementById('footer-working-hours'),
    footerSocialTitle: document.getElementById('footer-social-title'),
    instagramHandle: document.getElementById('instagram-handle'),
    telegramHandle: document.getElementById('telegram-handle'),
    linkInstagram: document.getElementById('link-instagram'),
    linkTelegram: document.getElementById('link-telegram'),
    footerBrandName: document.getElementById('footer-brand-name'),
    currentYear: document.getElementById('current-year')
  };

  // Static translations dictionary (used across UI & buttons)
  const UI_TEXTS = {
    uz: {
      status_open: "Ochiq • 10:00 - 23:00",
      feat_halal: "100% Halol go'sht",
      feat_charcoal: "Cho'g'da pishirilgan",
      feat_speed: "Tezkor xizmat",
      search_placeholder: "Taom qidirish (nomi yoki № raqami)...",
      filter_all: "Barchasi",
      filter_hit: "⭐ Xit taomlar",
      filter_spicy: "🔥 Achchiq",
      filter_new: "✨ Yangi",
      btn_view: "Batafsil",
      back_to_top: "Yuqoriga",
      price_label: "Narxi:",
      close: "Yopish",
      order_tip: "Buyurtma berish uchun stolingizga ofitsiantni taklif qiling.",
      empty_title: "Kechirasiz, taom topilmadi",
      empty_desc: "Iltimos, boshqa nom yoki raqam bilan qidirib ko'ring.",
      btn_reset: "Barcha taomlarni ko'rish",
      wifi_copied: "Wi-Fi paroli nusxalandi!",
      click_to_copy: "Nusxalash uchun bosing",
      wifi_title: "Mijozlar uchun bepul Wi-Fi",
      contact_title: "Aloqa va buyurtma",
      hours_title: "Ish vaqti",
      social_title: "Biz ijtimoiy tarmoqlarda",
      btn_enter_menu: "🍽️ Menyuga kirish",
      welcome_sub: "marinade • Raqamli stol menyusi",
      welcome_badge: "Stol QR-kodi",
      welcome_qr_desc: "Telefoningiz kamerasi orqali skanerlang yoki to'g'ridan-to'g'ri menyuga kiring",
      welcome_hint: "Olovda pishgan tansiq kaboblar va lazzatli taomlar",
      qr_button: "QR Kod"
    },
    ru: {
      status_open: "Открыто • 10:00 - 23:00",
      feat_halal: "100% Халяль мясо",
      feat_charcoal: "На древесных углях",
      feat_speed: "Быстрая подача",
      search_placeholder: "Поиск блюд (название или №)...",
      filter_all: "Все",
      filter_hit: "⭐ Хиты",
      filter_spicy: "🔥 Острое",
      filter_new: "✨ Новинки",
      btn_view: "Подробнее",
      back_to_top: "Наверх",
      price_label: "Цена:",
      close: "Закрыть",
      order_tip: "Для заказа пригласите официанта к вашему столику.",
      empty_title: "К сожалению, блюдо не найдено",
      empty_desc: "Попробуйте изменить запрос или сбросить фильтр.",
      btn_reset: "Показать все блюда",
      wifi_copied: "Пароль Wi-Fi скопирован!",
      click_to_copy: "Нажмите, чтобы скопировать",
      wifi_title: "Бесплатный Wi-Fi для гостей",
      contact_title: "Контакты и заказ",
      hours_title: "Режим работы",
      social_title: "Мы в соцсетях",
      btn_enter_menu: "🍽️ Открыть меню",
      welcome_sub: "marinade • Электронное меню на столах",
      welcome_badge: "QR-код стола",
      welcome_qr_desc: "Отсканируйте камерой смартфона или перейдите сразу в меню",
      welcome_hint: "Изысканные шашлыки на углях и восточные блюда",
      qr_button: "QR Код"
    },
    en: {
      status_open: "Open • 10:00 AM – 11:00 PM",
      feat_halal: "100% Halal Meat",
      feat_charcoal: "Charcoal Grilled",
      feat_speed: "Fast Service",
      search_placeholder: "Search dishes (name or №)...",
      filter_all: "All",
      filter_hit: "⭐ Best Sellers",
      filter_spicy: "🔥 Spicy",
      filter_new: "✨ New",
      btn_view: "Details",
      back_to_top: "Top",
      price_label: "Price:",
      close: "Close",
      order_tip: "Please call your waiter to place your table order.",
      empty_title: "Sorry, no dishes found",
      empty_desc: "Please try another keyword or reset the filter.",
      btn_reset: "View all dishes",
      wifi_copied: "Wi-Fi password copied!",
      click_to_copy: "Click to copy password",
      wifi_title: "Free Guest Wi-Fi",
      contact_title: "Contact & Delivery",
      hours_title: "Working Hours",
      social_title: "Follow Us",
      btn_enter_menu: "🍽️ Enter Menu",
      welcome_sub: "marinade • Digital Table Menu",
      welcome_badge: "Table QR Code",
      welcome_qr_desc: "Scan with your smartphone camera or enter the menu directly",
      welcome_hint: "Charcoal-grilled authentic kebabs and delicacies",
      qr_button: "QR Code"
    }
  };

  /**
   * Format numbers to sum representation: "45 000 so'm"
   */
  function formatPrice(amount, lang = state.currentLang) {
    if (typeof amount !== 'number') return amount;
    const formattedNum = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    const currency = state.menuData && state.menuData.restaurant && state.menuData.restaurant.currency
      ? state.menuData.restaurant.currency[lang] || "so'm"
      : (lang === 'ru' ? 'сум' : (lang === 'en' ? 'UZS' : "so'm"));
    return `${formattedNum} ${currency}`;
  }

  /**
   * Localized String Helper
   */
  function t(obj, lang = state.currentLang) {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[lang] || obj['uz'] || obj['ru'] || obj['en'] || '';
  }

  /**
   * Load menu data: Cache-First -> Realtime Firestore -> LocalStorage Sync -> menu.json Fallback
   */
  async function loadMenuData() {
    // 1. Instant Cache-First Load
    const cached = localStorage.getItem('kebabo_cached_menu');
    if (cached) {
      try {
        state.menuData = JSON.parse(cached);
        initApp();
      } catch (e) {}
    }

    // 2. Multi-tab LocalStorage Live Sync (Updates instantly when owner saves in Admin tab)
    window.addEventListener('storage', (e) => {
      if (!e.key || e.key === 'kebabo_cached_menu') {
        const updated = localStorage.getItem('kebabo_cached_menu');
        if (updated) {
          try {
            state.menuData = JSON.parse(updated);
            initApp();
          } catch (err) {}
        }
      }
    });

    // 3. Try Firebase Firestore Realtime Connection
    let firebaseConnected = false;
    try {
      const { 
        firebaseConfig, 
        isFirebaseConfigured, 
        FIREBASE_APP_URL, 
        FIREBASE_FIRESTORE_URL, 
        COLLECTIONS 
      } = await import('./firebase-config.js');

      if (isFirebaseConfigured()) {
        const { initializeApp, getApps } = await import(FIREBASE_APP_URL);
        const { getFirestore, doc, onSnapshot } = await import(FIREBASE_FIRESTORE_URL);

        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
        const db = getFirestore(app);
        const docRef = doc(db, COLLECTIONS.MENU_DATA, COLLECTIONS.DOCUMENT_ID);

        onSnapshot(docRef, (snapshot) => {
          if (snapshot.exists()) {
            state.menuData = snapshot.data();
            localStorage.setItem('kebabo_cached_menu', JSON.stringify(state.menuData));
            initApp();
          } else if (!state.menuData) {
            fallbackLoad();
          }
        }, (err) => {
          console.warn("Firestore realtime listener xatosi:", err);
          if (!state.menuData) fallbackLoad();
        });

        firebaseConnected = true;
      }
    } catch (err) {
      console.log("Firebase faol emas yoki offline:", err);
    }

    // 4. Fallback if not connected to Firebase and no cache
    if (!firebaseConnected && !state.menuData) {
      await fallbackLoad();
    }
  }

  async function fallbackLoad() {
    try {
      const response = await fetch('menu.json');
      if (!response.ok) throw new Error('Network error loading menu.json');
      state.menuData = await response.json();
    } catch (err) {
      console.warn('Could not load menu.json via fetch, using bundled fallback:', err);
      if (window.__MENU_FALLBACK__) {
        state.menuData = window.__MENU_FALLBACK__;
      }
    }

    if (state.menuData) {
      localStorage.setItem('kebabo_cached_menu', JSON.stringify(state.menuData));
      initApp();
    } else {
      if (elements.menuLoading) {
        elements.menuLoading.innerHTML = '<p style="color: #ff5722;">Menyu ma\'lumotlarini yuklashda xatolik yuz berdi. Iltimos, sahifani qayta yuklang.</p>';
      }
    }
  }

  /**
   * Initialize App
   */
  function initApp() {
    setupYear();
    applyRestaurantInfo();
    setupLanguageSwitcher();
    setupWelcomeQRScreen();
    setupTrayEvents();
    setupSearchAndFilters();
    setupBackToTop();
    setupModalEvents();
    setupWifiCopy();
    setupSecretAdminAccess();

    // Render Menu, Showcase & Categories
    renderCategoryTabs();
    renderChefsShowcase();
    renderMenu();
    updateTrayUI();
    updateUITranslations();
    setupScrollSpy();
  }

  /**
   * Set current year
   */
  function setupYear() {
    if (elements.currentYear) {
      elements.currentYear.textContent = new Date().getFullYear();
    }
  }

  /**
   * Populate Static Restaurant Info from menu.json
   */
  function applyRestaurantInfo() {
    const r = state.menuData.restaurant;
    if (!r) return;

    if (elements.navBrandName) elements.navBrandName.textContent = r.name;
    if (elements.heroTitleMain) elements.heroTitleMain.textContent = r.name;
    if (elements.footerBrandName) elements.footerBrandName.textContent = r.name;

    if (elements.wifiSsid && r.wifi) elements.wifiSsid.textContent = r.wifi.ssid;
    if (elements.wifiPassword && r.wifi) elements.wifiPassword.textContent = r.wifi.password;

    if (elements.footerPhone && r.phone_display) {
      elements.footerPhone.textContent = r.phone_display;
      elements.footerPhone.href = `tel:${r.phone.replace(/\s+/g, '')}`;
    }

    if (elements.instagramHandle && r.social && r.social.instagram) {
      elements.instagramHandle.textContent = r.social.instagram.handle;
      elements.linkInstagram.href = r.social.instagram.url;
    }

    if (elements.telegramHandle && r.social && r.social.telegram) {
      elements.telegramHandle.textContent = r.social.telegram.handle;
      elements.linkTelegram.href = r.social.telegram.url;
    }

    // Apply custom theme accent color if set in admin
    if (r.theme_accent) {
      document.documentElement.style.setProperty('--fire-orange', r.theme_accent);
      document.documentElement.style.setProperty('--fire-glow', r.theme_accent + '55');
    }
  }

  /**
   * Language Switcher Handler
   */
  function setupLanguageSwitcher() {
    elements.langBtns.forEach(btn => {
      if (btn.dataset.lang === state.currentLang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }

      btn.addEventListener('click', () => {
        const selectedLang = btn.dataset.lang;
        if (selectedLang === state.currentLang) return;

        state.currentLang = selectedLang;
        localStorage.setItem('kebab_menu_lang', selectedLang);

        elements.langBtns.forEach(b => b.classList.toggle('active', b.dataset.lang === selectedLang));
        document.documentElement.lang = selectedLang;

        updateUITranslations();
        renderCategoryTabs();
        renderMenu();

        // If modal is open, re-render modal content
        if (state.activeModalDish) {
          openDishModal(state.activeModalDish);
        }
      });
    });
  }

  /**
   * Update UI Text strings according to current language
   */
  function updateUITranslations() {
    const lang = state.currentLang;
    const txt = UI_TEXTS[lang] || UI_TEXTS.uz;
    const r = state.menuData.restaurant;

    // Hero Tagline & Description
    if (elements.heroTagline && r.tagline) elements.heroTagline.textContent = t(r.tagline);
    if (elements.heroDesc && r.description) elements.heroDesc.textContent = t(r.description);

    // Hero features
    if (elements.heroStatus) elements.heroStatus.textContent = txt.status_open;
    if (elements.featHalal) elements.featHalal.textContent = txt.feat_halal;
    if (elements.featCharcoal) elements.featCharcoal.textContent = txt.feat_charcoal;
    if (elements.featSpeed) elements.featSpeed.textContent = txt.feat_speed;

    // Search and Filters
    if (elements.menuSearch) elements.menuSearch.placeholder = txt.search_placeholder;
    const chipAll = document.getElementById('chip-all');
    const chipHit = document.getElementById('chip-hit');
    const chipSpicy = document.getElementById('chip-spicy');
    const chipNew = document.getElementById('chip-new');
    if (chipAll) chipAll.textContent = txt.filter_all;
    if (chipHit) chipHit.textContent = txt.filter_hit;
    if (chipSpicy) chipSpicy.textContent = txt.filter_spicy;
    if (chipNew) chipNew.textContent = txt.filter_new;

    // Empty search strings
    if (elements.emptyTitle) elements.emptyTitle.textContent = txt.empty_title;
    if (elements.emptyDesc) elements.emptyDesc.textContent = txt.empty_desc;
    if (elements.btnResetSearch) elements.btnResetSearch.textContent = txt.btn_reset;

    // Modal texts
    if (elements.modalPriceLabel) elements.modalPriceLabel.textContent = txt.price_label;
    if (elements.modalCloseAction) elements.modalCloseAction.textContent = txt.close;
    if (elements.modalOrderTip) elements.modalOrderTip.textContent = txt.order_tip;

    // Back to top button text
    if (elements.bttLabel) elements.bttLabel.textContent = txt.back_to_top;

    // Footer & Wi-Fi Card
    if (elements.wifiCardTitle) elements.wifiCardTitle.textContent = txt.wifi_title;
    if (elements.wifiCardSub) elements.wifiCardSub.textContent = txt.click_to_copy;
    if (elements.footerContactTitle) elements.footerContactTitle.textContent = txt.contact_title;
    if (elements.footerHoursTitle) elements.footerHoursTitle.textContent = txt.hours_title;
    if (elements.footerSocialTitle) elements.footerSocialTitle.textContent = txt.social_title;

    if (elements.footerAddress && r.address) elements.footerAddress.textContent = t(r.address);
    if (elements.footerWorkingHours && r.working_hours) elements.footerWorkingHours.textContent = t(r.working_hours);

    // Welcome QR Screen
    const btnEnterText = document.getElementById('btn-enter-menu-text');
    const welcomeSub = document.getElementById('welcome-sub-text');
    const welcomeBadge = document.getElementById('welcome-badge-text');
    const welcomeDesc = document.getElementById('welcome-qr-desc');
    const welcomeHint = document.getElementById('welcome-hint-text');
    const qrBtnText = document.querySelector('.btn-show-qr-text');

    if (btnEnterText) btnEnterText.textContent = txt.btn_enter_menu;
    if (welcomeSub) welcomeSub.textContent = txt.welcome_sub;
    if (welcomeBadge) welcomeBadge.textContent = txt.welcome_badge;
    if (welcomeDesc) welcomeDesc.textContent = txt.welcome_qr_desc;
    if (welcomeHint) welcomeHint.textContent = txt.welcome_hint;
    if (qrBtnText) qrBtnText.textContent = txt.qr_button;
  }

  /**
   * Setup Welcome QR Code Screen (Entry Gate)
   */
  function setupWelcomeQRScreen() {
    const screen = document.getElementById('welcome-qr-screen');
    const btnEnter = document.getElementById('btn-enter-menu');
    const btnClose = document.getElementById('btn-close-welcome-qr');
    const btnShow = document.getElementById('btn-show-qr');

    if (!screen) return;

    // Direct hash (like #admin) bypasses welcome screen
    if (window.location.hash && window.location.hash !== '#welcome' && window.location.hash !== '') {
      screen.classList.add('is-hidden');
    }

    const hideWelcomeScreen = () => {
      screen.classList.add('is-hidden');
    };

    const showWelcomeScreen = () => {
      screen.classList.remove('is-hidden');
    };

    if (btnEnter) {
      btnEnter.addEventListener('click', () => {
        hideWelcomeScreen();
        const hero = document.getElementById('hero');
        if (hero) hero.scrollIntoView({ behavior: 'smooth' });
      });
    }

    if (btnClose) {
      btnClose.addEventListener('click', hideWelcomeScreen);
    }

    if (btnShow) {
      btnShow.addEventListener('click', showWelcomeScreen);
    }

    screen.addEventListener('click', (e) => {
      if (e.target === screen) {
        hideWelcomeScreen();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !screen.classList.contains('is-hidden')) {
        hideWelcomeScreen();
      }
    });
  }

  /**
   * Render Category Tabs in Sticky Navigation Bar
   */
  function renderCategoryTabs() {
    if (!elements.categoryTabs || !state.menuData.categories) return;

    elements.categoryTabs.innerHTML = '';
    const visibleCats = state.menuData.categories.filter(c => c.is_visible !== false);

    visibleCats.forEach((cat, index) => {
      const tab = document.createElement('a');
      tab.href = `#cat-${cat.id}`;
      tab.className = `cat-tab ${index === 0 && !state.activeCategoryId ? 'active' : (state.activeCategoryId === cat.id ? 'active' : '')}`;
      tab.dataset.catId = cat.id;

      const catName = t(cat.name);
      const itemCount = cat.items ? cat.items.length : 0;

      tab.innerHTML = `
        <span class="cat-tab-icon">${cat.icon || '🍢'}</span>
        <span class="cat-tab-name">${catName}</span>
        <span class="cat-tab-count">${itemCount}</span>
      `;

      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const targetSection = document.getElementById(`cat-${cat.id}`);
        if (targetSection) {
          const navOffset = 65; // Height of sticky navigation
          const targetPos = targetSection.getBoundingClientRect().top + window.pageYOffset - navOffset;
          window.scrollTo({
            top: targetPos,
            behavior: 'smooth'
          });

          document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          state.activeCategoryId = cat.id;
        }
      });

      elements.categoryTabs.appendChild(tab);
    });
  }

  /**
   * Render Menu Categories and Cards
   */
  function renderMenu() {
    if (!elements.menuSections || !state.menuData.categories) return;

    elements.menuSections.innerHTML = '';

    const lang = state.currentLang;
    const txt = UI_TEXTS[lang] || UI_TEXTS.uz;
    const query = state.searchQuery.toLowerCase().trim();
    const filter = state.activeFilter;

    let totalVisibleItems = 0;

    state.menuData.categories.forEach(cat => {
      // Skip hidden category
      if (cat.is_visible === false) return;

      // Filter category items
      const matchingItems = cat.items.filter(item => {
        // Tag badge filter
        if (filter !== 'all') {
          if (filter === 'hit' && item.badge !== 'hit') return false;
          if (filter === 'achchiq' && item.badge !== 'achchiq') return false;
          if (filter === 'yangi' && item.badge !== 'yangi') return false;
        }

        // Search query filter (matches name, description, weight or item number)
        if (query) {
          const name = t(item.name).toLowerCase();
          const desc = t(item.description).toLowerCase();
          const weight = (item.weight || '').toLowerCase();
          const itemNum = (item.item_num || '').toLowerCase();
          if (!name.includes(query) && !desc.includes(query) && !weight.includes(query) && !itemNum.includes(query)) {
            return false;
          }
        }

        return true;
      });

      if (matchingItems.length === 0) {
        return; // Skip empty category if filtered out
      }

      totalVisibleItems += matchingItems.length;

      // Create Category Group
      const group = document.createElement('section');
      group.className = 'category-group';
      group.id = `cat-${cat.id}`;

      // Header
      const header = document.createElement('div');
      header.className = 'category-header';
      header.innerHTML = `
        <div>
          <div class="category-header-main">
            <span class="category-icon-large">${cat.icon || '🍢'}</span>
            <h2 class="category-title">${t(cat.name)}</h2>
            <span class="category-count-pill">(${matchingItems.length})</span>
          </div>
          ${cat.subtitle ? `<p class="category-subtext">${t(cat.subtitle)}</p>` : ''}
        </div>
      `;
      group.appendChild(header);

      // Dishes Grid
      const grid = document.createElement('div');
      grid.className = 'dishes-grid';

      matchingItems.forEach(item => {
        const card = createDishCard(item, txt);
        grid.appendChild(card);
      });

      group.appendChild(grid);
      elements.menuSections.appendChild(group);
    });

    // Check empty state
    if (elements.emptyState) {
      if (totalVisibleItems === 0) {
        elements.emptyState.hidden = false;
        elements.menuSections.hidden = true;
      } else {
        elements.emptyState.hidden = true;
        elements.menuSections.hidden = false;
      }
    }
  }

  /**
   * Create a single dish card
   */
  function createDishCard(item, txt) {
    const card = document.createElement('article');
    const isAvailable = item.is_available !== false;
    card.className = `dish-card ${!isAvailable ? 'is-sold-out' : ''}`;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `${t(item.name)}, ${formatPrice(item.price)}`);

    // Badge markup
    let badgeHtml = '';
    if (!isAvailable) {
      const soldOutLabel = state.currentLang === 'ru' ? 'Закончилось' : (state.currentLang === 'en' ? 'Sold Out' : 'Tugagan');
      badgeHtml = `<span class="badge badge-sold-out">⛔ ${soldOutLabel}</span>`;
    } else if (item.badge) {
      let badgeLabel = item.badge;
      let badgeClass = `badge-${item.badge}`;
      let badgeIcon = '';

      if (item.badge === 'hit') {
        badgeIcon = '⭐';
        badgeLabel = state.currentLang === 'ru' ? 'Хит' : (state.currentLang === 'en' ? 'Hit' : 'Hit');
      } else if (item.badge === 'yangi') {
        badgeIcon = '✨';
        badgeLabel = state.currentLang === 'ru' ? 'Новинка' : (state.currentLang === 'en' ? 'New' : 'Yangi');
      } else if (item.badge === 'achchiq') {
        badgeIcon = '🔥';
        badgeLabel = state.currentLang === 'ru' ? 'Острое' : (state.currentLang === 'en' ? 'Spicy' : 'Achchiq');
      }

      badgeHtml = `<span class="badge ${badgeClass}">${badgeIcon} ${badgeLabel}</span>`;
    }

    const numberTag = item.item_num ? `<span class="card-number-badge">№ ${item.item_num}</span>` : '';
    const addBtnLabel = state.currentLang === 'ru' ? '+ Добавить' : (state.currentLang === 'en' ? '+ Add' : '+ Qo\'shish');

    card.innerHTML = `
      <div class="card-image-wrap">
        <img 
          src="${item.image}" 
          alt="${t(item.name)}" 
          class="dish-img" 
          loading="lazy" 
          decoding="async"
          onerror="this.src='https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=700&q=80'"
        >
        <div class="card-overlay"></div>
        ${numberTag}
        ${badgeHtml ? `<div class="card-badge-top-left">${badgeHtml}</div>` : ''}
        ${item.weight ? `<span class="card-weight-pill">${item.weight}</span>` : ''}
      </div>

      <div class="card-content">
        <h3 class="dish-name">${t(item.name)}</h3>
        <p class="dish-desc">${t(item.description)}</p>
        <div class="card-footer">
          <div class="dish-price-wrap">
            <span class="dish-price">${formatPrice(item.price)}</span>
          </div>
          <div class="card-actions-row">
            ${isAvailable ? `
              <button type="button" class="btn-card-add" data-dish-id="${item.id}" aria-label="Stolga qo'shish" title="Stol hisob-kitobiga qo'shish">
                <span>${addBtnLabel}</span>
              </button>
            ` : ''}
            <button type="button" class="btn-card-view-icon" aria-label="Batafsil">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;

    card.addEventListener('click', (e) => {
      const addBtn = e.target.closest('.btn-card-add');
      if (addBtn) {
        e.stopPropagation();
        addToTray(item.id, item);
      } else {
        openDishModal(item);
      }
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDishModal(item);
      }
    });

    return card;
  }

  // ============================================================================
  // TABLE BILL TRAY MANAGEMENT (Mening stolim hisob-kitobi)
  // ============================================================================
  function addToTray(dishId, dishObj) {
    if (!state.tableTray) state.tableTray = {};
    if (state.tableTray[dishId]) {
      state.tableTray[dishId].count++;
    } else {
      state.tableTray[dishId] = {
        item: dishObj,
        count: 1
      };
    }
    sessionStorage.setItem('kebabo_table_tray', JSON.stringify(state.tableTray));
    updateTrayUI();
    showToast(`"${t(dishObj.name)}" stol hisobiga qo'shildi! 🧾`);
    if ('vibrate' in navigator) navigator.vibrate(35);
  }

  function removeFromTray(dishId) {
    if (!state.tableTray || !state.tableTray[dishId]) return;
    state.tableTray[dishId].count--;
    if (state.tableTray[dishId].count <= 0) {
      delete state.tableTray[dishId];
    }
    sessionStorage.setItem('kebabo_table_tray', JSON.stringify(state.tableTray));
    updateTrayUI();
  }

  function clearTray() {
    state.tableTray = {};
    sessionStorage.removeItem('kebabo_table_tray');
    updateTrayUI();
    showToast("Stol hisobi tozalandi.");
  }

  function updateTrayUI() {
    const tray = state.tableTray || {};
    const keys = Object.keys(tray);
    let totalCount = 0;
    let subtotal = 0;

    keys.forEach(id => {
      const entry = tray[id];
      totalCount += entry.count;
      subtotal += (entry.item.price || 0) * entry.count;
    });

    const floatingTray = document.getElementById('floating-table-tray');
    const trayPillCount = document.getElementById('tray-pill-count');
    const trayPillTotal = document.getElementById('tray-pill-total');
    const headerBadge = document.getElementById('tray-counter-badge');

    // Update floating bar
    if (floatingTray) {
      floatingTray.hidden = (totalCount === 0);
    }
    if (trayPillCount) trayPillCount.textContent = totalCount;
    if (trayPillTotal) trayPillTotal.textContent = formatPrice(subtotal);

    // Update header badge
    if (headerBadge) {
      headerBadge.textContent = totalCount;
      headerBadge.hidden = (totalCount === 0);
    }

    // Update modal elements
    const emptyBox = document.getElementById('tray-empty-box');
    const itemsList = document.getElementById('tray-items-list');
    const summaryBox = document.getElementById('tray-summary-box');
    const actionsBox = document.getElementById('tray-actions');
    const itemsCountText = document.getElementById('tray-items-count-text');
    const subtotalVal = document.getElementById('tray-subtotal-val');
    const grandTotalVal = document.getElementById('tray-grand-total');

    if (emptyBox) emptyBox.hidden = (totalCount > 0);
    if (itemsList) itemsList.hidden = (totalCount === 0);
    if (summaryBox) summaryBox.hidden = (totalCount === 0);
    if (actionsBox) actionsBox.hidden = (totalCount === 0);

    if (itemsCountText) itemsCountText.textContent = `${totalCount} ta`;
    if (subtotalVal) subtotalVal.textContent = formatPrice(subtotal);
    if (grandTotalVal) grandTotalVal.textContent = formatPrice(subtotal);

    if (itemsList && totalCount > 0) {
      itemsList.innerHTML = '';
      keys.forEach(id => {
        const entry = tray[id];
        const item = entry.item;
        const row = document.createElement('div');
        row.className = 'tray-item-row';
        row.innerHTML = `
          <img src="${item.image}" alt="${t(item.name)}" class="tray-item-thumb">
          <div class="tray-item-details">
            <h4 class="tray-item-name">${t(item.name)}</h4>
            <span class="tray-item-unit-price">${formatPrice(item.price)} &times; ${entry.count} = ${formatPrice(item.price * entry.count)}</span>
          </div>
          <div class="tray-stepper">
            <button type="button" class="btn-step btn-minus" data-id="${id}" aria-label="Kamaytirish">-</button>
            <span class="tray-item-count-val">${entry.count}</span>
            <button type="button" class="btn-step btn-plus" data-id="${id}" aria-label="Ko'paytirish">+</button>
          </div>
        `;
        itemsList.appendChild(row);
      });
    }
  }

  function setupTrayEvents() {
    const floatingTray = document.getElementById('floating-table-tray');
    const btnOpenTray = document.getElementById('btn-open-tray');
    const btnOpenArea = document.getElementById('btn-open-tray-area');
    const btnHeaderTray = document.getElementById('btn-tray-header');
    const trayModal = document.getElementById('tray-modal');
    const btnCloseTray = document.getElementById('btn-close-tray');
    const btnClearTray = document.getElementById('btn-clear-tray');
    const btnWaiterView = document.getElementById('btn-waiter-view');
    const waiterModal = document.getElementById('waiter-modal');
    const btnCloseWaiter = document.getElementById('btn-close-waiter');
    const btnWaiterDone = document.getElementById('btn-waiter-done');
    const tableNumInput = document.getElementById('table-num-input');
    const itemsList = document.getElementById('tray-items-list');

    const openTray = () => {
      if (trayModal) {
        trayModal.hidden = false;
        updateTrayUI();
      }
    };

    const closeTray = () => {
      if (trayModal) trayModal.hidden = true;
    };

    if (btnOpenTray) btnOpenTray.addEventListener('click', openTray);
    if (btnOpenArea) btnOpenArea.addEventListener('click', openTray);
    if (btnHeaderTray) btnHeaderTray.addEventListener('click', openTray);
    if (btnCloseTray) btnCloseTray.addEventListener('click', closeTray);

    if (trayModal) {
      trayModal.addEventListener('click', (e) => {
        if (e.target === trayModal) closeTray();
      });
    }

    if (btnClearTray) {
      btnClearTray.addEventListener('click', () => {
        if (confirm("Rostdan ham stol hisobini tozalashni xohlaysizmi?")) {
          clearTray();
        }
      });
    }

    // Steppers inside tray modal
    if (itemsList) {
      itemsList.addEventListener('click', (e) => {
        const btnPlus = e.target.closest('.btn-plus');
        const btnMinus = e.target.closest('.btn-minus');
        if (btnPlus) {
          const id = btnPlus.dataset.id;
          if (state.tableTray[id]) {
            addToTray(id, state.tableTray[id].item);
          }
        } else if (btnMinus) {
          const id = btnMinus.dataset.id;
          removeFromTray(id);
        }
      });
    }

    // Table number persistence
    if (tableNumInput) {
      const savedTable = sessionStorage.getItem('kebabo_table_number') || '1';
      tableNumInput.value = savedTable;
      tableNumInput.addEventListener('input', (e) => {
        sessionStorage.setItem('kebabo_table_number', e.target.value);
      });
    }

    // Waiter Quick Receipt view
    if (btnWaiterView) {
      btnWaiterView.addEventListener('click', () => {
        if (trayModal) trayModal.hidden = true;
        if (waiterModal) {
          const waiterTableTitle = document.getElementById('waiter-table-title');
          const waiterList = document.getElementById('waiter-items-list');
          const waiterTotalVal = document.getElementById('waiter-total-val');
          const tableNum = tableNumInput?.value || '1';

          if (waiterTableTitle) waiterTableTitle.textContent = `Stol № ${tableNum}`;

          if (waiterList) {
            waiterList.innerHTML = '';
            let total = 0;
            const tray = state.tableTray || {};
            Object.keys(tray).forEach(id => {
              const entry = tray[id];
              total += entry.item.price * entry.count;
              const line = document.createElement('div');
              line.className = 'waiter-item-line';
              line.innerHTML = `
                <span><span class="item-qty">${entry.count}x</span> ${t(entry.item.name)}</span>
                <strong>${formatPrice(entry.item.price * entry.count)}</strong>
              `;
              waiterList.appendChild(line);
            });
            if (waiterTotalVal) waiterTotalVal.textContent = formatPrice(total);
          }

          waiterModal.hidden = false;
        }
      });
    }

    if (btnCloseWaiter) btnCloseWaiter.addEventListener('click', () => { if (waiterModal) waiterModal.hidden = true; });
    if (btnWaiterDone) btnWaiterDone.addEventListener('click', () => { if (waiterModal) waiterModal.hidden = true; });
  }

  // ============================================================================
  // CHEF'S SPECIALS SHOWCASE (Oshpaz durdonalari)
  // ============================================================================
  function renderChefsShowcase() {
    const container = document.getElementById('chefs-showcase-carousel');
    if (!container || !state.menuData?.categories) return;

    container.innerHTML = '';

    // Collect all kebabs
    let allKebabs = [];
    state.menuData.categories.forEach(c => {
      if (c.items) allKebabs.push(...c.items);
    });

    // Select featured signature skewers
    const signatureNums = ['11', '36', '29', '28', '15', '18'];
    let specials = allKebabs.filter(k => signatureNums.includes(String(k.item_num)));
    if (specials.length === 0) {
      specials = allKebabs.slice(0, 5);
    }

    const addLabel = state.currentLang === 'ru' ? '+ Добавить' : (state.currentLang === 'en' ? '+ Add' : '+ Qo\'shish');

    specials.forEach(dish => {
      const card = document.createElement('div');
      card.className = 'showcase-card';
      card.innerHTML = `
        <div class="showcase-img-wrap">
          <img src="${dish.image}" alt="${t(dish.name)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=700&q=80'">
          <div class="showcase-crown-tag">👑 № ${dish.item_num || 'Hit'}</div>
        </div>
        <div class="showcase-body">
          <h3 class="showcase-item-title">${t(dish.name)}</h3>
          <span class="showcase-weight">${dish.weight || '1 six • 180g'}</span>
          <div class="showcase-bottom-row">
            <span class="showcase-price">${formatPrice(dish.price)}</span>
            <button type="button" class="btn-showcase-add" data-showcase-id="${dish.id}">
              ${addLabel}
            </button>
          </div>
        </div>
      `;

      card.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-showcase-add');
        if (btn) {
          e.stopPropagation();
          addToTray(dish.id, dish);
        } else {
          openDishModal(dish);
        }
      });

      container.appendChild(card);
    });
  }

  /**
   * Dish Detail Modal
   */
  function openDishModal(item) {
    state.activeModalDish = item;
    const txt = UI_TEXTS[state.currentLang] || UI_TEXTS.uz;

    elements.modalTitle.textContent = t(item.name);
    elements.modalDescription.textContent = t(item.description);
    elements.modalPrice.textContent = formatPrice(item.price);
    elements.modalWeight.textContent = item.weight || '';
    elements.modalImage.src = item.image;
    elements.modalImage.alt = t(item.name);

    // Badges in modal
    elements.modalBadges.innerHTML = '';
    if (item.badge) {
      let badgeLabel = item.badge;
      let badgeClass = `badge-${item.badge}`;
      let badgeIcon = '';

      if (item.badge === 'hit') {
        badgeIcon = '⭐';
        badgeLabel = state.currentLang === 'ru' ? 'Хит' : (state.currentLang === 'en' ? 'Hit' : 'Hit');
      } else if (item.badge === 'yangi') {
        badgeIcon = '✨';
        badgeLabel = state.currentLang === 'ru' ? 'Новинка' : (state.currentLang === 'en' ? 'New' : 'Yangi');
      } else if (item.badge === 'achchiq') {
        badgeIcon = '🔥';
        badgeLabel = state.currentLang === 'ru' ? 'Острое' : (state.currentLang === 'en' ? 'Spicy' : 'Achchiq');
      }

      const b = document.createElement('span');
      b.className = `badge ${badgeClass}`;
      b.innerHTML = `${badgeIcon} ${badgeLabel}`;
      elements.modalBadges.appendChild(b);
    }

    if (item.is_available === false) {
      elements.modalOrderTip.textContent = state.currentLang === 'ru' 
        ? '⛔ Данное блюдо сегодня закончилось (временно недоступно).' 
        : (state.currentLang === 'en' 
            ? '⛔ This item is sold out today (temporarily unavailable).' 
            : '⛔ Ushbu taom bugun tugagan (vaqtincha mavjud emas).');
    } else {
      elements.modalOrderTip.textContent = txt.order_tip;
    }

    const modalAddBtn = document.getElementById('modal-add-to-tray-btn');
    if (modalAddBtn) {
      if (item.is_available === false) {
        modalAddBtn.style.display = 'none';
      } else {
        modalAddBtn.style.display = 'inline-flex';
        modalAddBtn.textContent = state.currentLang === 'ru' 
          ? '+ В стол' 
          : (state.currentLang === 'en' ? '+ Add to table' : '+ Stolga qo\'shish');
      }
    }

    elements.dishModal.hidden = false;
    // Allow paint then trigger CSS transition
    requestAnimationFrame(() => {
      elements.dishModal.classList.add('is-open');
    });
    document.body.style.overflow = 'hidden';
  }

  function closeDishModal() {
    elements.dishModal.classList.remove('is-open');
    setTimeout(() => {
      elements.dishModal.hidden = true;
      document.body.style.overflow = '';
      state.activeModalDish = null;
    }, 250);
  }

  function setupModalEvents() {
    elements.modalCloseBtn.addEventListener('click', closeDishModal);
    elements.modalCloseAction.addEventListener('click', closeDishModal);

    const modalAddBtn = document.getElementById('modal-add-to-tray-btn');
    if (modalAddBtn) {
      modalAddBtn.addEventListener('click', () => {
        if (state.activeModalDish && state.activeModalDish.is_available !== false) {
          addToTray(state.activeModalDish.id, state.activeModalDish);
          closeDishModal();
        }
      });
    }

    elements.dishModal.addEventListener('click', (e) => {
      if (e.target === elements.dishModal) {
        closeDishModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !elements.dishModal.hidden) {
        closeDishModal();
      }
    });
  }

  /**
   * Search & Quick Filters Logic
   */
  function setupSearchAndFilters() {
    // Search input
    let debounceTimer;
    elements.menuSearch.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const val = e.target.value;
      elements.searchClear.hidden = !val;

      debounceTimer = setTimeout(() => {
        state.searchQuery = val;
        renderMenu();
      }, 200);
    });

    // Clear search button
    elements.searchClear.addEventListener('click', () => {
      elements.menuSearch.value = '';
      elements.searchClear.hidden = true;
      state.searchQuery = '';
      elements.menuSearch.focus();
      renderMenu();
    });

    // Reset from empty state
    if (elements.btnResetSearch) {
      elements.btnResetSearch.addEventListener('click', () => {
        elements.menuSearch.value = '';
        elements.searchClear.hidden = true;
        state.searchQuery = '';
        state.activeFilter = 'all';

        elements.filterChips.forEach(c => {
          c.classList.toggle('active', c.dataset.filter === 'all');
        });

        renderMenu();
      });
    }

    // Filter Chips
    elements.filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const filterVal = chip.dataset.filter;
        if (state.activeFilter === filterVal) return;

        state.activeFilter = filterVal;
        elements.filterChips.forEach(c => c.classList.toggle('active', c === chip));
        renderMenu();
      });
    });
  }

  /**
   * Scroll-Spy using IntersectionObserver
   */
  function setupScrollSpy() {
    const sections = document.querySelectorAll('.category-group');
    if (!sections.length || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const catId = entry.target.id.replace('cat-', '');
          state.activeCategoryId = catId;

          document.querySelectorAll('.cat-tab').forEach(tab => {
            const isActive = tab.dataset.catId === catId;
            tab.classList.toggle('active', isActive);
            if (isActive) {
              // Ensure active tab is visible in horizontal scroll container
              tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
          });
        }
      });
    }, {
      root: null,
      rootMargin: '-75px 0px -60% 0px',
      threshold: 0
    });

    sections.forEach(sec => observer.observe(sec));
  }

  /**
   * Floating Back to Top Button
   */
  function setupBackToTop() {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 350) {
        elements.backToTop.hidden = false;
      } else {
        elements.backToTop.hidden = true;
      }
    }, { passive: true });

    elements.backToTop.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  /**
   * Wi-Fi Password Copy with Toast Notification
   */
  function setupWifiCopy() {
    if (!elements.copyWifiBtn) return;

    elements.copyWifiBtn.addEventListener('click', async () => {
      const pwd = elements.wifiPassword ? elements.wifiPassword.textContent.trim() : 'kebabhouse2026';
      const txt = UI_TEXTS[state.currentLang] || UI_TEXTS.uz;

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(pwd);
        } else {
          // Fallback for older browsers
          const ta = document.createElement('textarea');
          ta.value = pwd;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        showToast(`📶 ${txt.wifi_copied}`);
      } catch (err) {
        showToast(`Wi-Fi: ${pwd}`);
      }
    });
  }

  /**
   * Toast Display Helper
   */
  let toastTimer;
  function showToast(message) {
    if (!elements.toast) return;
    clearTimeout(toastTimer);

    elements.toast.textContent = message;
    elements.toast.classList.add('show');

    toastTimer = setTimeout(() => {
      elements.toast.classList.remove('show');
    }, 2800);
  }

  /**
   * Secret Admin Access Handlers:
   * 1. Triple tap or long-press (1.4s) on top brand logo
   * 2. URL hash #admin (e.g. site.uz/#admin)
   * 3. Five taps on footer text
   * 4. Keyboard shortcut Alt+A or Ctrl+Shift+A
   */
  function setupSecretAdminAccess() {
    const trigger = document.getElementById('brand-secret-trigger');
    const footerTrigger = document.getElementById('footer-secret-trigger');

    const openAdmin = () => {
      if ('vibrate' in navigator) navigator.vibrate(60);
      window.location.href = 'admin/index.html';
    };

    // 1. URL Hash check
    if (window.location.hash === '#admin') {
      openAdmin();
    }
    window.addEventListener('hashchange', () => {
      if (window.location.hash === '#admin') openAdmin();
    });

    // 2. Keyboard shortcut (Alt + A or Ctrl + Shift + A)
    window.addEventListener('keydown', (e) => {
      if ((e.altKey && (e.key === 'a' || e.key === 'A')) || (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a'))) {
        e.preventDefault();
        openAdmin();
      }
    });

    // 3. Logo Triple Tap & Long Press
    if (trigger) {
      let tapCount = 0;
      let tapTimer = null;
      let holdTimer = null;

      // Tap handling
      trigger.addEventListener('click', () => {
        tapCount++;
        clearTimeout(tapTimer);
        tapTimer = setTimeout(() => { tapCount = 0; }, 1200);

        if (tapCount >= 3) {
          tapCount = 0;
          openAdmin();
        }
      });

      // Long press handling (Mobile & Desktop)
      const startHold = () => {
        holdTimer = setTimeout(() => {
          openAdmin();
        }, 1400);
      };
      const cancelHold = () => {
        clearTimeout(holdTimer);
      };

      trigger.addEventListener('touchstart', startHold, { passive: true });
      trigger.addEventListener('touchend', cancelHold, { passive: true });
      trigger.addEventListener('touchcancel', cancelHold, { passive: true });
      trigger.addEventListener('mousedown', startHold);
      trigger.addEventListener('mouseup', cancelHold);
      trigger.addEventListener('mouseleave', cancelHold);
    }

    // 4. Footer 5-Tap Secret
    if (footerTrigger) {
      let fCount = 0;
      let fTimer = null;
      footerTrigger.addEventListener('click', () => {
        fCount++;
        clearTimeout(fTimer);
        fTimer = setTimeout(() => { fCount = 0; }, 1500);
        if (fCount >= 5) {
          fCount = 0;
          openAdmin();
        }
      });
    }
  }

  // Start initialization
  loadMenuData();

})();
