/* AgroCommerce — Painel do Lojista
   js/lojista.js
*/
'use strict';

var session = Storage.getSession();

/* ── Nav & Login Modal ───────────────────────────────────────── */
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

function renderLoginModal() {
  var list = document.getElementById('loginUserList');
  if (!list) return;
  var users = Storage.getUsers().filter(function (u) { return u.type !== 'admin'; });
  list.innerHTML = users.map(function (u) {
    return '<div class="user-option' + (session === u.id ? ' selected' : '') + '" data-uid="' + u.id + '">' +
      '<span class="avatar" style="width:44px;height:44px;font-size:.85rem;background:' + u.color + '">' + u.initials + '</span>' +
      '<div style="flex:1"><div class="user-option-name">' + u.name + '</div>' +
      '<div class="user-option-meta"><span>' + ({ comprador: 'Comprador', lojista: 'Lojista' }[u.type] || u.type) + '</span>' +
      '<span><i class="fa-solid fa-location-dot" style="font-size:.6rem"></i> ' + u.city + ', ' + u.state + '</span></div></div>' +
      '<i class="fa-solid fa-circle-check user-option-check"></i></div>';
  }).join('');
  list.querySelectorAll('.user-option').forEach(function (el) {
    el.addEventListener('click', function () {
      session = parseInt(el.dataset.uid, 10);
      Storage.setSession(session);
      renderNavUser();
      updateCartBadge();
      closeModal('loginModal');
      Toast.show('Bem-vindo, ' + Storage.getUser(session).name.split(' ')[0] + '!', 'success');
      checkAccess();
    });
  });
}

function setupScrollProgress() {
  var bar = document.getElementById('scrollProgress');
  if (!bar) return;
  window.addEventListener('scroll', function () {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = max > 0 ? (window.scrollY / max * 100) + '%' : '0%';
  }, { passive: true });
}

/* ── Access Check ────────────────────────────────────────────── */
function checkAccess() {
  var content = document.getElementById('lojistaContent');
  if (!content) return;

  if (session === null) {
    renderLoginModal();
    openModal('loginModal');
    return;
  }

  var user = Storage.getUser(session);
  if (!user || user.type !== 'lojista') {
    content.innerHTML =
      '<div style="text-align:center;padding:64px 24px;color:var(--gray-500)">' +
        '<i class="fa-solid fa-lock" style="font-size:3rem;margin-bottom:16px;display:block;color:var(--red-400,#ef5350)"></i>' +
        '<h2 style="font-family:Montserrat,sans-serif;font-size:1.4rem;margin-bottom:8px;color:var(--gray-700)">Acesso Restrito</h2>' +
        '<p style="font-size:.9rem;margin-bottom:24px">Esta área é exclusiva para lojistas cadastrados na plataforma.</p>' +
        '<a href="marketplace.html" class="btn btn-primary btn-md">Ir para o Marketplace</a>' +
      '</div>';
    return;
  }

  renderLojista(user);
}

