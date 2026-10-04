/* ============================================================
   AKLIMDA - Kişisel Asistan | Uygulama Mantığı v2.0
   Mimari: Modüler Vanilla JS (Storage / State / UI katmanları)
   ============================================================ */
'use strict';

/* ==================== 1. SABİTLER ==================== */
const APP_VERSION = '2.0.0';
const STORAGE_KEY = 'aklimda_events_v2';
const LEGACY_KEY = 'aklimda_events';
const THEME_KEY = 'aklimda_theme';
const NOTIFY_KEY = 'aklimda_notified';
const URGENT_DAYS = 7;

const TYPES = {
    dogum:     { label: 'Doğum Günü', icon: 'fa-cake-candles',         color: '#f59e0b', recurrence: 'yearly'  },
    yildonumu: { label: 'Yıldönümü',  icon: 'fa-heart',                color: '#ec4899', recurrence: 'yearly'  },
    odeme:     { label: 'Ödeme',      icon: 'fa-file-invoice-dollar',  color: '#ef4444', recurrence: 'monthly' },
    ozel:      { label: 'Özel Gün',   icon: 'fa-star',                 color: '#10b981', recurrence: 'none'    }
};

const RECURRENCE_LABELS = { none: 'Tek seferlik', yearly: 'Her yıl tekrarlar', monthly: 'Her ay tekrarlar' };

/* Hediye motoru: ilgi alanı anahtar kelimeleri */
const GIFT_KEYWORDS = {
    'kahve':   ['Özel nitelikli kahve çekirdekleri aboneliği', 'French press veya cezve hediye seti', 'İsme özel seramik kahve kupası'],
    'kitap':   ['Yılın en çok satan kitap seti', 'Kişiselleştirilmiş deri kitap kılıfı', 'Sahaf buluşu nadir baskı kitap'],
    'müzik':   ['Kablosuz kulaklık', 'Vinyl plak koleksiyonu', 'Konser / festival bileti'],
    'spor':    ['Akıllı bileklik veya spor saati', 'Premium spor eşofman seti', 'Spor salonu üyelik paketi'],
    'tekno':   ['Akıllı ev asistanı cihazı', 'Kablosuz şarj istasyonu', 'Taşınabilir projektör'],
    'yemek':   ['Gurme restoran tadım menüsü', 'Michelin yıldızlı şef atölyesi deneyimi', 'El yapımı baharat koleksiyonu'],
    'seyahat': ['Hafta sonu kaçamağı otel kuponu', 'Kişiye özel deri pasaportluk', 'Seyahat boyutlu premium bakım seti'],
    'borsa':   ['Ekonomi klasikleri kitap seti', 'Premium finans dergisi yıllık aboneliği', 'İsme özel deri portföy çanta'],
    'mühendis':['3D baskı kalemi', 'Robotik kodlama başlangıç seti', 'Mekanik klavye kiti']
};

/* Hediye motoru: ilişki bazlı */
const GIFT_BY_RELATION = {
    'eş':     ['Birlikte romantik hafta sonu kaçamağı', 'İsme özel yıldız haritası baskısı', 'El yazısı mektuplu anı kutusu'],
    'es':     ['Birlikte romantik hafta sonu kaçamağı', 'İsme özel yıldız haritası baskısı', 'El yazısı mektuplar albümü'],
    'sevgili':['Birlikte romantik akşam yemeği deneyimi', 'Çiftlere özel bileklik seti', 'Anı fotoğraflarından karikatür çizimi'],
    'anne':   ['Spa ve masaj günü deneyimi', 'Kişiye özel çiçek aboneliği', 'El işi takı veya ipek şal'],
    'baba':   ['Deri cüzdan ve kemer seti', 'Havalık saat veya akıllı bileklik', 'Baba-oğul / baba-kız aktivite günü'],
    'çocuk':  ['Eğitici robotik oyuncak', 'Bilim deney seti', 'Kişisel hikaye kitabı (ismiyle)'],
    'kız':    ['Takı tasarım atölyesi bileti', 'Fotoğraf çekim günü deneyimi', 'Kişisel günlük seti'],
    'oğul':   ['Konsol oyunu veya oyun aksesuarı', 'Kamp / outdoor ekipmanı', 'Drone başlangıç seti'],
    'arkadaş':['Birlikte escape room veya bowling günü', 'Retro oyun konsolu', 'Kişiye özel karikatür portresi'],
    'iş':     ['Premium masaüstü ofis seti', 'Kahve aboneliği veya tadım seti', 'Toplantı notluğu ve kaliteli kalem']
};

