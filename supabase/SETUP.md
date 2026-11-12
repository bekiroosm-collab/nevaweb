# NevaWebDesign CRM — Güvenli kurulum

Bu dizin, mevcut statik Vercel sitesine eklenecek yönetim panelinin **veritabanı altyapısını** içerir. Panel arayüzü henüz canlıya alınmamıştır.

## 1. Supabase
1. Supabase'te NevaWebDesign için yeni proje oluştur.
2. SQL Editor > New query ekranında `supabase/schema.sql` içeriğini çalıştır.
3. Authentication > Users > Add user üzerinden yalnızca sana ait bir yönetici hesabı oluştur. Kullanıcıların herkese açık kayıt olmasına izin verme.
4. Oluşan kullanıcının UUID'sini kopyala ve SQL Editor'de aşağıdaki komutu **UUID'yi değiştirerek** çalıştır:

```sql
insert into public.nwd_admins(user_id) values ('BURAYA-ADMIN-USER-UUID')
on conflict (user_id) do nothing;
```

## 2. Sonraki adım
Supabase Project URL ve **publishable/anon key** alınır; Vercel'e public yapılandırma olarak girilir. **service_role/secret key hiçbir zaman frontend'e eklenmez.** RLS kuralları müşteri, teklif, proje ve ödeme bilgilerini yalnızca nwd_admins tablosunda bulunan giriş yapmış kullanıcıya açar.

## 3. Veri modeli
- `nwd_clients`: müşteri/işletme iletişim bilgileri
- `nwd_quotes`: teklif tutarları ve durumları
- `nwd_projects`: proje aşamaları ve süreler
- `nwd_transactions`: tahsilat ve giderler
- `nwd_admins`: yönetici erişim listesi

## Güvenlik notları
- Bu SQL'i çalıştırmak tek başına yönetim panelini oluşturmaz.
- Anonim ziyaretçilere müşteri kayıtları açılmaz.
- Yönetici üyeliği yalnızca SQL Editor'den atanır; herkese açık API üzerinden atanamaz.
- Kişisel veriler için aydınlatma, saklama ve erişim prosedürleri ayrıca hazırlanmalıdır.
