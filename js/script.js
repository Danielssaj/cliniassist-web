(() => {
  'use strict';

  // Edita SOLO este número (con código de país, sin espacios ni signos) cuando lo tengas.
  const WHATSAPP_NUMBER = '56979247572';

  document.querySelectorAll('.js-whatsapp').forEach(link => {
    const text = link.getAttribute('data-wa-text') || 'Hola, necesito el servicio de ClinIAssist.';
    link.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  });

  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Conversación de WhatsApp: mensajes + indicadores de "escribiendo..." + tarjeta de confirmación final.
  const chatBody = document.querySelector('.hero-visual .chat-mock-body');
  const confirmCard = document.getElementById('confirmCard');

  // Scroll propio con velocidad fija (más legible que el "smooth" nativo del navegador).
  const smoothScrollTo = (el, target, duration) => {
    const start = el.scrollTop;
    const change = target - start;
    if (Math.abs(change) < 1) return;
    const startTime = performance.now();
    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.scrollTop = start + change * eased;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if (chatBody && !reduceMotion) {
    const allItems = Array.from(chatBody.children).filter(
      el => el.classList.contains('bubble') || el.classList.contains('typing-indicator')
    );
    // El primer mensaje (el del paciente) ya está ahí desde que se abre la página,
    // como si entraras a ver una conversación que ya empezó — no un panel que se resetea.
    const firstItem = allItems[0];
    const items = allItems.slice(1);
    if (firstItem) firstItem.classList.add('bubble-visible');

    const TYPING_TIME = 850;     // cuánto se ve el indicador de "escribiendo..."
    const THINK_PAUSE = 300;     // pequeña pausa antes de que empiece a "pensar" (aparezca el indicador)
    const READ_TIME = 1500;      // tiempo para leer cada mensaje antes de continuar
    const SCROLL_DURATION = 750; // velocidad del desplazamiento al llegar un mensaje nuevo
    const CONFIRM_DELAY = 400;   // pausa tras el último mensaje antes de mostrar la tarjeta
    const CONFIRM_HOLD = 2000;   // cuánto se queda visible la tarjeta
    const HOLD_AFTER = 1000;     // pausa final antes de reiniciar el ciclo

    const FADE_OUT = 350; // duración del desvanecido individual de cada burbuja al reiniciar (debe igualar la transición CSS de .bubble)

    // El primer mensaje NUNCA se toca: se queda fijo abajo y el resto de la
    // conversación entra por debajo, empujándolo hacia arriba (como un chat real).
    const showBubble = (el) => {
      el.hidden = false;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => el.classList.add('bubble-visible'));
      });
      smoothScrollTo(chatBody, chatBody.scrollHeight, SCROLL_DURATION);
    };

    const loopChat = () => {
      items.forEach(el => el.classList.remove('bubble-visible'));
      setTimeout(() => {
        items.forEach(el => { el.hidden = true; });
        chatBody.scrollTop = 0;
        if (confirmCard) confirmCard.classList.remove('is-visible');
        setTimeout(playSequence, 200);
      }, FADE_OUT);
    };

    const playSequence = () => {
      let t = 500;
      items.forEach((el) => {
        if (el.classList.contains('typing-indicator')) {
          const showAt = t + THINK_PAUSE;
          const hideAt = showAt + TYPING_TIME;
          setTimeout(() => {
            el.hidden = false;
            smoothScrollTo(chatBody, chatBody.scrollHeight, SCROLL_DURATION);
          }, showAt);
          setTimeout(() => { el.hidden = true; }, hideAt);
          t = hideAt;
        } else {
          t += 300;
          setTimeout(() => showBubble(el), t);
          t += READ_TIME;
        }
      });

      // Sincronización visual final: al terminar el último mensaje, aparece "Cita confirmada".
      if (confirmCard) {
        setTimeout(() => confirmCard.classList.add('is-visible'), t + CONFIRM_DELAY);
        setTimeout(() => confirmCard.classList.remove('is-visible'), t + CONFIRM_DELAY + CONFIRM_HOLD);
      }

      const cycleLength = t + CONFIRM_DELAY + CONFIRM_HOLD + HOLD_AFTER;
      setTimeout(loopChat, cycleLength);
    };

    playSequence();
  } else if (chatBody) {
    chatBody.querySelectorAll('.bubble').forEach(b => { b.hidden = false; b.classList.add('bubble-visible'); });
    chatBody.querySelectorAll('.typing-indicator').forEach(t => t.remove());
    if (confirmCard) confirmCard.classList.add('is-visible');
  }

  // Agenda semanal: se llena sola, más rápido que la conversación de ejemplo.
  const heroSlots = document.querySelectorAll('.cal-widget .cal-slot.fillable');
  const calCount = document.getElementById('calCount');
  if (heroSlots.length) {
    if (reduceMotion) {
      heroSlots.forEach(s => s.classList.add('is-filled'));
      if (calCount) calCount.textContent = String(heroSlots.length);
    } else {
      let filled = 0;
      const fillNext = () => {
        if (filled >= heroSlots.length) {
          heroSlots.forEach(s => s.classList.remove('is-filled'));
          filled = 0;
        }
        const slot = heroSlots[filled];
        slot.classList.add('is-filled', 'pop');
        setTimeout(() => slot.classList.remove('pop'), 550);
        filled++;
        if (calCount) calCount.textContent = String(filled);
      };
      fillNext();
      setInterval(fillNext, 550);
    }
  }

  // Pestañas interactivas de "Una sola herramienta para toda tu clínica"
  const toolPanel = document.querySelector('.tool-panel');
  if (toolPanel) {
    const tabs = toolPanel.querySelectorAll('.tool-tab');
    const panels = toolPanel.querySelectorAll('.tool-panel-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.getAttribute('data-tab');
        if (tab.classList.contains('is-active')) return;

        tabs.forEach(t => {
          t.classList.toggle('is-active', t === tab);
          t.setAttribute('aria-selected', String(t === tab));
        });
        panels.forEach(panel => {
          panel.classList.toggle('is-active', panel.getAttribute('data-panel') === targetId);
        });
      });
    });
  }

  // Botón "Enviar recordatorio automático" en la ficha de paciente (simulación visual, sin envío real)
  const patientCta = document.getElementById('patientCta');
  if (patientCta) {
    const label = patientCta.querySelector('.patient-cta-label');
    const icon = patientCta.querySelector('.patient-cta-icon');
    const originalText = label ? label.textContent : '';
    const originalIcon = icon ? icon.textContent : '';
    patientCta.addEventListener('click', () => {
      if (patientCta.classList.contains('is-sent')) return;
      patientCta.classList.add('is-sent');
      if (label) label.textContent = 'Recordatorio enviado';
      if (icon) icon.textContent = '✅';
      setTimeout(() => {
        patientCta.classList.remove('is-sent');
        if (label) label.textContent = originalText;
        if (icon) icon.textContent = originalIcon;
      }, 2500);
    });
  }

  // Ficha de cita: se abre al hacer clic en cualquier bloque de la agenda
  const apptDetail = document.getElementById('apptDetail');
  const apptDetailClose = document.getElementById('apptDetailClose');
  if (apptDetail) {
    const openDetail = () => apptDetail.classList.add('is-open');
    const closeDetail = () => apptDetail.classList.remove('is-open');

    document.querySelectorAll('.js-appt').forEach(btn => {
      btn.addEventListener('click', openDetail);
    });
    if (apptDetailClose) apptDetailClose.addEventListener('click', closeDetail);
    apptDetail.addEventListener('click', (e) => {
      if (e.target === apptDetail) closeDetail();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeDetail();
    });
  }

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    mainNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const header = document.getElementById('header');
  if (header) {
    const onScroll = () => {
      header.style.boxShadow = window.scrollY > 8 ? '0 1px 0 rgba(0,0,0,0.04)' : 'none';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  const form = document.getElementById('contactForm');
  const formNote = document.getElementById('formNote');
  if (form && formNote) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      formNote.hidden = false;
      form.reset();
    });
  }
})();
