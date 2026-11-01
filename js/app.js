/* 造島工坊：主程式 */
(function () {
  const KEY = 'isleforge.draft.v1';
  const THEME_KEY = 'isleforge.theme';
  const MAX_TOTAL = 200 * 1024 * 1024;
  const MAX_ISLES = 20;
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const form = $('#form');
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  };

  const firstVisit = !store.get(KEY);
  let state = load();
  let files = []; /* { name, size, note, file, folder } —— 只在記憶體；folder＝資料夾名稱（＝島名時自動對應那座島） */
  let step = 0;
  let previewTheme = state.themeAuto ? -1 : 0;   /* -1＝🌅 自動 */
  const open = new Set(); /* 展開「更多」的島嶼 id */

  /* ---------- 存取 ---------- */
  function load() {
    const raw = store.get(KEY);
    if (raw) { try { return normalize(JSON.parse(raw)); } catch (e) { /* 壞掉就用預設 */ } }
    return IF.defaultState();
  }
  function normalize(s) {
    const d = IF.defaultState();
    const out = { ...d, ...s };
    Object.keys(d).forEach(k => { if (out[k] == null) out[k] = d[k]; });
    if (!IF.TYPES[out.type]) out.type = 'course';
    if (!IF.STYLES[out.style]) out.style = 'lowpoly';
    if (!IF.FONTS[out.font]) out.font = 'gothic';
    out.islands = (Array.isArray(s.islands) && s.islands.length ? s.islands : d.islands)
      .slice(0, MAX_ISLES).map(i => {
        const b = IF.blankIsland();
        Object.keys(b).forEach(k => { if (k !== 'id' && i[k] != null) b[k] = String(i[k]); });
        if (i.id) b.id = String(i.id);
        return b;
      });
    out.themes = Array.isArray(s.themes) && s.themes.length === 3
      ? s.themes.map(t => ({ name: String(t.name || '').slice(0, 8), bg: /^#[0-9a-f]{6}$/i.test(t.bg) ? t.bg : '#f6f0e4' }))
      : d.themes;
    ['primary', 'accent'].forEach(k => { if (!/^#[0-9a-f]{6}$/i.test(out[k])) out[k] = d[k]; });
    out.features = Array.isArray(s.features) ? s.features.filter(k => IF.FEATURES[k]) : d.features;
    out.rpg = s.rpg === true;
    out.themeAuto = s.themeAuto !== false;
    out.life = s.life !== false;
    if (!IF.SHAPES[out.shape]) out.shape = d.shape;
    out.detail = IF.DETAIL[out.detail] ? Number(out.detail) : d.detail;
    out.animals = Array.isArray(s.animals) ? s.animals.filter(k => IF.ANIMALS[k]) : d.animals;
    out.extras = Array.isArray(s.extras) ? s.extras.filter(k => IF.EXTRAS[k]) : d.extras;
    if (!IF.CINEMA[out.cinema]) out.cinema = d.cinema;
    const u = s.update;
    out.update = u && u.on && u.base && Array.isArray(u.base.islands)
      ? { on: true, base: u.base, baseVersion: Number(u.baseVersion) || 1, version: Number(u.version) || (Number(u.baseVersion) || 1) + 1,
          history: Array.isArray(u.history) ? u.history : [], notes: String(u.notes || ''), kinds: Array.isArray(u.kinds) ? u.kinds.filter(k => IF.kit.UPDATE_KINDS[k]) : [],
          hasSite: !!u.hasSite, hasDeployLog: !!u.hasDeployLog, fileName: String(u.fileName || '') }
      : null;
    return out;
  }
  let saveTimer;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      $('#saved').textContent = store.set(KEY, JSON.stringify(state))
        ? '✓ 已自動儲存 ' + new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
        : '這個瀏覽器無法自動儲存，請記得下載草稿';
    }, 300);
    refreshPreview();
    updateProgress();
  }

  /* ---------- 小工具 ---------- */
  function toast(msg, action) {
    const t = $('#toast');
    $('#toastText').textContent = msg;
    const btn = $('#toastAction');
    btn.hidden = !action;
    if (action) {
      btn.textContent = action.label;
      btn.onclick = () => { action.run(); t.classList.remove('show'); };
    }
    t.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.classList.remove('show'), Math.max(action ? 6000 : 2800, msg.length * 90));
  }
  function ask(title, text, okLabel) {
    const dlg = $('#confirmDialog');
    $('#confirmTitle').textContent = title;
    $('#confirmText').textContent = text;
    $('#confirmOk').textContent = okLabel || '確定';
    dlg.returnValue = '';
    dlg.showModal();
    return new Promise(res => dlg.addEventListener('close', () => res(dlg.returnValue === 'ok'), { once: true }));
  }
  function el(tag, attrs, text) {
    const e = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (k === 'class') e.className = v; else if (k in e && k !== 'list') e[k] = v; else e.setAttribute(k, v);
    });
    if (text != null) e.textContent = text;
    return e;
  }
  function fmt(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.ceil(n / 1024)) + ' KB'; }
  function namedIslands() { return state.islands.filter(i => i.name.trim()); }

  /* ---------- 網站底色 ---------- */
  function setSiteTheme(name) {
    document.documentElement.dataset.theme = name;
    $$('[data-theme-btn]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.themeBtn === name)));
    document.querySelector('meta[name="theme-color"]').content = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    store.set(THEME_KEY, name);
  }
  $$('[data-theme-btn]').forEach(b => b.addEventListener('click', () => setSiteTheme(b.dataset.themeBtn)));
  const savedTheme = store.get(THEME_KEY);
  setSiteTheme(['cream', 'sea', 'night'].includes(savedTheme) ? savedTheme : 'cream');

  /* ---------- 步驟 ---------- */
  const visited = new Set([0]);
  function stepDone(k) {
    if (!visited.has(k)) return false;
    if (k === 0) return true;
    if (k === 1) return !!(state.title.trim() && state.tagline.trim());
    if (k === 2) return namedIslands().length >= 2;
    if (k === 3) return files.length > 0 || IF.kit.webList(state).length > 0;
    if (k === 4) return true;
    return false;
  }
  function updateProgress() {
    const done = [0, 1, 2, 3, 4].filter(stepDone).length;
    $('#progressBar').style.width = (done / 5 * 100) + '%';
    $$('[data-step]').forEach(b => {
      const k = Number(b.dataset.step);
      b.classList.toggle('done', k !== step && k < 5 && stepDone(k));
    });
  }
  function goStep(n, opts) {
    step = Math.max(0, Math.min(5, n));
    visited.add(step);
    $$('[data-panel]').forEach(p => { p.hidden = Number(p.dataset.panel) !== step; });
    $$('[data-step]').forEach(b => {
      if (Number(b.dataset.step) === step) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    $('#btnPrev').disabled = step === 0;
    $('#btnNext').hidden = step === 5;
    $('#btnNext').textContent = step === 4 ? '最後一步 →' : '下一步 →';
    if (step === 5) renderCheck();
    updateProgress();
    const cur = $(`[data-step="${step}"]`);
    if (cur && cur.scrollIntoView && innerWidth <= 1180) cur.scrollIntoView({ block: 'nearest', inline: 'center' });
    if (!opts || !opts.stay) {
      const top = form.getBoundingClientRect().top;
      if (top < 70 || top > innerHeight * .6) form.scrollIntoView({ block: 'start' });
      form.focus({ preventScroll: true });
    }
  }
  $$('[data-step]').forEach(b => b.addEventListener('click', () => goStep(Number(b.dataset.step))));
  $('#btnPrev').addEventListener('click', () => goStep(step - 1));
  $('#btnNext').addEventListener('click', () => { if (validate(step)) goStep(step + 1); });

  /* 欄位內驗證：只擋必填，其餘放行 */
  function showErr(input, errId, bad) {
    if (input) { input.classList.toggle('invalid', bad); input.setAttribute('aria-invalid', String(bad)); }
    $('#' + errId).hidden = !bad;
  }
  function validate(k) {
    if (k === 1) {
      const t = !state.title.trim(), g = !state.tagline.trim();
      showErr(form.elements.title, 'e-title', t);
      showErr(form.elements.tagline, 'e-tagline', g);
      if (t || g) { (t ? form.elements.title : form.elements.tagline).focus(); return false; }
    }
    if (k === 2) {
      const bad = namedIslands().length < 2;
      $('#e-islands').hidden = !bad;
      if (bad) {
        const empty = $$('.isle-row [data-k="name"]').find(i => !i.value.trim());
        if (empty) { empty.classList.add('invalid'); empty.focus(); }
        return false;
      }
    }
    return true;
  }

  /* ---------- 步驟 1：島型 ---------- */
  function renderTypes() {
    const grid = $('#typeGrid');
    grid.textContent = '';
    Object.entries(IF.TYPES).forEach(([id, t]) => {
      const b = el('button', { type: 'button', class: 'type-card', 'aria-pressed': String(state.type === id) });
      b.dataset.type = id;
      b.innerHTML = IF.ICONS[id];
      b.append(el('strong', null, t.name), el('p', null, t.desc), el('small', null, t.fits));
      b.addEventListener('click', () => {
        if (state.type === id) { goStep(1); return; }
        state.type = id;
        state.features = IF.TYPES[id].defaultFeatures.slice();
        if (state.rpg) addRpgFeatures();
        if (state.life) addLifeFeatures();
        renderTypes(); renderIslands(); renderFeatures(); save();
        toast('已選「' + t.name + '」，功能也換成這個島型的建議組合' + (state.rpg ? '（RPG 模式保持開啟）' : ''));
      });
      grid.appendChild(b);
    });
  }

  /* RPG 模式：疊加在任何島型上 */
  function addRpgFeatures() {
    IF.RPG_FEATURES.forEach(k => { if (!state.features.includes(k)) state.features.push(k); });
  }
  function renderRpg() { $('#rpgToggle').checked = state.rpg; $('#lifeToggle').checked = state.life; }
  /* 生活感模式：居民、交易、天空與海、日夜燈光（預設開啟） */
  function addLifeFeatures() {
    IF.LIFE_FEATURES.forEach(k => { if (!state.features.includes(k)) state.features.push(k); });
  }
  /* 生活感功能只在第一次（或帶入範例、清空、匯入時）自動勾選，之後尊重使用者在步驟 5 取消的項目 */
  function applyLifeOnce(force) {
    if (state.life === undefined) state.life = true;
    if (state.life && (force || !state.lifeInit)) addLifeFeatures();
    state.lifeInit = true;
  }
  $('#lifeToggle').addEventListener('change', e => {
    state.life = e.target.checked;
    if (state.life) addLifeFeatures();
    renderFeatures(); save();
    toast(state.life
      ? '已開啟生活感模式：居民散步與交易、雲和鳥、日夜燈光；右邊預覽點居民試試看'
      : '已關閉生活感模式（已勾選的功能保留，可到步驟 5 調整）');
  });
  $('#rpgToggle').addEventListener('change', e => {
    state.rpg = e.target.checked;
    if (state.rpg) addRpgFeatures();
    renderFeatures(); save();
    toast(state.rpg
      ? '已開啟 RPG 模式：自動勾選探索進度、小測驗、證書、接關碼與小人物散步'
      : '已關閉 RPG 模式（已勾選的功能保留，可到步驟 5 調整）');
  });
  $('#btnCopyUpdate').addEventListener('click', async () => {
    const text = $('#updatePrompt').textContent;
    try { await navigator.clipboard.writeText(text); toast('已複製更新指令！用 AI 打開同一個資料夾貼上'); }
    catch (e) { getSelection().selectAllChildren($('#updatePrompt')); toast('請按 Ctrl + C 複製選取的文字'); }
  });
  $('#btnRpgNews').addEventListener('click', () => {
    goStep(4);
    const t = $('#lookTitle');
    t.scrollIntoView({ block: 'start', behavior: 'smooth' });
    t.classList.add('flash');
    setTimeout(() => t.classList.remove('flash'), 1600);
  });

  /* ---------- 步驟 2：基本欄位 ---------- */
  const simple = ['title', 'slug', 'author', 'contact', 'audience', 'language', 'tagline', 'mascotName', 'mascotDesc', 'centerName', 'ai', 'deploy', 'notes', 'primary', 'accent', 'webSources'];
  function fillSimple() {
    simple.forEach(k => { if (form.elements[k]) form.elements[k].value = state[k] || ''; });
    form.elements.publishMaterials.checked = !!state.publishMaterials;
    form.elements.themeAuto.checked = !!state.themeAuto;
    $('#slugDemo').textContent = IF.kit.slugOf(state);
  }
  simple.forEach(k => {
    const input = form.elements[k];
    if (!input) return;
    const ev = input.tagName === 'SELECT' || input.type === 'color' ? 'input' : 'input';
    input.addEventListener(ev, () => {
      let v = input.value;
      if (k === 'slug') {
        v = v.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-/, '');
        if (v !== input.value) input.value = v;
        $('#slugDemo').textContent = v.replace(/-$/, '') || 'my-island';
      }
      state[k] = v;
      if (k === 'title') showErr(input, 'e-title', false);
      if (k === 'tagline') showErr(input, 'e-tagline', false);
      if (k === 'primary' || k === 'accent') renderSlots();
      if (k === 'ai') renderHowto();
      if (k === 'title' && step === 5) renderCheck();
      save();
    });
  });
  form.elements.slug.addEventListener('blur', () => {
    const v = state.slug.replace(/-+$/, '');
    if (v !== state.slug) { state.slug = v; form.elements.slug.value = v; save(); }
  });
  form.elements.publishMaterials.addEventListener('change', e => { state.publishMaterials = e.target.checked; save(); });
  form.elements.themeAuto.addEventListener('change', e => { state.themeAuto = e.target.checked; previewTheme = state.themeAuto ? -1 : 0; save(); renderSlots(); renderPreviewThemes(); });
  form.addEventListener('submit', e => e.preventDefault());
  /* Enter 在單行欄位不送出，改成跳下一欄 */
  form.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox') {
      e.preventDefault();
      const all = $$('[data-panel]:not([hidden]) input:not([type=checkbox]):not([type=file]):not([type=color]), [data-panel]:not([hidden]) select, [data-panel]:not([hidden]) textarea');
      const i = all.indexOf(e.target);
      if (all[i + 1]) all[i + 1].focus(); else $('#btnNext').focus();
    }
  });

  /* ---------- 步驟 3：島嶼清單 ---------- */
  function renderIslands() {
    const t = IF.TYPES[state.type];
    const box = $('#islandTable');
    box.textContent = '';
    $('#centerHint').textContent = `會放在群島中央，通常當作「${t.centerHint}」。`;
    state.islands.forEach((isle, idx) => box.appendChild(islandRow(isle, idx, t)));
    updateCount();
  }
  function islandRow(isle, idx, t) {
    const row = el('div', { class: 'isle-row' });
    row.dataset.idx = idx;
    row.dataset.id = isle.id;
    const last = state.islands.length - 1;
    row.innerHTML = `
      <div class="side">
        <span class="num" draggable="true" title="拖曳調整順序">${idx + 1}</span>
        <button type="button" data-move="-1" aria-label="第 ${idx + 1} 座往上移" ${idx === 0 ? 'disabled' : ''}>↑</button>
        <button type="button" data-move="1" aria-label="第 ${idx + 1} 座往下移" ${idx === last ? 'disabled' : ''}>↓</button>
      </div>
      <div class="isle-main">
        <label class="mini"><span>${t.rowName} *</span><input data-k="name" maxlength="24"></label>
        <label class="mini"><span>一句介紹</span><input data-k="intro" maxlength="60" placeholder="60 字以內"></label>
        <div class="isle-more" hidden>
          <label class="mini"><span>分類</span><input data-k="group" maxlength="16" placeholder="例：基礎、應用"></label>
          <label class="mini"><span>${t.extraLabel}</span><input data-k="extra" maxlength="60"></label>
          <label class="mini full"><span>內容重點</span><textarea data-k="points" rows="3"></textarea></label>
          <label class="mini"><span>連結（選填）</span><input data-k="link" type="url" placeholder="https://" inputmode="url"></label>
          <label class="mini"><span>對應的上傳檔案</span><select data-k="file"></select></label>
        </div>
      </div>
      <div class="isle-actions">
        <button type="button" class="more" aria-expanded="false">更多</button>
        <button type="button" class="del" aria-label="刪除第 ${idx + 1} 座島">刪除</button>
      </div>`;
    row.querySelector('[data-k="name"]').placeholder = idx === 0 ? '例：' + ({ local: '板橋', expo: '藝術展區', life: '我的書房', treasure: '寫作工具箱', quest: '新手村', science: '風吹出洋流', live: '課程公告', runner: '4 的倍數', empathy: '太吵的早自習', literature: '學習動機', portfolio: '高一熱音社' }[state.type] || '提示詞島') : '';
    row.querySelector('[data-k="points"]').placeholder = t.pointsHolder;
    row.querySelector('[data-k="extra"]').placeholder = t.extraHolder;
    const sel = row.querySelector('[data-k="file"]');
    sel.append(new Option(files.length ? '（無）' : '（先到步驟 4 放檔案）', ''));
    files.forEach(f => sel.append(new Option(f.name, f.name)));
    if (isle.file && !files.some(f => f.name === isle.file)) sel.append(new Option(isle.file + '（需重新放入）', isle.file));
    const autoN = files.filter(f => isle.name.trim() && IF.kit.isleFor(state, f) === isle.name.trim()).length;
    if (autoN) sel.closest('label').append(el('small', { class: 'auto-files' }, `📁 資料夾裡 ${autoN} 個檔案已自動對應`));

    const more = row.querySelector('.isle-more');
    const moreBtn = row.querySelector('.more');
    const filled = () => ['group', 'extra', 'points', 'link', 'file'].some(k => isle[k] && isle[k].trim());
    const setMore = on => {
      more.hidden = !on;
      moreBtn.setAttribute('aria-expanded', String(on));
      moreBtn.innerHTML = on ? '收合' : '更多' + (filled() ? '<span class="dot" title="已填其他欄位"></span>' : '');
      if (on) open.add(isle.id); else open.delete(isle.id);
    };
    setMore(open.has(isle.id));
    moreBtn.addEventListener('click', () => {
      setMore(more.hidden);
      if (!more.hidden) more.querySelector('input').focus();
    });

    row.querySelectorAll('[data-k]').forEach(inp => {
      inp.value = isle[inp.dataset.k] || '';
      inp.addEventListener('input', () => {
        isle[inp.dataset.k] = inp.value;
        if (inp.dataset.k === 'name') {
          inp.classList.remove('invalid');
          updateCount();
          if (namedIslands().length >= 2) $('#e-islands').hidden = true;
        }
        save();
      });
    });
    row.addEventListener('focusin', () => IF.preview.highlight(Number(row.dataset.idx)));
    row.addEventListener('focusout', e => { if (!row.contains(e.relatedTarget)) IF.preview.highlight(-1); });
    row.querySelector('.del').addEventListener('click', () => removeIsland(idx));
    row.querySelectorAll('[data-move]').forEach(b => b.addEventListener('click', () => move(idx, idx + Number(b.dataset.move), b.dataset.move)));
    const handle = row.querySelector('.num');
    handle.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', String(idx)); e.dataTransfer.effectAllowed = 'move'; row.classList.add('dragging'); });
    handle.addEventListener('dragend', () => row.classList.remove('dragging'));
    row.addEventListener('dragover', e => { if (e.dataTransfer.types.includes('text/plain')) { e.preventDefault(); row.classList.add('drop-target'); } });
    row.addEventListener('dragleave', () => row.classList.remove('drop-target'));
    row.addEventListener('drop', e => {
      e.preventDefault();
      row.classList.remove('drop-target');
      const from = Number(e.dataTransfer.getData('text/plain'));
      if (!Number.isNaN(from)) move(from, idx);
    });
    return row;
  }
  function removeIsland(idx) {
    if (state.islands.length <= 1) { toast('至少要保留一座島'); return; }
    const [gone] = state.islands.splice(idx, 1);
    renderIslands(); save();
    toast(`已刪除「${gone.name || '第 ' + (idx + 1) + ' 座'}」`, {
      label: '復原',
      run() { state.islands.splice(idx, 0, gone); renderIslands(); save(); flashRow(idx); }
    });
  }
  function move(from, to, dir) {
    if (to < 0 || to >= state.islands.length || from === to) return;
    const [it] = state.islands.splice(from, 1);
    state.islands.splice(to, 0, it);
    renderIslands(); save();
    flashRow(to);
    const btn = dir && $(`.isle-row[data-idx="${to}"] [data-move="${dir}"]`);
    const target = btn && !btn.disabled ? btn : $(`.isle-row[data-idx="${to}"] [data-k="name"]`);
    if (target) target.focus();
  }
  function flashRow(idx) {
    const r = $(`.isle-row[data-idx="${idx}"]`);
    if (!r) return;
    r.classList.remove('flash'); void r.offsetWidth; r.classList.add('flash');
  }
  function updateCount() {
    const n = namedIslands().length;
    $('#islandCount').textContent = `已命名 ${n} 座（共 ${state.islands.length} 列，上限 ${MAX_ISLES}）`;
    $('#btnAddIsland').disabled = state.islands.length >= MAX_ISLES;
  }
  $('#btnAddIsland').addEventListener('click', () => {
    if (state.islands.length >= MAX_ISLES) return;
    state.islands.push(IF.blankIsland());
    renderIslands(); save();
    const inputs = $$('.isle-row [data-k="name"]');
    inputs[inputs.length - 1].focus();
    inputs[inputs.length - 1].scrollIntoView({ block: 'center', behavior: 'smooth' });
  });
  $('#btnPaste').addEventListener('click', () => {
    const box = $('#pasteBox');
    box.hidden = !box.hidden;
    $('#btnPaste').setAttribute('aria-expanded', String(!box.hidden));
    if (!box.hidden) (tplDone ? $('#lblSheet') : $('#btnTemplate')).focus();
  });
  /* Excel 匯入三步驟：下載過範本後，強調改到「上傳」 */
  let tplDone = false;
  try { tplDone = localStorage.getItem('if-tpl-done') === '1'; } catch (e) {}
  function markTpl() {
    $('#impStep1').classList.toggle('done', tplDone);
    $('#btnTemplate').classList.toggle('primary', !tplDone);
    $('#btnTemplate').textContent = tplDone ? '⬇ 再下載一次範本' : '⬇ 下載 Excel 範本';
    $('#lblSheet').classList.toggle('primary', tplDone);
    $('#impNeedTpl').hidden = tplDone;
  }
  markTpl();
  $('#btnPasteApply').addEventListener('click', () => {
    const text = $('#pasteArea').value.trim();
    if (!text) { toast('請先貼上資料，或改用上面的「選擇 Excel／CSV 檔」'); $('#pasteArea').focus(); return; }
    importRows(parseTable(text));
  });

  /* ---- Excel 匯入：欄位依名稱對應；沒有標題列時用固定順序 ---- */
  const COLS = ['name', 'group', 'intro', 'points', 'link'];
  const COL_NAME = { name: '島名', group: '分類', intro: '一句介紹', points: '內容重點', link: '連結', extra: '' };
  function colOf(h) {
    h = String(h || '').trim();
    if (!h) return null;
    if (/連結|網址|url|link/i.test(h)) return 'link';
    if (/介紹|簡介|描述/.test(h)) return 'intro';
    if (/重點|內容|卡片清單|說明/.test(h)) return 'points';
    if (h === IF.TYPES[state.type].extraLabel || /目標|地標|作品|攤位|角色|參數|圖層|建築|卡片數|怪獸|能力/.test(h)) return 'extra';
    if (/島名|名稱|課名|地區|關卡|展區|觀念|地點|寶箱|島嶼|經歷/.test(h)) return 'name';
    if (/分類|類別|海域|群組|分組/.test(h)) return 'group';
    return null;
  }
  function importRows(rows) {
    rows = rows.map(r => r.map(c => String(c == null ? '' : c))).filter(r => r.some(c => c.trim()));
    if (!rows.length) { toast('檔案裡沒有資料'); return; }
    const head = rows[0].map(colOf);
    const hasHead = head.includes('name') || head.filter(Boolean).length >= 2;
    const map = hasHead ? head : COLS;
    const body = hasHead ? rows.slice(1) : rows;
    if (!map.includes('name')) { toast('找不到「島名」欄位：請先下載範本，照範本的第 1 列欄位名稱填寫'); return; }
    const isDemo = r => /^[（(]\s*範例\s*[）)]/.test(String(r[map.indexOf('name')] || '').trim());
    const demo = body.filter(isDemo).length;
    const add = body.filter(r => !isDemo(r)).map(r => {
      const isle = IF.blankIsland();
      map.forEach((k, c) => { if (k && r[c] != null && !isle[k]) isle[k] = r[c].trim(); });
      isle.name = isle.name.slice(0, 24); isle.group = isle.group.slice(0, 16); isle.intro = isle.intro.slice(0, 60);
      isle.points = isle.points.replace(/[；;]\s*/g, '\n').trim();
      return isle;
    }).filter(i => i.name);
    if (!add.length) { toast(demo ? '檔案裡只有範本的（範例）列：請把它們改成你的島名再上傳' : '沒有讀到任何島名，「島名」欄位不能空白'); return; }
    const before = state.islands.map(i => ({ ...i }));
    const kept = $('#pasteReplace').checked ? [] : state.islands.filter(i => i.name.trim());
    const merged = kept.concat(add);
    const cut = Math.max(0, merged.length - MAX_ISLES);
    state.islands = merged.slice(0, MAX_ISLES);
    $('#pasteArea').value = '';
    $('#pasteBox').hidden = true;
    $('#btnPaste').setAttribute('aria-expanded', 'false');
    renderIslands(); save();
    const got = [...new Set(map.filter(Boolean))].map(k => COL_NAME[k] || IF.TYPES[state.type].extraLabel);
    const miss = COLS.filter(k => !map.includes(k)).map(k => COL_NAME[k]);
    toast(`已匯入 ${add.length - cut} 座島（讀到：${got.join('、')}${miss.length ? '；沒有：' + miss.join('、') : ''}）` + (demo ? `，略過 ${demo} 列範例` : '') + (cut ? `，超過上限捨棄 ${cut} 座` : ''), {
      label: '復原', run() { state.islands = before; renderIslands(); save(); }
    });
  }
  /* SheetJS 只在需要時才載入 */
  let xlsxLoading;
  function loadXlsx() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    xlsxLoading = xlsxLoading || new Promise((res, rej) => {
      const s = el('script', { src: 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js' });
      s.onload = () => res(window.XLSX);
      s.onerror = () => { xlsxLoading = null; rej(new Error('Excel 元件載入失敗，請確認網路')); };
      document.head.appendChild(s);
    });
    return xlsxLoading;
  }
  function templateRows() {
    const t = IF.TYPES[state.type];
    return [['島名', '分類', '一句介紹', '內容重點', '連結', t.extraLabel],
      ['（範例）提示詞島', '基礎', '把需求說清楚，AI 才聽得懂', '角色；任務；格式', '', ''],
      ['（範例）查證燈塔', '素養', 'AI 也會說錯，學會查證', '交叉比對兩個以上來源；標示 AI 協作', 'https://example.com', '']];
  }
  const TPL_GUIDE = [['造島工坊｜島嶼範本填寫說明'], [''],
    ['1. 回到「島嶼清單」工作表，一列一座島，最多 20 座。'],
    ['2. 第 1 列的欄位名稱不要改、不要刪。'],
    ['3. 只有「島名」必填，其他欄位可以留白。'],
    ['4. 「內容重點」有好幾點時，用全形分號「；」隔開。'],
    ['5. 標「（範例）」的列是示範，請改寫或刪掉（沒刪也不會被匯入）。'],
    ['6. 填好按「儲存」，回到造島工坊步驟 3，按「⬆ 上傳填好的 Excel」選這個檔案。']];
  $('#btnTemplate').addEventListener('click', async () => {
    const rows = templateRows();
    const name = '造島工坊_島嶼範本';
    try {
      const X = await loadXlsx();
      const ws = X.utils.aoa_to_sheet(rows);
      ws['!cols'] = [{ wch: 14 }, { wch: 8 }, { wch: 30 }, { wch: 40 }, { wch: 26 }, { wch: 18 }];
      const wb = X.utils.book_new();
      X.utils.book_append_sheet(wb, ws, '島嶼清單');
      const guide = X.utils.aoa_to_sheet(TPL_GUIDE);
      guide['!cols'] = [{ wch: 70 }];
      X.utils.book_append_sheet(wb, guide, '填寫說明');
      X.writeFile(wb, name + '.xlsx');
      tplDone = true; try { localStorage.setItem('if-tpl-done', '1'); } catch (e) {}
      markTpl();
      toast('① 範本已下載到「下載」資料夾。② 用 Excel 打開填寫、存檔 → ③ 回來按「上傳填好的 Excel」');
    } catch (e) {
      /* 載不到 Excel 元件就給 CSV（Excel 也能開） */
      const csv = '﻿' + rows.map(r => r.map(c => /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c).join(',')).join('\r\n');
      const a = el('a', { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: name + '.csv' });
      document.body.appendChild(a); a.click(); a.remove();
      tplDone = true; try { localStorage.setItem('if-tpl-done', '1'); } catch (e2) {}
      markTpl();
      toast('已下載 CSV 範本（Excel 可以直接開）。填好存檔後，回來按「上傳填好的 Excel」');
    }
  });
  $('#lblSheet').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#sheetInput').click(); } });
  $('#sheetInput').addEventListener('change', async e => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      if (/\.csv$/i.test(f.name)) {
        const buf = await f.arrayBuffer();
        let text;
        try { text = new TextDecoder('utf-8', { fatal: true }).decode(buf); }
        catch (err) { text = new TextDecoder('big5').decode(buf); } /* 臺灣 Excel 另存的 CSV 常是 Big5 */
        importRows(parseTable(text.replace(/^﻿/, '').trim()));
      } else {
        toast('讀取 Excel 中…');
        const X = await loadXlsx();
        const wb = X.read(await f.arrayBuffer(), { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        importRows(X.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' }));
      }
    } catch (err) { toast('讀不到這個檔案：' + err.message); }
  });
  function parseTable(text) {
    /* 支援 Excel 的 Tab 分隔與 CSV（含引號內換行） */
    const sep = text.includes('\t') ? '\t' : ',';
    const out = []; let row = []; let cell = ''; let q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (c === '"') q = false;
        else cell += c;
      } else if (c === '"' && cell === '') q = true;
      else if (c === sep) { row.push(cell); cell = ''; }
      else if (c === '\n') { row.push(cell.replace(/\r$/, '')); out.push(row); row = []; cell = ''; }
      else cell += c;
    }
    row.push(cell); out.push(row);
    return out.filter(r => r.some(x => x.trim()));
  }

  /* ---------- 步驟 4：上傳 ---------- */
  const drop = $('#drop');
  const fileInput = $('#fileInput');
  drop.addEventListener('click', () => fileInput.click());
  drop.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('over'); addDropped(e.dataTransfer); });
  fileInput.addEventListener('change', () => { addFiles(fileInput.files); fileInput.value = ''; });
  /* 拖到頁面其他地方也接得住，避免瀏覽器直接開啟檔案 */
  window.addEventListener('dragover', e => { if (e.dataTransfer && e.dataTransfer.types.includes('Files')) e.preventDefault(); });
  window.addEventListener('drop', e => {
    if (e.dataTransfer && e.dataTransfer.files.length && !drop.contains(e.target)) {
      e.preventDefault(); addDropped(e.dataTransfer); if (step !== 3) goStep(3);
    }
  });
  /* 2026-10-30：一座島一個資料夾。可拖資料夾、可放 ZIP；資料夾名稱＝島名（可加編號 01_）就自動對應那座島，「共用」資料夾給全站用 */
  const JUNK = /(^|\/)(__MACOSX|\.DS_Store|Thumbs\.db|desktop\.ini|~\$[^/]*)(\/|$)/i;
  function folderOf(path) {
    const segs = path.split('/').filter(Boolean); segs.pop();
    if (!segs.length) return '';
    /* 由內往外找：最靠近檔案、對得到島名或「共用」的那一層；都對不到就用最內層 */
    for (let k = segs.length - 1; k >= 0; k--) if (IF.kit.isleFor(state, { folder: segs[k] })) return segs[k];
    return segs[segs.length - 1];
  }
  function addFiles(list) { return addItems(Array.from(list).map(f => ({ file: f, path: f.webkitRelativePath || f.name }))); }
  async function addDropped(dt) {
    const entries = Array.from(dt.items || []).map(it => it.webkitGetAsEntry && it.webkitGetAsEntry()).filter(Boolean);
    if (!entries.some(e => e.isDirectory)) return addFiles(dt.files);
    const out = [];
    const readAll = r => new Promise(res => { const acc = []; const more = () => r.readEntries(b => { if (!b.length) res(acc); else { acc.push(...b); more(); } }, () => res(acc)); more(); });
    async function walk(e, base) {
      if (e.isFile) { const f = await new Promise(res => e.file(res, () => res(null))); if (f) out.push({ file: f, path: base + f.name }); }
      else if (e.isDirectory) for (const c of await readAll(e.createReader())) await walk(c, base + e.name + '/');
    }
    for (const e of entries) await walk(e, '');
    return addItems(out);
  }
  async function addItems(items) {
    let added = 0, skipped = 0, empty = 0, zips = 0;
    const flat = [];
    for (const it of items) {
      if (/\.zip$/i.test(it.file.name)) {
        if (!window.JSZip) { toast('壓縮元件載入失敗，請確認網路後重新整理'); return; }
        try {
          const z = await JSZip.loadAsync(it.file); zips++;
          for (const n of Object.keys(z.files)) {
            const zf = z.files[n];
            if (zf.dir || JUNK.test(n)) continue;
            const blob = await zf.async('blob');
            flat.push({ file: new File([blob], n.split('/').pop(), { lastModified: zf.date ? zf.date.getTime() : Date.now() }), path: n });
          }
        } catch (err) { toast('讀不到這個 ZIP：' + it.file.name); }
      } else if (!JUNK.test(it.path)) flat.push(it);
    }
    flat.forEach(({ file: f, path }) => {
      if (!f.size) { empty++; return; }
      const folder = folderOf(path);
      const name = folder ? folder + '/' + f.name : f.name;
      const total = files.reduce((a, b) => a + b.size, 0);
      const dup = files.find(x => x.name === name);
      if (total - (dup ? dup.size : 0) + f.size > MAX_TOTAL) { skipped++; return; }
      if (dup) { dup.file = f; dup.size = f.size; }
      else files.push({ name, size: f.size, note: '', file: f, folder });
      added++;
    });
    renderFiles(); renderIslands(); updateProgress();
    const matched = files.filter(f => IF.kit.isleFor(state, f) && IF.kit.isleFor(state, f) !== '共用').length;
    const msg = [];
    if (zips) msg.push(`已解開 ${zips} 個 ZIP`);
    if (added) msg.push(`已放入 ${added} 個檔案`);
    if (matched) msg.push(`${matched} 個依資料夾自動對應到島`);
    if (skipped) msg.push(`${skipped} 個超過 200 MB 上限沒有加入`);
    if (empty) msg.push(`${empty} 個是空檔，已略過`);
    if (msg.length) toast(msg.join('；'));
  }
  /* 依目前的島名做「資料夾範本」ZIP：00_共用、01_島名…，學員把檔案放進去再整包拖回來 */
  $('#btnFolderTpl') && $('#btnFolderTpl').addEventListener('click', async () => {
    if (!window.JSZip) { toast('壓縮元件載入失敗，請確認網路後重新整理'); return; }
    const named = state.islands.filter(i => i.name.trim());
    if (!named.length) { toast('先到步驟 3 填好島名，再下載資料夾範本'); goStep(2); return; }
    const z = new JSZip();
    const root = z.folder(IF.kit.slugOf(state) + '-資料夾');
    const clean = s => s.trim().replace(/[\\/:*?"<>|]/g, '_');
    root.file('請先看我.txt', ['造島工坊｜資料夾範本', '', '1. 每座島一個資料夾：把那座島要用的講義、簡報、圖片放進「同名」資料夾。',
      '2. 全站都會用到的（課程大綱、學校簡介、題庫）放「00_共用」。', '3. 資料夾名稱不要改（前面的編號可以留著，不影響對應）。',
      '4. 放好後，對整個資料夾按右鍵 →「壓縮成 ZIP 檔」，再把 ZIP 拖回造島工坊步驟 4；也可以直接把資料夾拖進去。', '5. 沒有資料的島，資料夾留空就好。'].join('\r\n'));
    root.folder('00_共用');
    named.forEach((i, n) => root.folder(String(n + 1).padStart(2, '0') + '_' + clean(i.name)));
    const blob = await z.generateAsync({ type: 'blob' });
    const a = el('a', { href: URL.createObjectURL(blob), download: IF.kit.slugOf(state) + '-資料夾範本.zip' });
    document.body.appendChild(a); a.click(); a.remove();
    toast(`已下載資料夾範本（共用＋${named.length} 座島）。放好檔案後壓成 ZIP 拖回這裡`);
  });
  function renderFiles() {
    const ul = $('#fileList');
    ul.textContent = '';
    files.forEach((f, idx) => {
      const ext = (f.name.includes('.') ? f.name.split('.').pop() : 'file').slice(0, 4).toLowerCase();
      const li = el('li');
      li.append(el('span', { class: 'ext' + (/png|jpe?g|gif|webp|svg|heic/.test(ext) ? ' img' : '') }, ext));
      const meta = el('div', { class: 'meta' });
      const used = state.islands.filter(i => i.file === f.name).map(i => i.name || '未命名');
      const auto = IF.kit.isleFor(state, f);
      if (auto && auto !== '共用' && !used.includes(auto)) used.unshift(auto);
      const tag = auto === '共用' ? '・全站共用' : used.length ? '・對應：' + used.join('、') : f.folder ? `・⚠ 資料夾「${f.folder}」對不到島名` : '';
      const small = el('small', null, fmt(f.size) + tag);
      if (f.folder && !auto && !used.length) small.classList.add('warn');
      meta.append(el('b', { title: f.name }, f.name), small);
      const note = el('input', { placeholder: '這是什麼？（例：第一課講義）', maxLength: 80, 'aria-label': f.name + ' 的說明' });
      note.value = f.note;
      note.addEventListener('input', () => { f.note = note.value; });
      meta.append(note);
      const del = el('button', { type: 'button', class: 'del', 'aria-label': '移除 ' + f.name }, '移除');
      del.addEventListener('click', () => {
        const [gone] = files.splice(idx, 1);
        renderFiles(); renderIslands(); updateProgress();
        toast('已移除 ' + gone.name, { label: '復原', run() { files.splice(idx, 0, gone); renderFiles(); renderIslands(); updateProgress(); } });
      });
      li.append(meta, del);
      ul.appendChild(li);
    });
    const total = files.reduce((a, b) => a + b.size, 0);
    $('#fileSize').textContent = files.length
      ? `共 ${files.length} 個檔案，${fmt(total)}／200 MB。放在「島名」資料夾裡的會自動對應那座島；其他檔案可到步驟 3 的「更多」指定。`
      : '還沒有檔案。沒有也可以，AI 會依你填的內容重點撰寫，並標示「示意」。';
  }

  /* ---------- 步驟 5：配色與功能 ---------- */
  function textOn(hex) {
    const n = parseInt(hex.slice(1), 16);
    const l = 0.2126 * (n >> 16) + 0.7152 * (n >> 8 & 255) + 0.0722 * (n & 255);
    return l < 140 ? '#ffffff' : '#2b2620';
  }
  function renderSlots() {
    setTimeout(markAutoSlots, 0);
    const box = $('#themeSlots');
    box.textContent = '';
    state.themes.forEach((t, idx) => {
      const d = el('div', { class: 'slot' + (idx === 0 ? ' default' : '') });
      if (idx === 0) d.append(el('span', { class: 'badge' }, '預設'));
      const sw = el('label', { class: 'sw', title: '按一下換底色' });
      const title = el('span');
      const bar = el('span', { class: 'bar' });
      bar.innerHTML = `<i style="background:${state.primary}"></i><i style="background:${state.accent}"></i>`;
      const pick = el('span', { class: 'pick' }, '換底色');
      const color = el('input', { type: 'color', 'aria-label': `第 ${idx + 1} 組底色` });
      color.value = t.bg;
      sw.append(title, bar, pick, color);
      const paint = () => {
        sw.style.background = t.bg;
        sw.style.color = textOn(t.bg);
        title.textContent = (t.name || '未命名') + '・' + t.bg.toUpperCase();
      };
      const name = el('input', { class: 'name', maxLength: 8, 'aria-label': `第 ${idx + 1} 組名稱`, placeholder: '名稱' });
      name.value = t.name;
      name.addEventListener('input', () => { t.name = name.value; paint(); renderPreviewThemes(); save(); });
      color.addEventListener('input', () => { t.bg = color.value; paint(); renderPreviewThemes(); save(); });
      const moves = el('div', { class: 'slot-moves' });
      [['-1', '← 往前'], ['1', '往後 →']].forEach(([dir, label]) => {
        const b = el('button', { type: 'button', 'aria-label': `第 ${idx + 1} 組${dir === '-1' ? '往前' : '往後'}` }, label);
        b.disabled = (dir === '-1' && idx === 0) || (dir === '1' && idx === 2);
        b.addEventListener('click', () => {
          const to = idx + Number(dir);
          [state.themes[idx], state.themes[to]] = [state.themes[to], state.themes[idx]];
          renderSlots(); renderPreviewThemes(); save();
          const again = $$('.slot')[to].querySelector(`[aria-label$="${dir === '-1' ? '往前' : '往後'}"]`);
          if (again && !again.disabled) again.focus();
        });
        moves.append(b);
      });
      paint();
      d.append(sw, name, moves);
      box.appendChild(d);
    });
  }  /* 底色自動：依亮度標出白天／黃昏／夜晚各用哪一組 */
  function markAutoSlots() {
    const hint = $('#themeAutoHint');
    if (!state.themeAuto) { $$('#themeSlots .auto-tag').forEach(x => x.remove()); return; }
    const [d, k, n] = IF.themeByTime(state.themes);
    const cards = $$('#themeSlots > *');
    cards.forEach((c, idx) => {
      let tag = c.querySelector('.auto-tag');
      if (!tag) { tag = el('span', { class: 'auto-tag' }); c.prepend(tag); }
      tag.textContent = idx === d ? '☀️ 白天' : idx === k ? '🌇 黃昏' : '🌙 夜晚';
    });
    if (hint) hint.textContent = `白天用「${state.themes[d].name}」、黃昏用「${state.themes[k].name}」、夜晚用「${state.themes[n].name}」（依亮度自動排）；訪客手動選了某一組，就照訪客的選擇。`;
  }

  $('#btnRotate').addEventListener('click', () => {
    state.themes.push(state.themes.shift());
    previewTheme = state.themeAuto ? -1 : 0;
    renderSlots(); renderPreviewThemes(); save();
    toast('預設底色換成「' + (state.themes[0].name || '第 1 組') + '」');
  });
  function renderPresets() {
    const box = $('#presets');
    IF.PRESETS.forEach(p => {
      const b = el('button', { type: 'button', class: 'preset' });
      b.innerHTML = '<span>' + p.themes.map(t => `<i style="background:${t[1]}"></i>`).join('') + `<i style="background:${p.primary}"></i><i style="background:${p.accent}"></i></span>`;
      b.append(p.name);
      b.addEventListener('click', () => {
        const before = { themes: state.themes.map(x => ({ ...x })), primary: state.primary, accent: state.accent };
        const apply = s => {
          state.themes = s.themes; state.primary = s.primary; state.accent = s.accent;
          form.elements.primary.value = s.primary; form.elements.accent.value = s.accent;
          previewTheme = state.themeAuto ? -1 : 0; renderSlots(); renderPreviewThemes(); save();
        };
        apply({ themes: p.themes.map(([name, bg]) => ({ name, bg })), primary: p.primary, accent: p.accent });
        toast('已套用「' + p.name + '」', { label: '復原', run() { apply(before); } });
      });
      box.appendChild(b);
    });
  }
  function renderStyles() {
    const box = $('#styleChips');
    box.textContent = '';
    Object.entries(IF.STYLES).forEach(([id, name]) => {
      const b = el('button', { type: 'button', class: 'chip', 'aria-pressed': String(state.style === id) }, name);
      b.addEventListener('click', () => { state.style = id; renderStyles(); save(); box.querySelector('[aria-pressed="true"]').focus(); });
      box.appendChild(b);
    });
  }
  function renderFonts() {
    const box = $('#fontChips');
    box.textContent = '';
    Object.entries(IF.FONTS).forEach(([id, [name, desc]]) => {
      const b = el('button', { type: 'button', class: 'chip', 'aria-pressed': String(state.font === id), title: desc }, name + '・' + desc);
      b.addEventListener('click', () => { state.font = id; IF.loadFont(id); renderFonts(); save(); box.querySelector('[aria-pressed="true"]').focus(); });
      box.appendChild(b);
    });
  }
  function renderFeatures() {
    const box = $('#featureGrid');
    box.textContent = '';
    Object.entries(IF.FEATURES).forEach(([id, [name, desc]]) => {
      const l = el('label', { class: 'check' });
      const c = el('input', { type: 'checkbox' });
      c.checked = state.features.includes(id);
      c.addEventListener('change', () => {
        state.features = c.checked ? state.features.concat(id) : state.features.filter(k => k !== id);
        save();
      });
      const span = el('span');
      span.append(el('b', null, name), el('small', null, desc));
      l.append(c, span);
      box.appendChild(l);
    });
  }

  /* ---------- 島嶼外觀：島形、精緻度、動物、點綴、運鏡 ---------- */
  function chipGroup(box, entries, isOn, toggle) {
    box.textContent = '';
    entries.forEach(([id, label, title]) => {
      const b = el('button', { type: 'button', class: 'chip', 'aria-pressed': String(isOn(id)) }, label);
      if (title) b.title = title;
      b.addEventListener('click', () => { toggle(id); renderLook(); save(); box.querySelector(`[data-id="${id}"]`).focus(); });
      b.dataset.id = id;
      box.appendChild(b);
    });
  }
  function renderLook() {
    const sg = $('#shapeGrid');
    sg.textContent = '';
    Object.entries(IF.SHAPES).forEach(([id, [name, desc]]) => {
      const b = el('button', { type: 'button', class: 'shape-card', 'aria-pressed': String(state.shape === id) });
      b.dataset.id = id;
      b.append(el('b', null, name), el('small', null, desc));
      b.addEventListener('click', () => { state.shape = id; renderLook(); save(); sg.querySelector(`[data-id="${id}"]`).focus(); });
      sg.appendChild(b);
    });
    chipGroup($('#detailScale'), Object.entries(IF.DETAIL).map(([k, [n]]) => [k, '★'.repeat(k) + ' ' + n]), id => String(state.detail) === String(id), id => { state.detail = Number(id); });
    const [dn, dd] = IF.DETAIL[state.detail];
    $('#detailDesc').textContent = `「${dn}」：${dd}`;
    const where = { land: '島上', shore: '岸邊', sea: '海裡', air: '空中' };
    const tog = (key, id) => { state[key] = state[key].includes(id) ? state[key].filter(k => k !== id) : state[key].concat(id); };
    chipGroup($('#animalChips'), Object.entries(IF.ANIMALS).map(([id, [ic, n, w]]) => [id, ic + ' ' + n, '出現在' + where[w]]), id => state.animals.includes(id), id => tog('animals', id));
    chipGroup($('#extraChips'), Object.entries(IF.EXTRAS).map(([id, [n, d]]) => [id, n, d]), id => state.extras.includes(id), id => tog('extras', id));
    chipGroup($('#cinemaChips'), Object.entries(IF.CINEMA).map(([id, [n, d]]) => [id, (({ off: '⏹ ', smooth: '🎥 ', epic: '🎬 ', orbit: '🌀 ', drone: '🚁 ', topdown: '🗺️ ', crane: '🏗️ ' })[id] || '') + n, d]), id => state.cinema === id, id => { state.cinema = id; setTimeout(() => IF.preview.playIntro(), 60); });
    $('#cinemaDesc').textContent = `「${IF.CINEMA[state.cinema][0]}」：${IF.CINEMA[state.cinema][1]}。` + (state.cinema !== 'off' ? '按預覽右上角 🎬 可以重播。' : '');
  }

  /* ---------- 預覽 ---------- */
  function renderPreviewThemes() {
    const box = $('#previewThemes');
    box.textContent = '';
    if (previewTheme > 2 || (previewTheme < 0 && !state.themeAuto)) previewTheme = state.themeAuto ? -1 : 0;
    if (state.themeAuto) {
      const a = el('button', { type: 'button', 'aria-pressed': String(previewTheme < 0), title: '跟著預覽的時段自動換底色' }, '🌅 自動');
      a.addEventListener('click', () => { previewTheme = -1; renderPreviewThemes(); });
      box.appendChild(a);
    }
    state.themes.forEach((t, idx) => {
      const b = el('button', { type: 'button', 'aria-pressed': String(idx === previewTheme), 'data-theme-idx': idx });
      b.innerHTML = `<i style="background:${t.bg}"></i>`;
      b.append(t.name || '主題 ' + (idx + 1));
      b.addEventListener('click', () => { previewTheme = idx; renderPreviewThemes(); });
      box.appendChild(b);
    });
    refreshPreview();
  }
  let previewReady = false;
  function refreshPreview() {
    if (!previewReady) return;
    const list = state.islands.map((i, n) => ({ name: i.name.trim(), row: n, intro: i.intro.trim().slice(0, 60), point: (i.points.split(/\n+/).map(x => x.trim()).filter(Boolean)[0] || '').slice(0, 50) })).filter(i => i.name);
    IF.preview.update({
      title: state.title, center: state.centerName || state.title || '中央島',
      islands: list.length ? list : state.islands.map((_, n) => ({ name: '島嶼 ' + (n + 1), row: n })),
      primary: state.primary, accent: state.accent, bg: state.themes[Math.max(previewTheme, 0)].bg,
      autoBg: previewTheme < 0 && state.themeAuto ? IF.themeByTime(state.themes).map(i => state.themes[i].bg) : null,
      type: state.type, style: state.style, font: state.font, features: state.features.slice().sort(), rpg: state.rpg, life: state.life,
      shape: state.shape, detail: state.detail, animals: state.animals.slice(), extras: state.extras.slice(), cinema: state.cinema
    });
    $('#previewWhat').textContent = `${IF.TYPES[state.type].name}${state.rpg ? '＋RPG' : ''}${state.life ? '＋生活感' : ''}・${IF.SHAPES[state.shape][0].replace(/^\S+\s/, '')}・${IF.DETAIL[state.detail][0]}・${IF.STYLES[state.style]}`;
  }
  IF.preview.onAutoTheme = slot => {
    const idx = IF.themeByTime(state.themes)[slot];
    $$('#previewThemes [data-theme-idx]').forEach(b => b.classList.toggle('auto-on', Number(b.dataset.themeIdx) === idx));
  };
  IF.preview.onPick = idx => {
    const go = () => {
      const r = $(`.isle-row[data-idx="${idx}"]`);
      if (!r) return;
      r.scrollIntoView({ block: 'center', behavior: 'smooth' });
      flashRow(idx);
      r.querySelector('[data-k="name"]').focus({ preventScroll: true });
    };
    if (step !== 2) { goStep(2, { stay: true }); setTimeout(go, 50); } else go();
  };
  $('#btnView').addEventListener('pointerdown', e => e.stopPropagation());
  $('#btnView').addEventListener('click', () => IF.preview.resetView());
  $('#btnCine').addEventListener('pointerdown', e => e.stopPropagation());
  $('#btnCine').addEventListener('click', () => IF.preview.playIntro(true));
  $('#btnPeek').addEventListener('click', () => $('#preview').scrollIntoView({ behavior: 'smooth', block: 'start' }));

  /* ---------- 步驟 6：檢查與下載 ---------- */
  function checks() {
    const list = [];
    const named = namedIslands();
    list.push(state.title.trim() ? ['ok', '網站名稱：' + state.title.trim()] : ['bad', '還沒填網站名稱', 1]);
    list.push(state.tagline.trim() ? ['ok', '一句話介紹已填'] : ['bad', '還沒填一句話介紹', 1]);
    list.push(state.slug ? ['ok', '網址代號：' + IF.kit.slugOf(state)] : ['warn', '沒有英文代號，會先用 my-island', 1]);
    list.push(named.length >= 2 ? ['ok', `島嶼 ${named.length} 座＋中央島「${state.centerName || state.title || '中央島'}」`] : ['bad', '至少要有 2 座有名字的島', 2]);
    const blankRows = state.islands.length - named.length;
    if (blankRows && named.length >= 2) list.push(['warn', `有 ${blankRows} 列沒有島名，打包時會略過`, 2]);
    const noIntro = named.filter(i => !i.intro.trim()).length;
    if (noIntro) list.push(['warn', `${noIntro} 座島沒有一句介紹，AI 會補寫並標示「示意」`, 2]);
    const oldMats = new Set(state.update ? (state.update.base.materials || []).map(m => m.file.replace(/^materials\//, '')) : []);
    const lost = state.islands.filter(i => i.file && !files.some(f => f.name === i.file) && !oldMats.has(i.file)).length;
    if (lost) list.push(['warn', `${lost} 座島對應的檔案要重新放入`, 3]);
    const urls = IF.kit.webList(state);
    const badUrl = state.webSources.split(/\n+/).map(x => x.trim()).filter(x => x && !/^https?:\/\//i.test(x)).length;
    if (files.length) list.push(['ok', `資料檔案 ${files.length} 個`]);
    if (urls.length) list.push(['ok', `AI 會從 ${urls.length} 個公開網址整理資料`]);
    if (badUrl) list.push(['warn', `有 ${badUrl} 行不是 http(s) 網址，會被略過`, 3]);
    if (!files.length && !urls.length) list.push(['warn', '沒有放資料檔案也沒有網址（可以，但內容會比較單薄）', 3]);
    list.push(['ok', '三組底色：' + state.themes.map(t => t.name || '未命名').join('／')]);
    if (state.life) list.push(['ok', '生活感模式：開啟（居民散步、對話與交易、雲與鳥群、日夜循環與夜燈）']);
    if (state.rpg) list.push(['ok', `RPG 模式：開啟（${named.length} 位 NPC、${named.length} 枚島章、中央島最終挑戰）`]);
    list.push(['ok', `島嶼外觀：${IF.SHAPES[state.shape][0]}・精緻度「${IF.DETAIL[state.detail][0]}」・運鏡「${IF.CINEMA[state.cinema][0]}」` + (state.animals.length ? '・動物 ' + state.animals.map(k => IF.ANIMALS[k][0]).join('') : '')]);
    if (state.update) {
      const u = state.update, ch = IF.kit.changesFor(state, files, u.base);
      list.unshift(u.notes.trim() || ch.length ? ['ok', `第 ${u.version} 版更新：表單變更 ${ch.length} 項${u.notes.trim() ? '＋文字說明' : ''}`] : ['bad', '請寫下這次要更新什麼（或在表單裡改資料）', 5]);
      list.push(baseZip ? ['ok', `上一版檔案 ${baseZip.count} 個會一起疊合${baseZip.hasSite ? `（含網站 site/ ${baseZip.siteFiles} 個檔案）` : ''}`]
        : ['warn', '上一版的 zip 沒有在這次開啟後重新放入：更新包只會有新規格，解壓後要覆蓋到原本的資料夾', 5]);
      if (baseZip && !baseZip.hasSite) list.push(['warn', '上一版裡沒有 site/：下載後請解壓覆蓋到 AI 做好網站的那個資料夾']);
    }
    return list;
  }
  function renderCheck() {
    const card = $('#checkCard');
    const list = checks();
    card.textContent = '';
    card.append(el('h3', null, '打包前檢查'));
    const ul = el('ul');
    list.forEach(([lvl, text, go]) => {
      const li = el('li', { class: lvl });
      li.append(el('span', null, text));
      if (go != null && lvl !== 'ok') {
        const b = el('button', { type: 'button' }, go === 5 ? (baseZip || lvl === 'bad' ? '去填寫' : '重新放入') : '去修改');
        b.addEventListener('click', () => { if (go === 5) { if (lvl === 'bad') $('#f-updNotes').focus(); else openUpdate(); } else goStep(go); });
        li.append(b);
      }
      ul.append(li);
    });
    card.append(ul);
    const blocked = list.some(x => x[0] === 'bad');
    $('#btnDownload').disabled = blocked;
    $('#btnDownload').title = blocked ? '請先完成標示 ✕ 的項目' : '';
    $('#promptBox').textContent = curPrompt();
    renderUpdBox();
    renderHowto();
  }
  function curPrompt() { return state.update ? IF.kit.updatePrompt(state) : IF.kit.prompt(state); }
  function zipName() { return IF.kit.slugOf(state) + '-islekit' + (state.update ? '-v' + state.update.version : '') + '.zip'; }
  function renderHowto() {
    const ol = $('#howto');
    ol.textContent = '';
    const name = zipName();
    if (state.update) {
      const u = state.update;
      ol.append(el('li', null, `到「下載」資料夾找到 ${name}，按右鍵「全部解壓縮」。`));
      ol.append(el('li', null, u.hasSite ? '解壓出來的資料夾已經包含原本的網站（site/）和部署紀錄，直接用 AI 打開這個資料夾。'
        : '把解壓出來的檔案複製到原本 AI 做好網站的那個資料夾，選「取代」（site/ 不會被刪），再用 AI 打開那個資料夾。'));
      IF.AI_HOWTO[state.ai].slice(1).forEach(s => { const li = el('li'); li.innerHTML = s.replace('下面那段指令', '下面的「第 ' + u.version + ' 版更新指令」'); ol.append(li); });
      ol.append(el('li', null, 'AI 會先列出要改的地方給你確認，改完測試，再問你要不要更新到原本同一個網址。'));
      return;
    }
    ol.append(el('li', null, `到「下載」資料夾找到 ${name}，按右鍵「全部解壓縮」。`));
    IF.AI_HOWTO[state.ai].forEach(s => { const li = el('li'); li.innerHTML = s; ol.append(li); });
    ol.append(el('li', null, 'AI 讀完資料若覺得不夠，會先列幾個問題問你（附建議答案），照著回答，或回「你決定」就好。'));
    ol.append(el('li', null, '接著 AI 會給規劃表、動手蓋島、在電腦上測試，最後問你要放到哪個網站。'));
  }
  $('#btnDownload').addEventListener('click', async () => {
    if (checks().some(x => x[0] === 'bad')) { renderCheck(); toast('還有必填項目沒完成'); return; }
    if (!window.JSZip) { toast('壓縮元件載入失敗，請確認網路後重新整理'); return; }
    const btn = $('#btnDownload');
    const html = btn.innerHTML;
    btn.disabled = true; btn.textContent = '打包中…';
    try {
      const blob = state.update ? (await IF.kit.buildUpdate(state, files, baseZip || { project: state.update.base, zip: null, prefix: '', rootName: '', changelog: '' })).blob
        : await IF.kit.build(state, files);
      const a = el('a', { href: URL.createObjectURL(blob), download: zipName() });
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      const ok = $('#success');
      ok.hidden = false;
      ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
      ok.focus({ preventScroll: true });
      toast(state.update ? `第 ${state.update.version} 版更新包已下載（${fmt(blob.size)}）` : `造島包已下載（${fmt(blob.size)}）`);
    } catch (e) {
      toast('打包失敗：' + e.message);
    } finally {
      btn.disabled = false; btn.innerHTML = html;
    }
  });
  $('#btnCopyPrompt').addEventListener('click', async () => {
    const text = curPrompt();
    try { await navigator.clipboard.writeText(text); toast('已複製！下載解壓後，貼給你的 AI'); }
    catch (e) {
      const r = document.createRange(); r.selectNodeContents($('#promptBox'));
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
      toast('已選取文字，請按 Ctrl+C 複製');
    }
  });

  /* ---------- 草稿與首屏 ---------- */
  const closeMenu = () => document.querySelector('.menu').removeAttribute('open');
  document.addEventListener('click', e => { if (!e.target.closest('.menu')) closeMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  async function useExample() {
    closeMenu();
    if (namedIslands().length && !(await ask('換成範例資料？', '目前填的內容會被範例取代。建議先用「草稿 → 下載草稿」備份。', '換成範例'))) return;
    state = IF.EXAMPLE(); applyLifeOnce(true); open.clear(); renderAll(); save();
    goStep(2);
    toast('已填入範例，可以直接改');
  }
  $('#btnExample').addEventListener('click', useExample);
  $('#btnTryExample').addEventListener('click', useExample);
  $('#btnStart').addEventListener('click', () => goStep(0));
  $('#btnSaveDraft').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ isleforgeDraft: state }, null, 2)], { type: 'application/json' });
    const a = el('a', { href: URL.createObjectURL(blob), download: IF.kit.slugOf(state) + '-draft.json' });
    document.body.appendChild(a); a.click(); a.remove();
    closeMenu(); toast('草稿已下載（不含檔案）');
  });
  $('.as-btn').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#importDraft').click(); } });
  $('#importDraft').addEventListener('change', async e => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      state = normalize(data.isleforgeDraft || fromProject(data));
      applyLifeOnce(!data.isleforgeDraft);
      open.clear(); renderAll(); save(); closeMenu(); goStep(1);
      toast('草稿已匯入：' + (state.title || '未命名'));
    } catch (err) { toast('讀不到這個檔案，請選造島工坊的草稿或 project.json'); }
  });
  /* 造島包裡的 project.json 也可以匯回來 */
  function fromProject(p) {
    if (!p.site || !Array.isArray(p.islands)) throw new Error('格式不符');
    const base = ['order', 'id', 'name', 'group', 'intro', 'points', 'link', 'material'];
    const extraKey = 'extra' in (p.islands[0] || {}) ? 'extra' : Object.keys(p.islands[0] || {}).find(k => !base.includes(k));
    const center = typeof p.centerIsland === 'object' && p.centerIsland ? p.centerIsland.name : p.centerIsland;
    const th = p.theme || {};
    return {
      type: p.islandType && p.islandType.id, title: p.site.title, slug: p.site.slug, tagline: p.site.tagline,
      author: p.site.author, contact: p.site.contact, audience: p.site.audience, language: p.site.language,
      mascotName: p.site.mascot && p.site.mascot.name, mascotDesc: p.site.mascot && p.site.mascot.description,
      centerName: center === p.site.title ? '' : center,
      islands: p.islands.map(i => ({ name: i.name, group: i.group, intro: i.intro, points: (i.points || []).join('\n'), link: i.link, extra: extraKey ? i[extraKey] || '' : '', file: (i.material || '').replace(/^materials\//, '') })),
      themes: th.backgrounds && th.backgrounds.map(b => ({ name: b.name, bg: b.background })),
      primary: th.primary, accent: th.accent, themeAuto: th.autoByTime ? !!th.autoByTime.enabled : false,
      style: Object.keys(IF.STYLES).find(k => IF.STYLES[k] === th.style),
      font: Object.keys(IF.FONTS).find(k => IF.FONTS[k][0] === th.font),
      features: (p.features || []).map(f => f.id), publishMaterials: p.publishMaterials,
      rpg: !!(p.rpgMode && p.rpgMode.enabled),
      life: !!(p.livingWorld && p.livingWorld.enabled),
      shape: p.look && p.look.shape && p.look.shape.id, detail: p.look && p.look.detail && p.look.detail.level,
      animals: p.look && (p.look.animals || []).map(a => a.id), extras: p.look && (p.look.extras || []).map(a => a.id),
      cinema: p.look && p.look.cinema && p.look.cinema.id,
      ai: Object.keys(IF.AI_HOWTO).find(k => ({ claude: 'Claude Code', codex: 'Codex', gemini: 'Gemini CLI', antigravity: 'Antigravity', cursor: 'Cursor' }[k]) === p.ai),
      deploy: p.deploy && p.deploy.preferred, notes: p.notes,
      webSources: (p.webSources || []).join('\n')
    };
  }
  $('#btnReset').addEventListener('click', async () => {
    closeMenu();
    if (!(await ask('全部清空？', '所有填寫的內容和放入的檔案都會清除，無法復原。', '全部清空'))) return;
    state = IF.defaultState(); applyLifeOnce(true); files = []; open.clear(); baseZip = null;
    renderAll(); save(); goStep(0); toast('已清空，可以重新開始');
  });
  $('#btnHelp').addEventListener('click', () => $('#helpDialog').showModal());
  /* 教學影片：跳過去就播放，方便第一次來的人 */
  function goTutorial() {
    const sec = $('#tutorial');
    sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    sec.focus({ preventScroll: true });
    const vid = $('#tutVideo');
    setTimeout(() => { const p = vid.play(); if (p && p.catch) p.catch(() => {}); }, 600);
  }
  ['#lnkTutorial', '#btnWatch'].forEach(s => $(s).addEventListener('click', e => { e.preventDefault(); goTutorial(); }));
  $('#helpDialog').addEventListener('close', () => {
    const v = $('#helpDialog').returnValue;
    if (v === 'example') useExample();
    if (v === 'video') goTutorial();
  });

  /* ---------- 更新模式：上一版 → 第 N 版更新包 ---------- */
  let baseZip = null;   /* 上一版 zip（只在記憶體，不存進 localStorage） */
  let pending = null;
  const updDlg = $('#updateDialog');
  function openUpdate() {
    closeMenu();
    pending = null;
    $('#updInfo').hidden = true; $('#updGo').disabled = true; $('#updFile').value = '';
    updDlg.showModal();
  }
  async function readUpdateFile(f) {
    if (!f) return;
    const info = $('#updInfo');
    info.hidden = false; info.innerHTML = '<p>讀取中…</p>'; $('#updGo').disabled = true;
    if (f.size > MAX_TOTAL) { info.innerHTML = '<ul><li class="bad">檔案超過 200 MB。請刪掉資料夾裡的 node_modules、影片等大檔再壓縮。</li></ul>'; return; }
    if (!window.JSZip) { info.innerHTML = '<ul><li class="bad">壓縮元件載入失敗，請確認網路後重新整理。</li></ul>'; return; }
    try {
      const b = await IF.kit.readBase(f);
      const p = b.project, ver = (p.release && Number(p.release.version)) || 1;
      pending = { ...b, fileName: f.name, version: ver };
      info.innerHTML = '';
      info.append(el('h3', null, `讀到：${p.site.title || '未命名'}（目前第 ${ver} 版）`));
      const ul = el('ul');
      ul.append(el('li', { class: 'ok' }, `島嶼 ${p.islands.length} 座：${p.islands.slice(0, 6).map(i => i.name).join('、')}${p.islands.length > 6 ? '…' : ''}`));
      ul.append(el('li', { class: b.zip ? 'ok' : 'warn' }, b.zip ? `上一版檔案 ${b.count} 個，會全部疊合到新版` : '只有 project.json：更新包要解壓覆蓋到原本的資料夾'));
      if (b.zip) ul.append(el('li', { class: b.hasSite ? 'ok' : 'warn' }, b.hasSite ? `含 AI 做好的網站 site/（${b.siteFiles} 個檔案）` : '沒有 site/（這是原始造島包）：下載後要解壓覆蓋到原本的資料夾'));
      if (b.zip) ul.append(el('li', { class: b.hasDeployLog ? 'ok' : 'warn' }, b.hasDeployLog ? '含 部署紀錄.md：AI 會更新到原本同一個網址' : '沒有 部署紀錄.md：AI 會問你原本的網址與平台'));
      ul.append(el('li', { class: 'ok' }, `下一步：在表單裡修改，做成第 ${ver + 1} 版`));
      info.append(ul);
      $('#updGo').disabled = false;
      $('#updGo').focus();
    } catch (err) {
      pending = null;
      info.innerHTML = '';
      const ul = el('ul'); ul.append(el('li', { class: 'bad' }, '讀不到：' + err.message)); info.append(ul);
    }
  }
  $('#updFile').addEventListener('change', e => readUpdateFile(e.target.files[0]));
  const updDrop = $('#updDrop');
  ['dragenter', 'dragover'].forEach(t => updDrop.addEventListener(t, e => { e.preventDefault(); updDrop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(t => updDrop.addEventListener(t, e => { e.preventDefault(); updDrop.classList.remove('over'); }));
  updDrop.addEventListener('drop', e => readUpdateFile(e.dataTransfer.files[0]));
  $('#updCancel').addEventListener('click', () => updDlg.close());
  $('#updGo').addEventListener('click', () => {
    if (!pending) return;
    const b = pending, p = b.project;
    /* 同一份上一版重新放入（重新整理後）：保留已改的表單，只補回檔案 */
    const same = state.update && JSON.stringify(state.update.base) === JSON.stringify(p);
    if (!same) {
      state = normalize(fromProject(p));
      state.lifeInit = true;
      files = []; open.clear();
      state.update = { on: true, base: p, baseVersion: b.version, version: b.version + 1, history: (p.release && p.release.history) || [{ version: 1, date: '', summary: '第一版' }],
        notes: '', kinds: [], hasSite: b.hasSite, hasDeployLog: b.hasDeployLog, fileName: b.fileName };
    } else Object.assign(state.update, { hasSite: b.hasSite, hasDeployLog: b.hasDeployLog, fileName: b.fileName });
    baseZip = b.zip ? b : null;
    updDlg.close();
    renderAll(); save();
    goStep(same ? 5 : 2);
    toast(same ? '已重新放入上一版檔案' : `已載入第 ${b.version} 版，改好後到步驟 6 下載第 ${b.version + 1} 版`);
  });
  ['#btnUpdateHero', '#btnUpdateMenu'].forEach(sel => $(sel).addEventListener('click', openUpdate));
  async function leaveUpdate() {
    if (!(await ask('結束更新模式？', '表單會保留目前的資料，但之後下載的會是一般的第 1 版造島包。', '結束更新'))) return;
    state.update = null; baseZip = null; renderAll(); save(); toast('已回到一般造島模式');
  }
  function renderUpdate() {
    const u = state.update, ban = $('#updBanner');
    ban.hidden = !u;
    $('#updBox').hidden = !u;
    document.body.classList.toggle('upd-mode', !!u);
    const dl = $('#btnDownload');
    dl.lastChild.textContent = u ? ` 下載第 ${u.version} 版更新包` : ' 下載造島包';
    $('#after h3').textContent = u ? `給 AI 的第 ${u.version} 版更新指令（整段貼上）` : '給 AI 的指令（整段貼上）';
    if (!u) return;
    ban.innerHTML = '';
    ban.append(el('b', null, `🔄 更新模式：「${state.title || '未命名'}」第 ${u.baseVersion} 版 → 第 ${u.version} 版`));
    ban.append(el('span', null, baseZip ? `已疊合上一版 ${baseZip.count} 個檔案` : '上一版檔案需要重新放入（重新整理後只保留規格）'));
    const acts = el('span', { class: 'acts' });
    const go = el('button', { type: 'button', class: 'btn small' }, '寫更新需求 →'); go.addEventListener('click', () => { goStep(5); setTimeout(() => $('#f-updNotes').focus(), 80); });
    const re = el('button', { type: 'button', class: 'btn small ghost' }, baseZip ? '換一份上一版' : '重新放入上一版'); re.addEventListener('click', openUpdate);
    const x = el('button', { type: 'button', class: 'btn small ghost' }, '結束更新'); x.addEventListener('click', leaveUpdate);
    acts.append(go, re, x);
    ban.append(acts);
    $('#f-updNotes').value = u.notes;
    renderUpdBox();
  }
  function renderUpdBox() {
    const u = state.update;
    if (!u) return;
    $('#updBoxTitle').textContent = `這次要更新什麼？（第 ${u.version} 版）`;
    chipGroup($('#updKinds'), Object.entries(IF.kit.UPDATE_KINDS).map(([k, n]) => [k, n]), id => u.kinds.includes(id),
      id => { u.kinds = u.kinds.includes(id) ? u.kinds.filter(k => k !== id) : u.kinds.concat(id); setTimeout(renderUpdBox, 0); });
    const ch = IF.kit.changesFor(state, files, u.base);
    const box = $('#updDiff');
    box.textContent = '';
    box.append(el('h4', null, `造島工坊自動比對出的變更（${ch.length} 項）`));
    if (ch.length) { const ol = el('ol'); ch.slice(0, 30).forEach(c => ol.append(el('li', null, c))); if (ch.length > 30) ol.append(el('li', null, `…還有 ${ch.length - 30} 項`)); box.append(ol); }
    else box.append(el('p', { class: 'hint' }, '表單資料還沒有變動。可以回到步驟 3 加島、步驟 5 加動物或換外觀；只改小地方的話，直接寫在上面的更新說明就好。'));
  }
  $('#f-updNotes').addEventListener('input', e => {
    if (!state.update) return;
    state.update.notes = e.target.value;
    save();
    clearTimeout(renderUpdBox.t);
    renderUpdBox.t = setTimeout(() => { if (step === 5) renderCheck(); }, 400);
  });

  function renderAll() {
    /* 帶入草稿或範例時，已有資料的步驟視為走過 */
    if (state.title.trim()) visited.add(1);
    if (namedIslands().length >= 2) visited.add(2);
    IF.loadFont(state.font);
    fillSimple(); renderTypes(); renderRpg(); renderIslands(); renderFiles(); renderSlots(); renderStyles(); renderFonts(); renderLook(); renderFeatures(); renderPreviewThemes(); renderUpdate();
    $('#success').hidden = true;
    goStep(step, { stay: true });
  }

  renderPresets();
  applyLifeOnce();
  previewReady = IF.preview.init();
  renderAll();
  if (firstVisit) setTimeout(() => $('#helpDialog').showModal(), 500);
})();