/* ── Render Lojista ──────────────────────────────────────────── */
function renderLojista(user) {
  var store = Storage.getStore(user.storeId);
  if (!store) {
    document.getElementById('lojistaContent').innerHTML =
      '<p style="color:var(--red-500);padding:24px">Loja não encontrada para este usuário.</p>';
    return;
  }

  var products = Storage.getProducts().filter(function (p) { return p.storeId === store.id; });
  var activeCount = products.filter(function (p) { return p.active; }).length;

  /* ── Tabs — injetadas na barra fixa fora do lojista-wrap ─── */
  var tabsBar = document.getElementById('lojistaTabsBar');
  tabsBar.innerHTML =
    '<div class="lojista-tabs">' +
      '<button class="lojista-tab active" id="tabProdutos" data-tab="produtos">' +
        '<i class="fa-solid fa-box"></i> Meus Produtos' +
      '</button>' +
      '<button class="lojista-tab" id="tabAnalytics" data-tab="analytics">' +
        '<i class="fa-solid fa-chart-line"></i> AgroInsights' +
        '<span class="ai-badge-premium">PREMIUM</span>' +
      '</button>' +
    '</div>';
  tabsBar.style.display = 'block';

  /* ── Conteúdo de Produtos ────────────────────────────────── */
  var prodHtml =
    /* Store header */
    '<div class="loja-header">' +
      '<div class="loja-avatar-lg" style="background:' + user.color + '">' + user.initials + '</div>' +
      '<div class="loja-header-info">' +
        '<div class="loja-header-name">' + store.name +
          (store.verified ? ' <span class="badge badge-verified" style="font-size:.65rem"><i class="fa-solid fa-circle-check"></i> Verificada</span>' : '') +
        '</div>' +
        '<div class="loja-header-seg">' + Fmt.segmentoLabel(store.segmento) + '</div>' +
        '<div class="loja-header-desc">' + store.description + '</div>' +
        '<div class="loja-header-stats">' +
          '<div class="loja-header-stat"><strong>' + products.length + '</strong><span>Produtos</span></div>' +
          '<div class="loja-header-stat"><strong>' + store.totalReviews + '</strong><span>Avaliações</span></div>' +
          '<div class="loja-header-stat"><strong>' + store.rating.toFixed(1) + '</strong><span>Rating</span></div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    /* Stats */
    '<div class="admin-stats" style="margin:24px 0">' +
      statCard('green', 'fa-box-open', activeCount, 'Produtos ativos') +
      statCard('gold', 'fa-star', store.rating.toFixed(1), 'Avaliação média') +
      statCard('blue', 'fa-comment-dots', store.totalReviews, 'Total de avaliações') +
    '</div>' +

    /* Products section */
    '<div class="admin-section reveal">' +
      '<div class="admin-section-header">' +
        '<h2 class="admin-section-title"><i class="fa-solid fa-box" style="color:var(--green-600)"></i> Meus Produtos</h2>' +
        '<button class="btn btn-primary btn-sm" id="btnAddProduct"><i class="fa-solid fa-plus"></i> Adicionar Produto</button>' +
      '</div>' +
      (products.length === 0 ?
        '<div style="padding:32px;text-align:center;color:var(--gray-400);font-size:.875rem">Nenhum produto cadastrado. Adicione seu primeiro produto!</div>' :
        '<div style="overflow-x:auto"><table class="data-table" id="productsTable">' +
          '<thead><tr>' +
            '<th>Produto</th><th>Categoria</th><th>Preço</th><th>Estoque</th><th>Status</th><th>Ações</th>' +
          '</tr></thead>' +
          '<tbody id="productsTbody">' + renderProductRows(products) + '</tbody>' +
        '</table></div>'
      ) +
    '</div>';

  var html =
    '<div id="tabContentProdutos">' + prodHtml + '</div>' +
    '<div id="tabContentAnalytics" style="display:none"></div>';

  document.getElementById('lojistaContent').innerHTML = html;

  /* ── Tab switching ─────────────────────────────────────────── */
  document.getElementById('tabAnalytics').addEventListener('click', function () {
    document.getElementById('tabContentProdutos').style.display = 'none';
    document.getElementById('tabContentAnalytics').style.display = 'block';
    this.classList.add('active');
    document.getElementById('tabProdutos').classList.remove('active');
    /* Inicializar AgroInsights apenas se ainda não foi renderizado */
    if (!document.querySelector('.ai-wrap')) {
      var allProducts = Storage.getProducts();
      var allReviews  = Storage.getReviews ? Storage.getReviews() : [];
      var allOrders   = Storage.getOrders  ? Storage.getOrders()  : [];
      var storeProds  = allProducts.filter(function (p) { return p.storeId === store.id; });
      AgroInsights.init(store.id, storeProds, allReviews, allOrders);
    }
  });

  document.getElementById('tabProdutos').addEventListener('click', function () {
    document.getElementById('tabContentProdutos').style.display = 'block';
    document.getElementById('tabContentAnalytics').style.display = 'none';
    this.classList.add('active');
    document.getElementById('tabAnalytics').classList.remove('active');
  });

  /* Bind Add Product */
  var btnAdd = document.getElementById('btnAddProduct');
  if (btnAdd) btnAdd.addEventListener('click', function () { openProductModal(null, store); });

  setupReveal();
}

function statCard(color, icon, num, label) {
  return '<div class="admin-stat-card">' +
    '<div class="admin-stat-card-icon ' + color + '"><i class="fa-solid ' + icon + '"></i></div>' +
    '<div class="admin-stat-card-num">' + num + '</div>' +
    '<div class="admin-stat-card-label">' + label + '</div>' +
  '</div>';
}

function renderProductRows(products) {
  return products.map(function (p) {
    return '<tr id="prow-' + p.id + '">' +
      '<td style="font-weight:600;max-width:200px">' + p.title + '</td>' +
      '<td><span class="badge ' + Fmt.categoryColor(p.category) + '">' + Fmt.categoryLabel(p.category) + '</span></td>' +
      '<td style="font-weight:700;color:var(--green-700)">' + Fmt.currency(p.price) + '</td>' +
      '<td>' + p.stock + ' ' + p.unit + '</td>' +
      '<td>' +
        (p.active ?
          '<span class="badge badge-success">Ativo</span>' :
          '<span class="badge badge-danger">Inativo</span>') +
      '</td>' +
      '<td>' +
        '<div style="display:flex;gap:6px;flex-wrap:nowrap">' +
          '<button class="btn btn-outline btn-sm" onclick="editProduct(' + p.id + ')"><i class="fa-solid fa-pen"></i> Editar</button>' +
          '<button class="btn btn-ghost btn-sm" onclick="toggleActive(' + p.id + ')">' +
            (p.active ? '<i class="fa-solid fa-eye-slash"></i> Desativar' : '<i class="fa-solid fa-eye"></i> Ativar') +
          '</button>' +
        '</div>' +
      '</td>' +
    '</tr>';
  }).join('');
}

