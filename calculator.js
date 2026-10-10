/* ============================================================
   AKLIMDA - Güvenli Hesap Makinesi
   - eval() / Function() kullanılmaz
   - Özyinelemeli iniş (recursive descent) ayrıştırıcı
   - window.SafeMath.evaluate() asistan tarafından da kullanılır
   ============================================================ */
(function (root) {
    'use strict';

    /* ---------- Ayrıştırıcı ---------- */
    const FUNCS = {
        sin: Math.sin, cos: Math.cos, tan: Math.tan,
        sqrt: function (a) { if (a < 0) throw new Error('sqrt'); return Math.sqrt(a); },
        log: function (a) { if (a <= 0) throw new Error('log'); return Math.log10(a); },
        ln: function (a) { if (a <= 0) throw new Error('ln'); return Math.log(a); }
    };

    function tokenize(src) {
        const out = [];
        let i = 0;
        while (i < src.length) {
            const ch = src[i];
            if (/\s/.test(ch)) { i++; continue; }
            if (/[0-9.]/.test(ch)) {
                let num = '';
                while (i < src.length && /[0-9.]/.test(src[i])) num += src[i++];
                if ((num.match(/\./g) || []).length > 1 || num === '.') throw new Error('sayı');
                out.push({ t: 'num', v: parseFloat(num) });
                continue;
            }
            if (/[a-z]/.test(ch)) {
                let word = '';
                while (i < src.length && /[a-z]/.test(src[i])) word += src[i++];
                if (word === 'pi') out.push({ t: 'num', v: Math.PI });
                else if (word === 'e') out.push({ t: 'num', v: Math.E });
                else if (FUNCS[word]) out.push({ t: 'fn', v: word });
                else throw new Error('bilinmeyen: ' + word);
                continue;
            }
            if ('+-*/%^!()'.includes(ch)) { out.push({ t: 'op', v: ch }); i++; continue; }
            throw new Error('karakter: ' + ch);
        }
        return out;
    }

    function factorial(n) {
        if (n < 0 || !Number.isInteger(n) || n > 170) throw new Error('faktöriyel');
        let r = 1;
        for (let k = 2; k <= n; k++) r *= k;
        return r;
    }

    function evaluate(src) {
        const tokens = tokenize(String(src).toLowerCase());
        if (!tokens.length) throw new Error('boş');
        let pos = 0;
        const peek = () => tokens[pos];
        const isOp = v => peek() && peek().t === 'op' && peek().v === v;
        const startsPrimary = () => {
            const k = peek();
            return !!k && (k.t === 'num' || k.t === 'fn' || (k.t === 'op' && k.v === '('));
        };

        // ifade   := terim (('+'|'-') terim)*
        function expr() {
            let v = term();
            while (isOp('+') || isOp('-')) {
                const op = tokens[pos++].v;
                const r = term();
                v = op === '+' ? v + r : v - r;
            }
            return v;
        }
        // terim   := birli (('*'|'/'|'%'|örtük çarpma) birli)*
        function term() {
            let v = unary();
            for (;;) {
                if (isOp('*')) { pos++; v *= unary(); }
                else if (isOp('/')) { pos++; const d = unary(); if (d === 0) throw new Error('sıfıra bölme'); v /= d; }
                else if (isOp('%')) { pos++; const d = unary(); if (d === 0) throw new Error('sıfıra bölme'); v %= d; }
                else if (startsPrimary()) { v *= unary(); }       // 2(3), 2pi, 3sin(1)
                else break;
            }
            return v;
        }
        // birli   := ('-'|'+') birli | üs
        function unary() {
            if (isOp('-')) { pos++; return -unary(); }
            if (isOp('+')) { pos++; return unary(); }
            return power();
        }
        // üs      := sonek ('^' birli)?     (sağdan birleşimli)
        function power() {
            const base = postfix();
            if (isOp('^')) { pos++; return Math.pow(base, unary()); }
            return base;
        }
        // sonek   := asıl '!'*
        function postfix() {
            let v = primary();
            while (isOp('!')) { pos++; v = factorial(v); }
            return v;
        }
        function primary() {
            const k = tokens[pos++];
            if (!k) throw new Error('eksik ifade');
            if (k.t === 'num') return k.v;
            if (k.t === 'fn') {
                if (!isOp('(')) throw new Error('parantez bekleniyordu');
                pos++;
                const a = expr();
                if (!isOp(')')) throw new Error('parantez');
                pos++;
                return FUNCS[k.v](a);
            }
            if (k.t === 'op' && k.v === '(') {
                const v = expr();
                if (!isOp(')')) throw new Error('parantez');
                pos++;
                return v;
            }
            throw new Error('beklenmeyen: ' + k.v);
        }

        const result = expr();
        if (pos !== tokens.length) throw new Error('fazla karakter');
        if (!isFinite(result)) throw new Error('sonsuz');
        return Math.round(result * 1e10) / 1e10;
    }

    root.SafeMath = { evaluate: evaluate };

    /* ---------- Arayüz ---------- */
    if (typeof document === 'undefined') return;

    function initUI() {
        const overlay = document.getElementById('hm-overlay');
        if (!overlay) return;
        const app = document.getElementById('hm-app');
        const displayEl = document.getElementById('hm-display');
        const closeBtn = document.getElementById('hm-close');
        const openBtn = document.getElementById('calcBtn');
        const tabs = document.querySelectorAll('.hm-tab');
        const gridBasic = document.getElementById('hm-grid-basic');
        const gridSci = document.getElementById('hm-grid-sci');

        const MAX_LEN = 60;
        let expression = '';
        let lastFocus = null;
        const isOpen = () => overlay.classList.contains('hm-open');

        function openModal() {
            lastFocus = document.activeElement;
            overlay.classList.add('hm-open');
            document.body.classList.add('modal-open');
            closeBtn.focus();
        }
        function closeModal() {
            overlay.classList.remove('hm-open');
            if (!document.querySelector('.modal.open') && !document.querySelector('.chat-overlay.open')) {
                document.body.classList.remove('modal-open');
            }
            if (lastFocus && lastFocus.focus) lastFocus.focus();
        }
        if (openBtn) openBtn.addEventListener('click', openModal);
        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => { t.classList.remove('hm-active'); t.setAttribute('aria-selected', 'false'); });
                tab.classList.add('hm-active');
                tab.setAttribute('aria-selected', 'true');
                const sci = tab.dataset.tab === 'sci';
                gridBasic.hidden = sci;
                gridSci.hidden = !sci;
            });
        });

        function render(value) {
            const text = (value === '' ? '0' : value)
                .replace(/sqrt/g, '√').replace(/pi/g, 'π')
                .replace(/\*/g, '×').replace(/\//g, '÷')
                .replace(/-/g, '−').replace(/\./g, ',');
            displayEl.textContent = text;
        }
        function setExpression(v) { expression = v; render(expression); }

        const isOpChar = c => '+-*/%^'.includes(c);
        function append(char) {
            if (expression.length >= MAX_LEN) return;
            const last = expression.slice(-1);
            if (isOpChar(char) && isOpChar(last) && char !== '-') return;
            if (expression === '' && '*/%^'.includes(char)) return;
            if (char === '.') {
                const parts = expression.split(/[+\-*/%()^!]/);
                const lastNum = parts[parts.length - 1];
                if (lastNum.includes('.')) return;
                if (lastNum === '' || !/[0-9]$/.test(expression)) char = '0.';
            }
            setExpression(expression + char);
        }
        function clearAll() { setExpression(''); }
        function deleteLast() {
            // fonksiyon adlarını (sin(, sqrt( ...) tek seferde sil
            const m = expression.match(/(sin|cos|tan|sqrt|log|ln|pi)\($|(pi)$/);
            setExpression(m ? expression.slice(0, -m[0].length) : expression.slice(0, -1));
        }
        function toggleNeg() {
            if (!expression) { setExpression('-'); return; }
            const match = expression.match(/(\d+\.?\d*)$/);
            if (!match) { append('-'); return; }
            const num = match[1];
            const before = expression.slice(0, expression.length - num.length);
            if (before.endsWith('(-')) setExpression(before.slice(0, -2) + num);
            else setExpression(before + '(-' + num + ')');
        }
        function appendFn(name) {
            if (name === 'sq') { if (expression) setExpression(expression + '^2'); return; }
            if (name === 'fact') { if (/[0-9)]$/.test(expression)) setExpression(expression + '!'); return; }
            append(name + '(');
        }
        function calculate() {
            if (!expression) return;
            try {
                setExpression(String(evaluate(expression)));
            } catch (err) {
                displayEl.textContent = 'Hata';
                expression = '';
                setTimeout(() => { if (expression === '') render(''); }, 900);
            }
        }

        app.addEventListener('click', e => {
            const btn = e.target.closest('.hm-btn');
            if (!btn) return;
            const d = btn.dataset;
            if (d.action === 'clear') clearAll();
            else if (d.action === 'delete') deleteLast();
            else if (d.action === 'equals') calculate();
            else if (d.action === 'neg') toggleNeg();
            else if (d.fn) appendFn(d.fn);
            else if (d.const) append(d.const);
            else if (d.value !== undefined) append(d.value);
        });

        document.addEventListener('keydown', e => {
            if (!isOpen()) return;
            const k = e.key;
            if (k === 'Escape') { closeModal(); e.preventDefault(); return; }
            const tag = (document.activeElement && document.activeElement.tagName) || '';
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            if (/^[0-9]$/.test(k)) { append(k); e.preventDefault(); }
            else if (k === '.' || k === ',') { append('.'); e.preventDefault(); }
            else if (k === 'x' || k === 'X') { append('*'); e.preventDefault(); }
            else if ('+-*/%^()'.includes(k)) { append(k); e.preventDefault(); }
            else if (k === '!') { appendFn('fact'); e.preventDefault(); }
            else if (k === 'Enter' || k === '=') { calculate(); e.preventDefault(); }
            else if (k === 'Backspace') { deleteLast(); e.preventDefault(); }
            else if (k === 'c' || k === 'C' || k === 'Delete') { clearAll(); e.preventDefault(); }
        });

        render('');
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initUI);
    else initUI();
})(typeof window !== 'undefined' ? window : globalThis);
