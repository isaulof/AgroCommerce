/* AgroCommerce — Painel Administrativo
   js/admin.js
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

/* ── Stats ───────────────────────────────────────────────────── */
function renderStats() {
  var stores   = Storage.getStores();
  var products = Storage.getProducts().filter(function (p) { return p.active; });
  var users    = Storage.getUsers().filter(function (u) { return u.type !== 'admin'; });
  var reviews  = Storage.getReviews();

  var statsEl = document.getElementById('adminStats');
  if (!statsEl) return;

  statsEl.innerHTML = [
    { icon: 'fa-store',  color: 'green', num: stores.length,   label: 'Total de Lojas' },
    { icon: 'fa-box',    color: 'gold',  num: products.length, label: 'Produtos Ativos' },
    { icon: 'fa-users',  color: 'blue',  num: users.length,    label: 'Usuários' },
    { icon: 'fa-star',   color: 'green', num: reviews.length,  label: 'Avaliações' },
  ].map(function (card) {
    return '<div class="admin-stat-card reveal">' +
      '<div class="admin-stat-card-icon ' + card.color + '"><i class="fa-solid ' + card.icon + '"></i></div>' +
      '<div class="admin-stat-card-num">' + card.num + '</div>' +
      '<div class="admin-stat-card-label">' + card.label + '</div>' +
    '</div>';
  }).join('');
}

/* ── Stores Table ────────────────────────────────────────────── */
function renderStores() {
  var tbody = document.getElementById('storesTbody');
  if (!tbody) return;

  var stores = Storage.getStores();
  if (stores.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--gray-400);padding:20px">Nenhuma loja cadastrada.</td></tr>';
    return;
  }

  tbody.innerHTML = stores.map(function (store) {
    var owner = Storage.getUser(store.ownerId);
    return '<tr>' +
      '<td>' +
        '<div style="display:flex;align-items:center;gap:10px">' +
          (owner ? '<span class="avatar" style="width:32px;height:32px;font-size:.65rem;flex-shrink:0;background:' + owner.color + '">' + owner.initials + '</span>' : '') +
          '<div>' +
            '<div style="font-weight:600">' + store.name + '</div>' +
            '<div style="font-size:.75rem;color:var(--gray-400)">#' + store.id + '</div>' +
          '</div>' +
        '</div>' +
      '</td>' +
      '<td><span class="badge ' + Fmt.categoryColor(store.segmento) + '">' + Fmt.segmentoLabel(store.segmento) + '</span></td>' +
      '<td>' + (owner ? owner.name : '—') + '</td>' +
      '<td><span style="color:var(--gold-500)">' + Fmt.stars(store.rating) + '</span> <strong>' + store.rating.toFixed(1) + '</strong></td>' +
      '<td>' + store.totalReviews + '</td>' +
      '<td>' + (store.verified ?
        '<span class="badge badge-verified"><i class="fa-solid fa-circle-check"></i> Verificada</span>' :
        '<span class="badge badge-danger">Pendente</span>') +
      '</td>' +
    '</tr>';
  }).join('');
}

/* ── Products Table ──────────────────────────────────────────── */
function renderProducts() {
  var tbody = document.getElementById('productsTbody');
  if (!tbody) return;

  var products = Storage.getProducts().filter(function (p) { return p.active; });
  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--gray-400);padding:20px">Nenhum produto ativo.</td></tr>';
    return;
  }

  tbody.innerHTML = products.map(function (p) {
    var store = Storage.getStore(p.storeId);
    return '<tr>' +
      '<td style="font-weight:600;max-width:220px">' +
        '<a href="produto.html?id=' + p.id + '" style="color:var(--green-700);text-decoration:none">' +
          (p.title.length > 40 ? p.title.substring(0, 38) + '…' : p.title) +
        '</a>' +
      '</td>' +
      '<td><span class="badge ' + Fmt.categoryColor(p.category) + '">' + Fmt.categoryLabel(p.category) + '</span></td>' +
      '<td>' + (store ? store.name : '—') + '</td>' +
      '<td style="font-weight:700;color:var(--green-700)">' + Fmt.currency(p.price) + '</td>' +
      '<td>' + p.stock + ' ' + p.unit + '</td>' +
      '<td>' +
        '<span style="color:var(--gold-500)">' + Fmt.stars(p.rating) + '</span> ' +
        '<small>' + p.rating.toFixed(1) + ' (' + p.totalReviews + ')</small>' +
      '</td>' +
    '</tr>';
  }).join('');
}

