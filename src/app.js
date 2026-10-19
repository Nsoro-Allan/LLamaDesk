(() => {
  const $ = (s) => document.querySelector(s);
  const els = {
    main: $('#main'), dd: $('#modelDd'), ddBtn: $('#modelBtn'), ddLabel: $('#modelLabel'), ddMenu: $('#modelMenu'), status: $('#status'), system: $('#system'), temp: $('#temp'), tval: $('#tval'),
    base: $('#base'), refresh: $('#refresh'), thread: $('#thread'), scroll: $('#scroll'), input: $('#input'),
    send: $('#send'), attach: $('#attach'), file: $('#file'), pending: $('#pending'), composer: $('#composer'),
    list: $('#list'), q: $('#q'), banner: $('#banner'), dlg: $('#settings'), seg: $('#themeSeg'),
    mic: $('#mic'), thinkBtn: $('#thinkBtn'),
    topMeta: $('#topMeta'), tempBadge: $('#tempBadge'),
    pullName: $('#pullName'), pullModel: $('#pullModel'), pullProgress: $('#pullProgress'), modelManageList: $('#modelManageList'),
    checkUpdate: $('#checkUpdate'), appVersion: $('#appVersion'), updateStatus: $('#updateStatus'),
    updateDlg: $('#updateDlg'), updateDlgText: $('#updateDlgText'), updateDlgNotes: $('#updateDlgNotes'),
    installUpdate: $('#installUpdate'), laterUpdate: $('#laterUpdate'), updateProgress: $('#updateProgress')
  };
  const ICON = {
    up: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
    stop: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="3"/></svg>',
    copy: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/></svg>',
    check: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    regen: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg>',
    pencil: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    mic: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
    micOff: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
    thinkOn: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3A7 7 0 0 0 12 2z"/></svg>',
    thinkOff: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3A7 7 0 0 0 12 2z"/><line x1="2" y1="2" x2="22" y2="22"/></svg>'
  };

  /* ---------- storage ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem('llamadesk.' + k); return v === null ? d : v; } catch { return d; } },
    set(k, v) { try { localStorage.setItem('llamadesk.' + k, v); return true; } catch { return false; } }
  };

  const state = {
    models: [], model: '', convs: [], cur: null, pending: [], busy: false, abort: null,
    vision: null, thinking: null,
    thinkEnabled: store.get('think', '1') !== '0'
  };

  function persist() {
    const data = state.convs
      .filter((c) => !c.temporary)
      .map((c) => ({
        id: c.id, title: c.title, updated: c.updated,
        messages: c.messages.map((m) => ({
          role: m.role, content: m.content, files: m.files || [],
          imageCount: m.imageCount || (m.images ? m.images.length : 0)
        }))
      }));
    if (!store.set('convs', JSON.stringify(data))) toast('Couldn\u2019t save chat history. Browser storage may be full or disabled.');
  }
  try {
    state.convs = JSON.parse(store.get('convs', '[]')).map((c) => ({
      ...c,
      temporary: false
    }));
  } catch { state.convs = []; }

  els.base.value = store.get('base', 'http://localhost:11434');
  els.system.value = store.get('system', '');
  els.temp.value = store.get('temp', '0.7'); els.tval.textContent = els.temp.value;
  const base = () => els.base.value.trim().replace(/\/+$/, '');

  function applyTheme(t) {
    if (t === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
    // Keep highlight.js theme in sync
    const link = document.getElementById('hljs-theme');
    if (link) {
      const dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      link.href = dark ? 'highlight-dark.css' : 'highlight-light.css';
    }
  }
  function setTheme(t, save = true) {
    applyTheme(t);
    els.seg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.v === t)));
    if (save) store.set('theme', t);
  }
  setTheme(store.get('theme', 'dark'), false);
  if (store.get('side', '') === 'collapsed') document.body.classList.add('side-collapsed');

  /* ---------- helpers ---------- */
  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg; t.setAttribute('role', 'status');
    document.body.appendChild(t); setTimeout(() => t.remove(), 4200);
  }
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  function setStatus(kind, text) {
    els.status.className = 'status ' + kind;
    els.status.querySelector('span').textContent = text;
    els.status.title = text;
  }
  function showBanner(msg) { els.banner.hidden = !msg; els.banner.textContent = msg || ''; }

  /* ---------- markdown (escaped, no external libs for core parsing) ---------- */
  function inline(s) {
    return s.split(/(`[^`\n]+`)/).map((part, i) => {
      if (i % 2) return '<code>' + part.slice(1, -1) + '</code>';
      return part
        .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, '$1<em>$2</em>')
        .replace(/\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    }).join('');
  }
  const isRow = (l) => /^\s*\|.*\|\s*$/.test(l);
  const isSep = (l) => l.includes('-') && l.includes('|') && /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l);
  const cells = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());

  function md(src) {
    const blocks = [];
    let t = src.replace(/```([\w+-]*)[^\n]*\n?([\s\S]*?)(```|$)/g, (m, lang, code) => {
      blocks.push({ lang: (lang || '').toLowerCase(), code: code.replace(/\n$/, '') });
      return '\n\u0000' + (blocks.length - 1) + '\u0000\n';
    });
    t = esc(t);
    const lines = t.split('\n');
    let out = '', para = [], list = null;
    const flushPara = () => { if (para.length) { out += '<p>' + inline(para.join('<br>')) + '</p>'; para = []; } };
    const flushList = () => { if (list) { out += '</' + list + '>'; list = null; } };
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]; let m;
      if ((m = line.match(/^\u0000(\d+)\u0000$/))) {
        flushPara(); flushList();
        const b = blocks[+m[1]];
        const langClass = b.lang ? ' class="language-' + esc(b.lang) + '"' : '';
        out += '<div class="code"><div class="code-head"><span>' + esc(b.lang || 'text') +
               '</span><button type="button" data-copy>Copy</button></div><pre><code' + langClass + '>' + esc(b.code) + '</code></pre></div>';
      } else if (isRow(line) && i + 1 < lines.length && isSep(lines[i + 1])) {
        flushPara(); flushList();
        const head = cells(line); const rows = [];
        i += 2;
        while (i < lines.length && isRow(lines[i])) { rows.push(cells(lines[i])); i++; }
        i--;
        out += '<div class="tbl"><table><thead><tr>' + head.map((c) => '<th>' + inline(c) + '</th>').join('') + '</tr></thead><tbody>' +
          rows.map((r) => '<tr>' + r.map((c) => '<td>' + inline(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
      } else if ((m = line.match(/^(#{1,4})\s+(.*)$/))) {
        flushPara(); flushList();
        out += '<h' + m[1].length + '>' + inline(m[2]) + '</h' + m[1].length + '>';
      } else if ((m = line.match(/^\s*[-*+]\s+(.*)$/))) {
        flushPara();
        if (list !== 'ul') { flushList(); out += '<ul>'; list = 'ul'; }
        out += '<li>' + inline(m[1]) + '</li>';
      } else if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) {
        flushPara();
        if (list !== 'ol') { flushList(); out += '<ol>'; list = 'ol'; }
        out += '<li>' + inline(m[1]) + '</li>';
      } else if ((m = line.match(/^&gt;\s?(.*)$/))) {
        flushPara(); flushList(); out += '<blockquote>' + inline(m[1]) + '</blockquote>';
      } else if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
        flushPara(); flushList(); out += '<hr>';
      } else if (!line.trim()) {
        // Blank lines close paragraphs but KEEP the current list open
        // so consecutive list items stay in one <ol>/<ul> and get sequential numbers.
        flushPara();
      } else {
        flushList();
        para.push(line);
      }
    }
    flushPara(); flushList();
    return out;
  }

  /* ---------- models ---------- */
  async function loadModels() {
    setStatus('', 'Connecting…');
    try {
      const r = await fetch(base() + '/api/tags');
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      state.models = (j.models || [])
        .map((m) => ({ name: m.name, size: m.size, params: m.details && m.details.parameter_size }))
        .sort((a, b) => a.name.localeCompare(b.name));
      const names = state.models.map((m) => m.name);
      if (!names.length) {
        state.model = ''; renderModels();
        setStatus('bad', 'No models installed');
        showBanner('Ollama is running but has no models. In a terminal, run: ollama pull llama3.2');
        return;
      }
      const saved = store.get('model', '');
      state.model = names.includes(saved) ? saved : names[0];
      renderModels();
      setStatus('ok', 'Connected · ' + names.length + (names.length === 1 ? ' model' : ' models'));
      showBanner('');
      checkCapabilities();
    } catch {
      state.models = []; state.model = ''; renderModels();
      setStatus('bad', 'Can\u2019t reach Ollama');
      showBanner('Can\u2019t reach Ollama at ' + base() + '. Start it with "ollama serve", or fix the address in Settings.');
    }
  }

  async function checkCapabilities() {
    state.vision = null;
    state.thinking = null;
    const model = state.model;
    if (!model) {
      updateThinkBtn();
      return;
    }
    try {
      const r = await fetch(base() + '/api/show', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model })
      });
      const j = await r.json();
      if (Array.isArray(j.capabilities)) {
        state.vision = j.capabilities.includes('vision');
        state.thinking = j.capabilities.includes('thinking');
      }
      if (j.thinking && typeof j.thinking === 'object') {
        state.thinking = true;
      }
    } catch {}
    updateThinkBtn();
    renderModelManageList();
  }

  function updateTopMeta() {
    if (!els.topMeta) return;
    const show = !!(state.cur && state.cur.temporary);
    els.topMeta.hidden = !show;
    if (els.tempBadge) els.tempBadge.hidden = !show;
  }

  function updateThinkBtn() {
    if (!els.thinkBtn) return;
    const show = !!state.thinking;
    els.thinkBtn.hidden = !show;
    if (!show) return;

    const on = state.thinkEnabled;
    els.thinkBtn.classList.toggle('active', on);
    els.thinkBtn.innerHTML = on ? ICON.thinkOn : ICON.thinkOff;
    els.thinkBtn.title = on ? 'Thinking on (click to disable)' : 'Thinking off (click to enable)';
    els.thinkBtn.setAttribute('aria-label', els.thinkBtn.title);
    els.thinkBtn.setAttribute('aria-pressed', String(on));
  }

  /* ---------- attachments ---------- */
  const PDF_MAX_BYTES = 40 * 1024 * 1024; // 40 MB
  const PDF_MAX_PAGES = 25;
  const PDF_MAX_CHARS = 100000;
  const PDF_MIN_TEXT_CHARS = 30; // below this → try OCR (likely scanned)

  function imageToBase64(file, max = 1280) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file), im = new Image();
      im.onload = () => {
        const s = Math.min(1, max / Math.max(im.width, im.height));
        const w = Math.round(im.width * s), h = Math.round(im.height * s);
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(im, 0, 0, w, h);
        const data = c.toDataURL('image/jpeg', 0.9);
        URL.revokeObjectURL(url);
        resolve({ b64: data.split(',')[1], preview: data });
      };
      im.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read ' + (file.name || 'image'))); };
      im.src = url;
    });
  }

  function isPdfFile(f) {
    const name = (f.name || '').toLowerCase();
    return f.type === 'application/pdf' || name.endsWith('.pdf');
  }

  function ensurePdfJs() {
    const lib = window.pdfjsLib || window['pdfjs-dist/build/pdf'] || null;
    if (!lib) throw new Error('PDF engine not loaded. Check vendor/pdf.min.js.');
    if (lib.GlobalWorkerOptions) {
      lib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
    }
    return lib;
  }

  async function extractTextLayerFromPdf(pdf, maxPages) {
    const n = Math.min(pdf.numPages, maxPages);
    const parts = [];
    for (let i = 1; i <= n; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((it) => (it && it.str) || '').join(' ');
      if (pageText.trim()) parts.push(pageText.trim());
    }
    return parts.join('\n\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  async function renderPdfPageToCanvas(page, scale) {
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas;
  }

  async function ocrPdfPages(pdf, maxPages, onProgress) {
    if (!window.Tesseract || !window.Tesseract.recognize) {
      throw new Error('OCR engine not loaded. Check vendor/tesseract.min.js.');
    }
    const n = Math.min(pdf.numPages, maxPages);
    const parts = [];
    // First OCR may download language data (~few MB) via CDN; later runs can use cache.
    for (let i = 1; i <= n; i++) {
      if (onProgress) onProgress(i, n);
      const page = await pdf.getPage(i);
      // 1.5–2.0 scale improves OCR accuracy without huge memory use
      const canvas = await renderPdfPageToCanvas(page, 1.75);
      const result = await window.Tesseract.recognize(canvas, 'eng', {
        logger: () => {}
      });
      const text = (result && result.data && result.data.text) || '';
      if (text.trim()) parts.push(text.trim());
      // free canvas memory
      canvas.width = 0;
      canvas.height = 0;
    }
    return parts.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  async function extractPdf(file) {
    if (file.size > PDF_MAX_BYTES) {
      throw new Error(file.name + ' is over 40 MB. Use a smaller PDF or an excerpt.');
    }
    const pdfjs = ensurePdfJs();
    const buf = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: buf });
    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;
    const pagesToRead = Math.min(pageCount, PDF_MAX_PAGES);

    toast('Reading PDF' + (pageCount > PDF_MAX_PAGES ? ' (first ' + PDF_MAX_PAGES + ' pages)' : '') + '…');

    let text = await extractTextLayerFromPdf(pdf, pagesToRead);
    let method = 'text';

    // Scanned / image-only PDFs often yield almost no text layer
    if (text.length < PDF_MIN_TEXT_CHARS) {
      toast('Scanned PDF detected — running OCR (first use may download language data)…');
      text = await ocrPdfPages(pdf, pagesToRead, (i, n) => {
        toast('OCR page ' + i + ' / ' + n + '…');
      });
      method = 'ocr';
    }

    if (!text || text.length < 3) {
      throw new Error('No text could be extracted from ' + file.name + '.');
    }

    if (text.length > PDF_MAX_CHARS) {
      text = text.slice(0, PDF_MAX_CHARS) + '\n\n[…truncated for length]';
    }

    const note = method === 'ocr' ? ' (OCR)' : '';
    const pageNote = pageCount > PDF_MAX_PAGES ? ', first ' + PDF_MAX_PAGES + ' pages' : '';
    toast('Extracted text from ' + file.name + note + pageNote + '.');
    return text;
  }

  async function addFiles(list) {
    for (const f of Array.from(list)) {
      try {
        if (f.type.startsWith('image/')) {
          const { b64, preview } = await imageToBase64(f);
          state.pending.push({ kind: 'image', name: f.name || 'image', b64, preview });
        } else if (isPdfFile(f)) {
          const text = await extractPdf(f);
          state.pending.push({ kind: 'text', name: f.name || 'document.pdf', text });
        } else {
          if (f.size > 400 * 1024) { toast(f.name + ' is over 400 KB. Attach a smaller file or an excerpt.'); continue; }
          const text = await f.text();
          if (text.includes('\u0000')) { toast(f.name + ' isn\u2019t plain text. For PDFs, attach the .pdf file directly.'); continue; }
          state.pending.push({ kind: 'text', name: f.name, text });
        }
      } catch (e) { toast(e.message || String(e)); }
    }
    renderPending();
  }
  function renderPending() {
    els.pending.innerHTML = '';
    state.pending.forEach((a, i) => {
      const chip = document.createElement('div');
      chip.className = 'chip' + (a.kind === 'text' ? ' file' : '');
      if (a.kind === 'image') { const im = document.createElement('img'); im.src = a.preview; im.alt = a.name; chip.appendChild(im); }
      else chip.appendChild(document.createTextNode(a.name));
      const x = document.createElement('button');
      x.type = 'button'; x.className = 'x'; x.textContent = '×'; x.setAttribute('aria-label', 'Remove ' + a.name);
      x.onclick = () => { state.pending.splice(i, 1); renderPending(); };
      chip.appendChild(x); els.pending.appendChild(chip);
    });
    updateSend();
  }

  /* ---------- conversations ---------- */
  const msgs = () => (state.cur ? state.cur.messages : []);

  /* ---------- speech-to-text (tauri-plugin-stt / Whisper) ---------- */
  // Works via window.__TAURI__ (withGlobalTauri: true) — no bundler required.
  let sttListening = false;

  function setMicUI(mode) {
    // mode: 'idle' | 'recording' | 'processing'
    if (!els.mic) return;
    els.mic.classList.toggle('recording', mode === 'recording');
    els.mic.classList.toggle('processing', mode === 'processing');
    els.mic.innerHTML = mode === 'recording' ? ICON.micOff : ICON.mic;
    els.mic.title =
      mode === 'recording' ? 'Stop & transcribe' :
      mode === 'processing' ? 'Transcribing…' :
      'Voice input';
    els.mic.setAttribute('aria-label', els.mic.title);
    sttListening = mode === 'recording';
  }

  function stopSttIfListening() {
    if (!sttListening) return;
    const core = window.__TAURI__ && window.__TAURI__.core;
    if (core) {
      setMicUI('processing');
      core.invoke('plugin:stt|stop_listening').catch(() => setMicUI('idle'));
    }
  }

  async function initStt() {
    if (!els.mic) return;
    const T = window.__TAURI__;
    if (!T || !T.core || !T.event) {
      // Not running inside Tauri (e.g. plain browser) — hide mic
      els.mic.hidden = true;
      return;
    }
    const { invoke } = T.core;
    const { listen } = T.event;

    els.mic.hidden = false;
    els.mic.innerHTML = ICON.mic;

    async function ensureModel() {
      try {
        const avail = await invoke('plugin:stt|is_available');
        if (avail === true || (avail && avail.available)) return true;
      } catch (_) {}
      toast('Downloading voice model (one-time)…');
      await invoke('plugin:stt|install_model', { id: 'base' });
      toast('Voice model ready.');
      return true;
    }

    async function toggleMic() {
      try {
        if (sttListening) {
          setMicUI('processing');
          await invoke('plugin:stt|stop_listening');
          return;
        }

        // Microphone permission
        try {
          const perm = await invoke('plugin:stt|check_permission');
          const ok = perm === 'granted' || (perm && perm.microphone === 'granted');
          if (!ok) {
            const r = await invoke('plugin:stt|request_permission');
            const granted = r === 'granted' || (r && r.microphone === 'granted');
            if (!granted) {
              toast('Microphone permission is required for voice input.');
              return;
            }
          }
        } catch (_) {
          // Some builds may not expose permission helpers; continue and let OS prompt
        }

        await ensureModel();
        setMicUI('recording');
        await invoke('plugin:stt|start_listening', {
          config: { language: navigator.language || 'en' }
        });
      } catch (e) {
        setMicUI('idle');
        const msg = (e && e.message) ? e.message : String(e);
        if (/ModelNotInstalled|not installed/i.test(msg)) {
          toast('Voice model missing. Press the mic again to download it.');
        } else {
          toast('Voice input error: ' + msg);
        }
      }
    }

    els.mic.addEventListener('click', toggleMic);

    // Final transcript from Whisper
    await listen('stt://result', (event) => {
      const payload = event.payload || {};
      const text = (payload.transcript || '').trim();
      if (!text) return;
      const cur = els.input.value;
      els.input.value = cur && !/\s$/.test(cur) ? cur + ' ' + text : cur + text;
      autoGrow();
      updateSend();
      setMicUI('idle');
    });

    // State machine
    await listen('plugin:stt:stateChange', (event) => {
      const s = (event.payload && event.payload.state) || event.payload;
      if (s === 'listening') setMicUI('recording');
      else if (s === 'processing') setMicUI('processing');
      else setMicUI('idle');
    });

    // Errors
    await listen('stt://error', (event) => {
      setMicUI('idle');
      const err = event.payload || {};
      if (err.code === 'NO_SPEECH') toast('No speech detected.');
      else if (err.code !== 'ABORTED') toast(err.message || 'Speech recognition error');
    });
    await listen('plugin:stt:error', (event) => {
      setMicUI('idle');
      const err = event.payload || {};
      if (err.code !== 'ABORTED') toast(err.message || 'Speech recognition error');
    });

    // Download progress (first run)
    await listen('stt://download-progress', (event) => {
      const p = event.payload || {};
      if (typeof p.progress === 'number') {
        toast('Downloading model… ' + Math.round(p.progress) + '%');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sttListening) toggleMic();
    });
  }

  initStt();
  
  function setMode() {
    els.main.classList.toggle('empty', msgs().length === 0);
    updateTopMeta();
  }
  function makeConv(opts) {
    return {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: opts.temporary ? 'Temporary chat' : 'New chat',
      messages: [],
      updated: Date.now(),
      temporary: !!opts.temporary
    };
  }
  function ensureConv() {
    if (state.cur) return;
    state.cur = makeConv({ temporary: false });
    state.convs.unshift(state.cur);
  }
  function renderSidebar() {
    const q = els.q.value.trim().toLowerCase();
    els.list.innerHTML = '';
    const items = state.convs
      .filter((c) => (c.messages.length || c.temporary) && (!q || c.title.toLowerCase().includes(q) || (c.temporary && 'temporary'.includes(q))))
      .sort((a, b) => b.updated - a.updated);
    if (!items.length) {
      const n = document.createElement('div'); n.className = 'list-note';
      n.textContent = q ? 'No matching chats' : 'Your chats will appear here'; els.list.appendChild(n); return;
    }
    items.forEach((c) => {
      const row = document.createElement('div');
      row.className = 'conv' + (state.cur && state.cur.id === c.id ? ' active' : '') + (c.temporary ? ' temp' : '');
      row.dataset.id = c.id;

      const b = document.createElement('button');
      b.className = 'conv-main';
      b.textContent = c.title;
      b.title = c.temporary ? (c.title + ' (temporary — not saved)') : c.title;

      const ren = document.createElement('button');
      ren.className = 'conv-ren';
      ren.innerHTML = ICON.pencil;
      ren.setAttribute('aria-label', 'Rename chat: ' + c.title);
      ren.title = 'Rename';
      ren.dataset.ren = '1';

      const d = document.createElement('button');
      d.className = 'conv-del';
      d.textContent = '×';
      d.setAttribute('aria-label', 'Delete chat: ' + c.title);
      d.dataset.del = '1';

      row.append(b, ren, d);
      els.list.appendChild(row);
    });
  }
  function stopIfBusy() { if (state.busy && state.abort) state.abort.abort(); }
  function newChat() {
    stopIfBusy(); state.cur = null; state.pending = []; renderPending();
    els.thread.innerHTML = ''; setMode(); renderSidebar(); closeDrawer(); els.input.focus();
  }
  function newTempChat() {
    stopIfBusy();
    state.cur = makeConv({ temporary: true });
    state.convs.unshift(state.cur);
    state.pending = [];
    renderPending();
    els.thread.innerHTML = '';
    setMode();
    renderSidebar();
    closeDrawer();
    els.input.focus();
    toast('Temporary chat — not saved to history.');
  }
  function openConv(id) {
    const c = state.convs.find((x) => x.id === id); if (!c) return;
    stopIfBusy(); state.cur = c;
    renderThread(); setMode(); renderSidebar(); closeDrawer();
  }
  function deleteConv(id) {
    state.convs = state.convs.filter((c) => c.id !== id);
    if (state.cur && state.cur.id === id) { newChat(); }
    persist(); renderSidebar();
  }
  function renameConv(id, title) {
    const c = state.convs.find((x) => x.id === id); if (!c) return;
    const t = (title || '').trim();
    if (!t || t === c.title) { renderSidebar(); return; }
    c.title = t.length > 80 ? t.slice(0, 80).trim() : t;
    c.updated = Date.now();
    persist();
    renderSidebar();
  }
  function startRename(id) {
    const row = els.list.querySelector('.conv[data-id="' + id + '"]');
    if (!row || row.querySelector('.conv-edit')) return;
    const c = state.convs.find((x) => x.id === id); if (!c) return;

    const main = row.querySelector('.conv-main');
    const ren = row.querySelector('.conv-ren');
    const del = row.querySelector('.conv-del');
    if (main) main.hidden = true;
    if (ren) ren.hidden = true;
    if (del) del.hidden = true;

    const input = document.createElement('input');
    input.className = 'conv-edit';
    input.type = 'text';
    input.value = c.title;
    input.maxLength = 80;
    input.setAttribute('aria-label', 'Rename chat');
    row.insertBefore(input, ren || del || null);
    input.focus();
    input.select();

    let done = false;
    const finish = (save) => {
      if (done) return;
      done = true;
      if (save) renameConv(id, input.value);
      else renderSidebar();
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); finish(true); }
      else if (e.key === 'Escape') { e.preventDefault(); finish(false); }
    });
    input.addEventListener('blur', () => finish(true));
  }

  /* ---------- thread rendering ---------- */
  function addUserEl(m, msgIndex) {
    const w = document.createElement('div'); w.className = 'msg user';
    w.dataset.msgIndex = String(msgIndex);
    const b = document.createElement('div'); b.className = 'bubble';
    const previews = m.previews || [], files = m.files || [];
    const missing = Math.max(0, (m.imageCount || 0) - previews.length);
    if (previews.length || files.length || missing) {
      const row = document.createElement('div'); row.className = 'attach-row';
      previews.forEach((p) => { const im = document.createElement('img'); im.src = p; im.alt = 'Attached image'; row.appendChild(im); });
      files.forEach((f) => { const c = document.createElement('span'); c.className = 'file-chip'; c.textContent = f.name; row.appendChild(c); });
      if (missing) { const c = document.createElement('span'); c.className = 'file-chip'; c.textContent = missing + (missing > 1 ? ' images' : ' image') + ' (not saved)'; row.appendChild(c); }
      b.appendChild(row);
    }
    if (m.content) b.appendChild(document.createTextNode(m.content));
    const actions = document.createElement('div');
    actions.className = 'user-actions';
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'icon-btn';
    editBtn.innerHTML = ICON.pencil;
    editBtn.title = 'Edit message';
    editBtn.setAttribute('aria-label', 'Edit message');
    editBtn.dataset.editMsg = '1';
    actions.appendChild(editBtn);
    w.append(b, actions);
    els.thread.appendChild(w);
  }

  function startEditUserMessage(msgIndex) {
    if (state.busy || !state.cur) return;
    const ms = state.cur.messages;
    if (msgIndex < 0 || msgIndex >= ms.length || ms[msgIndex].role !== 'user') return;
    const m = ms[msgIndex];
    const row = els.thread.querySelector('.msg.user[data-msg-index="' + msgIndex + '"]');
    if (!row || row.querySelector('.msg-edit-wrap')) return;

    row.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'msg-edit-wrap';
    const ta = document.createElement('textarea');
    ta.value = m.content || '';
    ta.setAttribute('aria-label', 'Edit message');
    const actions = document.createElement('div');
    actions.className = 'msg-edit-actions';
    const cancel = document.createElement('button');
    cancel.type = 'button'; cancel.className = 'btn'; cancel.textContent = 'Cancel';
    const save = document.createElement('button');
    save.type = 'button'; save.className = 'btn'; save.textContent = 'Save & regenerate';
    actions.append(cancel, save);
    wrap.append(ta, actions);
    row.appendChild(wrap);
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);

    cancel.onclick = () => { renderThread(); };
    save.onclick = () => {
      const text = ta.value.trim();
      if (!text && !(m.files && m.files.length) && !(m.imageCount)) {
        toast('Message cannot be empty.');
        return;
      }
      m.content = text;
      // Truncate conversation after this user message
      state.cur.messages = ms.slice(0, msgIndex + 1);
      state.cur.updated = Date.now();
      persist();
      renderThread();
      setMode();
      renderSidebar();
      nearBottom = true;
      generate();
    };
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); cancel.click(); }
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); save.click(); }
    });
  }
  function addAssistantEl(m) {
    const w = document.createElement('div'); w.className = 'msg assistant';
    const b = document.createElement('div'); b.className = 'bubble';
    const actions = document.createElement('div'); actions.className = 'actions';
    const meta = document.createElement('span'); meta.className = 'meta';
    w.append(b, actions); els.thread.appendChild(w);
    m.el = { root: w, bubble: b, actions, meta };
  }

  function finishAssistant(m) {
    const a = m.el.actions; a.innerHTML = '';
    if (m.content) {
      const c = document.createElement('button'); c.className = 'icon-btn'; c.innerHTML = ICON.copy; c.title = 'Copy'; c.setAttribute('aria-label', 'Copy reply');
      // Copy rendered reply text only — exclude the Reasoning <details> block
      c.onclick = () => {
        let text = '';
        if (m.el.bubble) {
          const clone = m.el.bubble.cloneNode(true);
          clone.querySelectorAll('details.think').forEach((d) => d.remove());
          text = clone.innerText.trim();
        }
        if (!text) text = m.content || '';
        navigator.clipboard.writeText(text).then(
          () => { c.innerHTML = ICON.check; setTimeout(() => (c.innerHTML = ICON.copy), 1400); },
          () => toast('Copy failed.')
        );
      };
      a.appendChild(c);
    }
    const r = document.createElement('button'); r.className = 'icon-btn regen'; r.innerHTML = ICON.regen; r.title = 'Regenerate'; r.setAttribute('aria-label', 'Regenerate reply');
    r.onclick = regenerate; a.appendChild(r);
    a.appendChild(m.el.meta);
    updateRegen();
  }
  function updateRegen() {
    const all = els.thread.querySelectorAll('.regen');
    all.forEach((b, i) => { b.hidden = i !== all.length - 1; });
  }
  function renderThread() {
    els.thread.innerHTML = '';
    msgs().forEach((m, i) => {
      if (m.role === 'user') addUserEl(m, i);
      else { const r = { content: m.content, thinking: '' }; addAssistantEl(r); paint(r, true); finishAssistant(r); }
    });
    nearBottom = true; els.scroll.scrollTop = els.scroll.scrollHeight;
  }
  let raf = 0, nearBottom = true;
  els.scroll.addEventListener('scroll', () => { nearBottom = els.scroll.scrollHeight - els.scroll.scrollTop - els.scroll.clientHeight < 140; });
  function paint(m, final) {
    cancelAnimationFrame(raf);
    const run = () => {
      // Preserve the user's open/closed choice across re-renders (streaming keeps
      // calling paint and would otherwise reset <details> every frame).
      const prev = m.el.bubble.querySelector('details.think');
      if (prev) m.thinkOpen = prev.open;
      else if (m.thinkOpen === undefined) m.thinkOpen = !m.content; // open while pure thinking

      let html = '';
      if (m.thinking) {
        html += '<details class="think"' + (m.thinkOpen ? ' open' : '') +
                '><summary>Reasoning</summary><div>' + esc(m.thinking) + '</div></details>';
      }
      html += md(m.content || '');
      m.el.bubble.innerHTML = html;
      m.el.bubble.classList.toggle('cursor', !final);

      // Keep m.thinkOpen in sync if the user toggles while we are not painting
      const details = m.el.bubble.querySelector('details.think');
      if (details) {
        details.addEventListener('toggle', () => { m.thinkOpen = details.open; });
      }

      // Syntax-highlight code blocks when highlight.js is available
      if (final && window.hljs) {
        m.el.bubble.querySelectorAll('pre code').forEach((el) => {
          try { window.hljs.highlightElement(el); } catch (_) {}
        });
      }
      if (nearBottom) els.scroll.scrollTop = els.scroll.scrollHeight;
    };
    final ? run() : (raf = requestAnimationFrame(run));
  }
  els.thread.addEventListener('click', (e) => {
    const b = e.target.closest('[data-copy]'); if (!b) return;
    navigator.clipboard.writeText(b.closest('.code').querySelector('code').textContent).then(
      () => { b.textContent = 'Copied'; setTimeout(() => (b.textContent = 'Copy'), 1400); },
      () => toast('Copy failed. Select the text and copy it manually.'));
  });

  /* ---------- sending ---------- */
  function toApi(m) {
    let content = m.content || '';
    if (m.files && m.files.length) content += (content ? '\n\n' : '') + m.files.map((f) => 'File: ' + f.name + '\n```\n' + f.text + '\n```').join('\n\n');
    const o = { role: m.role, content };
    if (m.images && m.images.length) o.images = m.images;
    return o;
  }
  function updateSend() {
    els.send.innerHTML = state.busy ? ICON.stop : ICON.up;
    els.send.setAttribute('aria-label', state.busy ? 'Stop generating' : 'Send message');
    els.send.disabled = !state.busy && !els.input.value.trim() && !state.pending.length;
  }

  function send() {
    if (state.busy) { stopIfBusy(); return; }
    if (typeof stopSttIfListening === 'function') stopSttIfListening();
    const text = els.input.value.trim();
    if (!text && !state.pending.length) return;
    const model = state.model;
    if (!model) { toast('No model selected. Check the connection in Settings.'); return; }
    const imgs = state.pending.filter((a) => a.kind === 'image');
    if (imgs.length && state.vision === false) toast(model + ' can\u2019t read images. Try a vision model like llama3.2-vision, llava, or gemma3.');

    ensureConv();
    const user = {
      role: 'user', content: text,
      images: imgs.map((a) => a.b64), previews: imgs.map((a) => a.preview), imageCount: imgs.length,
      files: state.pending.filter((a) => a.kind === 'text').map((a) => ({ name: a.name, text: a.text }))
    };
    if (!state.cur.messages.length) {
      const t = text || (user.files[0] && user.files[0].name) || (state.cur.temporary ? 'Temporary chat' : 'Image chat');
      state.cur.title = t.length > 48 ? t.slice(0, 48).trim() + '…' : t;
    }
    state.cur.messages.push(user); state.cur.updated = Date.now();
    setMode(); addUserEl(user, state.cur.messages.length - 1); renderSidebar();
    els.input.value = ''; autoGrow(); state.pending = []; renderPending();
    nearBottom = true; generate();
  }

  function regenerate() {
    if (state.busy || !state.cur) return;
    const ms = state.cur.messages;
    if (ms.length && ms[ms.length - 1].role === 'assistant') ms.pop();
    const items = els.thread.querySelectorAll('.msg.assistant');
    if (items.length) items[items.length - 1].remove();
    nearBottom = true; generate();
  }

  async function generate() {
    const conv = state.cur;
    const model = state.model;
    if (!model) { toast('No model selected.'); return; }
    const reply = { content: '', thinking: '' };
    addAssistantEl(reply); paint(reply, false);
    els.scroll.scrollTop = els.scroll.scrollHeight;

    const payload = [];
    const sys = els.system.value.trim();
    if (sys) payload.push({ role: 'system', content: sys });
    conv.messages.forEach((m) => payload.push(toApi(m)));

    state.busy = true; state.abort = new AbortController(); updateSend();
    const t0 = performance.now();
    try {
      const body = {
        model,
        messages: payload,
        stream: true,
        options: { temperature: parseFloat(els.temp.value) || 0.7 }
      };
      if (state.thinking) {
        body.think = state.thinkEnabled;
      }

      const res = await fetch(base() + '/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: state.abort.signal,
        body: JSON.stringify(body)
      });
      if (!res.ok) { let d = ''; try { d = (await res.json()).error || ''; } catch {} throw new Error(d || 'Ollama returned HTTP ' + res.status); }
      const reader = res.body.getReader(), dec = new TextDecoder();
      let buf = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
          if (!line) continue;
          const j = JSON.parse(line);
          if (j.error) throw new Error(j.error);
          if (j.message) { reply.content += j.message.content || ''; reply.thinking += j.message.thinking || ''; }
          if (j.done && j.eval_count && j.eval_duration) {
            reply.el.meta.textContent = (j.eval_count / (j.eval_duration / 1e9)).toFixed(1) + ' tokens/s · ' + ((performance.now() - t0) / 1000).toFixed(1) + 's';
          }
          paint(reply, false);
        }
      }
      paint(reply, true);
    } catch (e) {
      paint(reply, true);
      if (e.name === 'AbortError') reply.el.meta.textContent = 'Stopped';
      else {
        const p = document.createElement('div'); p.className = 'err';
        p.textContent = 'Error: ' + e.message + (e instanceof TypeError ? ' (lost connection to Ollama)' : '');
        reply.el.bubble.appendChild(p);
      }
    } finally {
      if (reply.content) conv.messages.push({ role: 'assistant', content: reply.content });
      conv.updated = Date.now();
      persist();
      renderSidebar();
      finishAssistant(reply);
      state.busy = false; state.abort = null; updateSend();
    }
  }

  /* ---------- wiring ---------- */
  function autoGrow() { els.input.style.height = 'auto'; els.input.style.height = Math.min(els.input.scrollHeight, 240) + 'px'; updateSend(); }
  els.input.addEventListener('input', autoGrow);
  els.input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(); } });
  els.send.addEventListener('click', send);
  els.attach.addEventListener('click', () => els.file.click());
  els.file.addEventListener('change', () => { addFiles(els.file.files); els.file.value = ''; });
  els.input.addEventListener('paste', (e) => {
    const files = Array.from((e.clipboardData && e.clipboardData.files) || []);
    if (files.length) { e.preventDefault(); addFiles(files); }
  });

  const hasFiles = (e) => e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files');
  let dc = 0;
  window.addEventListener('dragenter', (e) => { if (!hasFiles(e)) return; e.preventDefault(); dc++; els.composer.classList.add('drag'); });
  window.addEventListener('dragover', (e) => { if (hasFiles(e)) e.preventDefault(); });
  window.addEventListener('dragleave', (e) => { if (!hasFiles(e)) return; dc = Math.max(0, dc - 1); if (!dc) els.composer.classList.remove('drag'); });
  window.addEventListener('drop', (e) => { if (!hasFiles(e)) return; e.preventDefault(); dc = 0; els.composer.classList.remove('drag'); addFiles(e.dataTransfer.files); });

  $('#chips').addEventListener('click', (e) => {
    const b = e.target.closest('.pill'); if (!b) return;
    if (b.dataset.act === 'attach') els.file.click();
    else { els.input.value = b.dataset.text; autoGrow(); els.input.focus(); els.input.setSelectionRange(els.input.value.length, els.input.value.length); }
  });

  els.list.addEventListener('click', (e) => {
    const row = e.target.closest('.conv'); if (!row) return;
    if (e.target.closest('[data-del]')) { deleteConv(row.dataset.id); return; }
    if (e.target.closest('[data-ren]')) { startRename(row.dataset.id); return; }
    openConv(row.dataset.id);
  });
  els.list.addEventListener('dblclick', (e) => {
    const main = e.target.closest('.conv-main');
    if (!main) return;
    const row = main.closest('.conv');
    if (row) startRename(row.dataset.id);
  });
  els.q.addEventListener('input', renderSidebar);
  $('#newChat').addEventListener('click', newChat);
  $('#newChatTop').addEventListener('click', newChat);
  if ($('#newTempChat')) $('#newTempChat').addEventListener('click', newTempChat);

  els.thread.addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-edit-msg]');
    if (!editBtn) return;
    const row = editBtn.closest('.msg.user');
    if (!row) return;
    const idx = parseInt(row.dataset.msgIndex, 10);
    if (!isNaN(idx)) startEditUserMessage(idx);
  });

  const mobile = () => window.matchMedia('(max-width: 800px)').matches;
  function closeDrawer() { document.body.classList.remove('menu-open'); }
  $('#toggleSide').addEventListener('click', () => {
    if (mobile()) document.body.classList.toggle('menu-open');
    else { const c = document.body.classList.toggle('side-collapsed'); store.set('side', c ? 'collapsed' : 'open'); }
  });
  $('#scrim').addEventListener('click', closeDrawer);

  function renderModels() {
    els.ddLabel.textContent = state.model || 'No model';
    els.ddMenu.innerHTML = '';
    if (!state.models.length) {
      const n = document.createElement('div'); n.className = 'dd-note'; n.textContent = 'No models available'; els.ddMenu.appendChild(n); return;
    }
    state.models.forEach((m) => {
      const it = document.createElement('button'); it.type = 'button'; it.className = 'dd-item';
      it.setAttribute('role', 'option'); it.setAttribute('aria-selected', String(m.name === state.model)); it.dataset.name = m.name;
      const txt = document.createElement('span'); txt.className = 'txt';
      const nm = document.createElement('span'); nm.className = 'name'; nm.textContent = m.name; txt.appendChild(nm);
      const sub = [m.params, m.size ? (m.size / 1e9).toFixed(1) + ' GB' : ''].filter(Boolean).join(' \u00b7 ');
      if (sub) { const sp = document.createElement('span'); sp.className = 'sub'; sp.textContent = sub; txt.appendChild(sp); }
      const tick = document.createElement('span'); tick.className = 'tick'; tick.innerHTML = ICON.check;
      it.append(txt, tick); els.ddMenu.appendChild(it);
    });
  }
  function openDd() {
    if (els.dd.classList.contains('open')) return;
    els.dd.classList.add('open'); els.ddBtn.setAttribute('aria-expanded', 'true');
    const sel = els.ddMenu.querySelector('[aria-selected="true"]') || els.ddMenu.querySelector('.dd-item');
    if (sel) { sel.focus({ preventScroll: true }); sel.scrollIntoView({ block: 'nearest' }); }
  }
  function closeDd(focusBtn) {
    els.dd.classList.remove('open'); els.ddBtn.setAttribute('aria-expanded', 'false');
    if (focusBtn) els.ddBtn.focus();
  }
  els.ddBtn.addEventListener('click', () => (els.dd.classList.contains('open') ? closeDd() : openDd()));
  els.ddBtn.addEventListener('keydown', (e) => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); openDd(); } });
  els.ddMenu.addEventListener('click', (e) => {
    const it = e.target.closest('.dd-item'); if (!it) return;
    state.model = it.dataset.name;
    store.set('model', state.model);
    renderModels(); closeDd(true); checkCapabilities();
  });
  els.ddMenu.addEventListener('keydown', (e) => {
    const items = Array.from(els.ddMenu.querySelectorAll('.dd-item')); if (!items.length) return;
    const i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    else if (e.key === 'Home') { e.preventDefault(); items[0].focus(); }
    else if (e.key === 'End') { e.preventDefault(); items[items.length - 1].focus(); }
    else if (e.key === 'Escape') { e.preventDefault(); closeDd(true); }
    else if (e.key === 'Tab') closeDd();
  });
  document.addEventListener('click', (e) => { if (!els.dd.contains(e.target)) closeDd(); });

  // Think toggle
  if (els.thinkBtn) {
    els.thinkBtn.addEventListener('click', () => {
      state.thinkEnabled = !state.thinkEnabled;
      store.set('think', state.thinkEnabled ? '1' : '0');
      updateThinkBtn();
    });
  }

  $('#openSettings').addEventListener('click', () => els.dlg.showModal());
  $('#closeSettings').addEventListener('click', () => els.dlg.close());
  els.dlg.addEventListener('click', (e) => { if (e.target === els.dlg) els.dlg.close(); });
  els.system.addEventListener('input', () => store.set('system', els.system.value));
  els.temp.addEventListener('input', () => { els.tval.textContent = els.temp.value; store.set('temp', els.temp.value); });
  els.base.addEventListener('change', () => { store.set('base', els.base.value); loadModels(); });
  els.seg.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setTheme(b.dataset.v); });
  els.refresh.addEventListener('click', () => { loadModels(); renderModelManageList(); });
  $('#wipe').addEventListener('click', () => {
    if (!confirm('Delete all saved chats? This can\u2019t be undone.')) return;
    state.convs = state.convs.filter((c) => c.temporary);
    persist(); newChat(); els.dlg.close();
  });

  /* ---------- model management (pull / delete) ---------- */
  function renderModelManageList() {
    if (!els.modelManageList) return;
    els.modelManageList.innerHTML = '';
    if (!state.models.length) {
      const n = document.createElement('div');
      n.className = 'field-hint';
      n.textContent = 'No models installed.';
      els.modelManageList.appendChild(n);
      return;
    }
    state.models.forEach((m) => {
      const row = document.createElement('div');
      row.className = 'model-row';
      const name = document.createElement('span');
      name.className = 'name';
      name.textContent = m.name;
      name.title = m.name;
      const sub = document.createElement('span');
      sub.className = 'sub';
      sub.textContent = m.size ? (m.size / 1e9).toFixed(1) + ' GB' : '';
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'del-model';
      del.textContent = '×';
      del.title = 'Delete ' + m.name;
      del.setAttribute('aria-label', 'Delete ' + m.name);
      del.onclick = () => deleteModel(m.name);
      row.append(name, sub, del);
      els.modelManageList.appendChild(row);
    });
  }

  async function pullModel() {
    const name = (els.pullName && els.pullName.value.trim()) || '';
    if (!name) { toast('Enter a model name to pull.'); return; }
    if (els.pullModel) els.pullModel.disabled = true;
    if (els.pullProgress) {
      els.pullProgress.hidden = false;
      els.pullProgress.textContent = 'Pulling ' + name + '…';
    }
    try {
      const res = await fetch(base() + '/api/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, stream: true })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
          if (!line) continue;
          try {
            const j = JSON.parse(line);
            if (j.error) throw new Error(j.error);
            if (els.pullProgress) {
              if (j.status) {
                let msg = j.status;
                if (j.completed && j.total) {
                  msg += ' · ' + Math.round((j.completed / j.total) * 100) + '%';
                }
                els.pullProgress.textContent = msg;
              }
            }
          } catch (e) {
            if (e.message && !/JSON/.test(e.message)) throw e;
          }
        }
      }
      toast('Pulled ' + name);
      if (els.pullName) els.pullName.value = '';
      await loadModels();
      renderModelManageList();
    } catch (e) {
      toast('Pull failed: ' + (e.message || e));
    } finally {
      if (els.pullModel) els.pullModel.disabled = false;
      if (els.pullProgress) {
        setTimeout(() => { els.pullProgress.hidden = true; }, 2000);
      }
    }
  }

  async function deleteModel(name) {
    if (!confirm('Delete model "' + name + '" from Ollama? This cannot be undone.')) return;
    try {
      const res = await fetch(base() + '/api/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (!res.ok) {
        let d = '';
        try { d = (await res.json()).error || ''; } catch {}
        throw new Error(d || 'HTTP ' + res.status);
      }
      toast('Deleted ' + name);
      if (state.model === name) state.model = '';
      await loadModels();
      renderModelManageList();
    } catch (e) {
      toast('Delete failed: ' + (e.message || e));
    }
  }

  if (els.pullModel) els.pullModel.addEventListener('click', pullModel);
  if (els.pullName) {
    els.pullName.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); pullModel(); }
    });
  }

  /* ---------- export / import chats (JSON) ---------- */
  function exportChats() {
    const chats = state.convs
      .filter((c) => !c.temporary && c.messages && c.messages.length)
      .map((c) => ({
        id: c.id,
        title: c.title,
        updated: c.updated,
        messages: c.messages.map((m) => ({
          role: m.role,
          content: m.content || '',
          files: m.files || [],
          imageCount: m.imageCount || (m.images ? m.images.length : 0)
        }))
      }));

    if (!chats.length) {
      toast('No chats to export.');
      return;
    }

    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      app: 'llamadesk',
      chats
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = 'llamadesk-chats-' + date + '.json';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast('Exported ' + chats.length + (chats.length === 1 ? ' chat.' : ' chats.'));
  }

  function normalizeImportedChat(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const messages = Array.isArray(raw.messages) ? raw.messages : [];
    const cleanMsgs = messages
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof (m.content || '') === 'string')
      .map((m) => ({
        role: m.role,
        content: String(m.content || ''),
        files: Array.isArray(m.files) ? m.files.filter((f) => f && typeof f.name === 'string' && typeof f.text === 'string') : [],
        imageCount: typeof m.imageCount === 'number' ? m.imageCount : 0
      }));
    if (!cleanMsgs.length) return null;

    const id = (typeof raw.id === 'string' && raw.id) ? raw.id : (Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
    let title = (typeof raw.title === 'string' && raw.title.trim()) ? raw.title.trim() : 'Imported chat';
    if (title.length > 80) title = title.slice(0, 80).trim();
    const updated = typeof raw.updated === 'number' ? raw.updated : Date.now();

    return { id, title, updated, temporary: false, messages: cleanMsgs };
  }

  function doImport(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        let list = [];
        if (Array.isArray(data)) list = data;
        else if (data && typeof data === 'object' && Array.isArray(data.chats)) list = data.chats;
        else throw new Error('Invalid file format. Expected a llamaDesk export JSON.');

        const imported = [];
        for (const item of list) {
          const c = normalizeImportedChat(item);
          if (c) imported.push(c);
        }
        if (!imported.length) throw new Error('No valid chats found in the file.');

        const merge = confirm(
          'Found ' + imported.length + (imported.length === 1 ? ' chat' : ' chats') + '.\n\n' +
          'OK = Merge with your existing chats\n' +
          'Cancel = Abort import'
        );
        if (!merge) return;

        let replaced = false;
        if (state.convs.some((c) => c.messages && c.messages.length)) {
          replaced = confirm(
            'Also replace all existing chats?\n\n' +
            'OK = Replace everything with the imported chats\n' +
            'Cancel = Keep existing chats and add the imported ones'
          );
        }

        if (replaced) {
          state.convs = imported;
        } else {
          const existingIds = new Set(state.convs.map((c) => c.id));
          for (const c of imported) {
            if (existingIds.has(c.id)) {
              c.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
            }
            existingIds.add(c.id);
            state.convs.push(c);
          }
        }

        persist();
        state.cur = null;
        newChat();
        renderSidebar();
        els.dlg.close();
        toast(
          (replaced ? 'Replaced with ' : 'Imported ') +
          imported.length +
          (imported.length === 1 ? ' chat.' : ' chats.')
        );
      } catch (e) {
        toast(e.message || 'Could not import file.');
      }
    };
    reader.onerror = () => toast('Could not read the selected file.');
    reader.readAsText(file);
  }

  $('#exportChats').addEventListener('click', exportChats);
  $('#importChats').addEventListener('click', () => $('#importFile').click());
  $('#importFile').addEventListener('change', () => {
    const f = $('#importFile').files && $('#importFile').files[0];
    $('#importFile').value = '';
    if (f) doImport(f);
  });


  /* ---------- auto-updater (GitHub Releases + tauri-plugin-updater) ---------- */
  let pendingUpdate = null;

  function isTauri() {
    return !!(window.__TAURI__ && window.__TAURI__.core);
  }

  async function getAppVersion() {
    try {
      if (window.__TAURI__ && window.__TAURI__.app && window.__TAURI__.app.getVersion) {
        return await window.__TAURI__.app.getVersion();
      }
      // Tauri 2 core path
      if (window.__TAURI__ && window.__TAURI__.core) {
        return await window.__TAURI__.core.invoke('plugin:app|version').catch(() => null)
          || await window.__TAURI__.core.invoke('get_version').catch(() => null);
      }
    } catch (_) {}
    return null;
  }

  async function checkForUpdate(opts) {
    const silent = !!(opts && opts.silent);
    if (!isTauri()) {
      if (!silent && els.updateStatus) els.updateStatus.textContent = 'Updates are only available in the desktop app.';
      if (!silent) toast('Open the desktop app to check for updates.');
      return null;
    }
    if (els.updateStatus && !silent) els.updateStatus.textContent = 'Checking for updates…';
    if (els.checkUpdate) els.checkUpdate.disabled = true;
    try {
      // Prefer plugin JS binding if present, else invoke
      let update = null;
      const inv = window.__TAURI__.core.invoke;
      if (window.__TAURI__.updater && typeof window.__TAURI__.updater.check === 'function') {
        update = await window.__TAURI__.updater.check();
      } else {
        update = await inv('plugin:updater|check');
      }
      if (!update) {
        if (els.updateStatus) els.updateStatus.textContent = 'You are on the latest version.';
        if (!silent) toast('You are on the latest version.');
        return null;
      }
      pendingUpdate = update;
      const ver = update.version || (update.rawJson && update.rawJson.version) || 'new version';
      const notes = update.body || update.notes || '';
      if (els.updateStatus) els.updateStatus.textContent = 'Update ' + ver + ' available.';
      if (els.updateDlgText) {
        els.updateDlgText.textContent = 'Version ' + ver + ' is available. Download and install now? The app will restart after installing.';
      }
      if (els.updateDlgNotes) {
        if (notes) {
          els.updateDlgNotes.hidden = false;
          els.updateDlgNotes.textContent = notes;
        } else {
          els.updateDlgNotes.hidden = true;
          els.updateDlgNotes.textContent = '';
        }
      }
      if (els.updateProgress) els.updateProgress.hidden = true;
      if (els.installUpdate) {
        els.installUpdate.disabled = false;
        els.installUpdate.textContent = 'Download & install';
      }
      if (els.updateDlg && typeof els.updateDlg.showModal === 'function') els.updateDlg.showModal();
      else if (!silent) toast('Update ' + ver + ' available. Open Settings to install.');
      return update;
    } catch (e) {
      const msg = (e && e.message) ? e.message : String(e);
      // Common when no release / no network / missing signing config
      if (els.updateStatus) els.updateStatus.textContent = 'Could not check for updates.';
      if (!silent) toast('Update check failed: ' + msg);
      return null;
    } finally {
      if (els.checkUpdate) els.checkUpdate.disabled = false;
    }
  }

  async function installPendingUpdate() {
    if (!pendingUpdate || !isTauri()) return;
    const inv = window.__TAURI__.core.invoke;
    if (els.installUpdate) {
      els.installUpdate.disabled = true;
      els.installUpdate.textContent = 'Installing…';
    }
    if (els.updateProgress) {
      els.updateProgress.hidden = false;
      els.updateProgress.textContent = 'Downloading update…';
    }
    try {
      // downloadAndInstall on the update object (JS binding) or invoke
      if (typeof pendingUpdate.downloadAndInstall === 'function') {
        await pendingUpdate.downloadAndInstall((event) => {
          if (!els.updateProgress) return;
          const e = event || {};
          if (e.event === 'Started') els.updateProgress.textContent = 'Download started…';
          else if (e.event === 'Progress') {
            const total = e.data && e.data.contentLength;
            const chunk = e.data && e.data.chunkLength;
            if (total) els.updateProgress.textContent = 'Downloading… ' + Math.min(99, Math.round((chunk / total) * 100)) + '%';
            else els.updateProgress.textContent = 'Downloading…';
          } else if (e.event === 'Finished') els.updateProgress.textContent = 'Installing…';
        });
      } else {
        await inv('plugin:updater|download_and_install');
      }
      if (els.updateProgress) els.updateProgress.textContent = 'Restarting…';
      // Relaunch
      if (window.__TAURI__.process && typeof window.__TAURI__.process.relaunch === 'function') {
        await window.__TAURI__.process.relaunch();
      } else {
        await inv('plugin:process|restart');
      }
    } catch (e) {
      const msg = (e && e.message) ? e.message : String(e);
      if (els.updateProgress) els.updateProgress.textContent = 'Update failed.';
      toast('Update failed: ' + msg);
      if (els.installUpdate) {
        els.installUpdate.disabled = false;
        els.installUpdate.textContent = 'Download & install';
      }
    }
  }

  if (els.checkUpdate) els.checkUpdate.addEventListener('click', () => checkForUpdate({ silent: false }));
  if (els.installUpdate) els.installUpdate.addEventListener('click', installPendingUpdate);
  if (els.laterUpdate) els.laterUpdate.addEventListener('click', () => els.updateDlg && els.updateDlg.close());
  if ($('#closeUpdateDlg')) $('#closeUpdateDlg').addEventListener('click', () => els.updateDlg && els.updateDlg.close());
  if (els.updateDlg) els.updateDlg.addEventListener('click', (e) => { if (e.target === els.updateDlg) els.updateDlg.close(); });

  // Show version + silent update check shortly after launch
  (async () => {
    const v = await getAppVersion();
    if (els.appVersion) els.appVersion.textContent = v ? ('v' + v) : '';
    if (isTauri()) {
      setTimeout(() => { checkForUpdate({ silent: true }); }, 4000);
    } else if (els.updateStatus) {
      els.updateStatus.textContent = 'Updates are only available in the desktop app.';
    }
  })();

  setMode(); renderSidebar(); updateSend(); loadModels();
})();