/* Hediye motoru: bütçe katmanları */
const GIFT_BUDGETS = {
    ekonomik: ['El yapımı mum ve çikolata seti', 'İsme özel kupa ve not kartları', 'Mini bitki bahçesi kiti'],
    orta:     ['Kablosuz kulaklık', 'Kişiselleştirilmiş anı albümü', 'Gurme kahve veya çay tadım seti'],
    luks:     ['Akıllı saat', 'Hafta sonu butik otel konaklaması', 'Tasarım marka aksesuar']
};

const BUDGET_LABELS = { ekonomik: 'Ekonomik (0-500₺)', orta: 'Orta (500-2.000₺)', luks: 'Lüks (2.000₺+)' };

/* ==================== 2. YARDIMCILAR ==================== */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const pad2 = n => String(n).padStart(2, '0');
const toISOLocal = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const todayISO = () => toISOLocal(new Date());
const startOfDay = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function parseDate(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
}

/** Ayın gün sınırını aşmaması için güvenli tarih üretir (31 -> 30 clamp) */
function safeDate(year, month, day) {
    const last = new Date(year, month + 1, 0).getDate();
    return new Date(year, month, Math.min(day, last));
}

/** Bir kaydın bir sonraki gerçekleşme tarihini hesaplar */
function nextOccurrence(ev) {
    const today = startOfDay(new Date());
    const orig = parseDate(ev.date);
    const rec = TYPES[ev.type]?.recurrence || 'none';

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

/** Gün farkı (bugün = 0) */
function daysUntil(date) {
    return Math.round((startOfDay(date) - startOfDay(new Date())) / 86400000);
}

/** Doğum günü / yıldönümü için hedef yıl katar (32. yaş, 12. yıl) */
function milestoneText(ev, occ) {
    const orig = parseDate(ev.date);
    const n = occ.getFullYear() - orig.getFullYear();
    if (n < 1) return '';
    return ev.type === 'dogum' ? `${n}. yaş` : `${n}. yıl`;
}

function formatDateTR(date, withYear = true) {
    return date.toLocaleDateString('tr-TR', {
        day: 'numeric', month: 'long', ...(withYear ? { year: 'numeric' } : {})
    });
}

const fmtTL = n => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(n) + ' ₺';

/* ==================== 3. DEPOLAMA KATMANI ==================== */
const store = {
    load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) return JSON.parse(raw);

            // v1'den göç
            const legacy = localStorage.getItem(LEGACY_KEY);
            if (legacy) {
                const migrated = JSON.parse(legacy).map(item => ({
                    id: String(item.id ?? uid()),
                    type: TYPES[item.type] ? item.type : 'ozel',
                    title: String(item.title || 'İsimsiz'),
                    date: /^\d{4}-\d{2}-\d{2}$/.test(item.date) ? item.date : todayISO(),
                    amount: item.amount ? Number(item.amount) : null,
                    relation: item.relation || '',
                    interests: item.interests || '',
                    budget: 'orta',
                    notes: '',
                    completed: Boolean(item.completed),
                    createdAt: Date.now()
                }));
                this.save(migrated);
                localStorage.removeItem(LEGACY_KEY);
                return migrated;
            }
        } catch (e) { console.error('Yükleme hatası:', e); }
        return [];
    },
    save(data) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
        catch (e) { toast('Kayıt yapılamadı: depolama dolu olabilir.', 'error'); }
    }
};

/* ==================== 4. DURUM (STATE) ==================== */
let events = store.load();
const ui = { filter: 'all', search: '', sort: 'urgency' };

/* ==================== 5. TEMA ==================== */
function toggleTheme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem(THEME_KEY, next);
    $('#themeToggle').innerHTML = `<i class="fa-solid ${next === 'dark' ? 'fa-sun' : 'fa-moon'}"></i>`;
}

function initTheme() {
    $('#themeToggle').innerHTML = `<i class="fa-solid ${document.documentElement.dataset.theme === 'dark' ? 'fa-sun' : 'fa-moon'}"></i>`;
}

