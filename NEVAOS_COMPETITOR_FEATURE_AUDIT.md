# NevaOS — RandevumOnline Kamuya Açık Özellik Araştırması
Tarih: 14 Kasım 2026

## Kaynak ve sınır
Ana kaynak: https://randevumonline.com/
Özellikle:
- Randevu modülü: https://randevumonline.com/kuafor-randevu-sistemi
- Alan rezervasyonu: https://randevumonline.com/restoran-rezervasyon-sistemi
- Halı saha: https://randevumonline.com/hali-saha-rezervasyon-programi
- Güzellik: https://randevumonline.com/guzellik-merkezi-programi
- Kontenjan: https://randevumonline.com/kurs-etut-merkezi-kayit-sistemi
- Escape room: https://randevumonline.com/kacis-oyunu-rezervasyon-sistemi
- Korku evi: https://randevumonline.com/korku-evi-rezervasyon-sistemi

Ana sitedeki **21 sektör bağlantısının kamuya açık tanıtım sayfaları** incelendi. Bunlar şirketin yazılı belgelerinde anlattığı özelliklerdir; **müşteri girişi gerektiren iç yönetim panelinin tüm ekranlarına erişim yoktu**. Bu nedenle içeride var olduğu belirtilen modülleri doğrulanmış ekran görüntüsü veya kod olarak değil, kamuya açık özellik beyanı olarak değerlendirdik.

## Ortak ürün mimarisi
Şirketin belgelerine göre sistem üç çekirdekte toplanıyor:
1. Birebir randevu (11 sektör)
2. Masa / alan ve saatlik kaynak rezervasyonu (9 sektör)
3. Ders / etkinlik kontenjanı (1 başlangıç sektörü)

Ortak yönetim modülleri: müşteri kartları, personel, randevu takvimi, hizmet-fiyat, müşteri tarafından online kayıt, onay/iptal, hatırlatmalar, adisyon, kasa-tahsilat, gelir-gider, komisyon, stok, raporlar, şubeler, izin ve yetki, otomasyon.

### Sektöre göre özelleştirme
| Sektör | NevaOS demo adresi | Öncelikli özel ihtiyaç |
| --- | --- | --- |
| Kuaför | /neva-demo/kuafor/ | Stilist takvimi, boya/hizmet süresi, müşteri işlem geçmişi |
| Berber | /neva-demo/berber/ | Koltuk, çalışan hakedişi, işlem ve kasa |
| Güzellik Merkezi | /neva-demo/guzellik-merkezi/ | Kabin ve uzman, seans paketi, onam |
| Spa & Masaj | /neva-demo/spa-masaj/ | Terapist, oda, çoklu seans |
| Diyetisyen | /neva-demo/diyetisyen/ | Danışan ve kontrol seans takvimi |
| Veteriner | /neva-demo/veteriner/ | Evcil hayvan ve sahip ilişkisi, muayene |
| Fitness & Spor | /neva-demo/fitness-spor/ | Antrenör, PT paketleri |
| Diş Kliniği | /neva-demo/dis-klinigi/ | Hekim, dental ünit, idari randevu |
| Dövme & Piercing | /neva-demo/dovme-piercing/ | Sanatçı, uzun seans, malzeme |
| Fizyoterapi | /neva-demo/fizyoterapi/ | Terapist ve seans sürekliliği |
| Psikolog | /neva-demo/psikolog/ | Görüşme odası, gizlilik odaklı takvim |
| Restoran & Kafe | /neva-demo/restoran-kafe/ | Bölüm / masa yerleşimi, kişi kapasitesi |
| Kaçış Oyunu | /neva-demo/kacis-oyunu/ | Oda başına tek grup, seans hazırlık payı |
| Korku Evi | /neva-demo/korku-evi/ | Senaryo, gerilim seviyesi, gece seansları |
| Halı Saha | /neva-demo/hali-saha/ | Saha ve takım, gece rezervasyonları |
| Padel & Tenis Kortu | /neva-demo/padel-tenis/ | Kort, ekipman kiralama |
| Prova & Kayıt Stüdyosu | /neva-demo/prova-kayit/ | Stüdyo odası, kayıt süresi, ekipman |
| Fotoğraf & Podcast Stüdyosu | /neva-demo/fotograf-podcast/ | Çekim alanı, paket ve ekipman |
| PlayStation & Oyun Salonu | /neva-demo/playstation-oyun/ | Konsol/VIP oda zaman takibi |
| Toplantı Odası & Ortak Çalışma | /neva-demo/toplanti-calisma/ | Oda, kat, saatlik / günlük kullanım |
| Kurs & Etüt | /neva-demo/kurs-etut/ | Haftalık program, sınıf kapasitesi, yoklama |

