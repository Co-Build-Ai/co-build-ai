# Co-Build AI — Proje Özeti

## Ne Yapıyoruz
Fikir sahipleri (non-technical founder) ile yazılımcıları buluşturan bir pazar yeri platformu. Fikir sahibi projesini yazıyor, yerel bir AI modeli bunu profesyonel bir PRD'ye çeviriyor + gereken beceri etiketlerini çıkarıyor, yazılımcılar bu projeleri (ve fikir sahipleri de yazılımcı profillerini) keşfedip eşleşiyor.

## Kullanıcı Profili
Proje sahibi (Esma) Python/ML deneyimli ama web geliştirmede yeni. Adım adım, öğreterek ilerleniyor — kod verirken kısa açıklamalar önemli. Windows kullanıyor.

## Mimari (ÖNEMLİ — bilerek böyle kuruldu)
- **Frontend + Backend (web):** Next.js 16 (App Router, TypeScript, Tailwind CSS v4) — bu bilgisayarda çalışıyor
- **Veritabanı/Auth:** Supabase (PostgreSQL + RLS + Authentication)
- **AI motoru:** AYRI bir GPU'lu makinede çalışıyor — vLLM ile serve edilen `Qwen/Qwen2.5-32B-Instruct-AWQ` (AWQ quantization, `--max-model-len 4096 --gpu-memory-utilization 0.85`) + LangChain + FastAPI, `co-build-ai-server` klasöründe, Python venv içinde. (GÜNCELLEME: önceden Ollama + llama3.1:8b CPU üzerinde çalışıyordu, artık GPU'da vLLM+Qwen2.5-32B'ye geçildi — CPU/hız ile ilgili eski notlar artık geçerli değil.)
- **Agentic RAG:** PRD üretimi artık tek seferlik prompt değil, kendi çıktısını denetleyip revize eden bir agent döngüsü (taslak → kendi kendine eleştiri → düzeltme → onay) — `co-build-ai-server` tarafında.
- **Eşleştirme motoru:** Supabase pgvector ile embedding tabanlı semantik arama kullanıyor (önceki `required_skills` dizi kesişimi yöntemi yerine) — Founder'ın Keşfet ekranında canlıda çalışıyor.
- **İki makine arası bağlantı:** Aynı Wi-Fi/mobil hotspot ağında, yerel IP üzerinden (`.env.local`'de `NEXT_PUBLIC_AI_SERVICE_URL`). Bu IP her ağ değişiminde değişebilir, güncellenmesi gerekebilir.
- **Neden yerel/açık kaynak AI?** KVKK uyumluluğu için — "veri yurtdışına çıkmıyor" iddiası, OpenAI/Gemini gibi dış API'ler yerine kendi sunucumuzda (kendi GPU'muzda) açık kaynak LLM çalıştırıyoruz.
- **AI çağrısı ASENKRON çalışıyor:** Next.js, FastAPI'nin `/prd-uret-baslat` endpoint'ine istek atıp hemen döner, sonuç `job_store` (bellek içi) tutulur, Next.js tarafı `/prd-durum/{id}` ile periyodik sorgular (polling), sonuç gelince Supabase'e yazılır. GPU'ya geçişle PRD üretim süresi büyük ölçüde kısaldı ama polling mimarisi olduğu gibi korundu (kullanıcıyı bloklamamak için).

