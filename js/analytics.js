/* AgroInsights Premium — Engine Analítico
   AgroCommerce 2026 | js/analytics.js
*/
'use strict';

window.AgroInsights = (function () {

  /* ── Paleta de cores Chart.js ──────────────────────────────── */
  var C = {
    green:  '#22c55e',
    gold:   '#f59e0b',
    blue:   '#3b82f6',
    red:    '#ef4444',
    purple: '#a855f7',
    cyan:   '#06b6d4',
    bg:     '#0b1120',
    surface:'#121927',
    border: '#1e2d45',
    text1:  '#f1f5f9',
    text2:  '#94a3b8',
    text3:  '#475569',
  };

  /* ── Seeds por loja ────────────────────────────────────────── */
  var ANALYTICS_SEED = {
    1: { mult: 1.2,  topCat: 'racao',      share: 34, city: 'Lucas do Rio Verde' },
    2: { mult: 1.5,  topCat: 'adubo',      share: 28, city: 'Sorriso'            },
    3: { mult: 0.9,  topCat: 'defensivo',  share: 19, city: 'Sinop'              },
    4: { mult: 1.1,  topCat: 'medicamento',share: 22, city: 'Lucas do Rio Verde' },
    5: { mult: 1.3,  topCat: 'sementes',   share: 41, city: 'Nova Mutum'         },
  };

  /* ── Sazonalidade por categoria (índice 0=Jan … 11=Dez) ───── */
  var SAFRA_SEASONALITY = {
    racao:       [1.0, 1.0, 1.1, 1.1, 1.2, 1.3, 1.3, 1.2, 1.1, 1.0, 1.0, 1.0],
    adubo:       [1.2, 1.3, 1.4, 1.2, 0.9, 0.7, 0.7, 0.8, 1.0, 1.3, 1.5, 1.4],
    defensivo:   [1.1, 1.2, 1.3, 1.2, 1.0, 0.8, 0.7, 0.8, 1.0, 1.2, 1.3, 1.2],
    medicamento: [1.0, 1.0, 1.0, 1.1, 1.2, 1.3, 1.3, 1.2, 1.1, 1.0, 1.0, 1.0],
    sementes:    [0.7, 0.6, 0.5, 0.5, 0.6, 0.8, 0.9, 1.1, 1.4, 1.5, 1.4, 1.0],
  };

  var _dayBase = Math.floor(Date.now() / 86400000);

  /* ── Gerador pseudoaleatório determinístico ────────────────── */
  function seededRandom(storeId, dayOffset, index) {
    var seed = (_dayBase + dayOffset) * 31 + storeId * 17 + index * 7;
    seed = ((seed * 1103515245) + 12345) & 0x7fffffff;
    return (seed % 1000) / 1000;
  }

  /* ── Gerar receita 30d baseada nos produtos reais ──────────── */
  function generateRevenue30d(storeId, products) {
    var seed = ANALYTICS_SEED[storeId] || { mult: 1.0, topCat: 'outros', share: 20 };
    var days = [];
    var month = new Date().getMonth();
    for (var d = 29; d >= 0; d--) {
      var dayTotal = 0;
      products.forEach(function (p, pi) {
        var cat = p.category || 'outros';
        var seas = (SAFRA_SEASONALITY[cat] || SAFRA_SEASONALITY.racao)[month];
        var base = p.price * (2 + seededRandom(storeId, d, pi) * 4);
        dayTotal += base * seas * seed.mult;
      });
      dayTotal += 200 + seededRandom(storeId, d, 99) * 800;
      days.push(Math.round(dayTotal));
    }
    return days;
  }

  /* ── Gerar pedidos 30d ─────────────────────────────────────── */
  function generateOrders30d(storeId) {
    var seed = ANALYTICS_SEED[storeId] || { mult: 1.0 };
    var days = [];
    for (var d = 29; d >= 0; d--) {
      days.push(Math.max(1, Math.round((3 + seededRandom(storeId, d, 200) * 8) * seed.mult)));
    }
    return days;
  }

  /* ── Calcular KPIs do período ──────────────────────────────── */
  function calcKPIs(storeId, products, reviews) {
    var rev30 = generateRevenue30d(storeId, products);
    var ord30 = generateOrders30d(storeId);
    var totalRev  = rev30.reduce(function (a, b) { return a + b; }, 0);
    var totalOrd  = ord30.reduce(function (a, b) { return a + b; }, 0);
    var prevRev   = totalRev * (0.88 + seededRandom(storeId, 0, 55) * 0.15);
    var prevOrd   = Math.round(totalOrd * (0.85 + seededRandom(storeId, 0, 56) * 0.2));
    var ticket    = totalOrd > 0 ? totalRev / totalOrd : 0;
    var prevTick  = prevOrd  > 0 ? prevRev / prevOrd   : 0;
    var storeRevs = reviews.filter(function (r) { return r.storeId === storeId; });
    var avgRating = storeRevs.length
      ? storeRevs.reduce(function (s, r) { return s + r.rating; }, 0) / storeRevs.length
      : 4.5;
    var units = Math.round(totalOrd * (1.8 + seededRandom(storeId, 0, 77) * 1.5));
    var conv  = (2.8 + seededRandom(storeId, 0, 88) * 2.2).toFixed(1);
    var devol = (0.5 + seededRandom(storeId, 0, 89) * 1.0).toFixed(1);

    return {
      rev30: rev30, ord30: ord30,
      totalRev: totalRev, prevRev: prevRev,
      totalOrd: totalOrd, prevOrd: prevOrd,
      ticket: ticket, prevTick: prevTick,
      avgRating: avgRating.toFixed(1),
      units: units,
      conv: conv,
      devol: devol,
    };
  }

  /* ── Rótulos dos últimos 30 dias ───────────────────────────── */
  function last30Labels() {
    var labels = [];
    var now = new Date();
    for (var i = 29; i >= 0; i--) {
      var d = new Date(now.getTime() - i * 86400000);
      labels.push(d.getDate() + '/' + (d.getMonth() + 1));
    }
    return labels;
  }

  /* ── Formatar moeda ────────────────────────────────────────── */
  function fmtBRL(v) {
    return (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function fmtNum(v) {
    return Math.round(v || 0).toLocaleString('pt-BR');
  }

  /* ── Gerenciamento de charts (evita memory leak) ───────────── */
  var _charts = {};

  function destroyChart(id) {
    if (_charts[id]) {
      _charts[id].destroy();
      delete _charts[id];
    }
  }

  function createChart(id, config) {
    destroyChart(id);
    var el = document.getElementById(id);
    if (!el) return null;
    var chart = new Chart(el, config);
    _charts[id] = chart;
    return chart;
  }

  /* ── Delta HTML ────────────────────────────────────────────── */
  function deltaHtml(current, previous, prefix) {
    if (!previous || previous === 0) return '';
    var pct = ((current - previous) / previous * 100).toFixed(1);
    var up  = current >= previous;
    var icon = up ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';
    return '<span class="ai-kpi-delta ' + (up ? 'up' : 'down') + '">' +
      '<i class="fa-solid ' + icon + '"></i>' +
      (prefix || '') + Math.abs(pct) + '% vs mês ant.' +
    '</span>';
  }

  /* ── KPI Card HTML ─────────────────────────────────────────── */
  function kpiCard(color, icon, value, label, delta) {
    return '<div class="ai-kpi-card ' + color + '">' +
      '<div class="ai-kpi-icon ' + color + '"><i class="fa-solid ' + icon + '"></i></div>' +
      '<div class="ai-kpi-value ai-counter" data-target="' + (typeof value === 'number' ? value.toFixed(2) : value) + '">' + value + '</div>' +
      '<div class="ai-kpi-label">' + label + '</div>' +
      (delta || '') +
    '</div>';
  }

  /* ── Insight Card HTML ─────────────────────────────────────── */
  function insightCard(color, icon, title, text) {
    return '<div class="ai-insight">' +
      '<div class="ai-insight-icon ' + color + '"><i class="fa-solid ' + icon + '"></i></div>' +
      '<div class="ai-insight-body"><div class="ai-insight-title">' + title + '</div>' +
      '<div class="ai-insight-text">' + text + '</div></div>' +
    '</div>';
  }

  /* ══════════════════════════════════════════════════════════════
     MÓDULO 1 — VISÃO GERAL
  ══════════════════════════════════════════════════════════════ */
  function renderModule1_Geral(storeId, products, reviews) {
    var kpi = calcKPIs(storeId, products, reviews);
    var labels = last30Labels();
    var catMap = {};
    products.forEach(function (p) {
      catMap[p.category] = (catMap[p.category] || 0) + 1;
    });
    var catLabels = Object.keys(catMap).map(function (c) {
      return ({ racao: 'Ração', adubo: 'Adubos', defensivo: 'Defensivos', medicamento: 'Medicamentos', sementes: 'Sementes', outros: 'Outros' }[c] || c);
    });
    var catColors = Object.keys(catMap).map(function (c) {
      return ({ racao: C.green, adubo: C.blue, defensivo: C.gold, medicamento: C.red, sementes: C.purple, outros: C.cyan }[c] || C.text3);
    });

    var top3 = products.slice().sort(function (a, b) { return b.price - a.price; }).slice(0, 3);

    var html =
      '<div class="ai-kpi-grid">' +
        kpiCard('green', 'fa-dollar-sign', fmtBRL(kpi.totalRev), 'Receita Bruta (30d)', deltaHtml(kpi.totalRev, kpi.prevRev)) +
        kpiCard('blue',  'fa-cart-shopping', fmtNum(kpi.totalOrd), 'Total de Pedidos', deltaHtml(kpi.totalOrd, kpi.prevOrd)) +
        kpiCard('gold',  'fa-receipt', fmtBRL(kpi.ticket), 'Ticket Médio', deltaHtml(kpi.ticket, kpi.prevTick)) +
        kpiCard('cyan',  'fa-arrow-pointer', kpi.conv + '%', 'Taxa de Conversão', '') +
      '</div>' +

      '<div class="ai-kpi-grid-3">' +
        kpiCard('purple', 'fa-box-open', fmtNum(kpi.units), 'Unidades Vendidas', '') +
        kpiCard('red',    'fa-rotate-left', kpi.devol + '%', 'Taxa de Devolução', '') +
        kpiCard('green',  'fa-star', kpi.avgRating + '/5.0', 'Score de Satisfação', '') +
      '</div>' +

      '<div class="ai-grid-2">' +
        '<div class="ai-card">' +
          '<div class="ai-card-header"><div class="ai-card-title"><i class="fa-solid fa-chart-line"></i> Receita 30 Dias</div></div>' +
          '<div class="ai-chart-wrap"><canvas id="aiChartRevenue30" height="180"></canvas></div>' +
        '</div>' +
        '<div class="ai-card">' +
          '<div class="ai-card-header"><div class="ai-card-title"><i class="fa-solid fa-chart-pie"></i> Distribuição por Categoria</div></div>' +
          '<div class="ai-chart-wrap" style="display:flex;justify-content:center"><canvas id="aiChartCatDonut" height="200" width="200"></canvas></div>' +
        '</div>' +
      '</div>' +

      '<div class="ai-card">' +
        '<div class="ai-card-header"><div class="ai-card-title"><i class="fa-solid fa-trophy"></i> Top 3 Produtos por Preço</div></div>' +
        '<table class="ai-table"><thead><tr><th>#</th><th>Produto</th><th>Categoria</th><th>Preço</th><th>Estoque</th></tr></thead><tbody>' +
        top3.map(function (p, i) {
          var medals = ['🥇', '🥈', '🥉'];
          return '<tr>' +
            '<td style="font-size:1rem">' + (medals[i] || (i + 1)) + '</td>' +
            '<td class="ai-table-name">' + p.title + '</td>' +
            '<td><span style="font-size:.7rem;color:var(--ai-text-2)">' + (p.category || '-') + '</span></td>' +
            '<td style="font-weight:700;color:var(--ai-accent)">' + fmtBRL(p.price) + '</td>' +
            '<td style="color:var(--ai-text-2)">' + p.stock + '</td>' +
          '</tr>';
        }).join('') +
        '</tbody></table>' +
      '</div>';

    document.getElementById('aiModuleContent').innerHTML = html;

    /* Chart — Receita 30d */
    createChart('aiChartRevenue30', {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Receita (R$)',
          data: kpi.rev30,
          borderColor: C.green,
          backgroundColor: 'rgba(34,197,94,0.08)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: C.text3, font: { size: 10 }, maxTicksLimit: 8 }, grid: { color: 'rgba(30,45,69,.5)' } },
          y: { ticks: { color: C.text3, font: { size: 10 }, callback: function (v) { return 'R$' + (v/1000).toFixed(1) + 'k'; } }, grid: { color: 'rgba(30,45,69,.5)' } },
        },
      },
    });

    /* Chart — Donut categorias */
    createChart('aiChartCatDonut', {
      type: 'doughnut',
      data: {
        labels: catLabels,
        datasets: [{ data: Object.values(catMap), backgroundColor: catColors, borderColor: C.surface, borderWidth: 3 }],
      },
      options: {
        responsive: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: C.text2, font: { size: 11 }, padding: 12 } },
        },
        cutout: '65%',
      },
    });
  }

  /* ══════════════════════════════════════════════════════════════
     MÓDULO 2 — PERFORMANCE DE PRODUTOS
  ══════════════════════════════════════════════════════════════ */
  function renderModule2_Produtos(storeId, products, reviews) {
    var seed = ANALYTICS_SEED[storeId] || { mult: 1.0 };

    /* Calcular métricas por produto */
    var rows = products.map(function (p, pi) {
      var cat = p.category || 'outros';
      var month = new Date().getMonth();
      var seas = (SAFRA_SEASONALITY[cat] || SAFRA_SEASONALITY.racao)[month];
      var units = Math.round((2 + seededRandom(storeId, pi, pi + 10) * 6) * seed.mult * seas * 10);
      var rev = p.price * units;
      var views = Math.round(units * (8 + seededRandom(storeId, pi, pi + 20) * 12));
      var conv = (views > 0 ? units / views * 100 : 0).toFixed(1);
      var pRevs = reviews.filter(function (r) { return r.productId === p.id; });
      var rating = pRevs.length ? (pRevs.reduce(function (s, r) { return s + r.rating; }, 0) / pRevs.length).toFixed(1) : p.rating.toFixed(1);
      var stockPct = p.stock > 0 ? Math.min(100, (p.stock / 500) * 100) : 0;
      var stockColor = stockPct > 50 ? 'green' : (stockPct > 20 ? 'yellow' : 'red');
      var trend = seededRandom(storeId, pi, pi + 30) > 0.45 ? 'up' : 'down';
      var sparkId = 'aiSpark' + p.id;

      return {
        p: p, units: units, rev: rev, views: views, conv: conv,
        rating: rating, stockPct: stockPct, stockColor: stockColor,
        trend: trend, sparkId: sparkId,
      };
    });

    /* Gerar insights */
    var topProd = rows.slice().sort(function (a, b) { return b.rev - a.rev; })[0];
    var lowStock = rows.filter(function (r) { return r.stockPct <= 20; });
    var highConv = rows.slice().sort(function (a, b) { return parseFloat(b.conv) - parseFloat(a.conv); })[0];

    var insights = '';
    if (topProd) {
      insights += insightCard('green', 'fa-trophy',
        'Produto estrela: ' + topProd.p.title.slice(0, 30) + '...',
        'Responsável por ' + fmtBRL(topProd.rev) + ' em receita estimada no período.');
    }
    if (lowStock.length > 0) {
      insights += insightCard('red', 'fa-triangle-exclamation',
        lowStock.length + ' produto(s) com estoque crítico',
        lowStock.map(function (r) { return r.p.title.slice(0, 20); }).join(', ') + ' precisam de reposição urgente.');
    }
    if (highConv) {
      insights += insightCard('blue', 'fa-chart-line',
        'Melhor conversão: ' + highConv.p.title.slice(0, 28) + '...',
        highConv.conv + '% dos visitantes converteram — destaque esta oferta na vitrine.');
    }

    var html =
      '<div class="ai-card" style="padding:0">' +
        '<div class="ai-card-header">' +
          '<div class="ai-card-title"><i class="fa-solid fa-boxes-stacked"></i> Performance por Produto</div>' +
          '<div style="display:flex;gap:8px">' +
            '<button class="ai-btn ai-btn-outline" onclick="AgroInsights._exportCSV()"><i class="fa-solid fa-download"></i> CSV</button>' +
          '</div>' +
        '</div>' +
        '<div style="overflow-x:auto">' +
          '<table class="ai-table"><thead><tr>' +
            '<th>Produto</th><th>Receita</th><th>Unidades</th><th>Visualiz.</th><th>Conversão</th>' +
            '<th>Avaliação</th><th>Estoque</th><th>Tendência</th>' +
          '</tr></thead><tbody>' +
          rows.map(function (r) {
            return '<tr>' +
              '<td class="ai-table-name" style="max-width:160px">' + r.p.title + '</td>' +
              '<td style="font-weight:700;color:var(--ai-accent);white-space:nowrap">' + fmtBRL(r.rev) + '</td>' +
              '<td>' + fmtNum(r.units) + '</td>' +
              '<td>' + fmtNum(r.views) + '</td>' +
              '<td>' + r.conv + '%</td>' +
              '<td style="color:var(--ai-gold)"><i class="fa-solid fa-star" style="font-size:.65rem"></i> ' + r.rating + '</td>' +
              '<td>' +
                '<div class="ai-progress-wrap" style="min-width:90px">' +
                  '<div class="ai-progress-bar"><div class="ai-progress-fill ' + r.stockColor + '" style="width:' + r.stockPct.toFixed(0) + '%"></div></div>' +
                  '<span class="ai-progress-pct" style="font-size:.68rem">' + r.p.stock + '</span>' +
                '</div>' +
              '</td>' +
              '<td>' +
                '<span style="font-size:.8rem;color:' + (r.trend === 'up' ? 'var(--ai-accent)' : 'var(--ai-red)') + '">' +
                  '<i class="fa-solid ' + (r.trend === 'up' ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down') + '"></i>' +
                '</span>' +
              '</td>' +
            '</tr>';
          }).join('') +
          '</tbody></table>' +
        '</div>' +
      '</div>' +

      '<div class="ai-section-title">Insights Automáticos</div>' +
      '<div style="display:flex;flex-direction:column;gap:10px">' + insights + '</div>';

    document.getElementById('aiModuleContent').innerHTML = html;

    /* Guardar rows para export */
    window._aiLastRows = rows;
  }

  /* ══════════════════════════════════════════════════════════════
     MÓDULO 3 — INTELIGÊNCIA DE MERCADO
  ══════════════════════════════════════════════════════════════ */
  function renderModule3_Mercado(storeId, products) {
    var seed = ANALYTICS_SEED[storeId] || { mult: 1.0, share: 20 };

    /* Benchmark por produto */
    var benchRows = products.map(function (p, pi) {
      var avgMkt   = p.price * (0.92 + seededRandom(storeId, pi, pi + 40) * 0.16);
      var minMkt   = avgMkt * (0.78 + seededRandom(storeId, pi, pi + 41) * 0.1);
      var diff     = ((p.price - avgMkt) / avgMkt * 100).toFixed(1);
      var tag      = parseFloat(diff) > 5 ? 'above' : (parseFloat(diff) < -5 ? 'below' : 'market');
      var tagLabel = tag === 'above' ? 'Acima' : (tag === 'below' ? 'Abaixo' : 'Na média');
      return { p: p, avgMkt: avgMkt, minMkt: minMkt, diff: diff, tag: tag, tagLabel: tagLabel };
    });

    /* Market share por categoria */
    var shares = {
      racao: 34, adubo: 28, defensivo: 19, medicamento: 22, sementes: 41,
    };
    var cat = products.length ? products[0].category : null;
    var shareVal = cat ? (shares[cat] || seed.share) : seed.share;

    /* Radar */
    var myScores   = [seed.mult * 7, 4.8, 8.5, products.length * 1.5 + 3];
    var mktScores  = [6.5, 4.5, 7.8, 6.0];
    var topScores  = [9.2, 4.9, 9.1, 8.5];

    var html =
      '<div class="ai-grid-2">' +
        '<div class="ai-card">' +
          '<div class="ai-card-header"><div class="ai-card-title"><i class="fa-solid fa-radar-chart"></i><i class="fa-solid fa-bullseye"></i> Radar Competitivo</div></div>' +
          '<div class="ai-chart-wrap" style="display:flex;justify-content:center"><canvas id="aiChartRadar" height="260" width="260"></canvas></div>' +
        '</div>' +
        '<div class="ai-card">' +
          '<div class="ai-card-header"><div class="ai-card-title"><i class="fa-solid fa-pie-chart"></i><i class="fa-solid fa-chart-pie"></i> Market Share Estimado</div></div>' +
          '<div>' +
          ['Ração', 'Adubos', 'Defensivos', 'Medicamentos', 'Sementes'].map(function (lbl, i) {
            var cats  = ['racao', 'adubo', 'defensivo', 'medicamento', 'sementes'];
            var pcts  = [34, 28, 19, 22, 41];
            var cols  = [C.green, C.blue, C.gold, C.red, C.purple];
            var isMy  = products.some(function (p) { return p.category === cats[i]; });
            return '<div class="ai-market-share-row">' +
              '<div class="ai-market-cat" style="background:' + cols[i] + '22;color:' + cols[i] + '">' +
                '<i class="fa-solid ' + ['fa-cow','fa-flask','fa-shield','fa-syringe','fa-seedling'][i] + '"></i>' +
              '</div>' +
              '<div class="ai-market-name">' + lbl + (isMy ? ' <span style="font-size:.65rem;color:var(--ai-accent)">(sua loja)</span>' : '') + '</div>' +
              '<div class="ai-progress-bar" style="max-width:120px;flex:1">' +
                '<div class="ai-progress-fill" style="width:' + pcts[i] + '%;background:' + cols[i] + '"></div>' +
              '</div>' +
              '<div class="ai-market-pct" style="color:' + cols[i] + ';min-width:38px;text-align:right">' + pcts[i] + '%</div>' +
            '</div>';
          }).join('') +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="ai-card">' +
        '<div class="ai-card-header"><div class="ai-card-title"><i class="fa-solid fa-scale-balanced"></i> Benchmark de Preços</div></div>' +
        '<div>' +
        benchRows.map(function (r) {
          return '<div class="ai-benchmark-row">' +
            '<div class="ai-benchmark-name">' + r.p.title.slice(0, 35) + '...</div>' +
            '<div class="ai-benchmark-prices">' +
              '<div class="ai-benchmark-price"><div class="ai-benchmark-price-val">' + fmtBRL(r.minMkt) + '</div><span class="ai-benchmark-price-lbl">Menor Mkt</span></div>' +
              '<div class="ai-benchmark-price"><div class="ai-benchmark-price-val">' + fmtBRL(r.avgMkt) + '</div><span class="ai-benchmark-price-lbl">Média Mkt</span></div>' +
              '<div class="ai-benchmark-price"><div class="ai-benchmark-price-val" style="color:var(--ai-accent)">' + fmtBRL(r.p.price) + '</div><span class="ai-benchmark-price-lbl">Seu Preço</span></div>' +
              '<span class="ai-price-tag ' + r.tag + '">' + (parseFloat(r.diff) >= 0 ? '+' : '') + r.diff + '% ' + r.tagLabel + '</span>' +
            '</div>' +
          '</div>';
        }).join('') +
        '</div>' +
      '</div>';

    document.getElementById('aiModuleContent').innerHTML = html;

    createChart('aiChartRadar', {
      type: 'radar',
      data: {
        labels: ['Preço', 'Avaliação', 'Entrega', 'Variedade'],
        datasets: [
          { label: 'Você',          data: myScores,  borderColor: C.green,  backgroundColor: 'rgba(34,197,94,.15)',  borderWidth: 2, pointBackgroundColor: C.green },
          { label: 'Média Mercado', data: mktScores, borderColor: C.blue,   backgroundColor: 'rgba(59,130,246,.10)', borderWidth: 2, pointBackgroundColor: C.blue  },
          { label: 'Top Performer', data: topScores, borderColor: C.gold,   backgroundColor: 'rgba(245,158,11,.10)', borderWidth: 2, pointBackgroundColor: C.gold  },
        ],
      },
      options: {
        responsive: false,
        plugins: { legend: { labels: { color: C.text2, font: { size: 11 } } } },
        scales: {
          r: {
            ticks: { color: C.text3, backdropColor: 'transparent', font: { size: 10 } },
            grid:  { color: C.border },
            pointLabels: { color: C.text2, font: { size: 11 } },
            min: 0, max: 10,
          },
        },
      },
    });
  }

  /* ══════════════════════════════════════════════════════════════
     MÓDULO 4 — ANALYTICS DE CLIENTES
  ══════════════════════════════════════════════════════════════ */
  function renderModule4_Clientes(storeId, products) {
    var seed = ANALYTICS_SEED[storeId] || { mult: 1.0, city: 'Lucas do Rio Verde' };

    /* Cidades e volumes */
    var cities = [
      { name: 'Lucas do Rio Verde', x: 38, y: 28, vol: Math.round(30 + seededRandom(storeId, 0, 60) * 40) },
      { name: 'Sorriso',            x: 48, y: 22, vol: Math.round(20 + seededRandom(storeId, 0, 61) * 30) },
      { name: 'Sinop',              x: 55, y: 18, vol: Math.round(15 + seededRandom(storeId, 0, 62) * 25) },
      { name: 'Rondonópolis',       x: 60, y: 68, vol: Math.round(10 + seededRandom(storeId, 0, 63) * 20) },
      { name: 'Cuiabá',            x: 38, y: 60, vol: Math.round(12 + seededRandom(storeId, 0, 64) * 18) },
      { name: 'Nova Mutum',         x: 42, y: 32, vol: Math.round(18 + seededRandom(storeId, 0, 65) * 28) },
    ];
    var maxVol = Math.max.apply(null, cities.map(function (c) { return c.vol; }));

    /* Novos vs recorrentes */
    var recPct  = Math.round(30 + seededRandom(storeId, 0, 70) * 30);
    var newPct  = 100 - recPct;

    /* Top compradores anonimizados */
    var buyerNames = ['Fazenda Boa Vista', 'Comprador Premium A', 'Sítio Esperança', 'Agropec do Cerrado', 'Fazenda Planalto', 'Cooperativa Norte MT'];
    var topBuyers = buyerNames.map(function (n, i) {
      return {
        name: n,
        orders: Math.round(3 + seededRandom(storeId, i, i + 70) * 10),
        total: Math.round((500 + seededRandom(storeId, i, i + 71) * 3000) * seed.mult),
        city: cities[i % cities.length].name,
      };
    }).sort(function (a, b) { return b.total - a.total; }).slice(0, 5);

    /* Mapa SVG */
    var mapDots = cities.map(function (c) {
      var r = 6 + (c.vol / maxVol) * 14;
      var opacity = 0.5 + (c.vol / maxVol) * 0.5;
      return '<circle cx="' + c.x + '%" cy="' + c.y + '%" r="' + r + '" fill="' + C.green + '" opacity="' + opacity.toFixed(2) + '"/>' +
        '<text x="' + c.x + '%" y="calc(' + c.y + '% + ' + (r + 12) + 'px)" text-anchor="middle" font-size="9" fill="' + C.text3 + '">' + c.name.split(' ')[0] + '</text>';
    }).join('');

    var html =
      '<div class="ai-grid-2">' +
        '<div class="ai-card">' +
          '<div class="ai-card-header"><div class="ai-card-title"><i class="fa-solid fa-map-location-dot"></i> Origem dos Clientes — MT</div></div>' +
          '<div class="ai-map-wrap">' +
            '<svg class="ai-map-svg" viewBox="0 0 100 100" style="background:var(--ai-surface2);border-radius:10px;max-height:280px">' +
              '<rect width="100" height="100" fill="var(--ai-surface2)"/>' +
              '<text x="50" y="92" text-anchor="middle" font-size="6" fill="var(--ai-text-3)">Mato Grosso — MT</text>' +
              mapDots +
            '</svg>' +
            '<div class="ai-map-legend">' +
            cities.map(function (c) {
              return '<div class="ai-map-legend-item"><div class="ai-map-dot" style="width:' + (6 + c.vol / maxVol * 8) + 'px;height:' + (6 + c.vol / maxVol * 8) + 'px;background:var(--ai-accent);border-radius:50%;opacity:0.7"></div>' + c.name + ' (' + c.vol + ')</div>';
            }).join('') +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div style="display:flex;flex-direction:column;gap:16px">' +
          '<div class="ai-card">' +
            '<div class="ai-card-header"><div class="ai-card-title"><i class="fa-solid fa-users"></i> Novos vs Recorrentes</div></div>' +
            '<div class="ai-chart-wrap" style="display:flex;justify-content:center"><canvas id="aiChartClientes" height="180" width="180"></canvas></div>' +
          '</div>' +
          '<div class="ai-card">' +
            '<div class="ai-card-header"><div class="ai-card-title"><i class="fa-solid fa-crown"></i> Top Compradores</div></div>' +
            '<table class="ai-table"><thead><tr><th>Comprador</th><th>Pedidos</th><th>Total</th></tr></thead><tbody>' +
            topBuyers.map(function (b) {
              return '<tr><td class="ai-table-name">' + b.name + '</td><td>' + b.orders + '</td><td style="font-weight:700;color:var(--ai-accent)">' + fmtBRL(b.total) + '</td></tr>';
            }).join('') +
            '</tbody></table>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.getElementById('aiModuleContent').innerHTML = html;

    createChart('aiChartClientes', {
      type: 'doughnut',
      data: {
        labels: ['Novos', 'Recorrentes'],
        datasets: [{ data: [newPct, recPct], backgroundColor: [C.blue, C.green], borderColor: C.surface, borderWidth: 3 }],
      },
      options: {
        responsive: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: C.text2, font: { size: 11 }, padding: 12 } },
          tooltip: {
            callbacks: { label: function (ctx) { return ctx.label + ': ' + ctx.parsed + '%'; } },
          },
        },
        cutout: '60%',
      },
    });
  }

  /* ══════════════════════════════════════════════════════════════
     MÓDULO 5 — GESTÃO DE ESTOQUE
  ══════════════════════════════════════════════════════════════ */
  function renderModule5_Estoque(storeId, products) {
    var seed = ANALYTICS_SEED[storeId] || { mult: 1.0 };
    var month = new Date().getMonth();
    var meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

    var rows = products.map(function (p, pi) {
      var cat = p.category || 'outros';
      var seas = (SAFRA_SEASONALITY[cat] || SAFRA_SEASONALITY.racao)[month];
      var dailySales = (1 + seededRandom(storeId, pi, pi + 80) * 3) * seed.mult * seas;
      var days2zero  = dailySales > 0 ? Math.round(p.stock / dailySales) : 999;
      var stockPct   = Math.min(100, (p.stock / 500) * 100);
      var color      = stockPct > 50 ? 'green' : (stockPct > 20 ? 'yellow' : 'red');
      var opp        = p.price * Math.max(0, 30 - days2zero) * dailySales;
      return { p: p, dailySales: dailySales.toFixed(1), days2zero: Math.min(days2zero, 999), stockPct: stockPct, color: color, opp: opp };
    });

    /* Calendário safra */
    var cats = ['racao', 'adubo', 'defensivo', 'medicamento', 'sementes'];
    var catLabels = { racao: 'Ração', adubo: 'Adubos', defensivo: 'Defensivos', medicamento: 'Medicamentos', sementes: 'Sementes' };

    var html =
      '<div class="ai-card">' +
        '<div class="ai-card-header"><div class="ai-card-title"><i class="fa-solid fa-warehouse"></i> Status do Estoque</div></div>' +
        '<table class="ai-table"><thead><tr><th>Produto</th><th>Estoque</th><th>Nível</th><th>Dias Restantes</th><th>Custo Oportunidade</th></tr></thead><tbody>' +
        rows.map(function (r) {
          var daysColor = r.days2zero < 10 ? 'var(--ai-red)' : (r.days2zero < 30 ? 'var(--ai-gold)' : 'var(--ai-text-2)');
          return '<tr>' +
            '<td class="ai-table-name">' + r.p.title + '</td>' +
            '<td style="font-weight:600;color:var(--ai-text-1)">' + r.p.stock + ' ' + r.p.unit + '</td>' +
            '<td>' +
              '<div class="ai-progress-wrap" style="min-width:120px">' +
                '<div class="ai-progress-bar"><div class="ai-progress-fill ' + r.color + '" style="width:' + r.stockPct.toFixed(0) + '%"></div></div>' +
                '<span class="ai-progress-pct">' + r.stockPct.toFixed(0) + '%</span>' +
              '</div>' +
            '</td>' +
            '<td style="font-weight:700;color:' + daysColor + '">' + (r.days2zero >= 999 ? '—' : r.days2zero + ' dias') + '</td>' +
            '<td style="color:var(--ai-red)">' + (r.opp > 0 ? '−' + fmtBRL(r.opp) : '—') + '</td>' +
          '</tr>';
        }).join('') +
        '</tbody></table>' +
      '</div>' +

      '<div class="ai-card">' +
        '<div class="ai-card-header"><div class="ai-card-title"><i class="fa-solid fa-calendar-days"></i> Calendário de Safra — Demanda por Mês</div></div>' +
        '<div class="ai-safra-grid">' +
          '<div class="ai-safra-row">' +
            '<div></div>' +
            meses.map(function (m) { return '<div class="ai-safra-month-header">' + m + '</div>'; }).join('') +
          '</div>' +
          cats.map(function (cat) {
            var seas = SAFRA_SEASONALITY[cat] || SAFRA_SEASONALITY.racao;
            return '<div class="ai-safra-row">' +
              '<div class="ai-safra-label">' + catLabels[cat] + '</div>' +
              seas.map(function (s, mi) {
                var isActive = s >= 1.0;
                var intensity = Math.round((s - 0.5) / 1.0 * 100);
                return '<div class="ai-safra-cell ' + (isActive ? 'active ' + cat : '') + '" title="' + meses[mi] + ': ' + (s * 100).toFixed(0) + '% demanda" style="opacity:' + Math.max(0.15, Math.min(1, s * 0.7)) + '"></div>';
              }).join('') +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>';

    document.getElementById('aiModuleContent').innerHTML = html;
  }

  /* ══════════════════════════════════════════════════════════════
     MÓDULO 6 — REPUTAÇÃO & SATISFAÇÃO
  ══════════════════════════════════════════════════════════════ */
  function renderModule6_Reputacao(storeId, products, reviews) {
    var storeRevs = reviews.filter(function (r) { return r.storeId === storeId; });
    var avgRating = storeRevs.length
      ? storeRevs.reduce(function (s, r) { return s + r.rating; }, 0) / storeRevs.length
      : 4.5 + seededRandom(storeId, 0, 90) * 0.4;

    /* Distribuição de estrelas */
    var dist = [0, 0, 0, 0, 0]; /* índice 0 = 1 estrela */
    storeRevs.forEach(function (r) { if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1]++; });
    /* Se não tem reviews reais, gerar sintéticas */
    if (storeRevs.length === 0) {
      dist = [
        Math.round(seededRandom(storeId, 0, 91) * 2),
        Math.round(seededRandom(storeId, 0, 92) * 3),
        Math.round(seededRandom(storeId, 0, 93) * 4),
        Math.round(4 + seededRandom(storeId, 0, 94) * 8),
        Math.round(8 + seededRandom(storeId, 0, 95) * 12),
      ];
    }
    var totalRevs = dist.reduce(function (a, b) { return a + b; }, 0) || 1;

    /* NPS sintético */
    var nps = Math.round(40 + seededRandom(storeId, 0, 96) * 50);

    /* Word cloud dos comentários */
    var stopwords = ['o','a','os','as','de','da','do','em','com','que','para','por','um','uma','na','no','se','e','é','foi','mais','mas','muito','bem','produto','entrega'];
    var wordMap = {};
    storeRevs.forEach(function (r) {
      if (!r.comment) return;
      r.comment.toLowerCase().replace(/[^a-záéíóúâêîôûãõç\s]/g, '').split(/\s+/).forEach(function (w) {
        if (w.length > 3 && stopwords.indexOf(w) < 0) wordMap[w] = (wordMap[w] || 0) + 1;
      });
    });
    /* Adicionar palavras sintéticas se reviews insuficientes */
    var synthWords = { 'qualidade': 5, 'excelente': 4, 'rápida': 3, 'recomendo': 4, 'ótimo': 3, 'satisfeito': 2, 'confiável': 3, 'original': 2, 'nota': 2, 'fiscal': 2 };
    if (Object.keys(wordMap).length < 5) {
      Object.keys(synthWords).forEach(function (w) { wordMap[w] = (wordMap[w] || 0) + synthWords[w]; });
    }
    var wordArr = Object.keys(wordMap).map(function (w) { return { w: w, n: wordMap[w] }; })
      .sort(function (a, b) { return b.n - a.n; }).slice(0, 18);
    var maxN = wordArr.length ? wordArr[0].n : 1;

    var npsLabel = nps >= 70 ? 'Excelente' : (nps >= 50 ? 'Bom' : (nps >= 30 ? 'Regular' : 'Crítico'));
    var npsColor = nps >= 70 ? C.green : (nps >= 50 ? C.cyan : (nps >= 30 ? C.gold : C.red));

    var html =
      '<div class="ai-grid-2">' +
        '<div class="ai-card">' +
          '<div class="ai-card-header"><div class="ai-card-title"><i class="fa-solid fa-face-smile"></i> NPS & Score Geral</div></div>' +
          '<div class="ai-score-wrap">' +
            '<canvas id="aiGaugeNPS" width="220" height="130"></canvas>' +
            '<div class="ai-score-label" style="color:' + npsColor + '">' + nps + '</div>' +
            '<div class="ai-score-sub">' + npsLabel + ' — Net Promoter Score<br>Avaliação média: <strong style="color:var(--ai-gold)">' + avgRating.toFixed(1) + ' / 5.0</strong></div>' +
          '</div>' +
        '</div>' +
        '<div class="ai-card">' +
          '<div class="ai-card-header"><div class="ai-card-title"><i class="fa-solid fa-star"></i> Distribuição de Estrelas</div></div>' +
          '<div class="ai-card-body">' +
          [5, 4, 3, 2, 1].map(function (s) {
            var count = dist[s - 1];
            var pct   = (count / totalRevs * 100).toFixed(0);
            return '<div class="ai-star-row">' +
              '<div class="ai-star-label"><i class="fa-solid fa-star" style="color:var(--ai-gold);font-size:.65rem"></i> ' + s + '</div>' +
              '<div class="ai-star-bar"><div class="ai-star-fill" style="width:' + pct + '%"></div></div>' +
              '<div class="ai-star-count">' + count + '</div>' +
            '</div>';
          }).join('') +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="ai-grid-2">' +
        '<div class="ai-card">' +
          '<div class="ai-card-header"><div class="ai-card-title"><i class="fa-solid fa-comment-dots"></i> Timeline de Reviews</div></div>' +
          '<div class="ai-card-body" style="padding:0 20px">' +
          (storeRevs.length > 0 ? storeRevs.map(function (r) {
            var prod = products.find(function (p) { return p.id === r.productId; });
            var stars = '';
            for (var i = 1; i <= 5; i++) stars += '<i class="fa-' + (i <= r.rating ? 'solid' : 'regular') + ' fa-star" style="color:var(--ai-gold);font-size:.6rem"></i>';
            return '<div class="ai-review-item">' +
              '<div class="ai-review-avatar">' + r.reviewerName.charAt(0) + '</div>' +
              '<div class="ai-review-body">' +
                '<div class="ai-review-header">' +
                  '<span class="ai-review-name">' + r.reviewerName + '</span>' +
                  '<span class="ai-review-stars">' + stars + '</span>' +
                  '<span class="ai-review-date">' + new Date(r.createdAt).toLocaleDateString('pt-BR') + '</span>' +
                '</div>' +
                (prod ? '<div class="ai-review-product"><i class="fa-solid fa-box" style="font-size:.6rem"></i> ' + prod.title.slice(0, 30) + '...</div>' : '') +
                '<div class="ai-review-comment">' + r.comment + '</div>' +
              '</div>' +
            '</div>';
          }).join('') :
          '<div class="ai-empty"><i class="fa-regular fa-comment"></i><p>Nenhum review ainda para esta loja.</p></div>') +
          '</div>' +
        '</div>' +

        '<div class="ai-card">' +
          '<div class="ai-card-header"><div class="ai-card-title"><i class="fa-solid fa-font"></i> Palavras Mais Citadas</div></div>' +
          '<div class="ai-wordcloud">' +
          wordArr.map(function (wd) {
            var size = Math.ceil((wd.n / maxN) * 5);
            return '<span class="ai-word size-' + size + '">' + wd.w + '</span>';
          }).join('') +
          '</div>' +
        '</div>' +
      '</div>';

    document.getElementById('aiModuleContent').innerHTML = html;

    /* Gauge NPS em canvas customizado */
    setTimeout(function () {
      var canvas = document.getElementById('aiGaugeNPS');
      if (!canvas) return;
      var ctx = canvas.getContext('2d');
      var cx = 110, cy = 110, r = 85, lw = 16;
      var startAngle = Math.PI, endAngle = 2 * Math.PI;

      /* Background arc */
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.strokeStyle = '#1e2d45';
      ctx.lineWidth = lw;
      ctx.stroke();

      /* Colored arc */
      var fraction = (nps / 100) * Math.PI;
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle, startAngle + fraction);
      ctx.strokeStyle = npsColor;
      ctx.lineWidth = lw;
      ctx.lineCap = 'round';
      ctx.stroke();

      /* Rótulos */
      ctx.fillStyle = C.text3;
      ctx.font = '10px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('0', cx - r - 4, cy + 14);
      ctx.fillText('100', cx + r + 4, cy + 14);

      var labels = ['Crítico', 'Regular', 'Bom', 'Excelente'];
      var angles = [Math.PI * 1.25, Math.PI * 1.5, Math.PI * 1.75];
      labels.slice(0, 3).forEach(function (lbl, i) {
        var ax = cx + (r + 18) * Math.cos(angles[i]);
        var ay = cy + (r + 18) * Math.sin(angles[i]);
        ctx.fillText(lbl, ax, ay);
      });
    }, 80);
  }

  /* ══════════════════════════════════════════════════════════════
     MÓDULO 7 — FINANCEIRO & PROJEÇÕES
  ══════════════════════════════════════════════════════════════ */
  function renderModule7_Financeiro(storeId, products) {
    var seed = ANALYTICS_SEED[storeId] || { mult: 1.0 };
    var kpi  = calcKPIs(storeId, products, []);
    var commission = 0.14;
    var gross  = kpi.totalRev;
    var comm   = gross * commission;
    var net    = gross - comm;
    var prevGross = kpi.prevRev;
    var prevNet   = prevGross * (1 - commission);

    /* Fluxo por produto */
    var prodRows = products.map(function (p, pi) {
      var month = new Date().getMonth();
      var cat = p.category || 'outros';
      var seas = (SAFRA_SEASONALITY[cat] || SAFRA_SEASONALITY.racao)[month];
      var units = Math.round((2 + seededRandom(storeId, pi, pi + 10) * 6) * seed.mult * seas * 10);
      var rev = p.price * units;
      var comm2 = rev * commission;
      return { p: p, rev: rev, comm: comm2, net: rev - comm2, units: units };
    });

    /* Projeção 3 meses */
    var projLabels = [];
    var projBase = [], projOtm = [], projPess = [], projUncMin = [], projUncMax = [];
    var now = new Date();
    for (var m = 1; m <= 3; m++) {
      var mo = new Date(now.getFullYear(), now.getMonth() + m, 1);
      projLabels.push(mo.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }));
      var base = net * (1 + (seededRandom(storeId, m, m + 100) - 0.4) * 0.12);
      var otm  = base * (1.10 + seededRandom(storeId, m, m + 101) * 0.05);
      var pess = base * (0.85 - seededRandom(storeId, m, m + 102) * 0.05);
      projBase.push(Math.round(base));
      projOtm.push(Math.round(otm));
      projPess.push(Math.round(pess));
      projUncMin.push(Math.round(pess * 0.92));
      projUncMax.push(Math.round(otm * 1.05));
    }

    var html =
      '<div class="ai-grid-2">' +
        '<div class="ai-card">' +
          '<div class="ai-card-header"><div class="ai-card-title"><i class="fa-solid fa-file-invoice-dollar"></i> Demonstrativo do Período</div></div>' +
          '<div class="ai-fin-row"><span class="ai-fin-label">Receita Bruta (30d)</span><span class="ai-fin-value">' + fmtBRL(gross) + ' <span class="ai-fin-delta ' + (gross >= prevGross ? 'up' : 'down') + '">' + (gross >= prevGross ? '▲' : '▼') + ' vs ant.</span></span></div>' +
          '<div class="ai-fin-row"><span class="ai-fin-label">Comissão Plataforma (14%)</span><span class="ai-fin-value" style="color:var(--ai-red)">−' + fmtBRL(comm) + '</span></div>' +
          '<div class="ai-fin-row total"><span class="ai-fin-label" style="font-weight:700;color:var(--ai-text-1)">Receita Líquida</span><span class="ai-fin-value" style="color:var(--ai-accent);font-size:1rem">' + fmtBRL(net) + ' <span class="ai-fin-delta ' + (net >= prevNet ? 'up' : 'down') + '">' + (net >= prevNet ? '▲' : '▼') + ' vs ant.</span></span></div>' +
        '</div>' +
        '<div class="ai-card">' +
          '<div class="ai-card-header"><div class="ai-card-title"><i class="fa-solid fa-chart-line"></i> Projeção 3 Meses</div></div>' +
          '<div class="ai-chart-wrap"><canvas id="aiChartProjecao" height="180"></canvas></div>' +
        '</div>' +
      '</div>' +

      '<div class="ai-card">' +
        '<div class="ai-card-header"><div class="ai-card-title"><i class="fa-solid fa-table"></i> Fluxo de Caixa por Produto</div></div>' +
        '<table class="ai-table"><thead><tr><th>Produto</th><th>Unidades</th><th>Receita Bruta</th><th>Comissão</th><th>Receita Líquida</th></tr></thead><tbody>' +
        prodRows.map(function (r) {
          return '<tr>' +
            '<td class="ai-table-name">' + r.p.title + '</td>' +
            '<td>' + fmtNum(r.units) + '</td>' +
            '<td style="font-weight:700;color:var(--ai-text-1)">' + fmtBRL(r.rev) + '</td>' +
            '<td style="color:var(--ai-red)">−' + fmtBRL(r.comm) + '</td>' +
            '<td style="font-weight:700;color:var(--ai-accent)">' + fmtBRL(r.net) + '</td>' +
          '</tr>';
        }).join('') +
        '</tbody></table>' +
      '</div>';

    document.getElementById('aiModuleContent').innerHTML = html;

    createChart('aiChartProjecao', {
      type: 'line',
      data: {
        labels: projLabels,
        datasets: [
          {
            label: 'Cenário Base',
            data: projBase,
            borderColor: C.green, backgroundColor: 'rgba(34,197,94,.08)',
            fill: true, tension: 0.4, borderWidth: 2, pointRadius: 5,
            pointBackgroundColor: C.green,
          },
          {
            label: 'Otimista',
            data: projOtm,
            borderColor: C.blue, borderDash: [6, 3],
            backgroundColor: 'transparent', tension: 0.4, borderWidth: 1.5, pointRadius: 4,
            pointBackgroundColor: C.blue,
          },
          {
            label: 'Pessimista',
            data: projPess,
            borderColor: C.red, borderDash: [4, 4],
            backgroundColor: 'transparent', tension: 0.4, borderWidth: 1.5, pointRadius: 4,
            pointBackgroundColor: C.red,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: C.text2, font: { size: 11 } } } },
        scales: {
          x: { ticks: { color: C.text3 }, grid: { color: 'rgba(30,45,69,.5)' } },
          y: { ticks: { color: C.text3, callback: function (v) { return 'R$' + (v / 1000).toFixed(0) + 'k'; } }, grid: { color: 'rgba(30,45,69,.5)' } },
        },
      },
    });
  }

  /* ══════════════════════════════════════════════════════════════
     MÓDULO 8 — VISIBILIDADE & SEO
  ══════════════════════════════════════════════════════════════ */
  function renderModule8_Visibilidade(storeId, products, reviews) {
    var seed = ANALYTICS_SEED[storeId] || { mult: 1.0 };
    var score = Math.round(55 + seededRandom(storeId, 0, 110) * 35);
    var scoreColor = score >= 75 ? C.green : (score >= 55 ? C.gold : C.red);
    var scoreLabel = score >= 75 ? 'Excelente' : (score >= 55 ? 'Bom' : 'Precisa Melhorar');

    /* Ranking por categoria */
    var myCat = products.length ? products[0].category : 'outros';
    var catNames = { racao: 'Ração', adubo: 'Adubos', defensivo: 'Defensivos', medicamento: 'Medicamentos', sementes: 'Sementes' };
    var rank = Math.ceil(seededRandom(storeId, 0, 111) * 3) + 1;

    /* CTR por produto */
    var prodRows = products.map(function (p, pi) {
      var ctr = (1.5 + seededRandom(storeId, pi, pi + 115) * 5.5).toFixed(1);
      var imp = Math.round(200 + seededRandom(storeId, pi, pi + 116) * 800);
      var clicks = Math.round(imp * parseFloat(ctr) / 100);
      return { p: p, ctr: ctr, imp: imp, clicks: clicks };
    });

    /* Dicas de melhoria personalizadas */
    var tips = [];
    if (score < 70) tips.push({ color: 'gold', icon: 'fa-image', title: 'Adicione mais imagens', text: 'Produtos com 3+ fotos têm 60% mais cliques. Adicione fotos de uso real.' });
    if (products.some(function (p) { return !p.description || p.description.length < 100; }))
      tips.push({ color: 'blue', icon: 'fa-pen-to-square', title: 'Descrições mais completas', text: 'Ao menos 1 produto tem descrição curta. Descrições ricas aumentam a conversão.' });
    tips.push({ color: 'green', icon: 'fa-tags', title: 'Use palavras-chave nos títulos', text: 'Inclua termos como "certificado MAPA", "nota fiscal" e "entrega MT" nos títulos.' });
    if (products.some(function (p) { return p.totalReviews < 5; }))
      tips.push({ color: 'purple', icon: 'fa-star', title: 'Solicite mais avaliações', text: 'Produtos com menos de 5 reviews aparecem menos nos resultados. Incentive seus clientes.' });

    var html =
      '<div class="ai-grid-2">' +
        '<div class="ai-card">' +
          '<div class="ai-card-header"><div class="ai-card-title"><i class="fa-solid fa-gauge-high"></i> Score de Visibilidade</div></div>' +
          '<div class="ai-score-wrap">' +
            '<canvas id="aiGaugeVisib" width="220" height="130"></canvas>' +
            '<div class="ai-score-label" style="color:' + scoreColor + '">' + score + '/100</div>' +
            '<div class="ai-score-sub">' + scoreLabel + '<br><span style="color:var(--ai-text-3)">Ranking na categoria ' + (catNames[myCat] || myCat) + ': <strong style="color:var(--ai-text-1)">#' + rank + 'º lugar</strong></span></div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:12px">' +
          '<div class="ai-section-title">Dicas de Melhoria</div>' +
          tips.map(function (t) { return insightCard(t.color, t.icon, t.title, t.text); }).join('') +
        '</div>' +
      '</div>' +

      '<div class="ai-card">' +
        '<div class="ai-card-header"><div class="ai-card-title"><i class="fa-solid fa-arrow-pointer"></i> CTR por Produto</div></div>' +
        '<table class="ai-table"><thead><tr><th>Produto</th><th>Impressões</th><th>Cliques</th><th>CTR</th><th>Posição</th></tr></thead><tbody>' +
        prodRows.map(function (r, i) {
          var ctrColor = parseFloat(r.ctr) >= 4 ? 'var(--ai-accent)' : (parseFloat(r.ctr) >= 2 ? 'var(--ai-gold)' : 'var(--ai-red)');
          return '<tr>' +
            '<td class="ai-table-name">' + r.p.title + '</td>' +
            '<td>' + fmtNum(r.imp) + '</td>' +
            '<td>' + fmtNum(r.clicks) + '</td>' +
            '<td style="font-weight:700;color:' + ctrColor + '">' + r.ctr + '%</td>' +
            '<td style="color:var(--ai-text-2)">#' + (i + rank) + 'º</td>' +
          '</tr>';
        }).join('') +
        '</tbody></table>' +
      '</div>';

    document.getElementById('aiModuleContent').innerHTML = html;

    /* Gauge Visibilidade */
    setTimeout(function () {
      var canvas = document.getElementById('aiGaugeVisib');
      if (!canvas) return;
      var ctx = canvas.getContext('2d');
      var cx = 110, cy = 110, r = 85, lw = 16;
      ctx.beginPath();
      ctx.arc(cx, cy, r, Math.PI, 2 * Math.PI);
      ctx.strokeStyle = '#1e2d45';
      ctx.lineWidth = lw;
      ctx.stroke();
      var fraction = (score / 100) * Math.PI;
      ctx.beginPath();
      ctx.arc(cx, cy, r, Math.PI, Math.PI + fraction);
      ctx.strokeStyle = scoreColor;
      ctx.lineWidth = lw;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.fillStyle = C.text3;
      ctx.font = '10px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('0', cx - r - 4, cy + 14);
      ctx.fillText('100', cx + r + 4, cy + 14);
    }, 80);
  }

  /* ══════════════════════════════════════════════════════════════
     MÓDULO 9 — CENTRAL DE ALERTAS
  ══════════════════════════════════════════════════════════════ */
  function renderModule9_Alertas(storeId, products, reviews) {
    var seed = ANALYTICS_SEED[storeId] || { mult: 1.0 };
    var prefs = (typeof Storage !== 'undefined' && Storage.getAnalyticsPrefs) ? Storage.getAnalyticsPrefs() : {};
    var threshold = prefs.threshold || 20;
    var metaRev   = prefs.metaRev || 50000;

    /* Gerar alertas automáticos baseados nos dados reais */
    var alerts = [];

    /* Estoque crítico */
    products.forEach(function (p) {
      var stockPct = (p.stock / 500) * 100;
      if (stockPct <= threshold) {
        alerts.push({
          type: 'critical', icon: 'fa-triangle-exclamation',
          title: 'Estoque crítico: ' + p.title.slice(0, 30) + '...',
          text: 'Apenas ' + p.stock + ' unidades restantes (' + stockPct.toFixed(0) + '% do máximo). Reponha imediatamente.',
          time: 'Hoje',
        });
      }
    });

    /* Preço acima da média */
    products.forEach(function (p, pi) {
      var avgMkt = p.price * (0.92 + seededRandom(storeId, pi, pi + 40) * 0.16);
      var diff = (p.price - avgMkt) / avgMkt * 100;
      if (diff > 8) {
        alerts.push({
          type: 'warning', icon: 'fa-scale-unbalanced',
          title: 'Preço acima do mercado: ' + p.title.slice(0, 25) + '...',
          text: 'Seu preço está ' + diff.toFixed(1) + '% acima da média de mercado. Considere revisar.',
          time: 'Hoje',
        });
      }
    });

    /* Novas avaliações */
    var storeRevs = reviews.filter(function (r) { return r.storeId === storeId; });
    if (storeRevs.length > 0) {
      var newest = storeRevs[storeRevs.length - 1];
      alerts.push({
        type: newest.rating >= 4 ? 'success' : 'warning',
        icon: 'fa-star',
        title: 'Nova avaliação: ' + newest.rating + ' estrelas',
        text: '"' + newest.comment.slice(0, 60) + '..." — ' + newest.reviewerName,
        time: new Date(newest.createdAt).toLocaleDateString('pt-BR'),
      });
    }

    /* Meta de receita */
    var kpi = calcKPIs(storeId, products, reviews);
    var pctMeta = (kpi.totalRev / metaRev * 100).toFixed(0);
    alerts.push({
      type: kpi.totalRev >= metaRev ? 'success' : 'goal',
      icon: kpi.totalRev >= metaRev ? 'fa-circle-check' : 'fa-bullseye',
      title: (kpi.totalRev >= metaRev ? 'Meta atingida!' : 'Progresso da meta mensal'),
      text: fmtBRL(kpi.totalRev) + ' de ' + fmtBRL(metaRev) + ' (' + pctMeta + '% da meta).',
      time: 'Este mês',
    });

    /* Insight positivo */
    alerts.push({
      type: 'info', icon: 'fa-lightbulb',
      title: 'Dica: Safra em alta!',
      text: 'A demanda por ' + seed.topCat + ' está acima da média sazonal. Garanta estoque para não perder vendas.',
      time: 'Insight automático',
    });

    /* Log histórico simulado */
    var log = [
      { time: '10/05/2026', msg: 'Estoque de produtos reabastecido com sucesso.' },
      { time: '08/05/2026', msg: 'Nova review 5 estrelas recebida.' },
      { time: '05/05/2026', msg: 'Meta de receita de abril atingida (+12%).' },
      { time: '02/05/2026', msg: 'Preço do produto #' + (products[0] ? products[0].id : '1') + ' atualizado.' },
    ];

    var html =
      '<div class="ai-card">' +
        '<div class="ai-card-header">' +
          '<div class="ai-card-title"><i class="fa-solid fa-bell"></i> Alertas Ativos</div>' +
          '<span class="ai-badge-premium">' + alerts.length + ' alertas</span>' +
        '</div>' +
        '<div style="padding:16px">' +
        alerts.map(function (a) {
          return '<div class="ai-alert ' + a.type + '">' +
            '<div class="ai-alert-icon"><i class="fa-solid ' + a.icon + '"></i></div>' +
            '<div class="ai-alert-body">' +
              '<div class="ai-alert-title">' + a.title + '</div>' +
              '<div class="ai-alert-text">' + a.text + '</div>' +
              '<div class="ai-alert-time"><i class="fa-regular fa-clock" style="font-size:.6rem"></i> ' + a.time + '</div>' +
            '</div>' +
          '</div>';
        }).join('') +
        '</div>' +
      '</div>' +

      '<div class="ai-grid-2">' +
        '<div class="ai-card">' +
          '<div class="ai-card-header"><div class="ai-card-title"><i class="fa-solid fa-sliders"></i> Configurar Alertas</div></div>' +
          '<div class="ai-prefs-form">' +
            '<div class="ai-prefs-group">' +
              '<label class="ai-prefs-label">Threshold de estoque (%)</label>' +
              '<input type="number" class="ai-prefs-input" id="aiPrefThreshold" value="' + threshold + '" min="5" max="50">' +
            '</div>' +
            '<div class="ai-prefs-group">' +
              '<label class="ai-prefs-label">Meta de receita mensal (R$)</label>' +
              '<input type="number" class="ai-prefs-input" id="aiPrefMeta" value="' + metaRev + '" min="1000">' +
            '</div>' +
            '<div style="grid-column:1/-1;display:flex;justify-content:flex-end;padding-top:4px">' +
              '<button class="ai-btn ai-btn-primary" id="aiSavePrefs"><i class="fa-solid fa-floppy-disk"></i> Salvar Preferências</button>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="ai-card">' +
          '<div class="ai-card-header"><div class="ai-card-title"><i class="fa-solid fa-clock-rotate-left"></i> Log Histórico</div></div>' +
          '<table class="ai-table"><thead><tr><th>Data</th><th>Evento</th></tr></thead><tbody>' +
          log.map(function (l) {
            return '<tr><td style="color:var(--ai-text-3);white-space:nowrap">' + l.time + '</td><td>' + l.msg + '</td></tr>';
          }).join('') +
          '</tbody></table>' +
        '</div>' +
      '</div>';

    document.getElementById('aiModuleContent').innerHTML = html;

    /* Salvar preferências */
    var saveBtn = document.getElementById('aiSavePrefs');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        var t = parseInt(document.getElementById('aiPrefThreshold').value, 10);
        var m = parseFloat(document.getElementById('aiPrefMeta').value);
        if (isNaN(t) || isNaN(m)) return;
        var p2 = { threshold: t, metaRev: m };
        if (typeof Storage !== 'undefined' && Storage.saveAnalyticsPrefs) Storage.saveAnalyticsPrefs(p2);
        if (typeof Toast !== 'undefined') Toast.show('Preferências salvas!', 'success');
      });
    }
  }

  /* ══════════════════════════════════════════════════════════════
     SISTEMA DE MÓDULOS E ABAS
  ══════════════════════════════════════════════════════════════ */
  var _currentModule = 1;

  var MODULE_META = [
    { id: 1, label: 'Visão Geral',   icon: 'fa-gauge-high' },
    { id: 2, label: 'Produtos',      icon: 'fa-boxes-stacked' },
    { id: 3, label: 'Mercado',       icon: 'fa-globe' },
    { id: 4, label: 'Clientes',      icon: 'fa-users' },
    { id: 5, label: 'Estoque',       icon: 'fa-warehouse' },
    { id: 6, label: 'Reputação',     icon: 'fa-star' },
    { id: 7, label: 'Financeiro',    icon: 'fa-chart-line' },
    { id: 8, label: 'Visibilidade',  icon: 'fa-magnifying-glass-chart' },
    { id: 9, label: 'Alertas',       icon: 'fa-bell', badge: '!' },
  ];

  function switchModule(moduleId, storeId, products, reviews, orders) {
    _currentModule = moduleId;

    /* Atualizar nav sidebar */
    document.querySelectorAll('.ai-nav-item').forEach(function (el) {
      el.classList.toggle('active', parseInt(el.dataset.module, 10) === moduleId);
    });

    /* Atualizar tab bar mobile */
    document.querySelectorAll('.ai-tab-item').forEach(function (el) {
      el.classList.toggle('active', parseInt(el.dataset.module, 10) === moduleId);
    });

    /* Atualizar título */
    var meta = MODULE_META.find(function (m) { return m.id === moduleId; });
    var titleEl = document.getElementById('aiModuleTitle');
    if (titleEl && meta) {
      titleEl.innerHTML = '<i class="fa-solid ' + meta.icon + '"></i> ' + meta.label;
    }

    /* Destruir charts antigos antes de renderizar novo módulo */
    Object.keys(_charts).forEach(function (k) { destroyChart(k); });

    /* Renderizar módulo */
    switch (moduleId) {
      case 1: renderModule1_Geral(storeId, products, reviews); break;
      case 2: renderModule2_Produtos(storeId, products, reviews); break;
      case 3: renderModule3_Mercado(storeId, products); break;
      case 4: renderModule4_Clientes(storeId, products); break;
      case 5: renderModule5_Estoque(storeId, products); break;
      case 6: renderModule6_Reputacao(storeId, products, reviews); break;
      case 7: renderModule7_Financeiro(storeId, products); break;
      case 8: renderModule8_Visibilidade(storeId, products, reviews); break;
      case 9: renderModule9_Alertas(storeId, products, reviews); break;
    }

    animateCounters();
  }

  /* ══════════════════════════════════════════════════════════════
     RENDER PANEL PRINCIPAL
  ══════════════════════════════════════════════════════════════ */
  function renderPanel(storeId, products, reviews, orders) {
    var container = document.getElementById('tabContentAnalytics');
    if (!container) return;

    var sidebarItems = MODULE_META.map(function (m) {
      return '<button class="ai-nav-item' + (m.id === 1 ? ' active' : '') + '" data-module="' + m.id + '">' +
        '<i class="fa-solid ' + m.icon + '"></i> ' + m.label +
        (m.badge ? '<span class="ai-nav-num">' + m.badge + '</span>' : '') +
      '</button>';
    }).join('');

    var tabItems = MODULE_META.map(function (m) {
      return '<button class="ai-tab-item' + (m.id === 1 ? ' active' : '') + '" data-module="' + m.id + '">' +
        '<i class="fa-solid ' + m.icon + '"></i>' +
        '<span>' + m.label.split(' ')[0] + '</span>' +
      '</button>';
    }).join('');

    container.innerHTML =
      '<div class="ai-wrap">' +
        /* Sidebar desktop */
        '<div class="ai-sidebar">' +
          '<div class="ai-sidebar-logo">' +
            '<div class="ai-sidebar-logo-title">AgroInsights</div>' +
            '<div class="ai-sidebar-logo-sub"><span class="ai-badge-premium">PREMIUM</span></div>' +
          '</div>' +
          sidebarItems +
        '</div>' +

        /* Tab bar mobile */
        '<div class="ai-tab-bar">' + tabItems + '</div>' +

        /* Header */
        '<div class="ai-header">' +
          '<div class="ai-header-title" id="aiModuleTitle"><i class="fa-solid fa-gauge-high"></i> Visão Geral</div>' +
          '<div class="ai-header-actions">' +
            '<div class="ai-period-selector">' +
              '<button class="ai-period-btn active" data-period="30">30d</button>' +
              '<button class="ai-period-btn" data-period="7">7d</button>' +
              '<button class="ai-period-btn" data-period="90">90d</button>' +
            '</div>' +
            '<button class="ai-btn ai-btn-outline" onclick="window.print()"><i class="fa-solid fa-print"></i> Imprimir</button>' +
          '</div>' +
        '</div>' +

        /* Content */
        '<div class="ai-content" id="aiModuleContent"></div>' +
      '</div>';

    /* Bindar navegação sidebar */
    container.querySelectorAll('.ai-nav-item, .ai-tab-item').forEach(function (el) {
      el.addEventListener('click', function () {
        switchModule(parseInt(el.dataset.module, 10), storeId, products, reviews, orders);
      });
    });

    /* Period selector */
    container.querySelectorAll('.ai-period-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        container.querySelectorAll('.ai-period-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        switchModule(_currentModule, storeId, products, reviews, orders);
      });
    });

    /* Renderizar módulo 1 */
    switchModule(1, storeId, products, reviews, orders);
  }

  /* ══════════════════════════════════════════════════════════════
     ANIMAÇÃO DE COUNTERS
  ══════════════════════════════════════════════════════════════ */
  function animateCounters() {
    /* Counters são animados via CSS transition — sem lógica de número aqui */
    /* Os valores já estão formatados como strings. A animação é via opacity */
    var items = document.querySelectorAll('.ai-kpi-value');
    items.forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      el.style.transition = 'opacity .4s ease, transform .4s ease';
      setTimeout(function () {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, 80);
    });
  }

  /* ══════════════════════════════════════════════════════════════
     EXPORT CSV
  ══════════════════════════════════════════════════════════════ */
  function exportCSV() {
    var rows = window._aiLastRows || [];
    if (!rows.length) { if (typeof Toast !== 'undefined') Toast.show('Vá para Produtos para exportar.', 'info'); return; }
    var header = ['Produto', 'Categoria', 'Preco', 'Unidades Vendidas', 'Receita Est', 'Visualizacoes', 'Conversao', 'Avaliacao', 'Estoque'];
    var lines = [header.join(';')];
    rows.forEach(function (r) {
      lines.push([
        '"' + r.p.title.replace(/"/g, '') + '"',
        r.p.category,
        r.p.price.toFixed(2).replace('.', ','),
        r.units,
        r.rev.toFixed(2).replace('.', ','),
        r.views,
        r.conv,
        r.rating,
        r.p.stock,
      ].join(';'));
    });
    var blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href     = url;
    a.download = 'agroinsights_produtos.csv';
    a.click();
    URL.revokeObjectURL(url);
    if (typeof Toast !== 'undefined') Toast.show('CSV exportado com sucesso!', 'success');
  }

  /* ── API Pública ───────────────────────────────────────────── */
  return {
    init: function (storeId, products, reviews, orders) {
      reviews = reviews || [];
      orders  = orders  || [];
      renderPanel(storeId, products, reviews, orders);
    },
    _exportCSV: exportCSV,
  };

})();
