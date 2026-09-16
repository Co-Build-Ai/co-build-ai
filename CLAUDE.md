# Co-Build AI — CLAUDE.md (v5, 2026-09-16)

Bu dosya Claude Code oturumlarında otomatik okunur. **v5 notu:** Bu revizyon, iki repodaki (`co-build-ai` + `co-build-ai-server`) gerçek kod okunarak (dosya dosya, git log dahil) hazırlandı — önceki "v3"/"v4" karışıklığı (bir merge sırasında v4 kaybolup v3'e dönülmüştü) bu sürümle kapatıldı. Yeni bir işe başlamadan önce yine de ilgili dosyayı oku — bu proje hızlı değişiyor ve iki kişi (Esma + Berna) paralel çalışıyor, sık sık merge conflict yaşanıyor.

## 1. Proje Nedir

**Co-Build AI**: Teknik bilgisi olmayan fikir sahiplerini (founder) yazılımcılarla (developer) buluşturan bir pazar yeri platformu. Fikir sahibi projesini kendi cümleleriyle yazıyor, bir AI (LangGraph tabanlı agent, tek seferlik prompt değil) bunu profesyonel bir PRD'ye çeviriyor + beceri etiketleri çıkarıyor + patent çakışması kontrolü yapıyor. Yazılımcılar ve fikir sahipleri birbirini semantik arama ile keşfediyor, teklif/davet gönderiyor, mesajlaşıyor, değerlendiriyor.

## 2. Kullanıcı Profili

Esma — Python/ML deneyimli, web geliştirmede orta seviyede (proje ilerledikçe öğrendi). Windows kullanıyor. Berna ile birlikte geliştiriyor (iki ayrı GitHub hesabı, iki ayrı repo). Adım adım, gerekçeli açıklamalarla ilerlemeyi tercih ediyor. Rutin işlemleri (commit/push gibi) her seferinde onay istemeden yapılmasını istiyor.

## 3. İki Repo

- **`co-build-ai`** (bu repo, `Co-Build-Ai/co-build-ai` GitHub org'u altında) — Next.js 16 frontend, esmacakar hesabıyla da çalışılıyor.
- **`co-build-ai-server`** (`Co-Build-Ai/co-build-ai-server`) — Python/FastAPI AI servisi, berna1727 hesabıyla da çalışılıyor, private.
- Rutin: `git pull` → çalış → `git add <spesifik dosyalar>` (asla `-A` körlemesine değil, paralel oturumun commit'lenmemiş işini ezmemek için) → `git commit` → `git push`. Merge conflict olursa dosyaları okuyup iki tarafı da koruyarak birleştir.

## 4. AI Altyapısı (RunPod/vLLM)

- **Model:** `Qwen/Qwen2.5-32B-Instruct-AWQ`, **vLLM** ile serve ediliyor (OpenAI-uyumlu API). Kod tarafında (`prd_agent.py`) `ChatOpenAI` (LangChain) kullanılıyor, `VLLM_BASE_URL`/`VLLM_MODEL_ADI`/`VLLM_API_KEY` env değişkenleriyle yönlendiriliyor (varsayılan: `http://localhost:8000/v1`, model adı yukarıdaki, key `EMPTY`).
- **Donanım:** RunPod'da kiralanan GPU sunucusu (RTX 4090, 24GB VRAM, ~$0.75/saat). Kod içinde RunPod'a özgü hiçbir env değişkeni okunmuyor — sadece jenerik `VLLM_*` değişkenleri. Kurulum/Pod detayları (Network Volume, `vllm serve ...` komutu vb.) operasyonel bilgi, kodda değil.
- Pod yeniden deploy edilirse `VLLM_BASE_URL` değişir → hem server'ın `.env`'i hem web'in `NEXT_PUBLIC_AI_SERVICE_URL`'i güncellenmeli, yoksa istekler sessizce başarısız olur (frontend try/catch ile yutuyor).
- Embedding modeli (`sentence-transformers/all-MiniLM-L6-v2`) ve BM25 tamamen CPU'da çalışıyor, RunPod/vLLM'e ihtiyaç duymuyor — demo veri/embedding script'leri Pod kapalıyken de çalıştırılabilir.

## 5. PRD Üretim Akışı (LangGraph, `co-build-ai-server/prd_agent.py`)

```
prd_uret --> elestir --(onaylandı ya da 2. deneme)--> eslestir --> END
    ^                        |
    +-- (revize gerekli) ----+
```

- `MAX_ITERATIONS = 2` (ilk üretim + en fazla 1 düzeltme), ek güvenlik olarak `recursion_limit=8`.
- Öz-eleştiri iki aşamalı: önce regex ile Çince/Kiril/Kore/Japon alfabesi sızıntısı kesin tespit edilir (LLM'e sorulmadan); geçerse LLM'e 8 bölümün tamlığı + dil saflığı sorulur.
- **Patent kontrolü LangGraph'ın DIŞINDA yapılıyor**: `main.py` içinde, graph başlamadan önce `patent_cakismasi_kontrol_et()` çağrılıp sonuç düz metin olarak `PRD_PROMPT`'a `{patent_kontrolu}` şeklinde enjekte ediliyor — graph'ın kendisi patent araması yapmıyor.
- PRD 8 bölüm: Ürün Özeti, Hedef Kullanıcı, Temel Özellikler, Teknik Gereksinimler, Benzer Örnekler ve Farklılaşma, Patent/Özgünlük Kontrolü, Tahmini Altyapı Maliyeti Kategorisi, Beceri Etiketleri.
- **Bilinen küçük tutarsızlık:** prompt LLM'den ≤5 beceri etiketi istiyor ama parser (`_skills_ve_prd_ayikla`) 8'e kadar kabul ediyor (`MAKS_SKILLS = 8`).
- Çıktı: `{"prd", "skills", "onerilen_gelistiriciler", "iterasyon_sayisi"}`.
- Next.js tarafı asenkron çalışır: `/prd-uret-baslat`'a POST atıp hemen döner (sonuç bellek-içi `job_store`'da, **kalıcı değil**, sunucu restart'ında kaybolur), `/prd-durum/{id}` ile 4 saniyede bir sorgulanır (frontend'de max 5 dk timeout var, backend'de de ayrı bir 5 dk watchdog var).

## 6. Patent RAG + Tescilli Mucit Çarpanı — Sunucu Tarafı

1. **Veri seti:** HuggingFace `HUPD/hupd`, G06F/G06N sınıflı (computing/AI), hedef 3000-5000 kayıt (`patent_veri_yukle.py`, `--yil YYYY` önerilen mod). `datasets==2.19.0` bilerek sabitlenmiş (daha yeni sürüm HUPD'nin eski yükleme yöntemini kırıyor). ChromaDB koleksiyonu: `patent_ornekleri` (cosine).
2. **Patent çakışma kontrolü:** `main.py`'deki `patent_cakismasi_kontrol_et()`, `PATENT_BENZERLIK_ESIGI = 0.75` üzeri benzerlikte uyarı ekliyor — kesin hukuki iddia değil, ön bulgu.
3. **Tescilli Mucit Çarpanı:** `matchmaking_engine.py`'de `PATENT_CARPAN = 1.15`, RRF skoruna **top_k seçilmeden önce** uygulanıyor (gerçekten sıralamayı etkiliyor) — `_patentli_gelistiricileri_getir()` ile `profiles.has_verified_patent`'ten okunuyor, kolon yoksa sessizce boş küme dönüyor (geriye dönük uyumlu).
4. **Web tarafında patent akışı tamamen self-service, admin onayı YOK:** Yazılımcı kendi profilinden (`edit-profile.tsx`) dosya (PDF/JPG/PNG, `patent-belgeleri` bucket) ya da link yükleyip bir başlık (`patent_title`) giriyor; kaydedince `has_verified_patent = !!patentUrl` otomatik set ediliyor. "Doğrulanmış" ismi yanıltıcı — gerçek bir doğrulama süreci yok.
5. **İkinci/üçüncü patent için resmi bir alan yok** — tek patent alanı (`profiles.patent_url`/`patent_title`) var. Ek patentler, `portfolio_items` tablosunda `item_type='certificate'` ve başlığı `" (Patent)"` ile biten satırlar olarak temsil ediliyor (belgelenmemiş bir konvansiyon, `PatentsSection` component'i bunları filtreleyip ayrı gösteriyor). Bu, **doğrulanmamış/kırılgan bir yaklaşım** — herhangi bir yerde şema düzeyinde zorlanmıyor.
6. **Not:** Patent verisi eşleştirme motoruna (`developer_embeddings`) dahil DEĞİL — profil kaydedilince sadece bio+skills yeniden vektörleniyor, patent metni embedding'e girmiyor. Yani bir geliştiricinin patent konusu, gerçek anlamsal aramada onu üste çıkarmaz; sadece rozet/çarpan üzerinden skor çarpanı olarak etkiler.

## 7. Eşleştirme Motoru (`matchmaking_engine.py` + `eslestirme_endpoints.py`)

- **Semantik arama:** `en_uygun_gelistiricileri_bul()` — PRD/sorgu metnini `all-MiniLM-L6-v2` ile embed'leyip `developer_embeddings` üzerinde (RPC `match_developers`) kosinüs benzerliğiyle top_k getirir.
- **Hibrit arama:** `hibrit_eslestirme_yap()` — semantik top-20 aday + BM25 (tüm havuz, `rank_bm25`, max 200 aday) sonuçlarını RRF (k=60) ile birleştirir, PATENT_CARPAN burada uygulanır.
- **Skor normalizasyonu:** `uyum_skorlarini_hesapla_ve_ata()` — hibrit skor varsa 65-98 aralığına, yoksa ham kosinüs benzerliği 0-100'e ölçekleniyor → `uyum_skoru` alanı, arayüzde doğrudan "%X uyum" olarak gösteriliyor.
- **Metadata filtreleme:** `budget_type`/`sektor` opsiyonel, migration yoksa sessizce atlanıyor.
- **⚠️ ÖNEMLİ — Önceki dokümantasyonda tamamen eksikti:** Aynı dosyada `project_embeddings` tablosu ve `match_projects` RPC'si üzerinden çalışan **paralel bir "proje arama" özelliği** de var: `proje_profilini_vektorle()` / `en_uygun_projeleri_bul()`. Bunun toplu karşılığı `projeleri_toplu_vektorle.py`. Bu, geliştiricinin "bana uygun proje bul" tarzı arama yapabilmesini sağlıyor (bkz. Bölüm 9 endpoint listesi).
- **Endpoint'ler (`eslestirme_endpoints.py`, 5 tane — eskiden 3 sanılıyordu):**
  1. `POST /gelistirici/vektorle`
  2. `POST /eslestir/semantik-top5`
  3. `POST /eslestir/hibrit`
  4. `POST /proje/vektorle` — proje ilanını vektörler
  5. `POST /eslestir/proje-top5` — yayınlanmış projeler arasında semantik arama (geliştirici tarafı için)

## 8. Web Tarafı (Next.js — `co-build-ai` reposu)

- Next.js 16, App Router, TypeScript, Tailwind CSS v4, Supabase (PostgreSQL + RLS + Auth).
- **Tasarım sistemi — gerçek `globals.css` `@theme` değerleri (isimler yanıltıcı, isme değil hex'e güven):**
  - `--color-coral: #44acff` (aslında mavi), `--color-coral-dark: #2f8bd8`
  - `--color-periwinkle: #fe9ec7` (aslında pembe), `--color-periwinkle-dark: #c23570`
  - `--color-petal: #eaf6ff`, `--color-ink: #0f172a`, `--color-ink-soft: #64748b`
  - Fontlar: Plus Jakarta Sans (sans/display), JetBrains Mono
  - Landing sayfası ayrı bir pastel gradyan (`.landing-bg`, krem `#f9f6c4` taban) kullanıyor.
  - **Tutarsızlık:** Birçok component (Kaydet, davet, yayınla butonları, rol değiştirici, sohbet baloncukları) tema token'larını değil **hardcoded yeşil** (`#1a7a52`, `#15633f`, `#8DD9A8`) kullanıyor — yani gerçek "birincil aksiyon rengi" yeşil, tema mavi/pembe olsa da. Yeni UI eklerken hangi rengin kullanıldığını kontrol et, tutarlılık için.
  - `public/logo.png` (tam logo) ve `public/logo-icon.png` (sadece ikon, topbar'da kullanılıyor) — 2026-09-16'da eklendi.
- **Route yapısı:** `(dashboard)` route group (`panel`, `profil`, `profil/[id]`, `mesajlar`, `mesajlar/[userId]`, `gonderilen-teklifler`, `projelerim/*`, `yildizlarim`, `ayarlar/*`) + grup dışında `giris`, `kayit-ol`, `fikir-ekle`, `proje/[id]`, `app/page.tsx` (landing). Sunucu-taraflı gizli işlemler `app/api/*/route.ts` altında: `hesap-sil`, `kaldirma-onayla`, `repo-baglama`.

### Dual-Role Sistemi — TAMAMLANDI, uçtan uca çalışıyor
- `profiles.user_type`: `"founder" | "developer" | "both"`; `profiles.active_role`: `"founder" | "developer"` (sadece `"both"` için anlamlı).
- `app/lib/roles.ts`: `getActiveRole(userType, activeRole)` — `"both"` ise `activeRole ?? "founder"`; değilse `userType`'ın kendisi. `canActAsDeveloper`/`canActAsFounder` yardımcıları her yerde kullanılıyor.
- `role-switcher.tsx` sidebar'da mod değiştiriyor (`active_role` güncelleyip `router.refresh()`). Merkezi bir context YOK — her sayfa kendi `getActiveRole` hesaplamasını sunucu tarafında tekrar yapıyor.

### Teklif / Mesajlaşma / Bildirim Sistemi
- **Teklifler (`offers`):** Yazılımcı NDA kabul ettikten sonra bir projeye teklif verir (mesaj, ödeme tipi, tutar). Founder Kabul Et/Reddet yapar. Kabul edilince GitHub repo bağlama (`/api/repo-baglama`) ve "Tamamlandı" işaretleme (`completed_at`) açılır, bu da karşılıklı değerlendirmeyi (`ratings`) açar.
- **Teklif-bazlı sohbet (`messages`):** Sadece aralarında bir `offers` kaydı olan iki taraf arasında.
- **Doğrudan mesajlaşma (`direct_messages`, YENİ):** Herhangi bir kullanıcı, herhangi birine, teklife bağlı olmadan mesaj atabilir (`direct-message-box.tsx`, `/mesajlar/[userId]`). Realtime açık.
- **Bildirimler (`notifications`):** `sender_id` kolonu YENİ eklendi (kim gönderdi bilgisi, eskiden yoktu) — `offer_accepted` gibi sistem bildirimlerinde hâlâ null olabilir, sadece `project_invite` tipinde doldurulan bir alan.
- **⚠️ `message-bell.tsx` ile `/mesajlar` sayfası senkron değil:** bell sadece teklif-bazlı `messages`'ı sayıyor, `direct_messages`'ı saymıyor — okunmamış sayısı gerçek gelen kutusuyla uyuşmayabilir. Düzeltilmesi gereken bilinen bir tutarsızlık.

### Keşif / Eşleştirme Akışları (Founder tarafı, `/panel`)
1. **Hızlı Eşleştirme** (`quick-match.tsx`) — fikir yazılır, PRD üretilir, `/eslestir/hibrit` ile top-5 yazılımcı bulunup projeye `matched_developers` (jsonb) olarak yazılır.
2. **Doğrudan Arama** (`direct-search.tsx`) — serbest metin, proje oluşturmadan `/eslestir/semantik-top5`.
3. **Her PRD üretiminden sonra otomatik top-5** (`proje/[id]/prd-status.tsx`) — Hızlı Eşleştirme dışında `fikir-ekle`'den gelen projeler için de çalışır.
4. **"Teklif Gönder" / "Projeye Davet Et" butonları** (`developer-match-row.tsx`, `matched-developers.tsx`) — aslında gerçek bir `offers` kaydı OLUŞTURMUYOR (offers sadece yazılımcı tarafından oluşturulabilir); bunun yerine `notifications` tablosuna `type: "project_invite"` kaydı düşüyor, yazılımcıyı projeye/founder'a yönlendiriyor. Davet gönderilince "Mesaj Gönder" linki (doğrudan mesajlaşmaya) beliriyor.
5. **`/gonderilen-teklifler`** (YENİ sayfa) — founder'ın gönderdiği tüm davetleri listeler (`sender_id` ile sorgulanıyor), hem alıcı adı hem profil linki tıklanabilir.
6. **`founder-developers.tsx`** — AI'siz, tamamen client-side isim/beceri filtreli tam yazılımcı dizini.

### Diğer Notlar
- `idea_hash`/`idea_created_at`: aynı fikrin tekrar proje oluşturmasını engelleyen SHA-256 hash (kripto-güvenli bir "fikir sahipliği kanıtı" değil, sadece dedup).
- `project_nda_acceptances` + `project_views`: yazılımcı PRD'yi NDA kabul etmeden göremiyor; her ziyarette (zaten kabul etmişse bile) yeni bir `project_views` satırı düşüyor — zamanla şişebilir, günlük dedup yok.
- Hesap silme (`/api/hesap-sil`) ratings→messages→offers→notifications→nda→views→portfolio_items→projects→profiles sırasıyla cascade siliyor.

## 9. Veritabanı Şeması (Supabase) — Bilinen Tablolar

- `profiles` — id, user_type, active_role, full_name, bio, skills[], availability, avatar_url, banner_url, cv_url, patent_url, patent_title, has_verified_patent, notifications_enabled, terms_accepted_at, default_payment_type, default_payment_amount
- `projects` — id, founder_id, title, raw_idea, generated_prd, required_skills[], status (draft/published), idea_hash, idea_created_at, payment_type, payment_amount, matched_developers (jsonb)
- `offers` — id, project_id, developer_id, message, proposed_amount, proof_link, payment_type, status, completed_at, github_repo_url, removal_requested_by_founder_at, removal_approved_by_developer_at
- `notifications` — id, user_id, sender_id (YENİ), project_id (nullable), type, message, read_at
- `messages` — teklif-bazlı sohbet (offer_id, sender_id, content, read_at)
- `direct_messages` — YENİ, teklife bağlı olmayan 1:1 sohbet (sender_id, recipient_id, content, read_at)
- `ratings` — offer_id, rater_id, rated_user_id, score, comment (unique per offer+rater)
- `portfolio_items` — developer_id, title, description, item_type (project/certificate), issuer, item_date, file_url — `"(Patent)"` sonekli certificate'lar ek patent olarak yorumlanıyor (bkz. Bölüm 6.5)
- `starred_developers` — founder_id, developer_id (yıldızlama)
- `project_nda_acceptances`, `project_views` — arayüze bağlı
- `developer_embeddings` — developer_id, full_name, skills, bio, kaynak_metin, embedding(384), opsiyonel budget_type/sektor
- `project_embeddings` (YENİ, önceki dokümantasyonda hiç yoktu) — project_id, title, required_skills, kaynak_metin, embedding(384); kasıtlı olarak vektör indexi yok (az kayıtta ivfflat yanlış sonuç veriyordu)

Storage bucket'ları: `cvs`, `patent-belgeleri`, `portfolyo-dosyalari`, `avatars`, `banners`.

RLS tüm tablolarda aktif. Migration dosyaları tek kaynak — kod tabanında ayrı bir migrations/ klasörü yok, hepsi `co-build-ai-server/supabase_migration_*.sql` altında (10 dosya, bkz. server CLAUDE.md).

## 10. Bilinçli Olarak v2'ye Ertelenenler

- Gerçek para transferi / escrow, Stripe entegrasyonu
- Biyometrik KYC, NDA dijital imza, mobil uygulama
- Tinder-tarzı swipe eşleştirme (kesin vazgeçildi)
- GitHub commit'e göre otomatik milestone/ödeme tetikleme
- Platform içi kod editörü/sandbox
- Gerçek zamanlı rakip/web taraması
- Tam kapsamlı resmi patent ofisi entegrasyonu (statik veri setli RAG prototipi MVP'de, bkz. Bölüm 6)

## 11. Bilinen Riskler / Teknik Borç

- `message-bell.tsx` doğrudan mesajları saymıyor (Bölüm 8).
- Patent "doğrulanmış" alanı tamamen self-declared, admin onay akışı yok.
- İkinci patent temsili (`"(Patent)"` string konvansiyonu) şema düzeyinde değil, kırılgan.
- `job_store` (PRD sonuçları) bellek-içi — sunucu restart'ında kaybolur.
- RunPod Pod kapalıyken PRD üretimi bekleyen proje sessizce sonsuza kadar "hazırlanıyor" gösterir.
- `project_views` günlük dedup yapmıyor, zamanla şişebilir.
- `co-build-ai-server/requirements.txt` daha önce UTF-16 kodluydu ve `reportlab` eksikti — 2026-09-16'da UTF-8'e çevrilip `reportlab` eklendi (bu düzeltmenin kalıcı olduğunu bir sonraki oturumda doğrula, daha önce de "düzeltildi" denip tekrar bozulmuştu).

## 12. Kod Tarzı Notları

- Client component'ler `"use client"` ile başlıyor, tıklanabilir/etkileşimli her şey ayrı dosyada.
- Ortak component'ler `app/components/` altında; sayfa-özel component'ler ilgili route klasöründe.
- Sunucu tarafı gizli anahtar gerektiren işlemler `app/api/*/route.ts` altında (`SUPABASE_SERVICE_ROLE_KEY` client'a gitmiyor).
- Python tarafında Türkçe fonksiyon/değişken isimleri, kod yorumları Türkçe.
- `.env` üzerinden okunan değerler `os.getenv()` ile, path'ler hardcode edilmiyor (demo/tek-seferlik script'ler hariç — onlar bilinçli olarak geliştirici makinesine özel).
