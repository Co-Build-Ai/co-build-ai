# Co-Build AI — Proje Özeti

> **Not:** Projenin en güncel ve kapsamlı özeti artık proje kökünde `CLAUDE.md` (v3) dosyasında. Bu dosya (`app/CLAUDE.md`), Next.js tarafının (frontend) kod-seviyesi özetini tutan tamamlayıcı bir günlüktür — güncel mimari bilgisi için kök `CLAUDE.md`'ye bakılmalı, çelişki olursa kök dosya esas alınmalı.

## Ne Yapıyoruz
Fikir sahipleri (non-technical founder) ile yazılımcıları buluşturan bir pazar yeri platformu. Fikir sahibi projesini yazıyor, bir AI bunu profesyonel bir PRD'ye çeviriyor + gereken beceri etiketlerini çıkarıyor, yazılımcılar bu projeleri (ve fikir sahipleri de yazılımcı profillerini) keşfedip eşleşiyor.

## Kullanıcı Profili
Proje sahibi (Esma) Python/ML deneyimli, web geliştirmede artık orta seviyede (proje ilerledikçe öğrendi). Berna ile birlikte geliştiriyor. Adım adım, gerekçeli açıklamalarla ilerlemeyi tercih ediyor. Windows kullanıyor.

## Mimari (GÜNCEL — kök CLAUDE.md v3 ile senkronize)
- **Frontend + Backend (web):** Next.js 16 (App Router, TypeScript, Tailwind CSS v4) — bu bilgisayarda çalışıyor
- **Veritabanı/Auth:** Supabase (PostgreSQL + RLS + Authentication)
- **AI motoru — ARTIK RunPod/vLLM (Ollama DEĞİL):** `Qwen/Qwen2.5-32B-Instruct-AWQ`, vLLM ile serve ediliyor (OpenAI-uyumlu API), RunPod'da kiralanan bir GPU sunucusunda (RTX 4090, 24GB VRAM) çalışıyor. `co-build-ai-server` reposunda, `main.py` artık `OllamaLLM` değil **`ChatOpenAI`** (LangChain'in OpenAI-uyumlu istemcisi) kullanıyor; `openai_api_base` RunPod'un proxy adresine yönlendiriliyor. Kalıcı kurulum `/workspace` altında (Network Volume) — Pod her Stop/Start sonrası `vllm serve ...` komutu elle tekrar çalıştırılmalı. Detaylar için kök `CLAUDE.md` Bölüm 3.
- **Agentic RAG:** PRD üretimi artık tek seferlik prompt değil, kendi çıktısını denetleyip revize eden bir agent döngüsü (taslak → öz-eleştiri → düzeltme → onay) — `co-build-ai-server` tarafında.
- **Eşleştirme motoru:** `eslestirme_endpoints.py` / `matchmaking_engine.py` ile semantik eşleştirme (embedding tabanlı); skor normalizasyonunda bilinen bir sorun var (düşük/anlamsız skorlar üretebiliyor), incelenmesi gerekiyor.
- **İki makine arası bağlantı:** RunPod internet üzerinden erişilebilir olduğu için artık aynı Wi-Fi ağında olma zorunluluğu YOK (önceki Ollama döneminden kalma bir kısıtlamaydı).
- **Neden yerel/açık kaynak AI?** KVKK uyumluluğu için — veri yurtdışına çıkmıyor, kendi kiraladığımız GPU'da açık kaynak model çalıştırıyoruz.
- **AI çağrısı ASENKRON çalışıyor:** Next.js, FastAPI'nin `/prd-uret-baslat` endpoint'ine istek atıp hemen döner, sonuç `job_store` (bellek içi) tutulur, Next.js tarafı `/prd-durum/{id}` ile periyodik sorgular (polling), sonuç gelince Supabase'e yazılır.
- **İki repo:** `co-build-ai` (Next.js, esmacakar hesabı, bu repo) ve `co-build-ai-server` (Python/FastAPI, berna1727 hesabı, private, ayrı).