## NevaOS tarafında 14 Kasım'da yazılanlar
- 21 **ayrı web yolu**, farklı demo işletmeleri, çalışan isimleri, hizmetleri, kaynakları, stokları ve renkleri.
- Her sektörde genel bakış, haftalık takvim, rezervasyon ekleme/düzenleme/durum, müşteri kartı, hizmet/fiyatlar, ekip, kasa/tahsilat/gider, stok, rapor, mesaj şablonları, ayarlar ve müşteri tarafı rezervasyon önizlemesi.
- Her yeni rezervasyonda bu tarayıcıdaki kaynak/çalışan saat çakışma kontrolü; alan rezervasyonunda kapasite.
- Alan rezervasyonu sektörlerinde kaynak/yerleşim görünümü.
- Randevu sektörlerinde seans paketi bakiyesi, kullanım ve paket kayıtları.
- Kursta haftalık ders programı şablonları, kayıt, kontenjan kontrolü ve manuel yoklama.
- Kurgusal başlangıç verileri; ekleme ve değişiklikler sektör başına localStorage ile korunur.
- Ürün kataloğunda ilgili paneli açma ve demo talebi oluşturma.
- Demo taleplerini mevcut NevaWebDesign web sitesi Supabase `intake-lead` akışına göndermeye çalışan form; admin panelinde `Demo Talepleri` filtresi.

## Demo ile gerçek SaaS arasındaki fark — yapılması gerekenler
Aşağıdaki başlıklar **tamamlanmış veya production-ready değildir**:
- Her işletmenin gerçek kullanıcı hesapları, güvenli veri izolasyonu, üyelik/onboarding, rol bazlı RLS, güvenli audit logları
- Gerçek veritabanında atomik rezervasyon/kontenjan kilidi; iki tarayıcı aynı saate rezervasyon yapamasın
- SMS/WhatsApp servis entegrasyonu; oran sınırı, izin ve şablon yönetimi
- Gerçek tahsilat, kapora, iade, faturalaştırma ve ödeme sağlayıcısı entegrasyonu
- Çok şubeli ve eşzamanlı canlı takvim / ortak müşteri kartı
- Stok hizmet tüketimi otomasyonu, otomatik rapor arka işleri
- Sürükle-bırak salon / oda yerleşim editörü
- Tekrarlı ders şablonundan gerçek tarihli oturum üretimi ve eşzamanlı kapasite yönetimi
- Gerçek QR kodlu güvenli yoklama, paket üyelik düşümü
- Dosya depolama, fotoğraf galerisi, onam/izin akışı, KVKK ve sağlık verilerinin özel korunması
- Tam kapsamlı testler, hata yönetimi, yedekleme ve veri migrasyonu
- Tüm RandevumOnline admin ekranları birebir incelenemediği için tam özellik eşdeğerliği doğrulanmamıştır

## Sonraki geliştirme sırası
1. Ayrı test ortamında `supabase/nevaos-v1-draft.sql` kontrolü, migrasyonlar ve rol/RLS testleri.
2. Kullanıcı girişleri, tenant oluşturma, görev ve yetki modeli.
3. Birebir randevu için gerçek API + transaction/saat çakışma kontrolü.
4. Online müşteriye özel güvenli rezervasyon uç noktası ve iptal akışı.
5. Alan/masa ve kontenjan rezervasyonu sunucu modülleri.
6. Kasa, stok, paket ve hizmet entegrasyonları.
7. SMS/WhatsApp sağlayıcısı, ödeme, QR yoklama, galeri ve şubeler.
8. Pilotta doğrulandıktan sonra gerçek BerberOS'un güvenli geçişi.

**Önemli:** Demo verileri gerçek kişilerden alınmamalı. Canlı BerberOS Supabase veritabanı değiştirilmedi. Panel tasarımı ve uygulama kodu NevaWebDesign için özgün oluşturuldu; üçüncü tarafın özel kaynak kodu kullanılmadı.