/* ==================== 6. TOAST BİLDİRİMLERİ ==================== */
const TOAST_ICONS = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-circle-info' };

function toast(message, type = 'info', action = null) {
    const container = $('#toastContainer');
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.setAttribute('role', 'status');
    el.innerHTML = `<i class="fa-solid ${TOAST_ICONS[type]}"></i><span>${escapeHtml(message)}</span>` +
        (action ? `<button class="toast-action">${escapeHtml(action.label)}</button>` : '');
    container.appendChild(el);

    let dismissed = false;
    const dismiss = () => {
        if (dismissed) return; dismissed = true;
        el.classList.add('hide');
        setTimeout(() => el.remove(), 320);
    };

    if (action) {
        $('.toast-action', el).addEventListener('click', () => { action.fn(); dismiss(); });
    }
    setTimeout(dismiss, action ? 6000 : 3800);
}

/* ==================== 7. ONAY MODALI ==================== */
function showConfirm({ title, text, confirmText = 'Evet, Onayla' }) {
    return new Promise(resolve => {
        $('#confirmTitle').textContent = title;
        $('#confirmText').textContent = text;
        $('#confirmYes').textContent = confirmText;
        openModalEl('#confirmModal');

        const yes = $('#confirmYes'), no = $('#confirmNo');
        const cleanup = res => { closeModalEl('#confirmModal'); yes.onclick = no.onclick = null; resolve(res); };
        yes.onclick = () => cleanup(true);
        no.onclick = () => cleanup(false);
    });
}

/* ==================== 8. MODAL YÖNETİMİ ==================== */
function openModalEl(sel) { $(sel).classList.add('open'); document.body.classList.add('modal-open'); }
function closeModalEl(sel) {
    $(sel).classList.remove('open');
    if (!$$('.modal.open').length) document.body.classList.remove('modal-open');
}

function closeAllModals() { $$('.modal.open').forEach(m => m.classList.remove('open')); document.body.classList.remove('modal-open'); }

/* ==================== 9. CRUD İŞLEMLERİ ==================== */
function persist() { store.save(events); render(); }

function openEventModal(id = null) {
    const form = $('#eventForm');
    form.reset();
    $('#fieldId').value = '';
    $('#eventDate').value = todayISO();

    if (id) {
        const ev = events.find(e => e.id === id);
        if (!ev) return;
        $('#modalTitle').textContent = 'Kaydı Düzenle';
        $('#fieldId').value = ev.id;
        $('#eventType').value = ev.type;
        $('#eventTitle').value = ev.title;
        $('#eventDate').value = ev.date;
        $('#eventAmount').value = ev.amount ?? '';
        $('#giftRelation').value = ev.relation || '';
        $('#giftInterests').value = ev.interests || '';
        $('#giftBudget').value = ev.budget || 'orta';
        $('#eventNotes').value = ev.notes || '';
    } else {
        $('#modalTitle').textContent = 'Yeni Kayıt Ekle';
    }

    syncFormFields();
    openModalEl('#eventModal');
    setTimeout(() => $('#eventTitle').focus(), 60);
}

function syncFormFields() {
    const type = $('#eventType').value;
    $('#amountGroup').style.display = type === 'odeme' ? 'block' : 'none';
    $('#giftSection').style.display = (type === 'dogum' || type === 'yildonumu') ? 'block' : 'none';
    $('#recurrenceHint').textContent = RECURRENCE_LABELS[TYPES[type].recurrence];
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

    if (!data.title || !data.date) { toast('Başlık ve tarih zorunludur.', 'error'); return; }

    if (id) {
        events = events.map(ev => ev.id === id ? { ...ev, ...data } : ev);
        toast('Kayıt güncellendi.', 'success');
    } else {
        events.push({ id: uid(), ...data, completed: false, createdAt: Date.now() });
        toast('Aklınızda tutuldu! 🎉', 'success');
    }
    persist();
    closeModalEl('#eventModal');
}

function toggleComplete(id) {
    const ev = events.find(e => e.id === id);
    if (!ev) return;
    ev.completed = !ev.completed;
    persist();
    toast(ev.completed
        ? (ev.type === 'odeme' ? 'Ödeme tamamlandı olarak işaretlendi.' : 'Kutlandı olarak işaretlendi. 🎉')
        : 'İşaret kaldırıldı.', 'info');
}

