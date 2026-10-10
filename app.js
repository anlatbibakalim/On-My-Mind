/* ============================================================
   AKLIMDA v3.1 - Akıllı Kişisel Asistan
   Katmanlar: Yardımcılar | Depolama | Tekrar mantığı | Arayüz
              Sağlık | Takvim | Kayıtlar | Hava | Haber | Asistan
   ============================================================ */
'use strict';

const APP_VERSION = '3.1.0';
const K = {
    events: 'aklimda_events_v3',
    eventsV2: 'aklimda_events_v2',
    eventsV1: 'aklimda_events',
    settings: 'aklimda_settings_v3',
    steps: 'aklimda_steps_v3',
    health: 'aklimda_health_v2',
    news: 'aklimda_news_v3',
    wx: 'aklimda_wx_v3',
    theme: 'aklimda_theme',
    notified: 'aklimda_notified'
};
const URGENT_DAYS = 7;
const STEP_HISTORY_DAYS = 90;

const TYPES = {
    dogum:     { label: 'Doğum Günü',   icon: 'fa-cake-candles',        color: '#f59e0b', recurrence: 'yearly'  },
    yildonumu: { label: 'Yıldönümü',    icon: 'fa-heart',               color: '#ec4899', recurrence: 'yearly'  },
    odeme:     { label: 'Ödeme',        icon: 'fa-file-invoice-dollar', color: '#ef4444', recurrence: 'monthly' },
    ozel:      { label: 'Özel Gün',     icon: 'fa-star',                color: '#10b981', recurrence: 'none'    }
};
const REC_LABEL = { none: 'Tek seferlik', yearly: 'Her yıl tekrarlar', monthly: 'Her ay tekrarlar' };

const WMO = {
    0: ['Açık', 'fa-sun'], 1: ['Az Bulutlu', 'fa-cloud-sun'], 2: ['Parçalı Bulutlu', 'fa-cloud-sun'],
    3: ['Kapalı', 'fa-cloud'], 45: ['Sisli', 'fa-smog'], 48: ['Kırağılı Sis', 'fa-smog'],
    51: ['Hafif Çisenti', 'fa-cloud-rain'], 53: ['Çisenti', 'fa-cloud-rain'], 55: ['Yoğun Çisenti', 'fa-cloud-rain'],
    56: ['Donan Çisenti', 'fa-cloud-rain'], 57: ['Donan Çisenti', 'fa-cloud-rain'],
    61: ['Hafif Yağmur', 'fa-cloud-rain'], 63: ['Yağmurlu', 'fa-cloud-rain'], 65: ['Şiddetli Yağmur', 'fa-cloud-showers-heavy'],
    66: ['Donan Yağmur', 'fa-cloud-rain'], 67: ['Donan Yağmur', 'fa-cloud-showers-heavy'],
    71: ['Hafif Kar', 'fa-snowflake'], 73: ['Karlı', 'fa-snowflake'], 75: ['Yoğun Kar', 'fa-snowflake'], 77: ['Kar Taneleri', 'fa-snowflake'],
    80: ['Sağanak', 'fa-cloud-showers-heavy'], 81: ['Sağanak', 'fa-cloud-showers-heavy'], 82: ['Şiddetli Sağanak', 'fa-cloud-showers-heavy'],
    85: ['Kar Sağanağı', 'fa-snowflake'], 86: ['Kar Sağanağı', 'fa-snowflake'],
    95: ['Gök Gürültülü Fırtına', 'fa-cloud-bolt'], 96: ['Dolu', 'fa-cloud-bolt'], 99: ['Dolu', 'fa-cloud-bolt']
};

/* Hediye öneri veritabanı (anahtarlar aksan duyarsız eşleşir) */
const GIFT_KEYWORDS = {
    'kahve':     ['Özel nitelikli kahve çekirdeği aboneliği', 'French press veya cezve hediye seti', 'İsme özel seramik kahve kupası'],
    'kitap':     ['Yılın en çok satan kitap seti', 'Kişiselleştirilmiş deri kitap kılıfı', 'Sahaftan nadir baskı bir kitap'],
    'muzik':     ['Kablosuz kulaklık', 'Plak koleksiyonu', 'Konser veya festival bileti'],
    'spor':      ['Akıllı bileklik veya spor saati', 'Kaliteli spor eşofman seti', 'Spor salonu üyelik paketi'],
    'teknoloji': ['Akıllı ev asistanı cihazı', 'Kablosuz şarj istasyonu', 'Taşınabilir projektör'],
    'yemek':     ['Restoranda tadım menüsü', 'El yapımı baharat koleksiyonu', 'Şef atölyesi deneyimi'],
    'seyahat':   ['Hafta sonu kaçamağı otel kuponu', 'Kişiye özel deri pasaportluk', 'Seyahat boyu bakım seti'],
    'borsa':     ['Ekonomi klasikleri kitap seti', 'Finans dergisi yıllık aboneliği', 'İsme özel deri portföy çantası'],
    'oyun':      ['Kutu oyunu veya strateji oyunu', 'Oyun kumandası', 'Dijital oyun hediye kartı'],
    'film':      ['Sinema bileti paketi', 'Yayın platformu hediye kartı', 'Koleksiyon film posteri'],
    'fotograf':  ['Anında baskı veren fotoğraf makinesi', 'Fotoğraf albümü seti', 'Telefon için lens seti'],
    'bahce':     ['Mini bitki bahçesi kiti', 'Kaliteli bahçe makası seti', 'Çiçek tohumu koleksiyonu'],
    'doga':      ['Kamp ve yürüyüş sırt çantası', 'Termos ve su geçirmez mont', 'Doğa yürüyüşü rehberli gün']
};
const GIFT_RELATION = [
    { re: /\b(es|esim\w*|hanim\w*|kocam\w*|karim\w*)\b/,        gifts: ['Birlikte romantik hafta sonu kaçamağı', 'İsme özel yıldız haritası baskısı', 'El yazılı mektuplu anı kutusu'] },
    { re: /sevgili|nisanli|erkek arkadas|kiz arkadas/,     gifts: ['Birlikte romantik akşam yemeği', 'Çiftlere özel bileklik seti', 'Anı fotoğraflarından karikatür'] },
    { re: /\b(anne|annem|annecigim|anneanne|babaanne|teyze|hala)/, gifts: ['Spa ve masaj günü deneyimi', 'Kişiye özel çiçek aboneliği', 'El işi takı veya ipek şal'] },
    { re: /\b(baba|babam|dede|amca|day[ia])/,              gifts: ['Deri cüzdan ve kemer seti', 'Klasik saat veya akıllı bileklik', 'Aile aktivite günü'] },
    { re: /cocu|\b(oglum|kizim|evlat|yegen|torun)/,        gifts: ['Eğitici robotik oyuncak', 'Bilim deney seti', 'İsmiyle kişisel hikâye kitabı'] },
    { re: /kardes|\b(abi|abim|abla|ablam)\b/,              gifts: ['Birlikte deneyim günü (kart, bowling, kaçış odası)', 'Kişiye özel karikatür portre', 'Hobisine uygun aksesuar'] },
    { re: /arkadas|dost/,                                  gifts: ['Birlikte kaçış odası veya bowling günü', 'Retro oyun konsolu', 'Kişiye özel karikatür portre'] },
    { re: /\b(is|mudur|patron|kolega|calisma)\b/,          gifts: ['Şık masaüstü ofis seti', 'Kahve aboneliği veya tadım seti', 'Kaliteli defter ve kalem'] }
];
const GIFT_BUDGETS = {
    ekonomik: ['El yapımı mum ve çikolata seti', 'İsme özel kupa ve not kartları', 'Mini bitki bahçesi kiti'],
    orta:     ['Kablosuz kulaklık', 'Kişiselleştirilmiş anı albümü', 'Gurme kahve veya çay tadım seti'],
    luks:     ['Akıllı saat', 'Butik otelde hafta sonu konaklaması', 'Tasarım marka aksesuar']
};

const QUOTES = [
    'Başarı, her gün atılan küçük adımların toplamıdır.',
    'En karanlık gece bile sona erer ve güneş doğar. - Victor Hugo',
    'Bugün yapabileceğin şeyi yarına bırakma. - Benjamin Franklin',
    'Zihin ne kadar sakin olursa, hedef o kadar net görünür.',
    'Küçük ilerlemeler, büyük dönüşümlerin temelidir.',
    'Kendine iyi davran; en uzun ilişkin kendinle olandır.',
    'Disiplin, istek ile hedef arasındaki köprüdür.',
    'Yolun yarısı, başlamaya karar vermektir.'
];
const JOKES = [
    'Bilgisayar neden doktora gitmiş? Çünkü virüs kapmış!',
    'Matematik kitabı neden üzgünmüş? Çünkü içinde çok problem varmış!',
    'Yazılımcı neden karanlıkta çalışırmış? Çünkü ışık bug çekermiş!',
    'Adım sayar demiş ki: "Bugün de seninleyim, yürü!"'
];

