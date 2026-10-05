/* ============================================================
   AKLIMDA v3 - Akilli Kisisel Asistan
   Katmanlar: Storage | Events | Weather | Steps | News | AI
   ============================================================ */
'use strict';

/* ==================== 1. SABITLER ==================== */
const APP_VERSION = '3.0.0';
const K = {
    events: 'aklimda_events_v3',
    eventsV2: 'aklimda_events_v2',
    eventsV1: 'aklimda_events',
    settings: 'aklimda_settings_v3',
    steps: 'aklimda_steps_v3',
    news: 'aklimda_news_v3',
    wx: 'aklimda_wx_v3',
    theme: 'aklimda_theme',
    notified: 'aklimda_notified'
};
const URGENT_DAYS = 7;

const TYPES = {
    dogum:     { label: 'Dogum Gunu', icon: 'fa-cake-candles',        color: '#f59e0b', recurrence: 'yearly'  },
    yildonumu: { label: 'Yildonumu',  icon: 'fa-heart',               color: '#ec4899', recurrence: 'yearly'  },
    odeme:     { label: 'Odeme',      icon: 'fa-file-invoice-dollar', color: '#ef4444', recurrence: 'monthly' },
    ozel:      { label: 'Ozel Gun',   icon: 'fa-star',                color: '#10b981', recurrence: 'none'    }
};
const REC_LABEL = { none: 'Tek seferlik', yearly: 'Her yil tekrarlar', monthly: 'Her ay tekrarlar' };

const WMO = {
    0: ['Acik', 'fa-sun'], 1: ['Az Bulutlu', 'fa-cloud-sun'], 2: ['Parcali Bulutlu', 'fa-cloud-sun'],
    3: ['Kapali', 'fa-cloud'], 45: ['Sisli', 'fa-smog'], 48: ['Kiragili Sis', 'fa-smog'],
    51: ['Hafif Cisenti', 'fa-cloud-rain'], 53: ['Cisenti', 'fa-cloud-rain'], 55: ['Yogun Cisenti', 'fa-cloud-rain'],
    61: ['Hafif Yagmur', 'fa-cloud-rain'], 63: ['Yagmurlu', 'fa-cloud-rain'], 65: ['Siddetli Yagmur', 'fa-cloud-showers-heavy'],
    66: ['Donan Yagmur', 'fa-cloud-rain'], 67: ['Donan Yagmur', 'fa-cloud-showers-heavy'],
    71: ['Hafif Kar', 'fa-snowflake'], 73: ['Karli', 'fa-snowflake'], 75: ['Yogun Kar', 'fa-snowflake'], 77: ['Kar Taneleri', 'fa-snowflake'],
    80: ['Saganak', 'fa-cloud-showers-heavy'], 81: ['Saganak', 'fa-cloud-showers-heavy'], 82: ['Siddetli Saganak', 'fa-cloud-showers-heavy'],
    85: ['Kar Saganagi', 'fa-snowflake'], 86: ['Kar Saganagi', 'fa-snowflake'],
    95: ['Gok Gurultulu Firtina', 'fa-cloud-bolt'], 96: ['Dolu', 'fa-cloud-bolt'], 99: ['Dolu', 'fa-cloud-bolt']
};

const GIFT_KEYWORDS = {
    'kahve': ['Ozel nitelikli kahve cekirdekleri aboneligi', 'French press veya cezve hediye seti', 'Isme ozel seramik kahve kupasi'],
    'kitap': ['Yilin en cok satan kitap seti', 'Kisisellestirilmis deri kitap kilifi', 'Sahaf bulusu nadir baski kitap'],
    'muzik': ['Kablosuz kulaklik', 'Vinyl plak koleksiyonu', 'Konser / festival bileti'],
    'spor': ['Akilli bileklik veya spor saati', 'Premium spor esofman seti', 'Spor salonu uyelik paketi'],
    'teknoloji': ['Akilli ev asistani cihazi', 'Kablosuz sarj istasyonu', 'Tasinabilir projektor'],
    'yemek': ['Gurme restoran tadim menusu', 'El yapimi baharat koleksiyonu', 'Michelin yildizli sef atolyesi deneyimi'],
    'seyahat': ['Hafta sonu kacamagi otel kuponu', 'Kisiye ozel deri pasaportluk', 'Seyahat boyutlu premium bakim seti'],
    'borsa': ['Ekonomi klasikleri kitap seti', 'Premium finans dergisi yillik aboneligi', 'Isme ozel deri portfoy cantasi']
};
const GIFT_RELATION = {
    'es': ['Birlikte romantik hafta sonu kacamagi', 'Isme ozel yildiz haritasi baskisi', 'El yazisi mektuplu ani kutusu'],
    'sevgili': ['Birlikte romantik aksam yemegi deneyimi', 'Ciftlere ozel bileklik seti', 'Ani fotograflarindan karikatur cizimi'],
    'anne': ['Spa ve masaj gunu deneyimi', 'Kisiye ozel cicek aboneligi', 'El isi tak veya ipek sal'],
    'baba': ['Deri cuzdan ve kemer seti', 'Havalik saat veya akilli bileklik', 'Aile aktivite gunu'],
    'cocuk': ['Egitici robotik oyuncak', 'Bilim deney seti', 'Kisisel hikaye kitabi (ismiyle)'],
    'arkadas': ['Birlikte escape room veya bowling gunu', 'Retro oyun konsolu', 'Kisiye ozel karikatur portresi'],
    'is': ['Premium masaustu ofis seti', 'Kahve aboneligi veya tadim seti', 'Toplanti notlugu ve kaliteli kalem']
};
const GIFT_BUDGETS = {
    ekonomik: ['El yapimi mum ve cikolata seti', 'Isme ozel kupa ve not kartlari', 'Mini bitki bahcesi kiti'],
    orta: ['Kablosuz kulaklik', 'Kisisellestirilmis ani albumu', 'Gurme kahve veya cay tadim seti'],
    luks: ['Akilli saat', 'Hafta sonu butik otel konaklamasi', 'Tasarim marka aksesuar']
};
const BUDGET_LABELS = { ekonomik: 'Ekonomik (0-500TL)', orta: 'Orta (500-2000TL)', luks: 'Luks (2000TL+)' };

const QUOTES = [
    'Basari, her gun kucuk adimlarin toplamidir.',
    'En karanlik gece bile sona erer ve gunes dogar. - Victor Hugo',
    'Yapabileceginizi dusunurseniz baslarsiniz; yapmaya degerse mucize yakindir. - Johann Wolfgang von Goethe',
    'Bugun yapabilecegin seyi yarina birakma. - Benjamin Franklin',
    'Zihin ne kadar sakin olursa, hedef o kadar net gorunur.',
    'Kucuk ilerlemeler, buyuk donusumlerin temelidir.',
    'Kendine iyi davran; en uzun iliskin kendinle olanidir.',
    'Disiplin, istek ile hedef arasindaki kopru.'
];

const JOKES = [
    'Bilgisayar neden doktora gitti? Cunku virus kapmisti!',
    'Matematik kitabi neden uzgunmus? Cunku icinde cok problem varmis!',
    'Yazilimci neden karanlikta calisirmis? Cunku isik bug cekermis!',
    'Adim sayar ne demis? "Bugun de seninleyim, yuru!"'
];

