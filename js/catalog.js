'use strict';

/* ── Estado da página ───────────────────────────────────────── */
var state = { category: 'all', sort: 'recent', search: '', priceMin: 0, priceMax: 2000, city: 'all' };
var session = Storage.getSession();
var _searchTimer = null;

/* ── Comparador ─────────────────────────────────────────────── */
var compareList = []; // max 3 produtos
var COMPARE_MAX = 3;

/* ── Inicialização ──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  Storage.init();
  session = Storage.getSession();
  updateCartBadge();
  renderNavUser();
  renderStorePills();
  renderSkeletons(8);
  setTimeout(function () { renderFeed(); }, 300);
  updateStats();
  bindEvents();
  setupScrollProgress();
  setupReveal();
  initCarousel();
  renderFlashSale();
  initFlashTimer();
  initCategoryGrid();
  initSearchTags();
});

/* ── Stats do hero ──────────────────────────────────────────── */
function updateStats() {
  var products = Storage.getProducts().filter(function (p) { return p.active; });
  var stores   = Storage.getStores().filter(function (s) { return s.verified; });
  var elP = document.getElementById('statProducts');
  var elS = document.getElementById('statStores');
  if (elP) elP.textContent = products.length;
  if (elS) elS.textContent = stores.length;
}

/* ── Vitrine de lojas ───────────────────────────────────────── */
function renderStorePills() {
  var row = document.getElementById('storesRow');
  if (!row) return;
  var stores = Storage.getStores();
  row.innerHTML = stores.map(function (store) {
    var owner = Storage.getUser(store.ownerId);
    var color = owner ? owner.color : '#2E7D32';
    var initials = owner ? owner.initials : store.name.substring(0, 2).toUpperCase();
    return '<a href="loja.html?id=' + store.id + '" class="store-pill">' +
      '<span class="store-pill-avatar" style="background:' + color + '">' + initials + '</span>' +
      '<span class="store-pill-name">' + store.name + '</span>' +
      '<span class="store-pill-rating"><i class="fa-solid fa-star" style="font-size:.55rem"></i> ' + store.rating.toFixed(1) + '</span>' +
      (store.verified ? '<span class="store-pill-verified" title="Fornecedor verificado"><i class="fa-solid fa-check"></i></span>' : '') +
      '</a>';
  }).join('');
}

/* ── Skeletons ──────────────────────────────────────────────── */
function renderSkeletons(n) {
  var grid = document.getElementById('feedGrid');
  if (!grid) return;
  var html = '';
  for (var i = 0; i < n; i++) {
    html += '<div class="skeleton-card">' +
      '<div class="skeleton skeleton-img"></div>' +
      '<div class="skeleton-body">' +
      '<div class="skeleton skeleton-line"></div>' +
      '<div class="skeleton skeleton-line w-3-4"></div>' +
      '<div class="skeleton skeleton-price"></div>' +
      '<div class="skeleton skeleton-line w-1-2"></div>' +
      '</div></div>';
  }
  grid.innerHTML = html;
}

