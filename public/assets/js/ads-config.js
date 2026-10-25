// Every ad on the site is controlled from this file. See README.md, "Ads".
//
// Each slot can show one of three things:
//   - An AdSense unit:  { adsense: "1234567890" }  (the ad unit's data-ad-slot ID)
//   - Your own ad:      { image: "/ads/banner.jpg", href: "https://advertiser.example", alt: "Advertiser name" }
//   - Nothing set:      a grey "Ad space" placeholder while showPlaceholders is true,
//                       or an empty slot that takes no space once it is false.
window.AD_CONFIG = {
  // Your AdSense publisher ID, e.g. "ca-pub-1234567890123456". Leave empty until approved.
  adsenseClient: "",

  // Show grey placeholders in unfilled slots. Set to false before going live.
  showPlaceholders: true,

  slots: {
    "top-banner": {},       // 728x90 on desktop, 320x100 on phones
    "left-skyscraper": {},  // 160x600, shown on screens 1300px and wider
    "right-vertical": {},   // 300x600, shown on screens 1100px and wider
    "tile-1": {},           // 300x250 tiles under the calculator
    "tile-2": {},
    "tile-3": {},           // tiles 3 and 4 are hidden on phones
    "tile-4": {},
    "bottom-banner": {},    // 728x90 on desktop, 320x100 on phones
  },

  // Floating video in the bottom-right corner. AdSense does not fill this
  // slot; use a video you sold directly: { src: "/ads/promo.mp4", poster, href }.
  video: {
    enabled: true,
    src: "",
    poster: "",
    href: "",
    // Appears after the visitor scrolls this many pixels down the page.
    showAfterScroll: 700,
  },

  // Full-screen popup. AdSense ads are not allowed inside popups, so this slot
  // shows your own ad ({ image, href, alt }). For an AdSense full-screen ad,
  // turn on "Vignette ads" under Auto ads in your AdSense account instead.
  popup: {
    enabled: true,
    image: "",
    href: "",
    alt: "",
    delaySeconds: 12,
    // Show at most once per this many hours for each visitor.
    frequencyHours: 24,
  },
};
