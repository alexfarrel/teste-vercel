document.addEventListener('DOMContentLoaded', () => {

  /* Lucide icons */
  if (window.lucide) lucide.createIcons();

  /* Footer year */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Navbar scroll state ---------- */
  const navbar = document.getElementById('navbar');
  const onScroll = () => {
    if (window.scrollY > 40) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');
  burger?.addEventListener('click', () => mobileMenu.classList.toggle('open'));
  mobileMenu?.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => mobileMenu.classList.remove('open'))
  );

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => revealObserver.observe(el));

  /* ---------- Stat counters ---------- */
  const statEls = document.querySelectorAll('.stat__value[data-count]');
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      const duration = 900;
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      countObserver.unobserve(el);
    });
  }, { threshold: 0.5 });
  statEls.forEach(el => countObserver.observe(el));

  /* ---------- Autoplay video loading/fallback handling (hero + problema) ---------- */
  function setupAutoVideo(video, frame) {
    if (!video || !frame) return;
    const source = video.querySelector('source');
    if (!source || !source.getAttribute('src')) {
      // No source at all -> skip straight to the fallback, no point showing a spinner.
      frame.classList.add('no-video');
      return;
    }

    const reveal = () => frame.classList.add('loaded');

    video.addEventListener('error', () => frame.classList.add('no-video'));
    // Whichever of these fires first reveals the video — some browsers are
    // slow/inconsistent about firing 'canplaythrough' or 'playing' on mobile.
    video.addEventListener('loadeddata', reveal, { once: true });
    video.addEventListener('canplaythrough', reveal, { once: true });
    video.addEventListener('playing', reveal, { once: true });

    // Some mobile browsers (notably Firefox/Chrome for Android with data-saving
    // features on) delay fetching <video autoplay> until the page gets some kind
    // of interaction. Calling .play() explicitly — instead of relying purely on
    // the autoplay attribute — nudges those browsers to start loading right away.
    const tryPlay = () => video.play().catch(() => {});
    tryPlay();
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) tryPlay();
    });

    // Safety net: never let the loading overlay spin forever. If the video
    // still hasn't reported readiness after 5s, reveal the frame anyway —
    // the video keeps loading in the background and will simply pop in
    // whenever it's actually ready, instead of hiding behind the spinner.
    setTimeout(reveal, 5000);
  }

  const heroVideo = document.getElementById('heroVideo');
  const heroFrame = document.getElementById('heroFrame');
  setupAutoVideo(heroVideo, heroFrame);

  const problemaVideo = document.getElementById('problemaVideo');
  const problemaFrame = document.getElementById('problemaFrame');
  setupAutoVideo(problemaVideo, problemaFrame);

  /* ---------- Hero progress bar ---------- */
  const heroProgress = document.getElementById('heroProgress');
  if (heroVideo && heroProgress) {
    heroVideo.addEventListener('timeupdate', () => {
      if (!heroVideo.duration) return;
      heroProgress.style.width = (heroVideo.currentTime / heroVideo.duration) * 100 + '%';
    });
  }

  /* ---------- Accordion (FAQ) ---------- */
  document.querySelectorAll('.accordion__item').forEach(item => {
    const trigger = item.querySelector('.accordion__trigger');
    const panel = item.querySelector('.accordion__panel');
    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      item.parentElement.querySelectorAll('.accordion__item').forEach(other => {
        other.classList.remove('open');
        other.querySelector('.accordion__panel').style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add('open');
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });

  /* ---------- Testimonial slider ---------- */
  const track = document.getElementById('testimonialTrack');
  const dotsWrap = document.getElementById('testimonialDots');
  if (track && dotsWrap) {
    const slides = track.querySelectorAll('.testimonial-slide');
    let current = 0;

    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      if (i === 0) dot.classList.add('active');
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    });

    function goTo(index) {
      current = index;
      track.style.transform = `translateX(-${index * 100}%)`;
      dotsWrap.querySelectorAll('button').forEach((d, i) => d.classList.toggle('active', i === index));
    }

    let autoplay = setInterval(() => goTo((current + 1) % slides.length), 6000);
    track.addEventListener('mouseenter', () => clearInterval(autoplay));
    track.addEventListener('mouseleave', () => {
      autoplay = setInterval(() => goTo((current + 1) % slides.length), 6000);
    });
  }

  /* ---------- Lightbox for portfolio videos ---------- */
  const lightbox = document.getElementById('lightbox');
  const lightboxVideo = document.getElementById('lightboxVideo');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxSourceWebm = document.getElementById('lightboxSourceWebm');
  const lightboxSourceMp4 = document.getElementById('lightboxSourceMp4');
  lightboxVideo?.addEventListener('contextmenu', (e) => e.preventDefault());

  function openLightbox(webmSrc) {
    if (webmSrc) {
      lightboxSourceWebm.src = webmSrc;
      // Cloudinary can deliver the same asset as mp4 by swapping the extension —
      // this keeps playback working on browsers (mainly Safari/iOS) with poor WebM support.
      lightboxSourceMp4.src = webmSrc.replace(/\.webm(\?.*)?$/, '.mp4$1');
      lightboxVideo.load();
    }
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    lightboxVideo.play().catch(() => {});
  }
  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    lightboxVideo.pause();
  }

  document.querySelectorAll('.portfolio__item[data-video]').forEach(btn => {
    btn.addEventListener('click', () => openLightbox(btn.dataset.video));
  });

  lightboxClose?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

  /* ---------- Cookie consent banner ---------- */
  const cookieBar = document.getElementById('cookieBar');
  const cookieAccept = document.getElementById('cookieAccept');
  if (cookieBar) {
    if (!localStorage.getItem('cookieConsent')) {
      setTimeout(() => cookieBar.classList.add('visible'), 800);
    }
    cookieAccept?.addEventListener('click', () => {
      localStorage.setItem('cookieConsent', 'accepted');
      cookieBar.classList.remove('visible');
    });
  }

});