/* ==================== YARDIMCILAR ==================== */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const pad2 = n => String(n).padStart(2, '0');
const toISOLocal = d => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
const todayISO = () => toISOLocal(new Date());
const startOfDay = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function parseDate(iso) { const p = iso.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
function safeDate(y, m, day) { const last = new Date(y, m + 1, 0).getDate(); return new Date(y, m, Math.min(day, last)); }
function daysUntil(date) { return Math.round((startOfDay(date) - startOfDay(new Date())) / 86400000); }
function fmtTL(n) { return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n || 0); }
function formatDateTR(date, withYear) {
    return date.toLocaleDateString('tr-TR', Object.assign({ day: 'numeric', month: 'long' }, withYear ? { year: 'numeric' } : {}));
}
function formatLongTR(iso) {
    return parseDate(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
}
/* Türkçe karakterleri ASCII'ye indirger; uzunluğu korur (indeks eşlemesi için) */
const FOLD_MAP = { 'ı': 'i', 'ğ': 'g', 'ü': 'u', 'ş': 's', 'ö': 'o', 'ç': 'c', 'â': 'a', 'î': 'i', 'û': 'u' };
function fold(s) {
    let out = '';
    for (let i = 0; i < s.length; i++) {
        const lower = s[i].toLocaleLowerCase('tr');
        const c = lower.length === 1 ? lower : s[i].toLowerCase()[0] || ' ';
        out += FOLD_MAP[c] || (/[a-z0-9]/.test(c) ? c : ' ');
    }
    return out;
}

/* ==================== TEKRAR MANTIĞI ==================== */
const recOf = ev => (TYPES[ev.type] || TYPES.ozel).recurrence;

function nextOccurrence(ev) {
    const today = startOfDay(new Date());
    const orig = parseDate(ev.date);
    if (orig >= today) return orig;
    const rec = recOf(ev);
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
/* Verilen gün (YYYY-MM-DD) bu kayıt için bir "oluş" günü mü? (yerel saat, UTC kayması yok) */
function occursOn(ev, iso) {
    const o = parseDate(ev.date), d = parseDate(iso);
    if (d < o) return false;
    const rec = recOf(ev);
    if (rec === 'yearly') return safeDate(d.getFullYear(), o.getMonth(), o.getDate()).getTime() === d.getTime();
    if (rec === 'monthly') return safeDate(d.getFullYear(), d.getMonth(), o.getDate()).getTime() === d.getTime();
    return ev.date === iso;
}
/* Tekrarlayan kayıtlar oluş bazında tamamlanır: ödenen fatura gelecek ay yeniden aktif olur */
function isDone(ev) {
    if (recOf(ev) === 'none') return !!ev.completed;
    return !!ev.doneFor && ev.doneFor === toISOLocal(nextOccurrence(ev));
}
function milestoneText(ev, occ) {
    const n = occ.getFullYear() - parseDate(ev.date).getFullYear();
    if (n < 1 || recOf(ev) !== 'yearly') return '';
    return ev.type === 'dogum' ? n + '. yaş' : n + '. yıl';
}

/* ==================== DEPOLAMA ==================== */
const db = {
    get(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } },
    set(key, val) {
        try { localStorage.setItem(key, JSON.stringify(val)); return true; }
        catch (e) { toast('Depolama alanı dolu ya da kullanılamıyor.', 'error'); return false; }
    },
    del(key) { try { localStorage.removeItem(key); } catch (e) { /* yoksay */ } }
};

function normalizeEvent(item) {
    item = item || {};
    const type = TYPES[item.type] ? item.type : 'ozel';
    const ev = {
        id: String(item.id || uid()).replace(/[^\w-]/g, '').slice(0, 40) || uid(),
        type: type,
        title: String(item.title || 'İsimsiz').slice(0, 80),
        date: /^\d{4}-\d{2}-\d{2}$/.test(item.date) && !isNaN(parseDate(item.date)) ? item.date : todayISO(),
        amount: item.amount != null && item.amount !== '' && isFinite(Number(item.amount)) && Number(item.amount) >= 0 ? Number(item.amount) : null,
        relation: String(item.relation || '').slice(0, 40),
        interests: String(item.interests || '').slice(0, 120),
        budget: GIFT_BUDGETS[item.budget] ? item.budget : 'orta',
        notes: String(item.notes || '').slice(0, 300),
        completed: Boolean(item.completed),
        doneFor: typeof item.doneFor === 'string' ? item.doneFor : '',
        createdAt: Number(item.createdAt) || Date.now()
    };
    // Eski sürümden: tekrarlayan kayıt "tamamlandı" ise mevcut oluş için tamamlanmış say
    if (recOf(ev) !== 'none' && ev.completed) {
        ev.doneFor = toISOLocal(nextOccurrence(ev));
        ev.completed = false;
    }
    return ev;
}
function normalizeList(arr) {
    const seen = new Set();
    return arr.map(normalizeEvent).filter(ev => { if (seen.has(ev.id)) return false; seen.add(ev.id); return true; });
}
function loadEvents() {
    let raw = db.get(K.events, null);
    if (!raw) raw = db.get(K.eventsV2, null);
    if (!raw) raw = db.get(K.eventsV1, null);
    return Array.isArray(raw) ? normalizeList(raw) : [];
}

let events = loadEvents();
let settings = Object.assign({ city: null, stepGoal: 8000, aiKey: '', aiModel: 'gpt-4o-mini', notify: false }, db.get(K.settings, {}));
const profile = (function () {
    const saved = db.get(K.health, {});
    const p = { gender: 'male', height: 170, weight: 70, age: 30 };
    if (saved.gender === 'male' || saved.gender === 'female') p.gender = saved.gender;
    if (Number(saved.height) >= 100 && Number(saved.height) <= 250) p.height = Number(saved.height);
    if (Number(saved.weight) >= 30 && Number(saved.weight) <= 300) p.weight = Number(saved.weight);
    if (Number(saved.age) >= 5 && Number(saved.age) <= 120) p.age = Number(saved.age);
    return p;
})();
const ui = { filter: 'all', search: '', sort: 'urgency' };

function persist() { db.set(K.events, events); render(); }

/* ==================== TEMA ==================== */
function applyThemeMeta(t) {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#0b1120' : '#eef2f9');
}
function initTheme() {
    const t = document.documentElement.dataset.theme;
    $('#themeToggle').innerHTML = '<i class="fa-solid ' + (t === 'dark' ? 'fa-sun' : 'fa-moon') + '"></i>';
    $('#themeToggle').title = t === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç';
    applyThemeMeta(t);
}
function toggleTheme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    db.set(K.theme, next);
    initTheme();
}

/* ==================== TOAST ==================== */
const TOAST_ICONS = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-circle-info' };
function toast(message, type, action) {
    type = type || 'info';
    const box = $('#toastContainer');
    if (!box) return;
    const el = document.createElement('div');
    el.className = 'toast toast-' + type;
    el.setAttribute('role', 'status');
    el.innerHTML = '<i class="fa-solid ' + TOAST_ICONS[type] + '"></i><span>' + escapeHtml(message) + '</span>' +
        (action ? '<button class="toast-action">' + escapeHtml(action.label) + '</button>' : '');
    box.appendChild(el);
    let done = false;
    const dismiss = () => { if (done) return; done = true; el.classList.add('hide'); setTimeout(() => el.remove(), 320); };
    if (action) $('.toast-action', el).addEventListener('click', () => { action.fn(); dismiss(); });
    setTimeout(dismiss, action ? 7000 : 3800);
}

/* ==================== MODAL (odak yönetimi dahil) ==================== */
const modalFocus = [];
function openModalEl(sel) {
    modalFocus.push(document.activeElement);
    $(sel).classList.add('open');
    document.body.classList.add('modal-open');
}
function closeModalEl(sel) {
    const el = typeof sel === 'string' ? $(sel) : sel;
    if (!el || !el.classList.contains('open')) return;
    el.classList.remove('open');
    if (!$$('.modal.open').length && !$('#chatOverlay').classList.contains('open') && !$('#hm-overlay').classList.contains('hm-open')) {
        document.body.classList.remove('modal-open');
    }
    const back = modalFocus.pop();
    if (back && back.focus) back.focus();
}
function closeAllModals() {
    $$('.modal.open').forEach(m => closeModalEl(m));
}
function trapFocus(e) {
    if (e.key !== 'Tab') return;
    const open = $$('.modal.open');
    const scope = open.length ? open[open.length - 1] : ($('#chatOverlay').classList.contains('open') ? $('.chat-panel') : null);
    if (!scope) return;
    const items = $$('a[href], button:not([disabled]), input:not([type="hidden"]):not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])', scope)
        .filter(n => n.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
    else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
}

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
        no.focus();
    });
}

/* ==================== SAĞLIK & ADIM MODÜLÜ ==================== */
const STEP_THRESHOLD = 1.2;     // m/s² (yerçekimi çıkarıldıktan sonra)
const STEP_MIN_GAP = 300;       // ms

const stepHistory = (function () {
    const raw = db.get(K.steps, {});
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
})();
const stepState = {
    on: false, day: todayISO(), count: 0, unsaved: 0,
    last: 0, gravity: null, lastT: 0, above: false, samples: 0,
    supported: typeof window !== 'undefined' && 'DeviceMotionEvent' in window,
    wakeLock: null, probe: null
};
stepState.count = Number(stepHistory[stepState.day]) || 0;

function saveSteps() {
    stepHistory[stepState.day] = stepState.count;
    const keys = Object.keys(stepHistory).sort();
    keys.slice(0, Math.max(0, keys.length - STEP_HISTORY_DAYS)).forEach(k => delete stepHistory[k]);
    db.set(K.steps, stepHistory);
    stepState.unsaved = 0;
}
function rolloverDay() {
    const t = todayISO();
    if (stepState.day === t) return;
    saveSteps();
    stepState.day = t;
    stepState.count = Number(stepHistory[t]) || 0;
    stepState.unsaved = 0;
}
function getSteps() { rolloverDay(); return stepState.count; }
function setSteps(n) { rolloverDay(); stepState.count = n; saveSteps(); updateHealthUI(); }

