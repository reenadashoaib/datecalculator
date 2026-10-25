/* Fills every [data-ad] space from AD_CONFIG, and runs the video and full-screen ads. */
(function () {
  "use strict";

  var config = window.AD_CONFIG || {};
  var client = (config.adsenseClient || "").trim();
  var live = /^ca-pub-\d{10,20}$/.test(client);
  var scriptLoaded = false;

  function loadAdsense() {
    if (scriptLoaded || !live) return;
    scriptLoaded = true;
    var s = document.createElement("script");
    s.async = true;
    s.crossOrigin = "anonymous";
    s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + encodeURIComponent(client);
    document.head.appendChild(s);
  }

  function placeholder(el) {
    var small = el.getAttribute("data-size-small");
    var size = (small && window.matchMedia("(max-width: 760px)").matches ? small : el.getAttribute("data-size")) || "";
    el.classList.add("ad--placeholder");
    el.innerHTML =
      '<span class="ad__label">Advertisement</span>' +
      '<span class="ad__size">' + size.replace("x", " × ") + "</span>";
  }

  function adsenseUnit(el, slot) {
    var ins = document.createElement("ins");
    ins.className = "adsbygoogle";
    ins.style.display = "block";
    ins.setAttribute("data-ad-client", client);
    ins.setAttribute("data-ad-slot", slot);
    var format = el.getAttribute("data-format");
    if (format) ins.setAttribute("data-ad-format", format);
    if (el.hasAttribute("data-responsive")) ins.setAttribute("data-full-width-responsive", "true");
    el.innerHTML = '<span class="ad__label">Advertisement</span>';
    el.appendChild(ins);
    loadAdsense();
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  }

  function fill(el) {
    var name = el.getAttribute("data-ad");
    var slot = ((config.slots || {})[name] || "").trim();
    if (!live) return placeholder(el);
    // Rails and extra tiles are hidden on small screens; AdSense can't size a hidden unit.
    if (!slot || el.getClientRects().length === 0) {
      el.hidden = true;
      return;
    }
    adsenseUnit(el, slot);
  }

  document.querySelectorAll("[data-ad]:not([data-ad=interstitial])").forEach(fill);

  if (live) loadAdsense();

  // Floating video ad.
  var video = config.video || {};
  var dock = document.getElementById("video-ad");
  if (dock && video.enabled !== false && (video.html || !live)) {
    var body = dock.querySelector(".video-ad__body");
    if (video.html) body.innerHTML = video.html;
    setTimeout(function () { dock.hidden = false; }, (video.showAfterSeconds || 0) * 1000);
    dock.querySelector(".video-ad__close").addEventListener("click", function () {
      dock.hidden = true;
      body.innerHTML = "";
    });
  }

  // Full-screen ad.
  var inter = config.interstitial || {};
  var overlay = document.getElementById("interstitial");
  if (!overlay || inter.enabled === false) return;

  var key = "pc-interstitial-shown";
  function alreadyShown() {
    try { return inter.oncePerSession !== false && sessionStorage.getItem(key) === "1"; }
    catch (e) { return false; }
  }

  var shown = false;
  var lastFocus = null;
  var slotEl = overlay.querySelector("[data-ad=interstitial]");
  var closeBtn = overlay.querySelector(".interstitial__close");

  function open() {
    if (shown || alreadyShown()) return;
    shown = true;
    try { sessionStorage.setItem(key, "1"); } catch (e) {}
    if (inter.html) {
      slotEl.innerHTML = inter.html;
    } else {
      fill(slotEl);
      if (slotEl.hidden) return;
    }
    lastFocus = document.activeElement;
    overlay.hidden = false;
    document.body.classList.add("is-locked");
    closeBtn.focus();
  }

  function close() {
    overlay.hidden = true;
    document.body.classList.remove("is-locked");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !overlay.hidden) close();
    if (e.key === "Tab" && !overlay.hidden) {
      // Keep focus inside the dialog.
      var items = overlay.querySelectorAll("button, a[href], iframe");
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  if (inter.showAfterSeconds) setTimeout(open, inter.showAfterSeconds * 1000);
  if (inter.showAfterCalculations) {
    var count = 0;
    document.addEventListener("calculated", function () {
      count += 1;
      if (count >= inter.showAfterCalculations) open();
    });
  }
})();
