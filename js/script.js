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

  // Conector luminoso entre las 9 tarjetas de servicios: traza una línea por los
  // centros reales de las tarjetas (recalculada si cambia el layout) y anima una
  // partícula que viaja por ese trazado. Los tramos que quedan bajo una tarjeta
  // no se ven, porque el SVG está detrás de las tarjetas (mismo truco que el
  // conector de la sección "proceso").
  (() => {
    const grid = document.querySelector('.service-grid');
    const svg = document.getElementById('serviceConnectorSvg');
    if (!grid || !svg) return;
    const pathEl = svg.querySelector('.connector-path');
    const spark = svg.querySelector('.connector-spark');
    let points = [];
    let segLengths = [];
    let totalLength = 0;

    const measure = () => {
      const cards = Array.from(grid.querySelectorAll('.service-card'));
      if (!cards.length) return;
      const gridRect = grid.getBoundingClientRect();
      svg.setAttribute('viewBox', `0 0 ${gridRect.width} ${gridRect.height}`);
      points = cards.map(card => {
        const r = card.getBoundingClientRect();
        return { x: r.left - gridRect.left + r.width / 2, y: r.top - gridRect.top + r.height / 2 };
      });
      const d = points.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ');
      pathEl.setAttribute('d', d);
      segLengths = [];
      totalLength = 0;
      for (let i = 1; i < points.length; i++) {
        const dx = points[i].x - points[i - 1].x;
        const dy = points[i].y - points[i - 1].y;
        const len = Math.sqrt(dx * dx + dy * dy);
        segLengths.push(len);
        totalLength += len;
      }
    };

    const pointAtDistance = (dist) => {
      let d = dist;
      for (let i = 0; i < segLengths.length; i++) {
        if (d <= segLengths[i] || i === segLengths.length - 1) {
          const t = segLengths[i] ? Math.min(d / segLengths[i], 1) : 0;
          const a = points[i], b = points[i + 1];
          return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
        }
        d -= segLengths[i];
      }
      return points[0] || { x: 0, y: 0 };
    };

    let resizeTimer = null;
    const scheduleMeasure = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(measure, 200);
    };

    measure();
    setTimeout(measure, 500); // recalcula tras el ajuste de fuentes/layout
    window.addEventListener('resize', scheduleMeasure);

    if (reduceMotion) {
      spark.setAttribute('opacity', '0');
      return;
    }

    const DURATION = 7000;
    const start = performance.now();
    const tick = (now) => {
      if (totalLength > 0) {
        const elapsed = (now - start) % DURATION;
        const p = pointAtDistance((elapsed / DURATION) * totalLength);
        spark.setAttribute('cx', p.x);
        spark.setAttribute('cy', p.y);
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  })();

  // Navegación entre secciones: scroll con desaceleración progresiva, limpia y
  // sin rebote (curva cubic-bezier(0.25, 1, 0.5, 1)) + destello de "llegada".
  const cubicBezierEase = (x1, y1, x2, y2) => {
    const bez = (t, a, b) => 3 * (1 - t) * (1 - t) * t * a + 3 * (1 - t) * t * t * b + t * t * t;
    const bezDerivative = (t, a, b) => 3 * (1 - t) * (1 - t) * a + 6 * (1 - t) * t * (b - a) + 3 * t * t * (1 - b);
    return (x) => {
      let t = x;
      for (let i = 0; i < 6; i++) {
        const dx = bez(t, x1, x2) - x;
        const d = bezDerivative(t, x1, x2);
        if (Math.abs(d) < 1e-6) break;
        t -= dx / d;
        t = Math.min(1, Math.max(0, t));
      }
      return bez(t, y1, y2);
    };
  };
  const scrollEase = cubicBezierEase(0.25, 1, 0.5, 1);

  const flashSection = (el) => {
    el.classList.remove('section-focus');
    void el.offsetWidth; // reinicia la animación aunque se repita sobre la misma sección
    el.classList.add('section-focus');
    el.addEventListener('animationend', () => el.classList.remove('section-focus'), { once: true });
  };

  const scrollToTarget = (target) => {
    const header = document.getElementById('header');
    const headerHeight = header ? header.offsetHeight : 0;
    const startY = window.pageYOffset;
    const targetY = Math.max(0, target.getBoundingClientRect().top + startY - headerHeight - 14);
    const distance = targetY - startY;

    if (reduceMotion || Math.abs(distance) < 2) {
      window.scrollTo(0, targetY);
      flashSection(target);
      return;
    }

    const duration = 700;
    const startTime = performance.now();

    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      window.scrollTo(0, startY + distance * scrollEase(progress));
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        window.scrollTo(0, targetY);
        flashSection(target);
      }
    };
    requestAnimationFrame(step);
  };

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    const hash = link.getAttribute('href');
    if (!hash || hash.length < 2) return;
    let target;
    try { target = document.querySelector(hash); } catch (e) { return; }
    if (!target) return;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      scrollToTarget(target);
      // La barra de direcciones se mantiene siempre limpia (sin #hash):
      // la navegación por anclas es solo visual, no un cambio de URL real.
      if (history.pushState) history.pushState(null, '', '/');
    });
  });

  // Si se llega con un hash en la URL (enlace compartido o marcador antiguo),
  // hacemos scroll a esa sección una sola vez y luego limpiamos la URL.
  if (window.location.hash) {
    const goToInitialHash = () => {
      let initialTarget;
      try { initialTarget = document.querySelector(window.location.hash); } catch (e) { initialTarget = null; }
      if (initialTarget) scrollToTarget(initialTarget);
      if (history.replaceState) history.replaceState(null, '', '/');
    };
    if (document.readyState === 'complete') goToInitialHash();
    else window.addEventListener('load', goToInitialHash, { once: true });
  }

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

  // Tarjetas con giro 3D (servicios + comparativa de pérdidas): un clic (o
  // Enter/Espacio) revela el dorso con la métrica/desglose de esa tarjeta;
  // otro clic la devuelve.
  const makeFlippable = (card) => {
    const toggleFlip = () => {
      const flipped = card.classList.toggle('is-flipped');
      card.setAttribute('aria-pressed', String(flipped));
    };
    card.addEventListener('click', toggleFlip);
    card.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      toggleFlip();
    });
  };
  document.querySelectorAll('.service-card[role="button"], .lc-panel[role="button"]').forEach(makeFlippable);

  // Pestañas interactivas de "Una sola herramienta para toda tu clínica"
  const toolPanel = document.querySelector('.tool-panel');
  if (toolPanel) {
    const tabs = toolPanel.querySelectorAll('.tool-tab');
    const panels = toolPanel.querySelectorAll('.tool-panel-content');
    const toolBody = toolPanel.querySelector('.tool-body');

    // Cada pestaña tiene contenido de un alto muy distinto (la agenda es
    // mucho más alta que reseñas o la ficha de paciente). En vez de una
    // altura fija compartida — que siempre deja a alguna pestaña con
    // espacio vacío de sobra o con scroll de sobra — .tool-body se mide y
    // ajusta al contenido real de la pestaña activa cada vez que cambia.
    //
    // El panel es position:absolute; inset:0, así que su scrollHeight
    // normalmente solo refleja la altura que .tool-body YA tenía (varios
    // de sus hijos usan height:100% para llenar el espacio disponible,
    // así que "miden" el contenedor en vez de su propio contenido real).
    // Para leer su alto natural, se lo saca brevemente de position:absolute
    // (dejando que height:100% colapse a su contenido) y se restaura antes
    // de que el navegador vuelva a pintar — no hay parpadeo visible.
    //
    // Bajo los 720px el propio CSS ya pone .tool-panel-content en
    // position:static y dueño .tool-body en height:auto (ahí las pestañas
    // se apilan en flujo normal, sin el truco de crossfade superpuesto que
    // necesita una altura fija) — un alto en px puesto por JS pisaría ese
    // auto con un valor fijo y podría recortar contenido. Se detecta ese
    // caso leyendo el position real calculado y se limpia el alto en línea
    // para que la regla del media query vuelva a mandar.
    const syncBodyHeight = (panel) => {
      if (!toolBody || !panel) return;
      if (getComputedStyle(panel).position !== 'absolute') {
        toolBody.style.height = '';
        return;
      }
      const prevPosition = panel.style.position;
      const prevHeight = panel.style.height;
      panel.style.position = 'static';
      panel.style.height = 'auto';
      const naturalHeight = panel.scrollHeight;
      panel.style.position = prevPosition;
      panel.style.height = prevHeight;
      toolBody.style.height = `${naturalHeight}px`;
    };

    syncBodyHeight(toolPanel.querySelector('.tool-panel-content.is-active'));

    // Este script corre de forma síncrona apenas se parsea, antes de que
    // las tipografías de Google Fonts terminen de descargar — la primera
    // medición cae con la fuente de reemplazo (más angosta) y el texto de
    // la agenda/las tarjetas de beneficios envuelve menos líneas de las
    // que ocupa una vez que Manrope reemplaza esa fuente. Sin este reintento
    // esa medición corta quedaba fija para siempre, dejando `.tool-body` un
    // poco más bajo que el contenido real y apareciendo scroll en la agenda.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        syncBodyHeight(toolPanel.querySelector('.tool-panel-content.is-active'));
      });
    }

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.getAttribute('data-tab');
        if (tab.classList.contains('is-active')) return;

        tabs.forEach(t => {
          t.classList.toggle('is-active', t === tab);
          t.setAttribute('aria-selected', String(t === tab));
        });
        let targetPanel = null;
        panels.forEach(panel => {
          const isTarget = panel.getAttribute('data-panel') === targetId;
          panel.classList.toggle('is-active', isTarget);
          if (isTarget) targetPanel = panel;
        });
        syncBodyHeight(targetPanel);
      });
    });

    window.addEventListener('resize', () => {
      syncBodyHeight(toolPanel.querySelector('.tool-panel-content.is-active'));
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

  // Ficha de cita: se abre al hacer clic en cualquier bloque de la agenda,
  // con el contenido de la celda que realmente se clickeó — antes el modal
  // era estático (siempre "María González · Jueves 18 · 10:30 AM") sin
  // importar qué paciente u horario se abriera.
  const apptDetail = document.getElementById('apptDetail');
  const apptDetailClose = document.getElementById('apptDetailClose');
  if (apptDetail) {
    const nameEl = apptDetail.querySelector('h4');
    const statusEl = apptDetail.querySelector('.appt-detail-status');
    const [dateEl, , treatmentEl, originEl] = apptDetail.querySelectorAll('.appt-detail-list dd');
    const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    // No hay un procedimiento real por celda en la maqueta del calendario,
    // así que se rota una lista de ejemplos plausibles por posición — el
    // punto es que cada cita se vea distinta, no que sea el dato exacto.
    const TREATMENTS = [
      'Limpieza dental profunda',
      'Control rutinario',
      'Evaluación general',
      'Chequeo cardiológico',
      'Seguimiento post-operatorio',
      'Consulta pediátrica',
      'Revisión de resultados de laboratorio',
      'Sesión de kinesiología',
    ];

    const apptButtons = Array.from(document.querySelectorAll('.js-appt'));

    const openDetail = (btn, index) => {
      const row = btn.closest('.gcal-row');
      const cell = btn.closest('.gcal-cell');
      const time = row?.querySelector('.gcal-time')?.textContent.trim() ?? '';
      const cellsInRow = row ? Array.from(row.querySelectorAll('.gcal-cell')) : [];
      const day = DAYS[cellsInRow.indexOf(cell)] ?? '';
      const patientName = btn.textContent.replace(/[✓?]/g, '').trim();
      const isConfirmed = btn.classList.contains('is-confirmed');
      const isFromIA = btn.classList.contains('tag-blue');

      if (nameEl) nameEl.textContent = patientName;
      if (statusEl) {
        statusEl.classList.toggle('is-pending', !isConfirmed);
        statusEl.innerHTML = isConfirmed ? '<i class="gcal-check">✓</i> Confirmado' : '<i class="gcal-q">?</i> Pendiente';
      }
      if (dateEl) dateEl.textContent = `${day} · ${time} hrs`;
      if (treatmentEl) treatmentEl.textContent = TREATMENTS[index % TREATMENTS.length];
      if (originEl) originEl.textContent = isFromIA ? 'Agendado por IA (Web)' : 'Agendado por Recepción';

      apptDetail.classList.add('is-open');
    };
    const closeDetail = () => apptDetail.classList.remove('is-open');

    apptButtons.forEach((btn, index) => {
      btn.addEventListener('click', () => openDetail(btn, index));
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

  // Selector rápido de especialidad: un solo chip activo a la vez, cuyo
  // valor se refleja en el input oculto que viaja con el resto del formulario.
  const specialtyPicker = document.getElementById('specialtyPicker');
  const specialtyInput = document.getElementById('fEspecialidad');
  const specialtyChips = specialtyPicker ? Array.from(specialtyPicker.querySelectorAll('.specialty-chip')) : [];
  const resetSpecialtyPicker = () => {
    specialtyChips.forEach(chip => chip.classList.remove('is-active'));
    if (specialtyInput) specialtyInput.value = '';
  };
  specialtyChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const alreadyActive = chip.classList.contains('is-active');
      resetSpecialtyPicker();
      if (!alreadyActive) {
        chip.classList.add('is-active');
        if (specialtyInput) specialtyInput.value = chip.dataset.specialty;
        specialtyPicker.classList.remove('has-error');
        const specialtyErrorEl = document.getElementById('specialtyError');
        if (specialtyErrorEl) specialtyErrorEl.hidden = true;
      }
    });
  });

  // El formulario no tiene backend propio: en vez de solo mostrar un
  // "gracias" y no ir a ningún lado, arma el mensaje con los datos
  // ingresados y abre WhatsApp con todo ya redactado, igual que los demás
  // botones de WhatsApp del sitio.
  const form = document.getElementById('contactForm');
  const formNote = document.getElementById('formNote');
  const specialtyError = document.getElementById('specialtyError');
  if (form && formNote) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Nombre/Clínica/WhatsApp ya son required en el HTML — reportValidity()
      // dispara los avisos nativos del navegador sobre el campo que falte.
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const especialidad = specialtyInput ? specialtyInput.value : '';
      // La especialidad es un input oculto alimentado por los chips, así que
      // "required" nativo no la cubre (un campo oculto nunca puede recibir foco
      // para mostrar el aviso) — el error visual se arma a mano acá.
      if (!especialidad) {
        if (specialtyPicker) specialtyPicker.classList.add('has-error');
        if (specialtyError) specialtyError.hidden = false;
        specialtyPicker?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (specialtyPicker) specialtyPicker.classList.remove('has-error');
      if (specialtyError) specialtyError.hidden = true;

      const nombre = form.nombre.value.trim();
      const clinica = form.clinica.value.trim();
      const contacto = form.contacto.value.trim();
      const mensaje =
        `Hola ClinIAssist, me gustaría agendar una demostración:\n` +
        `- Nombre: ${nombre}\n` +
        `- Clínica: ${clinica}\n` +
        `- WhatsApp: ${contacto}\n` +
        `- Especialidad: ${especialidad}`;
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`, '_blank', 'noopener');

      formNote.hidden = false;
      form.reset();
      resetSpecialtyPicker();
    });
  }
})();
