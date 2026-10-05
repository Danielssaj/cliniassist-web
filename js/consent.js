/* ClinIAssist — aviso de cookies + medición (Google Analytics 4 y Pixel de Meta).
 * Nada se carga hasta que el visitante presiona "Aceptar".
 * Para activar el Pixel de Meta, pega su ID (solo números) en PIXEL_ID. */
(function () {
  'use strict';

  var GA_ID = 'G-2FBNMFZW8W';
  var PIXEL_ID = ''; // ej: '123456789012345'
  var KEY = 'ca_cookie_consent'; // 'granted' | 'denied'

  function readChoice() {
    try { return window.localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function saveChoice(value) {
    try { window.localStorage.setItem(KEY, value); } catch (e) { /* modo privado: se pregunta de nuevo */ }
  }

  var loaded = false;
  function loadTrackers() {
    if (loaded) return;
    loaded = true;

    if (GA_ID) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', GA_ID);
      var ga = document.createElement('script');
      ga.async = true;
      ga.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
      document.head.appendChild(ga);
    }

    if (PIXEL_ID) {
      var n = window.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!window._fbq) window._fbq = n;
      n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
      var fb = document.createElement('script');
      fb.async = true;
      fb.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.appendChild(fb);
      window.fbq('init', PIXEL_ID);
      window.fbq('track', 'PageView');
    }
  }

  // ---- Eventos de negocio (solo se envían si hubo consentimiento) ----
  function track(gaEvent, gaParams, fbEvent) {
    if (!loaded) return;
    if (window.gtag) window.gtag('event', gaEvent, gaParams || {});
    if (window.fbq && fbEvent) window.fbq('track', fbEvent);
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest ? e.target.closest('a') : null;
    if (!link || !link.href) return;
    var label = (link.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60);
    if (link.href.indexOf('wa.me/') !== -1) {
      track('generate_lead', { method: 'whatsapp', link_text: label }, 'Contact');
    } else if (link.href.indexOf('mailto:') === 0) {
      track('generate_lead', { method: 'email', link_text: label }, 'Contact');
    } else if (link.href.indexOf('/simulador') !== -1) {
      track('ver_demo', { link_text: label });
    }
  }, true);

  document.addEventListener('submit', function (e) {
    if (e.target && e.target.id === 'contactForm' && e.target.checkValidity()) {
      track('generate_lead', { method: 'formulario' }, 'Lead');
    }
  }, true);

  // ---- Aviso de cookies ----
  var CSS =
    '.ca-cookie{position:fixed;left:16px;right:16px;bottom:16px;z-index:10000;max-width:560px;margin-inline:auto;' +
    'background:#0f1b33;color:#e2e8f0;border:1px solid rgba(96,165,250,.35);border-radius:16px;padding:18px 20px;' +
    'box-shadow:0 18px 50px rgba(0,0,0,.45);font:14.5px/1.5 Manrope,"Segoe UI",system-ui,sans-serif}' +
    '.ca-cookie p{margin:0 0 14px;color:#cbd5e1}' +
    '.ca-cookie a{color:#93c5fd;text-decoration:underline}' +
    '.ca-cookie-actions{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap}' +
    '.ca-cookie button{font:600 14px/1 Manrope,"Segoe UI",system-ui,sans-serif;padding:11px 18px;border-radius:999px;cursor:pointer;border:1px solid rgba(148,163,184,.45);background:transparent;color:#e2e8f0}' +
    '.ca-cookie button.ca-accept{background:#2563eb;border-color:#2563eb;color:#fff}' +
    '.ca-cookie button:focus-visible{outline:2px solid #93c5fd;outline-offset:2px}';

  function showBanner() {
    if (document.getElementById('caCookie')) return;
    if (!document.getElementById('caCookieCss')) {
      var st = document.createElement('style');
      st.id = 'caCookieCss';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    var box = document.createElement('div');
    box.className = 'ca-cookie';
    box.id = 'caCookie';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Aviso de cookies');
    box.innerHTML =
      '<p>Usamos cookies de medición (Google Analytics y Meta) para saber cómo se usa el sitio y mejorar nuestros anuncios. ' +
      'Solo se activan si aceptas. <a href="/privacidad.html#cookies">Más información</a></p>' +
      '<div class="ca-cookie-actions">' +
      '<button type="button" class="ca-reject">Rechazar</button>' +
      '<button type="button" class="ca-accept">Aceptar</button></div>';
    box.querySelector('.ca-accept').addEventListener('click', function () {
      saveChoice('granted'); box.remove(); loadTrackers();
    });
    box.querySelector('.ca-reject').addEventListener('click', function () {
      saveChoice('denied'); box.remove();
      // Si ya estaban cargados, se recarga la página para dejar de medir.
      if (loaded) window.location.reload();
    });
    document.body.appendChild(box);
  }

  // Enlace "Preferencias de cookies" del footer
  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('[data-cookie-prefs]') : null;
    if (!btn) return;
    e.preventDefault();
    showBanner();
  });

  function init() {
    var choice = readChoice();
    if (choice === 'granted') loadTrackers();
    else if (choice !== 'denied') showBanner();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
