# Aklımda v3.2 - Akıllı Kişisel Asistan 🧠

Doğum günleri, yıldönümleri, ödemeler ve özel günler için hatırlatıcı; hava durumu, adım sayar,
hesap makinesi ve **sesli, Türkçe konuşan yapay zekâ asistanı**. Tek sayfalık, kurulum gerektirmeyen bir PWA.

## v3.2'de yeni
- **"ekle" demeden kayıt:** "11 Ekim Annemin doğum günü" veya "yarın doktor randevusu" yazmanız/söylemeniz yeterli. Yanlış anlaşılırsa "geri al" denir. Tarih eksikse asistan tarihi sorar.
- **Sesle konuşma ve sesli yanıt:** Sohbetteki mikrofon düğmesine basıp konuşun; asistan yanıtı yüksek sesle okur. "on bir ekim" gibi söylenen sayılar anlaşılır. (Chrome ve internet gerekir; ayarlardan kapatılabilir.)
- **Yapay zekâ ajanı (isteğe bağlı):** Ayarlar > Yapay Zekâ bölümünden OpenAI veya Claude anahtarı girilirse asistan gerçek bir dil modeli olur ve araçlarla kayıt ekler, arar, günceller, tamamlar, siler (silmede onay ister), hava durumuna ve adımlarınıza bakar.
- **Daha akıllı yerel mod (anahtarsız, çevrimdışı):** "annemin doğum günü ne zaman?", "bu hafta neler var?", "bu ay ne kadar ödemem var?", "kira ödendi", "elektrik faturasını sil", "İzmir'de hava nasıl?", belirsiz durumda "hangisi?" sorusu ve bağlam hatırlama.
- **Hata düzeltmesi:** Sohbetteki ⚙ düğmesiyle açılan Ayarlar penceresi sohbetin altında kalıyordu; düzeltildi.

## v3.1'de düzeltilenler
Adım sayar (masada dururken sayma), takvim gün kayması ve tekrarlayan kayıtlar, tekrarlayan ödemelerin sonsuza dek "ödendi" kalması,
hesap makinesi (`2*-3`), çevrimdışı mod (service worker), içe aktarma güvenliği, Türkçe karakterler.

## Gizlilik
- Yapay zekâ **Kapalı** iken hiçbir veri dışarı gönderilmez (hava durumu/haber istekleri hariç).
- Açıkken sorularınız ve asistanın okuduğu kayıtlar seçtiğiniz sağlayıcıya gönderilir. API anahtarı yalnızca bu tarayıcıda saklanır, yedeğe yazılmaz. Harcama limiti düşük ayrı bir anahtar kullanın.
- Sesli konuşma tarayıcının konuşma tanıma servisini kullanır (Chrome'da ses Google'a gönderilir).

## Dosyalar (hepsi repo köküne)
`index.html`, `style.css`, `app.js`, `calculator.js`, `sw.js`, `manifest.json`,
`icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`, `favicon.svg`, `favicon-32.png`

## Güncelleme (GitHub Pages)
1. Dosyaların hepsini repoya yükleyin (aynı adlıların üzerine yazın).
2. Eski `Calculator.js` (büyük C) ve `icon.svg` dosyalarını silin.
3. Sayfayı yenileyin; eski sürüm açıksa "Yeni sürüm hazır" bildirimi çıkar.

Veriler tarayıcının localStorage alanında tutulur; depolama anahtarları değişmediği için kayıtlarınız ve eski ayarlarınız korunur.