/* ── Toggle Active ───────────────────────────────────────────── */
window.toggleActive = function (productId) {
  var product = Storage.getProduct(productId);
  if (!product) return;
  product.active = !product.active;
  Storage.saveProduct(product);
  Toast.show(product.active ? 'Produto ativado.' : 'Produto desativado.', 'info');
  refreshProductTable();
};

function refreshProductTable() {
  var user = Storage.getUser(session);
  if (!user) return;
  var products = Storage.getProducts().filter(function (p) { return p.storeId === user.storeId; });
  var tbody = document.getElementById('productsTbody');
  if (tbody) tbody.innerHTML = renderProductRows(products);
}

/* ── Edit Product ────────────────────────────────────────────── */
window.editProduct = function (productId) {
  var user  = Storage.getUser(session);
  var store = user ? Storage.getStore(user.storeId) : null;
  var p     = Storage.getProduct(productId);
  if (!p || !store) return;
  openProductModal(p, store);
};

/* ── Product Modal ───────────────────────────────────────────── */
function openProductModal(product, store) {
  var titleEl = document.getElementById('productModalTitle');
  var idEl    = document.getElementById('pfProductId');
  var titleIn = document.getElementById('pfTitle');
  var catIn   = document.getElementById('pfCategory');
  var unitIn  = document.getElementById('pfUnit');
  var priceIn = document.getElementById('pfPrice');
  var stockIn = document.getElementById('pfStock');
  var descIn  = document.getElementById('pfDesc');

  if (product) {
    titleEl.textContent = 'Editar Produto';
    idEl.value    = product.id;
    titleIn.value = product.title;
    catIn.value   = product.category;
    unitIn.value  = product.unit;
    priceIn.value = product.price;
    stockIn.value = product.stock;
    descIn.value  = product.description || '';
  } else {
    titleEl.textContent = 'Novo Produto';
    idEl.value    = '';
    titleIn.value = '';
    catIn.value   = '';
    unitIn.value  = '';
    priceIn.value = '';
    stockIn.value = '';
    descIn.value  = '';
  }

  /* Unbind previous save handler to avoid duplicates */
  var saveBtn = document.getElementById('btnProductSave');
  var newSave = saveBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newSave, saveBtn);

  newSave.addEventListener('click', function () {
    saveProduct(store);
  });

  openModal('productModal');
}

function saveProduct(store) {
  var title = document.getElementById('pfTitle').value.trim();
  var cat   = document.getElementById('pfCategory').value;
  var unit  = document.getElementById('pfUnit').value.trim();
  var price = parseFloat(document.getElementById('pfPrice').value);
  var stock = parseInt(document.getElementById('pfStock').value, 10);
  var desc  = document.getElementById('pfDesc').value.trim();
  var idVal = document.getElementById('pfProductId').value;

  if (!title || !cat || !unit || isNaN(price) || isNaN(stock)) {
    Toast.show('Preencha todos os campos obrigatórios.', 'error');
    return;
  }

  var isEdit  = idVal !== '';
  var products = Storage.getProducts();
  var newId    = isEdit ? parseInt(idVal, 10) : Math.max(0, ...products.map(function (p) { return p.id; })) + 1;

  var existing = isEdit ? Storage.getProduct(newId) : null;

  var product = Object.assign({}, existing || {}, {
    id:          newId,
    storeId:     store.id,
    category:    cat,
    title:       title,
    description: desc,
    price:       price,
    unit:        unit,
    stock:       stock,
    active:      existing ? existing.active : true,
    featured:    existing ? existing.featured : false,
    images:      existing && existing.images ? existing.images : ['https://placehold.co/700x500/e8f5e9/2E7D32?text=' + encodeURIComponent(title)],
    rating:      existing ? existing.rating : 0,
    totalReviews: existing ? existing.totalReviews : 0,
    createdAt:   existing ? existing.createdAt : new Date().toISOString(),
  });

  Storage.saveProduct(product);
  closeModal('productModal');
  Toast.show(isEdit ? 'Produto atualizado!' : 'Produto adicionado!', 'success');
  refreshProductTable();
}

/* ── Reveal ──────────────────────────────────────────────────── */
function setupReveal() {
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.06 });
  document.querySelectorAll('.reveal:not(.visible)').forEach(function (el) { obs.observe(el); });
}

/* ── Init ────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  Storage.init();
  session = Storage.getSession();

  setupScrollProgress();
  renderNavUser();
  updateCartBadge();

  /* Login modal close */
  var loginClose = document.getElementById('loginClose');
  if (loginClose) loginClose.addEventListener('click', function () { closeModal('loginModal'); });

  /* Product modal close */
  var productClose = document.getElementById('productModalClose');
  if (productClose) productClose.addEventListener('click', function () { closeModal('productModal'); });

  var btnCancel = document.getElementById('btnProductCancel');
  if (btnCancel) btnCancel.addEventListener('click', function () { closeModal('productModal'); });

  /* Nav user button */
  var navBtn = document.getElementById('navUserBtn');
  if (navBtn) navBtn.addEventListener('click', function () { renderLoginModal(); openModal('loginModal'); });

  checkAccess();
});