async function removeEvent(id) {
    const ev = events.find(e => e.id === id);
    if (!ev) return;
    const ok = await showConfirm({
        title: 'Kayıt Silinsin mi?',
        text: `"${ev.title}" kalıcı olarak silinecek. Bu işlem geri alınabilir.`,
        confirmText: 'Evet, Sil'
    });
    if (!ok) return;

    const idx = events.findIndex(e => e.id === id);
    const [removed] = events.splice(idx, 1);
    persist();
    toast('Kayıt silindi.', 'info', {
        label: 'Geri Al',
        fn: () => { events.splice(Math.min(idx, events.length), 0, removed); persist(); }
    });
}

/* ==================== 10. HEDİYE MOTORU ==================== */
function buildGiftSuggestions(ev) {
    const ints = (ev.interests || '').toLocaleLowerCase('tr');
    const rel = (ev.relation || '').toLocaleLowerCase('tr');
    const out = [];
    const push = (tag, items) => items.forEach(t => out.push({ tag, text: t }));

    // 1) İlgi alanı eşleşmesi
    for (const [kw, items] of Object.entries(GIFT_KEYWORDS)) {
        if (ints.includes(kw)) push('İlgi Alanı', items.slice(0, 2));
    }
    // 2) İlişki eşleşmesi
    for (const [kw, items] of Object.entries(GIFT_BY_RELATION)) {
        if (rel.includes(kw)) push('İlişkiye Özel', items);
    }
    // 3) Bütçe katmanı
    push(`Bütçe: ${BUDGET_LABELS[ev.budget] || BUDGET_LABELS.orta}`, (GIFT_BUDGETS[ev.budget] || GIFT_BUDGETS.orta).slice(0, 2));
    // 4) Evrensel
    push('Klasik', ['Birlikte geçirilen kaliteli zaman: akşam yemeği + etkinlik', 'İsme özel hediye notuyla kaliteli bir deneyim']);

    // Tekilleştir & sınırla
    const seen = new Set();
    return out.filter(g => {
        const k = g.text.toLocaleLowerCase('tr');
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
    }).slice(0, 8);
}

function openGiftModal(id) {
    const ev = events.find(e => e.id === id);
    if (!ev) return;
    const suggestions = buildGiftSuggestions(ev);
    $('#giftModalTitle').textContent = '🎁 Hediye Önerileri';
    $('#giftModalContent').innerHTML = `
        <p class="gift-intro"><b>${escapeHtml(ev.title)}</b> için ${escapeHtml(ev.relation || 'özel kişi')} profiline göre
        ${suggestions.length} kişiselleştirilmiş öneri hazırlandı.</p>
        <div class="gift-grid">
            ${suggestions.map(g => `
                <div class="gift-item">
                    <i class="fa-solid fa-gift"></i>
                    <div><span class="gift-tag">${escapeHtml(g.tag)}</span><p>${escapeHtml(g.text)}</p></div>
                </div>`).join('')}
        </div>`;
    openModalEl('#giftModal');
}

/* ==================== 11. RENDER: İSTATİSTİK ==================== */
function renderStats() {
    const infos = events.map(ev => ({ ev, occ: nextOccurrence(ev), days: daysUntil(nextOccurrence(ev)) }));
    const total = events.length;
    const urgent = infos.filter(i => i.days >= 0 && i.days <= URGENT_DAYS && !i.ev.completed).length;
    const done = events.filter(e => e.completed).length;
    const payments = infos.filter(i => i.ev.type === 'odeme' && !i.ev.completed && i.days >= 0 && i.days <= 30)
        .reduce((s, i) => s + (i.ev.amount || 0), 0);

    $('#statTotal').textContent = total;
    $('#statUrgent').textContent = urgent;
    $('#statDone').textContent = done;
    $('#statPayments').textContent = fmtTL(payments);
}

/* ==================== 12. RENDER: GRAFİK ==================== */
function renderChart() {
    const now = new Date();
    const months = [];
    for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('tr-TR', { month: 'short' }), count: 0, current: i === 0 });
    }
    events.forEach(ev => {
        if (ev.completed) return;
        const occ = nextOccurrence(ev);
        const key = `${occ.getFullYear()}-${occ.getMonth()}`;
        const slot = months.find(m => m.key === key);
        if (slot) slot.count++;
    });

    const max = Math.max(1, ...months.map(m => m.count));
    $('#chartBars').innerHTML = months.map(m => `
        <div class="chart-col" title="${m.count} kayıt">
            <span class="chart-count">${m.count || ''}</span>
            <div class="chart-bar ${m.count ? '' : 'zero'} ${m.current ? 'current' : ''}" style="height:${Math.max(4, (m.count / max) * 78)}px"></div>
            <span class="chart-label">${m.label}</span>
        </div>`).join('');
}

