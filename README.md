# Aklımda v3.1 - Akıllı Kişisel Asistan 🧠

Doğum günleri, yıldönümleri, ödemeler ve özel günler için hatırlatıcı; hava durumu, adım sayar,
hesap makinesi ve Türkçe sohbet asistanı. Tek sayfalık, kurulum gerektirmeyen bir PWA.

## v3.1'de düzeltilenler
- **Adım sayar:** Telefon masada dururken bile saniyede ~3 adım sayıyordu. Yerçekimi filtrelenip gerçek adım tepe noktaları sayılıyor; günlük sıfırlama eklendi; her adımda dinleyici çoğalması giderildi.
- **Takvim:** Noktalar ve seçili gün UTC kaymasıyla bir gün önceyi gösteriyordu; tekrarlayan kayıtlar yalnızca bir sonraki tarihte görünüyordu; ay geçişi 31. günde ay atlıyordu. Hepsi düzeltildi.
- **Tekrarlayan ödemeler:** Bir kez "Ödendi" denince sonsuza kadar tamamlanmış kalıyordu. Artık tamamlanma o ayın/yılın oluşu için geçerli; sonraki dönemde kayıt yeniden aktif olur.
- **Asistan:** "125*4 kaç eder" hesaplaması çalışmıyordu; "15 mayısta", "15.05 toplantı", "cumaya", "iki hafta sonra", "kira 15.000 TL" gibi komutlar anlaşılmıyordu; Türkçe karakterler başlıktan siliniyordu. Ayrıştırıcı baştan yazıldı. `Function()` kullanımı kaldırıldı.
- **Hesap makinesi:** `2*-3` yanlış sonuç veriyordu (−3). Özyinelemeli ayrıştırıcıyla yeniden yazıldı (`eval` yok, `^` sağdan birleşimli, örtük çarpma).
- **Çevrimdışı mod:** Service worker hiç kaydedilmiyordu ve var olmayan `icons/` klasörünü önbelleğe almaya çalıştığı için kurulamazdı. Düzeltildi; Font Awesome da önbelleğe alınır.
- **Güvenlik:** İçe aktarılan JSON'daki `id` alanı HTML'e olduğu gibi yazılıyordu; artık temizleniyor. API anahtarı yedek dosyasına yazılmaz.
- **Metinler:** Tüm arayüz metinleri doğru Türkçe karakterlerle (Doğum Günü, Ödeme, Rüzgâr...).
- Kişisel varsayılanlar (boy/kilo/yaş) nötr değerlerle değiştirildi.
- Kullanılmayan eski dosyalar (`app.js`, `style.css`, `Calculator.js` eski sürümleri) temizlendi; kod artık gerçekten ayrı dosyalarda.

## Yeni özellikler
Ayarlar penceresi (yedek, içe/dışa aktarma, sıfırlama burada), açılışta "bugün/yarın" hatırlatması,
yeni sürüm bildirimi, çevrimdışı göstergesi, takvimde "Bugün" düğmesi, klavye/ekran okuyucu erişilebilirliği,
yedek dosyasına adım geçmişi, doğru maskable ve Apple simgeleri.

## Dosyalar (hepsi repo köküne)
`index.html`, `style.css`, `app.js`, `calculator.js`, `sw.js`, `manifest.json`,
`icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`, `favicon.svg`, `favicon-32.png`

## Güncelleme (GitHub Pages)
1. Yukarıdaki dosyaların hepsini repoya yükleyin (aynı adlıların üzerine yazın).
2. Eski `Calculator.js` (büyük C) ve `icon.svg` dosyalarını silin; artık kullanılmıyorlar.
3. Sayfayı bir kez yenileyin. Eski önbellek varsa uygulama "Yeni sürüm hazır" bildirimi gösterir.

Veriler tarayıcının localStorage alanında tutulur. Depolama anahtarları değişmediği için mevcut kayıtlarınız korunur.