/* ==================== 2. YARDIMCILAR ==================== */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const pad2 = n => String(n).padStart(2, '0');
const toISOLocal = d => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
const todayISO = () => toISOLocal(new Date());
const startOfDay = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function parseDate(iso) { const p = iso.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
function safeDate(y, m, day) { const last = new Date(y, m + 1, 0).getDate(); return new Date(y, m, Math.min(day, last)); }
function daysUntil(date) { return Math.round((startOfDay(date) - startOfDay(new Date())) / 86400000); }
function fmtTL(n) { return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(n) + ' TL'; }
function formatDateTR(date, withYear) {
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', ...(withYear ? { year: 'numeric' } : {}) });
}
function nextOccurrence(ev) {
    const today = startOfDay(new Date());
    const orig = parseDate(ev.date);
    const rec = (TYPES[ev.type] || TYPES.ozel).recurrence;
    if (rec === 'monthly') {
        let c = safeDate(today.getFullYear(), today.getMonth(), orig.getDate());
        if (c < today) c = safeDate(today.getFullYear(), today.getMonth() + 1, orig.getDate());
        return c;
    }
    if (rec === 'yearly') {
        let c = safeDate(today.getFullYear(), orig.getMonth(), orig.getDate());
        if (c < today) c = safeDate(today.getFullYear() + 1, orig.getMonth(), orig.getDate());
        return c;
    }
    return orig;
}
function milestoneText(ev, occ) {
    const n = occ.getFullYear() - parseDate(ev.date).getFullYear();
    if (n < 1) return '';
    return ev.type === 'dogum' ? n + '. yas' : n + '. yil';
}

/* ==================== 3. DEPOLAMA ==================== */
const db = {
    get(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } },
    set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { toast('Depolama dolu olabilir.', 'error'); } },
    del(key) { localStorage.removeItem(key); }
};

function loadEvents() {
    let raw = db.get(K.events, null);
    if (!raw) raw = db.get(K.eventsV2, null);
    if (!raw) raw = db.get(K.eventsV1, null);
    if (!Array.isArray(raw)) return [];
    return raw.map(item => ({
        id: String(item.id || uid()),
        type: TYPES[item.type] ? item.type : 'ozel',
        title: String(item.title || 'Isimsiz'),
        date: /^\d{4}-\d{2}-\d{2}$/.test(item.date) ? item.date : todayISO(),
        amount: item.amount ? Number(item.amount) : null,
        relation: String(item.relation || ''),
        interests: String(item.interests || ''),
        budget: GIFT_BUDGETS[item.budget] ? item.budget : 'orta',
        notes: String(item.notes || ''),
        completed: Boolean(item.completed),
        createdAt: Number(item.createdAt) || Date.now()
    }));
}

let events = loadEvents();
let settings = Object.assign({ city: null, stepGoal: 8000, aiKey: '', aiModel: 'gpt-4o-mini' }, db.get(K.settings, {}));
const ui = { filter: 'all', search: '', sort: 'urgency' };

function persist() { db.set(K.events, events); render(); }

/* ==================== 4. TEMA ==================== */
function initTheme() {
    const t = document.documentElement.dataset.theme;
    $('#themeToggle').innerHTML = '<i class="fa-solid ' + (t === 'dark' ? 'fa-sun' : 'fa-moon') + '"></i>';
}
function toggleTheme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    db.set(K.theme, next);
    initTheme();
}

/* ==================== 5. TOAST ==================== */
const TOAST_ICONS = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-circle-info' };
function toast(message, type, action) {
    type = type || 'info';
    const el = document.createElement('div');
    el.className = 'toast toast-' + type;
    el.setAttribute('role', 'status');
    el.innerHTML = '<i class="fa-solid ' + TOAST_ICONS[type] + '"></i><span>' + escapeHtml(message) + '</span>' +
        (action ? '<button class="toast-action">' + escapeHtml(action.label) + '</button>' : '');
    $('#toastContainer').appendChild(el);
    let done = false;
    const dismiss = () => { if (done) return; done = true; el.classList.add('hide'); setTimeout(() => el.remove(), 320); };
    if (action) $('.toast-action', el).addEventListener('click', () => { action.fn(); dismiss(); });
    setTimeout(dismiss, action ? 6000 : 3800);
}

/* ==================== 6. MODAL ==================== */
function openModalEl(sel) { $(sel).classList.add('open'); document.body.classList.add('modal-open'); }
function closeModalEl(sel) {
    $(sel).classList.remove('open');
    if (!$$('.modal.open').length) document.body.classList.remove('modal-open');
}
function closeAllModals() { $$('.modal.open').forEach(m => m.classList.remove('open')); document.body.classList.remove('modal-open'); }

function showConfirm(opts) {
    return new Promise(resolve => {
        $('#confirmTitle').textContent = opts.title;
        $('#confirmText').textContent = opts.text;
        $('#confirmYes').textContent = opts.confirmText || 'Onayla';
        openModalEl('#confirmModal');
        const yes = $('#confirmYes'), no = $('#confirmNo');
        const cleanup = res => { closeModalEl('#confirmModal'); yes.onclick = no.onclick = null; resolve(res); };
        yes.onclick = () => cleanup(true);
        no.onclick = () => cleanup(false);
    });
}

/* ==================== 7. ETKINLIK CRUD ==================== */
function syncFormFields() {
    const type = $('#eventType').value;
    $('#amountGroup').style.display = type === 'odeme' ? 'block' : 'none';
    $('#giftSection').style.display = (type === 'dogum' || type === 'yildonumu') ? 'block' : 'none';
    $('#recurrenceHint').textContent = REC_LABEL[TYPES[type].recurrence];
}
function openEventModal(id) {
    const form = $('#eventForm');
    form.reset();
    $('#fieldId').value = '';
    $('#eventDate').value = todayISO();
    if (id) {
        const ev = events.find(e => e.id === id);
        if (!ev) return;
        $('#modalTitle').textContent = 'Kaydi Duzenle';
        $('#fieldId').value = ev.id;
        $('#eventType').value = ev.type;
        $('#eventTitle').value = ev.title;
        $('#eventDate').value = ev.date;
        $('#eventAmount').value = ev.amount != null ? ev.amount : '';
        $('#giftRelation').value = ev.relation;
        $('#giftInterests').value = ev.interests;
        $('#giftBudget').value = ev.budget;
        $('#eventNotes').value = ev.notes;
    } else {
        $('#modalTitle').textContent = 'Yeni Kayit Ekle';
    }
    syncFormFields();
    openModalEl('#eventModal');
    setTimeout(() => $('#eventTitle').focus(), 60);
}
function saveEvent(e) {
    e.preventDefault();
    const id = $('#fieldId').value;
    const data = {
        type: $('#eventType').value,
        title: $('#eventTitle').value.trim(),
        date: $('#eventDate').value,
        amount: $('#eventType').value === 'odeme' && $('#eventAmount').value ? Number($('#eventAmount').value) : null,
        relation: $('#giftRelation').value.trim(),
        interests: $('#giftInterests').value.trim(),
        budget: $('#giftBudget').value,
        notes: $('#eventNotes').value.trim()
    };
    if (!data.title || !data.date) { toast('Baslik ve tarih zorunludur.', 'error'); return; }
    if (id) {
        events = events.map(ev => ev.id === id ? Object.assign({}, ev, data) : ev);
        toast('Kayit guncellendi.', 'success');
    } else {
        events.push(Object.assign({ id: uid(), completed: false, createdAt: Date.now() }, data));
        toast('Aklinda tutuldu!', 'success');
    }
    persist();
    closeModalEl('#eventModal');
}
function toggleComplete(id) {
    const ev = events.find(e => e.id === id);
    if (!ev) return;
    ev.completed = !ev.completed;
    persist();
    toast(ev.completed ? 'Isaretlendi.' : 'Isaret kaldirildi.', 'info');
}
async function removeEvent(id) {
    const ev = events.find(e => e.id === id);
    if (!ev) return;
    const ok = await showConfirm({ title: 'Kayit Silinsin mi?', text: '"' + ev.title + '" silinecek. Geri alabilirsiniz.', confirmText: 'Evet, Sil' });
    if (!ok) return;
    const idx = events.findIndex(e => e.id === id);
    const removed = events.splice(idx, 1)[0];
    persist();
    toast('Kayit silindi.', 'info', { label: 'Geri Al', fn: () => { events.splice(Math.min(idx, events.length), 0, removed); persist(); } });
}