/* ── Renderizar feed ────────────────────────────────────────── */
function renderFeed() {
  var grid = document.getElementById('feedGrid');
  var countEl = document.getElementById('feedCount');
  if (!grid) return;

  var products = Storage.getProducts().filter(function (p) { return p.active; });

  /* filtro de categoria */
  if (state.category !== 'all') {
    products = products.filter(function (p) { return p.category === state.category; });
  }

  /* filtro de busca */
  if (state.search.length > 0) {
    var q = state.search.toLowerCase();
    products = products.filter(function (p) {
      return p.title.toLowerCase().indexOf(q) >= 0 ||
             (p.description && p.description.toLowerCase().indexOf(q) >= 0);
    });
  }

  /* filtro de faixa de preço */
  products = products.filter(function (p) {
    return p.price >= state.priceMin && p.price <= state.priceMax;
  });

  /* filtro de cidade */
  if (state.city !== 'all') {
    products = products.filter(function (p) {
      var store = Storage.getStore(p.storeId);
      var owner = store ? Storage.getUser(store.ownerId) : null;
      return owner && owner.city === state.city;
    });
  }

  /* menor preço por categoria (para badge) */
  var minByCat = {};
  products.forEach(function (p) {
    if (!(p.category in minByCat) || p.price < minByCat[p.category]) {
      minByCat[p.category] = p.price;
    }
  });

  /* ordenação */
  if (state.sort === 'price_asc') {
    products.sort(function (a, b) { return a.price - b.price; });
  } else if (state.sort === 'price_desc') {
    products.sort(function (a, b) { return b.price - a.price; });
  } else if (state.sort === 'rating') {
    products.sort(function (a, b) { return b.rating - a.rating; });
  } else {
    products.sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
  }

  if (countEl) {
    countEl.innerHTML = products.length > 0
      ? '<strong>' + products.length + '</strong> produto' + (products.length !== 1 ? 's' : '') + ' encontrado' + (products.length !== 1 ? 's' : '')
      : '';
  }

  if (products.length === 0) {
    grid.innerHTML = '<div class="empty-state">' +
      '<i class="fa-solid fa-magnifying-glass"></i>' +
      '<h3>Nenhum produto encontrado</h3>' +
      '<p>Tente ajustar os filtros, faixa de preço ou termos de busca.</p>' +
      '</div>';
    return;
  }

  grid.innerHTML = products.map(function (p, i) {
    var isBest = products.filter(function (x) { return x.category === p.category; }).length > 1
                 && p.price === minByCat[p.category];
    return renderCard(p, i, isBest);
  }).join('');

  /* aplicar favs */
  grid.querySelectorAll('.product-card-fav').forEach(function (btn) {
    var pid = parseInt(btn.dataset.pid, 10);
    if (Storage.isFav(pid)) btn.classList.add('active');
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var isNow = Storage.toggleFav(pid);
      btn.classList.toggle('active', isNow);
      Toast.show(isNow ? 'Adicionado aos favoritos!' : 'Removido dos favoritos.', isNow ? 'success' : 'info');
    });
  });

  /* botões adicionar ao carrinho */
  grid.querySelectorAll('.btn-add-cart').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var pid = parseInt(btn.dataset.pid, 10);
      var product = Storage.getProduct(pid);
      if (product) addToCartFromCard(product);
    });
  });

  /* botões comparar */
  grid.querySelectorAll('.btn-compare').forEach(function (btn) {
    var pid = parseInt(btn.dataset.pid, 10);
    if (compareList.some(function (x) { return x.id === pid; })) {
      btn.classList.add('selected');
    }
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      toggleCompare(pid);
    });
  });

  setupReveal();
}

