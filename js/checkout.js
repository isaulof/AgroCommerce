/* AgroCommerce — Checkout
   js/checkout.js
*/
'use strict';

var session = Storage.getSession();
var selectedPayment = 'pix';

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
      renderCheckoutForm();
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

/* ── Render Checkout Form ────────────────────────────────────── */
function renderCheckoutForm() {
  var cart = Storage.getCart();
  var content = document.getElementById('checkoutContent');
  if (!content) return;

  var user = session !== null ? Storage.getUser(session) : null;

  var itemsHtml = cart.map(function (item) {
    return '<div class="checkout-order-item">' +
      '<img src="' + (item.image || 'https://placehold.co/56x56/e8f5e9/2E7D32?text=Produto') + '" alt="' + item.title + '">' +
      '<div class="checkout-order-item-info">' +
        '<div class="checkout-order-item-title">' + item.title + '</div>' +
        '<div class="checkout-order-item-sub">' + item.storeName + ' &middot; ' + item.quantity + ' ' + item.unit + '</div>' +
      '</div>' +
      '<div class="checkout-order-item-price">' + Fmt.currency(item.price * item.quantity) + '</div>' +
    '</div>';
  }).join('');

  var total = Storage.getCartTotal();

  content.innerHTML =
    '<div class="checkout-grid">' +
      '<!-- Esquerda: formulário -->' +
      '<div>' +
        '<div class="checkout-section">' +
          '<h3><i class="fa-solid fa-location-dot"></i> Endereço de Entrega</h3>' +
          '<div class="form-row-2">' +
            '<div class="form-group">' +
              '<label for="chkNome">Nome completo <span style="color:var(--red-500)">*</span></label>' +
              '<input type="text" id="chkNome" placeholder="Seu nome completo" value="' + (user ? user.name : '') + '">' +
            '</div>' +
            '<div class="form-group">' +
              '<label for="chkCpf">CPF / CNPJ <span style="color:var(--red-500)">*</span></label>' +
              '<input type="text" id="chkCpf" placeholder="000.000.000-00" value="' + (user ? (user.cpfCnpj || '') : '') + '">' +
            '</div>' +
          '</div>' +
          '<div class="form-group">' +
            '<label for="chkEndereco">Endereço <span style="color:var(--red-500)">*</span></label>' +
            '<input type="text" id="chkEndereco" placeholder="Rua, número, complemento" value="' + (user ? (user.address || '') : '') + '">' +
          '</div>' +
          '<div class="form-row-2">' +
            '<div class="form-group">' +
              '<label for="chkCidade">Cidade <span style="color:var(--red-500)">*</span></label>' +
              '<input type="text" id="chkCidade" placeholder="Cidade" value="' + (user ? (user.city || '') : '') + '">' +
            '</div>' +
            '<div class="form-group">' +
              '<label for="chkEstado">Estado <span style="color:var(--red-500)">*</span></label>' +
              '<select id="chkEstado">' +
                ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(function (uf) {
                  return '<option value="' + uf + '"' + ((user && user.state === uf) || (!user && uf === 'MT') ? ' selected' : '') + '>' + uf + '</option>';
                }).join('') +
              '</select>' +
            '</div>' +
          '</div>' +
          '<div class="form-group">' +
            '<label for="chkCep">CEP <span style="color:var(--red-500)">*</span></label>' +
            '<input type="text" id="chkCep" placeholder="00000-000" style="max-width:160px">' +
          '</div>' +
        '</div>' +

        '<div class="checkout-section">' +
          '<h3><i class="fa-solid fa-credit-card"></i> Forma de Pagamento</h3>' +
          '<div class="payment-options" id="paymentOptions">' +
            '<div class="payment-option selected" data-pay="pix">' +
              '<i class="fa-solid fa-qrcode"></i>' +
              '<div>' +
                '<div class="payment-option-label">PIX</div>' +
                '<div class="payment-option-desc">Aprovação imediata, sem taxas</div>' +
              '</div>' +
            '</div>' +
            '<div class="payment-option" data-pay="boleto">' +
              '<i class="fa-solid fa-barcode"></i>' +
              '<div>' +
                '<div class="payment-option-label">Boleto Bancário</div>' +
                '<div class="payment-option-desc">Vencimento em até 3 dias úteis</div>' +
              '</div>' +
            '</div>' +
            '<div class="payment-option" data-pay="cartao">' +
              '<i class="fa-solid fa-credit-card"></i>' +
              '<div>' +
                '<div class="payment-option-label">Cartão de Crédito</div>' +
                '<div class="payment-option-desc">Parcelado em até 12x sem juros</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<button class="btn btn-gold btn-lg btn-full" id="btnConfirmarPedido">' +
          '<i class="fa-solid fa-check"></i> Confirmar Pedido' +
        '</button>' +
      '</div>' +

      '<!-- Direita: resumo -->' +
      '<div>' +
        '<div class="cart-summary">' +
          '<div class="cart-summary-title">Resumo do Pedido</div>' +
          '<div class="checkout-order-items">' + itemsHtml + '</div>' +
          '<div class="cart-summary-row"><span>Subtotal</span><span>' + Fmt.currency(total) + '</span></div>' +
          '<div class="cart-summary-row"><span>Frete</span><span style="color:var(--green-600)">Grátis <small>(demo)</small></span></div>' +
          '<div class="cart-summary-row total"><span>Total</span><span>' + Fmt.currency(total) + '</span></div>' +
        '</div>' +
      '</div>' +
    '</div>';

  /* Bind payment option selection */
  document.querySelectorAll('.payment-option').forEach(function (opt) {
    opt.addEventListener('click', function () {
      document.querySelectorAll('.payment-option').forEach(function (o) { o.classList.remove('selected'); });
      opt.classList.add('selected');
      selectedPayment = opt.dataset.pay;
    });
  });

  /* Bind confirm button */
  document.getElementById('btnConfirmarPedido').addEventListener('click', handleConfirm);
}

