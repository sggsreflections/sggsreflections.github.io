/**
 * REFLECTIONS OF SRI GURU GRANTH SAHIB - SINGLE-PAGE PDF READER ENGINE
 * Implements strict single-page view, zoom, segment continuity, and touch gestures.
 */

(function () {
  'use strict';

  const state = {
    pdfDoc: null,
    currentPage: 1,
    pageRendering: false,
    pageNumPending: null,
    zoomScale: 1.25,
    autoFitMode: null, // 'width' | 'page' | null
    isFullBook: false,
    section: null,
    segmentIndex: 0,
    theme: localStorage.getItem('sggs_theme') || 'light'
  };

  // Safe Catalog Getter
  function getCatalog() {
    if (typeof GURBANI_CATALOG !== 'undefined') return GURBANI_CATALOG;
    if (typeof window !== 'undefined' && window.GURBANI_CATALOG) return window.GURBANI_CATALOG;
    return null;
  }

  // DOM Elements
  const el = {
    html: document.documentElement,
    titlePrimary: document.getElementById('reader-title-primary'),
    titleSecondary: document.getElementById('reader-title-secondary'),
    segmentWrapper: document.getElementById('segment-selector-wrapper'),
    partSelect: document.getElementById('reader-part-select'),
    downloadBtn: document.getElementById('reader-download-btn'),
    fullscreenBtn: document.getElementById('reader-fullscreen-btn'),
    themeBtn: document.getElementById('reader-theme-btn'),
    btnPrev: document.getElementById('btn-prev-page'),
    btnNext: document.getElementById('btn-next-page'),
    inputPage: document.getElementById('input-page-num'),
    spanTotal: document.getElementById('span-total-pages'),
    btnJump: document.getElementById('btn-jump-page'),
    btnZoomIn: document.getElementById('btn-zoom-in'),
    btnZoomOut: document.getElementById('btn-zoom-out'),
    spanZoom: document.getElementById('span-zoom-level'),
    btnFitWidth: document.getElementById('btn-zoom-fit-width'),
    btnFitPage: document.getElementById('btn-zoom-fit-page'),
    viewport: document.getElementById('reader-viewport'),
    canvas: document.getElementById('pdf-single-canvas'),
    canvasWrapper: document.getElementById('canvas-wrapper'),
    loadingOverlay: document.getElementById('reader-loading-overlay'),
    fallbackFrame: document.getElementById('reader-fallback-frame'),
    toast: document.getElementById('reader-toast')
  };

  const ctx = el.canvas ? el.canvas.getContext('2d') : null;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReader);
  } else {
    initReader();
  }

  function initReader() {
    applyTheme(state.theme);
    bindEvents();
    parseUrlParams();
  }

  function applyTheme(theme) {
    state.theme = theme;
    el.html.setAttribute('data-theme', theme);
    localStorage.setItem('sggs_theme', theme);
    if (el.themeBtn) {
      const icon = theme === 'dark' ? 'fa-sun' : (theme === 'sepia' ? 'fa-moon' : 'fa-book-open');
      el.themeBtn.innerHTML = `<i class="fas ${icon}"></i>`;
    }
  }

  function bindEvents() {
    // Theme
    if (el.themeBtn) {
      el.themeBtn.addEventListener('click', () => {
        const themes = ['light', 'sepia', 'dark'];
        const nextIdx = (themes.indexOf(state.theme) + 1) % themes.length;
        applyTheme(themes[nextIdx]);
      });
    }

    // Fullscreen
    if (el.fullscreenBtn) {
      el.fullscreenBtn.addEventListener('click', toggleFullscreen);
    }

    // Pagination
    if (el.btnPrev) el.btnPrev.addEventListener('click', onPrevPage);
    if (el.btnNext) el.btnNext.addEventListener('click', onNextPage);
    if (el.btnJump && el.inputPage) {
      el.btnJump.addEventListener('click', onJumpPage);
      el.inputPage.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') onJumpPage();
      });
    }

    // Zoom Controls
    if (el.btnZoomIn) el.btnZoomIn.addEventListener('click', () => setZoom(state.zoomScale + 0.25));
    if (el.btnZoomOut) el.btnZoomOut.addEventListener('click', () => setZoom(Math.max(0.5, state.zoomScale - 0.25)));
    if (el.btnFitWidth) el.btnFitWidth.addEventListener('click', fitToWidth);
    if (el.btnFitPage) el.btnFitPage.addEventListener('click', fitToPage);

    // Segment dropdown switcher
    if (el.partSelect) {
      el.partSelect.addEventListener('change', (e) => {
        const newIdx = parseInt(e.target.value, 10);
        switchSegment(newIdx, 1);
      });
    }

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      if (document.activeElement === el.inputPage) return;

      if (e.key === 'ArrowLeft' || e.key === 'k') onPrevPage();
      if (e.key === 'ArrowRight' || e.key === 'j') onNextPage();
      if (e.key === '+' || e.key === '=') setZoom(state.zoomScale + 0.25);
      if (e.key === '-') setZoom(Math.max(0.5, state.zoomScale - 0.25));
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      if (e.key === 'Escape') {
        window.location.href = 'index.html#index';
      }
    });

    // Touch Swipe Navigation for Mobile
    setupTouchGestures();

    // Window Resize -> Re-fit if in auto-fit mode
    window.addEventListener('resize', () => {
      if (state.autoFitMode === 'width') fitToWidth();
      if (state.autoFitMode === 'page') fitToPage();
    });
  }

  function setupTouchGestures() {
    if (!el.viewport) return;
    let startX = 0;
    let startY = 0;

    el.viewport.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
    }, { passive: true });

    el.viewport.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 1) {
        const deltaX = e.changedTouches[0].clientX - startX;
        const deltaY = e.changedTouches[0].clientY - startY;

        // Detect horizontal swipe
        if (Math.abs(deltaX) > 60 && Math.abs(deltaY) < 50) {
          if (deltaX < 0) {
            onNextPage(); // Swiped left -> next
          } else {
            onPrevPage(); // Swiped right -> prev
          }
        }
      }
    }, { passive: true });
  }

  function parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const secId = params.get('sec');
    const partIdx = parseInt(params.get('part') || '0', 10);
    const targetPage = parseInt(params.get('page') || '1', 10);

    const catalog = getCatalog();

    if (mode === 'full') {
      loadFullBook(targetPage);
    } else if (secId && catalog) {
      loadGurbaniSection(secId, partIdx, targetPage);
    } else if (catalog && catalog.sections && catalog.sections.length > 0) {
      // Default to first section (Japji Sahib)
      loadGurbaniSection(catalog.sections[0].id, 0, 1);
    } else {
      showToast('No catalog data available.', 'error');
    }
  }

  // 1. Load Complete Book PDF
  function loadFullBook(targetPage = 1) {
    const catalog = getCatalog();
    if (!catalog) return;

    state.isFullBook = true;
    state.section = null;
    state.segmentIndex = 0;

    const book = catalog.fullBook;
    el.titlePrimary.textContent = "Reflections of Sri Guru Granth Sahib";
    el.titleSecondary.textContent = "Complete Volume • 1,430 Holy Angs • Prof. D.S. Sekhon";

    el.segmentWrapper.style.display = 'none';
    el.downloadBtn.href = book.encodedPath;
    el.downloadBtn.setAttribute('download', book.filename);

    loadPdf(book.encodedPath, targetPage);
  }

  // 2. Load Specific Gurbani Section & Segment
  function loadGurbaniSection(secId, partIndex = 0, targetPage = 1) {
    const catalog = getCatalog();
    if (!catalog) return;

    state.isFullBook = false;
    const sec = catalog.sections.find(s => s.id === secId) || catalog.sections[0];
    state.section = sec;
    state.segmentIndex = Math.min(partIndex, sec.segments.length - 1);

    const segment = sec.segments[state.segmentIndex];

    el.titlePrimary.innerHTML = `<span class="pa-text">${sec.punjabiName}</span> • ${sec.englishName}`;
    el.titleSecondary.innerHTML = `<strong>${segment.label}</strong> (${segment.labelPa}) • Folder: ${sec.folderName}`;

    // Setup Segment Switcher
    if (sec.segments.length > 1) {
      el.segmentWrapper.style.display = 'inline-flex';
      el.partSelect.innerHTML = sec.segments.map((s, idx) => `
        <option value="${idx}" ${idx === state.segmentIndex ? 'selected' : ''}>
          ${s.label} (${s.pdfPageCount} pgs - ${s.sizeFormatted})
        </option>
      `).join('');
    } else {
      el.segmentWrapper.style.display = 'none';
    }

    el.downloadBtn.href = segment.encodedPath;
    el.downloadBtn.setAttribute('download', segment.filename);

    loadPdf(segment.encodedPath, targetPage);
  }

  function switchSegment(partIndex, initialPage = 1) {
    if (!state.section) return;
    state.segmentIndex = partIndex;
    const segment = state.section.segments[partIndex];

    el.titleSecondary.innerHTML = `<strong>${segment.label}</strong> (${segment.labelPa}) • Folder: ${state.section.folderName}`;
    el.partSelect.value = partIndex;
    el.downloadBtn.href = segment.encodedPath;
    el.downloadBtn.setAttribute('download', segment.filename);

    // Update URL history without full reload
    const newUrl = `reader.html?sec=${state.section.id}&part=${partIndex}&page=${initialPage}`;
    history.replaceState(null, null, newUrl);

    showToast(`Loading ${segment.label}...`);
    loadPdf(segment.encodedPath, initialPage);
  }

  // Core PDF Loading with PDF.js
  function loadPdf(pdfUrl, initialPage = 1) {
    showLoading(true);

    if (!window.pdfjsLib) {
      showFallback(pdfUrl);
      return;
    }

    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    window.pdfjsLib.getDocument({
      url: pdfUrl,
      cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
      cMapPacked: true
    }).promise.then(pdf => {
      state.pdfDoc = pdf;
      el.spanTotal.textContent = pdf.numPages;
      el.inputPage.max = pdf.numPages;

      const pageToRender = Math.max(1, Math.min(initialPage, pdf.numPages));
      state.currentPage = pageToRender;
      renderSinglePage(pageToRender);
    }).catch(err => {
      console.error('PDF.js Load Error:', err);
      showFallback(pdfUrl);
    });
  }

  // Strict Single-Page Rendering
  function renderSinglePage(num) {
    state.pageRendering = true;
    showLoading(true);

    state.pdfDoc.getPage(num).then(page => {
      let desiredScale = state.zoomScale;

      if (state.autoFitMode === 'width') {
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const availableWidth = el.viewport.clientWidth - 40;
        desiredScale = Math.max(0.6, availableWidth / unscaledViewport.width);
        state.zoomScale = desiredScale;
      } else if (state.autoFitMode === 'page') {
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const availableHeight = el.viewport.clientHeight - 40;
        desiredScale = Math.max(0.6, availableHeight / unscaledViewport.height);
        state.zoomScale = desiredScale;
      }

      updateZoomIndicator();

      const dpr = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: desiredScale });

      el.canvas.height = viewport.height * dpr;
      el.canvas.width = viewport.width * dpr;
      el.canvas.style.height = `${viewport.height}px`;
      el.canvas.style.width = `${viewport.width}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };

      const renderTask = page.render(renderContext);

      renderTask.promise.then(() => {
        state.pageRendering = false;
        showLoading(false);

        el.inputPage.value = num;
        updateNavButtonStates();

        if (state.pageNumPending !== null) {
          renderSinglePage(state.pageNumPending);
          state.pageNumPending = null;
        }
      });
    }).catch(err => {
      state.pageRendering = false;
      showLoading(false);
      console.error('Page render error:', err);
    });
  }

  function queueRenderPage(num) {
    if (state.pageRendering) {
      state.pageNumPending = num;
    } else {
      renderSinglePage(num);
    }
  }

  // Navigation Logic with Seamless Segment Transitions
  function onPrevPage() {
    const catalog = getCatalog();

    if (state.currentPage > 1) {
      state.currentPage--;
      queueRenderPage(state.currentPage);
      return;
    }

    if (!state.isFullBook && state.section && state.segmentIndex > 0) {
      const prevIdx = state.segmentIndex - 1;
      showToast(`Moving to previous segment: ${state.section.segments[prevIdx].label}...`);
      const prevPages = state.section.segments[prevIdx].pdfPageCount || 1;
      switchSegment(prevIdx, prevPages);
      return;
    }

    if (!state.isFullBook && state.section && catalog) {
      const secIdx = catalog.sections.findIndex(s => s.id === state.section.id);
      if (secIdx > 0) {
        const prevSec = catalog.sections[secIdx - 1];
        const lastPartIdx = prevSec.segments.length - 1;
        showToast(`Entering ${prevSec.englishName}...`);
        loadGurbaniSection(prevSec.id, lastPartIdx, prevSec.segments[lastPartIdx].pdfPageCount || 1);
      }
    }
  }

  function onNextPage() {
    const catalog = getCatalog();

    if (state.pdfDoc && state.currentPage < state.pdfDoc.numPages) {
      state.currentPage++;
      queueRenderPage(state.currentPage);
      return;
    }

    if (!state.isFullBook && state.section && state.segmentIndex < state.section.segments.length - 1) {
      const nextIdx = state.segmentIndex + 1;
      showToast(`Proceeding to next segment: ${state.section.segments[nextIdx].label}...`);
      switchSegment(nextIdx, 1);
      return;
    }

    if (!state.isFullBook && state.section && catalog) {
      const secIdx = catalog.sections.findIndex(s => s.id === state.section.id);
      if (secIdx < catalog.sections.length - 1) {
        const nextSec = catalog.sections[secIdx + 1];
        showToast(`Proceeding to ${nextSec.englishName}...`);
        loadGurbaniSection(nextSec.id, 0, 1);
      } else {
        showToast('You have reached the end of the Gurbani collection.');
      }
    }
  }

  function onJumpPage() {
    const val = parseInt(el.inputPage.value, 10);
    if (!state.pdfDoc || isNaN(val) || val < 1 || val > state.pdfDoc.numPages) {
      showToast(`Please enter a valid page number between 1 and ${state.pdfDoc ? state.pdfDoc.numPages : 1}`);
      return;
    }
    state.currentPage = val;
    queueRenderPage(val);
  }

  // Zoom Operations
  function setZoom(scale) {
    state.autoFitMode = null;
    state.zoomScale = Math.round(scale * 100) / 100;
    updateZoomIndicator();
    if (state.pdfDoc) renderSinglePage(state.currentPage);
  }

  function fitToWidth() {
    state.autoFitMode = 'width';
    if (state.pdfDoc) renderSinglePage(state.currentPage);
  }

  function fitToPage() {
    state.autoFitMode = 'page';
    if (state.pdfDoc) renderSinglePage(state.currentPage);
  }

  function updateZoomIndicator() {
    if (el.spanZoom) {
      el.spanZoom.textContent = `${Math.round(state.zoomScale * 100)}%`;
    }
  }

  function updateNavButtonStates() {
    const catalog = getCatalog();
    const isFirstPage = state.currentPage === 1;
    const isLastPage = state.pdfDoc && state.currentPage === state.pdfDoc.numPages;

    const hasPrevSegment = !state.isFullBook && catalog && (state.segmentIndex > 0 || (state.section && catalog.sections.findIndex(s => s.id === state.section.id) > 0));
    const hasNextSegment = !state.isFullBook && catalog && (state.segmentIndex < (state.section ? state.section.segments.length - 1 : 0) || (state.section && catalog.sections.findIndex(s => s.id === state.section.id) < catalog.sections.length - 1));

    el.btnPrev.disabled = isFirstPage && !hasPrevSegment;
    el.btnNext.disabled = isLastPage && !hasNextSegment;
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  }

  function showLoading(show) {
    if (el.loadingOverlay) {
      el.loadingOverlay.style.display = show ? 'flex' : 'none';
    }
  }

  function showFallback(pdfUrl) {
    showLoading(false);
    if (el.canvas) el.canvas.style.display = 'none';
    if (el.fallbackFrame) {
      el.fallbackFrame.style.display = 'block';
      el.fallbackFrame.src = `${pdfUrl}#page=1&zoom=100`;
    }
  }

  function showToast(message, type = 'info') {
    if (!el.toast) return;
    el.toast.textContent = message;
    el.toast.className = `reader-toast visible ${type}`;
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => {
      el.toast.classList.remove('visible');
    }, 2800);
  }

})();