function calcHealth(steps) {
    const strideM = profile.height * (profile.gender === 'male' ? 0.415 : 0.413) / 100;
    const distanceKm = steps * strideM / 1000;
    const kcal = Math.round(steps * profile.weight * 0.00057);
    // Tudor-Locke sınıflaması
    let level = 'Hareketsiz';
    if (steps >= 12500) level = 'Çok Aktif';
    else if (steps >= 10000) level = 'Aktif';
    else if (steps >= 7500) level = 'Orta Aktif';
    else if (steps >= 5000) level = 'Az Aktif';
    return { distanceKm: distanceKm, kcal: kcal, level: level };
}
function updateHealthUI() {
    const steps = getSteps();
    const r = calcHealth(steps);
    $('#ringSteps').textContent = steps.toLocaleString('tr-TR');
    $('#resDistance').textContent = r.distanceKm.toFixed(2).replace('.', ',') + ' km';
    $('#resCalories').textContent = r.kcal.toLocaleString('tr-TR') + ' kcal';
    $('#resLevel').textContent = r.level;

    const goal = settings.stepGoal || 8000;
    const pct = Math.min(1, steps / goal);
    const circ = 2 * Math.PI * 48;
    $('#ringFill').style.strokeDashoffset = circ * (1 - pct);
    $('#ringLabel').textContent = pct >= 1 ? 'HEDEF!' : 'adım';

    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = toISOLocal(d);
        days.push({ lbl: d.toLocaleDateString('tr-TR', { weekday: 'narrow' }), n: i === 0 ? steps : (Number(stepHistory[key]) || 0), today: i === 0 });
    }
    const max = Math.max(1, ...days.map(d => d.n));
    $('#stepsWeek').innerHTML = days.map(d =>
        '<div class="sw-col"><div class="sw-bar ' + (d.today ? 'today' : '') + '" style="height:' + Math.max(3, (d.n / max) * 100) +
        '%" title="' + d.n.toLocaleString('tr-TR') + ' adım"></div><span class="sw-lbl">' + d.lbl + '</span></div>').join('');
}
function readProfileInputs() {
    const g = $('#hpGender').value;
    const h = parseFloat($('#hpHeight').value), w = parseFloat($('#hpWeight').value), a = parseInt($('#hpAge').value, 10);
    if (g === 'male' || g === 'female') profile.gender = g;
    if (h >= 100 && h <= 250) profile.height = h;
    if (w >= 30 && w <= 300) profile.weight = w;
    if (a >= 5 && a <= 120) profile.age = a;
    db.set(K.health, profile);
    updateHealthUI();
}
function initHealthModule() {
    $('#hpGender').value = profile.gender;
    $('#hpHeight').value = profile.height;
    $('#hpWeight').value = profile.weight;
    $('#hpAge').value = profile.age;
    $$('#hpGender, #hpHeight, #hpWeight, #hpAge').forEach(el => el.addEventListener('input', readProfileInputs));
    $('#stepsSetBtn').addEventListener('click', () => {
        const v = parseInt($('#stepsInput').value, 10);
        if (isNaN(v) || v < 0 || v > 200000) { toast('Geçerli bir adım sayısı girin (0 - 200.000).', 'error'); return; }
        setSteps(v);
        $('#stepsInput').value = '';
        toast('Adım sayısı güncellendi: ' + v.toLocaleString('tr-TR'), 'success');
    });
    $('#stepsInput').addEventListener('keydown', e => { if (e.key === 'Enter') $('#stepsSetBtn').click(); });
    updateHealthUI();
}

function registerStep() {
    rolloverDay();
    stepState.count++;
    stepState.unsaved++;
    if (stepState.unsaved >= 10) saveSteps();
    updateHealthUI();
}
/* Yerçekimi alçak geçiren filtreyle ayrıştırılır; kalan ivmedeki tepe noktaları adım sayılır */
function onMotion(e) {
    const a = e.accelerationIncludingGravity;
    if (!a || (a.x == null && a.y == null && a.z == null)) return;
    stepState.samples++;
    const m = Math.hypot(a.x || 0, a.y || 0, a.z || 0);
    const now = Date.now();
    if (stepState.gravity == null) { stepState.gravity = m; stepState.lastT = now; return; }
    const dt = Math.max(1, now - stepState.lastT) / 1000;
    stepState.lastT = now;
    const alpha = Math.exp(-dt / 0.8);
    stepState.gravity = alpha * stepState.gravity + (1 - alpha) * m;
    const dyn = m - stepState.gravity;
    if (!stepState.above && dyn > STEP_THRESHOLD && now - stepState.last > STEP_MIN_GAP) {
        stepState.above = true;
        stepState.last = now;
        registerStep();
    } else if (stepState.above && dyn < STEP_THRESHOLD * 0.4) {
        stepState.above = false;
    }
}
async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator && stepState.on && !stepState.wakeLock) {
            stepState.wakeLock = await navigator.wakeLock.request('screen');
            stepState.wakeLock.addEventListener('release', () => { stepState.wakeLock = null; });
        }
    } catch (e) { /* desteklenmiyor ya da reddedildi */ }
}
function releaseWakeLock() {
    if (stepState.wakeLock) { stepState.wakeLock.release().catch(() => { }); stepState.wakeLock = null; }
}
function startSteps() {
    if (!stepState.supported) { toast('Cihazınız hareket sensörünü desteklemiyor. Adımı elle girebilirsiniz.', 'error'); return; }
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission().then(r => {
            if (r === 'granted') attachMotion();
            else toast('Hareket izni verilmedi.', 'error');
        }).catch(() => toast('Hareket izni alınamadı.', 'error'));
    } else {
        attachMotion();
    }
}
function attachMotion() {
    if (stepState.on) return;
    stepState.on = true;
    stepState.samples = 0;
    stepState.gravity = null;
    stepState.above = false;
    window.addEventListener('devicemotion', onMotion);
    $('#stepsToggle').innerHTML = '<i class="fa-solid fa-pause"></i> Sayacı Durdur';
    $('#stepsToggle').setAttribute('aria-pressed', 'true');
    requestWakeLock();
    toast('Adım sayacı çalışıyor. Ekran açık kalmalı.', 'success');
    clearTimeout(stepState.probe);
    stepState.probe = setTimeout(() => {
        if (stepState.on && stepState.samples === 0) {
            toast('Sensör verisi alınamıyor. Tarayıcı iznini kontrol edin ya da adımı elle girin.', 'error');
        }
    }, 3000);
}
function stopSteps() {
    stepState.on = false;
    window.removeEventListener('devicemotion', onMotion);
    clearTimeout(stepState.probe);
    releaseWakeLock();
    saveSteps();
    $('#stepsToggle').innerHTML = '<i class="fa-solid fa-play"></i> Sayacı Başlat';
    $('#stepsToggle').setAttribute('aria-pressed', 'false');
}

/* ==================== TAKVİM (AGENDA) ==================== */
const monthNamesTR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const agenda = { year: new Date().getFullYear(), month: new Date().getMonth(), selected: todayISO() };

function agendaShift(delta) {
    const d = new Date(agenda.year, agenda.month + delta, 1);
    agenda.year = d.getFullYear();
    agenda.month = d.getMonth();
    renderAgenda();
}
function renderAgenda() {
    const year = agenda.year, month = agenda.month;
    $('#agendaMonthYear').innerHTML = '<i class="fa-solid fa-calendar-days" style="color:var(--accent);"></i> ' + monthNamesTR[month] + ' ' + year;
    const grid = $('#agendaDaysGrid');
    const frag = document.createDocumentFragment();

    const first = new Date(year, month, 1).getDay();
    const lead = first === 0 ? 6 : first - 1;                      // Pazartesi başlangıç
    const total = new Date(year, month + 1, 0).getDate();
    const prevTotal = new Date(year, month, 0).getDate();
    for (let i = lead; i > 0; i--) {
        const cell = document.createElement('div');
        cell.className = 'agenda-day other-month';
        cell.setAttribute('aria-hidden', 'true');
        cell.textContent = prevTotal - i + 1;
        frag.appendChild(cell);
    }
    const todayStr = todayISO();
    for (let i = 1; i <= total; i++) {
        const iso = year + '-' + pad2(month + 1) + '-' + pad2(i);
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'agenda-day';
        cell.textContent = i;
        cell.setAttribute('aria-label', formatDateTR(parseDate(iso), true));
        if (iso === todayStr) { cell.classList.add('today'); cell.setAttribute('aria-current', 'date'); }
        if (iso === agenda.selected) { cell.classList.add('selected'); cell.setAttribute('aria-pressed', 'true'); }
        if (events.some(ev => occursOn(ev, iso))) {
            const dot = document.createElement('span');
            dot.className = 'agenda-dot';
            cell.appendChild(dot);
        }
        cell.addEventListener('click', () => { agenda.selected = iso; renderAgenda(); });
        frag.appendChild(cell);
    }
    const used = lead + total;
    for (let i = 1; i <= (7 - used % 7) % 7; i++) {
        const cell = document.createElement('div');
        cell.className = 'agenda-day other-month';
        cell.setAttribute('aria-hidden', 'true');
        cell.textContent = i;
        frag.appendChild(cell);
    }
    grid.innerHTML = '';
    grid.appendChild(frag);
    renderAgendaEvents();
}
function renderAgendaEvents() {
    const isToday = agenda.selected === todayISO();
    $('#agendaSelectedTitle').textContent = formatLongTR(agenda.selected) + (isToday ? ' (Bugün)' : '');
    const listEl = $('#agendaEventsList');
    const matching = events.filter(ev => occursOn(ev, agenda.selected));
    if (!matching.length) {
        listEl.innerHTML = '<p class="agenda-empty">Bu güne ait kayıt yok. "Bu Güne Ekle" ile oluşturabilirsiniz.</p>';
        return;
    }
    listEl.innerHTML = '';
    matching.forEach(ev => {
        const t = TYPES[ev.type];
        const item = document.createElement('div');
        item.className = 'agenda-event-item' + (isDone(ev) ? ' done' : '');
        item.style.borderLeftColor = t.color;
        item.tabIndex = 0;
        item.setAttribute('role', 'button');
        item.innerHTML = '<span><b>' + escapeHtml(ev.title) + '</b> (' + t.label + ')</span><i class="fa-solid fa-chevron-right" style="font-size:0.7rem;color:var(--muted);"></i>';
        const open = () => openEventModal(ev.id);
        item.addEventListener('click', open);
        item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
        listEl.appendChild(item);
    });
}

