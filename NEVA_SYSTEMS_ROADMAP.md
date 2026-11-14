# NevaWebDesign | Çok Sektörlü İşletme Sistemleri — Ürün Planı
Güncelleme: 14 Kasım 2026

## Ürün hedefi
BerberOS'un çalışan randevu/personel/işlem/rapor panelini koruyarak, NevaWebDesign çatısı altında 21 sektöre uyarlanabilen **3 rezervasyon motoru** geliştirmek. 21 ayrı backend kopyası yapılmayacak; her işletmenin verileri birbirinden izole olacak.

## Gerçek durum
- [x] NevaWebDesign `/berberos/` satış sayfası; 3 grup, 21 sektör, sektör araması, WhatsApp teklif akışı
- [x] NevaWebDesign ana site menülerinde "İşletme Sistemleri" bağlantısı
- [x] Mevcut BerberOS: oturum açma, çalışan, hizmet, randevu, işlem ve çalışan raporları
- [ ] Müşterinin giriş yapmadan kendi kendine randevu alması
- [ ] Sektörler için yeni ortak rezervasyon backend'i
- [ ] Alan/masa rezervasyon yönetimi
- [ ] Ders/etkinlik kapasitesi yönetimi
- [ ] Super-admin, abonelik ve yaygın satış paneli

**Satış kuralı:** Çalışmayan modüller hiçbir sayfada hazır olarak gösterilmez. "Ön görüşme / özel geliştirme" ibaresi kullanılır.

## Modül A — Randevu: 11 sektör
Kuaför; Berber; Güzellik Merkezi; Spa & Masaj; Diyetisyen; Veteriner; Fitness & Spor; Diş Kliniği; Dövme & Piercing; Fizyoterapi; Psikolog.

- İşletme başına hizmet kataloğu (fiyat, süre, aktiflik)
- Çalışanların sunabildiği hizmetler ve haftalık mesai saatleri
- Mola/izin/tatil tanımları
- Public randevu bağlantısı: sektör → hizmet → çalışan → boş saat → müşteri bilgisi → onay
- Takvim çakışmasını sunucu/veritabanında atomik olarak engelleme
- Randevu iptali, yeniden planlama, durum geçmişi, bildirim onayı
- Sahip/çalışan yetkilendirmesi, raporlar ve işlem adisyonu
- Sağlık alanlarında hassas veri toplanmaması; özel kayıtlar için ayrıca KVKK ve alan mevzuatı değerlendirmesi

**Pilot:** BerberOS üzerinde mevcut çalışan yönetim sistemini bozmadan online randevu akışı.

## Modül B — Masa/Alan Rezervasyonu: 9 sektör
Restoran & Kafe; Kaçış Oyunu; Korku Evi; Halı Saha; Padel & Tenis Kortu; Prova & Kayıt Stüdyosu; Fotoğraf & Podcast Stüdyosu; PlayStation & Oyun Salonu; Toplantı Odası & Ortak Çalışma.

- `resources`: masa/saha/oda/kort/stüdyo/konsol, kapasite, konum, aktiflik
- Sektöre göre serbest adlandırma ve saatlik blok süresi
- Restoranlar için masa/alan planı ve kişi sayısına göre eşleştirme
- Rezervasyonda kaynak, başlangıç/bitiş, kişi sayısı, müşteri, durum
- Bakım / kapalı saatler, iptal ve rezervasyonsuz müşteri ekleme
- Kaynak bazında çakışma engelleme ve doluluk raporu

## Modül C — Ders/Etkinlik Kontenjanı: başlangıçta Kurs & Etüt
- Tekrarlı haftalık `class_templates`, tarihli `class_sessions`
- Sınıf, eğitmen, kontenjan, kayıt son tarihi, iptal kuralları
- Üye/katılımcı `enrollments`, bekleme listesi (sonraki sürüm)
- Kapasiteyi aynı anda açılan iki tarayıcıda da aşmayan atomik kayıt
- Manuel yoklama; QR yoklama ancak güvenli token ve doğrulama tamamlandığında
- Pilates/yoga vb. sektörlere daha sonra aynı modül uyarlanabilir

