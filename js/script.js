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

  // Carrusel de servicios: una ficha centrada a la vez, con flechas, dots y
  // autoplay (pausa de 5s por ficha). Traslada .service-track en X un
  // 100% por índice; los dots y las flechas comparten el mismo goTo().
  (() => {
    const carousel = document.getElementById('serviceCarousel');
    const track = document.getElementById('serviceTrack');
    if (!carousel || !track) return;
    const slides = Array.from(track.querySelectorAll('.service-card'));
    const dots = Array.from(document.querySelectorAll('#serviceCarouselDots .carousel-dot'));
    const prevBtn = document.getElementById('serviceCarouselPrev');
    const nextBtn = document.getElementById('serviceCarouselNext');
    if (!slides.length) return;

    let index = 0;
    let autoplayTimer = null;

    const render = () => {
      track.style.transform = `translateX(-${index * 100}%)`;
      slides.forEach((slide, i) => {
        const active = i === index;
        // Roving tabindex: solo la ficha visible es alcanzable con teclado o
        // lectores de pantalla — las otras 8 existen en el DOM (translateX
        // las saca de la vista) pero no deben quedar "enfocables a ciegas".
        slide.setAttribute('tabindex', active ? '0' : '-1');
        slide.setAttribute('aria-hidden', active ? 'false' : 'true');
      });
      dots.forEach((dot, i) => {
        const active = i === index;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    };

    const goTo = (i) => {
      index = (i + slides.length) % slides.length;
      render();
    };
    const next = () => goTo(index + 1);
    const prev = () => goTo(index - 1);

    const AUTOPLAY_MS = 5000;
    const stopAutoplay = () => { clearInterval(autoplayTimer); autoplayTimer = null; };
    const startAutoplay = () => {
      if (reduceMotion) return; // no autoplay para quien pide menos movimiento
      stopAutoplay();
      autoplayTimer = setInterval(next, AUTOPLAY_MS);
    };

    prevBtn?.addEventListener('click', () => { prev(); startAutoplay(); });
    nextBtn?.addEventListener('click', () => { next(); startAutoplay(); });
    dots.forEach((dot, i) => dot.addEventListener('click', () => { goTo(i); startAutoplay(); }));

    // Pausa mientras el usuario interactúa (hover o foco por teclado) para no
    // pelear con alguien que está leyendo o recién dio vuelta una tarjeta.
    carousel.addEventListener('mouseenter', stopAutoplay);
    carousel.addEventListener('mouseleave', startAutoplay);
    carousel.addEventListener('focusin', stopAutoplay);
    carousel.addEventListener('focusout', startAutoplay);

    // Swipe táctil: un umbral de 40px distingue un deslizar (cambia de
    // ficha) de un tap (que gira la ficha activa vía makeFlippable más
    // abajo) — si hubo swipe, se bloquea en captura el click sintético
    // que el navegador dispara al soltar, para que no gire la tarjeta.
    const SWIPE_THRESHOLD = 40;
    let touchStartX = 0;
    let touchStartY = 0;
    let touching = false;
    let justSwiped = false;

    track.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
      touching = true;
    }, { passive: true });

    track.addEventListener('touchend', (e) => {
      if (!touching) return;
      touching = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      if (Math.abs(dx) >= SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
        justSwiped = true;
        if (dx < 0) next(); else prev();
        startAutoplay();
        setTimeout(() => { justSwiped = false; }, 300);
      }
    }, { passive: true });

    track.addEventListener('click', (e) => {
      if (justSwiped) { e.stopPropagation(); e.preventDefault(); }
    }, true);

    render();
    startAutoplay();
  })();

  // "Paso a paso": ciclo de iluminación secuencial solo sobre los números
  // (sin línea conectora ni luz viajera) — cada uno queda encendido 3s y
  // se apaga con fade mientras el siguiente se enciende, en bucle.
  (() => {
    const steps = Array.from(document.querySelectorAll('.process-step .step-num'));
    if (steps.length !== 4) return;

    const STEP_MS = 3000;
    let index = 0;

    const setGlow = (i) => steps.forEach((el, n) => el.classList.toggle('is-glow', n === i));

    setGlow(0);
    if (reduceMotion) return; // queda el paso 01 iluminado, sin loop

    setInterval(() => {
      index = (index + 1) % steps.length;
      setGlow(index);
    }, STEP_MS);
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

  // Flip cards de los planes de precios: ahora giran con un clic en
  // cualquier parte de la tarjeta, salvo sobre el CTA "Contratar [Plan]"
  // (ese link para la propagación con stopPropagation y sigue su propio
  // destino de WhatsApp sin girar la tarjeta). El botón "Volver" del dorso
  // también para la propagación para no girar dos veces (una por su propio
  // click y otra por el listener de la tarjeta).
  //
  // Cada cara (y cada plan) tiene una altura natural distinta — el checklist
  // completo del dorso es más largo en algunos planes que en otros, y el
  // "Ideal para" también varía. Usar la altura natural de CADA tarjeta por
  // separado las dejaría de alturas distintas entre sí (se ve desprolijo en
  // una fila de precios), así que se mide TODO (las 6 caras, 3 tarjetas) y
  // se aplica la más alta de todas a las 3 por igual — mismo truco que
  // syncBodyHeight para leer el alto real de contenido position:absolute:
  // sacarlo brevemente de ese modo para que su scrollHeight no quede
  // "midiendo" el contenedor en vez de su propio contenido.
  const planCards = Array.from(document.querySelectorAll('.plan-card'));
  if (planCards.length) {
    const measureFace = (face) => {
      const prevPosition = face.style.position;
      const prevHeight = face.style.height;
      face.style.position = 'static';
      face.style.height = 'auto';
      const h = face.scrollHeight;
      face.style.position = prevPosition;
      face.style.height = prevHeight;
      return h;
    };
    const syncPlanCardHeights = () => {
      const heights = planCards.flatMap(card => {
        const front = card.querySelector('.plan-card-front');
        const back = card.querySelector('.plan-card-back');
        return front && back ? [measureFace(front), measureFace(back)] : [];
      });
      if (!heights.length) return;
      const tallest = Math.max(...heights);
      planCards.forEach(card => { card.style.height = `${tallest}px`; });
    };

    syncPlanCardHeights();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(syncPlanCardHeights);
    }
    window.addEventListener('resize', syncPlanCardHeights);

    planCards.forEach(card => {
      card.querySelectorAll('[data-plan-flip]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          card.classList.toggle('is-flipped');
        });
      });
      card.addEventListener('click', (e) => {
        if (e.target.closest('.js-whatsapp')) return;
        card.classList.toggle('is-flipped');
      });
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

  // El formulario NO envía datos a ningún servidor: solo abre WhatsApp con
  // la solicitud ya redactada hacia el número de ClinIAssist, igual que los
  // demás botones del sitio. Toda contratación pasa por WhatsApp directo.
  const form = document.getElementById('contactForm');
  const formNote = document.getElementById('formNote');
  const formErrorNote = document.getElementById('formErrorNote');
  const specialtyError = document.getElementById('specialtyError');
  const submitBtn = form ? form.querySelector('.cta-submit') : null;
  const submitLabel = submitBtn ? submitBtn.querySelector('.cta-submit-label') : null;
  const submitLabelDefault = submitLabel ? submitLabel.textContent : '';

  const setSubmitLoading = (isLoading) => {
    if (!submitBtn) return;
    submitBtn.disabled = isLoading;
    submitBtn.classList.toggle('is-loading', isLoading);
    if (submitLabel) submitLabel.textContent = isLoading ? 'Enviando…' : submitLabelDefault;
  };

  if (form && formNote) {
    form.addEventListener('submit', async (e) => {
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

      const nombre = form.nombre_doctor.value.trim();
      const clinica = form.nombre_clinica.value.trim();
      const contacto = form.whatsapp.value.trim();

      formNote.hidden = true;
      if (formErrorNote) formErrorNote.hidden = true;
      setSubmitLoading(true);

      // Los navegadores (sobre todo en móvil y en navegación privada) solo
      // permiten window.open() cuando se llama de forma síncrona dentro del
      // gesto de clic del usuario. Si primero esperáramos
      // algo asíncrono, para cuando llegáramos acá el clic original ya "expiró" y
      // el pop-up de WhatsApp queda bloqueado en silencio — eso era lo que le
      // pasaba al formulario. Por eso WhatsApp se abre primero, sin await.
      const mensaje =
        `Hola ClinIAssist, me gustaría agendar una demostración:\n` +
        `- Nombre: ${nombre}\n` +
        `- Clínica: ${clinica}\n` +
        `- WhatsApp: ${contacto}\n` +
        `- Especialidad: ${especialidad}`;
      const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
      // OJO: pasar 'noopener' como feature acá haría que window.open() siempre
      // devuelva null (incluso cuando SÍ abre la ventana), imposibilitando
      // detectar un bloqueo real. Se abre sin ese flag para recibir una
      // referencia real y, si se obtuvo, se le corta la relación con
      // waWindow.opener = null a mano — mismo efecto de seguridad, sin perder
      // la forma de saber si el navegador bloqueó el pop-up.
      const waWindow = window.open(waUrl, '_blank');
      if (waWindow) {
        try { waWindow.opener = null; } catch { /* cross-origin: se ignora */ }
      }
      const waBlocked = !waWindow || waWindow.closed;

      setSubmitLoading(false);

      if (!waBlocked) {
        formNote.hidden = false;
        form.reset();
        resetSpecialtyPicker();
      } else if (formErrorNote) {
        // El navegador bloqueó el pop-up. Se deja un enlace real (clic
        // genuino del usuario, no bloqueable) como salida.
        const waLink = document.getElementById('formErrorWaLink');
        if (waLink) waLink.href = waUrl;
        formErrorNote.hidden = false;
      }
    });
  }
})();