/* Hediye onerileri */
function buildGiftSuggestions(ev) {
    const ints = (ev.interests || '').toLocaleLowerCase('tr');
    const rel = (ev.relation || '').toLocaleLowerCase('tr');
    const out = [];
    Object.keys(GIFT_KEYWORDS).forEach(kw => { if (ints.includes(kw)) GIFT_KEYWORDS[kw].slice(0, 2).forEach(t => out.push({ tag: 'Ilgi Alani', text: t })); });
    Object.keys(GIFT_RELATION).forEach(kw => { if (rel.includes(kw)) GIFT_RELATION[kw].forEach(t => out.push({ tag: 'Iliskiye Ozel', text: t })); });
    (GIFT_BUDGETS[ev.budget] || GIFT_BUDGETS.orta).slice(0, 2).forEach(t => out.push({ tag: 'Butce', text: t }));
    out.push({ tag: 'Klasik', text: 'Birlikte gecirilen kaliteli zaman: aksam yemegi + etkinlik' });
    const seen = new Set();
    return out.filter(g => { const k = g.text.toLocaleLowerCase('tr'); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 8);
}
function openGiftModal(id) {
    const ev = events.find(e => e.id === id);
    if (!ev) return;
    const s = buildGiftSuggestions(ev);
    $('#giftModalContent').innerHTML =
        '<p class="gift-intro"><b>' + escapeHtml(ev.title) + '</b> icin ' + s.length + ' kisisellestirilmis oneri:</p>' +
        '<div class="gift-grid">' + s.map(g =>
            '<div class="gift-item"><i class="fa-solid fa-gift"></i><div><span class="gift-tag">' + escapeHtml(g.tag) +
            '</span><p>' + escapeHtml(g.text) + '</p></div></div>').join('') + '</div>';
    openModalEl('#giftModal');
}

/* ==================== 8. RENDER: PANEL ==================== */
function renderStats() {
    const infos = events.map(ev => ({ ev: ev, occ: nextOccurrence(ev), days: daysUntil(nextOccurrence(ev)) }));
    const urgent = infos.filter(i => i.days >= 0 && i.days <= URGENT_DAYS && !i.ev.completed).length;
    const payments = infos.filter(i => i.ev.type === 'odeme' && !i.ev.completed && i.days >= 0 && i.days <= 30)
        .reduce((s, i) => s + (i.ev.amount || 0), 0);
    $('#statTotal').textContent = events.length;
    $('#statUrgent').textContent = urgent;
    $('#statDone').textContent = events.filter(e => e.completed).length;
    $('#statPayments').textContent = fmtTL(payments);
}
function renderChart() {
    const now = new Date();
    const months = [];
    for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        months.push({ key: d.getFullYear() + '-' + d.getMonth(), label: d.toLocaleDateString('tr-TR', { month: 'short' }), count: 0, current: i === 0 });
    }
    events.forEach(ev => {
        if (ev.completed) return;
        const occ = nextOccurrence(ev);
        const slot = months.find(m => m.key === occ.getFullYear() + '-' + occ.getMonth());
        if (slot) slot.count++;
    });
    const max = Math.max(1, ...months.map(m => m.count));
    $('#chartBars').innerHTML = months.map(m =>
        '<div class="chart-col" title="' + m.count + ' kayit"><span class="chart-count">' + (m.count || '') + '</span>' +
        '<div class="chart-bar ' + (m.count ? '' : 'zero') + ' ' + (m.current ? 'current' : '') + '" style="height:' + Math.max(4, (m.count / max) * 78) + 'px"></div>' +
        '<span class="chart-label">' + m.label + '</span></div>').join('');
}
function getFiltered() {
    let list = events.slice();
    if (ui.filter !== 'all') list = list.filter(e => e.type === ui.filter);
    if (ui.search) {
        const q = ui.search.toLocaleLowerCase('tr');
        list = list.filter(e => [e.title, e.relation, e.interests, e.notes].some(f => (f || '').toLocaleLowerCase('tr').includes(q)));
    }
    const keyed = list.map(ev => ({ ev: ev, occ: nextOccurrence(ev), days: daysUntil(nextOccurrence(ev)) }));
    if (ui.sort === 'urgency') {
        keyed.sort((a, b) => (a.ev.completed - b.ev.completed) || ((a.days < 0 ? 9999 : a.days) - (b.days < 0 ? 9999 : b.days)));
    } else if (ui.sort === 'date') {
        keyed.sort((a, b) => (a.ev.completed - b.ev.completed) || (a.occ - b.occ));
    } else {
        keyed.sort((a, b) => a.ev.title.localeCompare(b.ev.title, 'tr'));
    }
    return keyed;
}
function countdownBadge(ev, days) {
    if (ev.completed) return '<div class="countdown-badge done"><i class="fa-solid fa-check"></i> Tamamlandi</div>';
    if (days < 0) return '<div class="countdown-badge">Gecti</div>';
    if (days === 0) return '<div class="countdown-badge urgent"><i class="fa-solid fa-bell"></i> Bugun!</div>';
    if (days === 1) return '<div class="countdown-badge urgent">Yarin</div>';
    if (days <= 3) return '<div class="countdown-badge urgent">' + days + ' gun kaldi</div>';
    if (days <= URGENT_DAYS) return '<div class="countdown-badge soon">' + days + ' gun kaldi</div>';
    return '<div class="countdown-badge">' + days + ' gun kaldi</div>';
}
function renderList() {
    const listEl = $('#eventList');
    const emptyEl = $('#emptyState');
    const keyed = getFiltered();
    $$('.filter-btn').forEach(btn => {
        const f = btn.dataset.filter;
        $('.chip-count', btn).textContent = f === 'all' ? events.length : events.filter(e => e.type === f).length;
    });
    if (!keyed.length) {
        listEl.innerHTML = '';
        emptyEl.style.display = 'block';
        $('#emptyText').textContent = events.length ? 'Bu filtreye uygun kayit bulunamadi.' : 'Henuz hic kayit yok. Asistandan da ekleyebilirsiniz!';
        $('#sampleBtn').style.display = events.length ? 'none' : 'inline-flex';
        return;
    }
    emptyEl.style.display = 'none';
    listEl.innerHTML = keyed.map((item, i) => {
        const ev = item.ev, t = TYPES[ev.type];
        const milestone = milestoneText(ev, item.occ);
        const giftable = ev.type === 'dogum' || ev.type === 'yildonumu';
        return '<article class="event-card ' + (ev.completed ? 'completed' : '') + '" style="--type-color:' + t.color + ';animation-delay:' + Math.min(i * 45, 360) + 'ms">' +
            '<div class="event-main"><div class="event-icon"><i class="fa-solid ' + t.icon + '"></i></div>' +
            '<div class="event-body"><div class="event-header"><div>' +
            '<span class="event-type-badge">' + t.label + '</span>' +
            '<h3 class="event-title">' + escapeHtml(ev.title) + '</h3></div>' +
            countdownBadge(ev, item.days) + '</div>' +
            '<div class="event-details">' +
            '<span><i class="fa-regular fa-calendar"></i> ' + formatDateTR(item.occ) + (milestone ? ' - <b>' + milestone + '</b>' : '') + '</span>' +
            (ev.amount ? '<span><i class="fa-solid fa-turkish-lira-sign"></i> ' + fmtTL(ev.amount) + '</span>' : '') +
            '<span title="' + REC_LABEL[t.recurrence] + '"><i class="fa-solid fa-repeat"></i> ' + REC_LABEL[t.recurrence] + '</span></div>' +
            (ev.notes ? '<p class="event-notes"><i class="fa-regular fa-note-sticky"></i> ' + escapeHtml(ev.notes) + '</p>' : '') +
            '</div></div>' +
            '<div class="event-actions">' +
            '<button class="btn btn-success" data-action="complete" data-id="' + ev.id + '"><i class="fa-solid ' + (ev.completed ? 'fa-rotate-left' : 'fa-check') + '"></i> ' + (ev.completed ? 'Geri Al' : (ev.type === 'odeme' ? 'Odendi' : 'Kutlandi')) + '</button>' +
            (giftable ? '<button class="btn btn-gift" data-action="gift" data-id="' + ev.id + '"><i class="fa-solid fa-gift"></i> Hediye</button>' : '') +
            '<button class="btn btn-edit" data-action="edit" data-id="' + ev.id + '"><i class="fa-solid fa-pen"></i> Duzenle</button>' +
            '<button class="btn btn-danger" data-action="delete" data-id="' + ev.id + '" aria-label="Sil"><i class="fa-solid fa-trash"></i></button>' +
            '</div></article>';
    }).join('');
}
function render() { renderStats(); renderChart(); renderList(); }

