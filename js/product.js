'use strict';

var session = Storage.getSession();
var currentProductId = null;
var selectedRating = 0;

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

/* ─── Galeria ─────────────────────────────────────────────── */
function renderGallery(images) {
  var main   = document.getElementById('galleryMain');
  var thumbs = document.getElementById('galleryThumbs');
  if (!main || !images || !images.length) return;

  var currentIdx = 0;

  function setMain(idx) {
    currentIdx = idx;
    main.src = images[idx];
    thumbs.querySelectorAll('.gallery-thumb').forEach(function (t, i) {
      t.classList.toggle('active', i === idx);
    });
  }

  main.src = images[0];
  main.alt = 'Imagem principal do produto';

  thumbs.innerHTML = images.map(function (src, i) {
    return '<img class="gallery-thumb' + (i === 0 ? ' active' : '') + '" src="' + src + '" alt="Imagem ' + (i + 1) + '" data-idx="' + i + '">';
  }).join('');

  thumbs.querySelectorAll('.gallery-thumb').forEach(function (thumb) {
    thumb.addEventListener('click', function () {
      setMain(parseInt(thumb.dataset.idx, 10));
    });
  });

  /* ── Lightbox ────────────────────────────────────────────── */
  var lb       = document.getElementById('lightbox');
  var lbImg    = document.getElementById('lbImg');
  var lbClose  = document.getElementById('lbClose');
  var lbPrev   = document.getElementById('lbPrev');
  var lbNext   = document.getElementById('lbNext');
  var lbDots   = document.getElementById('lbDots');
  var lbCounter= document.getElementById('lbCounter');
  if (!lb) return;

  var lbIdx = 0;

  function lbGoto(idx) {
    lbIdx = (idx + images.length) % images.length;
    lbImg.src = images[lbIdx];
    if (lbCounter) lbCounter.textContent = (lbIdx + 1) + ' / ' + images.length;
    if (lbDots) {
      lbDots.querySelectorAll('.lightbox-dot').forEach(function (d, i) {
        d.classList.toggle('active', i === lbIdx);
      });
    }
    if (lbPrev) lbPrev.hidden = images.length <= 1;
    if (lbNext) lbNext.hidden = images.length <= 1;
  }

  function lbOpen(startIdx) {
    lbIdx = startIdx || 0;
    if (lbDots) {
      lbDots.innerHTML = images.length > 1
        ? images.map(function (_, i) {
            return '<button class="lightbox-dot' + (i === lbIdx ? ' active' : '') + '" data-i="' + i + '" aria-label="Foto ' + (i + 1) + '"></button>';
          }).join('')
        : '';
      lbDots.querySelectorAll('.lightbox-dot').forEach(function (d) {
        d.addEventListener('click', function () { lbGoto(parseInt(d.dataset.i, 10)); });
      });
    }
    lbGoto(lbIdx);
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function lbClose_() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* Abrir ao clicar na imagem principal */
  main.addEventListener('click', function () { lbOpen(currentIdx); });

  /* Fechar */
  if (lbClose) lbClose.addEventListener('click', lbClose_);
  lb.addEventListener('click', function (e) { if (e.target === lb) lbClose_(); });

  /* Setas */
  if (lbPrev) lbPrev.addEventListener('click', function (e) { e.stopPropagation(); lbGoto(lbIdx - 1); });
  if (lbNext) lbNext.addEventListener('click', function (e) { e.stopPropagation(); lbGoto(lbIdx + 1); });

  /* Teclado */
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape')     lbClose_();
    if (e.key === 'ArrowLeft')  lbGoto(lbIdx - 1);
    if (e.key === 'ArrowRight') lbGoto(lbIdx + 1);
  });

  /* Swipe touch */
  var tsX = 0;
  lb.addEventListener('touchstart', function (e) { tsX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    var diff = tsX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) lbGoto(diff > 0 ? lbIdx + 1 : lbIdx - 1);
  }, { passive: true });
}

