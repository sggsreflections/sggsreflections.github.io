/**
 * REFLECTIONS OF SRI GURU GRANTH SAHIB
 * Main Application Logic & In-App PDF Reader
 */

(function () {
  'use strict';

  // State
  const state = {
    lang: localStorage.getItem('sggs_lang') || 'pa',
    theme: localStorage.getItem('sggs_theme') || 'light',
    fontSize: localStorage.getItem('sggs_font_size') || 'medium',
    category: 'all',
    searchQuery: '',
    reader: {
      active: false,
      section: null,
      partIndex: 0,
      pdfDoc: null,
      zoom: 1.15,
      isFullBook: false,
      isRendering: false
    }
  };

  // Translations
  const I18N = {
    pa: {
      navHome: "ਮੁੱਖ ਪੰਨਾ",
      navIndex: "ਸੂਚੀ-ਪੱਤਰ ਤੇ ਪਾਠ",
      navDownload: "ਪੂਰੀ ਕਿਤਾਬ ਡਾਊਨਲੋਡ",
      navAbout: "ਕਿਤਾਬ ਬਾਰੇ",
      navAuthor: "ਲੇਖਕ ਬਾਰੇ",
      navRecs: "ਵੈਬਸਾਈਟ ਸੁਝਾਅ",
      searchPlaceholder: "ਰਾਗ ਦਾ ਨਾਮ ਜਾਂ ਅੰਗ ਨੰਬਰ ਲਿਖੋ (ਜਿਵੇਂ: ਗਉੜੀ, 151, Asa)...",
      angJumpPlaceholder: "ਅੰਗ ਨੰ. (1-1430)",
      angJumpBtn: "ਅੰਗ ਤੇ ਜਾਓ",
      filterAll: "ਸਾਰੇ ਸੈਕਸ਼ਨ (46)",
      filterDaily: "ਨਿਤਨੇਮ ਤੇ ਮੁੱਢਲੀਆਂ ਬਾਣੀਆਂ (1–13)",
      filterRaag: "31 ਮੁੱਖ ਰਾਗ (14–1352)",
      filterClosing: "ਸਲੋਕ ਤੇ ਸਮਾਪਤੀ ਬਾਣੀਆਂ (1353–1430)",
      showingResults: "ਦਿਖਾਏ ਜਾ ਰਹੇ ਹਨ: {count} ਸੈਕਸ਼ਨ",
      btnRead: "ਪੜ੍ਹੋ",
      btnDownload: "ਡਾਊਨਲੋਡ",
      btnOpenTab: "ਨਵੀਂ ਟੈਬ ਵਿੱਚ ਖੋਲ੍ਹੋ",
      btnClose: "ਬੰਦ ਕਰੋ",
      resumeReading: "ਪਿਛਲਾ ਪੜ੍ਹਿਆ ਅੰਗ ਜਾਰੀ ਰੱਖੋ: {title}",
      partsLabel: "{count} ਭਾਗ",
      noResults: "ਕੋਈ ਬਾਣੀ ਜਾਂ ਰਾਗ ਨਹੀਂ ਮਿਲਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਸਪੈਲਿੰਗ ਜਾਂ ਅੰਗ ਨੰਬਰ ਚੈੱਕ ਕਰੋ।",
      zoomIn: "ਜੂਮ ਵਧਾਓ (+)",
      zoomOut: "ਜੂਮ ਘਟਾਓ (-)",
      zoomReset: "ਰੀਸੈੱਟ (100%)",
      zoomFit: "ਸਕ੍ਰੀਨ ਮੁਤਾਬਕ (Fit)",
      nextSection: "ਅਗਲਾ ਭਾਗ »",
      prevSection: "« ਪਿਛਲਾ ਭਾਗ",
      partSelect: "ਭਾਗ ਚੁਣੋ:"
    },
    en: {
      navHome: "Home",
      navIndex: "Index & Reader",
      navDownload: "Download Full Book",
      navAbout: "About Book",
      navAuthor: "About Author",
      navRecs: "Site Guide",
      searchPlaceholder: "Search by Raag or Ang number (e.g., Gauri, 151, Asa)...",
      angJumpPlaceholder: "Ang No. (1-1430)",
      angJumpBtn: "Go to Ang",
      filterAll: "All Sections (46)",
      filterDaily: "Daily Prayers (1–13)",
      filterRaag: "31 Main Ragas (14–1352)",
      filterClosing: "Closing Banis & Saloks (1353–1430)",
      showingResults: "Showing: {count} sections",
      btnRead: "Read",
      btnDownload: "Download",
      btnOpenTab: "Open in New Tab",
      btnClose: "Close",
      resumeReading: "Resume Reading: {title}",
      partsLabel: "{count} parts",
      noResults: "No sections found. Please check spelling or Ang number.",
      zoomIn: "Zoom In (+)",
      zoomOut: "Zoom Out (-)",
      zoomReset: "Reset (100%)",
      zoomFit: "Fit Width",
      nextSection: "Next Section »",
      prevSection: "« Prev Section",
      partSelect: "Select Part:"
    }
  };

  // DOM Elements
  let elements = {};

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    cacheDom();
    applyTheme(state.theme);
    applyFontSize(state.fontSize);
    applyLanguage(state.lang);
    bindEvents();
    renderStats();
    renderIndexGrid();
    renderDownloadSection();
    renderIntroductionTabs();
    renderAuthorSection();
    renderLastReadBanner();
    checkUrlHash();
  });

  function cacheDom() {
    elements = {
      html: document.documentElement,
      themeToggleBtn: document.getElementById('theme-toggle-btn'),
      langToggleBtn: document.getElementById('lang-toggle-btn'),
      fontSizeBtns: document.querySelectorAll('.font-size-btn'),
      mobileMenuBtn: document.getElementById('mobile-menu-btn'),
      mobileNav: document.getElementById('mobile-nav'),
      searchInput: document.getElementById('index-search-input'),
      searchClearBtn: document.getElementById('search-clear-btn'),
      angJumpInput: document.getElementById('ang-jump-input'),
      angJumpBtn: document.getElementById('ang-jump-btn'),
      filterTabs: document.querySelectorAll('.filter-tab'),
      filterSummary: document.getElementById('filter-summary'),
      indexGrid: document.getElementById('index-grid'),
      lastReadBanner: document.getElementById('last-read-banner'),
      // Reader Modal
      readerModal: document.getElementById('reader-modal'),
      readerCloseBtn: document.getElementById('reader-close-btn'),
      readerSecTitle: document.getElementById('reader-sec-title'),
      readerPartTitle: document.getElementById('reader-part-title'),
      readerPartSelect: document.getElementById('reader-part-select'),
      readerZoomIn: document.getElementById('reader-zoom-in'),
      readerZoomOut: document.getElementById('reader-zoom-out'),
      readerZoomReset: document.getElementById('reader-zoom-reset'),
      readerZoomFit: document.getElementById('reader-zoom-fit'),
      readerZoomBadge: document.getElementById('reader-zoom-badge'),
      readerOpenTab: document.getElementById('reader-open-tab'),
      readerDownload: document.getElementById('reader-download'),
      readerViewport: document.getElementById('reader-viewport'),
      pdfCanvasContainer: document.getElementById('pdf-canvas-container'),
      readerFallbackIframe: document.getElementById('reader-fallback-iframe'),
      readerLoading: document.getElementById('reader-loading'),
      readerPrevBtn: document.getElementById('reader-prev-btn'),
      readerNextBtn: document.getElementById('reader-next-btn'),
      scrollTopBtn: document.getElementById('scroll-top-btn')
    };
  }

  function bindEvents() {
    // Theme Switcher (Cycle: light -> sepia -> dark -> light)
    if (elements.themeToggleBtn) {
      elements.themeToggleBtn.addEventListener('click', () => {
        const themes = ['light', 'sepia', 'dark'];
        const nextIdx = (themes.indexOf(state.theme) + 1) % themes.length;
        applyTheme(themes[nextIdx]);
      });
    }

    // Language Toggle
    if (elements.langToggleBtn) {
      elements.langToggleBtn.addEventListener('click', () => {
        const nextLang = state.lang === 'pa' ? 'en' : 'pa';
        applyLanguage(nextLang);
      });
    }

    // Mobile Menu Toggle
    if (elements.mobileMenuBtn && elements.mobileNav) {
      elements.mobileMenuBtn.addEventListener('click', () => {
        elements.mobileNav.classList.toggle('open');
      });
      // Close mobile menu when clicking a link
      elements.mobileNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          elements.mobileNav.classList.remove('open');
        });
      });
    }

    // Search Input
    if (elements.searchInput) {
      elements.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.trim().toLowerCase();
        if (elements.searchClearBtn) {
          elements.searchClearBtn.classList.toggle('visible', state.searchQuery.length > 0);
        }
        renderIndexGrid();
      });
    }

    if (elements.searchClearBtn) {
      elements.searchClearBtn.addEventListener('click', () => {
        elements.searchInput.value = '';
        state.searchQuery = '';
        elements.searchClearBtn.classList.remove('visible');
        renderIndexGrid();
        elements.searchInput.focus();
      });
    }

    // Ang Jump
    if (elements.angJumpBtn && elements.angJumpInput) {
      elements.angJumpBtn.addEventListener('click', executeAngJump);
      elements.angJumpInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') executeAngJump();
      });
    }

    // Category Tabs
    if (elements.filterTabs) {
      elements.filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          elements.filterTabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          state.category = tab.getAttribute('data-category');
          renderIndexGrid();
        });
      });
    }

    // Reader Controls
    if (elements.readerCloseBtn) elements.readerCloseBtn.addEventListener('click', closeReader);
    if (elements.readerZoomIn) elements.readerZoomIn.addEventListener('click', () => setZoom(state.reader.zoom + 0.25));
    if (elements.readerZoomOut) elements.readerZoomOut.addEventListener('click', () => setZoom(Math.max(0.6, state.reader.zoom - 0.25)));
    if (elements.readerZoomReset) elements.readerZoomReset.addEventListener('click', () => setZoom(1.0));
    if (elements.readerZoomFit) elements.readerZoomFit.addEventListener('click', fitZoomToWidth);

    if (elements.readerPartSelect) {
      elements.readerPartSelect.addEventListener('change', (e) => {
        const partIdx = parseInt(e.target.value, 10);
        loadReaderPart(state.reader.section, partIdx);
      });
    }

    if (elements.readerPrevBtn) {
      elements.readerPrevBtn.addEventListener('click', () => navigateSection(-1));
    }
    if (elements.readerNextBtn) {
      elements.readerNextBtn.addEventListener('click', () => navigateSection(1));
    }

    // Keyboard Shortcuts for Reader
    document.addEventListener('keydown', (e) => {
      if (!state.reader.active) return;
      if (e.key === 'Escape') closeReader();
      if (e.key === '+' || e.key === '=') setZoom(state.reader.zoom + 0.25);
      if (e.key === '-') setZoom(Math.max(0.6, state.reader.zoom - 0.25));
      if (e.key === '0') setZoom(1.0);
    });

    // Touch Pinch-to-Zoom on mobile
    setupTouchPinchZoom();

    // Scroll to Top Button
    window.addEventListener('scroll', () => {
      if (elements.scrollTopBtn) {
        elements.scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
      }
    });

    if (elements.scrollTopBtn) {
      elements.scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Popstate / Hash change listener
    window.addEventListener('hashchange', checkUrlHash);
  }

  // Touch Pinch-to-Zoom Support
  function setupTouchPinchZoom() {
    if (!elements.readerViewport) return;
    let initialDist = 0;
    let initialZoom = 1.0;
    let lastTap = 0;

    elements.readerViewport.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        initialDist = Math.hypot(
          e.touches[0].pageX - e.touches[1].pageX,
          e.touches[0].pageY - e.touches[1].pageY
        );
        initialZoom = state.reader.zoom;
      } else if (e.touches.length === 1) {
        // Double-tap detection
        const now = Date.now();
        if (now - lastTap < 300) {
          if (state.reader.zoom > 1.1) {
            setZoom(1.0);
          } else {
            setZoom(1.5);
          }
        }
        lastTap = now;
      }
    }, { passive: true });

    elements.readerViewport.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && initialDist > 0) {
        const currentDist = Math.hypot(
          e.touches[0].pageX - e.touches[1].pageX,
          e.touches[0].pageY - e.touches[1].pageY
        );
        const ratio = currentDist / initialDist;
        const newZoom = Math.min(3.0, Math.max(0.6, initialZoom * ratio));
        applyCssZoomOnly(newZoom);
      }
    }, { passive: true });

    elements.readerViewport.addEventListener('touchend', (e) => {
      if (e.touches.length < 2 && initialDist > 0) {
        initialDist = 0;
      }
    });
  }

  function applyCssZoomOnly(scale) {
    state.reader.zoom = scale;
    if (elements.pdfCanvasContainer) {
      elements.pdfCanvasContainer.style.transform = `scale(${scale})`;
    }
    if (elements.readerZoomBadge) {
      elements.readerZoomBadge.textContent = `${Math.round(scale * 100)}%`;
    }
  }

  // Theme application
  function applyTheme(theme) {
    state.theme = theme;
    elements.html.setAttribute('data-theme', theme);
    localStorage.setItem('sggs_theme', theme);

    if (elements.themeToggleBtn) {
      const icon = theme === 'dark' ? 'fa-sun' : (theme === 'sepia' ? 'fa-moon' : 'fa-book-open');
      const label = theme === 'dark' ? 'Light' : (theme === 'sepia' ? 'Dark' : 'Sepia');
      elements.themeToggleBtn.innerHTML = `<i class="fas ${icon}"></i> <span>${label}</span>`;
    }
  }

  // Font size application
  function applyFontSize(size) {
    state.fontSize = size;
    elements.html.setAttribute('data-font-size', size);
    localStorage.setItem('sggs_font_size', size);
  }

  // Language application
  function applyLanguage(lang) {
    state.lang = lang;
    localStorage.setItem('sggs_lang', lang);

    if (elements.langToggleBtn) {
      elements.langToggleBtn.innerHTML = `<i class="fas fa-globe"></i> <span>${lang === 'pa' ? 'English' : 'ਪੰਜਾਬੀ'}</span>`;
    }

    // Update static I18N text across page
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (I18N[lang][key]) {
        el.textContent = I18N[lang][key];
      }
    });

    if (elements.searchInput) {
      elements.searchInput.placeholder = I18N[lang].searchPlaceholder;
    }
    if (elements.angJumpInput) {
      elements.angJumpInput.placeholder = I18N[lang].angJumpPlaceholder;
    }
    if (elements.angJumpBtn) {
      elements.angJumpBtn.innerHTML = `<i class="fas fa-arrow-right"></i> ${I18N[lang].angJumpBtn}`;
    }

    renderIndexGrid();
    renderLastReadBanner();
  }

  // Stats Bar
  function renderStats() {
    const statsContainer = document.getElementById('hero-stats-bar');
    if (!statsContainer || !window.SITE_DATA) return;
    const m = SITE_DATA.meta;
    statsContainer.innerHTML = `
      <div class="stat-item">
        <span class="stat-number">1,430</span>
        <span class="stat-label pa-text">${state.lang === 'pa' ? 'ਪਵਿੱਤਰ ਅੰਗ (Holy Angs)' : 'Holy Angs (Pages)'}</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">31</span>
        <span class="stat-label pa-text">${state.lang === 'pa' ? 'ਮੁੱਖ ਰਾਗ (Classical Ragas)' : 'Classical Ragas'}</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">${m.totalSections}</span>
        <span class="stat-label pa-text">${state.lang === 'pa' ? 'ਬਾਣੀ ਸੈਕਸ਼ਨ (Index Sections)' : 'Index Sections'}</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">${m.totalFiles}</span>
        <span class="stat-label pa-text">${state.lang === 'pa' ? 'ਵਿਸਤ੍ਰਿਤ PDF ਫਾਈਲਾਂ' : 'Detailed PDF Files'}</span>
      </div>
    `;
  }

  // Render Index Grid
  function renderIndexGrid() {
    if (!elements.indexGrid || !window.SITE_DATA) return;
    const { sections } = SITE_DATA;
    const q = state.searchQuery;
    const cat = state.category;

    // Filter
    const filtered = sections.filter(sec => {
      // Category filter
      if (cat !== 'all' && sec.category !== cat) return false;

      // Search query
      if (q) {
        const matchTitlePa = sec.punjabi.toLowerCase().includes(q);
        const matchTitleEn = sec.english.toLowerCase().includes(q);
        const matchPage = sec.pageNum.toString().includes(q) ||
          sec.minPage.toString().includes(q) ||
          sec.maxPage.toString().includes(q);

        // Check if query is within range
        const qNum = parseInt(q, 10);
        const matchRange = !isNaN(qNum) && (qNum >= sec.minPage && qNum <= sec.maxPage);

        return matchTitlePa || matchTitleEn || matchPage || matchRange;
      }
      return true;
    });

    // Update filter summary
    if (elements.filterSummary) {
      elements.filterSummary.textContent = I18N[state.lang].showingResults.replace('{count}', filtered.length);
    }

    if (filtered.length === 0) {
      elements.indexGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
          <i class="fas fa-search" style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--accent-gold);"></i>
          <p style="font-size: 1.1rem;">${I18N[state.lang].noResults}</p>
        </div>
      `;
      return;
    }

    elements.indexGrid.innerHTML = filtered.map(sec => {
      const catLabel = state.lang === 'pa' ? sec.categoryPa : sec.categoryEn;
      const pageRange = state.lang === 'pa' ? sec.pageRangeTextPa : sec.pageRangeTextEn;

      const filesHtml = sec.files.map((file, idx) => {
        const fileLabel = state.lang === 'pa' ? file.labelPa : file.labelEn;
        return `
          <div class="file-item">
            <div class="file-info">
              <span class="file-label">${fileLabel}</span>
              <span class="file-size">${file.sizeFormatted}</span>
            </div>
            <div class="file-actions">
              <button class="btn-read" onclick="window.sggsApp.openReader('${sec.id}', ${idx})" title="${I18N[state.lang].btnRead}">
                <i class="fas fa-book-reader"></i> ${I18N[state.lang].btnRead}
              </button>
              <a href="${file.encodedPath}" download="${file.fileName}" class="btn-download-icon" title="${I18N[state.lang].btnDownload}">
                <i class="fas fa-download"></i>
              </a>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="section-card" id="${sec.id}">
          <div class="section-card-top">
            <span class="ang-badge"><i class="fas fa-bookmark"></i> ${pageRange}</span>
            <span class="category-tag">${catLabel}</span>
          </div>
          <h3 class="section-title-pa">${sec.punjabi}</h3>
          <h4 class="section-title-en">${sec.english}</h4>
          <div class="files-list">
            ${filesHtml}
          </div>
        </div>
      `;
    }).join('');
  }

  // Quick Ang Jump
  function executeAngJump() {
    if (!elements.angJumpInput || !window.SITE_DATA) return;
    const val = parseInt(elements.angJumpInput.value.trim(), 10);
    if (isNaN(val) || val < 1 || val > 1430) {
      alert(state.lang === 'pa' ? 'ਕਿਰਪਾ ਕਰਕੇ 1 ਤੋਂ 1430 ਤੱਕ ਦਾ ਅੰਗ ਨੰਬਰ ਦਰਜ ਕਰੋ।' : 'Please enter an Ang number between 1 and 1430.');
      return;
    }

    // Find the section and file covering this Ang
    const { sections } = SITE_DATA;
    let targetSec = null;
    let targetPartIdx = 0;

    for (const sec of sections) {
      if (val >= sec.minPage && val <= sec.maxPage) {
        targetSec = sec;
        // find exact part
        const pIdx = sec.files.findIndex(f => val >= f.fStart && val <= f.fEnd);
        targetPartIdx = pIdx >= 0 ? pIdx : 0;
        break;
      }
    }

    if (targetSec) {
      openReader(targetSec.id, targetPartIdx);
    } else {
      // scroll to nearest section
      const nearest = sections.reduce((prev, curr) => Math.abs(curr.pageNum - val) < Math.abs(prev.pageNum - val) ? curr : prev);
      const card = document.getElementById(nearest.id);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.style.outline = '3px solid var(--accent-gold)';
        setTimeout(() => card.style.outline = '', 2500);
      }
    }
  }

  // Last Read Banner
  function renderLastReadBanner() {
    if (!elements.lastReadBanner) return;
    const saved = localStorage.getItem('sggs_last_read');
    if (!saved) {
      elements.lastReadBanner.style.display = 'none';
      return;
    }

    try {
      const data = JSON.parse(saved);
      const title = state.lang === 'pa' ? data.titlePa : data.titleEn;
      elements.lastReadBanner.innerHTML = `
        <div class="container" style="padding-top: 1rem;">
          <div style="background: linear-gradient(135deg, rgba(197, 154, 63, 0.15) 0%, rgba(14, 42, 71, 0.08) 100%); border: 1px solid var(--accent-gold); border-radius: var(--radius-md); padding: 0.75rem 1.25rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;">
            <div style="display: flex; align-items: center; gap: 0.6rem;">
              <i class="fas fa-history" style="color: var(--accent-gold-dark); font-size: 1.15rem;"></i>
              <span style="font-weight: 600; font-size: 0.95rem;">${I18N[state.lang].resumeReading.replace('{title}', `<strong>${title}</strong>`)}</span>
            </div>
            <button class="btn-read" onclick="window.sggsApp.openReader('${data.secId}', ${data.partIdx})">
              <i class="fas fa-book-open"></i> ${I18N[state.lang].btnRead}
            </button>
          </div>
        </div>
      `;
      elements.lastReadBanner.style.display = 'block';
    } catch (e) {
      elements.lastReadBanner.style.display = 'none';
    }
  }

  // Save Last Read
  function saveLastRead(sec, partIdx) {
    if (!sec) return;
    const file = sec.files[partIdx] || sec.files[0];
    const data = {
      secId: sec.id,
      partIdx,
      titlePa: `${sec.punjabi} (${file.labelPa})`,
      titleEn: `${sec.english} (${file.labelEn})`,
      timestamp: Date.now()
    };
    localStorage.setItem('sggs_last_read', JSON.stringify(data));
    renderLastReadBanner();
  }

  // Download Section
  function renderDownloadSection() {
    const box = document.getElementById('download-card-container');
    if (!box || !window.SITE_DATA) return;
    const { fullBook } = SITE_DATA;

    box.innerHTML = `
      <div class="download-card-wrapper">
        <div class="download-grid">
          <div class="download-cover-box">
            <img src="book-cover.jpg" alt="Reflections of Sri Guru Granth Sahib Book Cover" class="download-cover-img" loading="lazy">
          </div>
          <div class="download-details">
            <span class="download-tag">ਸੰਪੂਰਨ ਕਿਤਾਬ • COMPLETE VOLUME</span>
            <h3 class="download-title">Reflections of Sri Guru Granth Sahib</h3>
            <p style="font-size: 1.05rem; color: #cbdbee; line-height: 1.6;">
              English Translation and In-Depth Commentary of Sri Guru Granth Sahib by Prof. Devinder Singh Sekhon, PhD. The complete authentic PDF edition covering all 1,430 holy Angs.
            </p>
            <div class="download-meta-list">
              <div class="download-meta-item"><i class="fas fa-file-pdf"></i> <span>PDF Document</span></div>
              <div class="download-meta-item"><i class="fas fa-weight-hanging"></i> <span>${fullBook.sizeFormatted}</span></div>
              <div class="download-meta-item"><i class="fas fa-book-open"></i> <span>1,430 Angs</span></div>
              <div class="download-meta-item"><i class="fas fa-check-circle"></i> <span>Complete Book</span></div>
            </div>
            <div class="download-buttons">
              <a href="${fullBook.encodedPath}" download="${fullBook.fileName}" class="btn-primary">
                <i class="fas fa-download"></i> <span>ਸੰਪੂਰਨ ਕਿਤਾਬ ਡਾਊਨਲੋਡ ਕਰੋ (${fullBook.sizeFormatted})</span>
              </a>
              <button class="btn-secondary" onclick="window.sggsApp.openFullBookReader()">
                <i class="fas fa-book-reader"></i> <span>ਆਨਲਾਈਨ ਪੜ੍ਹੋ (Read Online)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Introduction Tabs
  function renderIntroductionTabs() {
    const tabsContainer = document.getElementById('about-tabs-container');
    if (!tabsContainer || !window.SITE_DATA) return;
    const { formattedTexts } = SITE_DATA;

    tabsContainer.innerHTML = `
      <div class="tabs-container">
        <div class="tabs-nav">
          <button class="tab-btn active" data-tab="tab-intro"><i class="fas fa-book-open"></i> <span>1. ਭੂਮਿਕਾ (Introduction)</span></button>
          <button class="tab-btn" data-tab="tab-foreword"><i class="fas fa-feather"></i> <span>2. ਮੁੱਖ-ਬੰਧ (Foreword)</span></button>
          <button class="tab-btn" data-tab="tab-dedication"><i class="fas fa-heart"></i> <span>3. ਸਮਰਪਣ (Dedication)</span></button>
          <button class="tab-btn" data-tab="tab-thanks"><i class="fas fa-praying-hands"></i> <span>4. ਦਿਲੀ ਧੰਨਵਾਦ (Thanks)</span></button>
          <button class="tab-btn" data-tab="tab-title"><i class="fas fa-info-circle"></i> <span>5. ਪ੍ਰਕਾਸ਼ਨ ਵੇਰਵਾ (Title)</span></button>
        </div>
        <div class="tab-content active" id="tab-intro">
          ${formattedTexts.introductionHtml}
        </div>
        <div class="tab-content" id="tab-foreword">
          <h4 class="intro-subheading"><i class="fas fa-feather"></i> Foreword by Prof. Devinder Singh Sekhon</h4>
          ${formattedTexts.foreword.split('\n\n').map(p => `<p style="margin-bottom:1.15rem; font-size:1.02rem; line-height:1.75;">${p}</p>`).join('')}
        </div>
        <div class="tab-content" id="tab-dedication">
          <h4 class="intro-subheading"><i class="fas fa-heart"></i> Dedication</h4>
          ${formattedTexts.dedication.split('\n\n').map(p => `<p style="margin-bottom:1.15rem; font-size:1.1rem; line-height:1.8; font-style:italic;">${p}</p>`).join('')}
        </div>
        <div class="tab-content" id="tab-thanks">
          <h4 class="intro-subheading"><i class="fas fa-praying-hands"></i> Heartfelt Thanks</h4>
          ${formattedTexts.heartfeltThanks.split('\n\n').map(p => `<p style="margin-bottom:1.15rem; font-size:1.05rem; line-height:1.75;">${p}</p>`).join('')}
        </div>
        <div class="tab-content" id="tab-title">
          <h4 class="intro-subheading"><i class="fas fa-book"></i> Book Title &amp; Publication</h4>
          <div style="background:var(--bg-surface); border:1px solid var(--border-color); padding:2rem; border-radius:var(--radius-md); max-width:600px;">
            ${formattedTexts.title.split('\n\n').map(p => `<p style="margin-bottom:0.75rem; font-size:1.1rem; font-weight:600;">${p}</p>`).join('')}
          </div>
        </div>
      </div>
    `;

    // Tab switching event
    tabsContainer.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        tabsContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        tabsContainer.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const targetId = btn.getAttribute('data-tab');
        const targetContent = document.getElementById(targetId);
        if (targetContent) targetContent.classList.add('active');
      });
    });
  }

  // Author Section
  function renderAuthorSection() {
    const authorBox = document.getElementById('author-card-container');
    if (!authorBox) return;

    authorBox.innerHTML = `
      <div class="author-card">
        <div class="author-image-box">
          <img src="author.png" alt="Prof. Devinder Singh Sekhon" class="author-portrait" loading="lazy">
          <div class="author-contact-pills">
            <span class="author-pill"><i class="fas fa-envelope"></i> <a href="mailto:sekhonds@hotmail.ca">sekhonds@hotmail.ca</a></span>
            <span class="author-pill"><i class="fas fa-globe"></i> <a href="http://www.gurbanisandesh.com" target="_blank" rel="noopener">www.gurbanisandesh.com</a></span>
            <span class="author-pill"><i class="fas fa-map-marker-alt"></i> Canada</span>
          </div>
        </div>
        <div class="author-bio">
          <h3 class="author-bio-title">Prof. Devinder Singh Sekhon, PhD</h3>
          <h4 class="author-bio-subtitle pa-text">ਪ੍ਰੋ. ਦਵਿੰਦਰ ਸਿੰਘ ਸੇਖੋਂ (ਕੈਨੇਡਾ) • ਪੀ.ਐਚ.ਡੀ. (ਕੈਮਿਸਟਰੀ ਅਤੇ ਐਜੂਕੇਸ਼ਨਲ ਐਡਮਿਨਿਸਟ੍ਰੇਸ਼ਨ)</h4>
          <div class="author-bio-text">
            <p>
              Prof. Devinder Singh Sekhon has dedicated over four decades to the study and dissemination of Sikh history, scriptures, and holy Gurbani. After teaching at college and university levels, he devoted his retirement years to translating Sri Guru Granth Sahib into English.
            </p>
            <p>
              Having studied Sri Guru Granth Sahib repeatedly using the seminal works of Principal Sahib Singh Ji and Bhai Kahn Singh Nabha's <em>Mahan Kosh</em>, he authored 9 acclaimed books (including publications by SGPC Amritsar and Bhai Chatar Singh Jivan Singh).
            </p>
            <p style="background:var(--bg-secondary); border-left:4px solid var(--accent-gold); padding:0.85rem 1.15rem; border-radius:var(--radius-sm); font-style:italic;">
              <strong>A Humble Appeal to Readers:</strong> "Reviewing the holy books was a daunting task with many components to each Shabad. I have tried my level best to ensure fidelity and remove mistakes, but should you find any error, please kindly point it out and make suggestions for improvement. No single person can bring changes alone; it has to be a concerted effort to inculcate love and reverence for holy Gurbani."
            </p>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // IN-APP PDF READER LOGIC (PDF.js + Canvas + Fallback Iframe + Zoom)
  // ==========================================================================

  function openReader(secId, partIndex = 0) {
    if (!window.SITE_DATA) return;
    const sec = SITE_DATA.sections.find(s => s.id === secId);
    if (!sec) return;

    state.reader.active = true;
    state.reader.section = sec;
    state.reader.partIndex = partIndex;
    state.reader.isFullBook = false;
    state.reader.zoom = 1.15;

    // Show modal
    elements.readerModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Update URL hash
    window.location.hash = `read?sec=${sec.id}&part=${partIndex}`;

    // Update Header
    updateReaderHeader(sec, partIndex);

    // Save reading position
    saveLastRead(sec, partIndex);

    // Load PDF
    loadPdfFile(sec.files[partIndex].encodedPath);
  }

  function openFullBookReader() {
    if (!window.SITE_DATA) return;
    const { fullBook } = SITE_DATA;

    state.reader.active = true;
    state.reader.section = null;
    state.reader.partIndex = 0;
    state.reader.isFullBook = true;
    state.reader.zoom = 1.0;

    elements.readerModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    window.location.hash = 'read?full=true';

    // Header
    if (elements.readerSecTitle) {
      elements.readerSecTitle.textContent = "Reflections of Sri Guru Granth Sahib (Complete Book)";
    }
    if (elements.readerPartTitle) {
      elements.readerPartTitle.textContent = "All 1,430 Angs • Full Edition";
    }
    if (elements.readerPartSelect) {
      elements.readerPartSelect.style.display = 'none';
    }
    if (elements.readerDownload) {
      elements.readerDownload.href = fullBook.encodedPath;
      elements.readerDownload.setAttribute('download', fullBook.fileName);
    }
    if (elements.readerOpenTab) {
      elements.readerOpenTab.href = fullBook.encodedPath;
    }

    loadPdfFile(fullBook.encodedPath);
  }

  function updateReaderHeader(sec, partIndex) {
    const file = sec.files[partIndex] || sec.files[0];

    if (elements.readerSecTitle) {
      elements.readerSecTitle.textContent = `${sec.punjabi} (${sec.english})`;
    }
    if (elements.readerPartTitle) {
      elements.readerPartTitle.textContent = `${file.labelPa} • ${file.labelEn} (${file.sizeFormatted})`;
    }

    // Populate Part Selector
    if (elements.readerPartSelect) {
      elements.readerPartSelect.style.display = sec.files.length > 1 ? 'block' : 'none';
      elements.readerPartSelect.innerHTML = sec.files.map((f, idx) => `
        <option value="${idx}" ${idx === partIndex ? 'selected' : ''}>${f.labelEn} (${f.sizeFormatted})</option>
      `).join('');
    }

    // Download & Open Tab links
    if (elements.readerDownload) {
      elements.readerDownload.href = file.encodedPath;
      elements.readerDownload.setAttribute('download', file.fileName);
    }
    if (elements.readerOpenTab) {
      elements.readerOpenTab.href = file.encodedPath;
    }

    // Prev / Next button state
    const secIdx = SITE_DATA.sections.findIndex(s => s.id === sec.id);
    if (elements.readerPrevBtn) {
      elements.readerPrevBtn.disabled = (secIdx === 0 && partIndex === 0);
    }
    if (elements.readerNextBtn) {
      elements.readerNextBtn.disabled = (secIdx === SITE_DATA.sections.length - 1 && partIndex === sec.files.length - 1);
    }
  }

  function loadReaderPart(sec, partIndex) {
    state.reader.partIndex = partIndex;
    window.location.hash = `read?sec=${sec.id}&part=${partIndex}`;
    updateReaderHeader(sec, partIndex);
    saveLastRead(sec, partIndex);
    loadPdfFile(sec.files[partIndex].encodedPath);
  }

  function navigateSection(delta) {
    if (state.reader.isFullBook || !state.reader.section) return;
    const sec = state.reader.section;
    const curPart = state.reader.partIndex;

    // Check if within current section
    if (delta > 0 && curPart < sec.files.length - 1) {
      loadReaderPart(sec, curPart + 1);
      return;
    }
    if (delta < 0 && curPart > 0) {
      loadReaderPart(sec, curPart - 1);
      return;
    }

    // Switch section
    const secIdx = SITE_DATA.sections.findIndex(s => s.id === sec.id);
    const targetIdx = secIdx + delta;
    if (targetIdx >= 0 && targetIdx < SITE_DATA.sections.length) {
      const nextSec = SITE_DATA.sections[targetIdx];
      const nextPart = delta > 0 ? 0 : nextSec.files.length - 1;
      openReader(nextSec.id, nextPart);
    }
  }

  function closeReader() {
    state.reader.active = false;
    elements.readerModal.classList.remove('active');
    document.body.style.overflow = '';

    // Clear canvas
    if (elements.pdfCanvasContainer) elements.pdfCanvasContainer.innerHTML = '';
    if (elements.readerFallbackIframe) elements.readerFallbackIframe.src = '';

    // Remove hash without reloading
    history.replaceState(null, null, ' ');
  }

  // Load and Render PDF with PDF.js or Fallback
  function loadPdfFile(pdfUrl) {
    if (elements.readerLoading) elements.readerLoading.style.display = 'flex';
    if (elements.pdfCanvasContainer) {
      elements.pdfCanvasContainer.innerHTML = '';
      elements.pdfCanvasContainer.style.display = 'flex';
      elements.pdfCanvasContainer.style.transform = `scale(${state.reader.zoom})`;
    }
    if (elements.readerFallbackIframe) {
      elements.readerFallbackIframe.style.display = 'none';
      elements.readerFallbackIframe.src = '';
    }

    updateZoomBadge();

    // Check if PDF.js is available
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

      const loadingTask = window.pdfjsLib.getDocument({
        url: pdfUrl,
        cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
        cMapPacked: true
      });

      loadingTask.promise.then(pdfDoc => {
        state.reader.pdfDoc = pdfDoc;
        renderAllPages(pdfDoc);
      }).catch(err => {
        console.warn('PDF.js rendering error, using iframe fallback:', err);
        fallbackToIframe(pdfUrl);
      });
    } else {
      // PDF.js not loaded, use fallback iframe
      fallbackToIframe(pdfUrl);
    }
  }

  function renderAllPages(pdfDoc) {
    const container = elements.pdfCanvasContainer;
    container.innerHTML = '';

    const numPages = pdfDoc.numPages;
    let renderedCount = 0;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const pageWrapper = document.createElement('div');
      pageWrapper.className = 'pdf-page-wrapper';
      pageWrapper.style.margin = '0 auto 1.5rem';

      const canvas = document.createElement('canvas');
      canvas.className = 'pdf-page-canvas';
      pageWrapper.appendChild(canvas);
      container.appendChild(pageWrapper);

      renderPage(pdfDoc, pageNum, canvas).then(() => {
        renderedCount++;
        if (renderedCount === 1 && elements.readerLoading) {
          elements.readerLoading.style.display = 'none';
        }
      });
    }
  }

  async function renderPage(pdfDoc, pageNum, canvas) {
    const page = await pdfDoc.getPage(pageNum);
    // Base viewport at 1.5 scale for sharpness
    const baseScale = 1.5;
    const viewport = page.getViewport({ scale: baseScale });

    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };

    await page.render(renderContext).promise;
  }

  function fallbackToIframe(pdfUrl) {
    if (elements.readerLoading) elements.readerLoading.style.display = 'none';
    if (elements.pdfCanvasContainer) elements.pdfCanvasContainer.style.display = 'none';
    if (elements.readerFallbackIframe) {
      elements.readerFallbackIframe.style.display = 'block';
      elements.readerFallbackIframe.src = pdfUrl + '#toolbar=1&navpanes=0';
    }
  }

  function setZoom(scale) {
    state.reader.zoom = Math.round(scale * 100) / 100;
    if (elements.pdfCanvasContainer) {
      elements.pdfCanvasContainer.style.transform = `scale(${state.reader.zoom})`;
    }
    updateZoomBadge();
  }

  function fitZoomToWidth() {
    if (!elements.readerViewport) return;
    const vWidth = elements.readerViewport.clientWidth - 40;
    const canvas = elements.pdfCanvasContainer.querySelector('canvas');
    if (canvas && canvas.width > 0) {
      const scale = vWidth / canvas.width;
      setZoom(Math.max(0.6, Math.min(2.5, scale)));
    } else {
      setZoom(1.0);
    }
  }

  function updateZoomBadge() {
    if (elements.readerZoomBadge) {
      elements.readerZoomBadge.textContent = `${Math.round(state.reader.zoom * 100)}%`;
    }
  }

  // Check URL Hash for direct section links
  function checkUrlHash() {
    const hash = window.location.hash;
    if (!hash || !hash.startsWith('#read')) return;

    if (hash.includes('full=true')) {
      openFullBookReader();
      return;
    }

    const matchSec = hash.match(/sec=([^&]+)/);
    const matchPart = hash.match(/part=(\d+)/);

    if (matchSec && SITE_DATA) {
      const secId = matchSec[1];
      const partIdx = matchPart ? parseInt(matchPart[1], 10) : 0;
      openReader(secId, partIdx);
    }
  }

  // Global exposure for inline onclick handlers
  window.sggsApp = {
    openReader,
    openFullBookReader,
    closeReader,
    applyTheme,
    applyLanguage
  };

})();

