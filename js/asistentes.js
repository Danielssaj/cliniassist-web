/* ClinIAssist — pestañas de la sección #asistentes */
(function(){
  var tabs = Array.prototype.slice.call(document.querySelectorAll('#asistentes .ca-tab'));
  if (!tabs.length) return;
  function select(tab, focus){
    tabs.forEach(function(t){
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      if (panel) panel.hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function(tab, i){
    tab.addEventListener('click', function(){ select(tab, false); });
    tab.addEventListener('keydown', function(e){
      if (e.key === 'ArrowRight') { e.preventDefault(); select(tabs[(i + 1) % tabs.length], true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); select(tabs[(i - 1 + tabs.length) % tabs.length], true); }
    });
  });
})();

/* ClinIAssist — opciones de la web de Mateo (Base/Pro/Premium) y el
   interruptor "Con un plan / Solo la web". Los precios viven en un solo
   objeto (PRICES) para poder cambiarlos fácil después. No usa
   .js-whatsapp: script.js arma esos enlaces una sola vez al cargar la
   página, con un solo texto fijo por botón. Acá el mensaje depende de la
   opción Y el modo elegidos, así que el enlace se arma a mano en cada
   selección, con el mismo número de WhatsApp que usa script.js. */
(function(){
  var WHATSAPP_NUMBER = '56979247572';

  var PRICES = {
    base:    { label: 'Base',    plan: 360000, installment: 60000,  web: 450000, savings: 90000,  desde: false },
    pro:     { label: 'Pro',     plan: 540000, installment: 90000,  web: 675000, savings: 135000, desde: false },
    premium: { label: 'Premium', plan: 720000, installment: 120000, web: 900000, savings: 180000, desde: true  }
  };

  function clp(n){
    return '$' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  var addon = document.querySelector('.ca-addon');
  if (!addon) return;
  var tiersGroup = addon.querySelector('.ca-tiers');
  var modeGroup = addon.querySelector('.ca-mode-toggle');
  if (!tiersGroup || !modeGroup) return;
  var tiers = Array.prototype.slice.call(tiersGroup.querySelectorAll('.ca-tier'));
  var modes = Array.prototype.slice.call(modeGroup.querySelectorAll('.ca-mode-btn'));
  if (!tiers.length || !modes.length) return;
  var btn = document.getElementById('caAddonBtn');
  var hint = document.getElementById('caAddonHint');

  var currentMode = 'plan';
  var currentTier = null;

  function renderTierPrice(tier){
    var key = tier.getAttribute('data-tier');
    var data = PRICES[key];
    if (!data) return;
    var container = tier.querySelector('.ca-tier-price');
    if (!container) return;
    var pct = Math.round((1 - data.plan / data.web) * 100);
    // En Premium el precio grande nunca lleva "desde" en la misma línea
    // (se corre a una línea chica arriba, para que el precio quede en una
    // sola línea sin partirse); en las otras líneas (cuotas, sugerencia)
    // sigue yendo inline.
    var desdeLine = data.desde ? '<span class="ca-tier-desde">desde</span>' : '';
    var desdeInline = data.desde ? 'desde ' : '';
    var installmentWord = data.desde ? 'desde' : 'de';
    container.innerHTML =
      '<div class="ca-tier-price-plan">' +
        '<div class="ca-tier-row-old"><span class="ca-tier-old"><s>' + clp(data.web) + '</s></span><span class="ca-tier-off">−' + pct + '%</span></div>' +
        desdeLine +
        '<b class="ca-tier-now">' + clp(data.plan) + '</b>' +
        '<span class="ca-tier-cuotas">o 6 cuotas ' + installmentWord + ' ' + clp(data.installment) + '/mes</span>' +
        '<span class="ca-tier-save"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>Ahorras ' + clp(data.savings) + '</span>' +
      '</div>' +
      '<div class="ca-tier-price-web" hidden>' +
        desdeLine +
        '<b class="ca-tier-now">' + clp(data.web) + '</b>' +
        '<span class="ca-tier-unique">pago único</span>' +
        '<span class="ca-tier-suggest">Con un plan pagas ' + desdeInline + clp(data.plan) + '</span>' +
      '</div>';
  }
  tiers.forEach(renderTierPrice);

  function applyModeDisplay(animate){
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    tiers.forEach(function(tier){
      var priceBox = tier.querySelector('.ca-tier-price');
      var planEl = tier.querySelector('.ca-tier-price-plan');
      var webEl = tier.querySelector('.ca-tier-price-web');
      if (!priceBox || !planEl || !webEl) return;
      var showPlan = currentMode === 'plan';
      if (!animate || reduceMotion) {
        planEl.hidden = !showPlan;
        webEl.hidden = showPlan;
        return;
      }
      priceBox.classList.add('is-fading');
      window.setTimeout(function(){
        planEl.hidden = !showPlan;
        webEl.hidden = showPlan;
        priceBox.classList.remove('is-fading');
      }, 200);
    });
  }

  function buildMessage(key){
    var data = PRICES[key];
    if (!data) return '';
    var desdePrefix = data.desde ? 'desde ' : '';
    var installmentWord = data.desde ? 'desde' : 'de';
    if (currentMode === 'plan') {
      return 'Hola, me interesa la web ' + data.label + ' con Mateo junto a un plan ClinIAssist (' +
        desdePrefix + clp(data.plan) + ' o 6 cuotas ' + installmentWord + ' ' + clp(data.installment) + '/mes).';
    }
    return 'Hola, me interesa solo la web ' + data.label + ' con Mateo (' + desdePrefix + clp(data.web) + ' pago único).';
  }

  function updateButton(){
    if (!btn || !currentTier) return;
    var msg = buildMessage(currentTier);
    btn.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg);
    btn.removeAttribute('aria-disabled');
    if (hint) hint.hidden = true;
  }

  function selectTier(tier, focus){
    tiers.forEach(function(t){
      var on = t === tier;
      t.setAttribute('aria-checked', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
    });
    if (focus) tier.focus();
    currentTier = tier.getAttribute('data-tier');
    updateButton();
  }

  tiers.forEach(function(tier, i){
    tier.addEventListener('click', function(){ selectTier(tier, false); });
    tier.addEventListener('keydown', function(e){
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); selectTier(tiers[(i + 1) % tiers.length], true); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); selectTier(tiers[(i - 1 + tiers.length) % tiers.length], true); }
    });
  });

  function selectMode(mode, focus){
    modes.forEach(function(m){
      var on = m === mode;
      m.setAttribute('aria-checked', on ? 'true' : 'false');
      m.tabIndex = on ? 0 : -1;
    });
    if (focus) mode.focus();
    currentMode = mode.getAttribute('data-mode');
    applyModeDisplay(true);
    updateButton();
  }

  modes.forEach(function(mode, i){
    mode.addEventListener('click', function(){ selectMode(mode, false); });
    mode.addEventListener('keydown', function(e){
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); selectMode(modes[(i + 1) % modes.length], true); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); selectMode(modes[(i - 1 + modes.length) % modes.length], true); }
    });
  });

  applyModeDisplay(false);

  if (btn) {
    btn.addEventListener('click', function(e){
      if (btn.getAttribute('aria-disabled') === 'true') e.preventDefault();
    });
  }
})();