/* ==================== 9. HAVA DURUMU ==================== */
async function geocodeCity(name) {
    const res = await fetch('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(name) + '&count=1&language=tr&format=json');
    const j = await res.json();
    const r = j.results && j.results[0];
    if (!r) throw new Error('Sehir bulunamadi');
    return { name: r.name + (r.country ? ', ' + r.country : ''), lat: r.latitude, lon: r.longitude };
}
async function loadWeather(force) {
    const card = $('#wxBody');
    if (!settings.city) {
        card.innerHTML = '<div class="wx-setup">' +
            '<input type="text" id="wxCityInput" class="form-control" placeholder="Sehir ara... (ornegi: Istanbul)">' +
            '<button class="btn btn-edit" id="wxCityBtn"><i class="fa-solid fa-magnifying-glass"></i></button>' +
            '<button class="btn" id="wxGeoBtn"><i class="fa-solid fa-location-crosshairs"></i> Konumum</button></div>' +
            '<p class="wx-error" id="wxError"></p>';
        $('#wxCityBtn').addEventListener('click', setCityFromInput);
        $('#wxCityInput').addEventListener('keydown', e => { if (e.key === 'Enter') setCityFromInput(); });
        $('#wxGeoBtn').addEventListener('click', useGeolocation);
        return;
    }
    const cache = db.get(K.wx, null);
    if (!force && cache && cache.t > Date.now() - 30 * 60 * 1000) { renderWeather(cache.data); return; }
    try {
        const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + settings.city.lat +
            '&longitude=' + settings.city.lon +
            '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m' +
            '&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=5&timezone=auto';
        const res = await fetch(url);
        if (!res.ok) throw new Error();
        const data = await res.json();
        db.set(K.wx, { t: Date.now(), data: data });
        renderWeather(data);
    } catch (e) {
        if (cache) renderWeather(cache.data);
        else toast('Hava durumu alinamadi. Baglantiyi kontrol edin.', 'error');
    }
}
function renderWeather(d) {
    const cur = d.current;
    const info = WMO[cur.weather_code] || ['Bilinmiyor', 'fa-cloud'];
    const days = (d.daily && d.daily.time || []).slice(0, 5).map((t, i) => {
        const dt = parseDate(t);
        const di = WMO[d.daily.weather_code[i]] || ['', 'fa-cloud'];
        const lbl = i === 0 ? 'Bugun' : dt.toLocaleDateString('tr-TR', { weekday: 'short' });
        return '<div class="wx-day"><span>' + lbl + '</span><i class="fa-solid ' + di[1] + '" title="' + di[0] + '"></i>' +
            '<span class="hi">' + Math.round(d.daily.temperature_2m_max[i]) + '&deg;</span>' +
            '<span>' + Math.round(d.daily.temperature_2m_min[i]) + '&deg;</span></div>';
    }).join('');
    $('#wxBody').innerHTML =
        '<div class="wx-top"><span class="wx-city"><i class="fa-solid fa-location-dot"></i> ' + escapeHtml(settings.city.name) + '</span>' +
        '<button class="wx-refresh" id="wxRefresh" title="Yenile / Sehir degistir" aria-label="Sehir degistir"><i class="fa-solid fa-gear"></i></button></div>' +
        '<div class="wx-main"><i class="fa-solid ' + info[1] + ' wx-icon"></i>' +
        '<div><div class="wx-temp">' + Math.round(cur.temperature_2m) + '&deg;C</div>' +
        '<div class="wx-desc">' + info[0] + ' - Hissedilen ' + Math.round(cur.apparent_temperature) + '&deg;C</div></div></div>' +
        '<div class="wx-meta">' +
        '<span><i class="fa-solid fa-droplet"></i> Nem %' + cur.relative_humidity_2m + '</span>' +
        '<span><i class="fa-solid fa-wind"></i> Ruzgar ' + Math.round(cur.wind_speed_10m) + ' km/sa</span></div>' +
        '<div class="wx-forecast">' + days + '</div>';
    $('#wxRefresh').addEventListener('click', async () => {
        const ok = await showConfirm({ title: 'Sehir Degistir', text: 'Hava durumu sehrini degistirmek ister misiniz?', confirmText: 'Evet' });
        if (ok) { settings.city = null; db.set(K.settings, settings); loadWeather(); }
    });
}
async function setCityFromInput() {
    const inp = $('#wxCityInput');
    const err = $('#wxError');
    try {
        settings.city = await geocodeCity(inp.value.trim());
        db.set(K.settings, settings);
        toast('Sehir ayarlandi: ' + settings.city.name, 'success');
        loadWeather(true);
    } catch (e) {
        if (err) { err.textContent = 'Sehir bulunamadi, farkli bir isim deneyin.'; err.style.display = 'block'; }
    }
}
function useGeolocation() {
    if (!navigator.geolocation) { toast('Konum desteklenmiyor.', 'error'); return; }
    toast('Konum aliniyor...', 'info');
    navigator.geolocation.getCurrentPosition(async pos => {
        try {
            const res = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=' +
                pos.coords.latitude + '&longitude=' + pos.coords.longitude + '&localityLanguage=tr');
            const j = await res.json();
            settings.city = { name: j.city || j.locality || 'Mevcut Konum', lat: pos.coords.latitude, lon: pos.coords.longitude };
            db.set(K.settings, settings);
            loadWeather(true);
        } catch (e) {
            settings.city = { name: 'Mevcut Konum', lat: pos.coords.latitude, lon: pos.coords.longitude };
            db.set(K.settings, settings);
            loadWeather(true);
        }
    }, () => toast('Konum izni verilmedi.', 'error'), { timeout: 10000 });
}

