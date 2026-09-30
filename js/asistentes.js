/* Cliniassist — pestañas de la sección #asistentes */
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
