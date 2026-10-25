/*
 * Ad configuration. This is the only file you need to edit to turn on ads.
 *
 * While `adsenseClient` is empty, every ad space shows a labeled placeholder
 * so you can see the layout. Once you fill in your AdSense publisher ID and
 * the slot IDs from your AdSense account (Ads > By ad unit), the placeholders
 * are replaced by real ad units. A space whose slot ID is empty stays hidden.
 */
window.AD_CONFIG = {
  // Your AdSense publisher ID, e.g. "ca-pub-1234567890123456".
  adsenseClient: "",

  // AdSense ad unit slot IDs, one per ad space.
  slots: {
    "top-banner": "",
    "left-rail": "",
    "right-rail": "",
    "tile-1": "",
    "tile-2": "",
    "tile-3": "",
    "tile-4": "",
    "tile-5": "",
    "tile-6": "",
    "in-article": "",
    "bottom-banner": "",
    "interstitial": ""
  },

  // Floating video ad in the bottom-right corner.
  // AdSense has no ad unit for this, so paste the embed code (HTML) from a
  // video ad network here. Leave it empty to hide the player once AdSense is on.
  video: {
    enabled: true,
    html: "",
    showAfterSeconds: 6
  },

  // Full-screen ad.
  // AdSense does not allow its ads inside a pop-up you build yourself. For
  // AdSense, set `enabled: false` here and turn on "Vignette ads" under
  // Auto ads in your AdSense account: Google then shows its own full-screen
  // ads between page views. Keep this on only for another network's code
  // (put it in `html`) or for your own direct-sold ads.
  interstitial: {
    enabled: true,
    html: "",
    showAfterSeconds: 25,
    showAfterCalculations: 3,
    oncePerSession: true
  }
};
