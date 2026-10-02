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

/* Volteo 3D de las tarjetas de plan: cada tarjeta gira de forma
   independiente (se pueden tener las 3 volteadas a la vez para comparar).
   El alto lo resuelve el CSS solo (grid-area:1/1 en ambas caras +
   align-items:stretch en .ca-grid — ver asistentes.css). Tocar o hacer
   clic en cualquier parte del frente o del reverso gira esa tarjeta,
   excepto los botones "Contratar…" y el link de complementos, que
   conservan su propia acción (WhatsApp / scroll a #packs) sin voltear. */
(function(){
  var cards = Array.prototype.slice.call(document.querySelectorAll('.ca-card'));
  if (!cards.length) return;

  function isExcluded(target){
    return !!target.closest('.ca-btn, .ca-capacity-more a');
  }

  function toggleCard(card){
    var flipped = card.classList.toggle('is-flipped');
    card.setAttribute('aria-pressed', String(flipped));
  }

  cards.forEach(function(card){
    card.addEventListener('click', function(e){
      if (isExcluded(e.target)) return;
      toggleCard(card);
    });
    card.addEventListener('keydown', function(e){
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (isExcluded(e.target)) return;
      e.preventDefault();
      toggleCard(card);
    });
  });
})();

/* Vista previa en hover de la foto grande: solo en mouse/trackpad real
   (nunca táctil, donde "hover" no existe como estado persistente). El
   video no se carga hasta que el mouse entra a la foto. */
(function(){
  if (!window.matchMedia) return;
  if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var photos = Array.prototype.slice.call(document.querySelectorAll('.ca-photo[data-story-trigger]'));
  if (!photos.length) return;

  photos.forEach(function(photo){
    var video = photo.querySelector('.ca-photo-video');
    if (!video) return;
    var loaded = false;

    photo.addEventListener('mouseenter', function(){
      if (!loaded) {
        video.src = photo.getAttribute('data-video');
        video.load();
        loaded = true;
      }
      try { video.currentTime = 0; } catch (err) {}
      var p = video.play();
      if (p && p.catch) p.catch(function(){});
      video.classList.add('is-playing-preview');
    });

    photo.addEventListener('mouseleave', function(){
      video.classList.remove('is-playing-preview');
      video.pause();
    });
  });
})();

/* Reproductor tipo "historia" de Instagram para los videos de presentación.
   La lista de asistentes se arma leyendo los propios paneles (mismo
   nombre, cargo, color y video que ya están en la página), así que no hay
   datos duplicados a mano. */
