/* AgroComerce — Detalhe + Chat
   Versão 1.0 | js/anuncio.js
*/
'use strict';

let PAGE = {
  productId: null,
  product: null,
  seller: null,
  session: null,
  conv: null,
  deal: null,
  currentDealId: null,
  reviewRating: 0,
  reviewedUserId: null,
  chatOpen: false,
};

/* ── Init ─────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  PAGE.productId = parseInt(Fmt.urlParam('id'), 10);
  PAGE.session   = Storage.getSession();

  if (!PAGE.productId) { window.location.href = 'marketplace.html'; return; }

  PAGE.product = Storage.getProduct(PAGE.productId);
  if (!PAGE.product) { window.location.href = 'marketplace.html'; return; }

  PAGE.seller = Storage.getUser(PAGE.product.sellerId);

  /* increment views */
  PAGE.product.views = (PAGE.product.views || 0) + 1;
  Storage.saveProduct(PAGE.product);

  renderScrollProgress();
  renderNavUser();
  renderBreadcrumb();
  renderGallery();
  renderInfo();
  renderSellerBox();
  renderPriceBox();
  setupReveal();
  bindEvents();

  /* Auto-open chat if ?chat=1 */
  if (Fmt.urlParam('chat') === '1' && PAGE.session !== null) {
    setTimeout(openChat, 400);
  }
});

/* ── Scroll Progress ─────────────────────────────────────── */
function renderScrollProgress() {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;
  window.addEventListener('scroll', function () {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = max > 0 ? (window.scrollY / max * 100) + '%' : '0%';
  }, { passive: true });
}

/* ── Nav User ─────────────────────────────────────────────── */
function renderNavUser() {
  const avatarEl = document.getElementById('navUserAvatar');
  const nameEl   = document.getElementById('navUserName');
  if (!avatarEl || !nameEl) return;
  if (PAGE.session !== null) {
    const user = Storage.getUser(PAGE.session);
    if (user) {
      avatarEl.innerHTML = `<span class="avatar" style="width:28px;height:28px;font-size:.6rem;background:${user.color}">${user.initials}</span>`;
      nameEl.textContent = user.name.split(' ')[0];
    }
  }
  const btn = document.getElementById('navUserBtn');
  if (btn) btn.addEventListener('click', function () {
    if (PAGE.session !== null) {
      Storage.clearSession();
      PAGE.session = null;
      renderNavUser();
      Toast.show('Sessão encerrada', 'info');
    } else {
      renderLoginModal();
      openModal('loginModal');
    }
  });
}

/* ── Breadcrumb ───────────────────────────────────────────── */
function renderBreadcrumb() {
  const catEl   = document.getElementById('breadcrumbCat');
  const titleEl = document.getElementById('breadcrumbTitle');
  if (catEl)   catEl.textContent  = Fmt.categoryLabel(PAGE.product.category);
  if (titleEl) titleEl.textContent = PAGE.product.title.length > 40 ? PAGE.product.title.substring(0, 38) + '…' : PAGE.product.title;
  document.title = `AgroComerce — ${PAGE.product.title}`;
}

/* ── Gallery ──────────────────────────────────────────────── */
function renderGallery() {
  const mainImg = document.getElementById('galleryMain');
  const thumbsEl = document.getElementById('galleryThumbs');
  const images = PAGE.product.images && PAGE.product.images.length
    ? PAGE.product.images
    : ['https://placehold.co/700x460/e8f5e9/2E7D32?text=AgroComerce'];

  mainImg.src = images[0];
  mainImg.alt = PAGE.product.title;
  mainImg.onerror = function () { this.src = 'https://placehold.co/700x460/e8f5e9/2E7D32?text=AgroComerce'; };

  if (images.length > 1) {
    thumbsEl.innerHTML = images.map(function (src, i) {
      return `<div class="gallery-thumb${i === 0 ? ' active' : ''}" data-idx="${i}">
        <img src="${src}" alt="Foto ${i+1}" onerror="this.src='https://placehold.co/72x52/e8f5e9/2E7D32?text=+'" loading="lazy">
      </div>`;
    }).join('');
    thumbsEl.querySelectorAll('.gallery-thumb').forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        const idx = parseInt(thumb.dataset.idx, 10);
        mainImg.style.opacity = '0';
        setTimeout(function () {
          mainImg.src = images[idx];
          mainImg.style.opacity = '1';
        }, 150);
        thumbsEl.querySelectorAll('.gallery-thumb').forEach(function (t) { t.classList.remove('active'); });
        thumb.classList.add('active');
      });
    });
  } else {
    thumbsEl.style.display = 'none';
  }
}

