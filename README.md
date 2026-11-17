# GZMS.RU — сайт «ГРЯЗЕМЕС»

Статический сайт приложения **ГРЯЗЕМЕС** на собственном домене.
Без сборщика: файлы из `public/` выкладываются на Sprinthost как есть.

## Что внутри

```text
public/
  index.html            # лендинг: hero, возможности, экраны, гряземетр, офлайн, скачать, FAQ
  privacy.html          # политика конфиденциальности приложения и сайта
  ugc.html              # правила пользовательского контента
  404.html              # брендированная страница ошибки
  robots.txt
  sitemap.xml
  manifest.webmanifest
  .htaccess             # https/www, кэш, security-заголовки
  apk.json              # манифест обновлений для приложения
  version.json
  assets/               # site.css, site.js, шрифты, иконки, QR
  images/               # hero, постеры, скриншоты, og.jpg
  downloads/            # APK (в Git не хранится)
scripts/
  deploy.mjs            # деплой на Sprinthost
  check.mjs             # проверка ссылок, JSON-LD, sitemap и APK
  serve.mjs             # локальный сервер
```

## Локальный запуск

```bash
cd C:\Ai\EgerLabs\gzms
node scripts/check.mjs
node scripts/serve.mjs
# http://127.0.0.1:8088/
```

## Деплой

Нужен SSH-ключ `~/.ssh/sprinthost_radio` и APK
`../griazemes/downloads/griazemes-1.4.4.apk`.

```bash
node scripts/deploy.mjs
```

Хост: `taras@taras.xsph.ru`, каталог `~/domains/gzms.ru/public_html`.
Старый `index.php` при первом деплое уезжает в `~/domains/gzms.ru/backup/`.

## DNS

Домен зарегистрирован в Reg.ru. Чтобы сайт открывался, в панели Reg.ru
нужно переключить NS на Sprinthost:

```text
ns1.sprinthost.ru
ns2.sprinthost.ru
ns3.sprinthost.net
ns4.sprinthost.net
```

В DNS-зоне Sprinthost уже прописаны A/AAAA на `141.8.192.109` и
`2a0a:2b42:a:6449::`, MX `mail.gzms.ru`, SPF. SSL Let's Encrypt уже выпущен.

## SEO

- Canonical `https://gzms.ru/`, `hreflang` ru-RU.
- JSON-LD: `Organization`, `WebSite`, `MobileApplication`, `FAQPage`.
- `robots.txt`, `sitemap.xml` с картинками.
- 301: `http → https`, `www → apex`, `gzms.ru.xsph.ru → apex`,
  `index.html/index.php → /`.
- После изменения контента обновить `lastmod` в sitemap и отправить URL
  в Яндекс.Вебмастер, Google Search Console и IndexNow.

## APK

APK и `apk.json` — отдельные артефакты. В Git лежит только `apk.json`.
Перед деплоем скопировать свежий APK:

```bash
cp ../griazemes/downloads/griazemes-1.4.4.apk public/downloads/
cp ../griazemes/downloads/griazemes-1.4.4.apk public/downloads/griazemes.apk
```

После обновления приложения поменять `version`, `size`, `sha256`, `url`
в `public/apk.json` и `public/version.json` и пересобрать сайт.

## Материалы

Исходные постеры: `../griazemes/posters/GZMS/`.
Веб-версии (`hero-portrait.webp`, `winter.webp`, `crew.webp`, `sunset.webp`,
`poster.webp`, `og.jpg`) — производные, оригиналы не изменяются.