/* Volteo 3D de las tarjetas de plan: el botón "X tareas automatizadas"
   (y el "Volver" del dorso) giran TODA la tarjeta, mostrando el equipo
   completo. El alto lo resuelve el CSS solo (grid-area:1/1 en ambas caras
   + align-items:stretch en .ca-grid — ver asistentes.css), así que acá
   solo queda manejar el abrir/cerrar: un clic afuera de la tarjeta
   abierta, o Escape, la vuelve a su posición normal; y abrir otra cierra
   la anterior, para que nunca haya más de una volteada a la vez. */
(function(){
  var cards = Array.prototype.slice.call(document.querySelectorAll('.ca-card'));
  if (!cards.length) return;

  function getTrigger(card){
    return card.querySelector('.ca-counter[data-plan-flip]');
  }

  function closeCard(card){
    card.classList.remove('is-flipped');
    var trigger = getTrigger(card);
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  }

  function openCard(card){
    cards.forEach(function(c){
      if (c !== card && c.classList.contains('is-flipped')) closeCard(c);
    });
    card.classList.add('is-flipped');
    var trigger = getTrigger(card);
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
  }

  function toggleCard(card){
    if (card.classList.contains('is-flipped')) closeCard(card);
    else openCard(card);
  }

  cards.forEach(function(card){
    var trigger = getTrigger(card);
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    card.querySelectorAll('[data-plan-flip]').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        toggleCard(card);
      });
    });
  });

  document.addEventListener('pointerdown', function(e){
    var openCardEl = document.querySelector('.ca-card.is-flipped');
    if (!openCardEl) return;
    if (e.target.closest('.ca-card') === openCardEl) return;
    closeCard(openCardEl);
  });

  document.addEventListener('keydown', function(e){
    if (e.key !== 'Escape') return;
    var openCardEl = document.querySelector('.ca-card.is-flipped');
    if (!openCardEl) return;
    closeCard(openCardEl);
    var trigger = getTrigger(openCardEl);
    if (trigger) trigger.focus();
  });
})();
