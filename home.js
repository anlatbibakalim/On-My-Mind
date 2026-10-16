/* ============================================================
   Aklımda v3.7 - Cam teması: komuta paneli ve karşılama turu
   app.js'ten sonra yüklenir; app.js yoksa ya da bu dosya yüklenmezse
   uygulama eskisi gibi çalışır (AklimdaHome varsa çağrılır).
   ============================================================ */
(function () {
    'use strict';
    const TOUR_KEY = 'aklimda_tour_v1';
    const g = (typeof window !== 'undefined') ? window : globalThis;
    const $q = (s, r) => (r || document).querySelector(s);
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const num = n => Number(n || 0).toLocaleString('tr-TR');
    let homeEl = null, timer = null, quoteIdx = 0;

    const QUOTES = [
        'Hey Aklımda, yarın sabah 9\'da toplantım var.',
        'Hey Aklımda, bu ay ödemelerim ne kadar?',
        'Hey Aklımda, annemin doğum gününe kaç gün kaldı?',
        'Hey Aklımda, ekteki PDF\'i özetle.',
        'Hey Aklımda, Karar Odası\'nı topla.'
    ];

    /* ---------- Veri ---------- */
    function upcoming() {
        try { return events.map(infoFor).filter(i => !i.done && i.days >= 0).sort((a, b) => a.days - b.days); } catch (e) { return []; }
    }
    function last7() {
        const out = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const key = toISOLocal(d);
            const v = i === 0 ? stepState.count : Number(stepHistory[key]) || 0;
            out.push({ key: key, v: v, label: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'][d.getDay()] });
        }
        return out;
    }
    function metrics() {
        const up = upcoming();
        const week = up.filter(i => i.days <= 7).length;
        const today = up.filter(i => i.days === 0).length;
        const steps = last7();
        const goal = (settings && settings.stepGoal) || 8000;
        return { up: up, week: week, today: today, steps: steps, goal: goal, next: up[0] || null, total: events.length };
    }

    /* ---------- Küçük çizim yardımcıları ---------- */
    function spark(vals, w, h, cls) {
        const max = Math.max.apply(null, vals.concat([1]));
        const step = vals.length > 1 ? w / (vals.length - 1) : w;
        const pts = vals.map((v, i) => (i * step).toFixed(1) + ',' + (h - 3 - (v / max) * (h - 8)).toFixed(1));
        const area = '0,' + h + ' ' + pts.join(' ') + ' ' + w + ',' + h;
        return '<svg class="spark ' + (cls || '') + '" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true"><polygon class="spark-area" points="' + area + '"/><polyline class="spark-line" points="' + pts.join(' ') + '"/></svg>';
    }
    function bars(vals, h) {
        const max = Math.max.apply(null, vals.concat([1]));
        return '<div class="mini-bars" style="height:' + h + 'px" aria-hidden="true">' + vals.map(v => '<i style="height:' + Math.max(6, Math.round(v / max * 100)) + '%"></i>').join('') + '</div>';
    }
    function wave() {
        let s = '';
        for (let i = 0; i < 28; i++) s += '<i style="--i:' + i + ';--h:' + (18 + Math.round(Math.abs(Math.sin(i * 0.55)) * 62)) + '%"></i>';
        return '<div class="h-wave" aria-hidden="true">' + s + '</div>';
    }

    /* ---------- Komuta paneli + alt çubuk ---------- */
    const TAB_KEY = 'aklimda_hometab';
    const BAR = [
        { id: 'soon', label: 'Yaklaşanlar', icon: 'fa-calendar-day' },
        { id: 'well', label: 'Sağlık', icon: 'fa-heart-pulse' },
        { id: 'quick', label: 'Hızlı Erişim', icon: 'fa-bolt' },
        { id: 'msg', label: 'Mesaj', icon: 'fa-envelope' },
        { id: 'doc', label: 'Belge', icon: 'fa-file-lines' }
    ];
    const SHEET_TITLES = { soon: 'Yaklaşanlar', well: 'Sağlık Özeti', quick: 'Hızlı Erişim', msg: 'Mesaj ve E-posta', doc: 'Belge ve Görsel' };
    const ROWS = {
        quick: [
            ['panel:agenda', 'fa-calendar-days', 'Takvim', 'Güne dokun, o günü sesli anlatayım'],
            ['view:records', 'fa-list-check', 'Tüm Kayıtlar', 'Arama, filtre ve liste'],
            ['panel:news', 'fa-globe', 'Haberler', 'Güncel başlıklar'],
            ['calc', 'fa-calculator', 'Hesap Makinesi', 'Formüller, yüzde, faiz'],
            ['council', 'fa-people-group', 'Karar Odası', 'Ajanlar tartışır, Hakem karar verir'],
            ['panel:wx', 'fa-cloud-sun', 'Hava Tahmini', '5 günlük'],
            ['panel:health', 'fa-heart-pulse', 'Sağlık ve Adım', 'Ayrıntılar ve profil'],
            ['panel:summary', 'fa-chart-column', 'Özet', 'Kayıtların genel görünümü'],
            ['ask:Bilgi kütüphanesinde ne var?', 'fa-book-open', 'Bilgi Kütüphanesi', 'Cihazda, çevrimdışı, kaynaklı']
        ],
        msg: [
            ['ask:Bir e-posta taslağı hazırla: ', 'fa-envelope', 'E-posta taslağı', 'Siz onaylamadan gönderilmez'],
            ['ask:WhatsApp için bir mesaj taslağı hazırla: ', 'fa-brands fa-whatsapp', 'WhatsApp taslağı', 'Düğmeyle açılır, siz gönderirsiniz'],
            ['ask:SMS için bir mesaj taslağı hazırla: ', 'fa-comment-sms', 'SMS taslağı', 'Telefonun mesaj uygulamasında açılır'],
            ['ask:Panoya kopyaladığım mesaja cevap taslağı hazırla: ', 'fa-reply', 'Gelen mesaja cevap', 'Mesajı yapıştırın ya da Paylaş > Aklımda deyin']
        ],
        doc: [
            ['file', 'fa-file-pdf', 'PDF özetle', 'Gemini ile'],
            ['file', 'fa-file-word', 'Word oku', '.docx'],
            ['file', 'fa-file-excel', 'Excel / CSV analiz et', 'Cihazda hesaplanır'],
            ['file', 'fa-image', 'Görsel anla', 'Fotoğraf, ekran görüntüsü']
        ]
    };
    function faIcon(c) { return c.indexOf('fa-brands') === 0 ? c : 'fa-solid ' + c; }
    function rowsHtml(list) {
        return list.map(r => '<button class="g-row" type="button" data-act="' + esc(r[0]) + '"><i class="' + faIcon(r[1]) + '"></i><span><b>' + esc(r[2]) + '</b><small>' + r[3] + '</small></span></button>').join('');
    }
    let sheetEl = null, barEl = null, sheetOpen = null;

    function build() {
        if (homeEl) return homeEl;
        const main = $q('main.container') || document.body;
        homeEl = document.createElement('section');
        homeEl.className = 'home';
        homeEl.id = 'home';
        homeEl.setAttribute('aria-label', 'Komuta paneli');
        homeEl.innerHTML =
            '<div class="home-center">' +
              '<div class="h-title"><b>Aklımda Asistan</b></div>' +
              '<button class="core" id="homeCore" type="button" aria-label="Asistanla konuş">' +
                '<span class="core-halo"></span><span class="core-arc a1"></span><span class="core-arc a2"></span><span class="core-arc a3"></span>' +
                '<span class="core-orb"></span><span class="core-label">AI Core</span>' +
              '</button>' +
              '<div class="g-card exec"><h4>Komuta Özeti</h4>' +
                '<div class="exec-grid">' +
                  '<button class="tile" type="button" data-act="date:today"><small>Bugün</small><b id="hToday">0</b><em>kayıt</em></button>' +
                  '<button class="tile" type="button" data-act="panel:agenda"><small>Bu hafta</small><b id="hTop">0</b><em>yaklaşan 7 gün</em></button>' +
                  '<button class="tile" type="button" data-bar="well"><small>Adım</small><b id="hStep">0</b><em id="hStepEm">hedef 8.000</em></button>' +
                '</div>' +
              '</div>' +
              '<div class="listen"><div class="listen-state" id="hState"><i class="fa-solid fa-circle"></i> <span>Hazır · cihazda çalışıyor</span></div>' + wave() +
                '<p class="listen-quote" id="hQuote"></p></div>' +
            '</div>';
        main.insertBefore(homeEl, main.firstChild);
        homeEl.addEventListener('click', onAct);
        $q('#homeCore', homeEl).addEventListener('click', onCore);

        // Alttaki çubuk ve açılır sayfa (üst başlık gibi cam görünümlü)
        sheetEl = document.createElement('div');
        sheetEl.className = 'home-sheet';
        sheetEl.id = 'homeSheet';
        sheetEl.hidden = true;
        sheetEl.setAttribute('role', 'region');
        sheetEl.innerHTML = '<div class="sheet-head"><b id="sheetTitle"></b><button type="button" class="sheet-close" data-bar-close aria-label="Kapat"><i class="fa-solid fa-chevron-down"></i></button></div>' +
            '<div class="sheet-body">' +
              '<div class="sheet-panel" data-sp="soon" hidden><div id="hSoon"></div></div>' +
              '<div class="sheet-panel" data-sp="well" hidden><div id="hWell"></div></div>' +
              '<div class="sheet-panel grid" data-sp="quick" hidden>' + rowsHtml(ROWS.quick) + '</div>' +
              '<div class="sheet-panel grid" data-sp="msg" hidden>' + rowsHtml(ROWS.msg) + '</div>' +
              '<div class="sheet-panel grid" data-sp="doc" hidden>' + rowsHtml(ROWS.doc) + '</div>' +
            '</div>';
        barEl = document.createElement('nav');
        barEl.className = 'home-bar';
        barEl.id = 'homeBar';
        barEl.setAttribute('aria-label', 'Kısayollar');
        barEl.innerHTML = BAR.map(t => '<button type="button" class="bar-btn" data-bar="' + t.id + '" aria-expanded="false" aria-controls="homeSheet"><i class="fa-solid ' + t.icon + '"></i><span>' + esc(t.label) + '</span></button>').join('');
        document.body.appendChild(sheetEl);
        document.body.appendChild(barEl);
        const onClick = e => {
            const c = e.target.closest && e.target.closest('[data-bar-close]');
            if (c) { closeSheet(); return; }
            const bb = e.target.closest && e.target.closest('[data-bar]');
            if (bb) { toggleSheet(bb.dataset.bar); return; }
            if (e.target.closest && e.target.closest('[data-act]')) { onAct(e); closeSheet(); }
        };
        sheetEl.addEventListener('click', onClick);
        barEl.addEventListener('click', onClick);
        homeEl.addEventListener('click', e => { const bb = e.target.closest && e.target.closest('[data-bar]'); if (bb) toggleSheet(bb.dataset.bar); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && sheetOpen) closeSheet(); });
        document.addEventListener('click', e => {                         // sayfanın dışına dokununca kapanır
            if (!sheetOpen) return;
            if (e.target.closest && (e.target.closest('#homeSheet') || e.target.closest('#homeBar') || e.target.closest('[data-bar]'))) return;
            closeSheet();
        });
        return homeEl;
    }
    function showBar(on) { if (barEl) barEl.hidden = !on; if (!on) closeSheet(); }
    function toggleSheet(id) { if (sheetOpen === id) closeSheet(); else openSheet(id); }
    function openSheet(id) {
        if (!sheetEl) return;
        sheetOpen = id;
        sheetEl.hidden = false;
        $q('#sheetTitle', sheetEl).textContent = SHEET_TITLES[id] || '';
        sheetEl.querySelectorAll('.sheet-panel').forEach(p => { p.hidden = p.dataset.sp !== id; });
        document.querySelectorAll('#homeBar .bar-btn').forEach(b => { const on = b.dataset.bar === id; b.classList.toggle('on', on); b.setAttribute('aria-expanded', String(on)); });
        try { localStorage.setItem(TAB_KEY, id); } catch (e) { /* yoksay */ }
        refresh();
    }
    function closeSheet() {
        sheetOpen = null;
        if (sheetEl) sheetEl.hidden = true;
        document.querySelectorAll('#homeBar .bar-btn').forEach(b => { b.classList.remove('on'); b.setAttribute('aria-expanded', 'false'); });
    }

    /* Odak görünümü: bir şeye dokununca yalnızca o gelir (ana ekran ve diğerleri gizlenir) */
    const VIEW_TITLES = { agenda: 'Takvim', wx: 'Hava Durumu', health: 'Sağlık ve Adım', summary: 'Özet', news: 'Haberler', records: 'Tüm Kayıtlar' };
    let focusEl = null;
    function buildFocusBar() {
        if (focusEl) return;
        const main = $q('main.container') || document.body;
        focusEl = document.createElement('div');
        focusEl.className = 'focus-bar';
        focusEl.id = 'focusBar';
        focusEl.hidden = true;
        focusEl.innerHTML = '<button type="button" class="focus-back" data-focus-back aria-label="Geri"><i class="fa-solid fa-arrow-left"></i> Geri</button><b id="focusTitle"></b><span></span>';
        main.insertBefore(focusEl, main.firstChild);
        focusEl.addEventListener('click', e => { if (e.target.closest && e.target.closest('[data-focus-back]')) closeView(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && g.document.body.dataset.focus && !sheetOpen && !document.body.classList.contains('modal-open')) closeView(); });
    }
    function openPanelId() { try { return PANELS.find(id => panelState[id]) || null; } catch (e) { return null; } }
    function openView(id) {
        buildFocusBar();
        closeSheet();
        const cur = openPanelId();
        if (id === 'records') { if (cur) togglePanel(cur); }
        else if (!panelState[id]) togglePanel(id);
        document.body.dataset.focus = id;
        $q('#focusTitle').textContent = VIEW_TITLES[id] || '';
        focusEl.hidden = false;
        try { window.scrollTo(0, 0); } catch (e) { /* yoksay */ }
    }
    function closeView() {
        const cur = openPanelId();
        if (cur) togglePanel(cur);
        delete document.body.dataset.focus;
        if (focusEl) focusEl.hidden = true;
        try { window.scrollTo(0, 0); } catch (e) { /* yoksay */ }
    }
    function syncFocus() {                                   // panel başka yolla açılıp kapanırsa görünüm uyumlu kalsın
        if (document.documentElement.dataset.theme !== 'glass') return;
        const cur = openPanelId(), f = document.body.dataset.focus;
        if (cur && f !== cur) { buildFocusBar(); document.body.dataset.focus = cur; $q('#focusTitle').textContent = VIEW_TITLES[cur] || ''; focusEl.hidden = false; }
        else if (!cur && f && f !== 'records') { delete document.body.dataset.focus; if (focusEl) focusEl.hidden = true; }
    }

    function openChatWith(text) {
        openChat();
        const inp = $q('#chatInput');
        if (inp && text) { inp.value = text; try { inp.focus(); inp.setSelectionRange(text.length, text.length); } catch (e) { /* yoksay */ } }
    }
    function onAct(e) {
        const b = e.target.closest && e.target.closest('[data-act]');
        if (!b) return;
        const a = b.dataset.act;
        try {
            if (a.indexOf('panel:') === 0) {
                openView(a.slice(6));
            } else if (a.indexOf('view:') === 0) {
                openView(a.slice(5));
            } else if (a.indexOf('date:') === 0) {
                const iso = a.slice(5) === 'today' ? todayISO() : a.slice(5);
                openView('agenda');
                selectAgendaDay(iso, true);
            } else if (a === 'calc') $q('#calcBtn').click();
            else if (a === 'council') $q('#councilBtn').click();
            else if (a === 'file') { openChat(); $q('#chatFile').click(); }
            else if (a.indexOf('ask:') === 0) openChatWith(a.slice(4));
            else if (a === 'steps-toggle') { stepState.on ? stopSteps() : startSteps(); }
        } catch (err) { /* sessiz */ }
    }
    function onCore() {
        openChat();
        try { if (voice && voice.recSupported) startListening(); } catch (e) { /* yoksay */ }
    }

    function when(d) { return d === 0 ? 'bugün' : d === 1 ? 'yarın' : d + ' gün sonra'; }
    const lastHtml = {};
    function setIfChanged(id, html) {                       // aynıysa DOM'a dokunma (kaydırma ve odak bozulmasın)
        if (lastHtml[id] === html) return;
        lastHtml[id] = html;
        const el = $q('#' + id);
        if (el) el.innerHTML = html;
    }
    function refresh() {
        if (!homeEl) return;
        syncFocus();
        const m = metrics();
        const set = (id, html) => setIfChanged(id, html);
        set('hToday', String(m.today));
        set('hTop', String(m.week));
        set('hStep', num(stepState.count));
        set('hStepEm', 'hedef ' + num(m.goal));
        if (!sheetOpen || sheetOpen === 'soon') {
            set('hSoon', m.up.length
                ? m.up.slice(0, 8).map(i => '<button type="button" class="g-row" data-act="date:' + toISOLocal(i.occ) + '"><i class="fa-solid fa-calendar-day"></i><span><b>' + esc(i.ev.title) + '</b><small>' + (i.ev.time ? esc(i.ev.time) + ' · ' : '') + when(i.days) + '</small></span></button>').join('')
                : '<p class="mut left">Yaklaşan kayıt yok. Yazın ya da söyleyin: "yarın saat 10\'da toplantı".</p>');
        }
        if (!sheetOpen || sheetOpen === 'well') {
            const r = calcHealth(stepState.count);
            const pct = Math.round(Math.min(100, stepState.count / m.goal * 100));
            const hasSteps = m.steps.some(s => s.v > 0);
            set('hWell',
                '<div class="well-top"><div><small>Bugün</small><b>' + num(stepState.count) + '</b><em>adım · %' + pct + '</em></div>' +
                '<div><small>Mesafe</small><b>' + r.distanceKm.toFixed(2).replace('.', ',') + '</b><em>km</em></div>' +
                '<div><small>Kalori</small><b>' + num(r.kcal) + '</b><em>kcal</em></div></div>' +
                '<div class="well-state"><i class="fa-solid fa-circle ' + (stepState.on ? 'on' : '') + '"></i> ' +
                  (stepState.on ? 'Adım sayacı çalışıyor (uygulama açıkken)' : 'Adım sayacı durdu') +
                  ' <button type="button" class="mini-btn" data-act="steps-toggle">' + (stepState.on ? 'Durdur' : 'Başlat') + '</button></div>' +
                (hasSteps
                    ? '<div class="well"><small>Adım geçmişi (7 gün)</small>' + spark(m.steps.map(s => s.v), 220, 64, 'gold') + '<div class="axis">' + m.steps.map(s => '<i>' + s.label + '</i>').join('') + '</div></div>' +
                      '<div class="well"><small>Kalori geçmişi (yaklaşık)</small>' + bars(m.steps.map(s => Math.round(s.v * 0.04)), 52) + '</div>'
                    : '<p class="mut left">Henüz adım verisi yok. Telefonu yürürken yanınızda taşıyın; sayaç uygulama açıkken sayar.</p>') +
                '<button type="button" class="g-row" data-act="panel:health"><i class="fa-solid fa-heart-pulse"></i><span><b>Ayrıntılar ve profil</b><small>Boy, kilo, hedef, elle giriş</small></span></button>');
        }
        const st = $q('#hState', homeEl);
        if (st) {
            const listening = !!(typeof voice !== 'undefined' && voice.listening);
            const busy = !!(typeof chatBusy !== 'undefined' && chatBusy);
            st.classList.toggle('on', listening);
            homeEl.classList.toggle('is-listening', listening);
            $q('span', st).textContent = listening ? 'Aklımda dinliyor… (konuşun)' : busy ? 'Düşünüyor…' : (navigator.onLine === false ? 'Çevrimdışı · cihazda çalışıyor' : 'Hazır · cihazda çalışıyor');
        }
    }
    function rotateQuote() {
        const q = $q('#hQuote', homeEl);
        if (!q) return;
        q.textContent = '"' + QUOTES[quoteIdx++ % QUOTES.length] + '"';
    }
    function startLoop() {
        stopLoop();
        rotateQuote(); refresh();
        timer = setInterval(() => { if (!document.hidden) refresh(); }, 1500);
        homeEl._q = setInterval(() => { if (!document.hidden) rotateQuote(); }, 6000);
    }
    function stopLoop() {
        if (timer) { clearInterval(timer); timer = null; }
        if (homeEl && homeEl._q) { clearInterval(homeEl._q); homeEl._q = null; }
    }

    /* ---------- Tema ---------- */
    const THEMES = ['dark', 'light', 'glass'];
    const THEME_NAMES = { dark: 'Koyu', light: 'Açık', glass: 'Cam' };
    function applyTheme(t) {
        if (THEMES.indexOf(t) < 0) t = 'dark';
        document.documentElement.dataset.theme = t;
        try { db.set(K.theme, t); } catch (e) { /* yoksay */ }
        if (t === 'glass') { build(); homeEl.hidden = false; showBar(true); document.body.classList.add('has-bar'); startLoop(); }
        else { stopLoop(); if (homeEl) homeEl.hidden = true; showBar(false); document.body.classList.remove('has-bar'); delete document.body.dataset.focus; if (focusEl) focusEl.hidden = true; }
        try { initTheme(); } catch (e) { /* yoksay */ }
    }
    function applyFx() {
        const low = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) && (navigator.deviceMemory && navigator.deviceMemory <= 2);
        const reduce = g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const off = (settings && settings.fxOff) || reduce || low;
        document.documentElement.classList.toggle('fx-off', !!off);
    }

    /* ---------- Karşılama turu ---------- */
    const STEPS = [
        { icon: 'fa-brain', title: 'Merhaba, ben Aklımda', text: 'Doğum günlerini, ödemeleri, toplantıları ve notlarını aklında tutan kişisel asistanın. Kayıtların yalnızca telefonunda durur; internet olmasa da çalışırım.', say: '"11 Ekim annemin doğum günü"', hint: 'Yazman ya da söylemen yeter, "ekle" demene gerek yok.' },
        { icon: 'fa-microphone-lines', title: 'Yaz ya da konuş', text: 'Mikrofona basıp konuş, ben de sesle cevap vereyim. Gemini bağlarsan ses gerçek bir insan gibi olur; bağlamazsan cihaz sesiyle devam ederim.', say: '"Yarın sabah 9\'da iş toplantım var"', hint: 'Saati anlar, bir saat önce haber veririm.' },
        { icon: 'fa-bell', title: 'Unutturmam', text: 'Saatli kayıtlar için bildirim gelir. Uygulama kapalıyken de çalsın diye her kayda "telefon takvimine ekle" ve "alarm kur" düğmeleri koyuyorum.', say: '"Bu hafta neler var?"', hint: 'Takvim, hava, sağlık ve özet panelleri tek dokunuşla açılır.' },
        { icon: 'fa-people-group', title: 'Karar Odası', text: 'Önemli bir karar mı var? Birkaç ajan farklı açılardan tartışır, Hakem kararı özetler. İstersen söz alıp tartışmaya katılırsın.', say: '"Araba mı almalıyım, kiralamalı mıyım?"', hint: 'Ajanlar kendi sesleriyle konuşabilir.' },
        { icon: 'fa-file-circle-check', title: 'Belge, görsel, taslak', text: 'PDF, Word, Excel ve fotoğraf ekleyebilirsin. E-posta ve WhatsApp cevaplarını taslak olarak hazırlarım; göndermeyi sen onaylarsın, kendi başıma hiçbir şey göndermem.', say: '"Ekteki PDF\'i özetle"', hint: 'Başka uygulamadan Paylaş > Aklımda ile de metin gönderebilirsin.' },
        { icon: 'fa-shield-halved', title: 'Güvenilir ve çevrimdışı', text: 'Cihazdaki bilgi kütüphanesi kaynak göstererek yanıtlar, bilmediğinde uydurmaz. Sağlık, hukuk ve finansta uzman uyarısı eklerim. Görünümünü seç:', say: '', hint: '' }
    ];
    let tourEl = null, tourI = 0;
    function tourDone() { try { localStorage.setItem(TOUR_KEY, '1'); } catch (e) { /* yoksay */ } }
    function tourSeen() { try { return localStorage.getItem(TOUR_KEY) === '1'; } catch (e) { return true; } }
    function closeTour() {
        tourDone();
        if (tourEl) { tourEl.remove(); tourEl = null; }
        document.body.classList.remove('modal-open');
    }
    function renderTour() {
        const s = STEPS[tourI], last = tourI === STEPS.length - 1;
        const cur = document.documentElement.dataset.theme;
        const chips = STEPS.map((x, i) => '<span class="tour-chip' + (i === tourI ? ' on' : '') + (i < tourI ? ' past' : '') + '"><i class="fa-solid ' + x.icon + '"></i></span>').join('');
        tourEl.innerHTML =
            '<div class="tour-bg" aria-hidden="true"></div>' +
            '<div class="tour-card" role="document">' +
              '<button class="tour-skip" type="button" data-t="skip">Atla</button>' +
              '<div class="tour-core" aria-hidden="true"><span class="core-halo"></span><span class="core-arc a1"></span><span class="core-arc a2"></span><span class="core-arc a3"></span><span class="core-orb"></span><i class="fa-solid ' + s.icon + '"></i></div>' +
              '<div class="tour-chips" aria-hidden="true">' + chips + '</div>' +
              '<h2 id="tourTitle">' + esc(s.title) + '</h2>' +
              '<p>' + esc(s.text) + '</p>' +
              (s.say ? '<div class="tour-say"><i class="fa-solid fa-quote-left"></i> ' + esc(s.say) + '</div><small class="tour-hint">' + esc(s.hint) + '</small>' : '') +
              (last ? '<div class="tour-themes" role="group" aria-label="Görünüm">' + THEMES.map(t => '<button type="button" class="tour-theme' + (t === cur ? ' on' : '') + '" data-theme-pick="' + t + '"><i class="fa-solid ' + ({ dark: 'fa-moon', light: 'fa-sun', glass: 'fa-gem' }[t]) + '"></i> ' + THEME_NAMES[t] + '</button>').join('') + '</div>' : '') +
              '<div class="tour-nav"><button type="button" class="tour-btn ghost" data-t="back"' + (tourI === 0 ? ' disabled' : '') + '>Geri</button>' +
              '<span class="tour-count">' + (tourI + 1) + ' / ' + STEPS.length + '</span>' +
              '<button type="button" class="tour-btn" data-t="next">' + (last ? 'Başla' : 'İleri') + '</button></div>' +
            '</div>';
        const nx = $q('[data-t="next"]', tourEl);
        if (nx && nx.focus) nx.focus();
    }
    function showTour(force) {
        if (tourEl) return;
        if (!force && tourSeen()) return;
        tourI = 0;
        tourEl = document.createElement('div');
        tourEl.className = 'tour';
        tourEl.setAttribute('role', 'dialog');
        tourEl.setAttribute('aria-modal', 'true');
        tourEl.setAttribute('aria-labelledby', 'tourTitle');
        tourEl.addEventListener('click', e => {
            const t = e.target.closest && e.target.closest('[data-t],[data-theme-pick]');
            if (!t) return;
            if (t.dataset.themePick) { applyTheme(t.dataset.themePick); renderTour(); return; }
            const a = t.dataset.t;
            if (a === 'skip') closeTour();
            else if (a === 'back') { tourI = Math.max(0, tourI - 1); renderTour(); }
            else if (tourI >= STEPS.length - 1) closeTour();
            else { tourI++; renderTour(); }
        });
        tourEl.addEventListener('keydown', e => { if (e.key === 'Escape') closeTour(); });
        document.body.appendChild(tourEl);
        document.body.classList.add('modal-open');
        renderTour();
    }

    function init() {
        applyFx();
        const t = document.documentElement.dataset.theme;
        if (t === 'glass') applyTheme('glass');
        const btn = $q('#tourBtn');
        if (btn) btn.addEventListener('click', () => { const m = $q('#headerMenu'); if (m) m.hidden = true; showTour(true); });
        setTimeout(() => showTour(false), 700);
    }

    g.AklimdaHome = { init: init, refresh: refresh, applyTheme: applyTheme, applyFx: applyFx, showTour: showTour, closeTour: closeTour, THEMES: THEMES, THEME_NAMES: THEME_NAMES };
})();
