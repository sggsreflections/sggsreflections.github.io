/**
 * REFLECTIONS OF SRI GURU GRANTH SAHIB - CORE HOMEPAGE & INTERFACE LOGIC
 * Supports Two Index Modes (Page-wise Table & Raag-wise Accordion), Search, Filters, and Themes
 */

(function () {
  'use strict';

  const state = {
    theme: localStorage.getItem('sggs_theme') || 'light',
    indexMode: localStorage.getItem('sggs_index_mode') || 'pagewise', // 'pagewise' | 'raagwise'
    searchQuery: '',
    category: 'all',
    sortBy: 'page-asc'
  };

  // Safe Catalog Getter
  function getCatalog() {
    if (typeof GURBANI_CATALOG !== 'undefined') return GURBANI_CATALOG;
    if (typeof window !== 'undefined' && window.GURBANI_CATALOG) return window.GURBANI_CATALOG;
    return null;
  }

  // Safe Ready Execution
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    applyTheme(state.theme);
    bindGlobalEvents();

    const indexContainer = document.getElementById('gurbani-index-container');
    const catalog = getCatalog();

    if (indexContainer && catalog) {
      bindIndexEvents();
      renderStats();
      renderIndex();
    }
  }

  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sggs_theme', theme);

    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      const icon = theme === 'dark' ? 'fa-sun' : (theme === 'sepia' ? 'fa-moon' : 'fa-book-open');
      const label = theme === 'dark' ? 'Light' : (theme === 'sepia' ? 'Dark' : 'Sepia');
      themeBtn.innerHTML = `<i class="fas ${icon}"></i> <span>${label}</span>`;
    }
  }

  function bindGlobalEvents() {
    // Theme Switcher (Cycle: light -> sepia -> dark -> light)
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const themes = ['light', 'sepia', 'dark'];
        const next = (themes.indexOf(state.theme) + 1) % themes.length;
        applyTheme(themes[next]);
      });
    }

    // Mobile Menu
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileNav = document.getElementById('mobile-nav');
    if (mobileBtn && mobileNav) {
      mobileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        mobileNav.classList.toggle('open');
      });

      mobileNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => mobileNav.classList.remove('open'));
      });

      // Close on outside click
      document.addEventListener('click', (e) => {
        if (mobileNav.classList.contains('open') && !mobileNav.contains(e.target) && !mobileBtn.contains(e.target)) {
          mobileNav.classList.remove('open');
        }
      });

      // Close on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileNav.classList.contains('open')) {
          mobileNav.classList.remove('open');
        }
      });
    }
  }

  function bindIndexEvents() {
    // Mode Switcher buttons
    const btnPageWise = document.getElementById('btn-mode-pagewise');
    const btnRaagWise = document.getElementById('btn-mode-raagwise');

    if (btnPageWise && btnRaagWise) {
      btnPageWise.addEventListener('click', () => switchIndexMode('pagewise'));
      btnRaagWise.addEventListener('click', () => switchIndexMode('raagwise'));
      updateModeButtons();
    }

    // Search Input
    const searchInput = document.getElementById('index-search-input');
    const searchClear = document.getElementById('search-clear-btn');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.trim().toLowerCase();
        if (searchClear) searchClear.classList.toggle('visible', state.searchQuery.length > 0);
        renderIndex();
      });
    }

    if (searchClear && searchInput) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        state.searchQuery = '';
        searchClear.classList.remove('visible');
        renderIndex();
        searchInput.focus();
      });
    }

    // Category Tabs
    const tabs = document.querySelectorAll('.filter-tab-pill');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.category = tab.getAttribute('data-cat');
        renderIndex();
      });
    });

    // Sort Dropdown
    const sortSelect = document.getElementById('index-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        renderIndex();
      });
    }

    // Quick Ang Jump
    const jumpInput = document.getElementById('ang-jump-input');
    const jumpBtn = document.getElementById('ang-jump-btn');
    if (jumpBtn && jumpInput) {
      jumpBtn.addEventListener('click', executeJump);
      jumpInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') executeJump();
      });
    }
  }

  function switchIndexMode(mode) {
    state.indexMode = mode;
    localStorage.setItem('sggs_index_mode', mode);
    updateModeButtons();
    renderIndex();
  }

  function updateModeButtons() {
    const btnPageWise = document.getElementById('btn-mode-pagewise');
    const btnRaagWise = document.getElementById('btn-mode-raagwise');
    if (btnPageWise && btnRaagWise) {
      btnPageWise.classList.toggle('active', state.indexMode === 'pagewise');
      btnRaagWise.classList.toggle('active', state.indexMode === 'raagwise');
    }
  }

  function executeJump() {
    const jumpInput = document.getElementById('ang-jump-input');
    const catalog = getCatalog();
    if (!jumpInput || !catalog) return;
    const ang = parseInt(jumpInput.value.trim(), 10);

    if (isNaN(ang) || ang < 1 || ang > 1430) {
      alert('Please enter a valid Ang number between 1 and 1430 (ਕਿਰਪਾ ਕਰਕੇ 1 ਤੋਂ 1430 ਦਰਮਿਆਨ ਅੰਗ ਭਰੋ).');
      return;
    }

    const { sections } = catalog;
    let foundSec = null;
    let foundPartIdx = 0;

    for (const sec of sections) {
      if (ang >= sec.minPage && ang <= sec.maxPage) {
        foundSec = sec;
        const pIdx = sec.segments.findIndex(seg => {
          if (seg.nameRangeStart && seg.nameRangeEnd) {
            return ang >= seg.nameRangeStart && ang <= seg.nameRangeEnd;
          }
          return ang === sec.folderStartPage;
        });
        foundPartIdx = pIdx >= 0 ? pIdx : 0;
        break;
      }
    }

    if (foundSec) {
      window.location.href = `reader.html?sec=${foundSec.id}&part=${foundPartIdx}`;
    } else {
      const nearest = sections.reduce((prev, curr) => Math.abs(curr.folderStartPage - ang) < Math.abs(prev.folderStartPage - ang) ? curr : prev);
      window.location.href = `reader.html?sec=${nearest.id}&part=0`;
    }
  }

  function renderStats() {
    const bar = document.getElementById('hero-stats-counter');
    const cat = getCatalog();
    if (!bar || !cat) return;

    bar.innerHTML = `
      <div class="stat-cell">
        <span class="stat-val">1,430</span>
        <span class="stat-lbl pa-text">ਪਵਿੱਤਰ ਅੰਗ (Holy Angs)</span>
      </div>
      <div class="stat-cell">
        <span class="stat-val">31</span>
        <span class="stat-lbl pa-text">ਮੁੱਖ ਰਾਗ (Classical Ragas)</span>
      </div>
      <div class="stat-cell">
        <span class="stat-val">${cat.totalFolders}</span>
        <span class="stat-lbl pa-text">ਸੈਕਸ਼ਨ (Index Folders)</span>
      </div>
      <div class="stat-cell">
        <span class="stat-val">${cat.totalPdfFiles}</span>
        <span class="stat-lbl pa-text">PDF ਫਾਈਲਾਂ (Source Files)</span>
      </div>
    `;
  }

  function getFilteredSections() {
    const cat = getCatalog();
    if (!cat) return [];
    let list = [...cat.sections];

    if (state.category !== 'all') {
      list = list.filter(s => s.category === state.category);
    }

    if (state.searchQuery) {
      const q = state.searchQuery;
      list = list.filter(s => {
        const matchPa = s.punjabiName.toLowerCase().includes(q);
        const matchEn = s.englishName.toLowerCase().includes(q);
        const matchFolder = s.folderName.toLowerCase().includes(q);
        const matchPage = s.folderStartPage.toString().includes(q) ||
                          s.minPage.toString().includes(q) ||
                          s.maxPage.toString().includes(q);

        const qNum = parseInt(q, 10);
        const inRange = !isNaN(qNum) && (qNum >= s.minPage && qNum <= s.maxPage);

        return matchPa || matchEn || matchFolder || matchPage || inRange;
      });
    }

    list.sort((a, b) => {
      if (state.sortBy === 'page-asc') return a.folderStartPage - b.folderStartPage;
      if (state.sortBy === 'page-desc') return b.folderStartPage - a.folderStartPage;
      if (state.sortBy === 'title-asc') return a.englishName.localeCompare(b.englishName);
      if (state.sortBy === 'title-desc') return b.englishName.localeCompare(a.englishName);
      return 0;
    });

    return list;
  }

  function renderIndex() {
    const container = document.getElementById('gurbani-index-container');
    const summaryEl = document.getElementById('index-results-summary');
    const cat = getCatalog();
    if (!container || !cat) return;

    const sections = getFilteredSections();

    if (summaryEl) {
      summaryEl.innerHTML = `Showing <strong>${sections.length}</strong> of <strong>${cat.totalFolders}</strong> sections (${cat.totalPdfFiles} PDF Files total)`;
    }

    if (sections.length === 0) {
      container.innerHTML = `
        <div class="empty-index-box">
          <i class="fas fa-search" style="font-size:2.5rem; color:var(--accent-gold); margin-bottom:1rem;"></i>
          <h3>No matching sections found</h3>
          <p>Try searching with another spelling, Gurmukhi keyword, or Ang number (1 to 1430).</p>
        </div>
      `;
      return;
    }

    if (state.indexMode === 'pagewise') {
      renderPageWiseTable(container, sections);
    } else {
      renderRaagWiseAccordion(container, sections);
    }
  }

  // MODE A: Page-wise Index Table
  function renderPageWiseTable(container, sections) {
    const rows = sections.map((sec, idx) => {
      const segmentsHtml = sec.segments.map((seg, sIdx) => `
        <a href="reader.html?sec=${sec.id}&part=${sIdx}" class="segment-badge-link" title="Read ${seg.label} (${seg.pdfPageCount} pages)">
          <i class="fas fa-file-pdf"></i> ${seg.label} <span class="badge-size">(${seg.sizeFormatted})</span>
        </a>
      `).join(' ');

      return `
        <tr>
          <td class="col-page">
            <span class="ang-page-badge">Ang ${sec.folderStartPage}</span>
          </td>
          <td class="col-punjabi pa-text">
            <strong>${sec.punjabiName}</strong>
            <div class="folder-hint">${sec.folderName}</div>
          </td>
          <td class="col-english">
            ${sec.englishName}
            <div class="cat-pill">${sec.categoryLabel}</div>
          </td>
          <td class="col-segments">
            <div class="segments-flex-wrap">
              ${segmentsHtml}
            </div>
          </td>
          <td class="col-action">
            <a href="reader.html?sec=${sec.id}&part=0" class="btn-read-sm" title="Open in Single-Page Reader">
              <i class="fas fa-glasses"></i> Read
            </a>
          </td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="table-responsive index-table-wrapper">
        <table class="page-wise-index-table">
          <thead>
            <tr>
              <th style="width:110px;">Starting Ang</th>
              <th>Punjabi Title (ਪੰਜਾਬੀ ਨਾਮ)</th>
              <th>English Title</th>
              <th>Available PDF Segments (${sections.reduce((acc,s)=>acc+s.segments.length,0)} Files)</th>
              <th style="width:100px; text-align:center;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  // MODE B: Raag-wise Index Accordion
  function renderRaagWiseAccordion(container, sections) {
    const cards = sections.map((sec, idx) => {
      const segmentsHtml = sec.segments.map((seg, sIdx) => `
        <div class="accordion-segment-row">
          <div class="seg-name-box">
            <i class="fas fa-file-pdf" style="color:var(--accent-gold-dark);"></i>
            <div>
              <strong>${seg.label}</strong> (${seg.labelPa})
              <div class="seg-sub">${seg.pdfPageCount} pages &bull; ${seg.sizeFormatted} &bull; File: ${seg.filename}</div>
            </div>
          </div>
          <div class="seg-actions">
            <a href="reader.html?sec=${sec.id}&part=${sIdx}" class="btn-read-sm">
              <i class="fas fa-glasses"></i> Read Page
            </a>
            <a href="${seg.encodedPath}" download="${seg.filename}" class="btn-dl-sm" title="Download Source PDF">
              <i class="fas fa-download"></i>
            </a>
          </div>
        </div>
      `).join('');

      return `
        <div class="raag-accordion-card">
          <div class="raag-card-header" onclick="this.parentElement.classList.toggle('open')">
            <div class="raag-header-left">
              <span class="ang-page-badge">Ang ${sec.folderStartPage}</span>
              <div class="raag-titles">
                <span class="raag-title-pa pa-text">${sec.punjabiName}</span>
                <span class="raag-title-en">${sec.englishName}</span>
              </div>
            </div>
            <div class="raag-header-right">
              <span class="badge-part-count">${sec.segments.length} ${sec.segments.length === 1 ? 'Segment' : 'Segments'}</span>
              <i class="fas fa-chevron-down accordion-caret"></i>
            </div>
          </div>
          <div class="raag-card-body">
            <div class="raag-card-meta">
              <span><i class="fas fa-folder"></i> Folder: <code>${sec.folderName}</code></span>
              <span><i class="fas fa-bookmark"></i> Range: ${sec.pageRangeText} (${sec.pageRangeTextPa})</span>
              <span><i class="fas fa-tag"></i> Category: ${sec.categoryLabel}</span>
            </div>
            <div class="accordion-segments-list">
              ${segmentsHtml}
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="raag-accordion-grid">
        ${cards}
      </div>
    `;
  }

})();
