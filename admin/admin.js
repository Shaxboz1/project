/**
 * KEBABO - Admin Dashboard Core Application
 * Full-featured Vanilla JS (ES Modules) with Firebase v10 Integration
 */

import { 
  firebaseConfig, 
  isFirebaseConfigured, 
  FIREBASE_APP_URL, 
  FIREBASE_AUTH_URL, 
  FIREBASE_FIRESTORE_URL, 
  FIREBASE_STORAGE_URL,
  COLLECTIONS
} from '../firebase-config.js';

// Application State
const appState = {
  isFirebase: false,
  db: null,
  auth: null,
  storage: null,
  user: null,
  menuData: null,
  selectedItemIds: new Set(),
  activeTab: 'items',
  searchQuery: '',
  filterCategory: 'all',
  filterStatus: 'all',
  recentlyDeletedItem: null,
  undoTimeout: null,
  inactivityTimer: null
};

// ============================================================================
// 1. INITIALIZATION & AUTHENTICATION GUARD
// ============================================================================

async function initAdminApp() {
  setupTheme();
  setupInactivityAutoLogout();

  if (isFirebaseConfigured()) {
    try {
      const { initializeApp, getApps } = await import(FIREBASE_APP_URL);
      const authModule = await import(FIREBASE_AUTH_URL);
      const firestoreModule = await import(FIREBASE_FIRESTORE_URL);
      const storageModule = await import(FIREBASE_STORAGE_URL);

      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      appState.auth = authModule.getAuth(app);
      appState.db = firestoreModule.getFirestore(app);
      appState.storage = storageModule.getStorage(app);
      appState.isFirebase = true;

      // Auth Guard
      authModule.onAuthStateChanged(appState.auth, (user) => {
        if (!user) {
          window.location.replace('index.html');
        } else {
          appState.user = user;
          updateUserDisplay(user.email);
          setConnectionStatus('online', 'Firebase ulangan');
          startRealtimeSync(firestoreModule);
        }
      });
    } catch (err) {
      console.warn("Firebase yuklanmadi, lokal/demo rejimiga o'tildi:", err);
      initDemoSession();
    }
  } else {
    initDemoSession();
  }

  setupEventListeners();
}

function initDemoSession() {
  appState.isFirebase = false;
  const demoUser = sessionStorage.getItem('kebabo_demo_admin');
  if (!demoUser) {
    window.location.replace('index.html');
    return;
  }
  const parsed = JSON.parse(demoUser);
  updateUserDisplay(parsed.email || 'admin@kebabo.uz');
  setConnectionStatus('demo', 'Sinov (Demo) rejimi');
  loadInitialMenuData();
}

function updateUserDisplay(email) {
  const sidebarEmail = document.getElementById('sidebar-user-email');
  if (sidebarEmail) sidebarEmail.textContent = email;
}

function setConnectionStatus(type, text) {
  const statusPill = document.getElementById('connection-status');
  const statusText = document.getElementById('connection-status-text');
  if (statusText) statusText.textContent = text;
  if (statusPill) {
    statusPill.className = `status-pill ${type === 'demo' ? 'warning' : 'success'}`;
  }
}

// 30 daqiqa harakatsizlikdan so'ng avtomatik chiqish
function setupInactivityAutoLogout() {
  const resetTimer = () => {
    clearTimeout(appState.inactivityTimer);
    appState.inactivityTimer = setTimeout(() => {
      logoutAdmin("Xavfsizlik yuzasidan 30 daqiqa harakatsizlikdan so'ng tizimdan chiqildi.");
    }, 30 * 60 * 1000);
  };

  ['mousemove', 'keydown', 'touchstart', 'click'].forEach(evt => {
    window.addEventListener(evt, resetTimer, { passive: true });
  });
  resetTimer();
}

function logoutAdmin(msg = null) {
  if (msg) alert(msg);
  if (appState.auth) {
    import(FIREBASE_AUTH_URL).then(({ signOut }) => signOut(appState.auth));
  }
  sessionStorage.removeItem('kebabo_demo_admin');
  window.location.replace('index.html');
}

// ============================================================================
// 2. DATA SYNCHRONIZATION (FIRESTORE & LOCAL STORAGE)
// ============================================================================

async function startRealtimeSync(firestoreModule) {
  const { doc, onSnapshot } = firestoreModule;
  const menuDocRef = doc(appState.db, COLLECTIONS.MENU_DATA, COLLECTIONS.DOCUMENT_ID);

  onSnapshot(menuDocRef, async (snapshot) => {
    if (snapshot.exists()) {
      appState.menuData = snapshot.data();
      localStorage.setItem('kebabo_cached_menu', JSON.stringify(appState.menuData));
      renderAll();
    } else {
      // Document doesn't exist yet -> load menu.json and seed Firestore
      await loadInitialMenuData();
      saveMenuData(appState.menuData, false);
    }
  }, (err) => {
    console.error("Firestore onSnapshot xatosi:", err);
    loadInitialMenuData();
  });
}

async function loadInitialMenuData() {
  // 1. Try local storage cache
  const cached = localStorage.getItem('kebabo_cached_menu');
  if (cached) {
    try {
      appState.menuData = JSON.parse(cached);
      renderAll();
      return;
    } catch (e) {}
  }

  // 2. Fetch menu.json
  try {
    const res = await fetch('../menu.json');
    if (res.ok) {
      appState.menuData = await res.json();
    } else {
      throw new Error("menu.json topilmadi");
    }
  } catch (err) {
    if (window.__MENU_FALLBACK__) {
      appState.menuData = JSON.parse(JSON.stringify(window.__MENU_FALLBACK__));
    }
  }

  if (appState.menuData) {
    localStorage.setItem('kebabo_cached_menu', JSON.stringify(appState.menuData));
    renderAll();
  }
}

async function saveMenuData(newData, showToastMsg = true) {
  appState.menuData = newData;
  localStorage.setItem('kebabo_cached_menu', JSON.stringify(newData));

  // Trigger public menu storage update event for live multi-tab sync
  window.dispatchEvent(new Event('storage'));

  if (appState.isFirebase && appState.db) {
    try {
      const { doc, setDoc } = await import(FIREBASE_FIRESTORE_URL);
      const menuDocRef = doc(appState.db, COLLECTIONS.MENU_DATA, COLLECTIONS.DOCUMENT_ID);
      await setDoc(menuDocRef, {
        ...newData,
        updated_at: new Date().toISOString()
      }, { merge: true });
      if (showToastMsg) showToast("✅ O'zgarishlar Firebase'da saqlandi!");
    } catch (err) {
      console.error("Firestore ga yozishda xato:", err);
      showToast("⚠️ Firebase'ga yozilmadi, lokal saqlandi.", "error");
    }
  } else {
    if (showToastMsg) showToast("✅ O'zgarishlar saqlandi (Lokal rejim)!");
  }

  renderAll();
}

// ============================================================================
// 3. UI RENDERING (TABS, ITEMS, CATEGORIES, STATS)
// ============================================================================

function renderAll() {
  if (!appState.menuData) return;

  updateBadges();
  renderItemsList();
  renderCategoriesList();
  renderSettingsForm();
  renderToolsAndStats();
}