/* ── Users Table ─────────────────────────────────────────────── */
function renderUsers() {
  var tbody = document.getElementById('usersTbody');
  if (!tbody) return;

  var users = Storage.getUsers().filter(function (u) { return u.type !== 'admin'; });
  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--gray-400);padding:20px">Nenhum usuário cadastrado.</td></tr>';
    return;
  }

  var typeLabels = { comprador: 'Comprador', lojista: 'Lojista' };

  tbody.innerHTML = users.map(function (u) {
    return '<tr>' +
      '<td>' +
        '<div style="display:flex;align-items:center;gap:10px">' +
          '<span class="avatar" style="width:32px;height:32px;font-size:.65rem;flex-shrink:0;background:' + u.color + '">' + u.initials + '</span>' +
          '<div>' +
            '<div style="font-weight:600">' + u.name + '</div>' +
            '<div style="font-size:.75rem;color:var(--gray-400)">' + u.email + '</div>' +
          '</div>' +
        '</div>' +
      '</td>' +
      '<td><span class="badge badge-' + (u.type === 'lojista' ? 'featured' : 'verified') + '">' + (typeLabels[u.type] || u.type) + '</span></td>' +
      '<td>' + u.city + ', ' + u.state + '</td>' +
      '<td style="text-align:center">' +
        (u.verified ?
          '<i class="fa-solid fa-circle-check" style="color:var(--green-500)"></i>' :
          '<i class="fa-regular fa-circle" style="color:var(--gray-300)"></i>') +
      '</td>' +
      '<td style="font-size:.8rem;color:var(--gray-500)">' + Fmt.date(u.createdAt) + '</td>' +
    '</tr>';
  }).join('');
}

/* ── Reviews Table ───────────────────────────────────────────── */
function renderReviews() {
  var tbody = document.getElementById('reviewsTbody');
  if (!tbody) return;

  var reviews = Storage.getReviews()
    .slice()
    .sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); })
    .slice(0, 10);

  if (reviews.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--gray-400);padding:20px">Nenhuma avaliação registrada.</td></tr>';
    return;
  }

  tbody.innerHTML = reviews.map(function (r) {
    var product = Storage.getProduct(r.productId);
    var stars   = Fmt.stars(r.rating);
    var comment = r.comment.length > 60 ? r.comment.substring(0, 58) + '…' : r.comment;
    return '<tr>' +
      '<td style="font-weight:600;max-width:180px">' +
        (product ? (product.title.length > 36 ? product.title.substring(0, 34) + '…' : product.title) : '#' + r.productId) +
      '</td>' +
      '<td>' + r.reviewerName + '</td>' +
      '<td><span style="color:var(--gold-500)">' + stars + '</span> <strong>' + r.rating + '</strong></td>' +
      '<td style="color:var(--gray-600);font-size:.85rem">' + comment + '</td>' +
      '<td style="font-size:.8rem;color:var(--gray-500)">' + Fmt.relativeDate(r.createdAt) + '</td>' +
    '</tr>';
  }).join('');
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

  /* Verificar se é admin (id 0) — apenas aviso, não bloqueia para demo */
  if (session !== 0) {
    Toast.show('Acesso restrito ao administrador. Exibindo em modo demo.', 'warning');
  }

  renderStats();
  renderStores();
  renderProducts();
  renderUsers();
  renderReviews();
  setupReveal();

  /* Login modal */
  var loginClose = document.getElementById('loginClose');
  if (loginClose) loginClose.addEventListener('click', function () { closeModal('loginModal'); });

  var navBtn = document.getElementById('navUserBtn');
  if (navBtn) navBtn.addEventListener('click', function () { renderLoginModal(); openModal('loginModal'); });

  /* Reset button */
  var btnReset = document.getElementById('btnReset');
  if (btnReset) {
    btnReset.addEventListener('click', function () {
      if (confirm('Confirma o reset de todos os dados mock? Esta ação não pode ser desfeita.')) {
        Storage.reset();
        Toast.show('Dados resetados com sucesso!', 'success');
        setTimeout(function () { window.location.reload(); }, 1200);
      }
    });
  }
});