## Tamamlanan Aşamalar (AŞAMA 1-17, frontend tarafı)
1. Kurulum (Node.js, VS Code, Git)
2. Next.js proje oluşturma
3. Tasarım sistemi (renk paleti + fontlar) + ana sayfa — **palet birden çok kez değişti, bkz. "Tasarım Geçmişi" bölümü**
4. Supabase kurulumu + veritabanı şeması + bağlantı
5. Kayıt/giriş/çıkış sistemi (roller: founder/developer), KVKK onay checkbox'ı (terms_accepted_at)
6. Fikir girişi formu (`/fikir-ekle`)
7. AI entegrasyonu (o dönem Ollama+LangChain+FastAPI, sonradan RunPod/vLLM'e taşındı — bkz. Mimari bölümü), PRD üretimi + beceri etiketi çıkarma
8. Panel/Profil ayrımı: `/panel` = "Keşfet", `/profil` = kendi bilgilerin + kendi projelerin
9. Yazılımcı profil düzenleme (bio, skills) + portfolyo (proje/sertifika ekleme, `portfolio_items` tablosu)
10. Yazılımcı proje detay görünümü: NDA/gizlilik onay ekranı (`developer-project-view.tsx`) → PRD görüntüleme; `project_nda_acceptances` + `project_views` tabloları arayüze bağlı
11. GitHub son commit gösterimi (portfolyo linki `github.com/owner/repo` formatındaysa)
12. Teklif sistemi: ödeme tipi seçimi (Sabit Ücret / Ortaklık / Esnek), `offers` tablosu, founder Kabul Et/Reddet
13. Bildirimler + teklif bazlı sohbet (`notifications`, `messages` tabloları, Supabase Realtime)
14. Dashboard layout: `(dashboard)` route group, sidebar + topbar (TailAdmin referanslı), `/ayarlar` sayfaları, hesap silme (`app/api/hesap-sil/route.ts`, service role key ile)
15. Renk paleti değişikliği — bkz. "Tasarım Geçmişi"
16. Değerlendirme/puanlama sistemi (`ratings` tablosu, teklif kabul edildikten/proje tamamlandıktan sonra)
17. Hızlı Eşleştirme (`quick-match.tsx`) + Doğrudan Arama (`direct-search.tsx`) — semantik eşleştirme motoruna bağlı

## YENİ (kök CLAUDE.md'den, henüz bu dosyada detaylandırılmamıştı)
- **Dual-Role sistemi — KISMEN BAŞLADI:** `app/components/role-switcher.tsx` ve `app/lib/roles.ts` mevcut. Kullanıcının hem founder hem developer olabilmesi; MVP tamamlanmadan erken başlatılmış olabilir, kapsamı kullanıcıyla netleştirilmeli.
- **Patent RAG + Tescilli Mucit Çarpanı — AKTİF PLANLANIYOR (henüz uygulanmamış olabilir):** HUPD/hupd (Harvard USPTO) veri seti, PRD akışına "Patent/Özgünlük Kontrolü" bölümü, `profiles.has_verified_patent` sütunu + eşleştirmede `PATENT_CARPAN = 1.15` çarpanı. Detay için kök `CLAUDE.md` Bölüm 8.

## Tasarım Geçmişi (ÖNEMLİ — çok kez değişti, en son duruma güven)
Palet defalarca değiştirildi bu oturumlar boyunca: orijinal coral/periwinkle/petal/ink (sıcak tonlar) → pembe/yeşil ("Projector" ilhamlı) → koyu yeşil/limon → mor/lime → krem/hardal sarısı (exelo.ai referanslı) → beyaz zemin + pembe-mor gradyan (DeepLearning.AI referanslı) → siyah zemin denemesi (kullanıcı beğenmedi, geri alındı) → **güncel: açık mavi tonlu zemin (`blue-50`) + beyaz/açık mavi sidebar + "bebek mavisi" (`blue-200`) vurgulu kartlar (Hızlı Eşleştirme, Doğrudan Arama, Öne Çıkan Projeler, En Aktif Yazılımcılar, Yazılımcılar Akışı, sıralanan yazılımcı kartları), kart başlıkları siyah 3D kabartmalı rozet, kart içi yazılar belirgin siyah**. Token isimleri (`bg-coral`, `text-ink`, `bg-petal` vb.) hep aynı kaldı, sadece `globals.css`'teki `@theme` bloğundaki hex değerleri değişti — kodu okurken class ismine değil gerçek hex değerine güven.

## Veritabanı Tabloları (Supabase, bilinen)
- `profiles` (id, user_type, full_name, bio, skills[], terms_accepted_at, cv_url) — `user_type` dual-role için değişiyor olabilir, kontrol edilmeli
- `projects` (id, founder_id, title, raw_idea, generated_prd, required_skills[], status, idea_hash, idea_created_at, payment_type, payment_amount, matched_developers)
- `portfolio_items` (id, developer_id, title, description, file_url, item_type, issuer, item_date)
- `project_nda_acceptances`, `project_views` — arayüze bağlı
- `offers` (id, project_id, developer_id, message, proposed_amount, proof_link, payment_type, status, completed_at) — arayüze bağlı
- `notifications`, `messages` — arayüze bağlı, Realtime açık
- `ratings` (id, offer_id, rater_id, rated_user_id, score, comment, unique(offer_id, rater_id)) — arayüze bağlı, `offer.completed_at` set edildikten sonra değerlendirme açılıyor
- **Planlanan, henüz eklenmedi:** `profiles.has_verified_patent` (patent RAG için)

RLS tüm tablolarda aktif.

## Bilinçli Olarak v2'ye Ertelenenler
- Gerçek para transferi / escrow yok
- Biyometrik KYC, Stripe/escrow ödeme, NDA dijital imza, mobil uygulama
- Tinder-tarzı swipe eşleştirme (kesin vazgeçildi)
- GitHub commit'e göre otomatik milestone/ödeme tetikleme
- Platform içi kod editörü/sandbox
- Gerçek zamanlı rakip/web taraması
- Tam kapsamlı, resmi patent ofisi entegrasyonu (statik veri setli prototip MVP'ye alınıyor, bkz. yukarısı)

## Git İş Akışı
- İki ayrı repo: `co-build-ai` (bu repo) ve `co-build-ai-server`
- Rutin: `git pull` (başlamadan önce) → çalış → `git add . && git commit -m "..." && git push`
- Merge conflict yaşanabiliyor (paralel oturumlar/Berna ile) — çakışan dosyaları okuyup iki tarafı da koruyarak birleştir, kullanıcı elle çözmesin

## Bilinen Riskler
- `.env.local` içindeki `NEXT_PUBLIC_AI_SERVICE_URL` / RunPod proxy URL'i, Pod yeniden deploy edilince değişebilir — güncellenmesi gerekebilir
- RunPod Pod kapalıyken PRD üretimi bekleyen bir proje sonsuza kadar "PRD hazırlanıyor" gösterir (sessizce retry eder, hata vermez)
- Kod tabanı, kullanıcının hafızasından ileride olabilir (paralel oturumlar) — yeni bir işe başlamadan önce ilgili dosyaları oku, varsayımda bulunma

## Kod Tarzı Notları
- Sayfalar `app/` altında Next.js App Router yapısında
- `/panel`, `/profil`, `/ayarlar` → `app/(dashboard)/` route group'u içinde; `/proje/[id]`, `/fikir-ekle`, `/giris`, `/kayit-ol` bu grubun dışında
- Client component'ler `"use client"` ile başlıyor, tıklanabilir/etkileşimli her şey ayrı dosyada
- Ortak component'ler `app/components/` altında
- Sunucu tarafı, gizli anahtar gerektiren işlemler `app/api/*/route.ts` altında (`SUPABASE_SERVICE_ROLE_KEY` asla client'a gitmiyor)
- Tailwind renkleri `globals.css`'te `@theme` bloğunda tanımlı — İSİMLER kalıcı, DEĞERLER sık değişti (bkz. Tasarım Geçmişi)