/* ==================== KAYIT CRUD ==================== */
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
    $('#eventDate').value = agenda.selected || todayISO();
    if (id) {
        const ev = events.find(e => e.id === id);
        if (!ev) return;
        $('#modalTitle').textContent = 'Kaydı Düzenle';
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
        $('#modalTitle').textContent = 'Yeni Kayıt Ekle';
    }
    syncFormFields();
    openModalEl('#eventModal');
    setTimeout(() => $('#eventTitle').focus(), 60);
}
function saveEvent(e) {
    e.preventDefault();
    const id = $('#fieldId').value;
    const type = $('#eventType').value;
    const amountRaw = $('#eventAmount').value;
    const data = {
        type: type,
        title: $('#eventTitle').value.trim(),
        date: $('#eventDate').value,
        amount: type === 'odeme' && amountRaw !== '' ? Number(amountRaw) : null,
        relation: $('#giftRelation').value.trim(),
        interests: $('#giftInterests').value.trim(),
        budget: $('#giftBudget').value,
        notes: $('#eventNotes').value.trim()
    };
    if (!data.title) { toast('Başlık zorunludur.', 'error'); $('#eventTitle').focus(); return; }
    if (!data.date || isNaN(parseDate(data.date))) { toast('Geçerli bir tarih seçin.', 'error'); $('#eventDate').focus(); return; }
    if (data.amount != null && (!isFinite(data.amount) || data.amount < 0)) { toast('Tutar geçerli bir sayı olmalıdır.', 'error'); $('#eventAmount').focus(); return; }
    if (id) {
        events = events.map(ev => {
            if (ev.id !== id) return ev;
            const merged = Object.assign({}, ev, data);
            if (ev.date !== data.date || ev.type !== data.type) { merged.completed = false; merged.doneFor = ''; }
            return merged;
        });
        toast('Kayıt güncellendi.', 'success');
    } else {
        events.push(normalizeEvent(Object.assign({ id: uid(), completed: false, createdAt: Date.now() }, data)));
        toast('Aklımda tutuldu!', 'success');
    }
    agenda.selected = data.date;
    const d = parseDate(data.date);
    agenda.year = d.getFullYear(); agenda.month = d.getMonth();
    persist();
    closeModalEl('#eventModal');
}
function toggleComplete(id) {
    const ev = events.find(e => e.id === id);
    if (!ev) return;
    if (recOf(ev) === 'none') {
        ev.completed = !ev.completed;
    } else {
        ev.doneFor = isDone(ev) ? '' : toISOLocal(nextOccurrence(ev));
    }
    persist();
    toast(isDone(ev) ? 'Tamamlandı olarak işaretlendi.' : 'İşaret kaldırıldı.', 'info');
}
async function removeEvent(id) {
    const ev = events.find(e => e.id === id);
    if (!ev) return;
    const ok = await showConfirm({ title: 'Kayıt silinsin mi?', text: '"' + ev.title + '" silinecek. Silmeden sonra kısa süre geri alabilirsiniz.', confirmText: 'Evet, Sil' });
    if (!ok) return;
    const idx = events.findIndex(e => e.id === id);
    if (idx < 0) return;
    const removed = events.splice(idx, 1)[0];
    persist();
    toast('Kayıt silindi.', 'info', { label: 'Geri Al', fn: () => { events.splice(Math.min(idx, events.length), 0, removed); persist(); } });
}

/* ==================== HEDİYE ÖNERİLERİ ==================== */
function buildGiftSuggestions(ev) {
    const ints = fold(ev.interests || '');
    const rel = fold(ev.relation || '');
    const out = [];
    Object.keys(GIFT_KEYWORDS).forEach(kw => { if (ints.includes(kw)) GIFT_KEYWORDS[kw].slice(0, 2).forEach(t => out.push({ tag: 'İlgi Alanı', text: t })); });
    GIFT_RELATION.forEach(r => { if (r.re.test(rel)) r.gifts.forEach(t => out.push({ tag: 'İlişkiye Özel', text: t })); });
    (GIFT_BUDGETS[ev.budget] || GIFT_BUDGETS.orta).slice(0, 2).forEach(t => out.push({ tag: 'Bütçe', text: t }));
    out.push({ tag: 'Klasik', text: 'Birlikte geçirilen kaliteli zaman: akşam yemeği + etkinlik' });
    const seen = new Set();
    return out.filter(g => { const k = g.text.toLocaleLowerCase('tr'); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 8);
}
function openGiftModal(id) {
    const ev = events.find(e => e.id === id);
    if (!ev) return;
    const s = buildGiftSuggestions(ev);
    $('#giftModalContent').innerHTML =
        '<p class="gift-intro"><b>' + escapeHtml(ev.title) + '</b> için ' + s.length + ' kişiselleştirilmiş öneri:</p>' +
        '<div class="gift-grid">' + s.map(g =>
            '<div class="gift-item"><i class="fa-solid fa-gift"></i><div><span class="gift-tag">' + escapeHtml(g.tag) +
            '</span><p>' + escapeHtml(g.text) + '</p></div></div>').join('') + '</div>';
    openModalEl('#giftModal');
}

/* ==================== RENDER: PANEL ==================== */
function infoFor(ev) { const occ = nextOccurrence(ev); return { ev: ev, occ: occ, days: daysUntil(occ), done: isDone(ev) }; }

function renderStats() {
    const infos = events.map(infoFor);
    const urgent = infos.filter(i => i.days >= 0 && i.days <= URGENT_DAYS && !i.done).length;
    const payments = infos.filter(i => i.ev.type === 'odeme' && !i.done && i.days >= 0 && i.days <= 30)
        .reduce((s, i) => s + (i.ev.amount || 0), 0);
    $('#statTotal').textContent = events.length;
    $('#statUrgent').textContent = urgent;
    $('#statDone').textContent = infos.filter(i => i.done).length;
    $('#statPayments').textContent = fmtTL(payments);
}
function renderChart() {
    const now = new Date();
    const months = [];
    for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        months.push({ y: d.getFullYear(), m: d.getMonth(), label: d.toLocaleDateString('tr-TR', { month: 'short' }), count: 0, current: i === 0 });
    }
    const today = startOfDay(now);
    events.forEach(ev => {
        const rec = recOf(ev);
        months.forEach(mo => {
            const last = new Date(mo.y, mo.m + 1, 0).getDate();
            const o = parseDate(ev.date);
            let hit = false, day = 0;
            if (rec === 'monthly') { day = Math.min(o.getDate(), last); hit = new Date(mo.y, mo.m, day) >= o; }
            else if (rec === 'yearly') { day = Math.min(o.getDate(), last); hit = mo.m === o.getMonth() && new Date(mo.y, mo.m, day) >= o; }
            else { hit = o.getFullYear() === mo.y && o.getMonth() === mo.m; day = o.getDate(); }
            if (!hit) return;
            const when = new Date(mo.y, mo.m, day);
            if (when < today) return;                                // geçmiş günleri sayma
            if (isDone(ev) && toISOLocal(when) === toISOLocal(nextOccurrence(ev))) return;
            if (rec === 'none' && ev.completed) return;
            mo.count++;
        });
    });
    const max = Math.max(1, ...months.map(m => m.count));
    $('#chartBars').innerHTML = months.map(m =>
        '<div class="chart-col" title="' + m.count + ' kayıt"><span class="chart-count">' + (m.count || '') + '</span>' +
        '<div class="chart-bar ' + (m.count ? '' : 'zero') + ' ' + (m.current ? 'current' : '') + '" style="height:' + Math.max(4, (m.count / max) * 78) + 'px"></div>' +
        '<span class="chart-label">' + m.label + '</span></div>').join('');
}
function getFiltered() {
    let list = events.slice();
    if (ui.filter !== 'all') list = list.filter(e => e.type === ui.filter);
    if (ui.search) {
        const q = fold(ui.search);
        list = list.filter(e => [e.title, e.relation, e.interests, e.notes].some(f => fold(f || '').includes(q)));
    }
    const keyed = list.map(infoFor);
    const rank = i => (i.days < 0 ? 99999 : i.days);
    if (ui.sort === 'urgency') {
        keyed.sort((a, b) => (a.done - b.done) || (rank(a) - rank(b)));
    } else if (ui.sort === 'date') {
        keyed.sort((a, b) => (a.done - b.done) || (a.occ - b.occ));
    } else {
        keyed.sort((a, b) => a.ev.title.localeCompare(b.ev.title, 'tr'));
    }
    return keyed;
}
function countdownBadge(item) {
    const days = item.days;
    if (item.done) return '<div class="countdown-badge done"><i class="fa-solid fa-check"></i> Tamamlandı</div>';
    if (days < 0) return '<div class="countdown-badge">Geçti</div>';
    if (days === 0) return '<div class="countdown-badge urgent"><i class="fa-solid fa-bell"></i> Bugün!</div>';
    if (days === 1) return '<div class="countdown-badge urgent">Yarın</div>';
    if (days <= 3) return '<div class="countdown-badge urgent">' + days + ' gün kaldı</div>';
    if (days <= URGENT_DAYS) return '<div class="countdown-badge soon">' + days + ' gün kaldı</div>';
    return '<div class="countdown-badge">' + days + ' gün kaldı</div>';
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
        $('#emptyText').textContent = events.length ? 'Bu filtreye uygun kayıt bulunamadı.' : 'İlk kaydınızı ekleyin ya da asistana "yarın doktor randevusu ekle" yazın.';
        $('#sampleBtn').style.display = events.length ? 'none' : 'inline-flex';
        return;
    }
    emptyEl.style.display = 'none';
    listEl.innerHTML = keyed.map((item, i) => {
        const ev = item.ev, t = TYPES[ev.type];
        const id = escapeHtml(ev.id);
        const milestone = milestoneText(ev, item.occ);
        const giftable = ev.type === 'dogum' || ev.type === 'yildonumu';
        const recText = REC_LABEL[t.recurrence];
        return '<article class="event-card ' + (item.done ? 'completed' : '') + (item.days < 0 && !item.done ? ' past' : '') +
            '" style="--type-color:' + t.color + ';animation-delay:' + Math.min(i * 45, 360) + 'ms">' +
            '<div class="event-main"><div class="event-icon"><i class="fa-solid ' + t.icon + '"></i></div>' +
            '<div class="event-body"><div class="event-header"><div>' +
            '<span class="event-type-badge">' + t.label + '</span>' +
            '<h3 class="event-title">' + escapeHtml(ev.title) + '</h3></div>' +
            countdownBadge(item) + '</div>' +
            '<div class="event-details">' +
            '<span><i class="fa-regular fa-calendar"></i> ' + formatDateTR(item.occ, item.occ.getFullYear() !== new Date().getFullYear()) + (milestone ? ' · <b>' + milestone + '</b>' : '') + '</span>' +
            (ev.amount != null ? '<span><i class="fa-solid fa-turkish-lira-sign"></i> ' + fmtTL(ev.amount) + '</span>' : '') +
            '<span title="' + recText + '"><i class="fa-solid fa-repeat"></i> ' + recText + '</span></div>' +
            (ev.notes ? '<p class="event-notes"><i class="fa-regular fa-note-sticky"></i> ' + escapeHtml(ev.notes) + '</p>' : '') +
            '</div></div>' +
            '<div class="event-actions">' +
            '<button class="btn btn-success" data-action="complete" data-id="' + id + '"><i class="fa-solid ' + (item.done ? 'fa-rotate-left' : 'fa-check') + '"></i> ' + (item.done ? 'Geri Al' : (ev.type === 'odeme' ? 'Ödendi' : 'Tamam')) + '</button>' +
            (giftable ? '<button class="btn btn-gift" data-action="gift" data-id="' + id + '"><i class="fa-solid fa-gift"></i> Hediye</button>' : '') +
            '<button class="btn btn-edit" data-action="edit" data-id="' + id + '"><i class="fa-solid fa-pen"></i> Düzenle</button>' +
            '<button class="btn btn-danger" data-action="delete" data-id="' + id + '" aria-label="Sil"><i class="fa-solid fa-trash"></i></button>' +
            '</div></article>';
    }).join('');
}
function render() {
    renderStats();
    renderChart();
    renderList();
    renderAgenda();
}