/* ── Renderizar card de produto ─────────────────────────────── */
function renderCard(p, i, isBest) {
  var store   = Storage.getStore(p.storeId);
  var owner   = store ? Storage.getUser(store.ownerId) : null;
  var color   = owner ? owner.color : '#2E7D32';
  var initials = owner ? owner.initials : (store ? store.name.substring(0, 2).toUpperCase() : 'AG');
  var storeName = store ? store.name : 'Loja';
  var imgSrc  = (p.images && p.images.length > 0) ? p.images[0] : 'https://placehold.co/700x500/e8f5e9/2E7D32?text=Produto';
  var isFav   = Storage.isFav(p.id);
  var stagger = 'stagger-' + ((i % 5) + 1);

  return '<div class="product-card reveal ' + stagger + '">' +
    '<a href="produto.html?id=' + p.id + '" style="display:block;text-decoration:none;color:inherit">' +
      '<div class="product-card-img">' +
        '<img src="' + imgSrc + '" alt="' + p.title + '" loading="lazy">' +
        '<div class="product-card-badges">' +
          '<span class="badge ' + Fmt.categoryColor(p.category) + '"><i class="fa-solid ' + Fmt.categoryIcon(p.category) + '"></i> ' + Fmt.categoryLabel(p.category) + '</span>' +
          (isBest ? '<span class="badge badge-best-price"><i class="fa-solid fa-trophy"></i> Menor Preço</span>' : '') +
          (p.featured ? '<span class="badge badge-featured"><i class="fa-solid fa-star"></i> Destaque</span>' : '') +
        '</div>' +
        '<button class="product-card-fav' + (isFav ? ' active' : '') + '" data-pid="' + p.id + '" title="Favoritar" aria-label="Favoritar">' +
          '<i class="fa-' + (isFav ? 'solid' : 'regular') + ' fa-heart"></i>' +
        '</button>' +
        '<button class="btn-compare" data-pid="' + p.id + '" title="Comparar produto" aria-label="Adicionar à comparação">' +
          '<i class="fa-solid fa-scale-balanced"></i>' +
        '</button>' +
      '</div>' +
      '<div class="product-card-body">' +
        '<div class="product-card-title">' + p.title + '</div>' +
        '<div>' +
          '<div class="product-card-price">' + Fmt.currency(p.price) + ' <span>/ ' + p.unit + '</span></div>' +
          '<div class="product-card-qty"><i class="fa-solid fa-boxes-stacked" style="margin-right:4px;color:var(--gray-400)"></i> ' + p.stock + ' em estoque</div>' +
        '</div>' +
        '<div class="product-card-meta">' +
          '<div class="product-card-seller">' +
            '<span class="avatar" style="width:24px;height:24px;font-size:.55rem;background:' + color + '">' + initials + '</span>' +
            '<div class="product-card-seller-info">' +
              '<div class="product-card-seller-name">' + storeName + '</div>' +
            '</div>' +
          '</div>' +
          '<span style="margin-left:auto;display:flex;align-items:center;gap:3px">' +
            '<span class="stars stars-sm">' + Fmt.stars(p.rating) + '</span>' +
            '<span style="font-size:.7rem;color:var(--gray-600);font-weight:600">' + p.rating.toFixed(1) + '</span>' +
          '</span>' +
        '</div>' +
        '<div style="font-size:.7rem;color:var(--gray-400);margin-top:2px">' + Fmt.relativeDate(p.createdAt) + '</div>' +
      '</div>' +
    '</a>' +
    '<div class="product-card-footer">' +
      '<a href="produto.html?id=' + p.id + '" class="btn btn-sm btn-outline">Ver Produto</a>' +
      '<button class="btn btn-sm btn-gold btn-add-cart" data-pid="' + p.id + '">' +
        '<i class="fa-solid fa-cart-plus"></i> Adicionar' +
      '</button>' +
    '</div>' +
  '</div>';
}

/* ── Adicionar ao carrinho ──────────────────────────────────── */
function addToCartFromCard(p) {
  if (session === null) {
    Toast.show('Faça login para adicionar produtos ao carrinho.', 'warning');
    openModal('loginModal');
    renderLoginModal();
    return;
  }
  var store = Storage.getStore(p.storeId);
  Storage.addToCart({
    productId: p.id,
    storeId:   p.storeId,
    storeName: store ? store.name : 'Loja',
    title:     p.title,
    price:     p.price,
    quantity:  1,
    unit:      p.unit,
    image:     (p.images && p.images.length > 0) ? p.images[0] : ''
  });
  updateCartBadge();
  Toast.show('Produto adicionado ao carrinho!', 'success');
}

/* ── Nav user ───────────────────────────────────────────────── */
function renderNavUser() {
  var avatarEl = document.getElementById('navUserAvatar');
  var nameEl   = document.getElementById('navUserName');
  if (!avatarEl) return;
  if (session !== null) {
    var user = Storage.getUser(session);
    if (user) {
      avatarEl.innerHTML = '<span class="avatar" style="width:26px;height:26px;font-size:.55rem;background:' + user.color + '">' + user.initials + '</span>';
      nameEl.textContent = user.name.split(' ')[0];
    }
  } else {
    avatarEl.innerHTML = '';
    nameEl.textContent = 'Entrar';
  }
}