/* ==================== 13. RENDER: LİSTE ==================== */
function getFiltered() {
    let list = [...events];
    if (ui.filter !== 'all') list = list.filter(e => e.type === ui.filter);
    if (ui.search) {
        const q = ui.search.toLocaleLowerCase('tr');
        list = list.filter(e =>
            [e.title, e.relation, e.interests, e.notes].some(f => (f || '').toLocaleLowerCase('tr').includes(q)));
    }
    const key = ev => { const o = nextOccurrence(ev); return { ev, occ: o, days: daysUntil(o) }; };
    const keyed = list.map(key);
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
    if (ev.completed) return '<div class="countdown-badge done"><i class="fa-solid fa-check"></i> Tamamlandı</div>';
    if (days < 0) return '<div class="countdown-badge">Geçti</div>';
    if (days === 0) return '<div class="countdown-badge urgent"><i class="fa-solid fa-bell"></i> Bugün!</div>';
    if (days === 1) return '<div class="countdown-badge urgent">Yarın</div>';
    if (days <= 3) return `<div class="countdown-badge urgent">${days} gün kaldı</div>`;
    if (days <= URGENT_DAYS) return `<div class="countdown-badge soon">${days} gün kaldı</div>`;
    return `<div class="countdown-badge">${days} gün kaldı</div>`;
}

function renderList() {
    const listEl = $('#eventList');
    const emptyEl = $('#emptyState');
    const keyed = getFiltered();

    // Filtre çipi sayaçları (tüm kayıtlar üzerinden)
    $$('.filter-btn').forEach(btn => {
        const f = btn.dataset.filter;
        const n = f === 'all' ? events.length : events.filter(e => e.type === f).length;
        $('.chip-count', btn).textContent = n;
    });

    if (!keyed.length) {
        listEl.innerHTML = '';
        emptyEl.style.display = 'block';
        $('#emptyText').textContent = events.length
            ? 'Bu filtreye uygun kayıt bulunamadı. Arama veya filtreleri değiştirmeyi deneyin.'
            : 'Henüz hiç kayıt yok. İlk doğum gününüzü veya ödemenizi eklemek için başlayın.';
        $('#sampleBtn').style.display = events.length ? 'none' : 'inline-flex';
        return;
    }
    emptyEl.style.display = 'none';

    listEl.innerHTML = keyed.map(({ ev, occ, days }, i) => {
        const t = TYPES[ev.type];
        const milestone = milestoneText(ev, occ);
        const isGiftable = ev.type === 'dogum' || ev.type === 'yildonumu';
        return `
        <article class="event-card ${ev.completed ? 'completed' : ''}" style="--type-color:${t.color}; animation-delay:${Math.min(i * 45, 360)}ms">
            <div class="event-main">
                <div class="event-icon"><i class="fa-solid ${t.icon}"></i></div>
                <div class="event-body">
                    <div class="event-header">
                        <div>
                            <span class="event-type-badge">${t.label}</span>
                            <h3 class="event-title">${escapeHtml(ev.title)}</h3>
                        </div>
                        ${countdownBadge(ev, days)}
                    </div>
                    <div class="event-details">
                        <span><i class="fa-regular fa-calendar"></i> ${formatDateTR(occ)}${milestone ? ` · <b>${milestone}</b>` : ''}</span>
                        ${ev.amount ? `<span><i class="fa-solid fa-turkish-lira-sign"></i> ${fmtTL(ev.amount)}</span>` : ''}
                        <span title="${RECURRENCE_LABELS[t.recurrence]}"><i class="fa-solid fa-repeat"></i> ${RECURRENCE_LABELS[t.recurrence]}</span>
                    </div>
                    ${ev.notes ? `<p class="event-notes"><i class="fa-regular fa-note-sticky"></i> ${escapeHtml(ev.notes)}</p>` : ''}
                </div>
            </div>
            <div class="event-actions">
                <button class="btn btn-success" data-action="complete" data-id="${ev.id}" aria-label="Tamamlandı olarak işaretle">
                    <i class="fa-solid ${ev.completed ? 'fa-rotate-left' : 'fa-check'}"></i>
                    ${ev.completed ? 'Geri Al' : (ev.type === 'odeme' ? 'Ödendi' : 'Kutlandı')}
                </button>
                ${isGiftable ? `<button class="btn btn-gift" data-action="gift" data-id="${ev.id}">
                    <i class="fa-solid fa-gift"></i> Hediye
                </button>` : ''}
                <button class="btn btn-edit" data-action="edit" data-id="${ev.id}">
                    <i class="fa-solid fa-pen"></i> Düzenle
                </button>
                <button class="btn btn-danger" data-action="delete" data-id="${ev.id}" aria-label="Sil">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </article>`;
    }).join('');
}