## Ortak güvenli altyapı
- Yeni ortak ürünü ayrı kod tabanında geliştir; canlı BerberOS'u test verisiyle değiştirme veya çalışmasını bozma.
- Supabase Auth ve Postgres; her satır için `business_id`, tenant üyelikleri; test edilmiş RLS.
- `businesses`, `branches`, `memberships`, `customers`, `services`, `staff_availability`, `resources`, `reservations`, `classes`, `enrollments`, `payment_records`, `audit_events`.
- Sunucu işlemleri: rezervasyon/kapasite mutasyonları transaction ile tek seferde doğrulansın; slot/randevu idempotency anahtarları kullanılsın.
- Public API'de servis anahtarı açığa çıkmasın; rate limit/CAPTCHA ve istenmeyen kayıt önlemleri konulsun.
- Bildirimler ilk aşamada panel içi; SMS/WhatsApp için ayrı entegrasyon ve gerçek maliyet beyanı.
- Saat dilimi işletmeye ait IANA timezone ile saklanmalı; veritabanında UTC.
- Loglarda müşteri telefonunu, kimlik veya klinik bilgileri yazma; yedek ve silme süreçlerini tasarla.
- Her modül için telefon/tablet/masaüstü ekran ve erişilebilirlik testi.
- İşletme paneli: owner/manager/staff. Platform paneli: super-admin, abonelik, firma durumu, destek ve rol denetimi.

## Teslim sırası / kabul kriterleri
1. **Satış sayfası** — tamamlandı. Her sektör işlevsel teklif formuna ve BerberOS gerçek demosuna erişir.
2. **Ortak SaaS iskeleti** — login, işletme oluşturma, tenant veri izolasyonu, owner ve staff rolleri. İki farklı işletme bir diğerinin verisine erişemez.
3. **A: Randevu pilotu** — hizmet/süre/çalışan/mesai ve müşterinin kendi randevusunu alması. Aynı saatte çakışan iki istekten yalnızca biri kabul edilir.
4. **BerberOS entegrasyonu** — eski müşteri ve işlemlere zarar vermeden randevu görünürlüğü, iptal ve raporlama. Kullanıcı iş akışı demo ve telefonda test edilir.
5. **B: Alan modülü** — restoran masası ve halı saha pilotu; aynı kaynak iki kez satılamaz.
6. **C: Kontenjan modülü** — kurs pilotu; dolu sınıfta yeni kayıt yapılamaz.
7. **21 sektör şablonları** — sektör isimleri, alan terimleri, hizmet tipleri, özelleştirilmiş rezervasyon akışları.
8. **Satış otomasyonu** — onboarding, teklif/müşteri takip panosu, demo açılışı, abonelik ve sözleşme akışları.

## Sektör-ürün durumlarının gösterimi
- `ready`: gerçekten test edilip çalışan, satışa hazır.
- `pilot`: kullanıma açılmadan önce pilot müşteriyle doğrulanıyor.
- `planned`: satış ön görüşmesi yapılabilir ancak hazır yazılım olarak sunulmaz.

## Satış / müşteri edinme
- Google'da sektör bazlı açıklamalı açılış sayfaları (kopya içerik olmadan)
- Gerçek demo videosu ve gerçek panel ekran görüntüleri
- WhatsApp taleplerinin manuel takip edilmesinden basit CRM'e geçiş
- Öncelik: BerberOS mevcut müşteri çevresi → kuaför/güzellik → halı saha/stüdyo → restoran → kurs
- Görüşmelerde ihtiyaç, çalışan/kaynak sayısı, şube, bütçe ve satın alma zamanlaması sorulur
- Mevcut BerberOS'un 4.990 TL lisans veya 400 TL/ay teklifleri diğer 20 sektöre otomatik uygulanmaz

## Sürüm politikası
Her aşamada önce test ortamı, sonra tek işletmede pilot, daha sonra üretim. Otomatik yedek ve rollback planı olmadan var olan BerberOS üretim şeması değiştirilmez.