/* ── Handle Confirm ──────────────────────────────────────────── */
function handleConfirm() {
  if (session === null) {
    Toast.show('Faça login para finalizar o pedido.', 'warning');
    renderLoginModal();
    openModal('loginModal');
    return;
  }

  var nome     = document.getElementById('chkNome').value.trim();
  var cpf      = document.getElementById('chkCpf').value.trim();
  var endereco = document.getElementById('chkEndereco').value.trim();
  var cidade   = document.getElementById('chkCidade').value.trim();
  var estado   = document.getElementById('chkEstado').value;
  var cep      = document.getElementById('chkCep').value.trim();

  if (!nome || !cpf || !endereco || !cidade || !cep) {
    Toast.show('Preencha todos os campos obrigatórios.', 'error');
    return;
  }

  var paymentLabels = { pix: 'PIX', boleto: 'Boleto Bancário', cartao: 'Cartão de Crédito' };
  var address = endereco + ', ' + cidade + ' - ' + estado + ', CEP ' + cep;
  var cart    = Storage.getCart();
  var order   = Storage.createOrder(session, cart, address, paymentLabels[selectedPayment] || selectedPayment);

  Storage.clearCart();
  updateCartBadge();

  renderConfirmation(order);
}

/* ── Render Confirmation ─────────────────────────────────────── */
function renderConfirmation(order) {
  var content = document.getElementById('checkoutContent');
  if (!content) return;

  content.innerHTML =
    '<div class="confirm-wrap">' +
      '<div class="confirm-icon"><i class="fa-solid fa-circle-check" style="font-size:3rem;color:var(--green-500,#4caf50)"></i></div>' +
      '<h2 class="confirm-title">Pedido Confirmado!</h2>' +
      '<p class="confirm-sub">Seu pedido foi recebido e está sendo processado.</p>' +
      '<div class="confirm-box">' +
        '<div class="confirm-box-row"><span>Número do pedido</span><strong>#' + order.id + '</strong></div>' +
        '<div class="confirm-box-row"><span>Data</span><strong>' + Fmt.date(order.createdAt) + '</strong></div>' +
        '<div class="confirm-box-row"><span>Pagamento</span><strong>' + order.paymentMethod + '</strong></div>' +
        '<div class="confirm-box-row"><span>Endereço de entrega</span><strong>' + order.deliveryAddress + '</strong></div>' +
        '<div class="confirm-box-row"><span>Total</span><strong>' + Fmt.currency(order.totalValue) + '</strong></div>' +
      '</div>' +
      '<div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-top:28px">' +
        '<a href="perfil.html" class="btn btn-primary btn-md"><i class="fa-solid fa-bag-shopping"></i> Ver meus pedidos</a>' +
        '<a href="marketplace.html" class="btn btn-outline btn-md"><i class="fa-solid fa-store"></i> Continuar comprando</a>' +
      '</div>' +
    '</div>';
}

/* ── Init ────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  Storage.init();
  session = Storage.getSession();

  setupScrollProgress();
  renderNavUser();
  updateCartBadge();
  renderLoginModal();

  /* Close modal btn */
  var closeBtn = document.getElementById('loginClose');
  if (closeBtn) closeBtn.addEventListener('click', function () { closeModal('loginModal'); });

  /* Nav user button opens login modal */
  var navBtn = document.getElementById('navUserBtn');
  if (navBtn) navBtn.addEventListener('click', function () { renderLoginModal(); openModal('loginModal'); });

  /* Check cart */
  var cart = Storage.getCart();
  if (!cart || cart.length === 0) {
    window.location.href = 'carrinho.html';
    return;
  }

  renderCheckoutForm();
});