function updateBadges() {
  let totalItems = 0;
  if (appState.menuData.categories) {
    appState.menuData.categories.forEach(c => {
      totalItems += (c.items ? c.items.length : 0);
    });
  }

  const badgeItems = document.getElementById('count-items-badge');
  const badgeCats = document.getElementById('count-cats-badge');
  if (badgeItems) badgeItems.textContent = totalItems;
  if (badgeCats) badgeCats.textContent = appState.menuData.categories ? appState.menuData.categories.length : 0;
}

// ----------------------------------------------------------------------------
// RENDER: ITEMS LIST
// ----------------------------------------------------------------------------
function renderItemsList() {
  const container = document.getElementById('items-container');
  const categorySelect = document.getElementById('filter-category');
  if (!container || !appState.menuData.categories) return;

  // Populate category filter dropdown
  if (categorySelect && categorySelect.options.length <= 1) {
    categorySelect.innerHTML = '<option value="all">Barcha kategoriyalar</option>';
    appState.menuData.categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = `${cat.icon || ''} ${t(cat.name)}`;
      categorySelect.appendChild(opt);
    });
    categorySelect.value = appState.filterCategory;
  }

  container.innerHTML = '';
  const query = appState.searchQuery.toLowerCase().trim();

  let hasVisibleItems = 0;

  appState.menuData.categories.forEach(cat => {
    if (appState.filterCategory !== 'all' && cat.id !== appState.filterCategory) {
      return;
    }

    const filteredItems = (cat.items || []).filter(item => {
      // Status filter
      if (appState.filterStatus === 'available' && item.is_available === false) return false;
      if (appState.filterStatus === 'unavailable' && item.is_available !== false) return false;

      // Search filter
      if (query) {
        const name = t(item.name).toLowerCase();
        const desc = t(item.description).toLowerCase();
        const weight = (item.weight || '').toLowerCase();
        const num = (item.item_num || '').toLowerCase();
        if (!name.includes(query) && !desc.includes(query) && !weight.includes(query) && !num.includes(query)) {
          return false;
        }
      }

      return true;
    });

    if (filteredItems.length === 0) return;

    hasVisibleItems += filteredItems.length;

    // Category Block
    const catBlock = document.createElement('div');
    catBlock.className = 'items-category-block';
    catBlock.dataset.catId = cat.id;

    catBlock.innerHTML = `
      <div class="items-category-header">
        <h3 class="items-category-title">
          <span>${cat.icon || '🍢'}</span>
          <span>${t(cat.name)}</span>
          <span class="meta-pill">${filteredItems.length} ta</span>
        </h3>
      </div>
      <div class="items-grid" data-category-grid="${cat.id}"></div>
    `;

    const grid = catBlock.querySelector('.items-grid');

    filteredItems.forEach(item => {
      const card = createItemCard(item, cat.id);
      grid.appendChild(card);
    });

    // Setup drag and drop for items inside this category
    setupItemsDragAndDrop(grid, cat.id);

    container.appendChild(catBlock);
  });

  if (hasVisibleItems === 0) {
    container.innerHTML = `
      <div class="empty-state text-center" style="padding: 3rem 1rem;">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔍</div>
        <h3>Taom topilmadi</h3>
        <p style="color: var(--text-muted); font-size: 0.85rem;">Qidiruv yoki filtr mezonlariga mos keladigan taom yo'q.</p>
      </div>
    `;
  }

  updateBulkBar();
}

function createItemCard(item, catId) {
  const card = document.createElement('div');
  const isAvailable = item.is_available !== false;
  card.className = `admin-item-card ${!isAvailable ? 'is-unavailable' : ''}`;
  card.dataset.itemId = item.id;
  card.dataset.catId = catId;
  card.draggable = true;

  // Badges markup
  let badgeHtml = '';
  if (item.badge) {
    const badgeMap = {
      'hit': '⭐ Hit',
      'yangi': '✨ Yangi',
      'achchiq': '🔥 Achchiq'
    };
    badgeHtml = `<span class="badge-tag ${item.badge}">${badgeMap[item.badge] || item.badge}</span>`;
  }

  const isChecked = appState.selectedItemIds.has(item.id);

  card.innerHTML = `
    <div class="item-top-row">
      <div class="item-select-wrap">
        <label class="custom-checkbox">
          <input type="checkbox" class="item-checkbox" data-id="${item.id}" ${isChecked ? 'checked' : ''}>
          <span class="checkmark"></span>
        </label>
        <span class="drag-handle" title="Surib tartiblash">☰</span>
      </div>
      <div class="item-top-badges">
        ${!isAvailable ? '<span class="sold-out-badge">⛔ TUGAGAN</span>' : ''}
        ${badgeHtml}
      </div>
    </div>

    <div class="item-card-body">
      <img 
        src="${escapeHtml(item.image || '')}" 
        alt="${escapeHtml(t(item.name))}" 
        class="item-card-thumb"
        onerror="this.src='https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=300&q=80'"
      >
      <div class="item-card-details">
        <h4 class="item-card-title">${escapeHtml(t(item.name))}</h4>
        <p class="item-card-desc">${escapeHtml(t(item.description) || 'Tavsif kiritilmagan')}</p>
        <div class="item-card-meta">
          ${item.weight ? `<span class="meta-pill">${escapeHtml(item.weight)}</span>` : ''}
          ${item.item_num ? `<span class="meta-pill" style="font-weight:700;">${escapeHtml(item.item_num)}</span>` : ''}
        </div>
      </div>
    </div>

    <!-- Quick Inline Price Editor -->
    <div class="item-price-row">
      <div class="price-display-wrapper" data-id="${item.id}">
        <span class="price-inline-display" title="Narxni tezkor tahrirlash">${formatPrice(item.price)}</span>
      </div>
      
      <!-- One Tap Stop-list switch -->
      <label class="stop-list-toggle" title="Sotuvda bor / yo'qligini belgilash">
        <span>${isAvailable ? 'Sotuvda' : 'Tugagan'}</span>
        <div class="toggle-switch" style="transform: scale(0.85);">
          <input type="checkbox" class="toggle-availability" data-id="${item.id}" data-cat-id="${catId}" ${isAvailable ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </div>
      </label>
    </div>

    <div class="item-card-actions">
      <div class="action-btn-group">
        <button type="button" class="btn-icon-action btn-edit-item" data-id="${item.id}" data-cat-id="${catId}" title="Tahrirlash">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button type="button" class="btn-icon-action btn-duplicate-item" data-id="${item.id}" data-cat-id="${catId}" title="Nusxalash">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
        <button type="button" class="btn-icon-action delete btn-delete-item" data-id="${item.id}" data-cat-id="${catId}" title="O'chirish">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </div>
  `;

  // Item Checkbox listener
  const checkbox = card.querySelector('.item-checkbox');
  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      appState.selectedItemIds.add(item.id);
    } else {
      appState.selectedItemIds.delete(item.id);
    }
    updateBulkBar();
  });

  // Inline Price Edit Trigger
  const priceDisplay = card.querySelector('.price-inline-display');
  priceDisplay.addEventListener('click', () => {
    showInlinePriceInput(card.querySelector('.price-display-wrapper'), item, catId);
  });

  // Stop-list quick toggle
  const availToggle = card.querySelector('.toggle-availability');
  availToggle.addEventListener('change', () => {
    toggleItemAvailability(catId, item.id, availToggle.checked);
  });

  // Action Buttons
  card.querySelector('.btn-edit-item').addEventListener('click', () => openItemModal(item, catId));
  card.querySelector('.btn-duplicate-item').addEventListener('click', () => duplicateItem(catId, item));
  card.querySelector('.btn-delete-item').addEventListener('click', () => confirmDeleteItem(catId, item));

  return card;
}