/* ─── Botão Favorito ──────────────────────────────────────── */
function renderFavBtn(productId) {
  var btn = document.getElementById('favBtn');
  if (!btn) return;
  var isFav = Storage.isFav(productId);
  btn.innerHTML = isFav
    ? '<i class="fa-solid fa-heart"></i>'
    : '<i class="fa-regular fa-heart"></i>';

  btn.onclick = function () {
    var nowFav = Storage.toggleFav(productId);
    btn.innerHTML = nowFav
      ? '<i class="fa-solid fa-heart"></i>'
      : '<i class="fa-regular fa-heart"></i>';
    Toast.show(nowFav ? 'Adicionado aos favoritos!' : 'Removido dos favoritos', nowFav ? 'success' : 'info');
  };
}

/* ─── Breadcrumb ──────────────────────────────────────────── */
function renderBreadcrumb(p) {
  var catEl   = document.getElementById('breadCrumbCat');
  var titleEl = document.getElementById('breadCrumbTitle');
  if (catEl) {
    catEl.textContent = Fmt.categoryLabel(p.category);
    catEl.href = 'marketplace.html?cat=' + p.category;
  }
  if (titleEl) titleEl.textContent = p.title;
  document.title = 'AgroCommerce — ' + p.title;
}

/* ─── Price Box ───────────────────────────────────────────── */
function renderPriceBox(p) {
  var priceEl = document.getElementById('pbPrice');
  var unitEl  = document.getElementById('pbUnit');
  var stockEl = document.getElementById('pbStock');
  var qtyEl   = document.getElementById('qtyInput');

  if (priceEl) priceEl.textContent = Fmt.currency(p.price);
  if (unitEl)  unitEl.textContent  = 'por ' + p.unit;
  if (stockEl) {
    stockEl.innerHTML = p.stock > 0
      ? '<i class="fa-solid fa-circle-check" style="color:var(--brand-light);margin-right:.3rem"></i>' + p.stock + ' unidades em estoque'
      : '<i class="fa-solid fa-circle-xmark" style="color:#e53935;margin-right:.3rem"></i>Sem estoque';
  }
  if (qtyEl) {
    qtyEl.max   = p.stock;
    qtyEl.value = 1;
  }
}

/* ─── Botão Carrinho ──────────────────────────────────────── */
function setupAddToCart(p, store) {
  var btn = document.getElementById('addCartBtn');
  if (!btn) return;

  if (p.stock <= 0) {
    btn.disabled = true;
    btn.textContent = 'Sem estoque';
    return;
  }

  btn.addEventListener('click', function () {
    session = Storage.getSession();
    if (session === null) {
      renderLoginModal();
      openModal('loginModal');
      return;
    }
    var qty = parseInt(document.getElementById('qtyInput').value, 10) || 1;
    qty = Math.max(1, Math.min(qty, p.stock));
    Storage.addToCart({
      productId: p.id,
      storeId:   p.storeId,
      storeName: store.name,
      title:     p.title,
      price:     p.price,
      quantity:  qty,
      unit:      p.unit,
      image:     p.images[0] || '',
    });
    updateCartBadge();
    Toast.show('Produto adicionado ao carrinho!', 'success');
  });
}

/* ─── Seller Box ──────────────────────────────────────────── */
function renderSellerBox(store, owner) {
  var box = document.getElementById('sellerBox');
  if (!box) return;

  var verifiedBadge = store.verified
    ? '<span class="badge badge-verified"><i class="fa-solid fa-circle-check"></i> CNPJ Verificado</span>'
    : '';

  box.innerHTML =
    '<div class="seller-box-header">' +
      '<span class="avatar" style="width:52px;height:52px;font-size:1rem;background:' + owner.color + ';flex-shrink:0">' + owner.initials + '</span>' +
      '<div class="seller-box-info">' +
        '<div class="seller-box-name"><a href="loja.html?id=' + store.id + '">' + store.name + '</a></div>' +
        '<div class="seller-box-meta">' +
          '<span class="stars">' + Fmt.stars(store.rating) + '</span>' +
          '<span>' + store.rating.toFixed(1) + ' (' + store.totalReviews + ' avaliações)</span>' +
        '</div>' +
        verifiedBadge +
      '</div>' +
    '</div>' +
    '<div class="seller-box-stats">' +
      '<div class="seller-box-stat"><strong>' + store.rating.toFixed(1) + '</strong><span>Avaliação</span></div>' +
      '<div class="seller-box-stat"><strong>' + store.totalReviews + '</strong><span>Avaliações</span></div>' +
      '<div class="seller-box-stat"><strong>' + Storage.getProductsByStore(store.id).length + '</strong><span>Produtos</span></div>' +
    '</div>' +
    '<div class="seller-box-bio">' + (store.description || owner.bio || '') + '</div>' +
    '<a href="loja.html?id=' + store.id + '" class="btn btn-outline btn-sm btn-full">' +
      '<i class="fa-solid fa-store"></i> Ver Loja' +
    '</a>';
}

