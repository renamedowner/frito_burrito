/**
 * FRITO BURRITO — KUPER DELIVERY DARK THEME
 * Full-featured bespoke delivery application:
 * - Kuper dark theme UI
 * - Desktop sticky sidebar cart with signature paper bag illustration
 * - Category tiles with 3D emoji
 * - Promo code support (ФРИТО15)
 * - Safe checkout, payment simulator, and live order tracker
 */

(function () {
  'use strict';

  let catalogData = null;
  let activeCategoryId = 'all';
  let deliveryType = 'delivery'; // 'delivery' or 'pickup'
  let cutleryCount = 1;
  let searchQuery = '';
  let userAddress = 'ул. Петра Метальникова, 3/1А';
  let selectedPaymentMethod = 'cash';
  let activeOrderSimulation = null;
  let activePromoCode = null; // e.g. 'ФРИТО15'
  let promoDiscountPct = 0; // 0.15

  // Cart: Array of { id, dishId, name, price, basePrice, weight, modifiers, quantity }
  let cart = [];

  // Current modal state
  let currentModalDish = null;
  let currentSelectedModifiers = [];

  // Category Icon Mapping (Kuper style 3D emojis)
  const categoryIcons = {
    'all': '▦',
    'burrito': '🌯',
    'tacos-quesadilla': '🌮',
    'snacks': '🍟',
    'sauces': '🥑',
    'drinks': '🥤',
    'combos': '🎁'
  };

  // DOM Elements
  const el = {
    // Header & Top
    searchInput: document.getElementById('searchInput'),
    searchClearBtn: document.getElementById('searchClearBtn'),
    btnSelectAddress: document.getElementById('btnSelectAddress'),
    currentAddressHeader: document.getElementById('currentAddressHeader'),
    btnHeaderPromo: document.getElementById('btnHeaderPromo'),
    btnHeaderProfile: document.getElementById('btnHeaderProfile'),
    btnHeaderBonuses: document.getElementById('btnHeaderBonuses'),
    bonusValDisplay: document.getElementById('bonusValDisplay'),
    btnMobileHeaderCart: document.getElementById('btnMobileHeaderCart'),
    mobileHeaderCartBadge: document.getElementById('mobileHeaderCartBadge'),
    noticeBar: document.getElementById('noticeBar'),
    btnCloseNotice: document.getElementById('btnCloseNotice'),
    topAboutLink: document.getElementById('topAboutLink'),

    // Hero Promo
    btnApplyHeroPromo: document.getElementById('btnApplyHeroPromo'),
    heroTicketCode: document.getElementById('heroTicketCode'),

    // Categories & Catalog
    categoriesGrid: document.getElementById('categoriesGrid'),
    catalogSectionsWrap: document.getElementById('catalogSectionsWrap'),

    // Desktop Cart Sidebar
    desktopCartSidebar: document.getElementById('desktopCartSidebar'),
    btnSidebarClearCart: document.getElementById('btnSidebarClearCart'),
    cartModeDelivery: document.getElementById('cartModeDelivery'),
    cartModePickup: document.getElementById('cartModePickup'),
    cartFreeDeliveryBox: document.getElementById('cartFreeDeliveryBox'),
    cfdText: document.getElementById('cfdText'),
    cfdFill: document.getElementById('cfdFill'),
    cartEmptyState: document.getElementById('cartEmptyState'),
    cartItemsList: document.getElementById('cartItemsList'),
    cartCutleryBox: document.getElementById('cartCutleryBox'),
    btnSidebarCutleryDec: document.getElementById('btnSidebarCutleryDec'),
    sidebarCutleryNum: document.getElementById('sidebarCutleryNum'),
    btnSidebarCutleryInc: document.getElementById('btnSidebarCutleryInc'),
    cartSidebarFooter: document.getElementById('cartSidebarFooter'),
    sidebarItemsCost: document.getElementById('sidebarItemsCost'),
    sidebarDiscountRow: document.getElementById('sidebarDiscountRow'),
    sidebarDiscountVal: document.getElementById('sidebarDiscountVal'),
    sidebarDeliveryRow: document.getElementById('sidebarDeliveryRow'),
    sidebarDeliveryCost: document.getElementById('sidebarDeliveryCost'),
    sidebarTotalCost: document.getElementById('sidebarTotalCost'),
    btnSidebarCheckout: document.getElementById('btnSidebarCheckout'),
    btnSidebarCheckoutSum: document.getElementById('btnSidebarCheckoutSum'),
    btnSidebarWhatsApp: document.getElementById('btnSidebarWhatsApp'),

    // Mobile Bottom Floating Bar & Sheet
    mobileBottomBar: document.getElementById('mobileBottomBar'),
    btnOpenMobileDrawer: document.getElementById('btnOpenMobileDrawer'),
    mobileCartCountTag: document.getElementById('mobileCartCountTag'),
    mobileCartTotalSum: document.getElementById('mobileCartTotalSum'),
    mobileCartBackdrop: document.getElementById('mobileCartBackdrop'),
    mobileCartSheet: document.getElementById('mobileCartSheet'),
    mobileSheetCount: document.getElementById('mobileSheetCount'),
    btnCloseMobileCart: document.getElementById('btnCloseMobileCart'),
    mobileCartScrollArea: document.getElementById('mobileCartScrollArea'),

    // Dish Modal
    dishModalBackdrop: document.getElementById('dishModalBackdrop'),
    btnCloseDishModal: document.getElementById('btnCloseDishModal'),
    dishModalTitle: document.getElementById('dishModalTitle'),
    dishModalPrice: document.getElementById('dishModalPrice'),
    dishModalSpecs: document.getElementById('dishModalSpecs'),
    dishModalDesc: document.getElementById('dishModalDesc'),
    dishModalModifiersSection: document.getElementById('dishModalModifiersSection'),
    dishModalModifiersList: document.getElementById('dishModalModifiersList'),
    btnDishModalAddToCart: document.getElementById('btnDishModalAddToCart'),

    // Checkout Modal
    checkoutModalBackdrop: document.getElementById('checkoutModalBackdrop'),
    btnCloseCheckoutModal: document.getElementById('btnCloseCheckoutModal'),
    checkoutSumDisplay: document.getElementById('checkoutSumDisplay'),
    checkoutForm: document.getElementById('checkoutForm'),
    orderInputName: document.getElementById('orderInputName'),
    orderInputPhone: document.getElementById('orderInputPhone'),
    orderInputAddress: document.getElementById('orderInputAddress'),
    checkoutDeliveryAddressBlock: document.getElementById('checkoutDeliveryAddressBlock'),
    checkoutPickupBlock: document.getElementById('checkoutPickupBlock'),
    payMethodCash: document.getElementById('payMethodCash'),
    payMethodOnline: document.getElementById('payMethodOnline'),

    // Payment Simulator
    simPayBackdrop: document.getElementById('simPayBackdrop'),
    simAmountDisplay: document.getElementById('simAmountDisplay'),
    btnSimPaySuccess: document.getElementById('btnSimPaySuccess'),
    btnSimFallbackCash: document.getElementById('btnSimFallbackCash'),
    btnSimCancel: document.getElementById('btnSimCancel'),

    // Tracker
    trackerBackdrop: document.getElementById('trackerBackdrop'),
    btnCloseTracker: document.getElementById('btnCloseTracker'),
    trackerOrderTag: document.getElementById('trackerOrderTag'),
    trackerItemsList: document.getElementById('trackerItemsList'),
    trackerFinalSum: document.getElementById('trackerFinalSum'),
    trackerDestAddr: document.getElementById('trackerDestAddr'),
    trStep1: document.getElementById('trStep1'),
    trStep2: document.getElementById('trStep2'),
    trStep3: document.getElementById('trStep3'),
    btnTrackerDone: document.getElementById('btnTrackerDone'),

    // Address Modal
    addressBackdrop: document.getElementById('addressBackdrop'),
    btnCloseAddressModal: document.getElementById('btnCloseAddressModal'),
    addressInputModal: document.getElementById('addressInputModal'),
    btnSaveAddress: document.getElementById('btnSaveAddress'),

    // About Modal
    aboutBackdrop: document.getElementById('aboutBackdrop'),
    btnCloseAboutModal: document.getElementById('btnCloseAboutModal'),

    // Toast
    toastStack: document.getElementById('toastStack')
  };

  // 1. Init
  async function init() {
    try {
      const resp = await fetch('dishes.json?v=5');
      if (resp.ok) {
        catalogData = await resp.json();
      } else {
        throw new Error('fetch failed');
      }
    } catch (e) {
      catalogData = getFallbackData();
    }

    renderCategoryTiles();
    renderCatalog();
    updateCartUI();
    setupEventListeners();
  }

  // 2. Render Category Tiles (Kuper 3D Emoji Tiles)
  function renderCategoryTiles() {
    if (!catalogData || !catalogData.categories || !el.categoriesGrid) return;
    el.categoriesGrid.innerHTML = '';

    // "Все меню" tile
    const allTile = document.createElement('div');
    allTile.className = 'cat-tile active';
    allTile.setAttribute('data-category-id', 'all');
    allTile.innerHTML = `
      <div class="cat-tile-icon">▦</div>
      <div class="cat-tile-name">Все меню</div>
      <div class="cat-tile-count">${catalogData.dishes.length} блюд</div>
    `;
    allTile.addEventListener('click', () => filterCategory('all', allTile));
    el.categoriesGrid.appendChild(allTile);

    catalogData.categories.forEach(cat => {
      const count = catalogData.dishes.filter(d => d.categoryId === cat.id).length;
      const icon = categoryIcons[cat.id] || '🌯';

      const tile = document.createElement('div');
      tile.className = 'cat-tile';
      tile.setAttribute('data-category-id', cat.id);
      tile.innerHTML = `
        <div class="cat-tile-icon">${icon}</div>
        <div class="cat-tile-name">${escapeHtml(cat.name.replace(/^[^\wа-яА-ЯёЁ]+/, '').trim())}</div>
        <div class="cat-tile-count">${count} ${getNoun(count, 'блюдо', 'блюда', 'блюд')}</div>
      `;
      tile.addEventListener('click', () => filterCategory(cat.id, tile));
      el.categoriesGrid.appendChild(tile);
    });
  }

  function filterCategory(catId, tileElement) {
    activeCategoryId = catId;
    el.categoriesGrid.querySelectorAll('.cat-tile').forEach(t => t.classList.remove('active'));
    tileElement.classList.add('active');
    renderCatalog();

    if (catId !== 'all') {
      const sec = document.getElementById(`cat-sec-${catId}`);
      if (sec) {
        sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  // 3. Render Catalog Sections
  function renderCatalog() {
    if (!catalogData || !el.catalogSectionsWrap) return;
    el.catalogSectionsWrap.innerHTML = '';
    const q = searchQuery.trim().toLowerCase();

    const categoriesToRender = activeCategoryId === 'all'
      ? catalogData.categories
      : catalogData.categories.filter(c => c.id === activeCategoryId);

    let totalDishesRendered = 0;

    categoriesToRender.forEach(cat => {
      let dishes = catalogData.dishes.filter(d => d.categoryId === cat.id);

      if (q) {
        dishes = dishes.filter(d =>
          d.name.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q)
        );
      }

      if (dishes.length === 0) return;
      totalDishesRendered += dishes.length;

      const sec = document.createElement('section');
      sec.className = 'catalog-section';
      sec.id = `cat-sec-${cat.id}`;

      const icon = categoryIcons[cat.id] || '🌯';
      const cleanName = cat.name.replace(/^[^\wа-яА-ЯёЁ]+/, '').trim();

      sec.innerHTML = `
        <div class="section-head-bar">
          <h2 class="section-title">${icon} ${cleanName}</h2>
          <span class="section-count">${dishes.length} ${getNoun(dishes.length, 'блюдо', 'блюда', 'блюд')}</span>
        </div>
        <div class="dishes-cards-grid" id="grid-${cat.id}"></div>
      `;

      const grid = sec.querySelector(`#grid-${cat.id}`);
      dishes.forEach(dish => {
        grid.appendChild(createDishCard(dish));
      });

      el.catalogSectionsWrap.appendChild(sec);
    });

    if (totalDishesRendered === 0 && q) {
      el.catalogSectionsWrap.innerHTML = `
        <div style="padding: 60px 20px; text-align: center; color: var(--k-text-muted);">
          <div style="font-size: 44px; margin-bottom: 10px;">🔍</div>
          <h3 style="font-size: 19px; font-weight: 800; color: #FFFFFF;">Ничего не нашлось</h3>
          <p style="font-size: 13px; margin-top: 4px;">Попробуйте поискать «буррито», «тако», «сыр» или «фри»</p>
        </div>
      `;
    }
  }

  // 4. Create Dish Card (Kuper Dark Clean Card — NO dish photos)
  function createDishCard(dish) {
    const card = document.createElement('div');
    card.className = 'kuper-dish-card product-card';
    card.setAttribute('data-dish-id', dish.id);

    // Badges
    let badges = '';
    if (dish.popular) badges += '<span class="badge-tag hit">🔥 Хит</span>';
    if (dish.spicy === 1) badges += '<span class="badge-tag spicy">🌶️ Острое</span>';
    if (dish.spicy >= 2) badges += '<span class="badge-tag spicy">🌶️🌶️ Огонь</span>';

    card.innerHTML = `
      <div class="dish-card-top">
        ${badges ? `<div class="dish-badges-row">${badges}</div>` : ''}
        <h3 class="dish-card-name">${escapeHtml(dish.name)}</h3>
        <p class="dish-card-desc">${escapeHtml(dish.description)}</p>
      </div>
      <div class="dish-card-bottom">
        <div class="dish-price-box">
          <span class="dish-price">${dish.price} ₽</span>
          <span class="dish-weight">${dish.weight}</span>
        </div>
        <div class="dish-card-action" id="card-action-${dish.id}"></div>
      </div>
    `;

    // Click on card body opens modal
    card.addEventListener('click', (e) => {
      if (e.target.closest('.dish-card-stepper') || e.target.closest('.btn-kuper-add')) {
        return;
      }
      openDishModal(dish);
    });

    const actionContainer = card.querySelector(`#card-action-${dish.id}`);
    renderCardAction(actionContainer, dish);

    return card;
  }

  function renderCardAction(container, dish) {
    if (!container) return;
    const count = getDishTotalCountInCart(dish.id);

    if (count > 0) {
      container.innerHTML = `
        <div class="dish-card-stepper">
          <button class="c-dec" data-id="${dish.id}" title="Меньше">−</button>
          <span>${count}</span>
          <button class="c-inc" data-id="${dish.id}" title="Больше">+</button>
        </div>
      `;
      container.querySelector('.c-dec').addEventListener('click', (e) => {
        e.stopPropagation();
        decrementDish(dish.id);
      });
      container.querySelector('.c-inc').addEventListener('click', (e) => {
        e.stopPropagation();
        incrementDish(dish.id);
      });
    } else {
      container.innerHTML = `
        <button class="btn-kuper-add" data-id="${dish.id}">
          + Добавить
        </button>
      `;
      container.querySelector('.btn-kuper-add').addEventListener('click', (e) => {
        e.stopPropagation();
        addToCart(dish, []);
        showToast(`«${dish.name}» добавлен в корзину`);
      });
    }
  }

  function updateAllCardsUI() {
    if (!catalogData) return;
    catalogData.dishes.forEach(dish => {
      const actions = document.querySelectorAll(`#card-action-${dish.id}`);
      actions.forEach(a => renderCardAction(a, dish));
    });
  }

  // 5. Dish Details Modal
  function openDishModal(dish) {
    currentModalDish = dish;
    currentSelectedModifiers = [];

    el.dishModalTitle.textContent = dish.name;
    el.dishModalPrice.textContent = `${dish.price} ₽`;
    el.dishModalSpecs.innerHTML = `
      <span>⚖️ ${dish.weight}</span>
      <span>•</span>
      <span>🔥 ${dish.calories || '520 ккал'}</span>
      ${dish.spicy > 0 ? `<span>•</span> <span style="color:var(--k-spicy); font-weight:800;">🌶️ ${dish.spicy === 1 ? 'Острое' : 'Огонь'}</span>` : ''}
    `;
    el.dishModalDesc.textContent = dish.description;

    el.dishModalModifiersList.innerHTML = '';
    if (dish.modifiers && dish.modifiers.length > 0) {
      el.dishModalModifiersSection.style.display = 'block';
      dish.modifiers.forEach((mod, idx) => {
        const row = document.createElement('div');
        row.className = 'mod-row';
        row.innerHTML = `
          <div class="mod-left">
            <input type="checkbox" id="m-${idx}" />
            <label for="m-${idx}">${escapeHtml(mod.name)}</label>
          </div>
          <span class="mod-price">+${mod.price} ₽</span>
        `;
        row.addEventListener('click', (e) => {
          if (e.target.tagName !== 'INPUT') {
            const cb = row.querySelector('input');
            cb.checked = !cb.checked;
          }
          const isChecked = row.querySelector('input').checked;
          if (isChecked) {
            currentSelectedModifiers.push(mod);
            row.classList.add('selected');
          } else {
            currentSelectedModifiers = currentSelectedModifiers.filter(m => m.name !== mod.name);
            row.classList.remove('selected');
          }
          updateModalAddBtnPrice();
        });
        el.dishModalModifiersList.appendChild(row);
      });
    } else {
      el.dishModalModifiersSection.style.display = 'none';
    }

    updateModalAddBtnPrice();
    el.dishModalBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function updateModalAddBtnPrice() {
    if (!currentModalDish) return;
    const modsSum = currentSelectedModifiers.reduce((acc, m) => acc + (m.price || 0), 0);
    const total = currentModalDish.price + modsSum;
    el.btnDishModalAddToCart.innerHTML = `
      <span>Добавить в корзину</span>
      <span>${total} ₽</span>
    `;
  }

  function closeDishModal() {
    el.dishModalBackdrop.classList.remove('active');
    document.body.style.overflow = '';
    currentModalDish = null;
    currentSelectedModifiers = [];
  }

  // 6. Cart Logic
  function addToCart(dish, modifiers = []) {
    const modNames = modifiers.map(m => m.name).sort().join('|');
    const modsCost = modifiers.reduce((acc, m) => acc + (m.price || 0), 0);
    const itemPrice = dish.price + modsCost;
    const cartItemId = `${dish.id}__${modNames}`;

    const existing = cart.find(i => i.id === cartItemId);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        id: cartItemId,
        dishId: dish.id,
        name: dish.name,
        price: itemPrice,
        basePrice: dish.price,
        weight: dish.weight,
        modifiers: [...modifiers],
        quantity: 1
      });
    }

    updateCartUI();
    updateAllCardsUI();
  }

  function incrementDish(dishId) {
    const item = cart.find(i => i.dishId === dishId);
    if (item) {
      item.quantity += 1;
    } else {
      const dish = catalogData.dishes.find(d => d.id === dishId);
      if (dish) addToCart(dish, []);
      return;
    }
    updateCartUI();
    updateAllCardsUI();
  }

  function decrementDish(dishId) {
    const itemIndex = cart.map(i => i.dishId).lastIndexOf(dishId);
    if (itemIndex > -1) {
      if (cart[itemIndex].quantity > 1) {
        cart[itemIndex].quantity -= 1;
      } else {
        cart.splice(itemIndex, 1);
      }
    }
    updateCartUI();
    updateAllCardsUI();
  }

  function getDishTotalCountInCart(dishId) {
    return cart.filter(i => i.dishId === dishId).reduce((acc, i) => acc + i.quantity, 0);
  }

  function getCartItemsTotal() {
    return cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
  }

  function getCartDiscount() {
    let discount = 0;
    const baseTotal = getCartItemsTotal();
    
    // Promo code discount
    if (activePromoCode && promoDiscountPct > 0 && baseTotal >= 1000) {
      discount += Math.round(baseTotal * promoDiscountPct);
    }

    // Pickup discount (-10%)
    if (deliveryType === 'pickup') {
      discount += Math.round((baseTotal - discount) * 0.1);
    }

    return discount;
  }

  function getCartItemsCount() {
    return cart.reduce((acc, i) => acc + i.quantity, 0);
  }

  function getDeliveryCost(itemsTotal) {
    if (deliveryType === 'pickup') return 0;
    const threshold = catalogData?.restaurant?.freeDeliveryThreshold || 800;
    if (itemsTotal >= threshold) return 0;
    return catalogData?.restaurant?.deliveryCost || 149;
  }

  // 7. Update Cart UI (Sidebar & Mobile)
  function updateCartUI() {
    const count = getCartItemsCount();
    const rawTotal = getCartItemsTotal();
    const discount = getCartDiscount();
    const itemsTotalAfterDiscount = Math.max(0, rawTotal - discount);
    const deliveryCost = getDeliveryCost(rawTotal);
    const finalTotal = itemsTotalAfterDiscount + deliveryCost;
    const threshold = catalogData?.restaurant?.freeDeliveryThreshold || 800;

    // Header mobile badge
    if (count > 0) {
      el.mobileHeaderCartBadge.textContent = count;
      el.mobileHeaderCartBadge.style.display = 'inline-block';
    } else {
      el.mobileHeaderCartBadge.style.display = 'none';
    }

    // Mobile bottom bar
    if (count > 0) {
      el.mobileBottomBar.classList.add('visible');
      el.mobileCartCountTag.textContent = `${count}`;
      el.mobileCartTotalSum.textContent = `${finalTotal} ₽`;
    } else {
      el.mobileBottomBar.classList.remove('visible');
    }

    // Mobile sheet count
    el.mobileSheetCount.textContent = `${count} ${getNoun(count, 'позиция', 'позиции', 'позиций')}`;

    // Desktop Sidebar Cart State
    if (count === 0) {
      el.cartEmptyState.style.display = 'flex';
      el.cartItemsList.style.display = 'none';
      el.cartCutleryBox.style.display = 'none';
      el.cartSidebarFooter.style.display = 'none';
      el.cartFreeDeliveryBox.style.display = 'none';
      el.btnSidebarClearCart.style.display = 'none';
    } else {
      el.cartEmptyState.style.display = 'none';
      el.cartItemsList.style.display = 'flex';
      el.cartCutleryBox.style.display = 'flex';
      el.cartSidebarFooter.style.display = 'block';
      el.btnSidebarClearCart.style.display = 'block';

      // Free delivery progress
      if (deliveryType === 'delivery') {
        el.cartFreeDeliveryBox.style.display = 'block';
        if (rawTotal >= threshold) {
          el.cfdText.innerHTML = `🎉 <strong>Бесплатная доставка!</strong>`;
          el.cfdFill.style.width = '100%';
        } else {
          const diff = threshold - rawTotal;
          const pct = Math.min(100, Math.round((rawTotal / threshold) * 100));
          el.cfdText.innerHTML = `До бесплатной доставки: <strong>${diff} ₽</strong>`;
          el.cfdFill.style.width = `${pct}%`;
        }
      } else {
        el.cartFreeDeliveryBox.style.display = 'none';
      }

      // Render cart items HTML
      renderCartItemsMarkup();

      // Calculation summary
      el.sidebarItemsCost.textContent = `${rawTotal} ₽`;

      if (discount > 0) {
        el.sidebarDiscountRow.style.display = 'flex';
        el.sidebarDiscountVal.textContent = `-${discount} ₽`;
      } else {
        el.sidebarDiscountRow.style.display = 'none';
      }

      if (deliveryType === 'pickup') {
        el.sidebarDeliveryCost.textContent = 'Самовывоз 0 ₽';
        el.sidebarDeliveryCost.style.color = 'var(--k-green)';
      } else {
        if (deliveryCost === 0) {
          el.sidebarDeliveryCost.textContent = 'Бесплатно';
          el.sidebarDeliveryCost.style.color = 'var(--k-green)';
        } else {
          el.sidebarDeliveryCost.textContent = `${deliveryCost} ₽`;
          el.sidebarDeliveryCost.style.color = '#FFFFFF';
        }
      }

      el.sidebarTotalCost.textContent = `${finalTotal} ₽`;
      el.btnSidebarCheckoutSum.textContent = `${finalTotal} ₽`;
    }

    // Sync mobile drawer content
    syncMobileDrawer();
  }

  function renderCartItemsMarkup() {
    el.cartItemsList.innerHTML = '';

    cart.forEach(item => {
      const row = document.createElement('div');
      row.className = 'sidebar-cart-item';

      let modsStr = '';
      if (item.modifiers && item.modifiers.length > 0) {
        modsStr = item.modifiers.map(m => `+ ${m.name}`).join(', ');
      }

      row.innerHTML = `
        <div class="item-meta-wrap">
          <div class="item-meta-title">${escapeHtml(item.name)}</div>
          ${modsStr ? `<div class="item-meta-mods">${escapeHtml(modsStr)}</div>` : ''}
          <div class="item-meta-price">${item.price * item.quantity} ₽</div>
        </div>
        <div class="item-stepper">
          <button class="s-dec" title="Меньше">−</button>
          <span>${item.quantity}</span>
          <button class="s-inc" title="Больше">+</button>
        </div>
      `;

      row.querySelector('.s-dec').addEventListener('click', () => {
        if (item.quantity > 1) {
          item.quantity -= 1;
        } else {
          cart = cart.filter(i => i.id !== item.id);
        }
        updateCartUI();
        updateAllCardsUI();
      });

      row.querySelector('.s-inc').addEventListener('click', () => {
        item.quantity += 1;
        updateCartUI();
        updateAllCardsUI();
      });

      el.cartItemsList.appendChild(row);
    });
  }

  function syncMobileDrawer() {
    if (!el.mobileCartScrollArea) return;
    const count = getCartItemsCount();

    if (count === 0) {
      el.mobileCartScrollArea.innerHTML = `
        <div class="cart-empty-state" style="padding: 40px 10px;">
          <h3 class="empty-state-title">В корзине пусто</h3>
          <p class="empty-state-desc">Выберите блюда в меню, чтобы сделать заказ</p>
        </div>
      `;
      return;
    }

    const rawTotal = getCartItemsTotal();
    const discount = getCartDiscount();
    const finalTotal = Math.max(0, rawTotal - discount) + getDeliveryCost(rawTotal);

    let itemsHtml = '';
    cart.forEach(item => {
      let modsStr = item.modifiers?.length ? item.modifiers.map(m => `+ ${m.name}`).join(', ') : '';
      itemsHtml += `
        <div class="sidebar-cart-item">
          <div class="item-meta-wrap">
            <div class="item-meta-title">${escapeHtml(item.name)}</div>
            ${modsStr ? `<div class="item-meta-mods">${escapeHtml(modsStr)}</div>` : ''}
            <div class="item-meta-price">${item.price * item.quantity} ₽</div>
          </div>
          <div class="item-stepper">
            <button class="m-dec" data-id="${item.id}">−</button>
            <span>${item.quantity}</span>
            <button class="m-inc" data-id="${item.id}">+</button>
          </div>
        </div>
      `;
    });

    el.mobileCartScrollArea.innerHTML = `
      <div style="margin-bottom: 14px;">
        ${itemsHtml}
      </div>

      <div class="calc-row" style="margin-top: 10px;">
        <span>Сумма товаров:</span>
        <span>${rawTotal} ₽</span>
      </div>
      ${discount > 0 ? `
      <div class="calc-row">
        <span style="color:var(--k-green);">Скидка:</span>
        <span style="color:var(--k-green);">-${discount} ₽</span>
      </div>` : ''}
      <div class="calc-row">
        <span>Доставка:</span>
        <span>${getDeliveryCost(rawTotal) === 0 ? 'Бесплатно' : getDeliveryCost(rawTotal) + ' ₽'}</span>
      </div>
      <div class="calc-row total" style="margin: 12px 0 16px;">
        <span>Итого:</span>
        <span style="color:var(--k-green);">${finalTotal} ₽</span>
      </div>

      <button class="btn-kuper-checkout-main" id="btnMobileDrawerProceedCheckout">
        <span>Оформить заказ</span>
        <span>${finalTotal} ₽</span>
      </button>

      <button class="btn-kuper-whatsapp" id="btnMobileDrawerWhatsApp" style="margin-top: 10px;">
        <span>💬 Заказать через WhatsApp</span>
      </button>
    `;

    // Wire mobile drawer events
    el.mobileCartScrollArea.querySelectorAll('.m-dec').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = cart.find(i => i.id === id);
        if (item) {
          if (item.quantity > 1) {
            item.quantity -= 1;
          } else {
            cart = cart.filter(i => i.id !== id);
          }
          updateCartUI();
          updateAllCardsUI();
        }
      });
    });

    el.mobileCartScrollArea.querySelectorAll('.m-inc').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = cart.find(i => i.id === id);
        if (item) {
          item.quantity += 1;
          updateCartUI();
          updateAllCardsUI();
        }
      });
    });

    const btnProceed = el.mobileCartScrollArea.querySelector('#btnMobileDrawerProceedCheckout');
    if (btnProceed) {
      btnProceed.addEventListener('click', () => {
        closeMobileCartSheet();
        openCheckoutModal();
      });
    }

    const btnWA = el.mobileCartScrollArea.querySelector('#btnMobileDrawerWhatsApp');
    if (btnWA) {
      btnWA.addEventListener('click', sendWhatsAppOrder);
    }
  }

  // 8. Mobile Drawer Sheet Toggle
  function openMobileCartSheet() {
    el.mobileCartBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileCartSheet() {
    el.mobileCartBackdrop.classList.remove('active');
    document.body.style.overflow = '';
  }

  // 9. Checkout Flow
  function openCheckoutModal() {
    const count = getCartItemsCount();
    if (count === 0) {
      showToast('Ваша корзина пуста');
      return;
    }

    const rawTotal = getCartItemsTotal();
    const discount = getCartDiscount();
    const finalTotal = Math.max(0, rawTotal - discount) + getDeliveryCost(rawTotal);

    el.checkoutSumDisplay.textContent = `${finalTotal} ₽`;

    if (deliveryType === 'pickup') {
      el.checkoutDeliveryAddressBlock.style.display = 'none';
      el.checkoutPickupBlock.style.display = 'block';
    } else {
      el.checkoutDeliveryAddressBlock.style.display = 'block';
      el.checkoutPickupBlock.style.display = 'none';
    }

    el.checkoutModalBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeCheckoutModal() {
    el.checkoutModalBackdrop.classList.remove('active');
    document.body.style.overflow = '';
  }

  function handlePaymentSelect(method) {
    selectedPaymentMethod = method;
    if (method === 'cash') {
      el.payMethodCash.classList.add('selected');
      el.payMethodOnline.classList.remove('selected');
    } else {
      el.payMethodOnline.classList.add('selected');
      el.payMethodCash.classList.remove('selected');
    }
  }

  function submitOrderForm(e) {
    e.preventDefault();
    const phone = el.orderInputPhone.value.trim();
    if (!phone || phone.length < 10) {
      showToast('Пожалуйста, введите корректный номер телефона');
      el.orderInputPhone.focus();
      return;
    }

    const rawTotal = getCartItemsTotal();
    const discount = getCartDiscount();
    const finalTotal = Math.max(0, rawTotal - discount) + getDeliveryCost(rawTotal);

    closeCheckoutModal();

    if (selectedPaymentMethod === 'online') {
      openOnlinePaymentSimulator(finalTotal);
    } else {
      finalizeOrder(finalTotal, 'При получении курьеру');
    }
  }

  // 10. Online Payment Simulator
  function openOnlinePaymentSimulator(sum) {
    el.simAmountDisplay.textContent = `${sum} ₽`;
    el.simPayBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeOnlinePaymentSimulator() {
    el.simPayBackdrop.classList.remove('active');
    document.body.style.overflow = '';
  }

  // 11. Order Finalize & Live Tracker
  function finalizeOrder(finalTotal, paymentDesc) {
    closeOnlinePaymentSimulator();
    closeCheckoutModal();

    const orderNum = `FB-${Math.floor(1000 + Math.random() * 9000)}`;
    el.trackerOrderTag.textContent = `Заказ #${orderNum}`;
    el.trackerFinalSum.textContent = `${finalTotal} ₽ • ${paymentDesc}`;
    el.trackerDestAddr.textContent = deliveryType === 'delivery' ? userAddress : 'Самовывоз: ул. Петра Метальникова, 3/1А';

    el.trackerItemsList.innerHTML = cart.map(i =>
      `<div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:12px;">
        <span>${escapeHtml(i.name)} × ${i.quantity}</span>
        <strong style="color:var(--k-green);">${i.price * i.quantity} ₽</strong>
      </div>`
    ).join('');

    // Clear cart
    cart = [];
    updateCartUI();
    updateAllCardsUI();

    // Show Tracker
    el.trackerBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';

    runTrackerSimulation();
  }

  function runTrackerSimulation() {
    if (activeOrderSimulation) clearInterval(activeOrderSimulation);

    el.trStep1.className = 'track-step active';
    el.trStep2.className = 'track-step';
    el.trStep3.className = 'track-step';

    let sec = 0;
    activeOrderSimulation = setInterval(() => {
      sec += 3;
      if (sec === 3) {
        el.trStep1.className = 'track-step completed';
        el.trStep2.className = 'track-step active';
      } else if (sec === 6) {
        el.trStep2.className = 'track-step completed';
        el.trStep3.className = 'track-step active';
        clearInterval(activeOrderSimulation);
      }
    }, 2400);
  }

  function closeTracker() {
    el.trackerBackdrop.classList.remove('active');
    document.body.style.overflow = '';
    if (activeOrderSimulation) clearInterval(activeOrderSimulation);
  }

  // 12. WhatsApp Order
  function sendWhatsAppOrder() {
    const count = getCartItemsCount();
    if (count === 0) {
      showToast('Добавьте блюда в корзину');
      return;
    }

    const rawTotal = getCartItemsTotal();
    const discount = getCartDiscount();
    const deliveryCost = getDeliveryCost(rawTotal);
    const finalTotal = Math.max(0, rawTotal - discount) + deliveryCost;

    let text = `🌯 *Заказ Frito Burrito (Купер Доставка)*:\n\n`;
    cart.forEach(item => {
      let mods = item.modifiers?.length ? ` (${item.modifiers.map(m => m.name).join(', ')})` : '';
      text += `• ${item.name}${mods} x${item.quantity} = ${item.price * item.quantity} ₽\n`;
    });

    text += `\n🍴 Приборы: ${cutleryCount} шт.\n`;
    text += `📦 Способ: ${deliveryType === 'delivery' ? 'Доставка курьером' : 'Самовывоз (-10%)'}\n`;
    if (deliveryType === 'delivery') {
      text += `📍 Адрес: ${userAddress}\n`;
      text += `🛵 Доставка: ${deliveryCost === 0 ? 'Бесплатно' : deliveryCost + ' ₽'}\n`;
    } else {
      text += `📍 Точка самовывоза: ул. Петра Метальникова, 3/1А\n`;
    }
    if (discount > 0) text += `🎁 Скидка: -${discount} ₽\n`;
    text += `💳 Оплата: ${selectedPaymentMethod === 'cash' ? 'При получении' : 'Онлайн'}\n`;
    text += `💰 *ИТОГО: ${finalTotal} ₽*`;

    const phone = '79996505576';
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    showToast('Переходим в WhatsApp для заказа...');
  }

  // 13. Promo Code Handling
  function applyPromoCode(code) {
    if (code.toUpperCase() === 'ФРИТО15') {
      activePromoCode = 'ФРИТО15';
      promoDiscountPct = 0.15;
      updateCartUI();
      showToast('🎉 Промокод ФРИТО15 активирован! Скидка 15% на заказы от 1 000 ₽');
    } else {
      showToast('Неверный промокод');
    }
  }

  // 14. Toast Helper
  function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'toast-item';
    t.textContent = msg;
    el.toastStack.appendChild(t);

    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateY(10px)';
      t.style.transition = 'all 0.25s ease';
      setTimeout(() => t.remove(), 260);
    }, 2500);
  }

  // 15. Wire Event Listeners
  function setupEventListeners() {
    // Search
    el.searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (searchQuery.length > 0) {
        el.searchClearBtn.classList.add('visible');
      } else {
        el.searchClearBtn.classList.remove('visible');
      }
      renderCatalog();
    });

    el.searchClearBtn.addEventListener('click', () => {
      el.searchInput.value = '';
      searchQuery = '';
      el.searchClearBtn.classList.remove('visible');
      renderCatalog();
    });

    // Promo button in header
    el.btnHeaderPromo.addEventListener('click', () => {
      applyPromoCode('ФРИТО15');
    });

    // Hero Promo Apply & Voucher Click
    el.btnApplyHeroPromo.addEventListener('click', () => {
      applyPromoCode('ФРИТО15');
    });

    el.heroTicketCode.addEventListener('click', () => {
      navigator.clipboard?.writeText('ФРИТО15');
      applyPromoCode('ФРИТО15');
    });

    // Notice close
    el.btnCloseNotice.addEventListener('click', () => {
      el.noticeBar.style.display = 'none';
    });

    // Delivery Mode Tabs (Sidebar)
    el.cartModeDelivery.addEventListener('click', () => {
      deliveryType = 'delivery';
      el.cartModeDelivery.classList.add('active');
      el.cartModePickup.classList.remove('active');
      updateCartUI();
      showToast('Выбрана доставка курьером');
    });

    el.cartModePickup.addEventListener('click', () => {
      deliveryType = 'pickup';
      el.cartModePickup.classList.add('active');
      el.cartModeDelivery.classList.remove('active');
      updateCartUI();
      showToast('Выбран самовывоз: скидка 10%!');
    });

    // Cutlery
    el.btnSidebarCutleryDec.addEventListener('click', () => {
      if (cutleryCount > 0) {
        cutleryCount -= 1;
        el.sidebarCutleryNum.textContent = cutleryCount;
      }
    });

    el.btnSidebarCutleryInc.addEventListener('click', () => {
      cutleryCount += 1;
      el.sidebarCutleryNum.textContent = cutleryCount;
    });

    // Clear cart
    el.btnSidebarClearCart.addEventListener('click', () => {
      cart = [];
      updateCartUI();
      updateAllCardsUI();
      showToast('Корзина очищена');
    });

    // Checkout
    el.btnSidebarCheckout.addEventListener('click', openCheckoutModal);
    el.btnSidebarWhatsApp.addEventListener('click', sendWhatsAppOrder);
    el.btnCloseCheckoutModal.addEventListener('click', closeCheckoutModal);
    el.checkoutModalBackdrop.addEventListener('click', (e) => {
      if (e.target === el.checkoutModalBackdrop) closeCheckoutModal();
    });

    el.payMethodCash.addEventListener('click', () => handlePaymentSelect('cash'));
    el.payMethodOnline.addEventListener('click', () => handlePaymentSelect('online'));
    el.checkoutForm.addEventListener('submit', submitOrderForm);

    // Mobile drawer trigger
    el.btnOpenMobileDrawer.addEventListener('click', openMobileCartSheet);
    el.btnMobileHeaderCart.addEventListener('click', openMobileCartSheet);
    el.btnCloseMobileCart.addEventListener('click', closeMobileCartSheet);
    el.mobileCartBackdrop.addEventListener('click', (e) => {
      if (e.target === el.mobileCartBackdrop) closeMobileCartSheet();
    });

    // Payment Simulator
    el.btnSimPaySuccess.addEventListener('click', () => {
      finalizeOrder(getCartItemsTotal() + getDeliveryCost(getCartItemsTotal()), 'Оплачено картой / СБП');
    });
    el.btnSimFallbackCash.addEventListener('click', () => {
      finalizeOrder(getCartItemsTotal() + getDeliveryCost(getCartItemsTotal()), 'При получении');
    });
    el.btnSimCancel.addEventListener('click', () => {
      closeOnlinePaymentSimulator();
      showToast('Оплата отменена. Корзина сохранена');
    });

    // Tracker
    el.btnCloseTracker.addEventListener('click', closeTracker);
    el.btnTrackerDone.addEventListener('click', closeTracker);

    // Dish Modal
    el.btnCloseDishModal.addEventListener('click', closeDishModal);
    el.dishModalBackdrop.addEventListener('click', (e) => {
      if (e.target === el.dishModalBackdrop) closeDishModal();
    });
    el.btnDishModalAddToCart.addEventListener('click', () => {
      if (currentModalDish) {
        addToCart(currentModalDish, currentSelectedModifiers);
        showToast(`«${currentModalDish.name}» добавлен в корзину`);
        closeDishModal();
      }
    });

    // Address Modal
    el.btnSelectAddress.addEventListener('click', () => {
      el.addressInputModal.value = userAddress;
      el.addressBackdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
    el.btnCloseAddressModal.addEventListener('click', () => {
      el.addressBackdrop.classList.remove('active');
      document.body.style.overflow = '';
    });
    el.btnSaveAddress.addEventListener('click', () => {
      const val = el.addressInputModal.value.trim();
      if (val) {
        userAddress = val;
        el.currentAddressHeader.textContent = val;
        el.orderInputAddress.value = val;
        showToast('Адрес обновлен');
      }
      el.addressBackdrop.classList.remove('active');
      document.body.style.overflow = '';
    });

    // About Modal
    el.topAboutLink.addEventListener('click', (e) => {
      e.preventDefault();
      el.aboutBackdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
    el.btnCloseAboutModal.addEventListener('click', () => {
      el.aboutBackdrop.classList.remove('active');
      document.body.style.overflow = '';
    });

    // Phone auto mask
    el.orderInputPhone.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.startsWith('7') || v.startsWith('8')) v = v.substring(1);
      let f = '+7 (';
      if (v.length > 0) f += v.substring(0, 3);
      if (v.length >= 3) f += ') ' + v.substring(3, 6);
      if (v.length >= 6) f += '-' + v.substring(6, 8);
      if (v.length >= 8) f += '-' + v.substring(8, 10);
      e.target.value = f;
    });

    // Escape Key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeDishModal();
        closeMobileCartSheet();
        closeCheckoutModal();
        closeOnlinePaymentSimulator();
        closeTracker();
        el.addressBackdrop.classList.remove('active');
        el.aboutBackdrop.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // Helpers
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    })[m]);
  }

  function getNoun(n, one, two, five) {
    let num = Math.abs(n) % 100;
    if (num >= 5 && num <= 20) return five;
    num %= 10;
    if (num === 1) return one;
    if (num >= 2 && num <= 4) return two;
    return five;
  }

  function getFallbackData() {
    return {
      restaurant: {
        id: "frito-burrito-krd",
        name: "Frito Burrito",
        cuisine: "Мексиканский стритфуд",
        rating: "5.0",
        reviewsCount: 240,
        freeDeliveryThreshold: 800,
        deliveryCost: 149
      },
      categories: [
        { id: "burrito", name: "🌯 Буррито" },
        { id: "tacos-quesadilla", name: "🌮 Тако и Кесадильи" },
        { id: "snacks", name: "🍟 Горячие закуски" },
        { id: "sauces", name: "🥑 Фирменные соусы" },
        { id: "drinks", name: "🥤 Напитки" },
        { id: "combos", name: "🎁 Комбо-наборы" }
      ],
      dishes: [
        {
          id: "burrito-classic",
          categoryId: "burrito",
          name: "Буррито «Эль Классико»",
          price: 250,
          weight: "360 г",
          popular: true,
          spicy: 0,
          description: "Сочное куриное филе на гриле, свежие томаты, кукуруза, сыр моцарелла, свежая зелень и фирменный сливочный соус в подрумяненной тортилье."
        },
        {
          id: "burrito-juanita",
          categoryId: "burrito",
          name: "Буррито «Месть Хуаниты»",
          price: 300,
          weight: "380 г",
          popular: true,
          spicy: 1,
          description: "Пикантная рубленая мраморная говядина, острый перчик халапеньо, красная фасоль пинто, тянущийся чеддер и аутентичная сальса роха."
        },
        {
          id: "burrito-diablo",
          categoryId: "burrito",
          name: "Буррито «Эль Диабло»",
          price: 330,
          weight: "390 г",
          popular: true,
          spicy: 2,
          description: "Экстра-острый мексиканский хит! Мраморная говядина и цыпленок, острый соус чили-хабанеро, халапеньо, сладкая кукуруза и расплавленный чеддер."
        },
        {
          id: "tacos-box",
          categoryId: "tacos-quesadilla",
          name: "Такос Ланч-Бокс (3 шт)",
          price: 500,
          weight: "380 г",
          popular: true,
          spicy: 1,
          description: "Три хрустящих кукурузно-пшеничных тако: с томленым цыпленком, острой говядиной и свежими овощами с долькой сочного лайма."
        },
        {
          id: "fries-crispy",
          categoryId: "snacks",
          name: "Картофель Фри хрустящий",
          price: 170,
          weight: "150 г",
          popular: true,
          spicy: 0,
          description: "Золотистые хрустящие брусочки картофеля фри с легкой морской солью и паприкой."
        }
      ]
    };
  }

  document.addEventListener('DOMContentLoaded', init);
})();