function showInlinePriceInput(container, item, catId) {
  container.innerHTML = `
    <div class="price-inline-edit">
      <input type="number" class="price-inline-input" value="${item.price}" min="0" step="500">
      <button type="button" class="btn-save-inline-price">✓</button>
    </div>
  `;
  const input = container.querySelector('.price-inline-input');
  const btn = container.querySelector('.btn-save-inline-price');
  input.focus();

  const save = () => {
    const newPrice = parseInt(input.value, 10);
    if (!isNaN(newPrice) && newPrice >= 0 && newPrice !== item.price) {
      updateItemField(catId, item.id, 'price', newPrice);
    } else {
      container.innerHTML = `<span class="price-inline-display" title="Narxni tezkor tahrirlash">${formatPrice(item.price)}</span>`;
      container.querySelector('.price-inline-display').addEventListener('click', () => showInlinePriceInput(container, item, catId));
    }
  };

  btn.addEventListener('click', save);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') renderItemsList();
  });
}

function toggleItemAvailability(catId, itemId, isAvailable) {
  updateItemField(catId, itemId, 'is_available', isAvailable);
  const statusStr = isAvailable ? "sotuvga chiqarildi" : "stop-listga olindi";
  showToast(`Taom holati yangilandi (${statusStr})`);
}

function updateItemField(catId, itemId, field, value) {
  const categories = appState.menuData.categories;
  for (const cat of categories) {
    if (cat.id === catId) {
      const itm = cat.items.find(i => i.id === itemId);
      if (itm) {
        itm[field] = value;
        saveMenuData(appState.menuData);
        return;
      }
    }
  }
}