/* ==================== AĞ YARDIMCISI ==================== */
async function fetchJSON(url, options, timeoutMs) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs || 9000);
    try {
        const res = await fetch(url, Object.assign({}, options || {}, { signal: ctl.signal }));
        if (!res.ok) { const err = new Error('HTTP ' + res.status); err.status = res.status; throw err; }
        return await res.json();
    } finally { clearTimeout(timer); }
}

/* ==================== HAVA DURUMU ==================== */
async function geocodeCity(name) {
    const j = await fetchJSON('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(name) + '&count=1&language=tr&format=json');
    const r = j.results && j.results[0];
    if (!r) throw new Error('Şehir bulunamadı');
    return { name: r.name + (r.country ? ', ' + r.country : ''), lat: r.latitude, lon: r.longitude };
}
function renderWeatherSetup() {
    $('#wxBody').innerHTML = '<div class="wx-setup">' +
        '<input type="text" id="wxCityInput" class="form-control" placeholder="Şehir ara... (örn: Ankara)" aria-label="Şehir adı" autocomplete="off">' +
        '<button class="btn btn-edit" id="wxCityBtn" aria-label="Şehri ara"><i class="fa-solid fa-magnifying-glass"></i></button>' +
        '<button class="btn" id="wxGeoBtn"><i class="fa-solid fa-location-crosshairs"></i> Konumum</button></div>' +
        '<p class="wx-error" id="wxError" role="alert"></p>';
    $('#wxCityBtn').addEventListener('click', setCityFromInput);
    $('#wxCityInput').addEventListener('keydown', e => { if (e.key === 'Enter') setCityFromInput(); });
    $('#wxGeoBtn').addEventListener('click', useGeolocation);
}
async function loadWeather(force) {
    if (!settings.city) { renderWeatherSetup(); return; }
    const cache = db.get(K.wx, null);
    const sameCity = cache && cache.lat === settings.city.lat && cache.lon === settings.city.lon;
    if (!force && sameCity && cache.t > Date.now() - 30 * 60 * 1000) { renderWeather(cache.data); return; }
    const btn = $('#wxRefresh');
    if (btn) btn.classList.add('spinning');
    try {
        const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + settings.city.lat +
            '&longitude=' + settings.city.lon +
            '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m' +
            '&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=5&timezone=auto';
        const data = await fetchJSON(url);
        db.set(K.wx, { t: Date.now(), lat: settings.city.lat, lon: settings.city.lon, data: data });
        renderWeather(data);
    } catch (e) {
        if (sameCity && cache.data) {
            renderWeather(cache.data, true);
        } else {
            $('#wxBody').innerHTML = '<p class="wx-error" style="display:block;">Hava durumu alınamadı. Bağlantınızı kontrol edip yenileyin.</p>' +
                '<button class="btn btn-edit" id="wxRetry"><i class="fa-solid fa-rotate"></i> Tekrar dene</button>';
            $('#wxRetry').addEventListener('click', () => loadWeather(true));
        }
    }
}
function renderWeather(d, stale) {
    const cur = d.current;
    const info = WMO[cur.weather_code] || ['Bilinmiyor', 'fa-cloud'];
    const days = (d.daily && d.daily.time || []).slice(0, 5).map((t, i) => {
        const dt = parseDate(t);
        const di = WMO[d.daily.weather_code[i]] || ['', 'fa-cloud'];
        const lbl = i === 0 ? 'Bugün' : dt.toLocaleDateString('tr-TR', { weekday: 'short' });
        return '<div class="wx-day"><span>' + lbl + '</span><i class="fa-solid ' + di[1] + '" title="' + di[0] + '"></i>' +
            '<span class="hi">' + Math.round(d.daily.temperature_2m_max[i]) + '&deg;</span>' +
            '<span>' + Math.round(d.daily.temperature_2m_min[i]) + '&deg;</span></div>';
    }).join('');
    $('#wxBody').innerHTML =
        '<div class="wx-top"><span class="wx-city"><i class="fa-solid fa-location-dot"></i> ' + escapeHtml(settings.city.name) + '</span>' +
        '<div class="wx-actions">' +
        '<button class="wx-refresh" id="wxRefresh" title="Yenile" aria-label="Hava durumunu yenile"><i class="fa-solid fa-rotate"></i></button>' +
        '<button class="wx-refresh" id="wxChange" title="Şehri değiştir" aria-label="Şehri değiştir"><i class="fa-solid fa-gear"></i></button></div></div>' +
        '<div class="wx-main"><i class="fa-solid ' + info[1] + ' wx-icon"></i>' +
        '<div><div class="wx-temp">' + Math.round(cur.temperature_2m) + '&deg;C</div>' +
        '<div class="wx-desc">' + info[0] + ' · Hissedilen ' + Math.round(cur.apparent_temperature) + '&deg;C</div></div></div>' +
        '<div class="wx-meta">' +
        '<span><i class="fa-solid fa-droplet"></i> Nem %' + cur.relative_humidity_2m + '</span>' +
        '<span><i class="fa-solid fa-wind"></i> Rüzgâr ' + Math.round(cur.wind_speed_10m) + ' km/sa</span>' +
        (stale ? '<span><i class="fa-solid fa-triangle-exclamation"></i> Eski veri</span>' : '') + '</div>' +
        '<div class="wx-forecast">' + days + '</div>';
    $('#wxRefresh').addEventListener('click', () => loadWeather(true));
    $('#wxChange').addEventListener('click', async () => {
        const ok = await showConfirm({ title: 'Şehri değiştir', text: 'Hava durumu için başka bir şehir seçmek ister misiniz?', confirmText: 'Evet' });
        if (ok) { settings.city = null; db.set(K.settings, settings); loadWeather(); }
    });
}
async function setCityFromInput() {
    const inp = $('#wxCityInput');
    const err = $('#wxError');
    const name = inp.value.trim();
    if (name.length < 2) { err.textContent = 'Lütfen bir şehir adı yazın.'; err.style.display = 'block'; return; }
    try {
        settings.city = await geocodeCity(name);
        db.set(K.settings, settings);
        toast('Şehir ayarlandı: ' + settings.city.name, 'success');
        loadWeather(true);
    } catch (e) {
        err.textContent = e.message === 'Şehir bulunamadı' ? 'Şehir bulunamadı, farklı bir isim deneyin.' : 'Arama yapılamadı. Bağlantınızı kontrol edin.';
        err.style.display = 'block';
    }
}
function useGeolocation() {
    if (!navigator.geolocation) { toast('Bu cihazda konum desteklenmiyor.', 'error'); return; }
    toast('Konum alınıyor...', 'info');
    navigator.geolocation.getCurrentPosition(async pos => {
        let name = 'Mevcut Konum';
        try {
            const j = await fetchJSON('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=' +
                pos.coords.latitude + '&longitude=' + pos.coords.longitude + '&localityLanguage=tr', null, 6000);
            name = j.city || j.locality || name;
        } catch (e) { /* adsız konum kullanılır */ }
        settings.city = { name: name, lat: pos.coords.latitude, lon: pos.coords.longitude };
        db.set(K.settings, settings);
        loadWeather(true);
    }, () => toast('Konum izni verilmedi.', 'error'), { timeout: 10000, maximumAge: 600000 });
}

/* ==================== HABERLER (Ticker) ==================== */
async function loadNews() {
    const cache = db.get(K.news, null);
    if (cache && cache.t > Date.now() - 15 * 60 * 1000) { renderTicker(cache.items); return; }
    try {
        const rss = 'https://news.google.com/rss?hl=tr&gl=TR&ceid=TR:tr';
        const j = await fetchJSON('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(rss));
        if (j.status !== 'ok' || !Array.isArray(j.items)) throw new Error('rss');
        const items = j.items.slice(0, 12).map(it => ({ title: String(it.title || ''), link: String(it.link || '') })).filter(it => it.title);
        db.set(K.news, { t: Date.now(), items: items });
        renderTicker(items);
    } catch (e) {
        if (cache && cache.items) renderTicker(cache.items);
        else renderTicker([]);
    }
}
function renderTicker(items) {
    const track = $('#tickerTrack');
    if (!items.length) { track.style.animation = 'none'; track.innerHTML = '<span class="ticker-empty">Haberler şu an yüklenemedi</span>'; return; }
    track.style.animation = '';
    const html = items.map(it => /^https?:\/\//.test(it.link)
        ? '<a class="ticker-item" href="' + escapeHtml(it.link) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(it.title) + '</a>'
        : '<span class="ticker-item static">' + escapeHtml(it.title) + '</span>').join('');
    track.innerHTML = html + html;
}

/* ==================== ASİSTAN (SOHBET) ==================== */
let chatLog = [];
let chatGreeted = false;
let chatLastFocus = null;

function updateChatStatus() {
    $('#chatAiStatus').textContent = settings.aiKey ? 'yapay zekâ açık' : 'çevrimiçi · yerel mod';
}
function openChat() {
    chatLastFocus = document.activeElement;
    $('#chatOverlay').classList.add('open');
    document.body.classList.add('modal-open');
    updateChatStatus();
    if (!chatGreeted) {
        chatGreeted = true;
        botSay('Merhaba! Ben Aklımda asistanınız 🧠\n' +
            '• Kayıt ekleyebilirim: "3 gün sonra toplantı ekle"\n' +
            '• Hava durumu, adımlar, haberler, hediye fikirleri...\n' +
            '• Hesap bile yaparım: "125*4 kaç eder"\n' +
            'Nasıl yardımcı olayım?');
    }
    setTimeout(() => $('#chatInput').focus(), 250);
}
function closeChat() {
    $('#chatOverlay').classList.remove('open');
    if (!$$('.modal.open').length && !$('#hm-overlay').classList.contains('hm-open')) document.body.classList.remove('modal-open');
    if (chatLastFocus && chatLastFocus.focus) chatLastFocus.focus();
}
function addMsg(text, who) {
    const el = document.createElement('div');
    el.className = 'msg ' + who;
    el.innerHTML = escapeHtml(text).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>').replace(/\n/g, '<br>');
    $('#chatBody').appendChild(el);
    $('#chatBody').scrollTop = $('#chatBody').scrollHeight;
    return el;
}
function botSay(text) { addMsg(text, 'bot'); chatLog.push({ role: 'assistant', content: text }); if (chatLog.length > 30) chatLog = chatLog.slice(-20); }
function showTyping() {
    const el = document.createElement('div');
    el.className = 'msg bot typing';
    el.innerHTML = '<i></i><i></i><i></i>';
    $('#chatBody').appendChild(el);
    $('#chatBody').scrollTop = $('#chatBody').scrollHeight;
    return el;
}
let chatBusy = false;
async function sendUserMessage(raw) {
    const text = (raw || $('#chatInput').value).trim();
    if (!text || chatBusy) return;
    chatBusy = true;
    $('#chatInput').value = '';
    addMsg(text, 'user');
    chatLog.push({ role: 'user', content: text });
    const typing = showTyping();
    let reply;
    try {
        if (settings.aiKey) {
            const ai = await tryAI();
            reply = ai.text != null ? ai.text : localBrain(text) + '\n\n(Yapay zekâ yanıt vermedi: ' + ai.error + ' Yerel mod kullanıldı.)';
        } else {
            await new Promise(r => setTimeout(r, 300 + Math.random() * 350));
            reply = localBrain(text);
        }
    } catch (e) {
        reply = 'Bir sorun oluştu, lütfen tekrar deneyin.';
    }
    typing.remove();
    botSay(reply);
    chatBusy = false;
}

/* --- OpenAI entegrasyonu (isteğe bağlı) --- */
function systemPrompt() {
    const infos = events.map(infoFor).filter(i => !i.done).sort((a, b) => a.days - b.days).slice(0, 12).map(i =>
        '- ' + i.ev.title + ' (' + TYPES[i.ev.type].label + ', ' + (i.days >= 0 ? i.days + ' gün sonra' : 'tarihi geçti') + (i.ev.amount != null ? ', ' + fmtTL(i.ev.amount) : '') + ')'
    ).join('\n') || '- Kayıt yok';
    return 'Sen Aklımda uygulamasının Türkçe konuşan akıllı asistanısın. Kısa, sıcak ve yardımsever yanıtlar ver. Uygulamada veri değiştiremezsin; kayıt eklemek için kullanıcıya "… ekle" yazmasını söyle.\n' +
        'KULLANICI VERİLERİ (salt okunur):\nAKTİF KAYITLAR:\n' + infos + '\n' +
        'BUGÜNKÜ ADIM: ' + getSteps() + ' (' + calcHealth(getSteps()).kcal + ' kcal)\nŞEHİR: ' + (settings.city ? settings.city.name : 'ayarlanmadı') + '\n' +
        'BUGÜN: ' + formatLongTR(todayISO());
}
async function tryAI() {
    try {
        const j = await fetchJSON('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + settings.aiKey },
            body: JSON.stringify({
                model: settings.aiModel || 'gpt-4o-mini',
                messages: [{ role: 'system', content: systemPrompt() }].concat(chatLog.slice(-10)),
                temperature: 0.7, max_tokens: 400
            })
        }, 20000);
        const out = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
        if (!out) return { text: null, error: 'Boş yanıt.' };
        return { text: out.trim() };
    } catch (e) {
        if (e.status === 401) return { text: null, error: 'API anahtarı geçersiz.' };
        if (e.status === 429) return { text: null, error: 'Kullanım sınırına ulaşıldı.' };
        if (e.name === 'AbortError') return { text: null, error: 'Zaman aşımı.' };
        return { text: null, error: 'Bağlantı kurulamadı.' };
    }
}

/* --- Yerel Türkçe anlama motoru --- */
const MONTHS_TR = { ocak: 0, subat: 1, mart: 2, nisan: 3, mayis: 4, haziran: 5, temmuz: 6, agustos: 7, eylul: 8, ekim: 9, kasim: 10, aralik: 11 };
const WEEKDAYS_TR = { pazartesi: 1, sali: 2, carsamba: 3, persembe: 4, cumartesi: 6, cuma: 5, pazar: 0 };
const NUM_WORDS = { bir: 1, iki: 2, uc: 3, dort: 4, bes: 5, alti: 6, yedi: 7, sekiz: 8, dokuz: 9, on: 10 };

function upcomingLines(limit) {
    const arr = events.map(infoFor).filter(x => !x.done && x.days >= 0).sort((a, b) => a.days - b.days).slice(0, limit || 6);
    if (!arr.length) return 'Yaklaşan kayıtlı bir etkinlik yok. Eklemek ister misiniz?';
    return arr.map(x => '• ' + x.ev.title + ': ' + (x.days === 0 ? 'BUGÜN!' : x.days === 1 ? 'yarın' : x.days + ' gün sonra') + ' (' + TYPES[x.ev.type].label + ')').join('\n');
}
function parseAmount(str) {
    let s = str.trim();
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    const n = parseFloat(s);
    return isFinite(n) ? n : null;
}

/* Metinden kayıt çıkarır. Eşleşen parçalar çıkarılır, geri kalanı başlık olur (Türkçe karakterler korunur). */
function parseAddCommand(raw) {
    const now = new Date();
    const rawW = raw.split('');
    const foldW = fold(raw).split('');
    const blank = (a, b) => { for (let i = a; i < b; i++) { rawW[i] = ' '; foldW[i] = ' '; } };
    const foldStr = () => foldW.join('');
    const rawStr = () => rawW.join('');
    const takeFold = re => {
        const m = re.exec(foldStr());
        if (!m) return null;
        blank(m.index, m.index + m[0].length);
        return m;
    };

    // 1) Komut sözcükleri
    const cmd = /\b(lutfen|bana|ekle|ekler misin|ekler misiniz|kaydet|hatirlat|hatirla|olustur|planla|not al|not et|ayarla)\b/g;
    let cm;
    while ((cm = cmd.exec(foldStr())) !== null) blank(cm.index, cm.index + cm[0].length);

    // 2) Tutar
    let amount = null;
    const am = /(\d[\d.,]*)\s*(?:tl|₺|lira)(?![a-zA-Z])/i.exec(rawStr());
    if (am) { amount = parseAmount(am[1]); blank(am.index, am.index + am[0].length); }

    let target = null, dateNote = '';
    const today = startOfDay(now);
    const addDays = n => { const d = new Date(today); d.setDate(d.getDate() + n); return d; };

    // 3) Sayısal tarih: 15.05, 15/05/2026
    const numRe = /(^|[^\d.\/-])(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?(?![\d])/g;
    let nm;
    const rs = rawStr();
    while ((nm = numRe.exec(rs)) !== null) {
        const dd = +nm[2], mm = +nm[3];
        let yy = nm[4] ? +nm[4] : null;
        if (yy != null && yy < 100) yy += 2000;
        const probe = new Date(yy != null ? yy : today.getFullYear(), mm - 1, dd);
        if (mm < 1 || mm > 12 || dd < 1 || probe.getMonth() !== mm - 1 || probe.getDate() !== dd) continue;
        let c = probe;
        if (yy == null && c < today) c = new Date(today.getFullYear() + 1, mm - 1, dd);
        target = c;
        blank(nm.index + nm[1].length, nm.index + nm[0].length);
        break;
    }

    // 4) "15 mayıs", "15 mayısta", "15 mayıs 2027"
    if (!target) {
        const monthRe = new RegExp('\\b(\\d{1,2})\\s+(' + Object.keys(MONTHS_TR).join('|') + ')[a-z]{0,3}\\b(?:\\s+(\\d{4})\\b)?');
        const m = takeFold(monthRe);
        if (m) {
            const dd = +m[1], mm = MONTHS_TR[m[2]];
            const yy = m[3] ? +m[3] : null;
            let c = new Date(yy != null ? yy : today.getFullYear(), mm, dd);
            if (c.getMonth() === mm && c.getDate() === dd) {
                if (yy == null && c < today) c = new Date(today.getFullYear() + 1, mm, dd);
                target = c;
            } else { dateNote = 'Geçersiz bir tarih yazdınız, bugüne ekledim.'; }
        }
    }

    // 5) "3 gün/hafta/ay sonra", "iki hafta sonra"
    if (!target) {
        const m = takeFold(new RegExp('\\b(\\d+|' + Object.keys(NUM_WORDS).join('|') + ')\\s*(gun|hafta|ay)\\s+sonra\\b'));
        if (m) {
            const n = /^\d+$/.test(m[1]) ? +m[1] : NUM_WORDS[m[1]];
            if (m[2] === 'gun') target = addDays(n);
            else if (m[2] === 'hafta') target = addDays(n * 7);
            else target = safeDate(today.getFullYear(), today.getMonth() + n, today.getDate());
        }
    }

    // 6) Anahtar sözcükler ve gün adları
    if (!target) {
        if (takeFold(/\bobur gun\b/)) target = addDays(2);
        else if (takeFold(/\b(bugun|bu aksam|bu sabah)\b/)) target = addDays(0);
        else if (takeFold(/\byarin\b/)) target = addDays(1);
    }
    if (!target) {
        const hasNextWeek = !!takeFold(/\b(haftaya|gelecek hafta|haftaya kadar)\b/);
        const names = Object.keys(WEEKDAYS_TR).sort((a, b) => b.length - a.length);
        const wm = takeFold(new RegExp('\\b(' + names.join('|') + ')(?:ya|ye|a|e|da|de|dan|den)?\\b'));
        if (wm) {
            const wd = WEEKDAYS_TR[wm[1]];
            if (hasNextWeek) {
                const toNextMonday = ((8 - today.getDay()) % 7) || 7;
                target = addDays(toNextMonday + ((wd + 6) % 7));
            } else {
                target = addDays(((wd - today.getDay() + 7) % 7) || 7);
            }
        } else if (hasNextWeek) {
            target = addDays(7);
        }
    }

    // Başlık
    let title = rawStr().replace(/\s+/g, ' ').trim().replace(/^[\s,.\-:;]+|[\s,.\-:;]+$/g, '');
    title = title.replace(/^(ve|icin|için|da|de|ta|te)\s+/i, '').trim();
    if (title.length < 2) return { error: 'Kayıt için bir başlık yazmadınız. Örnek: "yarın doktor randevusu ekle".' };
    title = title.charAt(0).toLocaleUpperCase('tr') + title.slice(1);
    if (title.length > 80) title = title.slice(0, 80);

    const f = fold(title);
    let type = 'ozel';
    if (/dogum gunu|dogumgunu|dogum tarihi/.test(f)) type = 'dogum';
    else if (/yildonumu|evlilik|nisan yildonumu/.test(f)) type = 'yildonumu';
    else if (/fatura|odeme|kira|borc|taksit|aidat|kredi|abonelik/.test(f)) type = 'odeme';

    if (!target) { target = today; dateNote = dateNote || 'Tarih belirtmediğiniz için bugüne ekledim.'; }
    return { title: title, date: toISOLocal(target), type: type, amount: type === 'odeme' ? amount : null, note: dateNote };
}

function tryCalc(raw) {
    let s = raw.toLowerCase().replace(/kaç eder|kac eder|nedir|kaçtır|kactir|hesapla|=|\?/g, ' ')
        .replace(/[x×]/g, '*').replace(/÷/g, '/').replace(/,/g, '.').replace(/\s+/g, ' ').trim();
    if (!/^[0-9+\-*/().%^\s!]|^(sqrt|sin|cos|tan|log|ln|pi)/.test(s)) return null;
    if (!/[0-9]/.test(s) || !/[+\-*/%^!]|sqrt|sin|cos|tan|log|ln/.test(s)) return null;
    if (!window.SafeMath) return null;
    try { return window.SafeMath.evaluate(s); } catch (e) { return null; }
}

function localBrain(rawInput) {
    const t = fold(rawInput).replace(/\s+/g, ' ').trim();

    const calc = tryCalc(rawInput);
    if (calc != null) return 'Sonuç: ' + calc.toLocaleString('tr-TR', { maximumFractionDigits: 6 });

    if (/\b(ekle|kaydet|olustur|planla)\b|\bhatirla?t\b|\bnot al\b/.test(t)) {
        const p = parseAddCommand(rawInput);
        if (p.error) return p.error;
        events.push(normalizeEvent({ id: uid(), title: p.title, date: p.date, type: p.type, amount: p.amount, createdAt: Date.now() }));
        const d = parseDate(p.date);
        agenda.selected = p.date; agenda.year = d.getFullYear(); agenda.month = d.getMonth();
        persist();
        return 'Kaydedildi ✅\n"' + p.title + '" · ' + formatDateTR(d, true) + ' (' + TYPES[p.type].label + ')' +
            (p.amount != null ? ' · ' + fmtTL(p.amount) : '') + (p.note ? '\n' + p.note : '');
    }

    if (/^(merhaba|selam|selamlar|hey|gunaydin|iyi aksamlar|iyi gunler|naber|nasilsin)\b/.test(t)) {
        return 'Merhaba! 👋 Size nasıl yardımcı olabilirim? Kayıt ekleyebilir, hava durumunu söyleyebilir, adımlarınızı takip edebilirim.';
    }
    if (/tesekkur|sagol|eyvallah/.test(t)) return 'Rica ederim! Her zaman buradayım. 🧠';
    if (/\b(kimsin|adin ne)\b/.test(t)) return 'Ben Aklımda asistanıyım: doğum günleri, ödemeler, hava durumu ve adım takibi için buradayım.';

    if (/\b(yardim|ne yapabilirsin|ozellik|komut)/.test(t)) {
        return 'Yapabildiklerim:\n' +
            '• Kayıt ekle: "yarın doktor randevusu ekle", "15 mayıs annemin doğum günü ekle", "5.11 kira 15.000 TL ekle"\n' +
            '• Sağlık: "kaç adım attım?"\n' +
            '• Hava durumu: "hava nasıl?"\n' +
            '• Hediye: "hediye öner"\n' +
            '• Hesaplama: "125 x 4 + 36"';
    }

    if (/\bbugun\b.*\b(ne var|etkinlik|program|kayit)|\bbugunku\b/.test(t)) {
        const list = events.map(infoFor).filter(i => !i.done && i.days === 0);
        return list.length ? 'Bugün:\n' + list.map(i => '• ' + i.ev.title + ' (' + TYPES[i.ev.type].label + ')').join('\n') : 'Bugün için kayıtlı bir şey yok. 🎉';
    }

    if (/\b(hava|havalar|yagmur|sicaklik|sicak|soguk|derece)\b|kar yagacak/.test(t)) {
        const wx = db.get(K.wx, null);
        if (!settings.city || !wx || !wx.data) return 'Henüz hava durumu verisi yok. Ana ekrandaki hava kartından şehir seçmelisiniz.';
        const cur = wx.data.current;
        const info = WMO[cur.weather_code] || ['', ''];
        return 'Şimdi ' + settings.city.name + ': ' + Math.round(cur.temperature_2m) + ' derece, ' + info[0].toLocaleLowerCase('tr') +
            '. Hissedilen ' + Math.round(cur.apparent_temperature) + ', nem %' + cur.relative_humidity_2m + '.';
    }

    if (/\b(adim|yurudum|kalori|saglik|fit)\b/.test(t)) {
        const s = getSteps(), r = calcHealth(s), goal = settings.stepGoal || 8000;
        return 'Bugün ' + s.toLocaleString('tr-TR') + ' adım attınız, yaklaşık ' + r.kcal + ' kcal yaktınız ve ' + r.distanceKm.toFixed(2).replace('.', ',') + ' km yürüdünüz. Hedefiniz ' + goal.toLocaleString('tr-TR') + ' adım' +
            (s >= goal ? ' — hedefe ulaştınız! 🎉' : ' (%' + Math.round(s / goal * 100) + ').');
    }

    if (/\b(haber|haberler|gundem)\b/.test(t)) {
        const cache = db.get(K.news, null);
        if (!cache || !cache.items || !cache.items.length) return 'Haberler henüz yüklenmedi.';
        return 'Güncel başlıklar:\n' + cache.items.slice(0, 5).map((x, i) => (i + 1) + '. ' + x.title).join('\n');
    }

    if (/yaklasan|etkinlik|neler var|hatirlatma|programim|takvim/.test(t)) {
        return 'Yaklaşan kayıtlarınız:\n' + upcomingLines(7);
    }

    if (/hediye|ne alsam|ne alayim/.test(t)) {
        const giftables = events.map(infoFor).filter(i => (i.ev.type === 'dogum' || i.ev.type === 'yildonumu') && !i.done && i.days >= 0).sort((a, b) => a.days - b.days);
        if (!giftables.length) return 'Hediye önerisi için önce bir doğum günü veya yıldönümü ekleyin.';
        const ev = giftables[0].ev;
        const s = buildGiftSuggestions(ev).slice(0, 4);
        return 'En yakın: ' + ev.title + ' (' + giftables[0].days + ' gün sonra)\nÖnerilerim:\n' + s.map((g, i) => (i + 1) + '. ' + g.text).join('\n');
    }

    if (/motivasyon|motive|gunun sozu/.test(t)) return '💬 ' + QUOTES[new Date().getDate() % QUOTES.length];
    if (/fikra|espri/.test(t)) return JOKES[Math.floor(Math.random() * JOKES.length)];

    return 'Bunu tam anlayamadım 😅 "yardım" yazarak yeteneklerimi görebilirsiniz.';
}

/* ==================== AYARLAR, YEDEK, SIFIRLAMA ==================== */
function openSettings() {
    $('#setGoal').value = settings.stepGoal || 8000;
    $('#setAiKey').value = settings.aiKey || '';
    $('#setAiModel').value = settings.aiModel || 'gpt-4o-mini';
    $('#setNotify').checked = !!settings.notify;
    openModalEl('#settingsModal');
}
async function saveSettings() {
    const goal = parseInt($('#setGoal').value, 10);
    if (!isNaN(goal) && goal >= 1000 && goal <= 100000) settings.stepGoal = goal;
    else { toast('Adım hedefi 1.000 ile 100.000 arasında olmalıdır.', 'error'); return; }
    settings.aiKey = $('#setAiKey').value.trim();
    settings.aiModel = $('#setAiModel').value.trim() || 'gpt-4o-mini';
    let wantNotify = $('#setNotify').checked;
    if (wantNotify) {
        if (!('Notification' in window)) { toast('Bu tarayıcı bildirimleri desteklemiyor.', 'error'); wantNotify = false; }
        else if (Notification.permission === 'default') {
            try { if (await Notification.requestPermission() !== 'granted') wantNotify = false; } catch (e) { wantNotify = false; }
        } else if (Notification.permission === 'denied') wantNotify = false;
        if (!wantNotify) toast('Bildirim izni verilmedi; yalnızca uygulama içi hatırlatma yapılacak.', 'info');
    }
    settings.notify = wantNotify;
    db.set(K.settings, settings);
    updateHealthUI();
    updateChatStatus();
    closeModalEl('#settingsModal');
    toast('Ayarlar kaydedildi.', 'success');
}
function exportData() {
    const payload = { app: 'aklimda', version: APP_VERSION, exportedAt: new Date().toISOString(), events: events, steps: stepHistory };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'aklimda-yedek-' + todayISO() + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Yedek dosyası indirildi.', 'success');
}
function importData(file) {
    if (file.size > 2 * 1024 * 1024) { toast('Dosya çok büyük (en fazla 2 MB).', 'error'); return; }
    const reader = new FileReader();
    reader.onerror = () => toast('Dosya okunamadı.', 'error');
    reader.onload = async () => {
        let parsed, list;
        try {
            parsed = JSON.parse(reader.result);
            list = Array.isArray(parsed) ? parsed : parsed.events;
            if (!Array.isArray(list)) throw new Error('format');
        } catch (e) { toast('Geçersiz yedek dosyası.', 'error'); return; }
        const incoming = normalizeList(list);
        const ok = await showConfirm({
            title: 'Yedek yüklensin mi?',
            text: 'Mevcut ' + events.length + ' kaydın yerine yedekteki ' + incoming.length + ' kayıt yüklenecek.',
            confirmText: 'Evet, Yükle'
        });
        if (!ok) return;
        events = incoming;
        if (parsed.steps && typeof parsed.steps === 'object' && !Array.isArray(parsed.steps)) {
            Object.keys(parsed.steps).forEach(k => {
                const n = Number(parsed.steps[k]);
                if (/^\d{4}-\d{2}-\d{2}$/.test(k) && isFinite(n) && n >= 0 && n <= 200000 && k !== stepState.day) stepHistory[k] = Math.round(n);
            });
            saveSteps();
            updateHealthUI();
        }
        persist();
        toast(events.length + ' kayıt içe aktarıldı.', 'success');
    };
    reader.readAsText(file);
}
async function resetData() {
    const ok = await showConfirm({ title: 'Tüm veriler silinsin mi?', text: 'Tüm kayıtlar ve adım geçmişi silinecek. Bu işlem geri alınamaz; önce yedek almanız önerilir.', confirmText: 'Evet, Sil' });
    if (!ok) return;
    events = [];
    Object.keys(stepHistory).forEach(k => delete stepHistory[k]);
    stepState.count = 0; stepState.unsaved = 0;
    saveSteps();
    db.del(K.notified);
    persist();
    updateHealthUI();
    closeModalEl('#settingsModal');
    toast('Veriler temizlendi.', 'info');
}
function addSampleData() {
    const base = new Date();
    const add = n => { const d = new Date(base); d.setDate(d.getDate() + n); return toISOLocal(d); };
    const anniv = new Date(base); anniv.setDate(anniv.getDate() + 20); anniv.setFullYear(anniv.getFullYear() - 5);
    [
        { type: 'dogum', title: 'Annemin Doğum Günü', date: add(4), relation: 'Annem', interests: 'kitap, yemek', budget: 'orta' },
        { type: 'dogum', title: 'Eşimin Doğum Günü', date: add(12), relation: 'Eşim', interests: 'kahve, müzik', budget: 'luks' },
        { type: 'yildonumu', title: 'Evlilik Yıldönümümüz', date: toISOLocal(anniv), relation: 'Eşim', interests: 'seyahat', budget: 'luks' },
        { type: 'odeme', title: 'Kira Ödemesi', date: add(6), amount: 15000 },
        { type: 'odeme', title: 'Elektrik Faturası', date: add(9), amount: 850 },
        { type: 'ozel', title: 'Araç Muayenesi', date: add(25) }
    ].forEach(s => events.push(normalizeEvent(Object.assign({ id: uid(), createdAt: Date.now() }, s))));
    persist();
    toast('Örnek kayıtlar eklendi.', 'success');
}

/* ==================== OLAY BAĞLAMA ==================== */
function bindEvents() {
    $('#themeToggle').addEventListener('click', toggleTheme);
    $('#settingsBtn').addEventListener('click', openSettings);
    $('#exportBtn').addEventListener('click', exportData);
    $('#importBtn').addEventListener('click', () => $('#importFile').click());
    $('#importFile').addEventListener('change', e => { if (e.target.files[0]) importData(e.target.files[0]); e.target.value = ''; });
    $('#resetBtn').addEventListener('click', resetData);

    $('#assistantBtn').addEventListener('click', openChat);
    $('#chatClose').addEventListener('click', closeChat);
    $('#chatOverlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeChat(); });
    $('#chatSend').addEventListener('click', () => sendUserMessage());
    $('#chatInput').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) sendUserMessage(); });
    $('#chatSettings').addEventListener('click', openSettings);
    $$('.chat-chip').forEach(c => c.addEventListener('click', () => sendUserMessage(c.dataset.q)));
    $('#saveSettings').addEventListener('click', saveSettings);

    $('#searchInput').addEventListener('input', e => { ui.search = e.target.value.trim(); renderList(); });
    $('#sortSelect').addEventListener('change', e => { ui.sort = e.target.value; renderList(); });
    $('#filterBar').addEventListener('click', e => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;
        ui.filter = btn.dataset.filter;
        $$('.filter-btn').forEach(b => { const on = b === btn; b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); });
        renderList();
    });
    $('#eventList').addEventListener('click', e => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const map = { complete: toggleComplete, edit: openEventModal, gift: openGiftModal, delete: removeEvent };
        const fn = map[btn.dataset.action];
        if (fn) fn(btn.dataset.id);
    });

    $('#agendaPrev').addEventListener('click', () => agendaShift(-1));
    $('#agendaNext').addEventListener('click', () => agendaShift(1));
    $('#agendaToday').addEventListener('click', () => {
        const n = new Date();
        agenda.year = n.getFullYear(); agenda.month = n.getMonth(); agenda.selected = todayISO();
        renderAgenda();
    });
    $('#agendaAddBtn').addEventListener('click', () => openEventModal());

    $('#addBtn').addEventListener('click', () => openEventModal());
    $('#eventType').addEventListener('change', syncFormFields);
    $('#eventForm').addEventListener('submit', saveEvent);
    $('#cancelForm').addEventListener('click', () => closeModalEl('#eventModal'));
    $('#sampleBtn').addEventListener('click', addSampleData);

    $('#stepsToggle').addEventListener('click', () => { stepState.on ? stopSteps() : startSteps(); });

    $$('.modal').forEach(m => m.addEventListener('click', e => {
        if (e.target !== m) return;
        if (m.id === 'confirmModal') $('#confirmNo').click(); else closeModalEl(m);
    }));
    $$('[data-close]').forEach(b => b.addEventListener('click', () => closeModalEl(b.closest('.modal'))));

    document.addEventListener('keydown', e => {
        if (e.key === 'Tab') { trapFocus(e); return; }
        if (e.key !== 'Escape') return;
        if ($('#hm-overlay').classList.contains('hm-open')) return;    // hesap makinesi kendi kapatır
        const open = $$('.modal.open');
        if (open.length) {
            const top = open[open.length - 1];
            if (top.id === 'confirmModal') $('#confirmNo').click(); else closeModalEl(top);
        } else if ($('#chatOverlay').classList.contains('open')) closeChat();
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) { if (stepState.unsaved) saveSteps(); }
        else { rolloverDay(); updateHealthUI(); if (stepState.on) requestWakeLock(); }
    });
    window.addEventListener('pagehide', () => { if (stepState.unsaved) saveSteps(); });

    window.addEventListener('offline', () => {
        if ($('#offlineBadge')) return;
        const b = document.createElement('div');
        b.id = 'offlineBadge'; b.className = 'offline-badge'; b.setAttribute('role', 'status');
        b.textContent = 'Çevrimdışısınız';
        document.body.appendChild(b);
    });
    window.addEventListener('online', () => {
        const b = $('#offlineBadge'); if (b) b.remove();
        loadWeather(); loadNews();
    });
}