## Tamamlanan Aşamalar (AŞAMA 1-17)
1. Kurulum (Node.js, VS Code, Git)
2. Next.js proje oluşturma
3. Tasarım sistemi (renk paleti: coral #fd5e51, periwinkle #9fc2fa, petal #ffdef9, ink #3d3229; fontlar: Plus Jakarta Sans, Fraunces, JetBrains Mono) + ana sayfa
4. Supabase kurulumu + veritabanı şeması + bağlantı
5. Kayıt/giriş/çıkış sistemi (roller: founder/developer), KVKK onay checkbox'ı (terms_accepted_at)
6. Fikir girişi formu (`/fikir-ekle`)
7. AI entegrasyonu (Ollama+LangChain+FastAPI), PRD üretimi + beceri etiketi çıkarma + benzer örnekler + maliyet kategorisi, hepsi tek promptta birleşik
8. Panel/Profil ayrımı: `/panel` = "Keşfet" (karşı taraftaki kullanıcıları/projeleri görme), `/profil` = kendi bilgilerin + kendi projelerin
9. Yazılımcı profil düzenleme (bio, skills) + portfolyo (proje/sertifika ekleme, `portfolio_items` tablosu, item_type: project/certificate)
10. Yazılımcı proje detay görünümü: `/proje/[id]`'de founder olmayan bir developer, yayınlanmış bir projeye tıklayınca önce NDA/gizlilik onay ekranı görüyor (`developer-project-view.tsx`), onaylayınca PRD'yi görüyor; onay `project_nda_acceptances`'a, her görüntüleme `project_views`'a client-side insert ile kaydediliyor. Bu iki tabloya gerekli RLS insert/select policy'leri eklendi (kendi kaydını ekleyebilme + kendi/kendi projesi olan kayıtları okuyabilme).
11. GitHub son commit gösterimi: Portfolyodaki (`portfolio-section.tsx`) bir öğenin "Link" alanı `github.com/owner/repo` formatındaysa, GitHub'ın public commits API'sinden (`api.github.com/repos/{owner}/{repo}/commits`, auth gerektirmez) son commit mesajı + tarihi çekilip kartta gösteriliyor. Link GitHub formatında değilse veya repo bulunamazsa (private/hatalı link) sessizce gösterilmiyor, hata çıkmıyor.
12. Teklif sistemi: Founder projeyi yayınlarken ödeme tipi seçiyor (Sabit Ücret / Ortaklık / Esnek — `payment-section.tsx`'teki `PublishForm`), yayınladıktan sonra da `PaymentEditor` ile bunu istediği zaman değiştirebiliyor (durumu draft'tan published'a çevirmeden). Proje "Esnek" ise, developer teklif verirken hangi tipte teklif ettiğini kendisi seçiyor (`developer-project-view.tsx`), değilse projenin tipini otomatik alıyor. Developer teklifini `offers` tablosuna kaydediyor (tek teklif/proje), founder `offers-list.tsx`'te gelen teklifleri görüp Kabul Et/Reddet diyebiliyor.
13. Bildirimler + teklif bazlı sohbet: `offers-list.tsx`'te bir teklif kabul/red edildiğinde developer'a `notifications` tablosuna bir satır yazılıyor; `app/components/notification-bell.tsx` (panel ve profil header'larında) bunu 20 saniyede bir polling ile çekip 🔔 ikonunda okunmamış sayısını gösteriyor, tıklayınca ilgili projeye götürüp okundu işaretliyor. Her teklifin altında `app/components/chat-box.tsx` ile founder-developer arası anlık (Supabase Realtime) sohbet var; mesajlar `messages` tablosuna kaydediliyor, `offer_id` ile bir teklife bağlı (yani sohbet proje bazlı değil, teklif bazlı — founder'ın farklı developer'larla ayrı ayrı sohbetleri var). Mesaj gönderilince karşı tarafa da bir `notifications` satırı yazılıyor.
14. Dashboard layout restructürü: `/panel` ve `/profil`, Next.js route group ile `app/(dashboard)/` altına taşındı (URL değişmedi). Ortak bir `app/(dashboard)/layout.tsx` var — auth kontrolü + sol `Sidebar` (nav: Keşfet/Profilim/Ayarlar/(founder ise) Fikir Ekle + rozetler + mini istatistikler + kullanıcı kartı + çıkış) + üst `Topbar` (sayfa adı + bildirim zili + kullanıcı avatarı) render ediyor. İkon kütüphanesi olarak `lucide-react` kuruldu (öncesinde hiç ikon kütüphanesi yoktu). Yeni `/ayarlar` sayfası eklendi: e-posta gösterimi, şifre değiştirme (`change-password.tsx`), hesap silme (`delete-account.tsx`, GitHub tarzı "e-postanı yazarak onayla" akışı). Hesap silme, `app/api/hesap-sil/route.ts` sunucu route'unda Supabase **service role key** (`.env.local`'de `SUPABASE_SERVICE_ROLE_KEY`, asla client'a gitmiyor) ile tüm bağlı verileri (mesajlar, teklifler, bildirimler, NDA/görüntüleme kayıtları, portfolyo, projeler, profil) sırayla silip en son auth kullanıcısını siliyor.
15. Renk paleti değişikliği: Kullanıcı isteğiyle orijinal coral/periwinkle/petal/ink paleti, "Projector" adlı bir dashboard tasarımından ilham alınarak pembe/yeşil/nötr-siyah tonlarına çevrildi (`globals.css`'teki `@theme` bloğunda sadece hex değerleri değişti, **değişken/class isimleri aynı kaldı** — yani kodda `bg-coral` hâlâ var ama artık pembe demek, `periwinkle` artık yeşil demek). Sidebar önce koyu (siyah/patlıcan) yapıldı, kullanıcı beğenmeyince açık, petal-tonlu (soluk pembe) hale geri döndü — sayfa arka planı da (`--background`) düz beyazdan soluk pembe tonuna çevrildi, sidebar/topbar/içerik aynı sıcak aile içinde birbirine uyumlu.
16. Değerlendirme/puanlama sistemi: Yeni `ratings` tablosu — bir teklif **kabul edildikten sonra**, hem founder developer'ı hem developer founder'ı 1-5 yıldız + isteğe bağlı yorumla değerlendirebiliyor (`rate-offer-form.tsx`, aynı kişi aynı teklif için tekrar değerlendiremiyor — `unique(offer_id, rater_id)`). Ortalama puan (`rating-stars.tsx`) sidebar'da kendi adının altında, founder'ın Keşfet'te gördüğü developer kartlarında, ve bir projenin gelen teklifler listesinde gösteriliyor. Hiç değerlendirme yoksa "Henüz değerlendirme yok" yazıyor, sahte/varsayılan puan YOK. (Önce "Güven Skoru" adında profil-tamamlama sinyallerinden hesaplanan bir skor da eklenmişti, kullanıcı "saçma" bulup kaldırılmasını istedi, bu gerçek yıldız sistemiyle değiştirildi.)
17. Hızlı Eşleştirme (AI): Founder'ın `/panel` sayfasının üstünde `quick-match.tsx` — aklındaki projeyi kısaca yazıp gönderince, **aynı mevcut AI altyapısı** (`/prd-uret-baslat` + `/prd-durum/{id}` polling, AŞAMA 7'deki ile birebir aynı) kullanılarak bir taslak proje oluşturuluyor, PRD/beceri etiketleri üretiliyor, sonra kayıtlı yazılımcılarla beceri uyum yüzdesine göre (eşitlikte puana göre) sıralı en iyi 5 eşleşme gösteriliyor. Yeni bir AI endpoint'i YAZILMADI (ikinci bilgisayardaki koda dokunulmadı), var olan endpoint'in zaten döndürdüğü `skills` verisi kullanıldı. Founder'ın Keşfet'teki düz yazılımcı listesine de ayrıca isim/beceriye göre basit arama kutusu eklendi (`founder-developers.tsx`). Developer tarafında zaten var olan proje arama+sekmeler (AŞAMA ile birlikte kurulmuştu) korundu. **DURUM: Kod yazıldı ve derleme testi geçti ama ikinci bilgisayar (AI sunucusu) o an ortamda olmadığı için uçtan uca TEST EDİLMEDİ — bir sonraki oturumda ikinci bilgisayar açıkken test edilmesi gerekiyor.**

## Veritabanı Tabloları (Supabase)
- `profiles` (id, user_type, full_name, bio, skills[], terms_accepted_at)
- `projects` (id, founder_id, title, raw_idea, generated_prd, required_skills[], status: draft/published, idea_hash, idea_created_at, payment_type, payment_amount)
- `portfolio_items` (id, developer_id, title, description, file_url, item_type, issuer, item_date)
- `project_nda_acceptances` (id, project_id, developer_id, accepted_at) — arayüze bağlandı (AŞAMA 10), RLS policy'leri eklendi
- `project_views` (id, project_id, viewer_id, viewed_at) — arayüze bağlandı (AŞAMA 10), RLS policy'leri eklendi
- `offers` (id, project_id, developer_id, message, proposed_amount, proof_link, payment_type: fixed/equity, status: pending/accepted/rejected) — arayüze bağlandı (AŞAMA 12), RLS policy'leri eklendi
- `notifications` (id, user_id, project_id, type, message, read_at) — arayüze bağlandı (AŞAMA 13), RLS policy'leri eklendi
- `messages` (id, offer_id, sender_id, content) — arayüze bağlandı (AŞAMA 13), RLS policy'leri eklendi, Realtime açık (`supabase_realtime` publication'a eklendi)
- `ratings` (id, offer_id, rater_id, rated_user_id, score 1-5, comment) — arayüze bağlandı (AŞAMA 16), RLS policy'leri eklendi, `unique(offer_id, rater_id)`

## Bekleyen İşler
- **Hızlı Eşleştirme testi (AŞAMA 17):** İkinci bilgisayar (AI sunucusu) açıkken uçtan uca test edilmesi gerekiyor — kod hazır, henüz doğrulanmadı.

## Bilinçli Olarak v2'ye Ertelenenler (ŞİMDİ EKLEMEYİN)
- Gerçek para transferi / escrow YOK, teklif sistemi sadece niyet beyanı
- Biyometrik KYC, Stripe/escrow ödeme, NDA dijital imza, mobil uygulama
- Patent veritabanı karşılaştırması
- Tinder-tarzı kaydırma/swipe eşleştirme (bilerek vazgeçildi, liste bazlı kalındı)
- GitHub commit'e göre otomatik milestone/ödeme tetikleme (sadece pasif repo linki gösterimi var)
- Platform içi kod editörü/sandbox (bunun yerine dış link ile "kanıt" paylaşımı)
- Gerçek zamanlı rakip arama (dış API bağımlılığı olur, sadece modelin kendi bilgisiyle "benzer örnek" üretiliyor)

## Bilinen Riskler / Dikkat Edilmesi Gerekenler
- (ESKİ RİSK, ARTIK GEÇERSİZ) İkinci bilgisayarda GPU yoktu, Ollama CPU'da çalışıyordu — artık ayrı bir GPU'lu makinede vLLM+Qwen2.5-32B-AWQ kullanılıyor, bu risk ortadan kalktı
- Kod yapıştırılırken `<a` etiketlerinin başı sık sık kayboluyordu (kopyala-yapıştır sorunu) — Claude Code'da bu risk olmamalı çünkü artık dosyalar doğrudan düzenleniyor
- `.env.local` içindeki `NEXT_PUBLIC_AI_SERVICE_URL`, ağ değişince güncellenmesi gerekiyor
- Sunum için demo/simülasyon verisi (sahte yazılımcı profilleri + proje fikirleri) henüz eklenmedi, planlanıyor
- İkinci bilgisayardaki AI sunucusu kapalıyken `generated_prd` bekleyen bir proje sonsuza kadar "PRD hazırlanıyor" gösterir (sessizce retry eder, hata vermez). PRD'ye bağlı olmayan bir özelliği test ederken AI sunucusunu açmaya gerek yok — Supabase Table Editor'den ilgili projenin `generated_prd`/`required_skills` alanlarına elle örnek veri yazıp yayınlamak yeterli.

## Kod Tarzı Notları
- Sayfalar `app/` altında Next.js App Router yapısında
- `/panel`, `/profil`, `/ayarlar` → `app/(dashboard)/` route group'u içinde (ortak sidebar/topbar layout'u paylaşıyorlar); `/proje/[id]`, `/fikir-ekle`, `/giris`, `/kayit-ol` bu grubun dışında, kendi başlarına
- Client component'ler `"use client"` ile başlıyor, tıklanabilir/etkileşimli her şey ayrı dosyada (örn. `logout-button.tsx`, `payment-section.tsx`)
- Birden fazla sayfada kullanılan ortak component'ler `app/components/` altında (örn. `notification-bell.tsx`, `chat-box.tsx`, `rating-stars.tsx`, `avatar.tsx`)
- Sunucu tarafı, gizli anahtar gerektiren işlemler `app/api/*/route.ts` altında (örn. `hesap-sil`) — service role key gibi sırlar sadece burada, `NEXT_PUBLIC_` öneki YOK
- Tailwind renkleri `globals.css`'te `@theme` bloğunda tanımlı: `bg-coral`, `text-ink`, `bg-petal`, `border-periwinkle-dark` vb. — İSİMLER ilk kurulan paletten kalma ama DEĞERLER artık farklı (AŞAMA 15), kod okurken class ismine değil `globals.css`'teki gerçek hex değerine güven