/* ── Modal de login ─────────────────────────────────────────── */
function renderLoginModal() {
  var list = document.getElementById('loginUserList');
  if (!list) return;
  var users = Storage.getUsers().filter(function (u) { return u.type !== 'admin'; });
  list.innerHTML = users.map(function (u) {
    return '<div class="user-option' + (session === u.id ? ' selected' : '') + '" data-uid="' + u.id + '">' +
      '<span class="avatar" style="width:44px;height:44px;font-size:.85rem;background:' + u.color + '">' + u.initials + '</span>' +
      '<div style="flex:1">' +
        '<div class="user-option-name">' + u.name + (u.verified ? ' <i class="fa-solid fa-circle-check" style="color:var(--green-500);font-size:.7rem"></i>' : '') + '</div>' +
        '<div class="user-option-meta">' +
          '<span>' + ({ comprador: 'Comprador', lojista: 'Lojista' }[u.type] || u.type) + '</span>' +
          '<span class="user-option-loc"><i class="fa-solid fa-location-dot" style="font-size:.6rem"></i> ' + u.city + ', ' + u.state + '</span>' +
        '</div>' +
      '</div>' +
      '<i class="fa-solid fa-circle-check user-option-check"></i>' +
    '</div>';
  }).join('');

  list.querySelectorAll('.user-option').forEach(function (el) {
    el.addEventListener('click', function () {
      session = parseInt(el.dataset.uid, 10);
      Storage.setSession(session);
      renderNavUser();
      updateCartBadge();
      closeModal('loginModal');
      Toast.show('Bem-vindo, ' + Storage.getUser(session).name.split(' ')[0] + '!', 'success');
    });
  });
}

/* ── Scroll progress ────────────────────────────────────────── */
function setupScrollProgress() {
  var bar = document.getElementById('scrollProgress');
  if (!bar) return;
  window.addEventListener('scroll', function () {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = max > 0 ? (window.scrollY / max * 100) + '%' : '0%';
  }, { passive: true });
}

/* ── Reveal por scroll ──────────────────────────────────────── */
function setupReveal() {
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal:not(.visible)').forEach(function (el) { obs.observe(el); });
}

/* ── Eventos ────────────────────────────────────────────────── */
function bindEvents() {
  /* pills de categoria */
  document.querySelectorAll('.filter-pill[data-cat]').forEach(function (pill) {
    pill.addEventListener('click', function () {
      document.querySelectorAll('.filter-pill[data-cat]').forEach(function (p) { p.classList.remove('active'); });
      pill.classList.add('active');
      state.category = pill.dataset.cat;
      renderFeed();
    });
  });

  /* ordenação */
  var sortEl = document.getElementById('filterSort');
  if (sortEl) {
    sortEl.addEventListener('change', function () {
      state.sort = sortEl.value;
      renderFeed();
    });
  }

  /* busca com debounce */
  var searchEl = document.getElementById('navSearch');
  var clearEl  = document.getElementById('searchClear');
  if (searchEl) {
    searchEl.addEventListener('input', function () {
      var val = searchEl.value.trim();
      if (clearEl) clearEl.classList.toggle('visible', val.length > 0);
      clearTimeout(_searchTimer);
      _searchTimer = setTimeout(function () {
        state.search = val;
        renderFeed();
      }, 260);
    });
  }
  if (clearEl) {
    clearEl.addEventListener('click', function () {
      if (searchEl) searchEl.value = '';
      clearEl.classList.remove('visible');
      state.search = '';
      renderFeed();
    });
  }

  /* botão de usuário */
  var userBtn = document.getElementById('navUserBtn');
  if (userBtn) {
    userBtn.addEventListener('click', function () {
      if (session !== null) {
        session = null;
        Storage.clearSession();
        renderNavUser();
        updateCartBadge();
        Toast.show('Sessão encerrada.', 'info');
      } else {
        renderLoginModal();
        openModal('loginModal');
      }
    });
  }

  /* fechar modal de login */
  var loginClose = document.getElementById('loginClose');
  if (loginClose) {
    loginClose.addEventListener('click', function () { closeModal('loginModal'); });
  }

  /* fechar modal clicando no overlay */
  document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  /* tecla Escape */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(function (m) { closeModal(m.id); });
    }
  });

  /* slider de faixa de preço */
  initPriceRange();

  /* filtro de cidades */
  initCityFilter();

  /* comparador */
  initCompareBar();
}

