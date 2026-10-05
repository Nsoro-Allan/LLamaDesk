(() => {
  const $ = (s) => document.querySelector(s);
  const els = {
    main: $('#main'), dd: $('#modelDd'), ddBtn: $('#modelBtn'), ddLabel: $('#modelLabel'), ddMenu: $('#modelMenu'), status: $('#status'), system: $('#system'), temp: $('#temp'), tval: $('#tval'),
    base: $('#base'), refresh: $('#refresh'), thread: $('#thread'), scroll: $('#scroll'), input: $('#input'),
    send: $('#send'), attach: $('#attach'), file: $('#file'), pending: $('#pending'), composer: $('#composer'),
    list: $('#list'), q: $('#q'), banner: $('#banner'), dlg: $('#settings'), seg: $('#themeSeg')
  };
  const ICON = {
    up: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
    stop: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="3"/></svg>',
    copy: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/></svg>',
    check: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    regen: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg>'
  };

  const state = { models: [], model: '', convs: [], cur: null, pending: [], busy: false, abort: null, vision: null };

  /* ---------- storage ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem('llamadesk.' + k); return v === null ? d : v; } catch { return d; } },
    set(k, v) { try { localStorage.setItem('llamadesk.' + k, v); return true; } catch { return false; } }
  };
  function persist() {
    const data = state.convs.map((c) => ({
      id: c.id, title: c.title, updated: c.updated,
      messages: c.messages.map((m) => ({
        role: m.role, content: m.content, files: m.files || [],
        imageCount: m.imageCount || (m.images ? m.images.length : 0)
      }))
    }));
    if (!store.set('convs', JSON.stringify(data))) toast('Couldn\u2019t save chat history. Browser storage may be full or disabled.');
  }
  try { state.convs = JSON.parse(store.get('convs', '[]')); } catch { state.convs = []; }

  els.base.value = store.get('base', 'http://localhost:11434');
  els.system.value = store.get('system', '');
  els.temp.value = store.get('temp', '0.7'); els.tval.textContent = els.temp.value;
  const base = () => els.base.value.trim().replace(/\/+$/, '');

  function applyTheme(t) {
    if (t === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
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

  /* ---------- markdown (escaped, no external libs) ---------- */
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
      blocks.push({ lang, code: code.replace(/\n$/, '') });
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
        out += '<div class="code"><div class="code-head"><span>' + esc(b.lang || 'text') +
               '</span><button type="button" data-copy>Copy</button></div><pre><code>' + esc(b.code) + '</code></pre></div>';
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
        flushPara(); flushList();
      } else { flushList(); para.push(line); }
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
      checkVision();
    } catch {
      state.models = []; state.model = ''; renderModels();
      setStatus('bad', 'Can\u2019t reach Ollama');
      showBanner('Can\u2019t reach Ollama at ' + base() + '. Start it with "ollama serve", or fix the address in Settings.');
    }
  }
  async function checkVision() {
    state.vision = null;
    const model = state.model; if (!model) return;
    try {
      const r = await fetch(base() + '/api/show', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model }) });
      const j = await r.json();
      if (Array.isArray(j.capabilities)) state.vision = j.capabilities.includes('vision');
    } catch {}
  }

  /* ---------- attachments ---------- */
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
  async function addFiles(list) {
    for (const f of Array.from(list)) {
      try {
        if (f.type.startsWith('image/')) {
          const { b64, preview } = await imageToBase64(f);
          state.pending.push({ kind: 'image', name: f.name || 'image', b64, preview });
        } else {
          if (f.size > 400 * 1024) { toast(f.name + ' is over 400 KB. Attach a smaller file or an excerpt.'); continue; }
          const text = await f.text();
          if (text.includes('\u0000')) { toast(f.name + ' isn\u2019t plain text. Convert it first (for PDFs, use pdftotext).'); continue; }
          state.pending.push({ kind: 'text', name: f.name, text });
        }
      } catch (e) { toast(e.message); }
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
  function setMode() { els.main.classList.toggle('empty', msgs().length === 0); }
  function ensureConv() {
    if (state.cur) return;
    state.cur = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), title: 'New chat', messages: [], updated: Date.now() };
    state.convs.unshift(state.cur);
  }
  function renderSidebar() {
    const q = els.q.value.trim().toLowerCase();
    els.list.innerHTML = '';
    const items = state.convs.filter((c) => c.messages.length && (!q || c.title.toLowerCase().includes(q))).sort((a, b) => b.updated - a.updated);
    if (!items.length) {
      const n = document.createElement('div'); n.className = 'list-note';
      n.textContent = q ? 'No matching chats' : 'Your chats will appear here'; els.list.appendChild(n); return;
    }
    items.forEach((c) => {
      const row = document.createElement('div'); row.className = 'conv' + (state.cur && state.cur.id === c.id ? ' active' : ''); row.dataset.id = c.id;
      const b = document.createElement('button'); b.className = 'conv-main'; b.textContent = c.title; b.title = c.title;
      const d = document.createElement('button'); d.className = 'conv-del'; d.textContent = '×'; d.setAttribute('aria-label', 'Delete chat: ' + c.title);
      d.dataset.del = '1';
      row.append(b, d); els.list.appendChild(row);
    });
  }
  function stopIfBusy() { if (state.busy && state.abort) state.abort.abort(); }
  function newChat() {
    stopIfBusy(); state.cur = null; state.pending = []; renderPending();
    els.thread.innerHTML = ''; setMode(); renderSidebar(); closeDrawer(); els.input.focus();
  }
  function openConv(id) {
    const c = state.convs.find((x) => x.id === id); if (!c) return;
    stopIfBusy(); state.cur = c; renderThread(); setMode(); renderSidebar(); closeDrawer();
  }
  function deleteConv(id) {
    state.convs = state.convs.filter((c) => c.id !== id);
    if (state.cur && state.cur.id === id) { newChat(); }
    persist(); renderSidebar();
  }

  /* ---------- thread rendering ---------- */
  function addUserEl(m) {
    const w = document.createElement('div'); w.className = 'msg user';
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
    w.appendChild(b); els.thread.appendChild(w);
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
      c.onclick = () => navigator.clipboard.writeText(m.content).then(() => { c.innerHTML = ICON.check; setTimeout(() => (c.innerHTML = ICON.copy), 1400); }, () => toast('Copy failed.'));
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
    msgs().forEach((m) => {
      if (m.role === 'user') addUserEl(m);
      else { const r = { content: m.content, thinking: '' }; addAssistantEl(r); paint(r, true); finishAssistant(r); }
    });
    nearBottom = true; els.scroll.scrollTop = els.scroll.scrollHeight;
  }
  let raf = 0, nearBottom = true;
  els.scroll.addEventListener('scroll', () => { nearBottom = els.scroll.scrollHeight - els.scroll.scrollTop - els.scroll.clientHeight < 140; });
  function paint(m, final) {
    cancelAnimationFrame(raf);
    const run = () => {
      let html = '';
      if (m.thinking) html += '<details class="think"' + (m.content ? '' : ' open') + '><summary>Reasoning</summary><div>' + esc(m.thinking) + '</div></details>';
      html += md(m.content || '');
      m.el.bubble.innerHTML = html;
      m.el.bubble.classList.toggle('cursor', !final);
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
      const t = text || (user.files[0] && user.files[0].name) || 'Image chat';
      state.cur.title = t.length > 48 ? t.slice(0, 48).trim() + '…' : t;
    }
    state.cur.messages.push(user); state.cur.updated = Date.now();
    setMode(); addUserEl(user); renderSidebar();
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
    const conv = state.cur, model = state.model;
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
      const res = await fetch(base() + '/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: state.abort.signal,
        body: JSON.stringify({ model, messages: payload, stream: true, options: { temperature: parseFloat(els.temp.value) } })
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
      conv.updated = Date.now(); persist(); renderSidebar();
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
    if (e.target.closest('[data-del]')) deleteConv(row.dataset.id); else openConv(row.dataset.id);
  });
  els.q.addEventListener('input', renderSidebar);
  $('#newChat').addEventListener('click', newChat);
  $('#newChatTop').addEventListener('click', newChat);

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
    state.model = it.dataset.name; store.set('model', state.model); renderModels(); closeDd(true); checkVision();
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
  $('#openSettings').addEventListener('click', () => els.dlg.showModal());
  $('#closeSettings').addEventListener('click', () => els.dlg.close());
  els.dlg.addEventListener('click', (e) => { if (e.target === els.dlg) els.dlg.close(); });
  els.system.addEventListener('input', () => store.set('system', els.system.value));
  els.temp.addEventListener('input', () => { els.tval.textContent = els.temp.value; store.set('temp', els.temp.value); });
  els.base.addEventListener('change', () => { store.set('base', els.base.value); loadModels(); });
  els.seg.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setTheme(b.dataset.v); });
  els.refresh.addEventListener('click', loadModels);
  $('#wipe').addEventListener('click', () => {
    if (!confirm('Delete all saved chats? This can\u2019t be undone.')) return;
    state.convs = []; persist(); newChat(); els.dlg.close();
  });

  setMode(); renderSidebar(); updateSend(); loadModels();
})();
