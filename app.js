/**
 * FRITO BURRITO — Bespoke Restaurant Web Application
 * Zero-lag, 100% responsive, real photography, dynamic cart drawer, checkout & tracker
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

  // Cart: Array of { id, dishId, name, price, basePrice, weight, image, modifiers, quantity }
  let cart = [];

  // Current modal state
  let currentModalDish = null;
  let currentSelectedModifiers = [];

  // DOM Elements cache
  const el = {
    tabsTrack: document.getElementById('tabsTrack'),
    catalogContainer: document.getElementById('catalogContainer'),
    searchInput: document.getElementById('searchInput'),
    searchClearBtn: document.getElementById('searchClearBtn'),
    
    // Header
    headerAddressBtn: document.getElementById('headerAddressBtn'),
    currentAddressDisplay: document.getElementById('currentAddressDisplay'),
    headerCartBtn: document.getElementById('headerCartBtn'),
    headerCartBadge: document.getElementById('headerCartBadge'),
    headerCartSum: document.getElementById('headerCartSum'),
    
    // Drawer Cart
    cartDrawerBackdrop: document.getElementById('cartDrawerBackdrop'),
    cartDrawer: document.getElementById('cartDrawer'),
    drawerCloseBtn: document.getElementById('drawerCloseBtn'),
    drawerItemsCount: document.getElementById('drawerItemsCount'),
    deliveryBarBox: document.getElementById('deliveryBarBox'),
    deliveryBarText: document.getElementById('deliveryBarText'),
    deliveryFill: document.getElementById('deliveryFill'),
    modeBtnDelivery: document.getElementById('modeBtnDelivery'),
    modeBtnPickup: document.getElementById('modeBtnPickup'),
    drawerItemsList: document.getElementById('drawerItemsList'),
    drawerEmptyNotice: document.getElementById('drawerEmptyNotice'),
    cutlerySection: document.getElementById('cutlerySection'),
    btnCutleryDec: document.getElementById('btnCutleryDec'),
    btnCutleryInc: document.getElementById('btnCutleryInc'),
    cutleryCount: document.getElementById('cutleryCount'),
    drawerFooter: document.getElementById('drawerFooter'),
    summaryItemsTotal: document.getElementById('summaryItemsTotal'),
    summaryDeliveryRow: document.getElementById('summaryDeliveryRow'),
    summaryDeliveryCost: document.getElementById('summaryDeliveryCost'),
    summaryFinalTotal: document.getElementById('summaryFinalTotal'),
    btnOpenCheckoutModal: document.getElementById('btnOpenCheckoutModal'),
    checkoutBtnSum: document.getElementById('checkoutBtnSum'),
    btnQuickWhatsAppOrder: document.getElementById('btnQuickWhatsAppOrder'),
    
    // Mobile Floating Cart
    mobileFloatCart: document.getElementById('mobileFloatCart'),
    mCartBadge: document.getElementById('mCartBadge'),
    mCartSum: document.getElementById('mCartSum'),
    
    // Dish Modal
    dishModalBackdrop: document.getElementById('dishModalBackdrop'),
    dishModalClose: document.getElementById('dishModalClose'),
    dishModalImg: document.getElementById('dishModalImg'),
    dishModalTitle: document.getElementById('dishModalTitle'),
    dishModalPrice: document.getElementById('dishModalPrice'),
    dishModalMeta: document.getElementById('dishModalMeta'),
    dishModalDesc: document.getElementById('dishModalDesc'),
    dishModifiersSection: document.getElementById('dishModifiersSection'),
    dishModalModifiersList: document.getElementById('dishModalModifiersList'),
    dishModalAddBtn: document.getElementById('dishModalAddBtn'),
    
    // Checkout Modal
    checkoutModalBackdrop: document.getElementById('checkoutModalBackdrop'),
    checkoutModalClose: document.getElementById('checkoutModalClose'),
    checkoutFinalTotalDisplay: document.getElementById('checkoutFinalTotalDisplay'),
    orderForm: document.getElementById('orderForm'),
    orderNameInput: document.getElementById('orderNameInput'),
    orderPhoneInput: document.getElementById('orderPhoneInput'),
    orderAddressInput: document.getElementById('orderAddressInput'),
    deliveryAddressGroup: document.getElementById('deliveryAddressGroup'),
    pickupNoticeGroup: document.getElementById('pickupNoticeGroup'),
    pmCash: document.getElementById('pmCash'),
    pmOnline: document.getElementById('pmOnline'),
    
    // Payment Simulator
    paymentSimBackdrop: document.getElementById('paymentSimBackdrop'),
    simSumDisplay: document.getElementById('simSumDisplay'),
    btnSimPaySuccess: document.getElementById('btnSimPaySuccess'),
    btnSimFallbackCash: document.getElementById('btnSimFallbackCash'),
    btnSimCancel: document.getElementById('btnSimCancel'),
    
    // Tracker
    trackerModalBackdrop: document.getElementById('trackerModalBackdrop'),
    trackerModalClose: document.getElementById('trackerModalClose'),
    trackerOrderNumber: document.getElementById('trackerOrderNumber'),
    trackerItemsList: document.getElementById('trackerItemsList'),
    trackerTotalCost: document.getElementById('trackerTotalCost'),
    trackerDeliveryDest: document.getElementById('trackerDeliveryDest'),
    tStep1: document.getElementById('tStep1'),
    tStep2: document.getElementById('tStep2'),
    tStep3: document.getElementById('tStep3'),
    btnTrackerDone: document.getElementById('btnTrackerDone'),
    
    // Address Edit
    addressModalBackdrop: document.getElementById('addressModalBackdrop'),
    addressModalClose: document.getElementById('addressModalClose'),
    addressEditInput: document.getElementById('addressEditInput'),
    btnSaveAddress: document.getElementById('btnSaveAddress'),
    
    // Toast Stack
    toastStack: document.getElementById('toastStack')
  };

  // 1. Initialize
  async function init() {
    try {
      const resp = await fetch('dishes.json?v=3');
      if (resp.ok) {
        catalogData = await resp.json();
      } else {
        throw new Error('fetch failed');
      }
    } catch (err) {
      catalogData = getFallbackData();
    }

    renderCategoryTabs();
    renderCatalog();
    updateCartUI();
    setupEventListeners();
  }

  // 2. Render Tabs
  function renderCategoryTabs() {
    if (!catalogData || !catalogData.categories) return;

    el.tabsTrack.innerHTML = '';
    
    // "All" tab
    const allBtn = document.createElement('button');
    allBtn.className = 'cat-pill active';
    allBtn.textContent = '🔥 Все меню';
    allBtn.addEventListener('click', () => {
      filterCategory('all', allBtn);
    });
    el.tabsTrack.appendChild(allBtn);

    catalogData.categories.forEach(cat => {
      const count = catalogData.dishes.filter(d => d.categoryId === cat.id).length;
      const btn = document.createElement('button');
      btn.className = 'cat-pill';
      btn.textContent = `${cat.name} (${count})`;
      btn.addEventListener('click', () => {
        filterCategory(cat.id, btn);
      });
      el.tabsTrack.appendChild(btn);
    });
  }

  function filterCategory(catId, btnElement) {
    activeCategoryId = catId;
    el.tabsTrack.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');

    // Smooth horizontal scroll of tabs
    const trackLeft = el.tabsTrack.getBoundingClientRect().left;
    const btnLeft = btnElement.getBoundingClientRect().left;
    el.tabsTrack.scrollBy({ left: btnLeft - trackLeft - 16, behavior: 'smooth' });

    renderCatalog();
  }

  // 3. Render Catalog
  function renderCatalog() {
    if (!catalogData) return;
    el.catalogContainer.innerHTML = '';
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
      sec.className = 'catalog-section-block';
      sec.id = `cat-${cat.id}`;

      const titleWrap = document.createElement('div');
      titleWrap.className = 'section-title-wrap';
      titleWrap.innerHTML = `
        <h2 class="sec-title">${cat.name}</h2>
        <span class="sec-count">${dishes.length} ${getNoun(dishes.length, 'блюдо', 'блюда', 'блюд')}</span>
      `;
      sec.appendChild(titleWrap);

      const grid = document.createElement('div');
      grid.className = 'cards-grid';

      dishes.forEach(dish => {
        const card = createProductCard(dish);
        grid.appendChild(card);
      });

      sec.appendChild(grid);
      el.catalogContainer.appendChild(sec);
    });

    if (totalDishesRendered === 0 && q) {
      el.catalogContainer.innerHTML = `
        <div style="padding: 60px 20px; text-align: center; color: var(--c-muted);">
          <div style="font-size: 48px; margin-bottom: 12px;">🔍</div>
          <h3 style="font-size: 20px; font-weight: 800; color: var(--c-dark);">Ничего не нашлось</h3>
          <p style="font-size: 14px; margin-top: 6px;">Попробуйте поискать «буррито», «тако», «сыр» или «фри»</p>
        </div>
      `;
    }
  }

  // 4. Product Card
  function createProductCard(dish) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('data-dish-id', dish.id);

    // Badges
    let badges = '';
    if (dish.spicy === 1) badges += '<span class="c-badge spicy">🌶️ Острое</span>';
    if (dish.spicy >= 2) badges += '<span class="c-badge spicy">🌶️🌶️ Огонь</span>';
    if (dish.popular) badges += '<span class="c-badge hit">🔥 Хит</span>';

    card.innerHTML = `
      <div class="card-img-holder">
        <img src="${dish.image}?v=3" alt="${escapeHtml(dish.name)}" loading="lazy" onerror="this.src='img/burrito-classic.jpg?v=3'" />
        <div class="card-badges-stack">${badges}</div>
      </div>
      <div class="card-info">
        <div class="card-price-row">
          <span class="card-price">${dish.price} ₽</span>
          <span class="card-weight">${dish.weight}</span>
        </div>
        <h3 class="card-name">${escapeHtml(dish.name)}</h3>
        <p class="card-desc">${escapeHtml(dish.description)}</p>
        <div class="card-action-bar" id="card-action-${dish.id}"></div>
      </div>
    `;

    // Click on card body opens modal (unless clicking stepper buttons)
    card.addEventListener('click', (e) => {
      if (e.target.closest('.card-stepper-box') || e.target.closest('.btn-card-add')) {
        return;
      }
      openDishModal(dish);
    });

    const actionContainer = card.querySelector(`#card-action-${dish.id}`);
    renderCardAction(actionContainer, dish);

    return card;
  }

  function renderCardAction(container, dish) {
    const count = getDishTotalCountInCart(dish.id);
    if (count > 0) {
      container.innerHTML = `
        <div class="card-stepper-box">
          <button class="c-dec" data-id="${dish.id}">−</button>
          <span>${count}</span>
          <button class="c-inc" data-id="${dish.id}">+</button>
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
        <button class="btn-card-add" data-id="${dish.id}">
          <span>+ В корзину • ${dish.price} ₽</span>
        </button>
      `;
      container.querySelector('.btn-card-add').addEventListener('click', (e) => {
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

    el.dishModalImg.src = `${dish.image}?v=3`;
    el.dishModalTitle.textContent = dish.name;
    el.dishModalPrice.textContent = `${dish.price} ₽`;
    el.dishModalMeta.innerHTML = `
      <span>⚖️ ${dish.weight}</span>
      <span>•</span>
      <span>🔥 ${dish.calories || '520 ккал'}</span>
      ${dish.spicy > 0 ? `<span>•</span> <span style="color:#E53935; font-weight:800;">🌶️ ${dish.spicy === 1 ? 'Острое' : 'Очень острое'}</span>` : ''}
    `;
    el.dishModalDesc.textContent = dish.description;

    el.dishModalModifiersList.innerHTML = '';
    if (dish.modifiers && dish.modifiers.length > 0) {
      el.dishModifiersSection.style.display = 'block';
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
          updateModalButtonPrice();
        });
        el.dishModalModifiersList.appendChild(row);
      });
    } else {
      el.dishModifiersSection.style.display = 'none';
    }

    updateModalButtonPrice();
    el.dishModalBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function updateModalButtonPrice() {
    if (!currentModalDish) return;
    const modsSum = currentSelectedModifiers.reduce((acc, m) => acc + (m.price || 0), 0);
    const total = currentModalDish.price + modsSum;
    el.dishModalAddBtn.textContent = `Добавить в корзину • ${total} ₽`;
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
    let sum = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    if (deliveryType === 'pickup') {
      // 10% discount on pickup!
      sum = Math.round(sum * 0.9);
    }
    return sum;
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

  function updateCartUI() {
    const count = getCartItemsCount();
    const itemsTotal = getCartItemsTotal();
    const deliveryCost = getDeliveryCost(itemsTotal);
    const finalTotal = itemsTotal + deliveryCost;
    const threshold = catalogData?.restaurant?.freeDeliveryThreshold || 800;

    // Header Trigger
    if (count > 0) {
      el.headerCartBadge.textContent = count;
      el.headerCartBadge.style.display = 'inline-block';
      el.headerCartSum.textContent = `${finalTotal} ₽`;
    } else {
      el.headerCartBadge.style.display = 'none';
      el.headerCartSum.textContent = 'Корзина';
    }

    // Mobile Float Bar
    if (count > 0) {
      el.mobileFloatCart.style.display = 'flex';
      el.mCartBadge.textContent = count;
      el.mCartSum.textContent = `${finalTotal} ₽`;
    } else {
      el.mobileFloatCart.style.display = 'none';
    }

    // Drawer Cart
    el.drawerItemsCount.textContent = `${count} ${getNoun(count, 'позиция', 'позиции', 'позиций')}`;

    if (count === 0) {
      el.drawerEmptyNotice.style.display = 'flex';
      el.cutlerySection.style.display = 'none';
      el.drawerFooter.style.display = 'none';
      el.deliveryBarBox.style.display = 'none';
      el.drawerItemsList.querySelectorAll('.drawer-item').forEach(e => e.remove());
    } else {
      el.drawerEmptyNotice.style.display = 'none';
      el.cutlerySection.style.display = 'flex';
      el.drawerFooter.style.display = 'block';

      // Free delivery progress
      if (deliveryType === 'delivery') {
        el.deliveryBarBox.style.display = 'block';
        if (itemsTotal >= threshold) {
          el.deliveryBarText.innerHTML = `🎉 <b>Бесплатная доставка!</b>`;
          el.deliveryFill.style.width = '100%';
        } else {
          const diff = threshold - itemsTotal;
          const pct = Math.min(100, Math.round((itemsTotal / threshold) * 100));
          el.deliveryBarText.innerHTML = `До бесплатной доставки: <b>${diff} ₽</b>`;
          el.deliveryFill.style.width = `${pct}%`;
        }
      } else {
        el.deliveryBarBox.style.display = 'none';
      }

      // Render Items
      el.drawerItemsList.querySelectorAll('.drawer-item').forEach(e => e.remove());
      cart.forEach(item => {
        const row = document.createElement('div');
        row.className = 'drawer-item';
        
        let modsStr = '';
        if (item.modifiers && item.modifiers.length > 0) {
          modsStr = item.modifiers.map(m => `+ ${m.name}`).join(', ');
        }

        row.innerHTML = `
          <img src="${item.image}?v=3" alt="" class="drawer-item-img" onerror="this.src='img/burrito-classic.jpg?v=3'" />
          <div class="drawer-item-info">
            <div class="d-item-title">${escapeHtml(item.name)}</div>
            ${modsStr ? `<div class="d-item-mods">${escapeHtml(modsStr)}</div>` : ''}
            <div class="d-item-price">${item.price * item.quantity} ₽</div>
          </div>
          <div class="drawer-stepper">
            <button class="d-dec">−</button>
            <span>${item.quantity}</span>
            <button class="d-inc">+</button>
          </div>
        `;

        row.querySelector('.d-dec').addEventListener('click', () => {
          if (item.quantity > 1) {
            item.quantity -= 1;
          } else {
            cart = cart.filter(i => i.id !== item.id);
          }
          updateCartUI();
          updateAllCardsUI();
        });

        row.querySelector('.d-inc').addEventListener('click', () => {
          item.quantity += 1;
          updateCartUI();
          updateAllCardsUI();
        });

        el.drawerItemsList.appendChild(row);
      });

      // Footer summary
      el.summaryItemsTotal.textContent = `${itemsTotal} ₽`;
      if (deliveryType === 'pickup') {
        el.summaryDeliveryCost.textContent = 'Самовывоз 0 ₽';
        el.summaryDeliveryCost.style.color = 'var(--c-green)';
      } else {
        if (deliveryCost === 0) {
          el.summaryDeliveryCost.textContent = 'Бесплатно';
          el.summaryDeliveryCost.style.color = 'var(--c-green)';
        } else {
          el.summaryDeliveryCost.textContent = `${deliveryCost} ₽`;
          el.summaryDeliveryCost.style.color = 'var(--c-dark)';
        }
      }

      el.summaryFinalTotal.textContent = `${finalTotal} ₽`;
      el.checkoutBtnSum.textContent = `${finalTotal} ₽`;
    }
  }

  // 7. Drawer Toggle
  function openCartDrawer() {
    el.cartDrawerBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeCartDrawer() {
    el.cartDrawerBackdrop.classList.remove('active');
    document.body.style.overflow = '';
  }

  // 8. Checkout Modal Flow
  function openCheckoutModal() {
    closeCartDrawer();
    const count = getCartItemsCount();
    if (count === 0) {
      showToast('Ваша корзина пуста');
      return;
    }

    const finalTotal = getCartItemsTotal() + getDeliveryCost(getCartItemsTotal());
    el.checkoutFinalTotalDisplay.textContent = `${finalTotal} ₽`;

    if (deliveryType === 'pickup') {
      el.deliveryAddressGroup.style.display = 'none';
      el.pickupNoticeGroup.style.display = 'block';
    } else {
      el.deliveryAddressGroup.style.display = 'block';
      el.pickupNoticeGroup.style.display = 'none';
    }

    el.checkoutModalBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeCheckoutModal() {
    el.checkoutModalBackdrop.classList.remove('active');
    document.body.style.overflow = '';
  }

  function handlePaymentSelection(method) {
    selectedPaymentMethod = method;
    if (method === 'cash') {
      el.pmCash.classList.add('selected');
      el.pmOnline.classList.remove('selected');
    } else {
      el.pmOnline.classList.add('selected');
      el.pmCash.classList.remove('selected');
    }
  }

  function formatOrderWhatsAppText() {
    const itemsTotal = getCartItemsTotal();
    const deliveryCost = getDeliveryCost(itemsTotal);
    const finalTotal = itemsTotal + deliveryCost;

    let text = `🌯 *Заказ в Frito Burrito (Краснодар)*:\n\n`;
    cart.forEach(item => {
      let mods = item.modifiers.length > 0 ? ` (${item.modifiers.map(m => m.name).join(', ')})` : '';
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
    text += `💳 Оплата: ${selectedPaymentMethod === 'cash' ? 'При получении' : 'Онлайн'}\n`;
    text += `💰 *ИТОГО: ${finalTotal} ₽*`;

    return text;
  }

  function sendWhatsAppOrder() {
    const count = getCartItemsCount();
    if (count === 0) {
      showToast('Добавьте блюда в корзину');
      return;
    }
    const orderText = formatOrderWhatsAppText();
    const phone = '79996505576';
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(orderText)}`;
    window.open(waUrl, '_blank');
    showToast('Переходим в WhatsApp для заказа...');
  }

  // Submit Order
  function submitOrder(e) {
    e.preventDefault();
    const phone = el.orderPhoneInput.value.trim();
    if (!phone || phone.length < 10) {
      showToast('Пожалуйста, укажите контактный телефон');
      el.orderPhoneInput.focus();
      return;
    }

    const itemsTotal = getCartItemsTotal();
    const deliveryCost = getDeliveryCost(itemsTotal);
    const finalTotal = itemsTotal + deliveryCost;

    closeCheckoutModal();

    if (selectedPaymentMethod === 'online') {
      openOnlinePaymentSimulator(finalTotal);
    } else {
      finalizeOrder(finalTotal, 'При получении (наличные/терминал)');
    }
  }

  // Safe Payment Simulator
  function openOnlinePaymentSimulator(sum) {
    el.simSumDisplay.textContent = `${sum} ₽`;
    el.paymentSimBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeOnlinePaymentSimulator() {
    el.paymentSimBackdrop.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Order Finalize & Live Tracker
  function finalizeOrder(finalTotal, paymentDesc) {
    closeOnlinePaymentSimulator();
    closeCheckoutModal();

    const orderNum = `FB-${Math.floor(1000 + Math.random() * 9000)}`;
    el.trackerOrderNumber.textContent = `Заказ #${orderNum}`;
    el.trackerTotalCost.textContent = `${finalTotal} ₽ • ${paymentDesc}`;
    el.trackerDeliveryDest.textContent = deliveryType === 'delivery' ? userAddress : 'Самовывоз: ул. Петра Метальникова, 3/1А';

    el.trackerItemsList.innerHTML = cart.map(i => 
      `<div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:13px;">
        <span>${escapeHtml(i.name)} × ${i.quantity}</span>
        <strong style="color:var(--c-flame);">${i.price * i.quantity} ₽</strong>
      </div>`
    ).join('');

    // Clear cart
    cart = [];
    updateCartUI();
    updateAllCardsUI();

    // Show Tracker
    el.trackerModalBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';

    runTrackerSimulation();
  }

  function runTrackerSimulation() {
    if (activeOrderSimulation) clearInterval(activeOrderSimulation);

    el.tStep1.className = 't-step active';
    el.tStep2.className = 't-step';
    el.tStep3.className = 't-step';

    let sec = 0;
    activeOrderSimulation = setInterval(() => {
      sec += 3;
      if (sec === 3) {
        el.tStep1.className = 't-step completed';
        el.tStep2.className = 't-step active';
      } else if (sec === 6) {
        el.tStep2.className = 't-step completed';
        el.tStep3.className = 't-step active';
        clearInterval(activeOrderSimulation);
      }
    }, 2500);
  }

  function closeTracker() {
    el.trackerModalBackdrop.classList.remove('active');
    document.body.style.overflow = '';
    if (activeOrderSimulation) clearInterval(activeOrderSimulation);
  }

  // 9. Toast Helper
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

  // 10. Wire Events
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

    // Cart open
    el.headerCartBtn.addEventListener('click', openCartDrawer);
    el.mobileFloatCart.addEventListener('click', openCartDrawer);
    el.drawerCloseBtn.addEventListener('click', closeCartDrawer);
    el.cartDrawerBackdrop.addEventListener('click', (e) => {
      if (e.target === el.cartDrawerBackdrop) closeCartDrawer();
    });

    // Delivery mode toggle
    el.modeBtnDelivery.addEventListener('click', () => {
      deliveryType = 'delivery';
      el.modeBtnDelivery.classList.add('active');
      el.modeBtnPickup.classList.remove('active');
      updateCartUI();
      showToast('Выбрана доставка курьером');
    });

    el.modeBtnPickup.addEventListener('click', () => {
      deliveryType = 'pickup';
      el.modeBtnPickup.classList.add('active');
      el.modeBtnDelivery.classList.remove('active');
      updateCartUI();
      showToast('Выбран самовывоз: скидка -10%!');
    });

    // Cutlery
    el.btnCutleryDec.addEventListener('click', () => {
      if (cutleryCount > 0) {
        cutleryCount -= 1;
        el.cutleryCount.textContent = cutleryCount;
      }
    });

    el.btnCutleryInc.addEventListener('click', () => {
      cutleryCount += 1;
      el.cutleryCount.textContent = cutleryCount;
    });

    // Checkout
    el.btnOpenCheckoutModal.addEventListener('click', openCheckoutModal);
    el.checkoutModalClose.addEventListener('click', closeCheckoutModal);
    el.checkoutModalBackdrop.addEventListener('click', (e) => {
      if (e.target === el.checkoutModalBackdrop) closeCheckoutModal();
    });

    el.pmCash.addEventListener('click', () => handlePaymentSelection('cash'));
    el.pmOnline.addEventListener('click', () => handlePaymentSelection('online'));
    el.orderForm.addEventListener('submit', submitOrder);

    // WhatsApp orders
    el.btnQuickWhatsAppOrder.addEventListener('click', sendWhatsAppOrder);

    // Simulator
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
    el.trackerModalClose.addEventListener('click', closeTracker);
    el.btnTrackerDone.addEventListener('click', closeTracker);

    // Dish Modal
    el.dishModalClose.addEventListener('click', closeDishModal);
    el.dishModalBackdrop.addEventListener('click', (e) => {
      if (e.target === el.dishModalBackdrop) closeDishModal();
    });
    el.dishModalAddBtn.addEventListener('click', () => {
      if (currentModalDish) {
        addToCart(currentModalDish, currentSelectedModifiers);
        showToast(`«${currentModalDish.name}» добавлен в корзину`);
        closeDishModal();
      }
    });

    // Address Change
    el.headerAddressBtn.addEventListener('click', () => {
      el.addressEditInput.value = userAddress;
      el.addressModalBackdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
    el.addressModalClose.addEventListener('click', () => {
      el.addressModalBackdrop.classList.remove('active');
      document.body.style.overflow = '';
    });
    el.btnSaveAddress.addEventListener('click', () => {
      const val = el.addressEditInput.value.trim();
      if (val) {
        userAddress = val;
        el.currentAddressDisplay.textContent = val;
        el.orderAddressInput.value = val;
        showToast('Адрес обновлен');
      }
      el.addressModalBackdrop.classList.remove('active');
      document.body.style.overflow = '';
    });

    // Auto-mask phone input
    el.orderPhoneInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.startsWith('7') || v.startsWith('8')) v = v.substring(1);
      let f = '+7 (';
      if (v.length > 0) f += v.substring(0, 3);
      if (v.length >= 3) f += ') ' + v.substring(3, 6);
      if (v.length >= 6) f += '-' + v.substring(6, 8);
      if (v.length >= 8) f += '-' + v.substring(8, 10);
      e.target.value = f;
    });

    // Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeDishModal();
        closeCartDrawer();
        closeCheckoutModal();
        closeOnlinePaymentSimulator();
        closeTracker();
        el.addressModalBackdrop.classList.remove('active');
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
        { id: "sauces", name: "🥑 Соусы" },
        { id: "drinks", name: "🥤 Напитки" },
        { id: "combos", name: "🎁 Комбо" }
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