/* ── Filtro de cidade ───────────────────────────────────────── */
function initCityFilter() {
  /* desktop */
  var cityEl = document.getElementById('filterCity');
  if (cityEl) cityEl.addEventListener('change', function () {
    state.city = cityEl.value;
    syncMobileControls();
    updateFilterBadge();
    renderFeed();
  });

  /* mobile */
  var cityMob = document.getElementById('filterCityMobile');
  if (cityMob) cityMob.addEventListener('change', function () {
    state.city = cityMob.value;
    if (cityEl) cityEl.value = cityMob.value;
    updateFilterBadge();
    renderFeed();
  });

  /* sort mobile */
  var sortMob = document.getElementById('filterSortMobile');
  if (sortMob) sortMob.addEventListener('change', function () {
    state.sort = sortMob.value;
    var sortEl = document.getElementById('filterSort');
    if (sortEl) sortEl.value = sortMob.value;
    renderFeed();
  });

  /* price mobile */
  var minMob = document.getElementById('priceMinM');
  var maxMob = document.getElementById('priceMaxM');
  var minLblM = document.getElementById('priceMinLabelM');
  var maxLblM = document.getElementById('priceMaxLabelM');
  var fillM   = document.getElementById('priceRangeFillM');
  function updateMobilePrice() {
    if (!minMob || !maxMob) return;
    var lo = parseInt(minMob.value, 10);
    var hi = parseInt(maxMob.value, 10);
    if (lo > hi) { var t = lo; lo = hi; hi = t; minMob.value = lo; maxMob.value = hi; }
    var pct = function (v) { return (v / 2000) * 100; };
    if (fillM) { fillM.style.left = pct(lo) + '%'; fillM.style.width = (pct(hi) - pct(lo)) + '%'; }
    if (minLblM) minLblM.textContent = 'R$ ' + lo;
    if (maxLblM) maxLblM.textContent = hi >= 2000 ? 'R$ ' + hi + '+' : 'R$ ' + hi;
    state.priceMin = lo; state.priceMax = hi;
    /* sync desktop labels */
    var minL = document.getElementById('priceMinLabel');
    var maxL = document.getElementById('priceMaxLabel');
    if (minL) minL.textContent = 'R$ ' + lo;
    if (maxL) maxL.textContent = hi >= 2000 ? 'R$ ' + hi + '+' : 'R$ ' + hi;
    updateFilterBadge();
  }
  if (minMob) minMob.addEventListener('input', function () { updateMobilePrice(); renderFeed(); });
  if (maxMob) maxMob.addEventListener('input', function () { updateMobilePrice(); renderFeed(); });

  /* botão Filtros */
  var btn   = document.getElementById('filterMobileBtn');
  var panel = document.getElementById('filterMobilePanel');
  if (btn && panel) {
    btn.addEventListener('click', function () {
      var open = panel.classList.toggle('open');
      btn.classList.toggle('active', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
}

function syncMobileControls() {
  var cityMob = document.getElementById('filterCityMobile');
  if (cityMob) cityMob.value = state.city;
  var sortMob = document.getElementById('filterSortMobile');
  if (sortMob) sortMob.value = state.sort;
}

function updateFilterBadge() {
  var badge = document.getElementById('filterMobileBadge');
  if (!badge) return;
  var active = state.city !== 'all' || state.priceMin > 0 || state.priceMax < 2000;
  badge.style.display = active ? 'inline-block' : 'none';
}

/* ── Slider de faixa de preço ───────────────────────────────── */
function initPriceRange() {
  var minEl    = document.getElementById('priceMin');
  var maxEl    = document.getElementById('priceMax');
  var minLabel = document.getElementById('priceMinLabel');
  var maxLabel = document.getElementById('priceMaxLabel');
  var fill     = document.getElementById('priceRangeFill');
  if (!minEl || !maxEl) return;

  function updateRange() {
    var lo = parseInt(minEl.value, 10);
    var hi = parseInt(maxEl.value, 10);
    if (lo > hi) { var t = lo; lo = hi; hi = t; minEl.value = lo; maxEl.value = hi; }
    var pct = function (v) { return (v / parseInt(maxEl.max, 10)) * 100; };
    if (fill) { fill.style.left = pct(lo) + '%'; fill.style.width = (pct(hi) - pct(lo)) + '%'; }
    if (minLabel) minLabel.textContent = 'R$ ' + lo;
    if (maxLabel) maxLabel.textContent = hi >= parseInt(maxEl.max, 10) ? 'R$ ' + hi + '+' : 'R$ ' + hi;
    state.priceMin = lo;
    state.priceMax = hi;
  }

  minEl.addEventListener('input', function () { updateRange(); renderFeed(); });
  maxEl.addEventListener('input', function () { updateRange(); renderFeed(); });
  updateRange();
}

/* ── Comparador ─────────────────────────────────────────────── */
function toggleCompare(pid) {
  var product = Storage.getProduct(pid);
  if (!product) return;

  var idx = compareList.findIndex(function (x) { return x.id === pid; });
  if (idx >= 0) {
    compareList.splice(idx, 1);
  } else {
    if (compareList.length >= COMPARE_MAX) {
      Toast.show('Máximo de ' + COMPARE_MAX + ' produtos para comparar.', 'warning');
      return;
    }
    compareList.push(product);
  }

  /* atualizar estado visual do botão no grid */
  document.querySelectorAll('.btn-compare[data-pid="' + pid + '"]').forEach(function (btn) {
    btn.classList.toggle('selected', compareList.some(function (x) { return x.id === pid; }));
  });

  renderCompareBar();
}

function initCompareBar() {
  var openBtn  = document.getElementById('compareBtnOpen');
  var clearBtn = document.getElementById('compareBtnClear');
  var closeBtn = document.getElementById('compareModalClose');

  if (openBtn)  openBtn.addEventListener('click', openCompareModal);
  if (clearBtn) clearBtn.addEventListener('click', function () { compareList = []; renderCompareBar(); renderFeed(); });
  if (closeBtn) closeBtn.addEventListener('click', function () { closeModal('compareModal'); });
}

function renderCompareBar() {
  var bar      = document.getElementById('compareBar');
  var itemsEl  = document.getElementById('compareBarItems');
  var openBtn  = document.getElementById('compareBtnOpen');
  if (!bar || !itemsEl) return;

  bar.classList.toggle('visible', compareList.length > 0);
  if (openBtn) openBtn.disabled = compareList.length < 2;

  itemsEl.innerHTML = compareList.map(function (p) {
    var imgSrc = (p.images && p.images.length > 0) ? p.images[0] : 'https://placehold.co/36x36/e8f5e9/2E7D32?text=P';
    return '<div class="compare-bar-item">' +
      '<img class="compare-bar-item-img" src="' + imgSrc + '" alt="' + p.title + '">' +
      '<div class="compare-bar-item-info">' +
        '<div class="compare-bar-item-title">' + p.title + '</div>' +
        '<div class="compare-bar-item-price">' + Fmt.currency(p.price) + '</div>' +
      '</div>' +
      '<button class="compare-bar-item-remove" data-pid="' + p.id + '" title="Remover">' +
        '<i class="fa-solid fa-xmark"></i>' +
      '</button>' +
    '</div>';
  }).join('');

  if (compareList.length < COMPARE_MAX) {
    itemsEl.innerHTML += '<div class="compare-bar-hint">+ ' + (COMPARE_MAX - compareList.length) + ' para comparar</div>';
  }

  itemsEl.querySelectorAll('.compare-bar-item-remove').forEach(function (btn) {
    btn.addEventListener('click', function () {
      toggleCompare(parseInt(btn.dataset.pid, 10));
    });
  });
}

function openCompareModal() {
  if (compareList.length < 2) return;

  var cols = compareList.length + 1; // +1 coluna de labels
  var colTpl = '120px ' + compareList.map(function () { return '1fr'; }).join(' ');

  var rows = [
    { label: 'Produto',    render: function (p) {
      var img = (p.images && p.images.length > 0) ? p.images[0] : 'https://placehold.co/72x54/e8f5e9/2E7D32?text=P';
      return '<img class="compare-cell-img" src="' + img + '" alt="' + p.title + '"><div style="font-size:.8rem;font-weight:700;margin-top:6px">' + p.title + '</div>';
    }},
    { label: 'Preço',      render: function (p, best) {
      return '<div class="compare-cell-price' + (best ? ' best' : '') + '">' + Fmt.currency(p.price) + ' <span style="font-size:.7rem;font-weight:400">/ ' + p.unit + '</span></div>' +
             (best ? '<div class="compare-cell-best-badge"><i class="fa-solid fa-trophy"></i> Menor Preço</div>' : '');
    }, isBestRow: true },
    { label: 'Avaliação',  render: function (p) {
      return '<span style="display:flex;align-items:center;justify-content:center;gap:5px">' +
             '<span class="stars stars-sm">' + Fmt.stars(p.rating) + '</span>' +
             '<strong>' + p.rating.toFixed(1) + '</strong></span>';
    }},
    { label: 'Estoque',    render: function (p) { return p.stock + ' unid.'; }},
    { label: 'Fornecedor', render: function (p) {
      var s = Storage.getStore(p.storeId);
      return (s ? s.name : '—') + (s && s.verified ? ' <i class="fa-solid fa-circle-check" style="color:var(--green-500);font-size:.7rem"></i>' : '');
    }},
    { label: 'Categoria',  render: function (p) {
      return '<span class="badge ' + Fmt.categoryColor(p.category) + '">' + Fmt.categoryLabel(p.category) + '</span>';
    }},
  ];

  var minPrice = Math.min.apply(null, compareList.map(function (p) { return p.price; }));

  var header = '<div class="compare-table-header" style="grid-template-columns:' + colTpl + '">' +
    '<div class="compare-col-header" style="background:var(--gray-100)"></div>' +
    compareList.map(function (p) {
      return '<div class="compare-col-header">' + p.title.substring(0, 28) + (p.title.length > 28 ? '…' : '') +
             '<button class="compare-col-remove" data-pid="' + p.id + '">✕ remover</button></div>';
    }).join('') +
  '</div>';

  var body = rows.map(function (row) {
    return '<div class="compare-row" style="grid-template-columns:' + colTpl + '">' +
      '<div class="compare-row-label">' + row.label + '</div>' +
      compareList.map(function (p) {
        var best = row.isBestRow && p.price === minPrice;
        return '<div class="compare-cell">' + row.render(p, best) + '</div>';
      }).join('') +
    '</div>';
  }).join('');

  var tableEl = document.getElementById('compareTable');
  if (tableEl) {
    tableEl.innerHTML = '<div class="compare-table">' + header + '<div class="compare-table-body">' + body + '</div></div>';
    tableEl.querySelectorAll('.compare-col-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        toggleCompare(parseInt(btn.dataset.pid, 10));
        if (compareList.length < 2) { closeModal('compareModal'); }
        else { openCompareModal(); }
      });
    });
  }

  openModal('compareModal');
}

/* ── Carrossel Hero ─────────────────────────────────────────── */
function initCarousel() {
  var track   = document.getElementById('carouselTrack');
  var prevBtn = document.getElementById('carouselPrev');
  var nextBtn = document.getElementById('carouselNext');
  var dots    = document.querySelectorAll('.carousel-dot');
  if (!track) return;

  var current   = 0;
  var total     = track.children.length;
  var autoTimer = null;

  function goTo(idx) {
    current = (idx % total + total) % total;
    track.style.transform = 'translateX(-' + current * 100 + '%)';
    dots.forEach(function (d, i) { d.classList.toggle('active', i === current); });
  }

  function startAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(function () { goTo(current + 1); }, 4200);
  }

  if (prevBtn) prevBtn.addEventListener('click', function () { goTo(current - 1); startAuto(); });
  if (nextBtn) nextBtn.addEventListener('click', function () { goTo(current + 1); startAuto(); });
  dots.forEach(function (d) {
    d.addEventListener('click', function () { goTo(parseInt(d.dataset.idx, 10)); startAuto(); });
  });

  /* swipe touch */
  var touchStartX = 0;
  track.addEventListener('touchstart', function (e) { touchStartX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', function (e) {
    var diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) { goTo(diff > 0 ? current + 1 : current - 1); startAuto(); }
  }, { passive: true });

  startAuto();
}

