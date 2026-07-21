document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Reading progress bar ---------- */
  const progressBar = document.querySelector('.reading-progress__bar');
  const articleContent = document.querySelector('.article-content');
  if (progressBar && articleContent) {
    const update = () => {
      const docTop = articleContent.getBoundingClientRect().top + window.scrollY;
      const scrollable = Math.max(articleContent.offsetHeight - window.innerHeight, 1);
      const scrolled = Math.min(Math.max(window.scrollY - docTop, 0), scrollable);
      progressBar.style.width = (scrolled / scrollable) * 100 + '%';
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---------- Table of contents (auto-generated from h2 headings) ---------- */
  const tocList = document.querySelector('.article-toc__list');
  if (tocList && articleContent) {
    const headings = Array.from(articleContent.querySelectorAll('h2'));

    const slugify = (str) => str
      .toLowerCase()
      .normalize('NFD').replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    headings.forEach((h) => {
      if (!h.id) h.id = slugify(h.textContent);
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent;
      li.appendChild(a);
      tocList.appendChild(li);
    });

    const tocLinks = Array.from(tocList.querySelectorAll('a'));
    tocLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.getElementById(link.getAttribute('href').slice(1));
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    if (headings.length) {
      const spy = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const link = tocList.querySelector(`a[href="#${entry.target.id}"]`);
          if (!link) return;
          tocLinks.forEach(l => l.classList.remove('active'));
          link.classList.add('active');
        });
      }, { rootMargin: '-100px 0px -70% 0px', threshold: 0 });
      headings.forEach(h => spy.observe(h));
    }
  }

  /* ---------- Audio player: show real duration once metadata loads ---------- */
  const audio = document.querySelector('.article-audio audio');
  const durationEl = document.querySelector('.article-audio__duration');
  if (audio && durationEl) {
    const formatTime = (s) => {
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60);
      return `${m}:${String(sec).padStart(2, '0')}`;
    };
    audio.addEventListener('loadedmetadata', () => {
      if (isFinite(audio.duration)) durationEl.textContent = formatTime(audio.duration) + ' de áudio';
    });
  }

  /* ---------- Share buttons ---------- */
  const pageUrl = () => window.location.href;
  const pageTitle = () => document.title;

  document.querySelectorAll('.share-btn[data-share]').forEach(btn => {
    const type = btn.dataset.share;

    if (type === 'copy') {
      btn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(pageUrl());
        } catch {
          return;
        }
        const label = btn.querySelector('span');
        const original = label.textContent;
        btn.classList.add('share-btn--copied');
        label.textContent = 'Link copiado!';
        setTimeout(() => {
          btn.classList.remove('share-btn--copied');
          label.textContent = original;
        }, 2000);
      });
      return;
    }

    const shareUrls = {
      whatsapp: () => `https://wa.me/?text=${encodeURIComponent(pageTitle() + ' ' + pageUrl())}`,
      facebook: () => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl())}`,
      linkedin: () => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl())}`
    };
    if (!shareUrls[type]) return;

    btn.addEventListener('click', () => {
      window.open(shareUrls[type](), '_blank', 'noopener,width=600,height=600');
    });
  });

  /* ---------- Listing page: search + category filter + pagination ---------- */
  const grid = document.querySelector('.articles-grid');
  if (grid) {
    const cards = Array.from(grid.querySelectorAll('.article-card'));
    const searchInput = document.querySelector('.articles-search input');
    const filterButtons = Array.from(document.querySelectorAll('.filter-pill'));
    const emptyState = document.querySelector('.articles-empty');
    const paginationWrap = document.querySelector('.articles-pagination');
    const pageSize = 9;

    let activeCategory = 'todos';
    let searchTerm = '';
    let currentPage = 1;

    function getFiltered() {
      return cards.filter(card => {
        const matchesCategory = activeCategory === 'todos' || card.dataset.category === activeCategory;
        const matchesSearch = !searchTerm || card.dataset.title.toLowerCase().includes(searchTerm);
        return matchesCategory && matchesSearch;
      });
    }

    function render() {
      const filtered = getFiltered();
      const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
      currentPage = Math.min(currentPage, totalPages);

      cards.forEach(card => { card.style.display = 'none'; });
      filtered
        .slice((currentPage - 1) * pageSize, currentPage * pageSize)
        .forEach(card => { card.style.display = ''; });

      emptyState?.classList.toggle('visible', filtered.length === 0);

      if (!paginationWrap) return;
      paginationWrap.innerHTML = '';
      paginationWrap.hidden = totalPages <= 1;
      if (totalPages <= 1) return;

      const makeButton = (label, disabled, onClick) => {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.disabled = disabled;
        btn.type = 'button';
        btn.addEventListener('click', onClick);
        return btn;
      };

      paginationWrap.appendChild(makeButton('‹', currentPage === 1, () => { currentPage--; render(); }));
      for (let i = 1; i <= totalPages; i++) {
        const btn = makeButton(String(i), false, () => { currentPage = i; render(); });
        if (i === currentPage) btn.classList.add('active');
        paginationWrap.appendChild(btn);
      }
      paginationWrap.appendChild(makeButton('›', currentPage === totalPages, () => { currentPage++; render(); }));
    }

    searchInput?.addEventListener('input', (e) => {
      searchTerm = e.target.value.trim().toLowerCase();
      currentPage = 1;
      render();
    });

    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCategory = btn.dataset.filter;
        currentPage = 1;
        render();
      });
    });

    render();
  }

});