/* ==================== 10. ADIM SAYAR ==================== */
const stepState = { on: false, last: 0, hist: [], samples: 0, supported: 'DeviceMotionEvent' in window };
function getStepsData() { return db.get(K.steps, {}); }
function todaySteps() { const d = getStepsData(); return d[todayISO()] || 0; }
function addStep() {
    const d = getStepsData();
    const t = todayISO();
    d[t] = (d[t] || 0) + 1;
    db.set(K.steps, d);
    renderStepsUI();
}
function onMotion(e) {
    const a = e.accelerationIncludingGravity;
    if (!a || (a.x == null && a.y == null)) return;
    stepState.samples++;
    const m = Math.hypot(a.x || 0, a.y || 0, a.z || 0);
    const h = stepState.hist;
    h.push(m);
    if (h.length > 25) h.shift();
    if (h.length < 8) return;
    const base = h.reduce((s, v) => s + v, 0) / h.length;
    const now = Date.now();
    if (m > base + 2.1 && now - stepState.last > 290) {
        stepState.last = now;
        addStep();
    }
}
function attachMotion() {
    if (stepState.on) return;
    stepState.on = true;
    stepState.samples = 0;
    window.addEventListener('devicemotion', onMotion);
    setTimeout(() => {
        if (stepState.on && stepState.samples === 0) {
            toast('Ivmeyolcer algilanamadi. Manuel giris kullanabilirsiniz.', 'error');
            stopSteps();
        }
    }, 3500);
    renderStepsUI();
    toast('Adim sayacı calisiyor. Telefonu cebinizde/cantada tasimaniz yeterli.', 'success');
}
function startSteps() {
    if (!stepState.supported) { toast('Cihaziniz hareket sensörü desteklemiyor.', 'error'); return; }
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission().then(r => {
            if (r === 'granted') attachMotion();
            else toast('Hareket izni verilmedi.', 'error');
        }).catch(() => toast('Hareket izni alinamadi.', 'error'));
    } else {
        attachMotion();
    }
}
function stopSteps() {
    stepState.on = false;
    window.removeEventListener('devicemotion', onMotion);
    renderStepsUI();
}
function renderStepsUI() {
    const steps = todaySteps();
    const goal = settings.stepGoal || 8000;
    const pct = Math.min(1, steps / goal);
    const circ = 2 * Math.PI * 48;
    $('#ringFill').style.strokeDashoffset = circ * (1 - pct);
    $('#ringSteps').textContent = steps.toLocaleString('tr-TR');
    $('#ringLabel').textContent = pct >= 1 ? 'HEDEF!' : 'adim';
    const rem = Math.max(0, goal - steps);
    $('#stepsGoalText').innerHTML = 'Hedef: <b>' + goal.toLocaleString('tr-TR') + '</b> adim' +
        (rem > 0 ? ' - Kalan: <b>' + rem.toLocaleString('tr-TR') + '</b>' : ' - Tebrikler! 🎉');
    $('#stepsToggle').innerHTML = stepState.on
        ? '<i class="fa-solid fa-pause"></i> Durdur'
        : '<i class="fa-solid fa-play"></i> Sayaci Baslat';
    // Haftalik barlar
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = toISOLocal(d);
        days.push({ lbl: d.toLocaleDateString('tr-TR', { weekday: 'narrow' }), n: getStepsData()[key] || 0, today: i === 0 });
    }
    const max = Math.max(1, ...days.map(d => d.n));
    $('#stepsWeek').innerHTML = days.map(d =>
        '<div class="sw-col"><div class="sw-bar ' + (d.today ? 'today' : '') + '" style="height:' + Math.max(3, (d.n / max) * 100) + '%" title="' + d.n + ' adim"></div>' +
        '<span class="sw-lbl">' + d.lbl + '</span></div>').join('');
}
function setStepsManual() {
    const v = parseInt($('#stepsInput').value, 10);
    if (isNaN(v) || v < 0) { toast('Gecerli bir adim sayisi girin.', 'error'); return; }
    const d = getStepsData();
    d[todayISO()] = v;
    db.set(K.steps, d);
    renderStepsUI();
    toast('Adim sayisi guncellendi: ' + v.toLocaleString('tr-TR'), 'success');
}

/* ==================== 11. HABERLER (Ticker) ==================== */
async function loadNews() {
    const cache = db.get(K.news, null);
    if (cache && cache.t > Date.now() - 15 * 60 * 1000) { renderTicker(cache.items); return; }
    try {
        const rss = 'https://news.google.com/rss?hl=tr&gl=TR&ceid=TR:tr';
        const res = await fetch('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(rss));
        const j = await res.json();
        if (j.status !== 'ok') throw new Error();
        const items = j.items.slice(0, 12).map(it => ({ title: it.title, link: it.link }));
        db.set(K.news, { t: Date.now(), items: items });
        renderTicker(items);
    } catch (e) {
        if (cache) renderTicker(cache.items);
        else renderTicker([{ title: 'Haberler su an yuklenemedi', link: '#' }]);
    }
}
function renderTicker(items) {
    const track = $('#tickerTrack');
    if (!items.length) { track.innerHTML = '<span class="ticker-empty">Haber bulunamadi</span>'; return; }
    const html = items.map(it =>
        '<a class="ticker-item" href="' + escapeHtml(it.link) + '" target="_blank" rel="noopener">' + escapeHtml(it.title) + '</a>').join('');
    track.innerHTML = html + html; // kusursuz dongu icin ciftle
}

/* ==================== 12. ASISTAN (AI) ==================== */
let chatLog = [];
let chatGreeted = false;

function openChat() {
    $('#chatOverlay').classList.add('open');
    document.body.classList.add('modal-open');
    if (!chatGreeted) {
        chatGreeted = true;
        botSay('Merhaba! Ben Aklımda asistanınız 🧠\n' +
            '• Etkinlik ekleyebilirim: "3 gun sonra toplanti ekle"\n' +
            '• Hava durumu, adimlar, haberler, hediye fikirleri...\n' +
            '• Hesap bile yaparım: "125*4 kaç eder"\n' +
            'Nasıl yardımcı olayım?');
    }
    setTimeout(() => $('#chatInput').focus(), 250);
}
function closeChat() {
    $('#chatOverlay').classList.remove('open');
    if (!$$('.modal.open').length) document.body.classList.remove('modal-open');
}
function addMsg(text, who) {
    const el = document.createElement('div');
    el.className = 'msg ' + who;
    el.innerHTML = escapeHtml(text).replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/\n/g, '<br>');
    $('#chatBody').appendChild(el);
    $('#chatBody').scrollTop = $('#chatBody').scrollHeight;
    return el;
}
function botSay(text) { addMsg(text, 'bot'); chatLog.push({ role: 'assistant', content: text }); }
function showTyping() {
    const el = document.createElement('div');
    el.className = 'msg bot typing';
    el.innerHTML = '<i></i><i></i><i></i>';
    $('#chatBody').appendChild(el);
    $('#chatBody').scrollTop = $('#chatBody').scrollHeight;
    return el;
}
function sendUserMessage(raw) {
    const text = (raw || $('#chatInput').value).trim();
    if (!text) return;
    $('#chatInput').value = '';
    addMsg(text, 'user');
    chatLog.push({ role: 'user', content: text });
    const typing = showTyping();
    setTimeout(async () => {
        let reply;
        if (settings.aiKey) {
            reply = await tryAI(text);
            if (reply == null) reply = localBrain(text) + '\n\n*(AI baglantisi basarisiz, yerli motor devrede)*';
        } else {
            await new Promise(r => setTimeout(r, 350 + Math.random() * 500));
            reply = localBrain(text);
        }
        typing.remove();
        botSay(reply);
    }, 300);
}

