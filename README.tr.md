# Promo Templates

[English](README.md) · **Türkçe**

Sosyal medya (TikTok / Reels / Shorts) için **kodla üretilen** dikey video şablonları (1080×1920, 30 fps).
Videolar [Remotion](https://www.remotion.dev) ile React bileşenleri olarak yazılır; çekim gerekmez. Her şablon tipi bir
Claude Code skill'idir: bir istek yazarsın, Claude yeni bir video kodlar, kontrol eder ve render eder.

[Promo Studio](https://github.com/ardasnturk/promo-studio) bu repoyu şablon kütüphanesi olarak kullanır (fikir bulma,
skill ile üretim, paylaşım ve güncelleme kontrolü). Tek başına, yalnızca Claude Code ile de kullanılabilir.

## Kurulum

```bash
git clone https://github.com/ardasnturk/promo-templates.git
cd promo-templates
npx remotion skills add          # Remotion'ın resmi agent skill'leri (.agents/skills)
cd templates
npm install
npx remotion studio
```

Studio http://localhost:3000 adresinde açılır. MP4 almak için Studio'daki **Render** düğmesini kullan ya da:

```bash
npx remotion render <KompozisyonId> out/<ad>.mp4
```

Render çıktıları (`out/`) git'e dahil edilmez.

**Promo Studio ile:** Promo Studio → kenar çubuğu → **Şablonlar → Kütüphane ekle…** ile bu klasörü seç. Promo Studio
kütüphane bağlı değilse kurmayı önerir ve yeni sürümleri bildirir.

## Şablonlar

| Klasör (Studio) | Kompozisyon | Açıklama | Kod |
|---|---|---|---|
| Satisfying | `BouncingBall` | Her çarpışta büyüyen top çemberi doldurmaya çalışıyor | `src/BouncingBall` |
| Satisfying | `BallSort` | Renkli toplar tüplere sıralanıyor (BFS çözücü, `seed` prop) | `src/BallSort` |
| Satisfying | `FifteenPuzzle` | 15 bulmacası en kısa çözümle çözülüyor (`seed` prop) | `src/Satisfying/FifteenPuzzle` |
| Wordless | `MassMachine` | Metinsiz: topları katlayan sarkaç makinesi (`seed`, `maxBalls` prop) | `src/Wordless/MassMachine` |
| Relaxing | `Breathe` | 4-4-4-4 kutu nefesi | `src/Breathe` |
| Cringe | `CringeChat` | Sevgiliye yazılan mesajlar müdüre gidiyor | `src/CringeChat` |

## Claude Code ile yeni video

Bu klasörde Claude Code açıldığında `CLAUDE.md` (ortak kurallar) otomatik yüklenir. Komutlar:

| Komut | Ne üretir |
|---|---|
| `/video-physics [mekanik]` | Tatmin edici fizik döngüsü |
| `/video-puzzle [bulmaca]` | Bulmaca çözümü (gerçek çözücüyle) |
| `/video-cringe [senaryo]` | Cringe mesajlaşma hikâyesi |
| `/video-relaxing [egzersiz]` | Rahatlatıcı rehberli egzersiz |
| `/video-multiplier`, `/video-chain`, `/video-color-war`, `/video-fill`, `/video-hypnotic`, `/video-elimination`, `/video-growth`, `/video-slice`, `/video-machine`, `/video-swarm` | Metinsiz videolar (bkz. `CLAUDE.md` madde 10) |
| `/video-ideas [odak]` | Trend araştırması ve yeni konsept önerisi |

Örnek: `/video-puzzle 8 tüplü top sıralama, zor seviye`

Komut kullanmadan kopyala-yapıştır yapmak isteyenler için aynı içerik `PROMPTS.md` dosyasında.

## Kendi uygulaman için şablon

Bir uygulamaya özel kalıplar (marka renkleri, logo, açılış animasyonu) için `src/<UygulamaAdı>/` ve
`public/<uygulamaadı>/` klasörleri aç. Promo Studio'da aynı adlı bir proje varsa, Claude promosyon filmi yazarken bu
klasörü marka kiti olarak okur. Kişisel ya da gizli marka varlıklarını kendi (özel) fork'unda tutman önerilir.

## Notlar

- Ses efektleri render sırasında `https://remotion.media/` adresinden indirilir; internet bağlantısı gerekir. Müzik platformda eklenir.
- Simülasyonlar deterministiktir: aynı `seed` Studio'da ve render'da aynı sonucu verir.
- Sürümler GitHub Releases'ta yayınlanır; sürüm numarası `templates/package.json` içindeki `version` alanıdır.

## Lisans

MIT (bkz. `LICENSE`). Şablonların kullandığı Remotion'ın kendi lisansı vardır: bireyler, kâr amacı gütmeyen kuruluşlar ve
3 çalışana kadar şirketler için ücretsizdir; daha büyük şirketlerin şirket lisansı alması gerekir
(https://www.remotion.dev/license).
