# Aklımda - Kişisel Asistan 🧠

Doğum günleri, yıldönümleri ve ödemeler için akıllı kişisel asistan. **PWA** olarak çalışır:
çevrimdışı kullanılabilir, ana ekrana eklenebilir, tam ekran açılır.

## ✨ Özellikler

### Takip & Organizasyon
- 🎂 Doğum günü, 💞 yıldönümü, 💳 ödeme ve ⭐ özel gün kategorileri
- 🔁 Otomatik tekrar mantığı (yıllık / aylık / tek seferlik)
- 🎯 Akıllı geri sayım rozetleri (Bugün! / Yarın / X gün — renk kodlu)
- 📅 Yaş ve yıl hesaplama ("32. yaş", "12. yıl")
- 🔍 Anlık arama (başlık, ilişki, ilgi alanı, notlarda)
- ↕️ 3 sıralama modu: aciliyete göre, tarihe göre, isme göre
- ✏️ Kayıt düzenleme, ✅ tamamlama, 🗑️ silme (Geri Al destekli)
- 📝 Serbest not alanı ve tutar takibi

### Hediye Motoru
- 🎁 İlişkiye özel öneriler (Eş, Anne, Baba, Arkadaş...)
- 🏷️ İlgi alanı anahtar kelime eşleşmesi (kahve, kitap, seyahat, borsa...)
- 💰 Bütçe katmanlı öneriler (Ekonomik / Orta / Lüks)

### Gösterge Paneli
- 📊 4 istatistik kartı (toplam, yaklaşan, tamamlanan, 30 günlük ödeme toplamı)
- 📈 Sonraki 6 ayın dağılım grafiği
- 🔔 Kategori çiplerinde canlı sayaçlar

### Profesyonel Altyapı
- 🌙 Dark / Light tema (sistem tercizine duyarlı, kalıcı)
- 📢 Tarayıcı bildirimleri (3 gün içindeki etkinlikler için)
- 💾 JSON dışa aktarma / içe aktarma (yedekleme)
- 📴 Service Worker ile tam çevrimdışı destek
- ♿ Erişilebilirlik: ARIA etiketleri, klavye navigasyonu (Esc), odak göstergeleri
- 🎨 `prefers-reduced-motion` desteği
- 🔐 Tüm veriler yalnızca cihazda (localStorage), sunucu yok

## 📁 Dosya Yapısı

```
aklimda/
├── index.html          # Ana sayfa (semantik HTML + ARIA)
├── manifest.json       # PWA manifesti
├── sw.js               # Service worker (çevrimdışı)
├── css/
│   └── style.css       # Tasarım sistemi (dark/light tema)
├── js/
│   └── app.js          # Uygulama mantığı (modüler)
└── icons/              # Üretilmiş PWA ikonları
    ├── icon-192.png
    ├── icon-512.png
    ├── apple-touch-icon.png
    └── icon.svg
```

## 🚀 Yayınlama (GitHub Pages)

```bash
git init
git add .
git commit -m "Aklımda v2.0 - PWA"
git branch -M main
git remote add origin https://github.com/KULLANICI/aklimda.git
git push -u origin main
```

Ardından: **Settings → Pages → Source: main / root → Save**

Site adresi: `https://KULLANICI.github.io/aklimda/`

## 💾 Veri & Gizlilik

- Veriler `localStorage`'da tutulur, hiçbir sunucuya gönderilmez.
- `aklimda-yedek-YYYY-AA-GG.json` dosyası ile cihazlar arası taşıma yapılabilir.
- Eski sürüm (`aklimda_events`) verileri otomatik olarak yeni şemaya taşınır.
