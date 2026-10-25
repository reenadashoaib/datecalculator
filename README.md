# Dayspan date calculator

A static date calculator website with built-in ad spaces, ready for Google AdSense and Cloudflare. Plain HTML, CSS and JavaScript: no build step, no framework.

## Pages

| URL | File | What it does |
|---|---|---|
| `/` | `index.html` | Days between two dates (also weeks, months, workdays, hours) |
| `/add-subtract` | `add-subtract.html` | Add or subtract years, months, weeks, days or workdays |
| `/age` | `age.html` | Exact age, next birthday |
| `/workdays` | `workdays.html` | Monday-to-Friday days between two dates |
| `/day-of-week` | `day-of-week.html` | Weekday, ISO week number, day of the year |
| `/about`, `/contact`, `/privacy`, `/terms`, 404 | | Supporting pages. AdSense needs a privacy policy and a way to contact you. |

Results update the page address (for example `/age?birth=1990-05-20`), so every result can be shared or bookmarked.

Code lives in `public/assets/`: `css/site.css`, `js/dates.js` (date math), `js/app.js` (calculators), `js/ads-config.js` and `js/ads.js` (ads).

## Ads

All ads are controlled from **`public/assets/js/ads-config.js`**. Until you fill it in, every slot shows a grey "Ad space" placeholder so you can see the layout.

| Slot name | Where | Size |
|---|---|---|
| `top-banner` | Under the header | 728×90, 320×100 on phones |
| `left-skyscraper` | Left of the calculator, screens 1300px+ | 160×600 |
| `right-vertical` | Right of the calculator, screens 1100px+ | 300×600 |
| `tile-1` to `tile-4` | Grid of tiles under the result (2 on phones) | 300×250 |
| `bottom-banner` | Above the footer | 728×90, 320×100 on phones |
| `video` | Floating, bottom right, after the visitor scrolls | 16:9 |
| `popup` | Full-screen, at most once per visitor per 24 hours | Any |

Side ads stick in place while scrolling on screens taller than 900px.

### Turning on AdSense

1. Deploy the site to your domain and apply at <https://adsense.google.com>.
2. In `ads-config.js`, set `adsenseClient` to your publisher ID (`ca-pub-…`).
3. In AdSense, create a **display ad unit** for each slot, and paste each unit's `data-ad-slot` number into the slot, for example `"top-banner": { adsense: "1234567890" }`.
4. In `public/ads.txt`, put in your publisher ID and remove the `#`.
5. Set `showPlaceholders: false` so empty slots disappear.
6. In AdSense, go to **Privacy & messaging** and set up the GDPR consent message. Google requires one for visitors from the EEA, the UK and Switzerland.

### Selling ad space directly

Any slot can show your own ad instead of AdSense:

```js
"tile-1": { image: "/ads/acme-300x250.jpg", href: "https://acme.example", alt: "Acme" },
```

Put the image in `public/ads/`. Links open in a new tab and are marked `rel="sponsored"`.

### Before relying on the video and popup slots

AdSense does not allow its ads inside popups or custom floating players. Those two slots are therefore built for ads you sell yourself:

- **Video**: set `video.src` to an MP4 (it plays muted and loops), plus optional `poster` and `href`.
- **Popup**: set `popup.image` and `popup.href`. For an AdSense full-screen ad, turn on **Auto ads → Vignette ads** in your AdSense account. Google then shows its own compliant full-screen ad between page views.

Also keep in mind that AdSense reviews sites for ad density. If approval is slow, set `showPlaceholders: false` and leave some slots empty until you're approved.

## Your domain and email

The pages use `dayspan.example` as a placeholder. Replace it everywhere with your domain, for example:

```sh
grep -rl 'dayspan.example' public | xargs sed -i 's/dayspan\.example/yourdomain.com/g'
```

That updates canonical links, `sitemap.xml`, `robots.txt` and the contact email (`hello@dayspan.example`). To rename the site, replace `Dayspan` the same way.

## Deploying to Cloudflare

**Workers (recommended):** `npx wrangler deploy`. `wrangler.jsonc` serves `public/` with clean URLs (`/age` serves `age.html`) and the custom 404 page. Then add your domain under the Worker's **Settings → Domains & Routes**.

**Pages:** connect this GitHub repo in the Cloudflare dashboard, leave the build command empty and set the output directory to `public`.

Preview locally with `npx wrangler dev`.

## Tests

`npm test` runs the date-math tests (leap years, month ends, ISO weeks, workdays, ages) with Node's built-in test runner.
