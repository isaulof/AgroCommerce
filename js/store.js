'use strict';

/* ── Estado da página ───────────────────────────────────────── */
var session = Storage.getSession();
var _storeId = null;
var _activeCategory = 'all';

/* ── Inicialização ──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  Storage.init();
  session = Storage.getSession();

  var rawId = Fmt.urlParam('id');
  _storeId = rawId ? parseInt(rawId, 10) : NaN;

  if (isNaN(_storeId) || _storeId <= 0) {
    window.location.href = 'marketplace.html';
    return;
  }

  var store = Storage.getStore(_storeId);
  if (!store) {
    window.location.href = 'marketplace.html';
    return;
  }

  var owner = Storage.getUser(store.ownerId);

  /* atualizar title e breadcrumb */
  document.title = 'AgroCommerce — ' + store.name;
  var breadEl = document.getElementById('breadcrumbLoja');
  if (breadEl) breadEl.textContent = store.name;

  updateCartBadge();
  renderNavUser();
  renderLojaHeader(store, owner);
  filterCategoryPillsForStore(store);
  renderFeed(_storeId);
  bindEvents(_storeId);
  setupScrollProgress();
  setupReveal();
});

/* ── Header da loja ─────────────────────────────────────────── */
function renderLojaHeader(store, owner) {
  var header = document.getElementById('lojaHeader');
  if (!header) return;

  var color    = owner ? owner.color : '#2E7D32';
  var initials = owner ? owner.initials : store.name.substring(0, 2).toUpperCase();
  var products = Storage.getProductsByStore(store.id);

  header.innerHTML =
    '<div class="loja-avatar-lg" style="background:' + color + '">' + initials + '</div>' +
    '<div class="loja-header-info">' +
      '<div class="loja-header-name">' +
        store.name +
        (store.verified
          ? ' <i class="fa-solid fa-circle-check" style="color:var(--green-400);font-size:1rem;vertical-align:middle"></i>'
          : '') +
      '</div>' +
      '<div class="loja-header-seg">' +
        '<i class="fa-solid fa-tag" style="margin-right:6px"></i>' + Fmt.segmentoLabel(store.segmento) +
      '</div>' +
      '<div class="loja-header-desc">' + (store.description || '') + '</div>' +
      '<div class="loja-header-stats">' +
        '<div class="loja-header-stat">' +
          '<strong>' +
            '<span class="stars stars-sm" style="font-size:.8rem">' + Fmt.stars(store.rating) + '</span>' +
            ' ' + store.rating.toFixed(1) +
          '</strong>' +
          '<span>Avaliação</span>' +
        '</div>' +
        '<div class="loja-header-stat">' +
          '<strong>' + store.totalReviews + '</strong>' +
          '<span>Avaliações</span>' +
        '</div>' +
        '<div class="loja-header-stat">' +
          '<strong>' + products.length + '</strong>' +
          '<span>Produtos</span>' +
        '</div>' +
      '</div>' +
    '</div>';
}

/* ── Mostrar apenas pills de categorias existentes na loja ───── */
function filterCategoryPillsForStore(store) {
  var products   = Storage.getProductsByStore(store.id);
  var categories = products.map(function (p) { return p.category; });
  var pillsEl    = document.getElementById('storeCategoryPills');
  if (!pillsEl) return;

  /* esconder pills de categorias que a loja não possui */
  pillsEl.querySelectorAll('.filter-pill[data-cat]').forEach(function (pill) {
    var cat = pill.dataset.cat;
    if (cat !== 'all' && categories.indexOf(cat) < 0) {
      pill.style.display = 'none';
    }
  });
}

/* ── Renderizar feed da loja ────────────────────────────────── */
function renderFeed(storeId) {
  var grid    = document.getElementById('feedGrid');
  var countEl = document.getElementById('feedCount');
  if (!grid) return;

  var products = Storage.getProductsByStore(storeId);

  if (_activeCategory !== 'all') {
    products = products.filter(function (p) { return p.category === _activeCategory; });
  }

  if (countEl) {
    countEl.innerHTML = products.length > 0
      ? '<strong>' + products.length + '</strong> produto' + (products.length !== 1 ? 's' : '') + ' nesta loja'
      : '';
  }

  if (products.length === 0) {
    grid.innerHTML = '<div class="empty-state">' +
      '<i class="fa-solid fa-box-open"></i>' +
      '<h3>Nenhum produto nesta categoria</h3>' +
      '<p>Selecione outra categoria ou veja todos os produtos.</p>' +
      '</div>';
    return;
  }

  grid.innerHTML = products.map(function (p, i) { return renderCard(p, i); }).join('');

  /* favs */
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

  /* adicionar ao carrinho */
  grid.querySelectorAll('.btn-add-cart').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var pid     = parseInt(btn.dataset.pid, 10);
      var product = Storage.getProduct(pid);
      if (product) addToCartFromCard(product);
    });
  });

  setupReveal();
}