(function(){
  var WHATSAPP_HEADER_CTA = document.querySelector('.header-cta .js-whatsapp');
  var modal = document.getElementById('caStory');
  var videoEl = document.getElementById('caStoryVideo');
  var progressWrap = document.getElementById('caStoryProgress');
  if (!modal || !videoEl || !progressWrap) return;

  var avatarEl = document.getElementById('caStoryAvatar');
  var nameEl = document.getElementById('caStoryName');
  var roleEl = document.getElementById('caStoryRole');
  var pausedIcon = document.getElementById('caStoryPausedIcon');
  var endCard = document.getElementById('caStoryEnd');
  var ctaLink = document.getElementById('caStoryCta');
  var nextLink = document.getElementById('caStoryNextLink');
  var zonePrev = modal.querySelector('.ca-story-zone-prev');
  var zonePause = modal.querySelector('.ca-story-zone-pause');
  var zoneNext = modal.querySelector('.ca-story-zone-next');

  var panels = Array.prototype.slice.call(document.querySelectorAll('#asistentes .ca-panel'));
  var items = panels.map(function(panel){
    var photo = panel.querySelector('.ca-photo[data-story-trigger]');
    var img = photo && photo.querySelector('img');
    var nameNode = panel.querySelector('.ca-name');
    var roleNode = panel.querySelector('.ca-role');
    if (!photo || !img || !nameNode) return null;
    return {
      panel: panel,
      photo: photo,
      triggerBtn: photo.querySelector('.ca-story-badge'),
      name: nameNode.textContent.trim(),
      role: roleNode ? roleNode.textContent.trim() : '',
      video: photo.getAttribute('data-video'),
      poster: img.getAttribute('src')
    };
  }).filter(Boolean);
  if (!items.length) return;

  // Una barra de progreso por asistente.
  var bars = items.map(function(){
    var bar = document.createElement('span');
    bar.className = 'ca-story-bar';
    var fill = document.createElement('i');
    bar.appendChild(fill);
    progressWrap.appendChild(bar);
    return fill;
  });

  var currentIndex = 0;
  var lastTriggerEl = null;
  var isOpen = false;
  var rafId = null;

  function setBar(index, value){
    bars[index].style.transform = 'scaleX(' + value + ')';
  }
  function resetBars(uptoIndex){
    items.forEach(function(_, i){ setBar(i, i < uptoIndex ? 1 : 0); });
  }

  function stopProgressLoop(){
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }
  function startProgressLoop(){
    stopProgressLoop();
    function tick(){
      if (videoEl.duration) setBar(currentIndex, Math.min(1, videoEl.currentTime / videoEl.duration));
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
  }

  function showPausedIcon(show){ pausedIcon.hidden = !show; }

  function selectAssistantTab(panel){
    var tab = document.getElementById(panel.getAttribute('aria-labelledby'));
    if (!tab) return;
    var allTabs = document.querySelectorAll('#asistentes .ca-tab');
    var allPanels = document.querySelectorAll('#asistentes .ca-panel');
    allTabs.forEach(function(t){
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
    });
    allPanels.forEach(function(p){ p.hidden = (p !== panel); });
  }

  function loadItem(index, autoplay){
    currentIndex = index;
    var item = items[index];
    endCard.hidden = true;
    showPausedIcon(false);
    avatarEl.src = item.poster;
    nameEl.textContent = item.name;
    roleEl.textContent = item.role;
    modal.setAttribute('aria-label', 'Presentación de ' + item.name);
    resetBars(index);
    videoEl.pause();
    videoEl.muted = false;
    videoEl.src = item.video;
    videoEl.load();
    if (autoplay) {
      var p = videoEl.play();
      if (p && p.catch) p.catch(function(){});
    }
  }

  function goTo(index){
    stopProgressLoop();
    var n = items.length;
    index = ((index % n) + n) % n;
    loadItem(index, true);
  }

  function togglePause(){
    if (videoEl.paused) videoEl.play(); else videoEl.pause();
  }

  function onKeydown(e){
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowRight') { goTo(currentIndex + 1); return; }
    if (e.key === 'ArrowLeft') { goTo(currentIndex - 1); return; }
    if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); togglePause(); }
  }

  function open(index, triggerEl){
    lastTriggerEl = triggerEl || null;
    isOpen = true;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    loadItem(index, true);
    modal.querySelector('.ca-story-close').focus();
    document.addEventListener('keydown', onKeydown);
  }

  function close(){
    if (!isOpen) return;
    isOpen = false;
    stopProgressLoop();
    videoEl.pause();
    videoEl.currentTime = 0;
    videoEl.removeAttribute('src');
    videoEl.load();
    modal.hidden = true;
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKeydown);
    // La sección queda mostrando al asistente del último video visto, así
    // que el foco vuelve a SU botón "Ver presentación" (no al que abrió el
    // reproductor originalmente: si se navegó a otro asistente, el botón
    // de ese primero ya quedó oculto al cambiar de panel).
    var lastItem = items[currentIndex];
    selectAssistantTab(lastItem.panel);
    var focusTarget = lastItem.triggerBtn || lastTriggerEl;
    if (focusTarget) focusTarget.focus();
  }

  videoEl.addEventListener('play', function(){ showPausedIcon(false); startProgressLoop(); });
  videoEl.addEventListener('pause', function(){
    stopProgressLoop();
    if (!videoEl.ended) showPausedIcon(true);
  });
  videoEl.addEventListener('ended', function(){
    stopProgressLoop();
    setBar(currentIndex, 1);
    showPausedIcon(false);
    var item = items[currentIndex];
    var isLast = currentIndex === items.length - 1;
    var nextItem = items[isLast ? 0 : currentIndex + 1];
    ctaLink.textContent = 'Quiero a ' + item.name + ' en mi clínica';
    nextLink.textContent = isLast ? ('Volver a ver a ' + nextItem.name) : ('Ver siguiente: ' + nextItem.name);
    endCard.hidden = false;
  });

  zonePrev.addEventListener('click', function(){ goTo(currentIndex - 1); });
  zoneNext.addEventListener('click', function(){ goTo(currentIndex + 1); });
  zonePause.addEventListener('click', function(){ togglePause(); });
  nextLink.addEventListener('click', function(){ goTo(currentIndex + 1); });

  Array.prototype.slice.call(modal.querySelectorAll('[data-story-close]')).forEach(function(el){
    el.addEventListener('click', close);
  });

  items.forEach(function(item, index){
    item.photo.addEventListener('click', function(){
      open(index, item.triggerBtn || item.photo);
    });
  });

  // Respaldo por si .js-whatsapp aún no corrió cuando se arma esta IIFE:
  // el CTA ya comparte el mismo texto/data-wa-text que el botón del header,
  // así que script.js le da el mismo href automáticamente al cargar.
  if (WHATSAPP_HEADER_CTA && ctaLink && ctaLink.getAttribute('href') === '#') {
    ctaLink.href = WHATSAPP_HEADER_CTA.href;
  }
})();