function render() { renderStats(); renderChart(); renderList(); }

/* ==================== 14. YEDEKLEME / İÇE AKTARMA ==================== */
function exportData() {
    const blob = new Blob([JSON.stringify({ app: 'aklimda', version: APP_VERSION, exportedAt: new Date().toISOString(), events }, null, 2)],
        { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `aklimda-yedek-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Yedek dosyası indirildi.', 'success');
}

function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const parsed = JSON.parse(reader.result);
            const arr = Array.isArray(parsed) ? parsed : parsed.events;
            if (!Array.isArray(arr)) throw new Error('Geçersiz format');
            let added = 0;
            arr.forEach(item => {
                if (!item || !item.title || !item.date) return;
                const clean = {
                    id: String(item.id || uid()),
                    type: TYPES[item.type] ? item.type : 'ozel',
                    title: String(item.title),
                    date: /^\d{4}-\d{2}-\d{2}$/.test(item.date) ? item.date : todayISO(),
                    amount: item.amount ? Number(item.amount) : null,
                    relation: String(item.relation || ''),
                    interests: String(item.interests || ''),
                    budget: GIFT_BUDGETS[item.budget] ? item.budget : 'orta',
                    notes: String(item.notes || ''),
                    completed: Boolean(item.completed),
                    createdAt: Number(item.createdAt) || Date.now()
                };
                const idx = events.findIndex(e => e.id === clean.id);
                if (idx >= 0) events[idx] = clean; else events.push(clean);
                added++;
            });
            persist();
            toast(`${added} kayıt başarıyla içe aktarıldı.`, 'success');
        } catch (e) {
            toast('Dosya okunamadı: geçersiz yedek dosyası.', 'error');
        }
    };
    reader.readAsText(file);
}

async function resetData() {
    const ok = await showConfirm({
        title: 'Tüm Veriler Silinsin mi?',
        text: 'Tüm kayıtlar kalıcı olarak silinecek. Önce dışa aktarmayı düşünün.',
        confirmText: 'Evet, Hepsini Sil'
    });
    if (!ok) return;
    events = [];
    persist();
    toast('Tüm veriler temizlendi.', 'info');
}

/* ==================== 15. ÖRNEK VERİ ==================== */
function addSampleData() {
    const base = new Date();
    const add = n => { const d = new Date(base); d.setDate(d.getDate() + n); return toISOLocal(d); };
    const y = base.getFullYear();
    const samples = [
        { type: 'dogum', title: 'Annemin Doğum Günü', date: add(4), relation: 'Anne', interests: 'kitap, yemek', budget: 'orta', notes: 'Kırmızı çiçek seviyor' },
        { type: 'dogum', title: 'Eşimin Doğum Günü', date: add(12), relation: 'Eş', interests: 'kahve, müzik', budget: 'luks' },
        { type: 'yildonumu', title: 'Evlilik Yıldönümümüz', date: `${y - 5}-${pad2(base.getMonth() + 1)}-${pad2(Math.min(base.getDate() + 20, 28))}`, relation: 'Eş', interests: 'seyahat', budget: 'luks', notes: 'Her yıl birlikte seyahat ediyoruz' },
        { type: 'odeme', title: 'Kira Ödemesi', date: add(6), amount: 15000, notes: 'Her ayın 1-5 arası' },
        { type: 'odeme', title: 'Elektrik Faturası', date: add(9), amount: 850 },
        { type: 'ozel', title: 'Araç Muayene Tarihi', date: add(25), notes: 'Randevu almayı unutma' }
    ];
    samples.forEach(s => events.push({ id: uid(), ...s, completed: false, createdAt: Date.now() }));
    persist();
    toast('Örnek kayıtlar eklendi, düzenlemekten çekinmeyin.', 'success');
}

/* ==================== 16. BİLDİRİM API ==================== */
async function enableNotifications() {
    if (!('Notification' in window)) { toast('Tarayıcınız bildirim desteklemiyor.', 'error'); return; }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
        toast('Bildirimler açıldı. Yaklaşan etkinlikler için uyaracaksınız.', 'success');
        scanUpcoming(true);
    } else {
        toast('Bildirim izni verilmedi.', 'error');
    }
}

function scanUpcoming(force = false) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    let notified = {};
    try { notified = JSON.parse(localStorage.getItem(NOTIFY_KEY) || '{}'); } catch (e) {}

    events.forEach(ev => {
        if (ev.completed) return;
        const occ = nextOccurrence(ev);
        const days = daysUntil(occ);
        if (days >= 0 && days <= 3) {
            const key = `${ev.id}:${toISOLocal(occ)}`;
            if (notified[key]) return;
            notified[key] = true;
            const t = TYPES[ev.type];
            new Notification('Aklımda hatırlatıyor 🧠', {
                body: `${ev.title} — ${days === 0 ? 'bugün!' : days + ' gün sonra'} (${t.label})`,
                icon: 'icons/icon-192.png',
                badge: 'icons/icon-192.png'
            });
        }
    });
    localStorage.setItem(NOTIFY_KEY, JSON.stringify(notified));
}

/* ==================== 17. OLAY BAĞLAMA (EVENT BINDING) ==================== */
function bindEvents() {
    // Header
    $('#themeToggle').addEventListener('click', toggleTheme);
    $('#notifBtn').addEventListener('click', enableNotifications);
    $('#exportBtn').addEventListener('click', exportData);
    $('#importBtn').addEventListener('click', () => $('#importFile').click());
    $('#importFile').addEventListener('change', e => {
        if (e.target.files[0]) importData(e.target.files[0]);
        e.target.value = '';
    });
    $('#resetBtn').addEventListener('click', resetData);

    // Toolbar
    $('#searchInput').addEventListener('input', e => { ui.search = e.target.value.trim(); renderList(); });
    $('#sortSelect').addEventListener('change', e => { ui.sort = e.target.value; renderList(); });

    // Filtre çipleri (event delegation)
    $('#filterBar').addEventListener('click', e => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;
        ui.filter = btn.dataset.filter;
        $$('.filter-btn').forEach(b => b.classList.toggle('active', b === btn));
        renderList();
    });

    // Liste aksiyonları (event delegation)
    $('#eventList').addEventListener('click', e => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const id = btn.dataset.id;
        const map = { complete: toggleComplete, edit: openEventModal, gift: openGiftModal, delete: removeEvent };
        map[btn.dataset.action]?.(id);
    });

    // FAB
    $('#addBtn').addEventListener('click', () => openEventModal());

    // Form
    $('#eventType').addEventListener('change', syncFormFields);
    $('#eventForm').addEventListener('submit', saveEvent);
    $('#cancelForm').addEventListener('click', () => closeModalEl('#eventModal'));

    // Boş durum
    $('#sampleBtn').addEventListener('click', addSampleData);

    // Modal kapatma: arka plan tıklaması + Esc
    $$('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) closeAllModals(); }));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAllModals(); });

    // Modal içi kapatma butonları
    $$('[data-close]').forEach(btn => btn.addEventListener('click', () => {
        closeModalEl(btn.closest('.modal'));
    }));
}

/* ==================== 18. SERVICE WORKER ==================== */
function registerSW() {
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW kaydı başarısız:', err));
        });
    }
}

/* ==================== 19. BAŞLATMA ==================== */
function init() {
    initTheme();
    bindEvents();
    render();
    registerSW();
    setTimeout(() => scanUpcoming(), 2500);
    console.log(`%cAklımda v${APP_VERSION} hazır 🧠`, 'color:#6366f1;font-weight:bold;font-size:14px');
}

document.addEventListener('DOMContentLoaded', init);