/* --- OpenAI entegrasyonu --- */
function systemPrompt() {
    const infos = events.filter(e => !e.completed).slice(0, 12).map(e => {
        const d = daysUntil(nextOccurrence(e));
        return '- ' + e.title + ' (' + TYPES[e.type].label + ', ' + (d >= 0 ? d + ' gun sonra' : 'tarihi gecti') + (e.amount ? ', ' + fmtTL(e.amount) : '') + ')';
    }).join('\n') || '- Kayit yok';
    return 'Sen Aklımda uygulamasının Turkce konusan akilli asistanisin. Kisa, sicak ve yardimsever yanitlar ver.\n' +
        'KULLANICI VERILERI (salt okunur):\nAKTIF KAYITLAR:\n' + infos + '\n' +
        'BUGUNKU ADIM: ' + todaySteps() + '\nHAVA: ' + (settings.city ? settings.city.name : 'sehir ayarlanmadi') + '\n' +
        'TARIH: ' + formatDateTR(new Date()) + '\nBugun: ' + todayISO();
}
async function tryAI(text) {
    try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + settings.aiKey },
            body: JSON.stringify({
                model: settings.aiModel || 'gpt-4o-mini',
                messages: [{ role: 'system', content: systemPrompt() }].concat(chatLog.slice(-10)),
                temperature: 0.7, max_tokens: 400
            })
        });
        if (!res.ok) throw new Error('API hatasi ' + res.status);
        const j = await res.json();
        const out = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
        if (!out) throw new Error('Bos yanit');
        return out.trim();
    } catch (e) {
        console.warn('AI hatasi:', e);
        return null;
    }
}

/* --- Yerli NLU Motoru (Turkce) --- */
const MONTHS_TR = { 'ocak': 0, 'subat': 1, 'mart': 2, 'nisan': 3, 'mayis': 4, 'haziran': 5, 'temmuz': 6, 'agustos': 7, 'eylul': 8, 'ekim': 9, 'kasim': 10, 'aralik': 11 };
const WEEKDAYS_TR = { 'pazartesi': 1, 'sali': 2, 'carsamba': 3, 'persembe': 4, 'cuma': 5, 'cumartesi': 6, 'pazar': 0 };

