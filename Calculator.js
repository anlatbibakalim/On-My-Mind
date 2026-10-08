  1  /**
  2   * Güvenli Hesap Makinesi
  3   * - eval() / Function() kullanılmaz
  4   * - Kendi tokenizer + shunting-yard parser'ı
  5   * - Sadece sayı, + - * / % ( ) karakterlerine izin verir
  6   */
  7  (function () {
  8    "use strict";
  9
 10    const displayEl = document.getElementById("calc-display");
 11    if (!displayEl) return;
 12
 13    const MAX_LEN = 40;
 14    let expression = "";
 15
 16    /* ---------- Görünüm ---------- */
 17    function render(value) {
 18      const text = value === "" ? "0" : value;
 19      displayEl.textContent = text
 20        .replace(/\*/g, "×")
 21        .replace(/\//g, "÷")
 22        .replace(/-/g, "−");
 23    }
 24
 25    function setExpression(value) {
 26      expression = value;
 27      render(expression);
 28    }
 29
 30    /* ---------- Girdi ---------- */
 31    const ALLOWED = /^[0-9+\-*/%.()]*$/;
 32
 33    function append(char) {
 34      if (expression.length >= MAX_LEN) return;
 35      if (!ALLOWED.test(char)) return;
 36
 37      const last = expression.slice(-1);
 38      const isOp = (c) => "+-*/%".includes(c);
 39      if (isOp(char) && isOp(last) && char !== "-") return;
 40      if (expression === "" && "*/%".includes(char)) return;
 41
 42      if (char === ".") {
 43        const parts = expression.split(/[+\-*/%()]/);
 44        const lastNum = parts[parts.length - 1];
 45        if (lastNum.includes(".")) return;
 46        if (lastNum === "") char = "0.";
 47      }
 48
 49      setExpression(expression + char);
 50    }
 51
 52    function clear() {
 53      setExpression("");
 54    }
 55
 56    function deleteLast() {
 57      setExpression(expression.slice(0, -1));
 58    }
 59
 60    /* ---------- Parser ---------- */
 61    const PRECEDENCE = { "+": 1, "-": 1, "*": 2, "/": 2, "%": 2 };
 62
 63    function tokenize(input) {
 64      const tokens = [];
 65      let i = 0;
 66      while (i < input.length) {
 67        const ch = input[i];
 68        if (/\s/.test(ch)) { i++; continue; }
 69
 70        if (/[0-9.]/.test(ch)) {
 71          let num = "";
 72          while (i < input.length && /[0-9.]/.test(input[i])) {
 73            num += input[i++];
 74          }
 75          if ((num.match(/\./g) || []).length > 1) {
 76            throw new Error("Geçersiz sayı");
 77          }
 78          tokens.push({ type: "number", value: parseFloat(num) });
 79          continue;
 80        }
 81
 82        if ("+-*/%".includes(ch)) {
 83          const prev = tokens[tokens.length - 1];
 84          const isUnary =
 85            ch === "-" &&
 86            (!prev || prev.type === "operator" || prev.type === "lparen");
 87          if (isUnary) tokens.push({ type: "number", value: 0 });
 88          tokens.push({ type: "operator", value: ch });
 89          i++;
 90          continue;
 91        }
 92
 93        if (ch === "(") { tokens.push({ type: "lparen" }); i++; continue; }
 94        if (ch === ")") { tokens.push({ type: "rparen" }); i++; continue; }
 95
 96        throw new Error("Geçersiz karakter: " + ch);
 97      }
 98      return tokens;
 99    }
100
101    function toRPN(tokens) {
102      const output = [];
103      const stack = [];
104
105      for (const t of tokens) {
106        if (t.type === "number") {
107          output.push(t);
108        } else if (t.type === "operator") {
109          while (
110            stack.length &&
111            stack[stack.length - 1].type === "operator" &&
112            PRECEDENCE[stack[stack.length - 1].value] >= PRECEDENCE[t.value]
113          ) {
114            output.push(stack.pop());
115          }
116          stack.push(t);
117        } else if (t.type === "lparen") {
118          stack.push(t);
119        } else if (t.type === "rparen") {
120          while (stack.length && stack[stack.length - 1].type !== "lparen") {
121            output.push(stack.pop());
122          }
123          if (!stack.length) throw new Error("Parantez hatası");
124          stack.pop();
125        }
126      }
127
128      while (stack.length) {
129        const t = stack.pop();
130        if (t.type === "lparen") throw new Error("Parantez hatası");
131        output.push(t);
132      }
133      return output;
134    }
135
136    function evalRPN(rpn) {
137      const stack = [];
138      for (const t of rpn) {
139        if (t.type === "number") {
140          stack.push(t.value);
141        } else {
142          const b = stack.pop();
143          const a = stack.pop();
144          if (a === undefined || b === undefined) throw new Error("Eksik ifade");
145          let r;
146          switch (t.value) {
147            case "+": r = a + b; break;
148            case "-": r = a - b; break;
149            case "*": r = a * b; break;
150            case "/":
151              if (b === 0) throw new Error("Sıfıra bölme");
152              r = a / b;
153              break;
154            case "%": r = a % b; break;
155            default: throw new Error("Bilinmeyen operatör");
156          }
157          stack.push(r);
158        }
159      }
160      if (stack.length !== 1) throw new Error("Geçersiz ifade");
161      return stack[0];
162    }
163
164    function calculate() {
165      if (!expression) return;
166      try {
167        const result = evalRPN(toRPN(tokenize(expression)));
168        if (!isFinite(result)) throw new Error("Tanımsız sonuç");
169        const rounded = Math.round(result * 1e10) / 1e10;
170        setExpression(String(rounded));
171      } catch (err) {
172        displayEl.textContent = "Hata";
173        expression = "";
174        setTimeout(() => render(""), 900);
175      }
176    }
177
178    /* ---------- Olaylar ---------- */
179    document.querySelectorAll(".calculator .btn").forEach((btn) => {
180      btn.addEventListener("click", () => {
181        const action = btn.dataset.action;
182        const value = btn.dataset.value;
183        if (action === "clear") clear();
184        else if (action === "delete") deleteLast();
185        else if (action === "equals") calculate();
186        else if (value !== undefined) append(value);
187      });
188    });
189
190    document.addEventListener("keydown", (e) => {
191      const k = e.key;
192      if (/^[0-9]$/.test(k)) { append(k); e.preventDefault(); }
193      else if (k === "." || k === ",") { append("."); e.preventDefault(); }
194      else if ("+-*/%".includes(k)) { append(k); e.preventDefault(); }
195      else if (k === "Enter" || k === "=") { calculate(); e.preventDefault(); }
196      else if (k === "Backspace") { deleteLast(); e.preventDefault(); }
197      else if (k === "Escape" || k.toLowerCase() === "c") { clear(); e.preventDefault(); }
198    });
199
200    render("");
201  })();
