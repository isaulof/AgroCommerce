'use strict';

var session = Storage.getSession();

/* ─── Nav / Login ─────────────────────────────────────────── */
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
      '<div class="user-option-meta"><span>' + ({ comprador: 'Comprador', lojista: 'Lojista' }[u.type] || u.type) + '</span><span><i class="fa-solid fa-location-dot" style="font-size:.6rem"></i> ' + u.city + ', ' + u.state + '</span></div></div>' +
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

function setupLoginBtn() {
  var btn = document.getElementById('navUserBtn');
  if (btn) {
    btn.addEventListener('click', function () {
      renderLoginModal();
      openModal('loginModal');
    });
  }
  var closeBtn = document.getElementById('loginClose');
  if (closeBtn) {
    closeBtn.addEventListener('click', function () { closeModal('loginModal'); });
  }
  var overlay = document.getElementById('loginModal');
  if (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal('loginModal');
    });
  }
}

/* ─── Scroll Progress ─────────────────────────────────────── */
function setupScrollProgress() {
  var bar = document.getElementById('scrollProgress');
  if (!bar) return;
  window.addEventListener('scroll', function () {
    var scrolled = window.scrollY;
    var total    = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (total > 0 ? (scrolled / total) * 100 : 0) + '%';
  }, { passive: true });
}

/* ─── Reveal ──────────────────────────────────────────────── */
function setupReveal() {
  var els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  els.forEach(function (el) { obs.observe(el); });
}

/* ─── Nav Search ──────────────────────────────────────────── */
function setupNavSearch() {
  var input = document.getElementById('navSearch');
  var clear = document.getElementById('searchClear');
  if (!input) return;
  input.addEventListener('input', function () {
    if (clear) clear.style.display = input.value ? 'flex' : 'none';
  });
  if (clear) {
    clear.style.display = 'none';
    clear.addEventListener('click', function () {
      input.value = '';
      clear.style.display = 'none';
      input.focus();
    });
  }
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && input.value.trim()) {
      window.location.href = 'marketplace.html?q=' + encodeURIComponent(input.value.trim());
    }
  });
}

/* ─── Renderizar Carrinho ─────────────────────────────────── */
function renderCart() {
  var cart      = Storage.getCart();
  var emptyEl   = document.getElementById('cartEmpty');
  var gridEl    = document.getElementById('cartGrid');
  var itemsEl   = document.getElementById('cartItems');
  var countEl   = document.getElementById('cartCount');
  var subtotalEl= document.getElementById('summarySubtotal');
  var totalEl   = document.getElementById('summaryTotal');

  var totalItems = cart.reduce(function (n, c) { return n + c.quantity; }, 0);

  if (countEl) {
    countEl.textContent = totalItems > 0
      ? '(' + totalItems + ' ' + (totalItems === 1 ? 'item' : 'itens') + ')'
      : '';
  }

  if (!cart.length) {
    if (emptyEl) emptyEl.style.display = 'block';
    if (gridEl)  gridEl.style.display  = 'none';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';
  if (gridEl)  gridEl.style.display  = 'grid';

  /* Renderizar itens */
  if (itemsEl) {
    itemsEl.innerHTML = cart.map(function (item) {
      var imgSrc = item.image || 'https://placehold.co/80x80/e8f5e9/2E7D32?text=Produto';
      var lineTotal = item.price * item.quantity;
      return '<div class="cart-item reveal" data-pid="' + item.productId + '">' +
        '<img class="cart-item-img" src="' + imgSrc + '" alt="' + item.title + '" onerror="this.src=\'https://placehold.co/80x80/e8f5e9/2E7D32?text=Produto\'">' +
        '<div class="cart-item-info">' +
          '<div class="cart-item-store"><i class="fa-solid fa-store" style="margin-right:.3rem"></i>' + (item.storeName || '') + '</div>' +
          '<div class="cart-item-title">' +
            '<a href="produto.html?id=' + item.productId + '" style="color:inherit;text-decoration:none">' + item.title + '</a>' +
          '</div>' +
          '<div>' +
            '<span class="cart-item-price">' + Fmt.currency(lineTotal) + '</span>' +
            '<span class="cart-item-unit">(' + Fmt.currency(item.price) + ' / ' + item.unit + ')</span>' +
          '</div>' +
        '</div>' +
        '<div class="cart-item-controls">' +
          '<div class="cart-qty">' +
            '<button class="cart-qty-btn btn-minus" data-pid="' + item.productId + '" aria-label="Diminuir">' +
              '<i class="fa-solid fa-minus"></i>' +
            '</button>' +
            '<span class="cart-qty-num">' + item.quantity + '</span>' +
            '<button class="cart-qty-btn btn-plus" data-pid="' + item.productId + '" aria-label="Aumentar">' +
              '<i class="fa-solid fa-plus"></i>' +
            '</button>' +
          '</div>' +
          '<button class="cart-item-remove" data-pid="' + item.productId + '" aria-label="Remover item">' +
            '<i class="fa-solid fa-trash-can"></i>' +
          '</button>' +
        '</div>' +
      '</div>';
    }).join('');

    /* Eventos dos botões de quantidade e remoção */
    itemsEl.querySelectorAll('.btn-minus').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var pid  = parseInt(btn.dataset.pid, 10);
        var item = Storage.getCart().find(function (c) { return c.productId === pid; });
        if (!item) return;
        if (item.quantity <= 1) {
          Storage.removeFromCart(pid);
          Toast.show('Item removido do carrinho.', 'info');
        } else {
          Storage.updateCartItem(pid, item.quantity - 1);
        }
        renderCart();
        updateCartBadge();
      });
    });

    itemsEl.querySelectorAll('.btn-plus').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var pid  = parseInt(btn.dataset.pid, 10);
        var item = Storage.getCart().find(function (c) { return c.productId === pid; });
        if (!item) return;
        var product = Storage.getProduct(pid);
        var maxQty  = product ? product.stock : 999;
        if (item.quantity >= maxQty) {
          Toast.show('Quantidade máxima em estoque atingida.', 'warning');
          return;
        }
        Storage.updateCartItem(pid, item.quantity + 1);
        renderCart();
        updateCartBadge();
      });
    });

    itemsEl.querySelectorAll('.cart-item-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var pid = parseInt(btn.dataset.pid, 10);
        Storage.removeFromCart(pid);
        renderCart();
        updateCartBadge();
        Toast.show('Item removido do carrinho.', 'info');
      });
    });

    /* Ativar reveal nos itens recém renderizados */
    setupReveal();
  }

  /* Resumo financeiro */
  var subtotal = Storage.getCartTotal();
  if (subtotalEl) subtotalEl.textContent = Fmt.currency(subtotal);
  if (totalEl)    totalEl.textContent    = Fmt.currency(subtotal);
}

/* ─── Botão Finalizar Compra ──────────────────────────────── */
function setupCheckoutBtn() {
  var btn = document.getElementById('checkoutBtn');
  if (!btn) return;
  btn.addEventListener('click', function () {
    session = Storage.getSession();
    if (session === null) {
      Toast.show('Faça login para continuar.', 'warning');
      renderLoginModal();
      openModal('loginModal');
      return;
    }
    if (!Storage.getCart().length) {
      Toast.show('Seu carrinho está vazio.', 'warning');
      return;
    }
    window.location.href = 'checkout.html';
  });
}

/* ─── DOMContentLoaded ────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  session = Storage.getSession();
  updateCartBadge();
  renderNavUser();
  renderCart();
  setupLoginBtn();
  setupCheckoutBtn();
  setupScrollProgress();
  setupReveal();
  setupNavSearch();
});