/* ── Product Info ─────────────────────────────────────────── */
function renderInfo() {
  const p = PAGE.product;

  const descEl = document.getElementById('detailDescription');
  if (descEl) descEl.textContent = p.description;

  const specsEl = document.getElementById('detailSpecs');
  if (specsEl) {
    specsEl.innerHTML = [
      { label: 'Categoria',    value: Fmt.categoryLabel(p.category) },
      { label: 'Quantidade',   value: `${p.quantity} ${p.unit}` },
      { label: 'Preço unitário', value: Fmt.currency(p.price) + ' / ' + p.unit },
      { label: 'Publicado em', value: Fmt.date(p.date) },
      { label: 'Visualizações', value: String(p.views) },
      { label: 'Localização',  value: p.location },
    ].map(function (s) {
      return `<div class="detail-spec">
        <span class="detail-spec-label">${s.label}</span>
        <span class="detail-spec-value">${s.value}</span>
      </div>`;
    }).join('');
  }

  const locEl = document.getElementById('detailLocation');
  if (locEl) locEl.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${p.location}`;
}

/* ── Seller Box ───────────────────────────────────────────── */
function renderSellerBox() {
  const seller = PAGE.seller;
  if (!seller) return;

  const avatarEl = document.getElementById('sellerAvatar');
  const nameEl   = document.getElementById('sellerName');
  const metaEl   = document.getElementById('sellerMeta');
  const bioEl    = document.getElementById('sellerBio');
  const statsEl  = document.getElementById('sellerStats');
  const profileBtn = document.getElementById('btnViewProfile');

  if (avatarEl) {
    avatarEl.textContent = seller.initials;
    avatarEl.style.background = seller.color;
  }
  if (nameEl) {
    nameEl.innerHTML = `${seller.name} ${seller.verified ? '<i class="fa-solid fa-circle-check" style="color:var(--green-500);font-size:.75rem"></i>' : ''}`;
  }
  if (metaEl) {
    metaEl.innerHTML = `<span class="rating-row">${Fmt.stars(seller.rating)} <span class="rating-num">${seller.rating}</span> <span class="rating-count">(${seller.reviews} avaliações)</span></span> · ${seller.city}, ${seller.state}`;
  }
  if (bioEl) bioEl.textContent = seller.bio;
  if (statsEl) {
    const products = Storage.getProducts().filter(function (p) { return p.sellerId === seller.id && p.active; });
    const deals = Storage.getDeals().filter(function (d) { return (d.sellerId === seller.id || d.buyerId === seller.id) && d.status === 'completed'; });
    statsEl.innerHTML = `
      <div class="seller-box-stat"><strong>${products.length}</strong> anúncios ativos</div>
      <div class="seller-box-stat"><strong>${deals.length}</strong> negócios fechados</div>
      <div class="seller-box-stat"><strong>${seller.reviews}</strong> avaliações</div>`;
  }
  if (profileBtn) profileBtn.href = `perfil.html?id=${seller.id}`;
}

/* ── Price Box ────────────────────────────────────────────── */
function renderPriceBox() {
  const p = PAGE.product;
  const priceEl = document.getElementById('boxPrice');
  const unitEl  = document.getElementById('boxUnit');
  const qtyEl   = document.getElementById('boxQty');
  const viewsEl = document.getElementById('viewsRow');
  const favBtn  = document.getElementById('btnFav');

  if (priceEl) priceEl.textContent = Fmt.currency(p.price);
  if (unitEl)  unitEl.textContent  = 'por ' + p.unit;
  if (qtyEl)   qtyEl.innerHTML = `<strong>${p.quantity}</strong> ${p.unit} disponíveis`;
  if (viewsEl) viewsEl.innerHTML = `<span class="views-badge"><i class="fa-regular fa-eye"></i> ${p.views} visualizações &nbsp;·&nbsp; Publicado ${Fmt.relativeDate(p.date)}</span>`;

  if (favBtn) {
    const isFav = Storage.isFav(p.id);
    favBtn.innerHTML = `<i class="fa-${isFav ? 'solid' : 'regular'} fa-heart"></i> ${isFav ? 'Nos favoritos' : 'Salvar nos favoritos'}`;
    if (isFav) favBtn.style.color = 'var(--red-500)';
    favBtn.addEventListener('click', function () {
      const added = Storage.toggleFav(p.id);
      favBtn.innerHTML = `<i class="fa-${added ? 'solid' : 'regular'} fa-heart"></i> ${added ? 'Nos favoritos' : 'Salvar nos favoritos'}`;
      favBtn.style.color = added ? 'var(--red-500)' : '';
      Toast.show(added ? 'Adicionado aos favoritos' : 'Removido dos favoritos', added ? 'success' : 'info');
    });
  }
}

/* ── Open Chat ────────────────────────────────────────────── */
function openChat() {
  if (PAGE.session === null || PAGE.session === undefined) {
    renderLoginModal();
    openModal('loginModal');
    return;
  }
  if (PAGE.session === PAGE.product.sellerId) {
    Toast.show('Você não pode conversar com si mesmo.', 'warning');
    return;
  }

  PAGE.chatOpen = true;
  document.getElementById('priceBox').style.display  = 'none';
  document.getElementById('sellerBox').style.display = 'none';
  document.getElementById('chatBox').style.display   = 'flex';

  /* Load or create conversation */
  let conv = Storage.getConvByProduct(PAGE.productId, PAGE.session);
  if (!conv) {
    const isBuyer = PAGE.session !== PAGE.product.sellerId;
    conv = Storage.createConversation(
      PAGE.productId,
      isBuyer ? PAGE.session : PAGE.product.sellerId,
      PAGE.product.sellerId
    );
  }
  PAGE.conv = conv;

  /* Existing deal? */
  PAGE.deal = Storage.getDealByConv ? Storage.getDealByConv(conv.id) : null;

  renderChatHeader();
  renderMessages();
  renderChatActions();
  scrollToBottom();
}

/* ── Chat Header ──────────────────────────────────────────── */
function renderChatHeader() {
  const isBuyer  = PAGE.session !== PAGE.product.sellerId;
  const partner  = Storage.getUser(isBuyer ? PAGE.product.sellerId : PAGE.conv.buyerId);
  const partnerAv = document.getElementById('chatPartnerAvatar');
  const partnerNm = document.getElementById('chatPartnerName');
  const productTl = document.getElementById('chatProductTitle');
  if (partnerAv) { partnerAv.textContent = partner.initials; partnerAv.style.background = partner.color; }
  if (partnerNm) partnerNm.textContent = partner ? partner.name.split(' ')[0] + ' ' + (partner.name.split(' ')[1] || '') : '—';
  if (productTl) productTl.textContent = PAGE.product.title;
}

/* ── Render Messages ──────────────────────────────────────── */
function renderMessages() {
  const container = document.getElementById('chatMessages');
  if (!container || !PAGE.conv) return;

  const msgs = PAGE.conv.messages;
  if (msgs.length === 0) {
    container.innerHTML = `<div class="chat-empty">
      <i class="fa-regular fa-comments"></i>
      <p>Inicie a conversa com o vendedor.<br>Seja direto e objetivo.</p>
    </div>`;
    return;
  }

  container.innerHTML = msgs.map(function (msg) {
    const isOwn = msg.from === PAGE.session;
    if (msg.type === 'system') {
      return `<div class="msg-system">${msg.text}</div>`;
    }
    if (msg.type === 'deal') {
      return renderDealMessage(msg);
    }
    return `<div class="msg ${isOwn ? 'msg-out' : 'msg-in'}">
      <div class="msg-bubble">${escapeHtml(msg.text)}</div>
      <div class="msg-time">${Fmt.time(msg.time)}</div>
    </div>`;
  }).join('');
}

function renderDealMessage(msg) {
  const deal = msg.dealData || {};
  const isConfirmed = deal.status === 'completed';
  return `<div class="msg-deal">
    <div class="msg-deal-title"><i class="fa-solid fa-handshake"></i> ${isConfirmed ? 'Negócio Fechado!' : 'Proposta de Fechamento'}</div>
    <div class="msg-deal-price">${Fmt.currency(deal.agreedPrice || 0)} / ${PAGE.product.unit}</div>
    <div style="font-size:.75rem;color:var(--gray-600);margin-top:4px">Quantidade: ${deal.quantity || '—'} ${PAGE.product.unit}</div>
    ${!isConfirmed && deal.status === 'pending_seller' && PAGE.session === PAGE.product.sellerId
      ? `<div class="msg-deal-actions">
          <button class="btn btn-primary btn-sm" id="btnConfirmDeal">
            <i class="fa-solid fa-check"></i> Confirmar
          </button>
          <button class="btn btn-ghost btn-sm" id="btnRejectDeal">Recusar</button>
        </div>`
      : ''}
    ${isConfirmed ? `<div style="margin-top:8px"><span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> Confirmado</span></div>` : ''}
  </div>`;
}

/* ── Chat Actions ─────────────────────────────────────────── */
function renderChatActions() {
  const actionsEl = document.getElementById('chatDealActions');
  if (!actionsEl) return;

  const msgs = PAGE.conv ? PAGE.conv.messages : [];
  const hasDeal = msgs.some(function (m) { return m.type === 'deal'; });
  const isSeller = PAGE.session === PAGE.product.sellerId;

  if (!hasDeal && msgs.length >= 2) {
    actionsEl.style.display = 'flex';
    actionsEl.innerHTML = `<button class="btn btn-outline btn-sm" id="btnProposeDeal">
      <i class="fa-solid fa-handshake"></i> Propor Fechamento
    </button>`;
    const btn = document.getElementById('btnProposeDeal');
    if (btn) btn.addEventListener('click', function () { openModal('dealModal'); setDealDefaults(); });
  } else {
    actionsEl.style.display = 'none';
  }
}

/* ── Deal Defaults ────────────────────────────────────────── */
function setDealDefaults() {
  const priceEl = document.getElementById('dealPrice');
  const qtyEl   = document.getElementById('dealQty');
  if (priceEl) priceEl.value = PAGE.product.price;
  if (qtyEl)   qtyEl.value   = Math.min(PAGE.product.quantity, 10);
}

/* ── Send Message ─────────────────────────────────────────── */
function sendMessage(text) {
  if (!text.trim() || !PAGE.conv) return;

  const msg = {
    id: Date.now(),
    from: PAGE.session,
    text: text.trim(),
    time: new Date().toISOString(),
    read: false,
  };
  PAGE.conv.messages.push(msg);
  Storage.saveConversation(PAGE.conv);
  renderMessages();
  scrollToBottom();
  renderChatActions();

  /* Auto-response after delay */
  const isBuyer = PAGE.session !== PAGE.product.sellerId;
  const responderId = isBuyer ? PAGE.product.sellerId : PAGE.conv.buyerId;
  if (responderId !== PAGE.session) {
    showTypingIndicator();
    const delay = 1200 + Math.random() * 1400;
    setTimeout(function () {
      hideTypingIndicator();
      const reply = AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
      const replyMsg = { id: Date.now() + 1, from: responderId, text: reply, time: new Date().toISOString(), read: false };
      PAGE.conv.messages.push(replyMsg);
      Storage.saveConversation(PAGE.conv);
      renderMessages();
      scrollToBottom();
      renderChatActions();
    }, delay);
  }
}

/* ── Typing Indicator ─────────────────────────────────────── */
function showTypingIndicator() {
  const container = document.getElementById('chatMessages');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'msg msg-in'; el.id = 'typingIndicator';
  el.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
  container.appendChild(el);
  scrollToBottom();
}
function hideTypingIndicator() {
  const el = document.getElementById('typingIndicator');
  if (el) el.remove();
}

/* ── Scroll to Bottom ─────────────────────────────────────── */
function scrollToBottom() {
  const container = document.getElementById('chatMessages');
  if (container) setTimeout(function () { container.scrollTop = container.scrollHeight; }, 50);
}

/* ── Confirm Deal ─────────────────────────────────────────── */
function confirmDeal(dealId) {
  const deal = Storage.getDeal(dealId);
  if (!deal) return;
  deal.status = 'completed';
  deal.sellerAcceptedAt = new Date().toISOString();
  deal.completedAt      = new Date().toISOString();
  Storage.saveDeal(deal);
  PAGE.deal = deal;

  /* Update deal message */
  const msgs = PAGE.conv.messages;
  const dealMsg = msgs.find(function (m) { return m.type === 'deal' && m.dealId === dealId; });
  if (dealMsg) { dealMsg.dealData = deal; }
  PAGE.conv.messages.push({ id: Date.now(), type: 'system', text: 'Negócio confirmado por ambas as partes!' });
  Storage.saveConversation(PAGE.conv);
  renderMessages();
  scrollToBottom();
  Toast.show('Negócio fechado com sucesso!', 'success', 5000);

  setTimeout(function () { triggerReview(deal); }, 2000);
}

/* ── Trigger Review ──────────────────────────────────────────── */
function triggerReview(deal) {
  const isBuyer = PAGE.session === deal.buyerId;
  PAGE.reviewedUserId = isBuyer ? deal.sellerId : deal.buyerId;
  const reviewed = Storage.getUser(PAGE.reviewedUserId);
  const subtitle = document.getElementById('reviewModalSubtitle');
  if (subtitle && reviewed) subtitle.textContent = `Como foi negociar com ${reviewed.name.split(' ')[0]}?`;
  PAGE.reviewRating = 0;
  document.querySelectorAll('#starInput button').forEach(function (btn) {
    btn.classList.remove('active');
    btn.innerHTML = '<i class="fa-regular fa-star"></i>';
  });
  openModal('reviewModal');
}

/* ── Bind Events ──────────────────────────────────────────── */
function bindEvents() {
  /* Chat open */
  const btnChat = document.getElementById('btnChat');
  if (btnChat) btnChat.addEventListener('click', openChat);

  /* Chat back */
  const btnBack = document.getElementById('btnChatBack');
  if (btnBack) btnBack.addEventListener('click', function () {
    PAGE.chatOpen = false;
    document.getElementById('chatBox').style.display   = 'none';
    document.getElementById('priceBox').style.display  = 'block';
    document.getElementById('sellerBox').style.display = 'block';
  });

  /* Chat send */
  const sendBtn = document.getElementById('chatSend');
  const input   = document.getElementById('chatInput');
  function doSend() {
    if (!input || !input.value.trim()) return;
    sendMessage(input.value);
    input.value = '';
    input.style.height = 'auto';
  }
  if (sendBtn) sendBtn.addEventListener('click', doSend);
  if (input) {
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); }
    });
    input.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 100) + 'px';
    });
  }

  /* Deal form */
  const dealForm = document.getElementById('dealForm');
  if (dealForm) {
    dealForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const price = parseFloat(document.getElementById('dealPrice').value);
      const qty   = parseInt(document.getElementById('dealQty').value, 10);
      const deal  = Storage.createDeal(PAGE.productId, PAGE.conv.buyerId, PAGE.conv.sellerId, price, qty, PAGE.conv.id);
      const dealMsg = {
        id: Date.now(),
        type: 'deal',
        dealId: deal.id,
        from: PAGE.session,
        dealData: deal,
        time: new Date().toISOString(),
      };
      PAGE.conv.messages.push(dealMsg);
      Storage.saveConversation(PAGE.conv);
      closeModal('dealModal');
      renderMessages();
      renderChatActions();
      scrollToBottom();
      Toast.show('Proposta enviada! Aguardando confirmação.', 'info');

      /* Simulate seller confirmation */
      if (PAGE.session !== PAGE.product.sellerId) {
        setTimeout(function () {
          confirmDeal(deal.id);
        }, 3000);
      }
    });
  }
  document.getElementById('dealClose').addEventListener('click', function () { closeModal('dealModal'); });

  /* Star rating */
  document.querySelectorAll('#starInput button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      PAGE.reviewRating = parseInt(btn.dataset.val, 10);
      document.querySelectorAll('#starInput button').forEach(function (b, idx) {
        b.classList.toggle('active', idx < PAGE.reviewRating);
        b.innerHTML = idx < PAGE.reviewRating
          ? '<i class="fa-solid fa-star"></i>'
          : '<i class="fa-regular fa-star"></i>';
      });
    });
  });

  /* Submit review */
  const submitReviewBtn = document.getElementById('btnSubmitReview');
  if (submitReviewBtn) {
    submitReviewBtn.addEventListener('click', function () {
      if (PAGE.reviewRating === 0) { Toast.show('Selecione pelo menos 1 estrela', 'warning'); return; }
      const comment = document.getElementById('reviewComment').value.trim();
      Storage.addReview({
        dealId: PAGE.currentDealId || null,
        reviewerId: PAGE.session,
        reviewedUserId: PAGE.reviewedUserId,
        rating: PAGE.reviewRating,
        comment: comment,
      });
      closeModal('reviewModal');
      Toast.show('Avaliação enviada! Obrigado pelo feedback.', 'success');
      /* Update seller box rating */
      PAGE.seller = Storage.getUser(PAGE.product.sellerId);
      renderSellerBox();
    });
  }

  /* Report */
  const btnReport = document.getElementById('btnReport');
  if (btnReport) {
    btnReport.addEventListener('click', function () {
      const reports = Storage.getReports();
      const newId   = Math.max(0, ...reports.map(function (r) { return r.id; })) + 1;
      Storage.saveReport({
        id: newId,
        reporterId: PAGE.session || 0,
        reportedUserId: null,
        reportedProductId: PAGE.productId,
        reason: 'Informação incorreta',
        description: 'Denúncia enviada pelo visitante.',
        status: 'open',
        createdAt: new Date().toISOString(),
      });
      Toast.show('Denúncia registrada. Analisaremos em breve.', 'info');
    });
  }

  /* Delegated deal confirm/reject */
  document.addEventListener('click', function (e) {
    if (e.target.closest('#btnConfirmDeal')) {
      const dealMsg = PAGE.conv.messages.find(function (m) { return m.type === 'deal'; });
      if (dealMsg) confirmDeal(dealMsg.dealId);
    }
    if (e.target.closest('#btnRejectDeal')) {
      const dealMsg = PAGE.conv.messages.find(function (m) { return m.type === 'deal'; });
      if (dealMsg) {
        PAGE.conv.messages = PAGE.conv.messages.filter(function (m) { return m !== dealMsg; });
        PAGE.conv.messages.push({ id: Date.now(), type: 'system', text: 'Proposta recusada. Continuem negociando.' });
        Storage.saveConversation(PAGE.conv);
        const deal = Storage.getDeal(dealMsg.dealId);
        if (deal) { const deals = Storage.getDeals().filter(function (d) { return d.id !== deal.id; }); Storage.set(STORE.DEALS, deals); }
        renderMessages();
        renderChatActions();
        Toast.show('Proposta recusada.', 'info');
      }
    }
  });

  /* Login modal */
  const loginClose = document.getElementById('loginClose');
  if (loginClose) loginClose.addEventListener('click', function () { closeModal('loginModal'); });
  document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(overlay.id); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.open').forEach(function (o) { closeModal(o.id); });
  });
}

/* ── Login Modal ──────────────────────────────────────────── */
function renderLoginModal() {
  const list = document.getElementById('loginUserList');
  if (!list) return;
  const users = Storage.getUsers().filter(function (u) { return u.type !== 'admin'; });
  list.innerHTML = users.map(function (user) {
    return `<div class="user-option" data-uid="${user.id}" role="listitem">
      <span class="avatar" style="width:44px;height:44px;font-size:.85rem;background:${user.color}">${user.initials}</span>
      <div style="flex:1">
        <div class="user-option-name">${user.name}</div>
        <div class="user-option-meta"><span>${user.city}, ${user.state}</span></div>
      </div>
    </div>`;
  }).join('');
  list.querySelectorAll('.user-option').forEach(function (el) {
    el.addEventListener('click', function () {
      const uid = parseInt(el.dataset.uid, 10);
      Storage.setSession(uid);
      PAGE.session = uid;
      renderNavUser();
      closeModal('loginModal');
      Toast.show('Bem-vindo, ' + Storage.getUser(uid).name.split(' ')[0] + '!', 'success');
    });
  });
}

/* ── Modal helpers ────────────────────────────────────────── */
function openModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.add('open'); document.body.style.overflow = 'hidden'; }
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.remove('open'); document.body.style.overflow = ''; }
}

/* ── Reveal ───────────────────────────────────────────────── */
function setupReveal() {
  const obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(function (el) { obs.observe(el); });
}

/* ── Escape HTML ──────────────────────────────────────────── */
function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