/* ── Renderizar card de produto ─────────────────────────────── */
function renderCard(p, i) {
  var store    = Storage.getStore(p.storeId);
  var owner    = store ? Storage.getUser(store.ownerId) : null;
  var color    = owner ? owner.color : '#2E7D32';
  var initials = owner ? owner.initials : (store ? store.name.substring(0, 2).toUpperCase() : 'AG');
  var imgSrc   = (p.images && p.images.length > 0) ? p.images[0] : 'https://placehold.co/700x500/e8f5e9/2E7D32?text=Produto';
  var isFav    = Storage.isFav(p.id);
  var stagger  = 'stagger-' + ((i % 5) + 1);

  return '<div class="product-card reveal ' + stagger + '">' +
    '<a href="produto.html?id=' + p.id + '" style="display:block;text-decoration:none;color:inherit">' +
      '<div class="product-card-img">' +
        '<img src="' + imgSrc + '" alt="' + p.title + '" loading="lazy">' +
        '<div class="product-card-badges">' +
          '<span class="badge ' + Fmt.categoryColor(p.category) + '"><i class="fa-solid ' + Fmt.categoryIcon(p.category) + '"></i> ' + Fmt.categoryLabel(p.category) + '</span>' +
          (p.featured ? '<span class="badge badge-featured"><i class="fa-solid fa-star"></i> Destaque</span>' : '') +
        '</div>' +
        '<button class="product-card-fav' + (isFav ? ' active' : '') + '" data-pid="' + p.id + '" title="Favoritar" aria-label="Favoritar">' +
          '<i class="fa-' + (isFav ? 'solid' : 'regular') + ' fa-heart"></i>' +
        '</button>' +
      '</div>' +
      '<div class="product-card-body">' +
        '<div class="product-card-title">' + p.title + '</div>' +
        '<div>' +
          '<div class="product-card-price">' + Fmt.currency(p.price) + ' <span>/ ' + p.unit + '</span></div>' +
          '<div class="product-card-qty"><i class="fa-solid fa-boxes-stacked" style="margin-right:4px;color:var(--gray-400)"></i> ' + p.stock + ' em estoque</div>' +
        '</div>' +
        '<div class="product-card-meta">' +
          '<span class="stars stars-sm">' + Fmt.stars(p.rating) + '</span>' +
          '<span style="font-size:.7rem;color:var(--gray-600);font-weight:600;margin-left:2px">' + p.rating.toFixed(1) + '</span>' +
          '<span style="font-size:.7rem;color:var(--gray-400);margin-left:4px">(' + p.totalReviews + ')</span>' +
          '<span style="margin-left:auto;font-size:.7rem;color:var(--gray-400)">' + Fmt.relativeDate(p.createdAt) + '</span>' +
        '</div>' +
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
          '<span><i class="fa-solid fa-location-dot" style="font-size:.6rem"></i> ' + u.city + ', ' + u.state + '</span>' +
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

/* ── Reveal ─────────────────────────────────────────────────── */
function setupReveal() {
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal:not(.visible)').forEach(function (el) { obs.observe(el); });
}

/* ── Eventos ────────────────────────────────────────────────── */
function bindEvents(storeId) {
  /* pills de categoria */
  var pillsEl = document.getElementById('storeCategoryPills');
  if (pillsEl) {
    pillsEl.querySelectorAll('.filter-pill[data-cat]').forEach(function (pill) {
      pill.addEventListener('click', function () {
        pillsEl.querySelectorAll('.filter-pill[data-cat]').forEach(function (p) { p.classList.remove('active'); });
        pill.classList.add('active');
        _activeCategory = pill.dataset.cat;
        renderFeed(storeId);
      });
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

  /* fechar clicando no overlay */
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

  /* busca na nav (filtra dentro da loja) */
  var searchEl = document.getElementById('navSearch');
  var clearEl  = document.getElementById('searchClear');
  var _timer   = null;
  if (searchEl) {
    searchEl.addEventListener('input', function () {
      var val = searchEl.value.trim();
      if (clearEl) clearEl.classList.toggle('visible', val.length > 0);
      clearTimeout(_timer);
      _timer = setTimeout(function () {
        renderFeedFiltered(storeId, val);
      }, 260);
    });
  }
  if (clearEl) {
    clearEl.addEventListener('click', function () {
      if (searchEl) searchEl.value = '';
      clearEl.classList.remove('visible');
      renderFeed(storeId);
    });
  }
}

/* ── Feed com busca textual (apenas dentro da loja) ─────────── */
function renderFeedFiltered(storeId, query) {
  var grid    = document.getElementById('feedGrid');
  var countEl = document.getElementById('feedCount');
  if (!grid) return;

  var products = Storage.getProductsByStore(storeId);

  if (_activeCategory !== 'all') {
    products = products.filter(function (p) { return p.category === _activeCategory; });
  }

  if (query.length > 0) {
    var q = query.toLowerCase();
    products = products.filter(function (p) {
      return p.title.toLowerCase().indexOf(q) >= 0 ||
             (p.description && p.description.toLowerCase().indexOf(q) >= 0);
    });
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
      '<p>Tente outro termo de busca.</p>' +
      '</div>';
    return;
  }

  grid.innerHTML = products.map(function (p, i) { return renderCard(p, i); }).join('');

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

  grid.querySelectorAll('.btn-add-cart').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var pid     = parseInt(btn.dataset.pid, 10);
      var product = Storage.getProduct(pid);
      if (product) addToCartFromCard(product);
    });
  });

  setupReveal();
}