function norm(s) {
    return s.toLocaleLowerCase('tr').replace(/[?.!,;:'"ı]/g, m => m === 'ı' ? 'i' : '').replace(/[çÇ]/g, 'c').replace(/[ğĞ]/g, 'g')
        .replace(/[öÖ]/g, 'o').replace(/[şŞ]/g, 's').replace(/[üÜ]/g, 'u').replace(/[İ]/g, 'i')
        .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function upcomingLines(limit) {
    const arr = events.filter(e => !e.completed).map(e => ({ e: e, d: daysUntil(nextOccurrence(e)) }))
        .filter(x => x.d >= 0).sort((a, b) => a.d - b.d).slice(0, limit || 6);
    if (!arr.length) return 'Yaklasan kayitli bir etkinlik yok. Eklemek ister misiniz?';
    return arr.map(x => '- ' + x.e.title + ': ' + (x.d === 0 ? 'BUGUN!' : x.d + ' gun sonra') + ' (' + TYPES[x.e.type].label + ')').join('\n');
}

function tryParseAdd(text) {
    // Ornek: "3 gun sonra toplanti ekle", "15 mayista anne dogum gunu ekle", "yarin kira odemesi ekle"
    const now = new Date();
    let target = null;
    let rest = text;

    const mDay = text.match(/(\d{1,2})[.\/ ](\d{1,2})(?:[.\/ ](\d{2,4}))?/);
    const mRel = text.match(/(\d+)\s*gun sonra/);
    const mMonth = text.match(/(\d{1,2})\s*([a-z]+)(?:\s*\d{4})?/);

    if (/bugun/.test(text)) { target = now; rest = rest.replace(/bugun/g, ''); }
    else if (/yarin/.test(text)) { const d = new Date(now); d.setDate(d.getDate() + 1); target = d; rest = rest.replace(/yarin/g, ''); }
    else if (/obur gun/.test(text)) { const d = new Date(now); d.setDate(d.getDate() + 2); target = d; rest = rest.replace(/obur gun/g, ''); }
    else if (/haftaya/.test(text)) { const d = new Date(now); d.setDate(d.getDate() + 7); target = d; rest = rest.replace(/haftaya/g, ''); }
    else if (mRel) { const d = new Date(now); d.setDate(d.getDate() + parseInt(mRel[1], 10)); target = d; rest = rest.replace(mRel[0], ''); }
    else if (mDay && !mMonth) {
        const dd = parseInt(mDay[1], 10), mm = parseInt(mDay[2], 10);
        if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) {
            let yy = mDay[3] ? parseInt(mDay[3], 10) : now.getFullYear();
            if (yy < 100) yy += 2000;
            let c = new Date(yy, mm - 1, dd);
            if (c < startOfDay(now) && !mDay[3]) c = new Date(yy + 1, mm - 1, dd);
            target = c; rest = rest.replace(mDay[0], '');
        }
    } else if (mMonth && MONTHS_TR[mMonth[2]] != null) {
        const dd = parseInt(mMonth[1], 10), mm = MONTHS_TR[mMonth[2]];
        let c = new Date(now.getFullYear(), mm, dd);
        if (c < startOfDay(now)) c = new Date(now.getFullYear() + 1, mm, dd);
        target = c; rest = rest.replace(mMonth[0], '');
    } else {
        for (const wd in WEEKDAYS_TR) {
            if (text.includes(wd)) {
                const diff = (WEEKDAYS_TR[wd] - now.getDay() + 7) % 7 || 7;
                const d = new Date(now); d.setDate(d.getDate() + diff);
                target = d; rest = rest.replace(wd, ''); break;
            }
        }
    }
    rest = rest.replace(/\b(ekle|kaydet|hatirlat|not al|planla|olustur)\b/g, '').replace(/\s+/g, ' ').trim();
    if (!rest || rest.length < 2) return null;
    if (!target) target = now;

    let type = 'ozel';
    if (/dogum gunu|dogumgunu/.test(rest)) type = 'dogum';
    else if (/yildonumu|evlilik/.test(rest)) type = 'yildonumu';
    else if (/fatura|odeme|kira|borc/.test(rest)) type = 'odeme';
    return { title: rest.charAt(0).toLocaleUpperCase('tr') + rest.slice(1), date: toISOLocal(target), type: type };
}

function localBrain(rawInput) {
    const t = norm(rawInput);

    /* --- Hesaplama --- */
    if (/^[0-9+\-*/().\s%]+$/.test(t) && /[0-9]/.test(t) && /[+\-*/]/.test(t)) {
        try {
            const val = Function('"use strict";return (' + t.replace(/%/g, '/100') + ')')();
            if (isFinite(val)) return 'Sonuc: ' + (Math.round(val * 10000) / 10000).toLocaleString('tr-TR');
        } catch (e) { /* dus */ }
    }

    /* --- Selamlasma / sosyal --- */
    if (/^(merhaba|selam|hey|gunaydin|iyi aksamlar|iyi gunler|naber|nasilsin)$/.test(t) || t.startsWith('merhaba') || t.startsWith('selam')) {
        return 'Merhaba! 👋 Size nasil yardimci olabilirim? Etkinlik ekleyebilir, hava durumu soyleyebilir, adimlarinizi takip edebilirim. "yardim" yazarak tum yeteneklerimi gorebilirsiniz.';
    }
    if (/tesekkur|sagol|eyvallah|cok yasa/.test(t)) return 'Rica ederim! Her zaman buradayim. 🧠';
    if (/kimsin|adin ne|sen neysin/.test(t)) return 'Ben Aklımda asistanıyim - dogum gunleri, odemeler, hava durumu, adim takibi ve daha fazlasini yoneten akilli yardimcınız.';

    /* --- Yardim --- */
    if (/yardim|ne yapabilirsin|ozellik|komut|yetenek/.test(t)) {
        return 'Yapabildiklerim:\n' +
            '• Etkinlik ekle: "3 gun sonra toplanti ekle", "15 mayista annem dogum gunu ekle"\n' +
            '• Sorgula: "yaklasan etkinlikler neler?", "kac gun kaldi?"\n' +
            '• Hava durumu: "hava nasil?", "yarin yagmur var mi"\n' +
            '• Adimlar: "kac adim attim?", "bugunku hedefim"\n' +
            '• Hediye: "esime ne hediye alayim"\n' +
            '• Hesaplama: "125 x 4 + 36"\n' +
            '• Diger: "haberler", "motivasyon", "espri"\n' +
            'Ayarlar dan OpenAI anahtari eklerseniz gercek yapay zeka ile konusabilirsiniz.';
    }

    /* --- Hava durumu --- */
    if (/hava|yagmur|kar|sicak|ruzgar|bulut|sis/.test(t)) {
        const wx = db.get(K.wx, null);
        if (!wx || !wx.data) return 'Henuz hava durumu verisi yok. Ana ekrandaki hava kartindan sehir secmelisiniz.';
        const cur = wx.data.current;
        const info = WMO[cur.weather_code] || ['', ''];
        const d0 = wx.data.daily;
        const tomorrow = WMO[d0.weather_code[1]] || ['', ''];
        return 'Simdi ' + settings.city.name + ': ' + Math.round(cur.temperature_2m) + ' derece, ' + info[0].toLocaleLowerCase('tr') +
            '. Hissedilen ' + Math.round(cur.apparent_temperature) + ', nem %' + cur.relative_humidity_2m +
            ', ruzgar ' + Math.round(cur.wind_speed_10m) + ' km/sa.\nYarin: ' + Math.round(d0.temperature_2m_min[1]) + '-' + Math.round(d0.temperature_2m_max[1]) + ' derece, ' + tomorrow[0].toLocaleLowerCase('tr') + '.';
    }

    /* --- Adimlar --- */
    if (/adim|yurudum|fitness|hedef/.test(t)) {
        const s = todaySteps(), goal = settings.stepGoal || 8000;
        const week = Object.values(getStepsData()).reduce((a, b) => a + b, 0);
        return 'Bugun ' + s.toLocaleString('tr-TR') + ' adim attiniz. Hedef ' + goal.toLocaleString('tr-TR') +
            (s >= goal ? ' - TEBRIKLER, hedef tamamlandi! 🎉' : ' - Kalan ' + (goal - s).toLocaleString('tr-TR') + ' adim. Hadi bir tur daha! 💪') +
            '\nToplam kayitli adim: ' + week.toLocaleString('tr-TR');
    }

    /* --- Haberler --- */
    if (/haber|gundem|son dakika/.test(t)) {
        const cache = db.get(K.news, null);
        if (!cache || !cache.items) return 'Haberler henuz yuklenmedi, birazdan tekrar deneyin.';
        return 'Guncel basliklar:\n' + cache.items.slice(0, 5).map((x, i) => (i + 1) + '. ' + x.title).join('\n');
    }

    /* --- Etkinlik ekleme --- */
    if (/\b(ekle|kaydet|hatirlat|not al|planla|olustur)\b/.test(t) && /\d|bugun|yarin|obur|haftaya|pazartesi|sali|carsamba|persembe|cuma|cumartesi|pazar/.test(t)) {
        const parsed = tryParseAdd(t);
        if (parsed) {
            events.push({ id: uid(), title: parsed.title, date: parsed.date, type: parsed.type, amount: null, relation: '', interests: '', budget: 'orta', notes: '', completed: false, createdAt: Date.now() });
            persist();
            return 'Kaydedildi ✅\n"' + parsed.title + '" - ' + formatDateTR(parseDate(parsed.date)) + ' (' + TYPES[parsed.type].label + ')\nListe guncellendi, geri sayim basladi!';
        }
    }

    /* --- Kac gun kaldi (etkinlik adi geciyorsa) --- */
    const words = t.split(' ').filter(w => w.length > 3);
    for (const ev of events) {
        const evWords = norm(ev.title).split(' ');
        if (words.some(w => evWords.includes(w)) && /kac gun|kaldi|nezaman|ne zaman|geri say/.test(t + ' ' + words.join(' '))) {
            const d = daysUntil(nextOccurrence(ev));
            return '"' + ev.title + '" icin ' + (d === 0 ? 'BUGUN zamanı geldi! 🎉' : d + ' gun kaldi.') + ' (' + formatDateTR(nextOccurrence(ev)) + ')';
        }
    }

    /* --- Listeleme --- */
    if (/yaklasan|etkinlik|hatirlat|neler var|listele|dogum gunu var|odeme var/.test(t)) {
        return 'Yaklasan kayitlariniz:\n' + upcomingLines(7);
    }

    /* --- Hediye --- */
    if (/hediye|ne alsam|ne alayim|hediye fikri/.test(t)) {
        const giftables = events.filter(e => (e.type === 'dogum' || e.type === 'yildonumu') && !e.completed)
            .sort((a, b) => daysUntil(nextOccurrence(a)) - daysUntil(nextOccurrence(b)));
        if (!giftables.length) return 'Hediye onerisi icin once bir dogum gunu veya yildonumu ekleyin. Kart uzerindeki "Hediye" butonuna basin.';
        const ev = giftables[0];
        const s = buildGiftSuggestions(ev).slice(0, 4);
        return 'En yakin: ' + ev.title + ' (' + daysUntil(nextOccurrence(ev)) + ' gun sonra)\nOnerilerim:\n' +
            s.map((g, i) => (i + 1) + '. ' + g.text + ' [' + g.tag + ']').join('\n');
    }

    /* --- Motivasyon / espri --- */
    if (/motivasyon|motive|gunun sozu|soz|vazgec/.test(t)) {
        const q = QUOTES[new Date().getDate() % QUOTES.length];
        return '💬 ' + q;
    }
    if (/fikra|espri|guldur|komik/.test(t)) {
        return JOKES[Math.floor(Math.random() * JOKES.length)];
    }

    /* --- Tarih / saat --- */
    if (/saat kac|tarih ne|bugun ne|gunlerden ne/.test(t)) {
        return 'Bugun ' + formatDateTR(new Date()) + ', saat ' + new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) + '.';
    }

    /* --- Bilinmeyen: akilli geri donus --- */
    return 'Bunu tam anlayamadim 😅 Deneyebilecekleriniz:\n' +
        '• "3 gun sonra toplanti ekle"\n' +
        '• "yaklasan etkinlikler neler?"\n' +
        '• "hava nasil?" / "kac adim attim?"\n' +
        '• "yardim" yazarak tum yetenekleri gorun.';
}

/* ==================== 13. AYARLAR ==================== */
function openSettings() {
    $('#setGoal').value = settings.stepGoal || 8000;
    $('#setAiKey').value = settings.aiKey || '';
    $('#setAiModel').value = settings.aiModel || 'gpt-4o-mini';
    const st = $('#chatAiStatus');
    st.textContent = settings.aiKey ? 'Yapay zeka ACIK (' + settings.aiModel + ')' : 'Yerli motor aktif (API anahtari eklerseniz gercek AI devreye girer)';
    st.style.color = settings.aiKey ? 'var(--success)' : 'var(--muted)';
    openModalEl('#settingsModal');
}
function saveSettings() {
    const goal = parseInt($('#setGoal').value, 10);
    if (!isNaN(goal) && goal > 0) settings.stepGoal = goal;
    settings.aiKey = $('#setAiKey').value.trim();
    settings.aiModel = $('#setAiModel').value.trim() || 'gpt-4o-mini';
    db.set(K.settings, settings);
    renderStepsUI();
    closeModalEl('#settingsModal');
    toast('Ayarlar kaydedildi.', 'success');
}

/* ==================== 14. YEDEKLEME ==================== */
function exportData() {
    const blob = new Blob([JSON.stringify({ app: 'aklimda', version: APP_VERSION, exportedAt: new Date().toISOString(), events: events }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'aklimda-yedek-' + todayISO() + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Yedek dosyasi indirildi.', 'success');
}
function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const parsed = JSON.parse(reader.result);
            const arr = Array.isArray(parsed) ? parsed : parsed.events;
            if (!Array.isArray(arr)) throw new Error();
            let added = 0;
            arr.forEach(item => {
                if (!item || !item.title || !item.date) return;
                const clean = {
                    id: String(item.id || uid()),
                    type: TYPES[item.type] ? item.type : 'ozel',
                    title: String(item.title),
                    date: /^\d{4}-\d{2}-\d{2}$/.test(item.date) ? item.date : todayISO(),
                    amount: item.amount ? Number(item.amount) : null,
                    relation: String(item.relation || ''), interests: String(item.interests || ''),
                    budget: GIFT_BUDGETS[item.budget] ? item.budget : 'orta',
                    notes: String(item.notes || ''), completed: Boolean(item.completed),
                    createdAt: Number(item.createdAt) || Date.now()
                };
                const idx = events.findIndex(e => e.id === clean.id);
                if (idx >= 0) events[idx] = clean; else events.push(clean);
                added++;
            });
            persist();
            toast(added + ' kayit iceri aktarildi.', 'success');
        } catch (e) { toast('Gecersiz yedek dosyasi.', 'error'); }
    };
    reader.readAsText(file);
}
async function resetData() {
    const ok = await showConfirm({ title: 'Tum Veriler Silinsin mi?', text: 'Kayitlar, adimlar ve ayarlar silinecek.', confirmText: 'Evet, Hepsini Sil' });
    if (!ok) return;
    events = [];
    persist();
    toast('Veriler temizlendi.', 'info');
}

/* ==================== 15. ORNEK VERI ==================== */
function addSampleData() {
    const base = new Date();
    const add = n => { const d = new Date(base); d.setDate(d.getDate() + n); return toISOLocal(d); };
    const y = base.getFullYear();
    [
        { type: 'dogum', title: 'Annemin Dogum Gunu', date: add(4), relation: 'Anne', interests: 'kitap, yemek', budget: 'orta', notes: 'Kirmizi cicek seviyor' },
        { type: 'dogum', title: 'Esimin Dogum Gunu', date: add(12), relation: 'Es', interests: 'kahve, muzik', budget: 'luks' },
        { type: 'yildonumu', title: 'Evlilik Yildonumumuz', date: y - 5 + '-' + pad2(base.getMonth() + 1) + '-' + pad2(Math.min(base.getDate() + 20, 28)), relation: 'Es', interests: 'seyahat', budget: 'luks' },
        { type: 'odeme', title: 'Kira Odemesi', date: add(6), amount: 15000 },
        { type: 'odeme', title: 'Elektrik Faturasi', date: add(9), amount: 850 },
        { type: 'ozel', title: 'Arac Muayene Tarihi', date: add(25), notes: 'Randevu almayi unutma' }
    ].forEach(s => events.push(Object.assign({ id: uid(), amount: null, relation: '', interests: '', notes: '', completed: false, createdAt: Date.now() }, s)));
    persist();
    toast('Ornek kayitlar eklendi.', 'success');
}

/* ==================== 16. OLAYLAR ==================== */
function bindEvents() {
    $('#themeToggle').addEventListener('click', toggleTheme);
    $('#exportBtn').addEventListener('click', exportData);
    $('#importBtn').addEventListener('click', () => $('#importFile').click());
    $('#importFile').addEventListener('change', e => { if (e.target.files[0]) importData(e.target.files[0]); e.target.value = ''; });
    $('#resetBtn').addEventListener('click', resetData);
    $('#assistantBtn').addEventListener('click', openChat);
    $('#chatClose').addEventListener('click', closeChat);
    $('#chatOverlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeChat(); });
    $('#chatSend').addEventListener('click', () => sendUserMessage());
    $('#chatInput').addEventListener('keydown', e => { if (e.key === 'Enter') sendUserMessage(); });
    $('#chatSettings').addEventListener('click', openSettings);
    $$('.chat-chip').forEach(c => c.addEventListener('click', () => sendUserMessage(c.dataset.q)));
    $('#saveSettings').addEventListener('click', saveSettings);

    $('#searchInput').addEventListener('input', e => { ui.search = e.target.value.trim(); renderList(); });
    $('#sortSelect').addEventListener('change', e => { ui.sort = e.target.value; renderList(); });

    $('#filterBar').addEventListener('click', e => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;
        ui.filter = btn.dataset.filter;
        $$('.filter-btn').forEach(b => b.classList.toggle('active', b === btn));
        renderList();
    });

    $('#eventList').addEventListener('click', e => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const id = btn.dataset.id;
        const map = { complete: toggleComplete, edit: openEventModal, gift: openGiftModal, delete: removeEvent };
        map[btn.dataset.action] && map[btn.dataset.action](id);
    });

    $('#addBtn').addEventListener('click', () => openEventModal());
    $('#eventType').addEventListener('change', syncFormFields);
    $('#eventForm').addEventListener('submit', saveEvent);
    $('#cancelForm').addEventListener('click', () => closeModalEl('#eventModal'));
    $('#sampleBtn').addEventListener('click', addSampleData);

    $('#stepsToggle').addEventListener('click', () => { stepState.on ? stopSteps() : startSteps(); });
    $('#stepsSetBtn').addEventListener('click', setStepsManual);
    $('#stepsInput').addEventListener('keydown', e => { if (e.key === 'Enter') setStepsManual(); });

    // Modal kapatma: arka plan + Esc + X isaretleri
    $$('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) closeAllModals(); }));
    $$('[data-close]').forEach(b => b.addEventListener('click', () => closeModalEl(b.closest('.modal'))));
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            if ($('#chatOverlay').classList.contains('open')) closeChat();
            else closeAllModals();
        }
    });
}

/* ==================== 17. SERVICE WORKER ==================== */
function registerSW() {
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW hatasi:', err));
        });
    }
}

/* ==================== 18. BASLATMA ==================== */
function init() {
    initTheme();
    bindEvents();
    render();
    renderStepsUI();
    loadWeather();
    loadNews();
    setInterval(loadNews, 20 * 60 * 1000);
    registerSW();
    console.log('%cAklımda v' + APP_VERSION + ' hazir', 'color:#6366f1;font-weight:bold;font-size:14px');
}
document.addEventListener('DOMContentLoaded', init);