/* ==================== HATIRLATMA, SERVİS İŞÇİSİ, BAŞLATMA ==================== */
function notifyToday() {
    const t = todayISO();
    if (db.get(K.notified, '') === t) return;
    const items = events.map(infoFor).filter(i => !i.done && i.days >= 0 && i.days <= 1);
    if (!items.length) return;
    db.set(K.notified, t);
    const parts = [];
    const now = items.filter(i => i.days === 0), next = items.filter(i => i.days === 1);
    if (now.length) parts.push('Bugün: ' + now.map(i => i.ev.title).join(', '));
    if (next.length) parts.push('Yarın: ' + next.map(i => i.ev.title).join(', '));
    const msg = parts.join(' · ');
    toast(msg, 'info');
    if (settings.notify && 'Notification' in window && Notification.permission === 'granted') {
        const opts = { body: msg, icon: 'icon-192.png', badge: 'icon-192.png', tag: 'aklimda-daily' };
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(reg => reg.showNotification('Aklımda', opts)).catch(() => { try { new Notification('Aklımda', opts); } catch (e) { /* yoksay */ } });
        } else { try { new Notification('Aklımda', opts); } catch (e) { /* yoksay */ } }
    }
}
function registerServiceWorker() {
    if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
    const hadController = !!navigator.serviceWorker.controller;
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!hadController || reloading) return;
        reloading = true;
        location.reload();
    });
    navigator.serviceWorker.register('./sw.js').then(reg => {
        reg.addEventListener('updatefound', () => {
            const nw = reg.installing;
            if (!nw) return;
            nw.addEventListener('statechange', () => {
                if (nw.state === 'installed' && navigator.serviceWorker.controller) {
                    toast('Yeni sürüm hazır.', 'info', { label: 'Yenile', fn: () => nw.postMessage('SKIP_WAITING') });
                }
            });
        });
    }).catch(() => { /* çevrimdışı önbellek devre dışı */ });
}
function setDailyQuote() {
    const d = new Date();
    const day = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
    $('#dailyQuote').innerHTML = '<i class="fa-solid fa-quote-left"></i>' + escapeHtml(QUOTES[day % QUOTES.length]);
}

let lastDayKey = todayISO();
function minuteTick() {
    const t = todayISO();
    if (t === lastDayKey) return;
    lastDayKey = t;
    const n = new Date();
    agenda.year = n.getFullYear(); agenda.month = n.getMonth(); agenda.selected = t;
    render();
    updateHealthUI();
    setDailyQuote();
    notifyToday();
}

function init() {
    initTheme();
    bindEvents();
    initHealthModule();
    render();
    setDailyQuote();
    updateChatStatus();
    loadWeather();
    loadNews();
    notifyToday();
    registerServiceWorker();
    setInterval(loadNews, 20 * 60 * 1000);
    setInterval(minuteTick, 60 * 1000);
    if (!navigator.onLine) window.dispatchEvent(new Event('offline'));
}
if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', init);
