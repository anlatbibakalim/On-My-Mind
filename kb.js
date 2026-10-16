/* ============================================================
   AKLIMDA - Bilgi Kütüphanesi Motoru (kb.js)
   Cihazda çalışır, internet ve yapay zekâ gerektirmez.

   Katmanlar:
   - Yükleyici ve dizin:   kb.json -> BM25 dizini (Türkçe kök eşleştirmeli)
   - Yönlendirici:         alan anahtar sözcükleriyle 1-3 alan seçer
   - Arama (RAG):          en alakalı parçaları kaynak etiketiyle getirir
   - Yanıt oluşturucu:     "Kısa sonuç / Ayrıntılar / Risk / Kaynak" şablonu
   - Güvenlik kapısı:      acil durum ve kendine zarar ifadelerini yerelde yanıtlar
   - Doğrulama:            yüksek riskli alanlarda uzman notu, kesinlik iddiası denetimi
   ============================================================ */
(function (root) {
    'use strict';

    const FOLD_MAP = { 'ı': 'i', 'ğ': 'g', 'ü': 'u', 'ş': 's', 'ö': 'o', 'ç': 'c', 'â': 'a', 'î': 'i', 'û': 'u' };
    function fold(s) {
        let out = '';
        s = String(s == null ? '' : s);
        for (let i = 0; i < s.length; i++) {
            const lower = s[i].toLocaleLowerCase('tr');
            const c = lower.length === 1 ? lower : (s[i].toLowerCase()[0] || ' ');
            out += FOLD_MAP[c] || (/[a-z0-9]/.test(c) ? c : ' ');
        }
        return out;
    }

    const STOP = new Set(('ve ile bir bu su o icin gibi kadar daha cok en de da ki mi mu ne nasil nedir nelerdir neden niye nicin hangi acaba lutfen ' +
        'bana beni benim sen siz biz ben var yok olarak olan olur olmali ise ama fakat veya ya hem her tum bazi birkac mumkun ' +
        'yapilir yapmali yapmaliyim yapayim edilir etmeli anlat soyle goster ver bilgi hakkinda konusunda ilgili gerekir lazim kac nerede kim kimin ' +
        'misin musun miyim muyum midir mudur ise iken sonra once arasinda uzerine nelere neler neleri calisir calisiyor merhaba selam nasilsin naber ' +
        'iyi gunler bugun yarin simdi lutfen tesekkurler ' +
        'alirken almak almali almaliyim alinir alinmali bakmak bakmali bakmaliyim bakilmali bakilir olmak etmek yapmak vermek verilir gitmek gelmek').split(' '));

    function sameRoot(a, b) {
        if (a === b) return true;
        const shorter = Math.min(a.length, b.length);
        if (shorter < 4) return false;
        let cp = 0;
        while (cp < shorter && a[cp] === b[cp]) cp++;
        if (shorter >= 7 && cp >= 7) return true;                // türemiş uzun sözcükler: dolandırıldım ~ dolandırıcı
    return cp >= Math.max(4, shorter - 2);
    }
    function words(text, keepStop) {
        return fold(text).split(/\s+/).filter(w => w.length > 1 && (keepStop || !STOP.has(w)));
    }

    /* ---------- Durum ---------- */
    let data = null, docs = [], postings = new Map(), buckets = new Map(), avgLen = 1, domainList = [];
    let loading = null;
    const K1 = 1.4, B = 0.6;

    function addTerms(tf, text, weight) {
        words(text).forEach(w => tf.set(w, (tf.get(w) || 0) + weight));
    }
    function build(json) {
        data = json;
        docs = []; postings = new Map(); buckets = new Map();
        domainList = Object.keys(json.domains);
        let total = 0;
        json.chunks.forEach((c, idx) => {
            const dm = json.domains[c.d] || {};
            const tf = new Map();
            addTerms(tf, c.t, 1);
            addTerms(tf, c.s, 3);
            addTerms(tf, (c.g || []).join(' '), 1.5);
            addTerms(tf, dm.title || '', 1);
            let len = 0;
            tf.forEach((v, term) => {
                len += v;
                let p = postings.get(term);
                if (!p) { p = new Map(); postings.set(term, p); }
                p.set(idx, v);
            });
            docs.push({ c: c, len: len, titleWords: words(c.s) });
            total += len;
        });
        avgLen = docs.length ? total / docs.length : 1;
        postings.forEach((_, term) => {
            const key = term.length >= 4 ? term.slice(0, 4) : term;
            if (!buckets.has(key)) buckets.set(key, []);
            buckets.get(key).push(term);
        });
        // anahtar sözcükleri hazırla
        domainList.forEach(id => {
            const dm = json.domains[id];
            dm._kw = (dm.keywords || []).map(k => ({ phrase: ' ' + fold(k).replace(/\s+/g, ' ').trim() + ' ', ws: words(k, true) }));
        });
        return true;
    }

    function init(json) {
        if (!json || !Array.isArray(json.chunks) || !json.domains) throw new Error('Geçersiz kütüphane');
        build(json);
        return stats();
    }
    function load(url) {
        if (loading) return loading;
        loading = fetch(url || 'kb.json').then(r => {
            if (!r.ok) throw new Error('kb.json HTTP ' + r.status);
            return r.json();
        }).then(j => { init(j); return stats(); }).catch(e => { loading = null; throw e; });
        return loading;
    }
    function isReady() { return !!data; }
    function ready(timeoutMs) {
        if (data) return Promise.resolve(true);
        if (!loading) return Promise.resolve(false);
        return Promise.race([loading.then(() => true, () => false), new Promise(r => setTimeout(() => r(false), timeoutMs || 3000))]);
    }
    function stats() {
        return data ? { version: data.version, updated: data.updated, built: data.built, chunks: data.chunks.length, domains: domainList.length } : null;
    }
    function domainInfo(id) { return data && data.domains[id] ? data.domains[id] : null; }

    /* ---------- Yönlendirici ---------- */
    function route(query) {
        if (!data) return [];
        const q = ' ' + fold(query).replace(/\s+/g, ' ').trim() + ' ';
        const qw = words(query);
        const out = [];
        domainList.forEach(id => {
            let score = 0;
            data.domains[id]._kw.forEach(k => {
                if (k.ws.length > 1) {
                    if (q.indexOf(k.phrase) >= 0) score += k.ws.length;                              // tam ifade
                    else { const hit = k.ws.filter(w => qw.some(x => sameRoot(x, w))).length; if (hit === k.ws.length) score += k.ws.length * 0.8; }
                } else if (k.ws.length === 1) {
                    if (q.indexOf(k.phrase) >= 0) score += 1;
                    else if (qw.some(x => sameRoot(x, k.ws[0]))) score += 0.7;
                }
            });
            if (score > 0) out.push({ id: id, score: score });
        });
        out.sort((a, b) => b.score - a.score);
        return out;
    }

    /* ---------- Arama ---------- */
    function concepts(query) {
        const seen = new Set(), list = [];
        words(query).forEach(w => {
            if (seen.has(w)) return;
            seen.add(w);
            const key = w.length >= 4 ? w.slice(0, 4) : w;
            const cand = (buckets.get(key) || []).filter(t => sameRoot(w, t));
            if (cand.length) list.push({ q: w, terms: cand });
            else list.push({ q: w, terms: [] });
        });
        return list;
    }
    function search(query, opts) {
        opts = opts || {};
        if (!data) return [];
        const cs = concepts(query);
        const matchable = cs.filter(c => c.terms.length);
        if (!matchable.length) return [];
        const N = docs.length;
        const routes = route(query);
        const routeScore = {};
        routes.forEach(r => { routeScore[r.id] = r.score; });
        const allow = opts.domains ? new Set(opts.domains) : null;
        const isDef = /\b(nedir|ne demek|anlami|tanimi|aciklamasi|acilimi|kisaltmasi)\b/.test(fold(query));
        const scores = new Map(), matched = new Map(), titleHit = new Map(), maxIdf = new Map();
        matchable.forEach(cn => {
            const tfByDoc = new Map();
            cn.terms.forEach(t => {
                const factor = t === cn.q ? 1 : 0.85;
                postings.get(t).forEach((v, di) => tfByDoc.set(di, (tfByDoc.get(di) || 0) + v * factor));
            });
            const df = tfByDoc.size;
            const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
            tfByDoc.forEach((tf, di) => {
                const d = docs[di];
                const s = idf * (tf * (K1 + 1)) / (tf + K1 * (1 - B + B * d.len / avgLen));
                scores.set(di, (scores.get(di) || 0) + s);
                matched.set(di, (matched.get(di) || 0) + 1);
                if (idf > (maxIdf.get(di) || 0)) maxIdf.set(di, idf);
                if (d.titleWords.some(w => cn.terms.indexOf(w) >= 0)) titleHit.set(di, (titleHit.get(di) || 0) + 1);
            });
        });
        const hits = [];
        scores.forEach((s, di) => {
            const d = docs[di];
            if (allow && !allow.has(d.c.d)) return;
            const tw = d.titleWords.length;
            const frac = tw ? (titleHit.get(di) || 0) / tw : 0;
            if (tw >= 2 && frac >= 0.99) s += 2.0; else if (frac >= 0.5) s += 1.0 * frac;
            const rs = Math.min(routeScore[d.c.d] || 0, 5);
            s *= 1 + 0.15 * rs;
            if (d.c.d === 'sozluk') s *= isDef ? 1.15 : 0.4;     // kısa sözlük maddeleri yalnızca tanım sorularında öne çıkar
            hits.push({ c: d.c, score: s, matched: matched.get(di), nq: cs.length, d: d.c.d, titled: frac > 0, routed: (routeScore[d.c.d] || 0) > 0, maxIdf: maxIdf.get(di) || 0 });
        });
        hits.sort((a, b) => b.score - a.score);
        return hits.slice(0, opts.k || 4);
    }
    /* Güvenilir sonuç mu? En iyi parça sorgunun anlamlı sözcüklerinin en az yarısını karşılamalı. */
    function confident(hits) {
        if (!hits || !hits.length) return false;
        const t = hits[0];
        // Alan anahtar sözcüklerine uyan sorularda sözcüklerin %60'ı yeter; uymayanlarda hepsi eşleşmeli
        if (t.nq <= 1) return (t.titled || t.routed) && t.score >= 2.2;
        // Konu başlığına uyan, alana yönlenen ve ayırt edici (nadir) bir sözcüğü eşleşen parça yeterlidir
        if (t.routed && t.titled && t.maxIdf >= 3 && t.score >= 2.2) return true;
        const need = t.routed ? Math.ceil(t.nq * 0.6) : t.nq;
        return t.matched >= need && t.score >= 2.2;
    }
    /* Tam eşleşme yoksa "en yakın bilgi" gösterilebilir mi? (alana yönlenen ya da başlığa uyan parça) */
    function nearest(hits) {
        if (!hits || !hits.length) return false;
        const t = hits[0];
        if (t.score < 1.8) return false;
        if (t.routed || t.titled) return t.matched >= 1;
        return t.matched >= Math.max(1, t.nq);
    }
    const GENERAL_EXAMPLES = ['Bütçe nasıl yapılır?', 'Oltalama mesajını nasıl anlarım?', 'Pomodoro tekniği nedir?', 'Kararsızken ne yapmalıyım?', 'Enflasyon ne demek?', 'Seyahat hazırlık listesi neler içermeli?'];
    /* Bilgi bulunamazsa sorgunun alanına uygun örnek sorular önerir */
    function suggest(query, n) {
        n = n || 3;
        const out = [];
        route(query).slice(0, 3).forEach(r => { const dm = domainInfo(r.id); ((dm && dm.examples) || []).forEach(e => { if (out.indexOf(e) < 0) out.push(e); }); });
        GENERAL_EXAMPLES.forEach(e => { if (out.length < n && out.indexOf(e) < 0) out.push(e); });
        return out.slice(0, n);
    }
    function sourceLabel(c) {
        const dm = domainInfo(c.d);
        return (dm ? dm.file.replace(/\.md$/, '') : c.d) + ' › ' + c.s;
    }

    /* ---------- Yanıt oluşturucu ---------- */
    function cleanLine(l) { return l.replace(/^[\s\-•*]+/, '').replace(/\*\*/g, '').trim(); }
    function pickLines(c, query, maxChars) {
        const lines = c.t.split('\n').map(cleanLine).filter(Boolean);
        if (lines.length <= 2) return lines;
        const qw = words(query);
        const scored = lines.map((l, i) => {
            const lw = words(l);
            let s = 0;
            qw.forEach(q => { if (lw.some(w => sameRoot(q, w))) s++; });
            return { l: l, i: i, s: s };
        });
        const chosen = scored.slice().sort((a, b) => (b.s - a.s) || (a.i - b.i)).slice(0, 5);
        let total = 0;
        const keep = [];
        chosen.sort((a, b) => a.i - b.i).forEach(x => {
            if (total + x.l.length > maxChars && keep.length) return;
            keep.push(x); total += x.l.length;
        });
        if (!keep.some(x => x.i === 0) && scored[0].s === 0 && keep.length < 5) { /* ilk satır ilgisizse ekleme */ }
        return keep.map(x => x.l);
    }
    function compose(query, hits) {
        if (!hits || !hits.length) return null;
        const best = hits[0];
        const dm = domainInfo(best.d) || {};
        const parts = [best];
        const second = hits.find((h, i) => i > 0 && h.c.i !== best.c.i && h.score >= 0.6 * best.score && h.c.s !== best.c.s);
        if (second && !dm.glossary && best.c.t.length < 380) parts.push(second);
        const sources = parts.map(h => sourceLabel(h.c));
        const vol = parts.some(h => h.c.v);
        let lines = pickLines(best.c, query, 520);
        if (parts[1]) lines = lines.slice(0, 3).concat(pickLines(parts[1].c, query, 260).slice(0, 2));
        const isGloss = best.d === 'sozluk';
        let text;
        if (isGloss) {
            text = 'Kısa sonuç: ' + best.c.s + ': ' + lines.join(' ');
        } else {
            text = 'Kısa sonuç: ' + lines[0];
            if (lines.length > 1) text += '\n\nAyrıntılar:\n' + lines.slice(1).map(l => '• ' + l).join('\n');
        }
        const notes = [];
        if (dm.footer && dm.safety) notes.push(dm.safety);
        if (vol) notes.push('Bu bilgi zamanla değişebilir; güncel değeri resmî kaynaktan doğrula.');
        if (notes.length) text += '\n\nRisk ve belirsizlik: ' + notes.join(' ');
        const uniq = sources.filter((s, i) => sources.indexOf(s) === i);
        text += '\n\n📚 Kaynak: ' + uniq.join(' · ') + ' (kütüphane v' + (data.version || '?') + ', güncelleme ' + (data.updated || data.built || '?') + ')';
        return { text: text, sources: uniq, domain: best.d, risk: dm.risk || 'düşük', volatile: vol, hit: best };
    }
    /* Yapay zekâ istemi için kısa bağlam bloğu */
    function contextBlock(query, k, maxChars) {
        if (!data) return '';
        const hits = search(query, { k: k || 3 });
        if (!confident(hits)) return '';
        let total = 0;
        const out = [];
        hits.forEach((h, i) => {
            const t = h.c.t.replace(/\n+/g, ' ').slice(0, 520);
            if (total + t.length > (maxChars || 1500) && out.length) return;
            total += t.length;
            out.push('[' + (i + 1) + '] ' + sourceLabel(h.c) + ': ' + t);
        });
        return out.join('\n');
    }
    function toolResult(query, domain) {
        if (!data) return { ok: false, error: 'Bilgi kütüphanesi yüklenmedi.' };
        const hits = search(query, { k: 4, domains: domain && data.domains[domain] ? [domain] : null });
        return {
            ok: true, confident: confident(hits), library_version: data.version, updated: data.updated,
            results: hits.map(h => ({ id: h.c.i, source: sourceLabel(h.c), domain: h.d, risk: (domainInfo(h.d) || {}).risk, volatile: !!h.c.v, text: h.c.t.slice(0, 700), relevance: Math.round(h.score * 10) / 10 }))
        };
    }

    /* ---------- Güvenlik kapısı ---------- */
    const EMERGENCY = [
        /\bgogs(um|ume|umde|umu)\b.*\b(agri|baski|sikis|batma|yaniyor)/, /\bgogus agrim\b/, /\bgogus agrisi cekiyorum\b/,
        /\bnefes (alamiyorum|alamiyor|kesildi)\b/, /\bnefesim kesil/, /\bnefes darligim (cok|siddetli|artti)/,
        /\b(bayildi|bayildim|bilinci kapali|bilincini kaybetti|bilincimi kaybettim|bilinci gitti|uyanmiyor|tepki vermiyor)\b/,
        /\b(kan durmuyor|kontrolsuz kanama|cok kan kaybediyor|kan kaybediyor)\b/,
        /\b(yuzu kaydi|yuzum kaydi|konusamiyor|konusamiyorum|kolum uyusdu|kolu uyusdu|felc gecir)/,
        /\b(bogazim kapaniyor|dilim sisti|anafilaksi|ciddi alerjik)/,
        /\b(zehirlen(di|dim|iyor)|fazla (ilac|hap) (ictim|icti|aldi))\b/,
        /\bkalp kriz(i)? (geciriyor|geciriyorum|gecirdi)/, /\bbebe(g|gi|gim)\b.*\bnefes (almiyor|alamiyor)/
    ];
    const SELF_HARM = /\b(intihar|kendimi (oldur|asmak|kesmek|yaralamak)|yasamak istemiyorum|olmek istiyorum|hayatima son|kendime zarar|yasamanin anlami yok|yasami bitirmek)/;
    const SELF_HARM_INFO = /\b(istatistik|orani|oranlari|arastirma|onleme|makale|haber|tarihte)\b/;
    function gate(text) {
        const f = ' ' + fold(text).replace(/\s+/g, ' ').trim() + ' ';
        if (SELF_HARM.test(f) && !SELF_HARM_INFO.test(f)) {
            return { type: 'selfharm', message: 'Bunu yazdığın için teşekkür ederim. Yaşadığın acı gerçek ve yalnız değilsin. Şu an güvende olman en önemli şey: hemen 112\'yi ara ya da yanındaki güvendiğin birinden hemen yanına gelmesini iste. Yakınındaki hastanenin acil servisine de gidebilirsin. Bu asistan acil yardımın ve bir uzmanın yerini tutamaz; lütfen şimdi birine ulaş.' };
        }
        if (EMERGENCY.some(re => re.test(f))) {
            return { type: 'emergency', message: 'Bu acil bir durum olabilir. Hemen 112\'yi ara. Telefonu kapatmadan adresini net söyle, mümkünse yanında biri olsun ve yardım gelene kadar tek başına kalma. Bu asistan tıbbi tanı koyamaz ve acil yardımın yerini tutmaz.' };
        }
        return null;
    }

    /* ---------- Doğrulama katmanı ---------- */
    const EXPERT = /(uzman|doktor|hekim|avukat|danis|profesyonel|112|eczaci|mali musavir|resmi kaynak)/;
    function verify(reply, query) {
        if (!data || !reply) return reply;
        const rs = route(query || '');
        const f = fold(reply);
        const notes = [];
        const top = rs.slice(0, 2).map(r => domainInfo(r.id)).filter(Boolean);
        const risky = top.find(d => d.footer && d.safety);
        if (risky && !EXPERT.test(f)) notes.push(risky.safety);
        const finance = top.some(d => d.title === 'Finans');
        if (finance && /(garanti(li)? (getiri|kazanc)|kesin (kazanc|getiri)|risksiz (kazanc|getiri)|garantili yatirim)/.test(f) && !/garanti (edilemez|etmem|yok|degil)/.test(f)) {
            notes.push('Hiçbir yatırımda getiri garanti edilemez.');
        }
        return notes.length ? reply + '\n\nNot: ' + notes.join(' ') : reply;
    }

    root.KB = { init: init, load: load, ready: ready, isReady: isReady, stats: stats, fold: fold, search: search, route: route, confident: confident,
        nearest: nearest, suggest: suggest, compose: compose, contextBlock: contextBlock, toolResult: toolResult, gate: gate, verify: verify, sourceLabel: sourceLabel, domainInfo: domainInfo };
})(typeof window !== 'undefined' ? window : globalThis);
