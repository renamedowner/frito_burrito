/**
 * FRITO BURRITO — OFFICIAL RESTAURANT APPLICATION
 * Emerald dark theme, multi-promo carousel, compact category chips,
 * minimalist cards with real food photo slots, legal compliance (152-ФЗ),
 * 100% interactive buttons, zero errors.
 */

(function () {
  'use strict';

  let catalogData = null;
  let activeCategoryId = 'all';
  let deliveryType = 'delivery'; // 'delivery' or 'pickup'
  let cutleryCount = 1;
  let searchQuery = '';
  let userAddress = 'ул. Петра Метальникова, 3/1А';
  let selectedPaymentMethod = 'online'; // Онлайн картой / СБП
  let activeOrderSimulation = null;
  let activePromoCode = null; // e.g. 'ФРИТО15'
  let promoDiscountPct = 0; // 0.15
  let currentPromoSlide = 0;
  let promoInterval = null;

  // Cart: Array of { id, dishId, name, price, basePrice, weight, image, modifiers, quantity }
  let cart = [];

  // Current modal state
  let currentModalDish = null;
  let currentSelectedModifiers = [];

  // Category Icon Mapping
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
    // Top Bar & Header
    topAboutBtn: document.getElementById('topAboutBtn'),
    searchInput: document.getElementById('searchInput'),
    searchClearBtn: document.getElementById('searchClearBtn'),
    btnSelectAddress: document.getElementById('btnSelectAddress'),
    currentAddressHeader: document.getElementById('currentAddressHeader'),
    btnHeaderPromo: document.getElementById('btnHeaderPromo'),
    btnHeaderProfile: document.getElementById('btnHeaderProfile'),
    userProfileLabel: document.getElementById('userProfileLabel'),
    btnHeaderBonuses: document.getElementById('btnHeaderBonuses'),
    bonusValDisplay: document.getElementById('bonusValDisplay'),
    btnMobileHeaderCart: document.getElementById('btnMobileHeaderCart'),
    mobileHeaderCartBadge: document.getElementById('mobileHeaderCartBadge'),

    // Promo Carousel
    promoCarouselTrack: document.getElementById('promoCarouselTrack'),
    btnPromoPrev: document.getElementById('btnPromoPrev'),
    btnPromoNext: document.getElementById('btnPromoNext'),
    promoCarouselDots: document.getElementById('promoCarouselDots'),
    btnApplyPromo15: document.getElementById('btnApplyPromo15'),
    ticketCode15: document.getElementById('ticketCode15'),
    btnActivatePickupPromo: document.getElementById('btnActivatePickupPromo'),
    ticketCodePickup: document.getElementById('ticketCodePickup'),
    btnGoToCombos: document.getElementById('btnGoToCombos'),
    ticketCodeFree: document.getElementById('ticketCodeFree'),

    // Categories & Catalog
    compactCategoriesTrack: document.getElementById('compactCategoriesTrack'),
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

    // Mobile Bottom Floating Bar & Sheet
    mobileNavBar: document.getElementById('mobileNavBar'),
    mNavMenu: document.getElementById('mNavMenu'),
    mNavSearch: document.getElementById('mNavSearch'),
    mNavPromo: document.getElementById('mNavPromo'),
    mNavCart: document.getElementById('mNavCart'),
    mNavCartBadge: document.getElementById('mNavCartBadge'),
    mNavProfile: document.getElementById('mNavProfile'),
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
    dishModalImg: document.getElementById('dishModalImg'),
    dishModalTitle: document.getElementById('dishModalTitle'),
    dishModalPrice: document.getElementById('dishModalPrice'),
    dishModalSpecs: document.getElementById('dishModalSpecs'),
    dishModalDesc: document.getElementById('dishModalDesc'),
    dishModalModifiersSection: document.getElementById('dishModalModifiersSection'),
    dishModalModifiersList: document.getElementById('dishModalModifiersList'),
    btnDishModalAddToCart: document.getElementById('btnDishModalAddToCart'),
    dishModalBtnSum: document.getElementById('dishModalBtnSum'),

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
    payMethodOnline: document.getElementById('payMethodOnline'),
    linkConsentOffer: document.getElementById('linkConsentOffer'),
    linkConsentPrivacy: document.getElementById('linkConsentPrivacy'),

    // Payment Simulator
    simPayBackdrop: document.getElementById('simPayBackdrop'),
    simAmountDisplay: document.getElementById('simAmountDisplay'),
    btnSimPaySuccess: document.getElementById('btnSimPaySuccess'),
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

    // Promo Codes Modal
    promoCodesBackdrop: document.getElementById('promoCodesBackdrop'),
    btnClosePromoCodesModal: document.getElementById('btnClosePromoCodesModal'),

    // Profile Modal
    profileBackdrop: document.getElementById('profileBackdrop'),
    btnCloseProfileModal: document.getElementById('btnCloseProfileModal'),
    profileLoggedOutView: document.getElementById('profileLoggedOutView'),
    profileLoggedInView: document.getElementById('profileLoggedInView'),
    authPhoneInput: document.getElementById('authPhoneInput'),
    btnSendAuthCode: document.getElementById('btnSendAuthCode'),
    profileUserName: document.getElementById('profileUserName'),
    profileUserPhone: document.getElementById('profileUserPhone'),
    btnLogoutProfile: document.getElementById('btnLogoutProfile'),

    // Bonuses Modal
    bonusesBackdrop: document.getElementById('bonusesBackdrop'),
    btnCloseBonusesModal: document.getElementById('btnCloseBonusesModal'),
    btnCloseBonusesAction: document.getElementById('btnCloseBonusesAction'),

    // Legal Modals
    legalPrivacyBackdrop: document.getElementById('legalPrivacyBackdrop'),
    btnClosePrivacyModal: document.getElementById('btnClosePrivacyModal'),
    btnAcceptPrivacyModal: document.getElementById('btnAcceptPrivacyModal'),
    legalOfferBackdrop: document.getElementById('legalOfferBackdrop'),
    btnCloseOfferModal: document.getElementById('btnCloseOfferModal'),
    btnAcceptOfferModal: document.getElementById('btnAcceptOfferModal'),

    // Footer Legal Buttons
    btnOpenPrivacyPolicy: document.getElementById('btnOpenPrivacyPolicy'),
    btnOpenPublicOffer: document.getElementById('btnOpenPublicOffer'),
    btnOpenCookieInfo: document.getElementById('btnOpenCookieInfo'),

    // Cookie Banner
    cookieBanner: document.getElementById('cookieBanner'),
    btnAcceptCookies: document.getElementById('btnAcceptCookies'),
    cookiePrivacyLink: document.getElementById('cookiePrivacyLink'),

    // Toast
    toastStack: document.getElementById('toastStack')
  };

  // 1. Initialize
  async function init() {
    try {
      const resp = await fetch('dishes.json?v=6');
      if (resp.ok) {
        catalogData = await resp.json();
      } else {
        throw new Error('fetch failed');
      }
    } catch (e) {
      catalogData = getFallbackData();
    }

    renderCompactCategories();
    renderCatalog();
    updateCartUI();
    initPromoCarousel();
    initCookieBanner();
    setupEventListeners();
  }

  // 2. Render Compact Category Chips ("позжатее и под стиль промо-панели")
  function renderCompactCategories() {
    if (!catalogData || !catalogData.categories || !el.compactCategoriesTrack) return;
    el.compactCategoriesTrack.innerHTML = '';

    // "Все меню" chip
    const allChip = document.createElement('button');
    allChip.className = 'compact-cat-chip active';
    allChip.setAttribute('data-category-id', 'all');
    allChip.innerHTML = `
      <span class="chip-icon">▦</span>
      <span class="chip-name">Все меню</span>
      <span class="chip-count">${catalogData.dishes.length}</span>
    `;
    allChip.addEventListener('click', () => filterCategory('all', allChip));
    el.compactCategoriesTrack.appendChild(allChip);

    catalogData.categories.forEach(cat => {
      const count = catalogData.dishes.filter(d => d.categoryId === cat.id).length;
      const icon = categoryIcons[cat.id] || '🌯';
      const cleanName = cat.name.replace(/^[^\wа-яА-ЯёЁ]+/, '').trim();

      const chip = document.createElement('button');
      chip.className = 'compact-cat-chip';
      chip.setAttribute('data-category-id', cat.id);
      chip.innerHTML = `
        <span class="chip-icon">${icon}</span>
        <span class="chip-name">${escapeHtml(cleanName)}</span>
        <span class="chip-count">${count}</span>
      `;
      chip.addEventListener('click', () => filterCategory(cat.id, chip));
      el.compactCategoriesTrack.appendChild(chip);
    });
  }

  function filterCategory(catId, chipElement) {
    activeCategoryId = catId;
    el.compactCategoriesTrack.querySelectorAll('.compact-cat-chip').forEach(c => c.classList.remove('active'));
    chipElement.classList.add('active');

    // Smooth horizontal scroll of chips
    const trackLeft = el.compactCategoriesTrack.getBoundingClientRect().left;
    const chipLeft = chipElement.getBoundingClientRect().left;
    el.compactCategoriesTrack.scrollBy({ left: chipLeft - trackLeft - 16, behavior: 'smooth' });

    renderCatalog();

    if (catId !== 'all') {
      const sec = document.getElementById(`cat-sec-${catId}`);
      if (sec) {
        sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  // 3. Render Catalog (Minimalist cards with real food photo slots)
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
          <span class="section-count">${dishes.length} ${getNoun(dishes.length, 'позиция', 'позиции', 'позиций')}</span>
        </div>
        <div class="dishes-cards-grid" id="grid-${cat.id}"></div>
      `;

      const grid = sec.querySelector(`#grid-${cat.id}`);
      dishes.forEach(dish => {
        grid.appendChild(createMinimalDishCard(dish));
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

  // 4. Create Minimalist Dish Card with Grey Logo Slot
  function createMinimalDishCard(dish) {
    const card = document.createElement('div');
    card.className = 'minimal-dish-card product-card';
    card.setAttribute('data-dish-id', dish.id);

    // Badges
    let badges = '';
    if (dish.popular) badges += '<span class="badge-tag hit">🔥 Хит</span>';
    if (dish.spicy === 1) badges += '<span class="badge-tag spicy">🌶️ Острое</span>';
    if (dish.spicy >= 2) badges += '<span class="badge-tag spicy">🌶️🌶️ Огонь</span>';

    card.innerHTML = `
      <div class="dish-photo-slot">
        <div class="dish-placeholder-card-logo">
          <svg width="34" height="34" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 18c0-4 14-8 24-4s12 12 12 16-10 10-22 8S6 26 6 18z"/>
            <ellipse cx="32" cy="22" rx="4" ry="7" transform="rotate(25 32 22)"/>
            <path d="M12 20c4-1 8 1 10 4"/>
            <path d="M16 26c3 0 6 2 7 4"/>
          </svg>
          <span class="dish-placeholder-caption">Фрито Буррито</span>
        </div>
        ${badges ? `<div class="dish-badges-overlay">${badges}</div>` : ''}
      </div>
      <div class="dish-card-content">
        <div>
          <h3 class="dish-title">${escapeHtml(dish.name)}</h3>
          <p class="dish-desc-brief">${escapeHtml(dish.description)}</p>
        </div>
        <div class="dish-footer-row">
          <div>
            <div class="dish-price-text">${dish.price} ₽</div>
            <div class="dish-weight-sub">${dish.weight}</div>
          </div>
          <div class="dish-action-slot" id="card-action-${dish.id}"></div>
        </div>
      </div>
    `;

    // Click on card body opens modal
    card.addEventListener('click', (e) => {
      if (e.target.closest('.card-stepper-minimal') || e.target.closest('.btn-add-minimal')) {
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
        <div class="card-stepper-minimal">
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
        <button class="btn-add-minimal" data-id="${dish.id}">
          + Добавить
        </button>
      `;
      container.querySelector('.btn-add-minimal').addEventListener('click', (e) => {
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

  // 5. Dish Details Modal (Real photo, ingredients, calories, modifiers)
  function openDishModal(dish) {
    currentModalDish = dish;
    currentSelectedModifiers = [];

    if (el.dishModalImg) {
      el.dishModalImg.src = dish.image ? `${dish.image}?v=7` : 'img/burrito-classic.jpg?v=7';
      el.dishModalImg.alt = dish.name;
    }
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
    el.dishModalBtnSum.textContent = `${total} ₽`;
  }

  function closeDishModal() {
    el.dishModalBackdrop.classList.remove('active');
    document.body.style.overflow = '';
    currentModalDish = null;
    currentSelectedModifiers = [];
  }

  // 6. Cart Management
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
        image: dish.image,
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

  // 7. Update Cart UI (Desktop & Mobile)
  function updateCartUI() {
    const count = getCartItemsCount();
    const rawTotal = getCartItemsTotal();
    const discount = getCartDiscount();
    const itemsTotalAfterDiscount = Math.max(0, rawTotal - discount);
    const deliveryCost = getDeliveryCost(rawTotal);
    const finalTotal = itemsTotalAfterDiscount + deliveryCost;
    const threshold = catalogData?.restaurant?.freeDeliveryThreshold || 800;

    // Mobile bottom nav badge
    if (el.mNavCartBadge) {
      if (count > 0) {
        el.mNavCartBadge.textContent = count;
        el.mNavCartBadge.style.display = 'inline-block';
      } else {
        el.mNavCartBadge.style.display = 'none';
      }
    }

    if (el.mobileHeaderCartBadge) {
      if (count > 0) {
        el.mobileHeaderCartBadge.textContent = count;
        el.mobileHeaderCartBadge.style.display = 'inline-block';
      } else {
        el.mobileHeaderCartBadge.style.display = 'none';
      }
    }

    // Mobile bottom bar
    if (count > 0) {
      el.mobileBottomBar.classList.add('visible');
      el.mobileCartCountTag.textContent = `${count}`;
      el.mobileCartTotalSum.textContent = `${finalTotal} ₽`;
    } else {
      el.mobileBottomBar.classList.remove('visible');
    }

    el.mobileSheetCount.textContent = `${count} ${getNoun(count, 'позиция', 'позиции', 'позиций')}`;
    if (el.checkoutSumDisplay) {
      el.checkoutSumDisplay.textContent = `${finalTotal} ₽`;
    }

    // Desktop Cart Sidebar
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

      // Render cart items
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

    syncMobileDrawer();
  }

  function renderCartItemsMarkup() {
    el.cartItemsList.innerHTML = '';

    cart.forEach(item => {
      const row = document.createElement('div');
      row.className = 'cart-item-row';

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
        <div class="cart-item-row">
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
        <span style="color:var(--k-green);">Скидка по акции:</span>
        <span style="color:var(--k-green);">-${discount} ₽</span>
      </div>` : ''}
      <div class="calc-row">
        <span>Доставка:</span>
        <span>${getDeliveryCost(rawTotal) === 0 ? 'Бесплатно' : getDeliveryCost(rawTotal) + ' ₽'}</span>
      </div>
      <div class="calc-row total" style="margin: 10px 0 14px;">
        <span>Итого:</span>
        <span style="color:var(--k-green);">${finalTotal} ₽</span>
      </div>

      <button class="btn-checkout-primary" id="btnMobileDrawerProceedCheckout">
        <span>Оформить заказ</span>
        <span>${finalTotal} ₽</span>
      </button>
    `;

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
  }

  // 8. Mobile Drawer
  function openMobileCartSheet() {
    el.mobileCartBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileCartSheet() {
    el.mobileCartBackdrop.classList.remove('active');
    document.body.style.overflow = '';
  }

  // 9. Promo Carousel Controls
  function initPromoCarousel() {
    const slides = document.querySelectorAll('.promo-banner-slide');
    const dots = document.querySelectorAll('.carousel-dots .dot');
    if (slides.length === 0) return;

    function goToSlide(idx) {
      currentPromoSlide = (idx + slides.length) % slides.length;
      el.promoCarouselTrack.style.transform = `translateX(-${currentPromoSlide * 100}%)`;
      dots.forEach((d, i) => {
        d.classList.toggle('active', i === currentPromoSlide);
      });
    }

    el.btnPromoPrev.addEventListener('click', () => goToSlide(currentPromoSlide - 1));
    el.btnPromoNext.addEventListener('click', () => goToSlide(currentPromoSlide + 1));

    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => goToSlide(idx));
    });

    // Auto rotate every 6s
    promoInterval = setInterval(() => {
      goToSlide(currentPromoSlide + 1);
    }, 6000);
  }

  // 10. Promo Code Application
  function applyPromoCode(code) {
    const cleanCode = code.trim().toUpperCase();

    if (cleanCode === 'ФРИТО15') {
      activePromoCode = 'ФРИТО15';
      promoDiscountPct = 0.15;
      updateCartUI();
      showToast('🎉 Промокод ФРИТО15 активирован! Скидка 15% на заказы от 1 000 ₽');
    } else if (cleanCode === 'САМОВЫВОЗ') {
      deliveryType = 'pickup';
      el.cartModePickup.classList.add('active');
      el.cartModeDelivery.classList.remove('active');
      updateCartUI();
      showToast('🏪 Выбран самовывоз: скидка 10% на весь заказ!');
    } else if (cleanCode === 'ДОСТАВКА') {
      deliveryType = 'delivery';
      el.cartModeDelivery.classList.add('active');
      el.cartModePickup.classList.remove('active');
      updateCartUI();
      showToast('🛵 Выбрана доставка курьером (бесплатно от 800 ₽)');
    } else {
      showToast('Неверный промокод');
    }
  }

  // 11. Checkout Flow
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
    selectedPaymentMethod = 'online';
    if (el.payMethodOnline) el.payMethodOnline.classList.add('selected');
  }

  function submitOrderForm(e) {
    e.preventDefault();
    const phone = el.orderInputPhone.value.trim();
    if (!phone || phone.length < 10) {
      showToast('Пожалуйста, введите контактный телефон');
      el.orderInputPhone.focus();
      return;
    }

    const rawTotal = getCartItemsTotal();
    const discount = getCartDiscount();
    const finalTotal = Math.max(0, rawTotal - discount) + getDeliveryCost(rawTotal);

    closeCheckoutModal();
    openOnlinePaymentSimulator(finalTotal);
  }

  // 12. Payment Simulator
  function openOnlinePaymentSimulator(sum) {
    el.simAmountDisplay.textContent = `${sum} ₽`;
    el.simPayBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeOnlinePaymentSimulator() {
    el.simPayBackdrop.classList.remove('active');
    document.body.style.overflow = '';
  }

  // 13. Order Finalize & Live Tracker
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
    }, 2400);
  }

  // 16. Cookie Banner
  function initCookieBanner() {
    const accepted = localStorage.getItem('fb_cookie_accepted');
    if (!accepted && el.cookieBanner) {
      el.cookieBanner.style.display = 'block';
    } else if (el.cookieBanner) {
      el.cookieBanner.style.display = 'none';
    }
  }

  // 17. Setup Event Listeners (Every button is fully functional!)
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

    // Promo panel buttons
    el.btnApplyPromo15.addEventListener('click', () => applyPromoCode('ФРИТО15'));
    el.ticketCode15.addEventListener('click', () => {
      navigator.clipboard?.writeText('ФРИТО15');
      applyPromoCode('ФРИТО15');
    });

    if (el.btnActivatePickupPromo) {
      el.btnActivatePickupPromo.addEventListener('click', () => {
        deliveryType = 'pickup';
        el.cartModePickup.classList.add('active');
        el.cartModeDelivery.classList.remove('active');
        updateCartUI();
        showToast('Выбран самовывоз на ул. Петра Метальникова, 3/1А');
      });
    }
    if (el.ticketCodePickup) {
      el.ticketCodePickup.addEventListener('click', () => applyPromoCode('САМОВЫВОЗ'));
    }

    if (el.btnGoToCombos) {
      el.btnGoToCombos.addEventListener('click', () => applyPromoCode('ДОСТАВКА'));
    }
    if (el.ticketCodeFree) {
      el.ticketCodeFree.addEventListener('click', () => applyPromoCode('ДОСТАВКА'));
    }

    // Cart Mode Tabs
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
      showToast('Выбран самовывоз: ул. Петра Метальникова, 3/1А');
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
    el.btnCloseCheckoutModal.addEventListener('click', closeCheckoutModal);
    el.checkoutModalBackdrop.addEventListener('click', (e) => {
      if (e.target === el.checkoutModalBackdrop) closeCheckoutModal();
    });

    if (el.payMethodOnline) {
      el.payMethodOnline.addEventListener('click', () => handlePaymentSelect('online'));
    }
    el.checkoutForm.addEventListener('submit', submitOrderForm);

    // Mobile Bottom Navigation Bar (Меню, Поиск, Акции, Корзина, Профиль)
    function setMobileNavActive(tab) {
      document.querySelectorAll('.mobile-nav-item').forEach(b => {
        b.classList.toggle('active', b.dataset.tab === tab);
      });
    }

    if (el.mNavMenu) {
      el.mNavMenu.addEventListener('click', () => {
        setMobileNavActive('menu');
        const target = el.compactCategoriesTrack || el.catalogSectionsWrap;
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    if (el.mNavSearch) {
      el.mNavSearch.addEventListener('click', () => {
        setMobileNavActive('search');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          if (el.searchInput) {
            el.searchInput.focus();
            showToast('Поиск по меню');
          }
        }, 150);
      });
    }

    if (el.mNavPromo) {
      el.mNavPromo.addEventListener('click', () => {
        setMobileNavActive('promo');
        el.promoCodesBackdrop.classList.add('active');
        document.body.style.overflow = 'hidden';
      });
    }

    if (el.mNavCart) {
      el.mNavCart.addEventListener('click', () => {
        setMobileNavActive('cart');
        openMobileCartSheet();
      });
    }

    if (el.mNavProfile) {
      el.mNavProfile.addEventListener('click', () => {
        setMobileNavActive('profile');
        el.profileBackdrop.classList.add('active');
        document.body.style.overflow = 'hidden';
      });
    }

    // Mobile drawer trigger
    el.btnOpenMobileDrawer.addEventListener('click', () => {
      setMobileNavActive('cart');
      openMobileCartSheet();
    });
    el.btnCloseMobileCart.addEventListener('click', () => {
      setMobileNavActive('menu');
      closeMobileCartSheet();
    });
    el.mobileCartBackdrop.addEventListener('click', (e) => {
      if (e.target === el.mobileCartBackdrop) {
        setMobileNavActive('menu');
        closeMobileCartSheet();
      }
    });

    // Payment Simulator
    el.btnSimPaySuccess.addEventListener('click', () => {
      finalizeOrder(getCartItemsTotal() + getDeliveryCost(getCartItemsTotal()), 'Оплачено онлайн / СБП');
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
    el.topAboutBtn.addEventListener('click', () => {
      el.aboutBackdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
    el.btnCloseAboutModal.addEventListener('click', () => {
      el.aboutBackdrop.classList.remove('active');
      document.body.style.overflow = '';
    });

    // Promo Codes Modal (%)
    el.btnHeaderPromo.addEventListener('click', () => {
      el.promoCodesBackdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
    el.btnClosePromoCodesModal.addEventListener('click', () => {
      el.promoCodesBackdrop.classList.remove('active');
      document.body.style.overflow = '';
    });
    el.promoCodesBackdrop.querySelectorAll('.btn-apply-code').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-code');
        applyPromoCode(code);
        el.promoCodesBackdrop.classList.remove('active');
        document.body.style.overflow = '';
      });
    });

    // Profile Modal ("Войти")
    el.btnHeaderProfile.addEventListener('click', () => {
      el.profileBackdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
    el.btnCloseProfileModal.addEventListener('click', () => {
      el.profileBackdrop.classList.remove('active');
      document.body.style.overflow = '';
    });
    el.btnSendAuthCode.addEventListener('click', () => {
      const p = el.authPhoneInput.value.trim();
      if (p.length >= 10) {
        el.profileLoggedOutView.style.display = 'none';
        el.profileLoggedInView.style.display = 'block';
        el.profileUserPhone.textContent = p;
        el.userProfileLabel.textContent = 'Иван (500 б)';
        showToast('Вход выполнен! Баланс: 500 бонусов');
      } else {
        showToast('Введите номер телефона');
      }
    });
    el.btnLogoutProfile.addEventListener('click', () => {
      el.profileLoggedOutView.style.display = 'block';
      el.profileLoggedInView.style.display = 'none';
      el.userProfileLabel.textContent = 'Войти';
      showToast('Вы вышли из профиля');
    });

    // Bonuses Modal
    el.btnHeaderBonuses.addEventListener('click', () => {
      el.bonusesBackdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
    el.btnCloseBonusesModal.addEventListener('click', () => {
      el.bonusesBackdrop.classList.remove('active');
      document.body.style.overflow = '';
    });
    el.btnCloseBonusesAction.addEventListener('click', () => {
      el.bonusesBackdrop.classList.remove('active');
      document.body.style.overflow = '';
    });

    // Legal Modals
    function openPrivacyModal() {
      el.legalPrivacyBackdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    function closePrivacyModal() {
      el.legalPrivacyBackdrop.classList.remove('active');
      document.body.style.overflow = '';
    }
    function openOfferModal() {
      el.legalOfferBackdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    function closeOfferModal() {
      el.legalOfferBackdrop.classList.remove('active');
      document.body.style.overflow = '';
    }

    el.btnOpenPrivacyPolicy.addEventListener('click', openPrivacyModal);
    el.btnClosePrivacyModal.addEventListener('click', closePrivacyModal);
    el.btnAcceptPrivacyModal.addEventListener('click', closePrivacyModal);
    el.linkConsentPrivacy.addEventListener('click', (e) => {
      e.preventDefault();
      openPrivacyModal();
    });
    el.cookiePrivacyLink.addEventListener('click', (e) => {
      e.preventDefault();
      openPrivacyModal();
    });

    el.btnOpenPublicOffer.addEventListener('click', openOfferModal);
    el.btnCloseOfferModal.addEventListener('click', closeOfferModal);
    el.btnAcceptOfferModal.addEventListener('click', closeOfferModal);
    el.linkConsentOffer.addEventListener('click', (e) => {
      e.preventDefault();
      openOfferModal();
    });

    el.btnOpenCookieInfo.addEventListener('click', () => {
      showToast('Файлы cookie используются для работы корзины и авторизации (152-ФЗ)');
    });

    // Cookie Banner Accept
    el.btnAcceptCookies.addEventListener('click', () => {
      localStorage.setItem('fb_cookie_accepted', 'true');
      el.cookieBanner.style.opacity = '0';
      setTimeout(() => {
        el.cookieBanner.style.display = 'none';
      }, 250);
      showToast('Настройки cookie сохранены');
    });

    // Phone masking
    [el.orderInputPhone, el.authPhoneInput].forEach(inp => {
      if (!inp) return;
      inp.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '');
        if (v.startsWith('7') || v.startsWith('8')) v = v.substring(1);
        let f = '+7 (';
        if (v.length > 0) f += v.substring(0, 3);
        if (v.length >= 3) f += ') ' + v.substring(3, 6);
        if (v.length >= 6) f += '-' + v.substring(6, 8);
        if (v.length >= 8) f += '-' + v.substring(8, 10);
        e.target.value = f;
      });
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
        el.promoCodesBackdrop.classList.remove('active');
        el.profileBackdrop.classList.remove('active');
        el.bonusesBackdrop.classList.remove('active');
        el.legalPrivacyBackdrop.classList.remove('active');
        el.legalOfferBackdrop.classList.remove('active');
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
        name: "Фрито Буррито",
        cuisine: "Мексиканская кухня",
        rating: "5.0",
        reviewsCount: 62,
        deliveryTime: "25–35 мин",
        minOrder: 400,
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
          image: "img/burrito-classic.jpg",
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
          image: "img/burrito-juanita.jpg",
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
          image: "img/burrito-diablo.jpg",
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
          image: "img/tacos-box.jpg",
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
          image: "img/fries-crispy.jpg",
          description: "Золотистые хрустящие брусочки картофеля фри с легкой морской солью и паприкой."
        }
      ]
    };
  }

  document.addEventListener('DOMContentLoaded', init);
})();
