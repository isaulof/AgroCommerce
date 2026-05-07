/* AgroCommerce — Perfil do Usuário
   js/profile.js
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
      renderProfile();
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

/* ── Profile Header ──────────────────────────────────────────── */
function renderProfileHeader(user) {
  var headerEl = document.getElementById('profileHeader');
  if (!headerEl) return;

  var typeLabels = { comprador: 'Comprador', lojista: 'Lojista', admin: 'Administrador' };
  var typeLabel  = typeLabels[user.type] || user.type;

  headerEl.innerHTML =
    '<div class="profile-avatar">' +
      '<span class="avatar" style="width:80px;height:80px;font-size:1.5rem;background:' + user.color + '">' + user.initials + '</span>' +
      (user.verified ? '<span class="profile-verified-badge" title="Verificado"><i class="fa-solid fa-check"></i></span>' : '') +
    '</div>' +
    '<div class="profile-info">' +
      '<h1 class="profile-name">' + user.name + '</h1>' +
      '<div class="profile-type">' +
        '<span class="badge badge-' + (user.type === 'lojista' ? 'featured' : 'verified') + '">' + typeLabel + '</span>' +
        (user.verified ? ' <span class="badge badge-verified"><i class="fa-solid fa-circle-check"></i> Verificado</span>' : '') +
      '</div>' +
      (user.bio ? '<p class="profile-bio">' + user.bio + '</p>' : '') +
      '<div class="profile-contact">' +
        (user.email ? '<span class="profile-contact-item"><i class="fa-solid fa-envelope"></i> ' + user.email + '</span>' : '') +
        (user.phone ? '<span class="profile-contact-item"><i class="fa-solid fa-phone"></i> ' + user.phone + '</span>' : '') +
        (user.city ? '<span class="profile-contact-item"><i class="fa-solid fa-location-dot"></i> ' + user.city + ', ' + user.state + '</span>' : '') +
      '</div>' +
      '<div class="profile-stats">' +
        '<div class="profile-stat"><span style="color:var(--gold-500)">' + Fmt.stars(user.rating) + '</span><span>' + user.rating.toFixed(1) + '</span></div>' +
        '<div class="profile-stat"><strong>' + user.totalReviews + '</strong><span>avaliações</span></div>' +
        '<div class="profile-stat"><strong>' + Fmt.date(user.createdAt) + '</strong><span>membro desde</span></div>' +
      '</div>' +
    '</div>' +
    (user.type === 'lojista' ?
      '<div style="margin-top:16px"><a href="lojista.html" class="btn btn-gold btn-md"><i class="fa-solid fa-store"></i> Ir para Painel da Loja</a></div>' : '');
}

/* ── Profile Sidebar ─────────────────────────────────────────── */
function renderProfileSidebar(user) {
  var sidebar = document.getElementById('profileSidebar');
  if (!sidebar) return;

  var typeLabels = { comprador: 'Comprador', lojista: 'Lojista', admin: 'Administrador' };

  sidebar.innerHTML =
    '<h2 class="profile-panel-title"><i class="fa-solid fa-circle-info" style="color:var(--green-600)"></i> Informações</h2>' +
    '<div style="display:flex;flex-direction:column;gap:12px;font-size:.875rem">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--gray-100)">' +
        '<span style="color:var(--gray-500)">Tipo de conta</span>' +
        '<strong>' + (typeLabels[user.type] || user.type) + '</strong>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--gray-100)">' +
        '<span style="color:var(--gray-500)">Cidade</span>' +
        '<strong>' + (user.city || '—') + ', ' + (user.state || '') + '</strong>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--gray-100)">' +
        '<span style="color:var(--gray-500)">Membro desde</span>' +
        '<strong>' + Fmt.date(user.createdAt) + '</strong>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--gray-100)">' +
        '<span style="color:var(--gray-500)">Avaliações</span>' +
        '<strong>' + user.totalReviews + '</strong>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0">' +
        '<span style="color:var(--gray-500)">Nota média</span>' +
        '<strong style="color:var(--gold-500)">' + Fmt.stars(user.rating) + ' ' + user.rating.toFixed(1) + '</strong>' +
      '</div>' +
    '</div>' +
    '<div style="margin-top:20px">' +
      '<button class="btn btn-ghost btn-sm btn-full" id="btnTrocarPerfil" style="color:var(--gray-500)">' +
        '<i class="fa-solid fa-arrow-right-arrow-left"></i> Trocar perfil' +
      '</button>' +
    '</div>';

  var btnTrocar = document.getElementById('btnTrocarPerfil');
  if (btnTrocar) {
    btnTrocar.addEventListener('click', function () {
      renderLoginModal();
      openModal('loginModal');
    });
  }
}