/* ── Flash Sale — renderizar produtos ───────────────────────── */
function renderFlashSale() {
  var container = document.getElementById('flashProducts');
  if (!container) return;

  var products = Storage.getProducts().filter(function (p) { return p.active; });
  if (!products.length) { container.parentElement && (container.parentElement.style.display = 'none'); return; }

  /* embaralha para variar */
  products = products.slice().sort(function () { return Math.random() - .5 }).slice(0, 8);

  container.innerHTML = products.map(function (p) {
    var discount    = Math.floor(p.id * 7 % 22) + 10;           /* 10–31 % determinístico por ID */
    var origPrice   = p.price * (1 + discount / 100);
    var soldPct     = Math.min(95, Math.floor(p.id * 13 % 60) + 25); /* 25–84 % */
    var soldCount   = Math.floor(soldPct * 1.8);
    var imgSrc      = (p.images && p.images.length) ? p.images[0] : 'https://placehold.co/158x138/e8f5e9/2E7D32?text=Produto';

    return '<a href="produto.html?id=' + p.id + '" class="flash-card">' +
      '<img class="flash-card-img" src="' + imgSrc + '" alt="' + p.title + '" loading="lazy" onerror="this.src=\'https://placehold.co/158x138/e8f5e9/2E7D32?text=Produto\'">' +
      '<div class="flash-card-body">' +
        '<span class="flash-card-discount">-' + discount + '%</span>' +
        '<div class="flash-card-title">' + p.title + '</div>' +
        '<div class="flash-card-original">' + Fmt.currency(origPrice) + ' / ' + p.unit + '</div>' +
        '<div class="flash-card-price">' + Fmt.currency(p.price) + '</div>' +
        '<div class="stock-bar"><div class="stock-bar-fill" style="width:' + soldPct + '%"></div></div>' +
        '<div class="flash-card-sold">' + soldCount + ' vendidos</div>' +
      '</div>' +
    '</a>';
  }).join('');
}

