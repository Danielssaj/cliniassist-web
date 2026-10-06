// Calculadora "Calcula cuánto recuperas": abre una ventana con controles de
// citas, inasistencia, valor de consulta y tiempo en canales. Supone que
// ClinIAssist reduce las inasistencias en dos tercios y resuelve el 80% de
// las conversaciones, así lo recuperado nunca queda en $0.
(function () {
  var ov = document.getElementById('cnCalc');
  var openBtn = document.getElementById('cnOpenCalc');
  var closeBtn = document.getElementById('cnCloseCalc');
  if (!ov || !openBtn || !closeBtn) return;

  var $ = function (id) { return document.getElementById(id); };
  var inputs = ['cnCitas', 'cnIna', 'cnVal', 'cnMsg', 'cnMin'].map($);
  var clp = function (n) { return '$' + Math.round(n).toLocaleString('es-CL'); };
  var DIAS_HABILES = 22, HORAS_JORNADA = 8;

  function calc() {
    var citas = +$('cnCitas').value, ina = +$('cnIna').value / 100, val = +$('cnVal').value;
    var msg = +$('cnMsg').value, min = +$('cnMin').value;
    var pierde = citas * ina * val, recupera = pierde * 2 / 3;
    var horas = msg * min * DIAS_HABILES / 60, gana = horas * 0.8;
    var jornadas = Math.round(horas / HORAS_JORNADA);

    $('cnOCitas').textContent = citas;
    $('cnOIna').textContent = $('cnIna').value + '%';
    $('cnOVal').textContent = clp(val);
    $('cnOMsg').textContent = msg;
    $('cnOMin').textContent = min + ' min';
    $('cnRLose').textContent = clp(pierde);
    $('cnRWin').textContent = clp(recupera);
    $('cnRYear').textContent = clp(recupera * 12);
    $('cnRHrs').textContent = Math.round(horas) + ' h';
    $('cnRDays').textContent = jornadas + (jornadas === 1 ? ' jornada' : ' jornadas');
    $('cnRGain').textContent = Math.round(gana) + ' h';
  }

  function abrir() { ov.hidden = false; document.body.classList.add('cn-lock'); inputs[0].focus(); }
  function cerrar() { ov.hidden = true; document.body.classList.remove('cn-lock'); openBtn.focus(); }

  inputs.forEach(function (el) { el.addEventListener('input', calc); });
  calc();
  openBtn.addEventListener('click', abrir);
  closeBtn.addEventListener('click', cerrar);
  ov.addEventListener('click', function (e) { if (e.target === ov) cerrar(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !ov.hidden) cerrar(); });
})();
