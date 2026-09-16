# Co-Build AI — Frontend Günlüğü (app/CLAUDE.md)

> **Güncel ve kapsamlı bilgi için kök `CLAUDE.md` (v5, 2026-09-16)'ya bak.** Bu dosya sadece kök dosyanın tekrarı olmayan, frontend'e özel kısa bir günlük — tasarım geçmişi gibi zamanla değişen ama kök dosyaya taşınmayan detaylar için.

## Tasarım Geçmişi (palet birden çok kez değişti)

Sırasıyla: orijinal coral/periwinkle/petal/ink (sıcak tonlar) → pembe/yeşil → koyu yeşil/limon → mor/lime → krem/hardal sarısı → beyaz zemin + pembe-mor gradyan → siyah zemin denemesi (geri alındı) → açık mavi/bebek mavisi (v3 dönemi) → **güncel (2026-09 ortası):** `globals.css`'teki gerçek hex değerleri mavi (`#44acff`) + pembe (`#fe9ec7`) + krem, ama çoğu buton/aksiyon rengi hardcoded yeşil (`#1a7a52`) — bkz. kök CLAUDE.md Bölüm 8. Landing sayfası siyah akan arkaplan + Clash Display/Satoshi font denemesi yaşandı, şu an `globals.css` bunu yansıtmıyor (deneme geri alınmış/üstüne yazılmış görünüyor) — kodu okurken class ismine değil gerçek CSS'e güven.

Token isimleri (`bg-coral`, `text-ink`, `bg-petal` vb.) hep aynı kaldı, sadece hex değerleri değişti.

## Bilinen Küçük Sorunlar (frontend-özel, kök dosyaya taşınmadı)

- `public/`'te kullanılmayan Next.js starter ikonları var (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`) — temizlenebilir, düşük öncelik.
- `public/landing-bg.jpg` muhtemelen artık kullanılmıyor (landing arka planı CSS gradyanına geçti) — kontrol edilip silinebilir.

## Git İş Akışı

Kök `CLAUDE.md` Bölüm 3'e bak. Not: paralel oturumlarda (`git status` her zaman kontrol et) commit'lenmemiş değişiklikler görebilirsin — bunlar Berna'nın üzerinde çalıştığı, henüz commit'lenmemiş iş olabilir; sadece kendi dokunduğun dosyaları `git add` et, `-A` kullanma.