/* ── Flash Sale — timer regressivo ──────────────────────────── */
function initFlashTimer() {
  var hEl = document.getElementById('timerH');
  var mEl = document.getElementById('timerM');
  var sEl = document.getElementById('timerS');
  if (!hEl) return;

  /* tempo fixo baseado no dia atual para parecer consistente */
  var now      = new Date();
  var midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  var endTime  = midnight.getTime();

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    var remaining = Math.max(0, endTime - Date.now());
    var h = Math.floor(remaining / 3600000);
    var m = Math.floor((remaining % 3600000) / 60000);
    var s = Math.floor((remaining % 60000) / 1000);
    hEl.textContent = pad(h);
    mEl.textContent = pad(m);
    sEl.textContent = pad(s);
  }

  tick();
  setInterval(tick, 1000);
}

/* ── Grade de Categorias — clique filtra o feed ─────────────── */
function initCategoryGrid() {
  document.querySelectorAll('.category-item[data-cat]').forEach(function (item) {
    item.addEventListener('click', function (e) {
      e.preventDefault();
      var cat = item.dataset.cat;

      /* atualiza estado */
      state.category = cat;

      /* sincroniza pills do filter-bar */
      document.querySelectorAll('.filter-pill[data-cat]').forEach(function (p) { p.classList.remove('active'); });
      var pill = document.querySelector('.filter-pill[data-cat="' + cat + '"]');
      if (pill) pill.classList.add('active');

      /* destaca categoria ativa */
      document.querySelectorAll('.category-item').forEach(function (ci) { ci.classList.remove('active'); });
      item.classList.add('active');

      renderFeed();

      /* scroll suave até o feed */
      var feedEl = document.getElementById('feedSection');
      if (feedEl) feedEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* banners laterais do hero também filtram */
  document.querySelectorAll('.hero-side-banner[data-cat]').forEach(function (banner) {
    banner.addEventListener('click', function (e) {
      e.preventDefault();
      var cat = banner.dataset.cat;
      state.category = cat;
      document.querySelectorAll('.filter-pill[data-cat]').forEach(function (p) { p.classList.remove('active'); });
      var pill = document.querySelector('.filter-pill[data-cat="' + cat + '"]');
      if (pill) pill.classList.add('active');
      renderFeed();
      var feedEl = document.getElementById('feedSection');
      if (feedEl) feedEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ── Tags de busca popular ──────────────────────────────────── */
function initSearchTags() {
  document.querySelectorAll('.search-tag[data-q]').forEach(function (tag) {
    tag.addEventListener('click', function (e) {
      e.preventDefault();
      var q     = tag.dataset.q;
      var input = document.getElementById('navSearch');
      var clear = document.getElementById('searchClear');
      if (input) {
        input.value  = q;
        state.search = q.toLowerCase();
        if (clear) clear.classList.add('visible');
        renderFeed();
        var feedEl = document.getElementById('feedSection');
        if (feedEl) feedEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}