/* ─── Especificações ──────────────────────────────────────── */
function renderSpecs(p, store) {
  var el = document.getElementById('productSpecs');
  if (!el) return;
  el.innerHTML =
    spec('Categoria',
      '<span class="badge ' + Fmt.categoryColor(p.category) + '">' +
        '<i class="fa-solid ' + Fmt.categoryIcon(p.category) + '"></i> ' + Fmt.categoryLabel(p.category) +
      '</span>') +
    spec('Unidade', p.unit) +
    spec('Estoque', p.stock + ' unidades') +
    spec('Loja', '<a href="loja.html?id=' + p.storeId + '">' + store.name + '</a>') +
    spec('Publicado em', Fmt.date(p.createdAt));
}

function spec(label, value) {
  return '<div class="detail-spec">' +
    '<div class="detail-spec-label">' + label + '</div>' +
    '<div class="detail-spec-value">' + value + '</div>' +
    '</div>';
}

/* ─── Rating Summary + Bars ───────────────────────────────── */
function renderRating(p) {
  var summaryEl = document.getElementById('ratingSummary');
  if (!summaryEl) return;

  var reviews = Storage.getReviewsByProduct(p.id);
  var counts  = [0, 0, 0, 0, 0]; // índice 0 = estrela 1 … índice 4 = estrela 5
  reviews.forEach(function (r) {
    if (r.rating >= 1 && r.rating <= 5) counts[r.rating - 1]++;
  });
  var total = reviews.length;

  var barsHtml = '';
  for (var s = 5; s >= 1; s--) {
    var cnt  = counts[s - 1];
    var pct  = total > 0 ? Math.round((cnt / total) * 100) : 0;
    barsHtml +=
      '<div class="rating-bar-row">' +
        '<span class="rating-bar-label">' + s + '</span>' +
        '<div class="rating-bar-track"><div class="rating-bar-fill" style="width:' + pct + '%"></div></div>' +
        '<span class="rating-bar-count">' + cnt + '</span>' +
      '</div>';
  }

  summaryEl.innerHTML =
    '<div style="text-align:center">' +
      '<div class="big-num">' + (p.rating || 0).toFixed(1) + '</div>' +
      '<div class="stars" style="color:var(--gold);font-size:.9rem;margin:.25rem 0">' + Fmt.stars(p.rating || 0) + '</div>' +
      '<span style="font-size:.78rem;color:var(--text-secondary)">' + total + ' avaliação' + (total !== 1 ? 'ões' : '') + '</span>' +
    '</div>' +
    '<div class="rating-bars">' + barsHtml + '</div>';
}

/* ─── Lista de Reviews ────────────────────────────────────── */
function renderReviews(productId) {
  var list = document.getElementById('reviewsList');
  if (!list) return;
  var reviews = Storage.getReviewsByProduct(productId);
  if (!reviews.length) {
    list.innerHTML = '<div class="no-reviews"><i class="fa-regular fa-comment-dots" style="font-size:2rem;margin-bottom:.5rem;display:block;color:var(--border)"></i>Nenhuma avaliação ainda. Seja o primeiro!</div>';
    return;
  }
  list.innerHTML = reviews.map(function (r) {
    return '<div class="review-card">' +
      '<div class="review-card-header">' +
        '<span class="avatar" style="width:38px;height:38px;font-size:.7rem;background:#78909C;flex-shrink:0">' +
          (r.reviewerName || 'U').split(' ').map(function (n) { return n[0]; }).join('').substring(0, 2).toUpperCase() +
        '</span>' +
        '<div class="review-card-meta">' +
          '<div class="review-card-name">' + (r.reviewerName || 'Usuário') + '</div>' +
          '<div style="display:flex;align-items:center;gap:.5rem">' +
            '<span class="stars">' + Fmt.stars(r.rating) + '</span>' +
            '<span class="review-card-date">' + Fmt.relativeDate(r.createdAt) + '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="review-card-text">' + r.comment + '</div>' +
    '</div>';
  }).join('');
}

