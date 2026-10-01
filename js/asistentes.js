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

/* ClinIAssist — opciones de la web de Mateo (Base/Pro/Premium).
   No usa .js-whatsapp: script.js arma esos enlaces una sola vez al cargar
   la página, con un solo texto fijo por botón. Acá el mensaje depende de
   la opción elegida, así que el enlace se arma a mano en cada selección,
   con el mismo número de WhatsApp que usa script.js. */
(function(){
  var WHATSAPP_NUMBER = '56979247572';
  var group = document.querySelector('.ca-tiers');
  if (!group) return;
  var tiers = Array.prototype.slice.call(group.querySelectorAll('.ca-tier'));
  if (!tiers.length) return;
  var btn = document.getElementById('caAddonBtn');
  var hint = document.getElementById('caAddonHint');

  function selectTier(tier, focus){
    tiers.forEach(function(t){
      var on = t === tier;
      t.setAttribute('aria-checked', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
    });
    if (focus) tier.focus();
    if (btn) {
      var msg = tier.getAttribute('data-msg') || '';
      btn.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg);
      btn.removeAttribute('aria-disabled');
    }
    if (hint) hint.hidden = true;
  }

  tiers.forEach(function(tier, i){
    tier.addEventListener('click', function(){ selectTier(tier, false); });
    tier.addEventListener('keydown', function(e){
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); selectTier(tiers[(i + 1) % tiers.length], true); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); selectTier(tiers[(i - 1 + tiers.length) % tiers.length], true); }
    });
  });

  if (btn) {
    btn.addEventListener('click', function(e){
      if (btn.getAttribute('aria-disabled') === 'true') e.preventDefault();
    });
  }
})();

/* Volteo 3D de las tarjetas de plan: el botón "X tareas automatizadas"
   (y el "Volver" del dorso) giran TODA la tarjeta, mostrando el equipo
   completo. El alto de las 3 tarjetas se fija según el FRENTE más alto
   únicamente (no el dorso) — si el dorso de un plan es más largo que ese
   alto (ej. Empresa con 3 equipos completos), hace scroll interno en vez
   de agrandar la tarjeta, tal como se pidió. Mismo truco de medición que
   el resto del sitio: sacar la cara de position:absolute brevemente para
   leer su alto real, y restaurarla después. */
(function(){
  var cards = Array.prototype.slice.call(document.querySelectorAll('.ca-card'));
  if (!cards.length) return;

  function measureFront(front){
    var prevPosition = front.style.position;
    var prevHeight = front.style.height;
    front.style.position = 'static';
    front.style.height = 'auto';
    var h = front.scrollHeight;
    front.style.position = prevPosition;
    front.style.height = prevHeight;
    return h;
  }

  function syncHeights(){
    var heights = cards.map(function(card){
      var front = card.querySelector('.ca-card-front');
      return front ? measureFront(front) : 0;
    });
    var tallest = Math.max.apply(null, heights);
    if (!tallest) return;
    cards.forEach(function(card){ card.style.height = tallest + 'px'; });
  }

  syncHeights();
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(syncHeights); }
  window.addEventListener('resize', syncHeights);

  cards.forEach(function(card){
    card.querySelectorAll('[data-plan-flip]').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        card.classList.toggle('is-flipped');
      });
    });
  });
})();