/* ── Orders ──────────────────────────────────────────────────── */
function renderOrders() {
  var tabEl = document.getElementById('tabOrders');
  if (!tabEl) return;

  var orders = Storage.getOrdersByBuyer(session);

  if (orders.length === 0) {
    tabEl.innerHTML =
      '<div style="text-align:center;padding:48px 24px;color:var(--gray-400)">' +
        '<i class="fa-solid fa-bag-shopping" style="font-size:2.5rem;margin-bottom:12px;display:block;opacity:.3"></i>' +
        '<p style="font-size:.9rem;margin-bottom:16px">Você ainda não fez nenhum pedido.</p>' +
        '<a href="marketplace.html" class="btn btn-primary btn-sm">Explorar produtos</a>' +
      '</div>';
    return;
  }

  /* Most recent first */
  var sorted = orders.slice().sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });

  tabEl.innerHTML = sorted.map(function (order) {
    var thumbsHtml = order.items.slice(0, 4).map(function (item) {
      return '<img class="order-card-item-img" src="' +
        (item.image || 'https://placehold.co/44x44/e8f5e9/2E7D32?text=P') +
        '" alt="' + item.title + '" title="' + item.title + '">';
    }).join('');
    if (order.items.length > 4) {
      thumbsHtml += '<span style="font-size:.75rem;color:var(--gray-500);align-self:center">+' + (order.items.length - 4) + '</span>';
    }

    return '<div class="order-card reveal">' +
      '<div class="order-card-header">' +
        '<div>' +
          '<div class="order-card-id">Pedido #' + order.id + '</div>' +
          '<div class="order-card-date">' + Fmt.date(order.createdAt) + '</div>' +
        '</div>' +
        '<span class="badge ' + Fmt.orderStatusClass(order.status) + '">' + Fmt.orderStatus(order.status) + '</span>' +
      '</div>' +
      '<div class="order-card-items">' + thumbsHtml + '</div>' +
      '<div class="order-card-footer">' +
        '<span style="color:var(--gray-500);font-size:.8rem">' +
          order.items.length + ' item' + (order.items.length !== 1 ? 's' : '') +
          ' &middot; ' + order.paymentMethod +
        '</span>' +
        '<div style="display:flex;align-items:center;gap:10px">' +
          '<span class="badge ' + Fmt.orderStatusClass(order.status) + '">' + Fmt.orderStatus(order.status) + '</span>' +
          '<strong class="order-card-total">' + Fmt.currency(order.totalValue) + '</strong>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');

  setupReveal();
}

/* ── Render All ──────────────────────────────────────────────── */
function renderProfile() {
  if (session === null) return;
  var user = Storage.getUser(session);
  if (!user) return;

  renderProfileHeader(user);
  renderProfileSidebar(user);
  renderOrders();
}

/* ── Reveal Animation ────────────────────────────────────────── */
function setupReveal() {
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.06 });
  document.querySelectorAll('.reveal:not(.visible)').forEach(function (el) { obs.observe(el); });
}

/* ── Tabs ────────────────────────────────────────────────────── */
function setupTabs() {
  var btnOrders = document.getElementById('tabBtnOrders');
  var btnFavs   = document.getElementById('tabBtnFavs');
  var tabOrders = document.getElementById('tabOrders');
  var tabFavs   = document.getElementById('tabFavs');

  if (btnOrders) {
    btnOrders.addEventListener('click', function () {
      tabOrders.style.display = '';
      tabFavs.style.display   = 'none';
      btnOrders.style.borderBottom = '2px solid var(--green-600,#388e3c)';
      btnOrders.style.color        = 'var(--green-700,#2e7d32)';
      btnOrders.style.fontWeight   = '700';
      btnFavs.style.borderBottom   = '';
      btnFavs.style.color          = '';
      btnFavs.style.fontWeight     = '';
    });
  }
  if (btnFavs) {
    btnFavs.addEventListener('click', function () {
      tabFavs.style.display   = '';
      tabOrders.style.display = 'none';
      btnFavs.style.borderBottom = '2px solid var(--green-600,#388e3c)';
      btnFavs.style.color        = 'var(--green-700,#2e7d32)';
      btnFavs.style.fontWeight   = '700';
      btnOrders.style.borderBottom = '';
      btnOrders.style.color        = '';
      btnOrders.style.fontWeight   = '';
    });
  }
}

/* ── Init ────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  Storage.init();
  session = Storage.getSession();

  setupScrollProgress();
  renderNavUser();
  updateCartBadge();
  setupTabs();

  var closeBtn = document.getElementById('loginClose');
  if (closeBtn) closeBtn.addEventListener('click', function () { closeModal('loginModal'); });

  var navBtn = document.getElementById('navUserBtn');
  if (navBtn) navBtn.addEventListener('click', function () { renderLoginModal(); openModal('loginModal'); });

  if (session === null) {
    renderLoginModal();
    openModal('loginModal');
  } else {
    renderProfile();
  }
});
