/**
 * Frito Burrito — Yandex Eda Style Application Core
 * Zero-bug architecture, dynamic cart, modals, checkout, WhatsApp direct & tracker
 */

(function () {
  'use strict';

  // 1. Data Store (Loaded dynamically; includes in-memory default to ensure file:// & offline execution)
  let catalogData = null;
  let activeCategory = 'popular';
  let deliveryType = 'delivery'; // 'delivery' or 'pickup'
  let cutleryCount = 1;
  let searchQuery = '';

  // In-memory Cart State (Never caches catalog; session state for user cart)
  let cart = []; // Array of { id, dishId, name, price, basePrice, weight, image, modifiers, quantity }

  // Current modal dish state
  let currentModalDish = null;
  let currentSelectedModifiers = [];

  // DOM Elements cache
  const el = {
    tabsWrapper: document.getElementById('tabsWrapper'),
    catalogSections: document.getElementById('catalogSections'),
    searchInput: document.getElementById('searchInput'),
    searchClearBtn: document.getElementById('searchClearBtn'),
    
    // Header
    headerCartBtn: document.getElementById('headerCartBtn'),
    headerCartBadge: document.getElementById('headerCartBadge'),
    headerCartSum: document.getElementById('headerCartSum'),
    
    // Desktop Cart
    cartSidebar: document.getElementById('cartSidebar'),
    cartItemsList: document.getElementById('cartItemsList'),
    cartEmptyState: document.getElementById('cartEmptyState'),
    cartFilledState: document.getElementById('cartFilledState'),
    cartSummaryItemsCount: document.getElementById('cartSummaryItemsCount'),
    cartItemsSum: document.getElementById('cartItemsSum'),
    cartDeliveryRow: document.getElementById('cartDeliveryRow'),
    cartDeliveryFee: document.getElementById('cartDeliveryFee'),
    cartTotalSum: document.getElementById('cartTotalSum'),
    deliveryThresholdBox: document.getElementById('deliveryThresholdBox'),
    deliveryThresholdText: document.getElementById('deliveryThresholdText'),
    deliveryProgressFill: document.getElementById('deliveryProgressFill'),
    btnCheckout: document.getElementById('btnCheckout'),
    btnWhatsAppDirect: document.getElementById('btnWhatsAppDirect'),
    btnClearCart: document.getElementById('btnClearCart'),
    cutleryCountDisplay: document.getElementById('cutleryCountDisplay'),
    btnCutleryDec: document.getElementById('btnCutleryDec'),
    btnCutleryInc: document.getElementById('btnCutleryInc'),
    
    // Mobile Floating Bar
    mobileCartBar: document.getElementById('mobileCartBar'),
    mCartBadge: document.getElementById('mCartBadge'),
    mCartSum: document.getElementById('mCartSum'),
    
    // Modals
    dishModalBackdrop: document.getElementById('dishModalBackdrop'),
    dishModalClose: document.getElementById('dishModalClose'),
    dishModalEmoji: document.getElementById('dishModalEmoji'),
    dishModalTitle: document.getElementById('dishModalTitle'),
    dishModalMeta: document.getElementById('dishModalMeta'),
    dishModalDesc: document.getElementById('dishModalDesc'),
    dishModalModifiersList: document.getElementById('dishModalModifiersList'),
    dishModalAddBtn: document.getElementById('dishModalAddBtn'),
    
    // Restaurant Info Modal
    infoModalBackdrop: document.getElementById('infoModalBackdrop'),
    btnOpenInfo: document.getElementById('btnOpenInfo'),
    infoModalClose: document.getElementById('infoModalClose'),
    
    // Checkout Modal
    checkoutModalBackdrop: document.getElementById('checkoutModalBackdrop'),
    checkoutModalClose: document.getElementById('checkoutModalClose'),
    checkoutForm: document.getElementById('checkoutForm'),
    checkoutTotalDisplay: document.getElementById('checkoutTotalDisplay'),
    checkoutPhoneInput: document.getElementById('checkoutPhoneInput'),
    checkoutDeliveryFields: document.getElementById('checkoutDeliveryFields'),
    checkoutPickupFields: document.getElementById('checkoutPickupFields'),
    paymentCashOption: document.getElementById('paymentCashOption'),
    paymentCardOption: document.getElementById('paymentCardOption'),
    
    // Online Payment Simulation Modal
    paymentSimBackdrop: document.getElementById('paymentSimBackdrop'),
    paymentSimSum: document.getElementById('paymentSimSum'),
    btnSimSuccess: document.getElementById('btnSimSuccess'),
    btnSimCancel: document.getElementById('btnSimCancel'),
    btnSimFallbackCash: document.getElementById('btnSimFallbackCash'),
    
    // Order Tracker Modal
    trackerModalBackdrop: document.getElementById('trackerModalBackdrop'),
    trackerModalClose: document.getElementById('trackerModalClose'),
    trackerOrderNum: document.getElementById('trackerOrderNum'),
    trackerOrderTotal: document.getElementById('trackerOrderTotal'),
    trackerAddress: document.getElementById('trackerAddress'),
    trackerItemsSummary: document.getElementById('trackerItemsSummary'),
    step1: document.getElementById('trackerStep1'),
    step2: document.getElementById('trackerStep2'),
    step3: document.getElementById('trackerStep3'),
    btnNewOrder: document.getElementById('btnNewOrder'),

    // Address Change
    addressPickerBtn: document.getElementById('addressPickerBtn'),
    addressModalBackdrop: document.getElementById('addressModalBackdrop'),
    addressModalClose: document.getElementById('addressModalClose'),
    addressInput: document.getElementById('addressInput'),
    btnSaveAddress: document.getElementById('btnSaveAddress'),
    currentAddressDisplay: document.getElementById('currentAddressDisplay'),
    
    // Toast Container
    toastContainer: document.getElementById('toastContainer')
  };

  let selectedPaymentMethod = 'cash'; // 'cash' or 'online'
  let userAddress = 'Краснодар, ул. Петра Метальникова, 3/1А';
  let activeOrderSimulation = null;

  // 2. Fetch Catalog or Use Default Data (Prevents CORS blockage on local file preview)
  async function initCatalog() {
    try {
      const resp = await fetch('dishes.json');
      if (resp.ok) {
        catalogData = await resp.json();
      } else {
        throw new Error('Failed to fetch dishes.json');
      }
    } catch (err) {
      console.warn('Loading fallback embedded catalog data...', err);
      catalogData = getFallbackData();
    }
    
    renderCategoriesTabs();
    renderCatalog();
    setupScrollSpy();
    updateCartUI();
  }

  // 3. Render Navigation Tabs
  function renderCategoriesTabs() {
    if (!catalogData || !catalogData.categories) return;
    
    el.tabsWrapper.innerHTML = '';
    catalogData.categories.forEach((cat, index) => {
      const btn = document.createElement('button');
      btn.className = `category-tab-btn ${index === 0 ? 'active' : ''}`;
      btn.setAttribute('data-category', cat.id);
      btn.textContent = cat.name;
      btn.addEventListener('click', () => {
        scrollToCategory(cat.id);
      });
      el.tabsWrapper.appendChild(btn);
    });
  }

  function scrollToCategory(catId) {
    activeCategory = catId;
    updateActiveTabHighlight(catId, true);
    
    const targetSection = document.getElementById(`section-${catId}`);
    if (targetSection) {
      const headerOffset = window.innerWidth <= 860 ? 116 : 80;
      const elementPosition = targetSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth'
      });
    }
  }

  function updateActiveTabHighlight(catId, shouldScrollTab = false) {
    const tabs = el.tabsWrapper.querySelectorAll('.category-tab-btn');
    tabs.forEach(tab => {
      if (tab.getAttribute('data-category') === catId) {
        tab.classList.add('active');
        if (shouldScrollTab) {
          const tabLeft = tab.offsetLeft;
          const tabWidth = tab.offsetWidth;
          const containerWidth = el.tabsWrapper.offsetWidth;
          el.tabsWrapper.scrollTo({
            left: Math.max(0, tabLeft - (containerWidth / 2) + (tabWidth / 2)),
            behavior: 'smooth'
          });
        }
      } else {
        tab.classList.remove('active');
      }
    });
  }

  // 4. Render Catalog Sections & Dishes
  function renderCatalog() {
    if (!catalogData) return;
    
    el.catalogSections.innerHTML = '';
    const q = searchQuery.trim().toLowerCase();

    catalogData.categories.forEach(cat => {
      let dishes = [];
      if (cat.id === 'popular') {
        dishes = catalogData.dishes.filter(d => d.popular);
      } else {
        dishes = catalogData.dishes.filter(d => d.categoryId === cat.id);
      }

      // Filter by search query if present
      if (q) {
        dishes = dishes.filter(d => 
          d.name.toLowerCase().includes(q) || 
          d.description.toLowerCase().includes(q)
        );
      }

      if (dishes.length === 0 && q) {
        // Skip empty categories when searching
        return;
      }

      const section = document.createElement('section');
      section.className = 'category-section';
      section.id = `section-${cat.id}`;
      section.setAttribute('data-category-id', cat.id);

      const header = document.createElement('div');
      header.className = 'section-header';
      header.innerHTML = `
        <h2 class="section-title">${cat.name}</h2>
        <span class="section-count">${dishes.length} ${getNoun(dishes.length, 'блюдо', 'блюда', 'блюд')}</span>
      `;
      section.appendChild(header);

      const grid = document.createElement('div');
      grid.className = 'dishes-grid';

      dishes.forEach(dish => {
        const card = createDishCard(dish);
        grid.appendChild(card);
      });

      section.appendChild(grid);
      el.catalogSections.appendChild(section);
    });

    if (el.catalogSections.children.length === 0 && q) {
      el.catalogSections.innerHTML = `
        <div style="padding: 60px 20px; text-align: center; color: var(--color-text-secondary);">
          <div style="font-size: 40px; margin-bottom: 12px;">🔍</div>
          <h3 style="font-size: 18px; font-weight: 700; color: var(--color-text-main);">Ничего не нашлось</h3>
          <p style="font-size: 14px; margin-top: 6px;">Попробуйте поискать «буррито», «тако», «сыр» или «фри»</p>
        </div>
      `;
    }
  }

  // 5. Create Product Card Element (Yandex Eda style)
  function createDishCard(dish) {
    const card = document.createElement('div');
    card.className = 'dish-card';
    card.setAttribute('data-dish-id', dish.id);

    // Spicy & popular badges
    let badgesHtml = '';
    if (dish.spicy === 1) {
      badgesHtml += '<span class="badge-tag spicy">🌶️ Острое</span>';
    } else if (dish.spicy >= 2) {
      badgesHtml += '<span class="badge-tag spicy">🌶️🌶️ Огонь</span>';
    }
    if (dish.popular) {
      badgesHtml += '<span class="badge-tag popular">🔥 Хит</span>';
    }

    const emojiIcon = dish.emoji || '🌯';

    card.innerHTML = `
      <div class="dish-emoji-wrap">
        <div class="dish-emoji-icon">${emojiIcon}</div>
        <div class="dish-badges">${badgesHtml}</div>
      </div>
      <div class="dish-content">
        <div class="dish-price-row">
          <span class="dish-price">${dish.price} ₽</span>
          <span class="dish-weight">${dish.weight}</span>
        </div>
        <h3 class="dish-name">${escapeHtml(dish.name)}</h3>
        <p class="dish-desc">${escapeHtml(dish.description)}</p>
        <div class="dish-card-footer" id="card-footer-${dish.id}">
          <!-- Action button will be inserted by updateCardButtonState -->
        </div>
      </div>
    `;

    // Click on card opens detailed modal (unless clicking plus/minus stepper)
    card.addEventListener('click', (e) => {
      if (e.target.closest('.card-stepper') || e.target.closest('.btn-add-card')) {
        // Let the button click handler do its thing
        return;
      }
      openDishModal(dish);
    });

    // Populate initial button/stepper state
    const footer = card.querySelector(`#card-footer-${dish.id}`);
    renderCardAction(footer, dish);

    return card;
  }

  function renderCardAction(container, dish) {
    const count = getDishTotalCountInCart(dish.id);
    if (count > 0) {
      container.innerHTML = `
        <div class="card-stepper">
          <button class="stepper-btn btn-dec" data-id="${dish.id}">−</button>
          <span class="stepper-count">${count}</span>
          <button class="stepper-btn btn-inc" data-id="${dish.id}">+</button>
        </div>
      `;
      container.querySelector('.btn-dec').addEventListener('click', (e) => {
        e.stopPropagation();
        decrementDishFromCard(dish.id);
      });
      container.querySelector('.btn-inc').addEventListener('click', (e) => {
        e.stopPropagation();
        incrementDishFromCard(dish.id);
      });
    } else {
      container.innerHTML = `
        <button class="btn-add-card" data-id="${dish.id}">
          <span>+ ${dish.price} ₽</span>
        </button>
      `;
      container.querySelector('.btn-add-card').addEventListener('click', (e) => {
        e.stopPropagation();
        addToCart(dish, []);
        showToast(`«${dish.name}» добавлен в корзину`);
      });
    }
  }

  function updateAllCardsUI() {
    if (!catalogData) return;
    catalogData.dishes.forEach(dish => {
      const footers = document.querySelectorAll(`#card-footer-${dish.id}`);
      footers.forEach(f => renderCardAction(f, dish));
    });
  }

  // 6. Dish Detail Modal Logic
  function openDishModal(dish) {
    currentModalDish = dish;
    currentSelectedModifiers = [];

    el.dishModalEmoji.textContent = dish.emoji || '🌯';
    el.dishModalTitle.textContent = dish.name;
    el.dishModalMeta.innerHTML = `
      <span>${dish.weight}</span>
      <span>•</span>
      <span>${dish.calories || '450 ккал'}</span>
      ${dish.spicy > 0 ? `<span>•</span> <span style="color: var(--color-accent-red); font-weight:700;">🌶️ ${dish.spicy === 1 ? 'Острое' : 'Очень острое'}</span>` : ''}
    `;
    el.dishModalDesc.textContent = dish.description;

    // Modifiers list
    el.dishModalModifiersList.innerHTML = '';
    if (dish.modifiers && dish.modifiers.length > 0) {
      dish.modifiers.forEach((mod, index) => {
        const option = document.createElement('div');
        option.className = 'modifier-option';
        option.setAttribute('data-mod-index', index);
        option.innerHTML = `
          <div class="modifier-left">
            <input type="checkbox" id="mod-${index}" />
            <label for="mod-${index}">${escapeHtml(mod.name)}</label>
          </div>
          <span class="modifier-price">${mod.price > 0 ? `+${mod.price} ₽` : 'Бесплатно'}</span>
        `;

        option.addEventListener('click', (e) => {
          if (e.target.tagName !== 'INPUT') {
            const cb = option.querySelector('input');
            cb.checked = !cb.checked;
          }
          toggleModifier(mod, option.querySelector('input').checked, option);
        });

        el.dishModalModifiersList.appendChild(option);
      });
    } else {
      el.dishModalModifiersList.innerHTML = '<p style="font-size: 13px; color: var(--color-text-tertiary);">К этому блюду нет дополнительных добавок</p>';
    }

    updateDishModalAddButtonPrice();
    el.dishModalBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function toggleModifier(mod, isSelected, element) {
    if (isSelected) {
      currentSelectedModifiers.push(mod);
      element.classList.add('selected');
    } else {
      currentSelectedModifiers = currentSelectedModifiers.filter(m => m.name !== mod.name);
      element.classList.remove('selected');
    }
    updateDishModalAddButtonPrice();
  }

  function updateDishModalAddButtonPrice() {
    if (!currentModalDish) return;
    const modsPrice = currentSelectedModifiers.reduce((acc, m) => acc + (m.price || 0), 0);
    const total = currentModalDish.price + modsPrice;
    el.dishModalAddBtn.innerHTML = `Добавить в корзину • ${total} ₽`;
  }

  function closeDishModal() {
    el.dishModalBackdrop.classList.remove('active');
    document.body.style.overflow = '';
    currentModalDish = null;
    currentSelectedModifiers = [];
  }

  // 7. Cart State Logic
  function addToCart(dish, modifiers = []) {
    // Generate a unique item key based on dish id and selected modifiers
    const modNames = modifiers.map(m => m.name).sort().join('|');
    const modsCost = modifiers.reduce((acc, m) => acc + (m.price || 0), 0);
    const itemPrice = dish.price + modsCost;
    const cartItemId = `${dish.id}__${modNames}`;

    const existing = cart.find(item => item.id === cartItemId);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        id: cartItemId,
        dishId: dish.id,
        name: dish.name,
        emoji: dish.emoji || '🌯',
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

  function incrementDishFromCard(dishId) {
    // Find the first item with this dishId in cart, or add a vanilla one
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

  function decrementDishFromCard(dishId) {
    // Find the last added item with this dishId in cart
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
    return cart
      .filter(item => item.dishId === dishId)
      .reduce((acc, item) => acc + item.quantity, 0);
  }

  function getCartItemsTotal() {
    return cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }

  function getCartItemsCount() {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }

  function getDeliveryCost(itemsTotal) {
    if (deliveryType === 'pickup') return 0;
    const threshold = catalogData?.restaurant?.freeDeliveryThreshold || 800;
    if (itemsTotal >= threshold) return 0;
    return catalogData?.restaurant?.deliveryCost || 149;
  }

  function updateCartUI() {
    const totalCount = getCartItemsCount();
    const itemsSum = getCartItemsTotal();
    const deliveryFee = getDeliveryCost(itemsSum);
    const finalTotal = itemsSum + deliveryFee;
    const threshold = catalogData?.restaurant?.freeDeliveryThreshold || 800;

    // Header cart state
    if (totalCount > 0) {
      el.headerCartBadge.textContent = totalCount;
      el.headerCartBadge.style.display = 'inline-block';
      el.headerCartSum.textContent = `${finalTotal} ₽`;
    } else {
      el.headerCartBadge.style.display = 'none';
      el.headerCartSum.textContent = 'Корзина';
    }

    // Mobile float bar state
    if (totalCount > 0) {
      el.mobileCartBar.style.display = 'flex';
      el.mCartBadge.textContent = `${totalCount}`;
      el.mCartSum.textContent = `${finalTotal} ₽`;
    } else {
      el.mobileCartBar.style.display = 'none';
    }

    // Desktop Cart Sidebar Render
    if (totalCount === 0) {
      el.cartEmptyState.style.display = 'flex';
      el.cartFilledState.style.display = 'none';
    } else {
      el.cartEmptyState.style.display = 'none';
      el.cartFilledState.style.display = 'flex';

      // Render items list
      el.cartItemsList.innerHTML = '';
      cart.forEach(item => {
        const itemRow = document.createElement('div');
        itemRow.className = 'cart-item';
        
        let modsDesc = '';
        if (item.modifiers && item.modifiers.length > 0) {
          modsDesc = item.modifiers.map(m => `+ ${m.name}`).join(', ');
        }

        itemRow.innerHTML = `
          <div class="cart-item-emoji">${item.emoji || '🌯'}</div>
          <div class="cart-item-details">
            <div class="cart-item-name">${escapeHtml(item.name)}</div>
            ${modsDesc ? `<div class="cart-item-modifiers">${escapeHtml(modsDesc)}</div>` : ''}
            <div class="cart-item-price">${item.price * item.quantity} ₽</div>
          </div>
          <div class="cart-item-stepper">
            <button class="c-step-dec" data-cart-id="${item.id}">−</button>
            <span>${item.quantity}</span>
            <button class="c-step-inc" data-cart-id="${item.id}">+</button>
          </div>
        `;

        itemRow.querySelector('.c-step-dec').addEventListener('click', () => {
          if (item.quantity > 1) {
            item.quantity -= 1;
          } else {
            cart = cart.filter(i => i.id !== item.id);
          }
          updateCartUI();
          updateAllCardsUI();
        });

        itemRow.querySelector('.c-step-inc').addEventListener('click', () => {
          item.quantity += 1;
          updateCartUI();
          updateAllCardsUI();
        });

        el.cartItemsList.appendChild(itemRow);
      });

      // Free delivery threshold progress bar
      if (deliveryType === 'delivery') {
        el.deliveryThresholdBox.style.display = 'block';
        if (itemsSum >= threshold) {
          el.deliveryThresholdText.innerHTML = `<span>🎉 Бесплатная доставка!</span> <span>0 ₽</span>`;
          el.deliveryProgressFill.style.width = '100%';
          el.deliveryProgressFill.className = 'delivery-progress-fill';
        } else {
          const diff = threshold - itemsSum;
          const percent = Math.min(100, Math.round((itemsSum / threshold) * 100));
          el.deliveryThresholdText.innerHTML = `<span>До бесплатной доставки: <b>${diff} ₽</b></span> <span>${threshold} ₽</span>`;
          el.deliveryProgressFill.style.width = `${percent}%`;
          el.deliveryProgressFill.className = 'delivery-progress-fill yellow';
        }
      } else {
        el.deliveryThresholdBox.style.display = 'none';
      }

      // Cutlery selector display
      el.cutleryCountDisplay.textContent = `${cutleryCount} шт`;

      // Summary lines
      el.cartSummaryItemsCount.textContent = `${totalCount} ${getNoun(totalCount, 'товар', 'товара', 'товаров')}`;
      el.cartItemsSum.textContent = `${itemsSum} ₽`;
      
      if (deliveryType === 'pickup') {
        el.cartDeliveryFee.textContent = 'Самовывоз (0 ₽)';
        el.cartDeliveryFee.style.color = 'var(--color-accent-green)';
      } else {
        if (deliveryFee === 0) {
          el.cartDeliveryFee.textContent = 'Бесплатно';
          el.cartDeliveryFee.style.color = 'var(--color-accent-green)';
        } else {
          el.cartDeliveryFee.textContent = `${deliveryFee} ₽`;
          el.cartDeliveryFee.style.color = 'var(--color-text-main)';
        }
      }

      el.cartTotalSum.textContent = `${finalTotal} ₽`;
    }
  }

  // 8. Checkout Modal Flow & WhatsApp Direct
  function openCheckoutModal() {
    const totalCount = getCartItemsCount();
    if (totalCount === 0) {
      showToast('Ваша корзина пуста');
      return;
    }

    const itemsSum = getCartItemsTotal();
    const deliveryFee = getDeliveryCost(itemsSum);
    const finalTotal = itemsSum + deliveryFee;

    el.checkoutTotalDisplay.textContent = `${finalTotal} ₽`;

    // Toggle address fields according to delivery type
    if (deliveryType === 'pickup') {
      el.checkoutDeliveryFields.style.display = 'none';
      el.checkoutPickupFields.style.display = 'block';
    } else {
      el.checkoutDeliveryFields.style.display = 'block';
      el.checkoutPickupFields.style.display = 'none';
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
      el.paymentCashOption.classList.add('selected');
      el.paymentCardOption.classList.remove('selected');
    } else {
      el.paymentCardOption.classList.add('selected');
      el.paymentCashOption.classList.remove('selected');
    }
  }

  function formatOrderSummaryText() {
    const itemsSum = getCartItemsTotal();
    const deliveryFee = getDeliveryCost(itemsSum);
    const finalTotal = itemsSum + deliveryFee;

    let text = `🌯 *Заказ из Frito Burrito*:\n\n`;
    cart.forEach(item => {
      let modsStr = item.modifiers.length > 0 ? ` (${item.modifiers.map(m => m.name).join(', ')})` : '';
      text += `• ${item.name}${modsStr} x${item.quantity} = ${item.price * item.quantity} ₽\n`;
    });

    text += `\n🍴 Приборы: ${cutleryCount} шт.\n`;
    text += `🛵 Тип: ${deliveryType === 'delivery' ? 'Доставка курьером' : 'Самовывоз из кафе'}\n`;
    if (deliveryType === 'delivery') {
      text += `📍 Адрес: ${userAddress}\n`;
      text += `📦 Доставка: ${deliveryFee === 0 ? 'Бесплатно' : deliveryFee + ' ₽'}\n`;
    } else {
      text += `📍 Точка самовывоза: ул. Петра Метальникова, 3/1А\n`;
    }
    text += `💳 Оплата: ${selectedPaymentMethod === 'cash' ? 'При получении (наличные/терминал)' : 'Онлайн'}\n`;
    text += `💰 *ИТОГО: ${finalTotal} ₽*`;

    return text;
  }

  function openWhatsAppOrder() {
    const totalCount = getCartItemsCount();
    if (totalCount === 0) {
      showToast('Сначала добавьте блюда в корзину');
      return;
    }

    const orderText = formatOrderSummaryText();
    const phone = '79996505576';
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(orderText)}`;
    window.open(waUrl, '_blank');
    showToast('Переходим в WhatsApp для подтверждения...');
  }

  // 9. Process Checkout Submit
  function submitOrder(e) {
    e.preventDefault();
    const phone = el.checkoutPhoneInput.value.trim();
    if (!phone || phone.length < 10) {
      showToast('Пожалуйста, укажите контактный телефон');
      el.checkoutPhoneInput.focus();
      return;
    }

    const itemsSum = getCartItemsTotal();
    const deliveryFee = getDeliveryCost(itemsSum);
    const finalTotal = itemsSum + deliveryFee;

    closeCheckoutModal();

    if (selectedPaymentMethod === 'online') {
      // Show online payment simulation gateway
      openOnlinePaymentSimulator(finalTotal);
    } else {
      // Instant cash/card upon delivery completion
      finalizeSuccessfulOrder(finalTotal, 'При получении курьеру');
    }
  }

  // 10. Safe Payment Simulator (Prevents lockouts / allows 1-click fallback per rule)
  function openOnlinePaymentSimulator(sum) {
    el.paymentSimSum.textContent = `${sum} ₽`;
    el.paymentSimBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeOnlinePaymentSimulator() {
    el.paymentSimBackdrop.classList.remove('active');
    document.body.style.overflow = '';
  }

  // 11. Order Finalization & Tracker
  function finalizeSuccessfulOrder(finalTotal, paymentDesc) {
    closeOnlinePaymentSimulator();
    closeCheckoutModal();

    const orderNumber = `FB-${Math.floor(1000 + Math.random() * 9000)}`;

    el.trackerOrderNum.textContent = `Заказ №${orderNumber}`;
    el.trackerOrderTotal.textContent = `${finalTotal} ₽ • ${paymentDesc}`;
    el.trackerAddress.textContent = deliveryType === 'delivery' ? userAddress : 'Самовывоз: ул. Петра Метальникова, 3/1А';

    // Summary of dishes
    el.trackerItemsSummary.innerHTML = cart.map(i => 
      `<div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:13px;">
        <span>${escapeHtml(i.name)} × ${i.quantity}</span>
        <span style="font-weight:700;">${i.price * i.quantity} ₽</span>
      </div>`
    ).join('');

    // Reset cart
    cart = [];
    updateCartUI();
    updateAllCardsUI();

    // Show Tracker Modal
    el.trackerModalBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Run simulated order progression: Accepted -> Cooking -> On the way
    runTrackerSimulation();
  }

  function runTrackerSimulation() {
    if (activeOrderSimulation) clearInterval(activeOrderSimulation);

    // Step 1: Accepted
    el.step1.className = 'timeline-step active';
    el.step2.className = 'timeline-step';
    el.step3.className = 'timeline-step';

    let elapsed = 0;
    activeOrderSimulation = setInterval(() => {
      elapsed += 3;
      if (elapsed === 3) {
        // Step 1 completed, Step 2 cooking active
        el.step1.className = 'timeline-step completed';
        el.step2.className = 'timeline-step active';
      } else if (elapsed === 6) {
        // Step 2 completed, Step 3 courier active
        el.step2.className = 'timeline-step completed';
        el.step3.className = 'timeline-step active';
        clearInterval(activeOrderSimulation);
      }
    }, 2800);
  }

  function closeTrackerModal() {
    el.trackerModalBackdrop.classList.remove('active');
    document.body.style.overflow = '';
    if (activeOrderSimulation) clearInterval(activeOrderSimulation);
  }

  // 12. ScrollSpy for Sticky Navigation Tabs
  function setupScrollSpy() {
    const observerOptions = {
      root: null,
      rootMargin: `-${80}px 0px -60% 0px`,
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const catId = entry.target.getAttribute('data-category-id');
          if (catId) {
            updateActiveTabHighlight(catId);
          }
        }
      });
    }, observerOptions);

    const sections = document.querySelectorAll('.category-section');
    sections.forEach(s => observer.observe(s));
  }

  // 13. Toast Notification Helper
  function showToast(msg, type = 'normal') {
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'success' ? 'success' : ''}`;
    toast.innerHTML = `<span>${escapeHtml(msg)}</span>`;
    el.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 260);
    }, 2400);
  }

  // 14. Event Listeners Wiring
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
      el.searchInput.focus();
    });

    // Delivery / Pickup toggles
    document.querySelectorAll('.delivery-toggle-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.delivery-toggle-opt').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        deliveryType = btn.getAttribute('data-type');
        updateCartUI();
        showToast(deliveryType === 'delivery' ? 'Выбрана доставка курьером' : 'Выбран самовывоз со скидкой');
      });
    });

    // Cart buttons
    el.headerCartBtn.addEventListener('click', () => {
      if (window.innerWidth <= 980) {
        openCheckoutModal();
      } else {
        el.cartSidebar.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    el.mobileCartBar.addEventListener('click', () => {
      openCheckoutModal();
    });

    el.btnCheckout.addEventListener('click', openCheckoutModal);
    el.btnWhatsAppDirect.addEventListener('click', openWhatsAppOrder);

    el.btnClearCart.addEventListener('click', () => {
      if (confirm('Очистить корзину?')) {
        cart = [];
        updateCartUI();
        updateAllCardsUI();
        showToast('Корзина очищена');
      }
    });

    // Cutlery controls
    el.btnCutleryDec.addEventListener('click', () => {
      if (cutleryCount > 0) {
        cutleryCount -= 1;
        el.cutleryCountDisplay.textContent = `${cutleryCount} шт`;
      }
    });

    el.btnCutleryInc.addEventListener('click', () => {
      cutleryCount += 1;
      el.cutleryCountDisplay.textContent = `${cutleryCount} шт`;
    });

    // Dish Modal events
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

    // Info Modal events
    el.btnOpenInfo.addEventListener('click', () => {
      el.infoModalBackdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
    el.infoModalClose.addEventListener('click', () => {
      el.infoModalBackdrop.classList.remove('active');
      document.body.style.overflow = '';
    });
    el.infoModalBackdrop.addEventListener('click', (e) => {
      if (e.target === el.infoModalBackdrop) {
        el.infoModalBackdrop.classList.remove('active');
        document.body.style.overflow = '';
      }
    });

    // Checkout Modal events
    el.checkoutModalClose.addEventListener('click', closeCheckoutModal);
    el.checkoutModalBackdrop.addEventListener('click', (e) => {
      if (e.target === el.checkoutModalBackdrop) closeCheckoutModal();
    });
    el.paymentCashOption.addEventListener('click', () => handlePaymentSelection('cash'));
    el.paymentCardOption.addEventListener('click', () => handlePaymentSelection('online'));
    el.checkoutForm.addEventListener('submit', submitOrder);

    // Online Payment Simulator events
    el.btnSimSuccess.addEventListener('click', () => {
      finalizeSuccessfulOrder(getCartItemsTotal() + getDeliveryCost(getCartItemsTotal()), 'Оплачено онлайн (СБП)');
    });
    el.btnSimCancel.addEventListener('click', () => {
      closeOnlinePaymentSimulator();
      showToast('Оплата отменена. Корзина сохранена');
    });
    el.btnSimFallbackCash.addEventListener('click', () => {
      finalizeSuccessfulOrder(getCartItemsTotal() + getDeliveryCost(getCartItemsTotal()), 'При получении (наличные/терминал)');
    });

    // Tracker Modal events
    el.trackerModalClose.addEventListener('click', closeTrackerModal);
    el.btnNewOrder.addEventListener('click', closeTrackerModal);

    // Address Change
    el.addressPickerBtn.addEventListener('click', () => {
      el.addressInput.value = userAddress;
      el.addressModalBackdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
    el.addressModalClose.addEventListener('click', () => {
      el.addressModalBackdrop.classList.remove('active');
      document.body.style.overflow = '';
    });
    el.addressModalBackdrop.addEventListener('click', (e) => {
      if (e.target === el.addressModalBackdrop) {
        el.addressModalBackdrop.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
    el.btnSaveAddress.addEventListener('click', () => {
      const val = el.addressInput.value.trim();
      if (val) {
        userAddress = val;
        el.currentAddressDisplay.textContent = val;
        showToast('Адрес доставки обновлен');
      }
      el.addressModalBackdrop.classList.remove('active');
      document.body.style.overflow = '';
    });

    // Phone format mask on typing
    el.checkoutPhoneInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.startsWith('7') || v.startsWith('8')) {
        v = v.substring(1);
      }
      let formatted = '+7 (';
      if (v.length > 0) formatted += v.substring(0, 3);
      if (v.length >= 3) formatted += ') ' + v.substring(3, 6);
      if (v.length >= 6) formatted += '-' + v.substring(6, 8);
      if (v.length >= 8) formatted += '-' + v.substring(8, 10);
      e.target.value = formatted;
    });

    // Keyboard ESC close
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeDishModal();
        closeCheckoutModal();
        closeOnlinePaymentSimulator();
        closeTrackerModal();
        el.infoModalBackdrop.classList.remove('active');
        el.addressModalBackdrop.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // 15. Helper utilities
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function (m) {
      return ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      })[m];
    });
  }

  function getNoun(number, one, two, five) {
    let n = Math.abs(number);
    n %= 100;
    if (n >= 5 && n <= 20) return five;
    n %= 10;
    if (n === 1) return one;
    if (n >= 2 && n <= 4) return two;
    return five;
  }

  // Fallback data in case dishes.json is blocked by local file:// restrictions
  function getFallbackData() {
    return {
      restaurant: {
        id: "frito-burrito-krd",
        name: "Фрито Буррито",
        cuisine: "Мексиканская кухня • Буррито • Тако",
        rating: "5.0",
        reviewsCount: 240,
        deliveryTime: "25–35 мин",
        minOrder: 400,
        freeDeliveryThreshold: 800,
        deliveryCost: 149,
        address: "Краснодар, ул. им. Петра Метальникова, 3/1А",
        phone: "+7 (999) 650-55-76",
        phoneFormatted: "+7 (999) 650-55-76",
        workingHours: "10:00 — 23:00 ежедневно",
        yandexMapsUrl: "https://yandex.ru/maps/org/frito_burrito/201782394789/"
      },
      categories: [
        { id: "popular", name: "🔥 Популярное" },
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
          emoji: "🌯",
          price: 250,
          weight: "360 г",
          popular: true,
          spicy: 0,
          description: "Сочное куриное филе на гриле, свежие томаты, кукуруза, сыр моцарелла, свежая зелень и фирменный сливочный соус в подрумяненной тортилье.",
          calories: "520 ккал",
          modifiers: [{ name: "Двойной сыр Чеддер", price: 50 }, { name: "Перчик Халапеньо", price: 40 }]
        },
        {
          id: "burrito-juanita",
          categoryId: "burrito",
          name: "Буррито «Месть Хуаниты»",
          emoji: "🌶️🌯",
          price: 300,
          weight: "380 г",
          popular: true,
          spicy: 1,
          description: "Пикантная рубленая мраморная говядина, острый перчик халапеньо, красная фасоль пинто, тянущийся чеддер и аутентичная сальса роха.",
          calories: "580 ккал",
          modifiers: [{ name: "Экстра Халапеньо 🌶️", price: 40 }, { name: "Двойная говядина", price: 90 }]
        },
        {
          id: "burrito-diablo",
          categoryId: "burrito",
          name: "Буррито «Эль Диабло»",
          emoji: "🔥🌯",
          price: 330,
          weight: "390 г",
          popular: true,
          spicy: 2,
          description: "Экстра-острый мексиканский хит! Мраморная говядина и цыпленок, острый соус чили-хабанеро, халапеньо, сладкая кукуруза и расплавленный чеддер.",
          calories: "610 ккал",
          modifiers: [{ name: "Острый соус Чили x2", price: 45 }]
        },
        {
          id: "burrito-mushroom",
          categoryId: "burrito",
          name: "Буррито «Грибной Жюльен»",
          emoji: "🍄🌯",
          price: 330,
          weight: "370 г",
          popular: true,
          spicy: 0,
          description: "Нежнейшее куриное филе, обжаренные шампиньоны с карамелизованным луком, двойная порция сыра и фирменный соус ранч.",
          calories: "540 ккал",
          modifiers: [{ name: "Дополнительный сыр", price: 50 }]
        },
        {
          id: "tacos-box",
          categoryId: "tacos-quesadilla",
          name: "Такос Ланч-Бокс (3 шт)",
          emoji: "🌮",
          price: 500,
          weight: "380 г",
          popular: true,
          spicy: 1,
          description: "Три хрустящих кукурузно-пшеничных тако: с томленым цыпленком, острой говядиной и свежими овощами с долькой сочного лайма.",
          calories: "560 ккал",
          modifiers: [{ name: "Соус Гуакамоле", price: 70 }]
        },
        {
          id: "fries-crispy",
          categoryId: "snacks",
          name: "Картофель Фри хрустящий",
          emoji: "🍟",
          price: 170,
          weight: "150 г",
          popular: true,
          spicy: 0,
          description: "Золотистые хрустящие брусочки картофеля фри с легкой морской солью и паприкой.",
          calories: "320 ккал",
          modifiers: [{ name: "Соус Сырный", price: 60 }]
        },
        {
          id: "sauce-guacamole",
          categoryId: "sauces",
          name: "Фирменный Гуакамоле",
          emoji: "🥑",
          price: 120,
          weight: "50 г",
          popular: true,
          spicy: 0,
          description: "Аутентичный мексиканский дип из спелого авокадо, сока лайма, томатов и свежей кинзы.",
          calories: "95 ккал",
          modifiers: []
        },
        {
          id: "combo-mexican",
          categoryId: "combos",
          name: "Комбо «Мексиканец»",
          emoji: "🌯🍟",
          price: 490,
          weight: "650 г",
          popular: true,
          spicy: 0,
          description: "Сытный набор для одного: Буррито «Эль Классико» + Картофель Фри + Соус Сальса Роха + Напиток на выбор. Выгода 90 ₽!",
          calories: "980 ккал",
          modifiers: []
        }
      ]
    };
  }

  // Start App
  document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    initCatalog();
  });
})();