// ----------------------------------------------------------------------------
// RENDER: CATEGORIES LIST
// ----------------------------------------------------------------------------
function renderCategoriesList() {
  const container = document.getElementById('categories-list');
  if (!container || !appState.menuData.categories) return;

  container.innerHTML = '';

  appState.menuData.categories.forEach((cat, index) => {
    const card = document.createElement('div');
    card.className = 'cat-admin-card';
    card.dataset.catId = cat.id;
    card.dataset.index = index;
    card.draggable = true;

    const itemCount = cat.items ? cat.items.length : 0;
    const isVisible = cat.is_visible !== false;

    card.innerHTML = `
      <div class="cat-card-left">
        <span class="drag-handle" title="Surib tartiblash">☰</span>
        <span class="cat-card-icon">${cat.icon || '🍢'}</span>
        <div>
          <h4 class="cat-card-title">${escapeHtml(t(cat.name))}</h4>
          <span class="cat-card-subtitle">${escapeHtml(t(cat.subtitle) || '')} (${itemCount} ta taom)</span>
        </div>
      </div>
      <div class="cat-card-right">
        <label class="toggle-switch" title="Ko'rsatish / Yashirish">
          <input type="checkbox" class="cat-toggle-vis" data-cat-id="${cat.id}" ${isVisible ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
        <button type="button" class="btn-icon-action btn-edit-cat" data-cat-id="${cat.id}" title="Tahrirlash">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button type="button" class="btn-icon-action delete btn-delete-cat" data-cat-id="${cat.id}" title="O'chirish">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;

    // Toggle Visibility
    card.querySelector('.cat-toggle-vis').addEventListener('change', (e) => {
      cat.is_visible = e.target.checked;
      saveMenuData(appState.menuData);
    });

    // Edit & Delete
    card.querySelector('.btn-edit-cat').addEventListener('click', () => openCategoryModal(cat));
    card.querySelector('.btn-delete-cat').addEventListener('click', () => confirmDeleteCategory(cat));

    container.appendChild(card);
  });

  setupCategoriesDragAndDrop(container);
}

// ----------------------------------------------------------------------------
// RENDER: SETTINGS FORM
// ----------------------------------------------------------------------------
function renderSettingsForm() {
  const r = appState.menuData.restaurant;
  if (!r) return;

  setValue('set-name', r.name || 'KEBABO');
  setValue('set-brand-tagline', r.brand_tagline || 'marinade');
  setValue('set-tagline-uz', r.tagline?.uz || '');
  setValue('set-tagline-ru', r.tagline?.ru || '');
  setValue('set-tagline-en', r.tagline?.en || '');

  setValue('set-phone-display', r.phone_display || '');
  setValue('set-phone', r.phone || '');
  setValue('set-address-uz', r.address?.uz || '');
  setValue('set-hours-uz', r.working_hours?.uz || '');

  setValue('set-wifi-ssid', r.wifi?.ssid || '');
  setValue('set-wifi-password', r.wifi?.password || '');
  setValue('set-currency', r.currency?.uz || "so'm");

  setValue('set-instagram', r.social?.instagram?.handle || '');
  setValue('set-telegram', r.social?.telegram?.handle || '');

  // Theme Accent Color
  const accent = r.theme_accent || '#ff5722';
  setValue('set-accent-color', accent);
  const colorText = document.getElementById('color-val-text');
  if (colorText) colorText.textContent = accent;

  // Menu URL
  setValue('tool-menu-url', r.menu_url || 'https://kebabhouse.uz/menu');
}

function setValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

// ----------------------------------------------------------------------------
// RENDER: TOOLS & STATS
// ----------------------------------------------------------------------------
function renderToolsAndStats() {
  if (!appState.menuData) return;

  let totalItems = 0;
  let stopListCount = 0;

  if (appState.menuData.categories) {
    appState.menuData.categories.forEach(cat => {
      (cat.items || []).forEach(item => {
        totalItems++;
        if (item.is_available === false) stopListCount++;
      });
    });
  }

  const statItems = document.getElementById('stat-total-items');
  const statCats = document.getElementById('stat-total-cats');
  const statStop = document.getElementById('stat-stop-list');
  const statLast = document.getElementById('stat-last-update');

  if (statItems) statItems.textContent = totalItems;
  if (statCats) statCats.textContent = appState.menuData.categories ? appState.menuData.categories.length : 0;
  if (statStop) statStop.textContent = stopListCount;
  if (statLast) {
    const d = appState.menuData.updated_at ? new Date(appState.menuData.updated_at) : new Date();
    statLast.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}

// ============================================================================
// 4. ITEM CRUD & MODAL
// ============================================================================

function openItemModal(item = null, catId = null) {
  const modal = document.getElementById('modal-item');
  const form = document.getElementById('item-form');
  const title = document.getElementById('modal-item-title');
  const catSelect = document.getElementById('item-category-select');

  // Populate category dropdown
  populateCategoryDropdown();

  // Switch to UZ tab initially
  switchFormLangTab('uz');

  if (item) {
    title.textContent = "Taomni tahrirlash";
    setValue('item-id', item.id);
    setValue('item-category-id', catId || '');
    catSelect.value = catId || appState.menuData.categories[0]?.id;

    setValue('item-name-uz', item.name?.uz || item.name || '');
    setValue('item-name-ru', item.name?.ru || '');
    setValue('item-name-en', item.name?.en || '');

    setValue('item-desc-uz', item.description?.uz || item.description || '');
    setValue('item-desc-ru', item.description?.ru || '');
    setValue('item-desc-en', item.description?.en || '');

    setValue('item-price', item.price || 0);
    setValue('item-weight', item.weight || '');
    setValue('item-badge-select', item.badge || '');

    const availCheckbox = document.getElementById('item-available');
    if (availCheckbox) availCheckbox.checked = item.is_available !== false;

    // Image preview
    setValue('item-img-url', item.image || '');
    showImagePreview(item.image || '');
  } else {
    title.textContent = "Yangi taom qo'shish";
    form.reset();
    setValue('item-id', '');
    setValue('item-category-id', '');
    catSelect.value = catId || appState.filterCategory !== 'all' ? appState.filterCategory : appState.menuData.categories[0]?.id;
    document.getElementById('item-available').checked = true;
    showImagePreview('');
  }

  modal.hidden = false;
}

function closeItemModal() {
  document.getElementById('modal-item').hidden = true;
}

function handleItemFormSubmit(e) {
  e.preventDefault();

  const itemId = document.getElementById('item-id').value;
  const targetCatId = document.getElementById('item-category-select').value;
  const oldCatId = document.getElementById('item-category-id').value;

  const itemObj = {
    id: itemId || `item-${Date.now()}`,
    name: {
      uz: document.getElementById('item-name-uz').value.trim(),
      ru: document.getElementById('item-name-ru').value.trim(),
      en: document.getElementById('item-name-en').value.trim()
    },
    description: {
      uz: document.getElementById('item-desc-uz').value.trim(),
      ru: document.getElementById('item-desc-ru').value.trim(),
      en: document.getElementById('item-desc-en').value.trim()
    },
    price: parseInt(document.getElementById('item-price').value, 10) || 0,
    weight: document.getElementById('item-weight').value.trim(),
    badge: document.getElementById('item-badge-select').value || null,
    is_available: document.getElementById('item-available').checked,
    image: document.getElementById('item-img-url').value.trim() || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=700&q=80'
  };

  // If item had item_num, preserve it or extract from name
  const matchNum = itemObj.name.uz.match(/№\s*(\d+)/i);
  if (matchNum) itemObj.item_num = matchNum[0];

  // If category changed, remove from old category
  if (itemId && oldCatId && oldCatId !== targetCatId) {
    const oldCat = appState.menuData.categories.find(c => c.id === oldCatId);
    if (oldCat && oldCat.items) {
      oldCat.items = oldCat.items.filter(i => i.id !== itemId);
    }
  }

  // Add/Update in target category
  const targetCat = appState.menuData.categories.find(c => c.id === targetCatId);
  if (targetCat) {
    if (!targetCat.items) targetCat.items = [];
    const existingIdx = targetCat.items.findIndex(i => i.id === itemObj.id);
    if (existingIdx !== -1) {
      targetCat.items[existingIdx] = itemObj;
    } else {
      targetCat.items.unshift(itemObj);
    }
  }

  saveMenuData(appState.menuData);
  closeItemModal();
  showToast(itemId ? "Taom yangilandi!" : "Yangi taom qo'shildi!");
}

function duplicateItem(catId, originalItem) {
  const cat = appState.menuData.categories.find(c => c.id === catId);
  if (!cat) return;

  const copy = JSON.parse(JSON.stringify(originalItem));
  copy.id = `item-${Date.now()}`;
  if (typeof copy.name === 'object') {
    copy.name.uz = `${copy.name.uz || ''} (Nusxa)`;
  } else {
    copy.name = `${copy.name} (Nusxa)`;
  }

  cat.items.unshift(copy);
  saveMenuData(appState.menuData);
  showToast("Taom nusxalandi!");
}

function confirmDeleteItem(catId, item) {
  openConfirmModal(
    "🗑️",
    `"${t(item.name)}" taomini o'chirish`,
    "Ushbu taom menyudan o'chiriladi. Siz uni 'Bekor qilish' tugmasi bilan 5 soniya ichida qaytarishingiz mumkin.",
    () => {
      deleteItem(catId, item);
    }
  );
}

function deleteItem(catId, item) {
  const cat = appState.menuData.categories.find(c => c.id === catId);
  if (!cat) return;

  const idx = cat.items.findIndex(i => i.id === item.id);
  if (idx === -1) return;

  // Stash for Undo
  appState.recentlyDeletedItem = {
    catId,
    item: JSON.parse(JSON.stringify(item)),
    index: idx
  };

  cat.items.splice(idx, 1);
  saveMenuData(appState.menuData, false);

  showUndoToast(`"${t(item.name)}" o'chirildi.`, () => {
    restoreDeletedItem();
  });
}

function restoreDeletedItem() {
  if (!appState.recentlyDeletedItem) return;
  const { catId, item, index } = appState.recentlyDeletedItem;
  const cat = appState.menuData.categories.find(c => c.id === catId);
  if (cat) {
    if (!cat.items) cat.items = [];
    cat.items.splice(index, 0, item);
    saveMenuData(appState.menuData);
    showToast(`"${t(item.name)}" qaytarildi!`);
  }
  appState.recentlyDeletedItem = null;
}

// ============================================================================
// 5. CLIENT-SIDE IMAGE COMPRESSION (Max 1000px, WebP, < 2MB)
// ============================================================================

// Preset High Quality Food Photos for Quick Selection
const PRESET_FOOD_PHOTOS = [
  // Shashliklar / Kebablar
  { cat: 'kebab', title: 'Lula kebab', url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=700&q=80' },
  { cat: 'kebab', title: 'Tikka mol go\'shti', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=80' },
  { cat: 'kebab', title: 'Qo\'y go\'shti shashlik', url: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=700&q=80' },
  { cat: 'kebab', title: 'Tovuq shashlik', url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=700&q=80' },
  { cat: 'kebab', title: 'Tabaki qanot', url: 'https://images.unsplash.com/photo-1527477378378-43f11d1ec9c0?auto=format&fit=crop&w=700&q=80' },
  { cat: 'kebab', title: 'Qovurg\'a shashlik', url: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&w=700&q=80' },
  { cat: 'kebab', title: 'Lavash rulet', url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=700&q=80' },
  { cat: 'kebab', title: 'Jigar kabob', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=80' },
  
  // Salatlar
  { cat: 'salad', title: 'Achichuk (Pomidor-piyoz)', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=80' },
  { cat: 'salad', title: 'Grek salat', url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=700&q=80' },
  { cat: 'salad', title: 'Suzma / Qatiq', url: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=700&q=80' },
  { cat: 'salad', title: 'Bahor salati', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80' },

  // Non & Somsa
  { cat: 'bread', title: 'Tandir non', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=700&q=80' },
  { cat: 'bread', title: 'Patir non', url: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=700&q=80' },
  { cat: 'bread', title: 'Issiq Somsa', url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=700&q=80' },

  // Ichimliklar
  { cat: 'drinks', title: 'Choynakda choy', url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=700&q=80' },
  { cat: 'drinks', title: 'Yaxna limonad', url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=700&q=80' },
  { cat: 'drinks', title: 'Toza mineral suv', url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=700&q=80' },
  { cat: 'drinks', title: 'Coca-Cola / Gazli', url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=700&q=80' },

  // Fast food
  { cat: 'fastfood', title: 'Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80' },
  { cat: 'fastfood', title: 'Cheeseburger', url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=700&q=80' },
  { cat: 'fastfood', title: 'Kartoshka fri', url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=700&q=80' },
  { cat: 'fastfood', title: 'Qarsildoq Nuggets', url: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=700&q=80' }
];

function setupImageUploadHandlers() {
  const fileInput = document.getElementById('item-file-input');
  const urlInput = document.getElementById('item-img-url');

  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Type check
      if (!file.type.match(/^image\/(jpeg|png|webp)$/i)) {
        alert("Faqat JPG, PNG yoki WebP formatdagi rasmlar qabul qilinadi.");
        return;
      }

      // Size check (max 2MB initially)
      if (file.size > 2 * 1024 * 1024) {
        alert("Rasm hajmi 2 MB dan oshmasligi kerak.");
        return;
      }

      showProgress(15);

      try {
        // Client-side canvas compression / resize
        const compressedDataUrl = await compressImageToWebP(file, 1000, 0.82);
        showProgress(60);

        // If Firebase Storage is configured, upload to Storage
        if (appState.isFirebase && appState.storage) {
          const { ref, uploadString, getDownloadURL } = await import(FIREBASE_STORAGE_URL);
          const fileName = `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.webp`;
          const storageRef = ref(appState.storage, `menu_images/${fileName}`);

          await uploadString(storageRef, compressedDataUrl, 'data_url', {
            contentType: 'image/webp'
          });
          showProgress(90);

          const downloadUrl = await getDownloadURL(storageRef);
          urlInput.value = downloadUrl;
          showImagePreview(downloadUrl);
        } else {
          // Demo / Local Mode: direct WebP Data URL
          urlInput.value = compressedDataUrl;
          showImagePreview(compressedDataUrl);
        }

        showProgress(100);
        setTimeout(() => hideProgress(), 600);
        showToast("Rasm muvaffaqiyatli siqildi va yuklandi!");
      } catch (err) {
        console.error("Rasm yuklashda xato:", err);
        hideProgress();
        alert("Rasmni siqishda xatolik yuz berdi.");
      }
    });
  }

  if (urlInput) {
    urlInput.addEventListener('input', () => {
      showImagePreview(urlInput.value.trim());
    });
  }
}

function compressImageToWebP(file, maxWidth = 1000, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Export WebP (fallback to JPEG if webp unsupported)
        try {
          const dataUrl = canvas.toDataURL('image/webp', quality);
          resolve(dataUrl);
        } catch (e) {
          resolve(canvas.toDataURL('image/jpeg', quality));
        }
      };
      img.onerror = reject;
      img.src = readerEvent.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function showImagePreview(url) {
  const previewImg = document.getElementById('item-img-preview');
  const placeholder = document.getElementById('no-img-placeholder');
  if (!previewImg || !placeholder) return;

  if (url) {
    previewImg.src = url;
    previewImg.hidden = false;
    placeholder.hidden = true;
  } else {
    previewImg.src = '';
    previewImg.hidden = true;
    placeholder.hidden = false;
  }
}

function showProgress(pct) {
  const wrap = document.getElementById('img-progress-wrap');
  const bar = document.getElementById('img-progress-bar');
  if (wrap && bar) {
    wrap.hidden = false;
    bar.style.width = `${pct}%`;
  }
}

function hideProgress() {
  const wrap = document.getElementById('img-progress-wrap');
  if (wrap) wrap.hidden = true;
}

// ============================================================================
// PRESET FOOD GALLERY & QUICK CATEGORY ADD
// ============================================================================

function setupPresetGallery() {
  const modal = document.getElementById('modal-preset-gallery');
  const btnOpen = document.getElementById('btn-open-preset-gallery');
  const btnClose = document.getElementById('btn-close-gallery');
  const grid = document.getElementById('preset-gallery-grid');
  const chipContainer = document.getElementById('gallery-category-chips');
  const urlInput = document.getElementById('item-img-url');

  if (!modal || !btnOpen || !grid) return;

  let activeCatFilter = 'all';

  function renderGallery() {
    grid.innerHTML = '';
    const filtered = activeCatFilter === 'all'
      ? PRESET_FOOD_PHOTOS
      : PRESET_FOOD_PHOTOS.filter(p => p.cat === activeCatFilter);

    filtered.forEach(photo => {
      const card = document.createElement('div');
      card.className = 'preset-gallery-item';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('title', photo.title);
      card.innerHTML = `
        <img src="${photo.url}" alt="${escapeHtml(photo.title)}" loading="lazy">
        <span>${escapeHtml(photo.title)}</span>
      `;
      card.addEventListener('click', () => {
        if (urlInput) {
          urlInput.value = photo.url;
          showImagePreview(photo.url);
        }
        modal.hidden = true;
        showToast(`Rasm tanlandi: ${photo.title}`, 'info');
      });
      grid.appendChild(card);
    });
  }

  btnOpen.addEventListener('click', () => {
    modal.hidden = false;
    renderGallery();
  });

  if (btnClose) {
    btnClose.addEventListener('click', () => {
      modal.hidden = true;
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.hidden = true;
  });

  if (chipContainer) {
    chipContainer.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-gallery-cat]');
      if (!chip) return;
      chipContainer.querySelectorAll('[data-gallery-cat]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeCatFilter = chip.dataset.galleryCat;
      renderGallery();
    });
  }
}

function setupQuickAddCategory() {
  const btnQuickAdd = document.getElementById('btn-quick-add-cat');
  if (!btnQuickAdd) return;

  btnQuickAdd.addEventListener('click', () => {
    const catName = prompt("Yangi bo'lim nomini kiriting (masalan: Salatlar, Qo'shimchalar, Shirinliklar):");
    if (!catName || !catName.trim()) return;

    const trimmed = catName.trim();
    const newId = `cat-${Date.now()}`;

    // Auto-detect icon
    let icon = '🍽️';
    const lower = trimmed.toLowerCase();
    if (lower.includes('salat')) icon = '🥗';
    else if (lower.includes('non') || lower.includes('somsa')) icon = '🥖';
    else if (lower.includes('ichimlik') || lower.includes('choy') || lower.includes('suv') || lower.includes('sharbat')) icon = '🥤';
    else if (lower.includes('shirinlik') || lower.includes('desert') || lower.includes('tort')) icon = '🍰';
    else if (lower.includes('kabob') || lower.includes('go\'sht') || lower.includes('shashlik')) icon = '🍢';
    else if (lower.includes('sho\'rva') || lower.includes('birinchi')) icon = '🍲';
    else if (lower.includes('baliq')) icon = '🐟';
    else if (lower.includes('fast') || lower.includes('burger')) icon = '🍔';

    const newCategory = {
      id: newId,
      icon: icon,
      name: { uz: trimmed, ru: trimmed, en: trimmed },
      subtitle: { uz: '', ru: '', en: '' },
      is_visible: true,
      items: []
    };

    if (!appState.menuData.categories) appState.menuData.categories = [];
    appState.menuData.categories.push(newCategory);

    // Save and re-populate
    saveMenuData(appState.menuData);
    populateCategoryDropdown(newId);
    showToast(`"${trimmed}" bo'limi yaratildi va tanlandi!`, 'info');
  });
}

function populateCategoryDropdown(selectedCatId = null) {
  const catSelect = document.getElementById('item-category-select');
  if (!catSelect || !appState.menuData?.categories) return;

  const currentVal = selectedCatId || catSelect.value;
  catSelect.innerHTML = '';
  appState.menuData.categories.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = `${c.icon || ''} ${t(c.name)}`;
    catSelect.appendChild(opt);
  });

  if (currentVal) {
    catSelect.value = currentVal;
  }
}

// ============================================================================
// 6. CATEGORIES CRUD & MODAL
// ============================================================================

function openCategoryModal(cat = null) {
  const modal = document.getElementById('modal-category');
  const title = document.getElementById('modal-category-title');
  const form = document.getElementById('category-form');

  if (cat) {
    title.textContent = "Kategoriyani tahrirlash";
    setValue('category-id', cat.id);
    setValue('cat-icon', cat.icon || '🍢');
    setValue('cat-name-uz', cat.name?.uz || cat.name || '');
    setValue('cat-name-ru', cat.name?.ru || '');
    setValue('cat-name-en', cat.name?.en || '');
    setValue('cat-subtitle-uz', cat.subtitle?.uz || cat.subtitle || '');
    document.getElementById('cat-visible').checked = cat.is_visible !== false;
  } else {
    title.textContent = "Yangi kategoriya qo'shish";
    form.reset();
    setValue('category-id', '');
    setValue('cat-icon', '🍢');
    document.getElementById('cat-visible').checked = true;
  }

  modal.hidden = false;
}

function closeCategoryModal() {
  document.getElementById('modal-category').hidden = true;
}

function handleCategoryFormSubmit(e) {
  e.preventDefault();
  const catId = document.getElementById('category-id').value;

  const catObj = {
    id: catId || `cat-${Date.now()}`,
    icon: document.getElementById('cat-icon').value.trim() || '🍢',
    name: {
      uz: document.getElementById('cat-name-uz').value.trim(),
      ru: document.getElementById('cat-name-ru').value.trim(),
      en: document.getElementById('cat-name-en').value.trim()
    },
    subtitle: {
      uz: document.getElementById('cat-subtitle-uz').value.trim(),
      ru: '',
      en: ''
    },
    is_visible: document.getElementById('cat-visible').checked
  };

  if (!appState.menuData.categories) appState.menuData.categories = [];

  const existingIdx = appState.menuData.categories.findIndex(c => c.id === catObj.id);
  if (existingIdx !== -1) {
    catObj.items = appState.menuData.categories[existingIdx].items || [];
    appState.menuData.categories[existingIdx] = catObj;
  } else {
    catObj.items = [];
    appState.menuData.categories.push(catObj);
  }

  saveMenuData(appState.menuData);
  closeCategoryModal();
  populateCategoryDropdown();
  showToast(catId ? "Kategoriya yangilandi!" : "Yangi kategoriya qo'shildi!");
}

function confirmDeleteCategory(cat) {
  const count = cat.items ? cat.items.length : 0;
  const warningText = count > 0 
    ? `Diqqat! Ushbu kategoriya ichida ${count} ta taom mavjud. Kategoriya o'chirilsa, undagi taomlar ham o'chib ketadi!` 
    : `"${t(cat.name)}" kategoriyasi menyudan butunlay o'chiriladi.`;

  openConfirmModal(
    "⚠️",
    `"${t(cat.name)}" kategoriyasini o'chirish`,
    warningText,
    () => {
      appState.menuData.categories = appState.menuData.categories.filter(c => c.id !== cat.id);
      saveMenuData(appState.menuData);
      showToast("Kategoriya o'chirildi!");
    }
  );
}

// ============================================================================
// 7. DRAG AND DROP REORDERING (TOUCH & MOUSE)
// ============================================================================

function setupItemsDragAndDrop(grid, catId) {
  let draggedEl = null;

  grid.querySelectorAll('.admin-item-card').forEach(card => {
    card.addEventListener('dragstart', (e) => {
      draggedEl = card;
      card.style.opacity = '0.4';
      e.dataTransfer.effectAllowed = 'move';
    });

    card.addEventListener('dragend', () => {
      if (draggedEl) draggedEl.style.opacity = '1';
      draggedEl = null;
    });

    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const target = e.currentTarget;
      if (target && target !== draggedEl) {
        const rect = target.getBoundingClientRect();
        const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
        grid.insertBefore(draggedEl, next && target.nextSibling || target);
      }
    });

    card.addEventListener('drop', () => {
      // Reorder items in state according to DOM order
      const newIds = Array.from(grid.querySelectorAll('.admin-item-card')).map(el => el.dataset.itemId);
      const cat = appState.menuData.categories.find(c => c.id === catId);
      if (cat && cat.items) {
        cat.items.sort((a, b) => newIds.indexOf(a.id) - newIds.indexOf(b.id));
        saveMenuData(appState.menuData, false);
      }
    });
  });
}

function setupCategoriesDragAndDrop(container) {
  let draggedEl = null;

  container.querySelectorAll('.cat-admin-card').forEach(card => {
    card.addEventListener('dragstart', (e) => {
      draggedEl = card;
      card.style.opacity = '0.4';
      e.dataTransfer.effectAllowed = 'move';
    });

    card.addEventListener('dragend', () => {
      if (draggedEl) draggedEl.style.opacity = '1';
      draggedEl = null;
    });

    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      const target = e.currentTarget;
      if (target && target !== draggedEl) {
        const rect = target.getBoundingClientRect();
        const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
        container.insertBefore(draggedEl, next && target.nextSibling || target);
      }
    });

    card.addEventListener('drop', () => {
      const newCatIds = Array.from(container.querySelectorAll('.cat-admin-card')).map(el => el.dataset.catId);
      appState.menuData.categories.sort((a, b) => newCatIds.indexOf(a.id) - newCatIds.indexOf(b.id));
      saveMenuData(appState.menuData, false);
    });
  });
}

// ============================================================================
// 8. BULK ACTIONS (MULTI-SELECT)
// ============================================================================

function updateBulkBar() {
  const bar = document.getElementById('bulk-bar');
  const countEl = document.getElementById('bulk-selected-count');
  const count = appState.selectedItemIds.size;

  if (count > 0) {
    bar.hidden = false;
    countEl.textContent = `${count} ta taom tanlandi`;
  } else {
    bar.hidden = true;
  }
}

function handleBulkAvailable(isAvailable) {
  appState.menuData.categories.forEach(cat => {
    (cat.items || []).forEach(item => {
      if (appState.selectedItemIds.has(item.id)) {
        item.is_available = isAvailable;
      }
    });
  });
  saveMenuData(appState.menuData);
  appState.selectedItemIds.clear();
  showToast(`Tanlangan taomlar ${isAvailable ? 'mavjud' : 'stop-list'} ga o'tkazildi!`);
}

function handleBulkDelete() {
  const count = appState.selectedItemIds.size;
  openConfirmModal(
    "🗑️",
    `${count} ta taomni o'chirish`,
    "Tanlangan barcha taomlar menyudan butunlay o'chiriladi. Ishonchingiz komilmi?",
    () => {
      appState.menuData.categories.forEach(cat => {
        if (cat.items) {
          cat.items = cat.items.filter(item => !appState.selectedItemIds.has(item.id));
        }
      });
      appState.selectedItemIds.clear();
      saveMenuData(appState.menuData);
      showToast(`${count} ta taom o'chirildi!`);
    }
  );
}

function openBulkPriceModal() {
  document.getElementById('modal-bulk-price').hidden = false;
}

function applyBulkPricePercent() {
  const pct = parseFloat(document.getElementById('bulk-price-input').value);
  if (isNaN(pct)) return;

  const mult = 1 + (pct / 100);

  appState.menuData.categories.forEach(cat => {
    (cat.items || []).forEach(item => {
      if (appState.selectedItemIds.has(item.id)) {
        // Round to nearest 500 sum
        item.price = Math.round((item.price * mult) / 500) * 500;
      }
    });
  });

  saveMenuData(appState.menuData);
  document.getElementById('modal-bulk-price').hidden = true;
  appState.selectedItemIds.clear();
  showToast(`Narxlar ${pct > 0 ? '+' : ''}${pct}% ga o'zgartirildi!`);
}

// ============================================================================
// 9. SETTINGS & TOOLS ACTIONS
// ============================================================================

function handleSettingsFormSubmit(e) {
  if (e) e.preventDefault();

  if (!appState.menuData.restaurant) appState.menuData.restaurant = {};
  const r = appState.menuData.restaurant;

  r.name = document.getElementById('set-name').value.trim();
  r.brand_tagline = document.getElementById('set-brand-tagline').value.trim();

  if (!r.tagline) r.tagline = {};
  r.tagline.uz = document.getElementById('set-tagline-uz').value.trim();
  r.tagline.ru = document.getElementById('set-tagline-ru').value.trim();
  r.tagline.en = document.getElementById('set-tagline-en').value.trim();

  r.phone_display = document.getElementById('set-phone-display').value.trim();
  r.phone = document.getElementById('set-phone').value.trim();

  if (!r.address) r.address = {};
  r.address.uz = document.getElementById('set-address-uz').value.trim();

  if (!r.working_hours) r.working_hours = {};
  r.working_hours.uz = document.getElementById('set-hours-uz').value.trim();

  if (!r.wifi) r.wifi = {};
  r.wifi.ssid = document.getElementById('set-wifi-ssid').value.trim();
  r.wifi.password = document.getElementById('set-wifi-password').value.trim();

  if (!r.currency) r.currency = {};
  r.currency.uz = document.getElementById('set-currency').value.trim() || "so'm";

  if (!r.social) r.social = { instagram: {}, telegram: {} };
  r.social.instagram.handle = document.getElementById('set-instagram').value.trim();
  r.social.telegram.handle = document.getElementById('set-telegram').value.trim();

  r.theme_accent = document.getElementById('set-accent-color').value;

  saveMenuData(appState.menuData);
  showToast("Sozlamalar muvaffaqiyatli saqlandi!");
}

function handleUpdateQrUrl() {
  const newUrl = document.getElementById('tool-menu-url').value.trim();
  if (!newUrl) return;

  if (!appState.menuData.restaurant) appState.menuData.restaurant = {};
  appState.menuData.restaurant.menu_url = newUrl;
  saveMenuData(appState.menuData);
  showToast("Menyu havolasi yangilandi!");
}

function handleExportJson() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState.menuData, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `kebabo-menu-backup-${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast("Menyu JSON zaxira fayli yuklab olindi!");
}

function handleImportJsonFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const parsed = JSON.parse(event.target.result);
      if (parsed.categories) {
        saveMenuData(parsed);
        showToast("Menyu JSON faylidan muvaffaqiyatli tiklandi!");
      } else {
        alert("Noto'g'ri JSON format: 'categories' bo'limi topilmadi.");
      }
    } catch (err) {
      alert("JSON faylini o'qishda xatolik: " + err.message);
    }
  };
  reader.readAsText(file);
}

async function handleImportInitialMenuJson() {
  openConfirmModal(
    "📥",
    "Mavjud menu.json ni import qilish",
    "Ushbu amal 'menu.json' dagi barcha taomlar va sozlamalarni bazaga to'liq ko'chiradi. Davom etasizmi?",
    async () => {
      try {
        const res = await fetch('../menu.json');
        if (!res.ok) throw new Error("menu.json yuklanmadi");
        const initialData = await res.json();
        saveMenuData(initialData);
        showToast("menu.json muvaffaqiyatli import qilindi!");
      } catch (err) {
        alert("Import qilishda xatolik: " + err.message);
      }
    }
  );
}

// ============================================================================
// 10. HELPERS, MODALS & EVENT LISTENERS
// ============================================================================

function setupEventListeners() {
  // Navigation Tabs (Desktop & Mobile)
  const navTabs = document.querySelectorAll('[data-tab]');
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      switchTab(tabName);
    });
  });

  // Logout Buttons
  const btnLogoutSidebar = document.getElementById('btn-logout-sidebar');
  const btnLogoutMobile = document.getElementById('btn-logout-mobile');
  if (btnLogoutSidebar) btnLogoutSidebar.addEventListener('click', () => logoutAdmin());
  if (btnLogoutMobile) btnLogoutMobile.addEventListener('click', () => logoutAdmin());

  // Search & Filter Listeners
  const itemSearch = document.getElementById('item-search');
  if (itemSearch) {
    itemSearch.addEventListener('input', (e) => {
      appState.searchQuery = e.target.value;
      renderItemsList();
    });
  }

  const filterCategory = document.getElementById('filter-category');
  if (filterCategory) {
    filterCategory.addEventListener('change', (e) => {
      appState.filterCategory = e.target.value;
      renderItemsList();
    });
  }

  const filterStatus = document.getElementById('filter-status');
  if (filterStatus) {
    filterStatus.addEventListener('change', (e) => {
      appState.filterStatus = e.target.value;
      renderItemsList();
    });
  }

  // Add Item & Add Category Buttons
  const btnAddItem = document.getElementById('btn-add-item');
  if (btnAddItem) btnAddItem.addEventListener('click', () => openItemModal());

  const btnAddCat = document.getElementById('btn-add-category');
  if (btnAddCat) btnAddCat.addEventListener('click', () => openCategoryModal());

  // Modal Close buttons
  const btnCloseItem = document.getElementById('btn-close-item-modal');
  const btnCancelItem = document.getElementById('btn-cancel-item');
  if (btnCloseItem) btnCloseItem.addEventListener('click', closeItemModal);
  if (btnCancelItem) btnCancelItem.addEventListener('click', closeItemModal);

  const btnCloseCat = document.getElementById('btn-close-cat-modal');
  const btnCancelCat = document.getElementById('btn-cancel-cat');
  if (btnCloseCat) btnCloseCat.addEventListener('click', closeCategoryModal);
  if (btnCancelCat) btnCancelCat.addEventListener('click', closeCategoryModal);

  // Form Submissions
  const itemForm = document.getElementById('item-form');
  if (itemForm) itemForm.addEventListener('submit', handleItemFormSubmit);

  const catForm = document.getElementById('category-form');
  if (catForm) catForm.addEventListener('submit', handleCategoryFormSubmit);

  const btnSaveSettings = document.getElementById('btn-save-settings');
  if (btnSaveSettings) btnSaveSettings.addEventListener('click', handleSettingsFormSubmit);

  // Language Tabs inside Item Form
  document.querySelectorAll('[data-form-lang]').forEach(btn => {
    btn.addEventListener('click', () => {
      switchFormLangTab(btn.dataset.formLang);
    });
  });

  // Bulk Action Buttons
  const btnBulkAvail = document.getElementById('btn-bulk-available');
  const btnBulkUnavail = document.getElementById('btn-bulk-unavailable');
  const btnBulkDelete = document.getElementById('btn-bulk-delete');
  const btnBulkCancel = document.getElementById('btn-bulk-cancel');
  const btnBulkPrice = document.getElementById('btn-bulk-price');

  if (btnBulkAvail) btnBulkAvail.addEventListener('click', () => handleBulkAvailable(true));
  if (btnBulkUnavail) btnBulkUnavail.addEventListener('click', () => handleBulkAvailable(false));
  if (btnBulkDelete) btnBulkDelete.addEventListener('click', handleBulkDelete);
  if (btnBulkCancel) btnBulkCancel.addEventListener('click', () => {
    appState.selectedItemIds.clear();
    renderItemsList();
  });
  if (btnBulkPrice) btnBulkPrice.addEventListener('click', openBulkPriceModal);

  // Bulk Price Modal
  const btnCloseBulkPrice = document.getElementById('btn-close-bulk-price');
  const btnCancelBulkPrice = document.getElementById('btn-cancel-bulk-price');
  const btnApplyBulkPrice = document.getElementById('btn-apply-bulk-price');
  if (btnCloseBulkPrice) btnCloseBulkPrice.addEventListener('click', () => document.getElementById('modal-bulk-price').hidden = true);
  if (btnCancelBulkPrice) btnCancelBulkPrice.addEventListener('click', () => document.getElementById('modal-bulk-price').hidden = true);
  if (btnApplyBulkPrice) btnApplyBulkPrice.addEventListener('click', applyBulkPricePercent);

  document.querySelectorAll('.btn-percent-preset').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.btn-percent-preset').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      document.getElementById('bulk-price-input').value = b.dataset.pct;
    });
  });

  // Tools Buttons
  const btnUpdateQr = document.getElementById('btn-update-qr');
  if (btnUpdateQr) btnUpdateQr.addEventListener('click', handleUpdateQrUrl);

  const btnExportJson = document.getElementById('btn-export-json');
  if (btnExportJson) btnExportJson.addEventListener('click', handleExportJson);

  const fileImportJson = document.getElementById('file-import-json');
  if (fileImportJson) fileImportJson.addEventListener('change', handleImportJsonFile);

  const btnImportInitial = document.getElementById('btn-import-initial');
  if (btnImportInitial) btnImportInitial.addEventListener('click', handleImportInitialMenuJson);

  // Color picker presets
  const colorPicker = document.getElementById('set-accent-color');
  if (colorPicker) {
    colorPicker.addEventListener('input', (e) => {
      const colorText = document.getElementById('color-val-text');
      if (colorText) colorText.textContent = e.target.value;
    });
  }

  document.querySelectorAll('.color-preset').forEach(p => {
    p.addEventListener('click', () => {
      const col = p.dataset.color;
      if (colorPicker) colorPicker.value = col;
      const colorText = document.getElementById('color-val-text');
      if (colorText) colorText.textContent = col;
    });
  });

  // Image Upload Handlers
  setupImageUploadHandlers();

  // Preset Food Gallery Handlers
  setupPresetGallery();

  // Quick Add Category from Item Modal
  setupQuickAddCategory();
}

function switchTab(tabName) {
  appState.activeTab = tabName;

  // Update nav buttons
  document.querySelectorAll('[data-tab]').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });

  // Update panes
  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.toggle('active', pane.id === `pane-${tabName}`);
    pane.hidden = (pane.id !== `pane-${tabName}`);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function switchFormLangTab(lang) {
  document.querySelectorAll('[data-form-lang]').forEach(b => {
    b.classList.toggle('active', b.dataset.formLang === lang);
  });
  document.querySelectorAll('[data-lang-group]').forEach(g => {
    const isTarget = g.dataset.langGroup === lang;
    g.classList.toggle('active', isTarget);
    g.hidden = !isTarget;
  });
}

// Confirm Modal helper
function openConfirmModal(icon, title, desc, onConfirm) {
  const modal = document.getElementById('modal-confirm');
  document.getElementById('confirm-icon').textContent = icon;
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-desc').textContent = desc;

  const btnOk = document.getElementById('btn-confirm-ok');
  const btnCancel = document.getElementById('btn-confirm-cancel');

  const cleanup = () => {
    modal.hidden = true;
    btnOk.onclick = null;
    btnCancel.onclick = null;
  };

  btnOk.onclick = () => {
    cleanup();
    if (onConfirm) onConfirm();
  };

  btnCancel.onclick = cleanup;
  modal.hidden = false;
}

// Toast Notification
function showToast(message, type = "info") {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `admin-toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(15px)';
    setTimeout(() => toast.remove(), 250);
  }, 3000);
}

function showUndoToast(message, onUndo) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'admin-toast';
  toast.innerHTML = `
    <span>${message}</span>
    <button type="button" class="toast-undo-btn">Bekor qilish</button>
  `;

  const undoBtn = toast.querySelector('.toast-undo-btn');
  undoBtn.addEventListener('click', () => {
    if (onUndo) onUndo();
    toast.remove();
  });

  container.appendChild(toast);
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 250);
    }
  }, 5000);
}

// Dark / Light Theme
function setupTheme() {
  const saved = localStorage.getItem('kebabo_admin_theme') || 'dark';
  applyTheme(saved);

  const btn = document.getElementById('btn-theme-toggle');
  if (btn) {
    btn.addEventListener('click', () => {
      const isLight = document.body.classList.contains('light-theme');
      const nextTheme = isLight ? 'dark' : 'light';
      applyTheme(nextTheme);
      localStorage.setItem('kebabo_admin_theme', nextTheme);
    });
  }
}

function applyTheme(theme) {
  const icon = document.getElementById('theme-icon');
  if (theme === 'light') {
    document.body.classList.add('light-theme');
    if (icon) icon.textContent = '☀️';
  } else {
    document.body.classList.remove('light-theme');
    if (icon) icon.textContent = '🌙';
  }
}

// Helpers
function t(obj) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj.uz || obj.ru || obj.en || '';
}

function formatPrice(amount) {
  if (typeof amount !== 'number') return amount || '0 so\'m';
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + " so'm";
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function pad(n) {
  return n < 10 ? '0' + n : n;
}

// Start Admin App
initAdminApp();
