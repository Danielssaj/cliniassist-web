/* ClinIAssist · Agenda en vivo
   Se reproduce una sola vez cuando la sección entra en pantalla y queda fija. */
(function () {
  var sec = document.getElementById('cia-agenda');
  if (!sec) return;

  var nombres = ['M. González','C. Díaz','J. Ramírez','D. Peña','A. Fuentes','R. Soto','P. Herrera','M. Lagos','T. Silva','L. Vidal','F. Contreras','N. Rojas','S. Muñoz','E. Castro','O. Vega','I. Bravo','K. Espinoza','B. Pérez','C. Toro','V. Reyes','G. Pino','H. Lara'];
  var dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
  // V Valentina · D Diego · E Emilia · R recepción · X disponible · N cita del chat (Valentina)
  var patron = [['09:00','VERVD'],['10:00','VDVEV'],['11:00','DVXVE'],['12:00','EVDVR'],['14:00','VDEVD'],['15:00','VEVDE'],['16:00','DVEND'],['17:00','VXDVE'],['18:00','DVEDV']];
  var colores = { V: '#1d4ed8', D: '#f59e0b', E: '#e11d48' };

  var grid = sec.querySelector('[data-grid]');
  var celdas = [], n = 0;
  patron.forEach(function (fila) {
    var row = document.createElement('div');
    row.className = 'cia-cal__fila';
    var h = document.createElement('span');
    h.className = 'cia-cal__hora';
    h.textContent = fila[0];
    row.appendChild(h);
    fila[1].split('').forEach(function (ch, col) {
      var el = document.createElement('div');
      var quien = ch === 'N' ? 'V' : ch;
      var c = { el: el, ch: ch, quien: quien, hora: fila[0], dia: dias[col],
        nombre: ch === 'N' ? 'F. Morales' : (ch === 'X' ? '' : nombres[n++ % nombres.length]) };
      if (ch === 'R') { el.className = 'cia-slot is-recepcion'; el.textContent = c.nombre + ' ✓'; }
      else if (ch === 'X') { el.className = 'cia-slot is-libre'; el.textContent = 'Disponible'; }
      else { el.className = 'cia-slot is-pendiente'; celdas.push(c); }
      row.appendChild(el);
    });
    grid.appendChild(row);
  });

  // Orden "aleatorio" fijo para que siempre se vea igual
  var otras = celdas.filter(function (c) { return c.ch !== 'N'; });
  var seed = 11;
  function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
  for (var i = otras.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = otras[i]; otras[i] = otras[j]; otras[j] = t; }
  otras.forEach(function (c, k) { c.t = 300 + Math.round(k * 3700 / (otras.length - 1)); });
  celdas.forEach(function (c) { if (c.ch === 'N') c.t = 6000; });

  var cuenta = { V: 0, D: 0, E: 0 };
  function textoUlt(c) {
    if (c.quien === 'V') return 'Valentina agendó desde WhatsApp a ' + c.nombre;
    if (c.quien === 'D') return 'Diego recuperó a ' + c.nombre + ', que no venía hace 7 meses';
    return 'Emilia agendó por llamada a ' + c.nombre;
  }
  function llenar(c, animar) {
    c.el.className = 'cia-slot is-ia';
    c.el.style.setProperty('--c', colores[c.quien]);
    c.el.textContent = c.nombre + ' ✓';
    cuenta[c.quien]++;
    sec.querySelector('[data-num="' + c.quien + '"]').textContent = cuenta[c.quien];
    sec.querySelector('[data-ult="' + c.quien + '"]').textContent = textoUlt(c);
    if (c.ch === 'N') {
      c.el.classList.add('is-nuevo');
      setTimeout(function () {
        c.el.classList.add('is-apagando');
        setTimeout(function () { c.el.classList.remove('is-nuevo', 'is-apagando'); }, 650);
      }, 2000);
    }
    else if (animar) { c.el.classList.add('is-fresco'); setTimeout(function () { c.el.classList.remove('is-fresco'); }, 450); }
  }

  var msgs = Array.prototype.slice.call(sec.querySelectorAll('[data-t]'));
  var escribiendo = sec.querySelector('[data-escribiendo]');
  var estado = sec.querySelector('[data-estado]');
  var ventanas = [[500, 1100], [2300, 2900], [4100, 5500]];

  function terminarTodo() {
    celdas.forEach(function (c) { llenar(c, false); });
    msgs.forEach(function (m) { m.classList.add('is-visible'); });
  }

  function reproducir() {
    var pendientes = celdas.slice().sort(function (a, b) { return a.t - b.t; });
    var inicio = null;
    function paso(ahora) {
      if (inicio === null) inicio = ahora;
      var t = ahora - inicio;
      while (pendientes.length && pendientes[0].t <= t) llenar(pendientes.shift(), true);
      msgs.forEach(function (m) { if (+m.dataset.t <= t) m.classList.add('is-visible'); });
      var tipeando = ventanas.some(function (w) { return t >= w[0] && t < w[1]; });
      escribiendo.classList.toggle('is-visible', tipeando);
      estado.textContent = tipeando ? 'escribiendo…' : 'en línea';
      if (t < 6400) requestAnimationFrame(paso);
      else { escribiendo.classList.remove('is-visible'); estado.textContent = 'en línea'; }
    }
    requestAnimationFrame(paso);
  }

  var sinMovimiento = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (sinMovimiento || !('IntersectionObserver' in window)) { terminarTodo(); return; }
  // 0.6 asegura que en desktop (seccion ~= 1 pantalla) la animacion arranque
  // casi con toda la seccion a la vista. En movil, con el telefono y el
  // panel apilados, la seccion suele medir mas que el alto de pantalla, así
  // que pedir 60% nunca se cumpliría: se limita al maximo realmente
  // alcanzable (90% del alto de ventana sobre el alto de la seccion).
  var alcanzable = (window.innerHeight * .9) / sec.getBoundingClientRect().height;
  var umbral = Math.min(0.6, alcanzable);
  var io = new IntersectionObserver(function (entries) {
    if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); reproducir(); }
  }, { threshold: umbral });
  io.observe(sec);
})();