/* ─── Formulário de Avaliação ─────────────────────────────── */
function setupReviewForm(productId, storeId) {
  var starBtns = document.querySelectorAll('#starInput button');
  var textarea  = document.getElementById('reviewComment');
  var submitBtn = document.getElementById('submitReview');

  function updateStars(val) {
    starBtns.forEach(function (b) {
      b.classList.toggle('active', parseInt(b.dataset.v, 10) <= val);
    });
  }

  starBtns.forEach(function (b) {
    b.addEventListener('mouseenter', function () { updateStars(parseInt(b.dataset.v, 10)); });
    b.addEventListener('mouseleave', function () { updateStars(selectedRating); });
    b.addEventListener('click', function () {
      selectedRating = parseInt(b.dataset.v, 10);
      updateStars(selectedRating);
    });
  });

  if (submitBtn) {
    submitBtn.addEventListener('click', function () {
      session = Storage.getSession();
      if (session === null) {
        renderLoginModal();
        openModal('loginModal');
        return;
      }
      if (selectedRating === 0) {
        Toast.show('Selecione uma nota para avaliar.', 'warning');
        return;
      }
      var comment = textarea ? textarea.value.trim() : '';
      if (!comment) {
        Toast.show('Escreva um comentário para sua avaliação.', 'warning');
        return;
      }
      var user = Storage.getUser(session);
      Storage.addReview({
        productId:    productId,
        storeId:      storeId,
        reviewerId:   session,
        reviewerName: user ? user.name.split(' ').slice(0, 2).join(' ') : 'Usuário',
        rating:       selectedRating,
        comment:      comment,
      });

      /* Recarregar dados atualizados */
      var updated = Storage.getProduct(productId);
      renderRating(updated);
      renderReviews(productId);

      if (textarea) textarea.value = '';
      selectedRating = 0;
      updateStars(0);
      Toast.show('Avaliação enviada! Obrigado.', 'success');
    });
  }
}

/* ─── Produto Principal ───────────────────────────────────── */
function renderProduct() {
  var p = Storage.getProduct(currentProductId);
  if (!p) {
    window.location.href = 'marketplace.html';
    return;
  }
  var store = Storage.getStore(p.storeId);
  var owner = store ? Storage.getUser(store.ownerId) : null;
  if (!store || !owner) {
    window.location.href = 'marketplace.html';
    return;
  }

  renderBreadcrumb(p);
  renderGallery(p.images);
  renderFavBtn(p.id);
  renderPriceBox(p);
  setupAddToCart(p, store);
  renderSellerBox(store, owner);

  var descEl = document.getElementById('productDesc');
  if (descEl) descEl.textContent = p.description;

  renderSpecs(p, store);
  renderRating(p);
  renderReviews(p.id);
  setupReviewForm(p.id, p.storeId);

  /* Badge destaque no título */
  if (p.featured) {
    var priceEl = document.getElementById('pbPrice');
    if (priceEl) {
      var badge = document.createElement('span');
      badge.className = 'badge badge-featured';
      badge.innerHTML = '<i class="fa-solid fa-bolt"></i> Destaque';
      badge.style.cssText = 'display:inline-flex;margin-bottom:.5rem;font-size:.7rem';
      priceEl.parentNode.insertBefore(badge, priceEl);
    }
  }
}

/* ─── DOMContentLoaded ────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  var idParam = Fmt.urlParam('id');
  if (!idParam) { window.location.href = 'marketplace.html'; return; }
  currentProductId = parseInt(idParam, 10);
  if (!Storage.getProduct(currentProductId)) { window.location.href = 'marketplace.html'; return; }

  session = Storage.getSession();
  updateCartBadge();
  renderNavUser();
  renderProduct();
  setupLoginBtn();
  setupScrollProgress();
  setupReveal();
  setupNavSearch();
});
