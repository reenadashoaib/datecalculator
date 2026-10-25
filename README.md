# Percentage Calculator

A static percentage calculator website with built-in ad spaces, ready to deploy on Cloudflare. Plain HTML, CSS and JavaScript, with no build step.

Everything the site serves is in `public/`:

| File | What it is |
|---|---|
| `index.html` | The calculators, formulas and FAQ |
| `about.html`, `privacy.html`, `terms.html`, `404.html` | Supporting pages (AdSense requires a privacy policy) |
| `styles.css`, `app.js` | Styling and calculator logic |
| `ads-config.js` | **The one file you edit to turn ads on** |
| `ads.js` | Fills the ad spaces from `ads-config.js` |
| `ads.txt` | Authorizes Google to sell your ad space |
| `_headers`, `robots.txt`, `favicon.svg` | Cloudflare headers, crawler rules, icon |

## Ad spaces

| Name in `ads-config.js` | Where | Size |
|---|---|---|
| `top-banner` | Under the header | 728×90, 320×100 on phones |
| `left-rail`, `right-rail` | Sticky beside the content, screens 1200px and wider | 160×600 |
| `tile-1` to `tile-6` | Two rows of three tiles between calculators | 300×250 (one per row on phones) |
| `in-article` | Inside the formulas section | Fluid |
| `bottom-banner` | Above the footer | 728×90, 320×100 on phones |
| `interstitial` | Full-screen ad | 336×280 |
| `video` | Floating player, bottom-right | 16:9 |

Until you add your AdSense ID, every space shows a labeled placeholder so you can see the layout.

## Turning on AdSense

1. Deploy the site and apply for AdSense with your domain.
2. In `public/ads-config.js`, set `adsenseClient` to your publisher ID (`ca-pub-…`).
3. In AdSense, create a display ad unit for each space (Ads > By ad unit) and paste each slot ID into `slots`. A space with no slot ID stays hidden.
4. In `public/ads.txt`, put in your publisher ID and remove the `#` from the last line.
5. In `privacy.html`, `about.html` and `terms.html`, replace `you@example.com` with your email.
6. Turn on Google's consent message for visitors in Europe (Privacy & messaging in AdSense). The privacy policy says this consent is asked for.

### Two ad spaces AdSense won't fill

- **Full-screen pop-up.** AdSense policy doesn't allow its ads inside a pop-up you build yourself. Instead, set `interstitial.enabled` to `false` and turn on **Vignette ads** under Auto ads in AdSense. Google then shows its own full-screen ads between page views. Keep the built-in pop-up only for another ad network's code (put it in `interstitial.html`) or ads you sell directly.
- **Corner video player.** AdSense has no ad unit for this. Paste a video ad network's embed code into `video.html`. If it's empty once AdSense is on, the player stays hidden.

Out of the box, the pop-up appears once per visit: after 25 seconds or after 3 calculations, whichever comes first. It can be closed straight away with its button, the Escape key, or a click outside it. You can change the timing in `ads-config.js`.

## Deploying to Cloudflare

**Cloudflare Pages (from GitHub):** Workers & Pages > Create > Pages > Connect to Git, pick this repo, leave the build command empty, and set the build output directory to `public`.

**Cloudflare Workers (from your computer):** `npx wrangler deploy` uses `wrangler.jsonc` to upload `public/` as static assets.

## Running locally

```sh
python3 -m http.server 8000 -d public
```

Then open http://localhost:8000.
