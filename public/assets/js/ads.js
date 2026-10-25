// Fills the ad slots on the page from window.AD_CONFIG (ads-config.js).
(function () {
  const config = window.AD_CONFIG || {};
  const slots = config.slots || {};
  const client = (config.adsenseClient || "").trim();
  const usingAdsense = /^ca-pub-\d{10,20}$/.test(client);

  const phone = window.matchMedia("(max-width: 767px)").matches;
  const SIZES = {
    "top-banner": phone ? "320 × 100" : "728 × 90",
    "bottom-banner": phone ? "320 × 100" : "728 × 90",
    "left-skyscraper": "160 × 600",
    "right-vertical": "300 × 600",
  };

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs || {})) {
      if (key === "class") node.className = value;
      else if (key === "text") node.textContent = value;
      else node.setAttribute(key, value);
    }
    (children || []).forEach((child) => child && node.append(child));
    return node;
  }

  function storage(key, value) {
    try {
      if (value === undefined) return window.localStorage.getItem(key);
      window.localStorage.setItem(key, value);
    } catch (e) {
      return null;
    }
  }

  function placeholder(size) {
    return el("div", { class: "ad__placeholder" }, [
      el("span", {}, [document.createTextNode("Ad space"), el("small", { text: size })]),
    ]);
  }

  function ownAd(spec) {
    const img = el("img", { src: spec.image, alt: spec.alt || "Advertisement", loading: "lazy", decoding: "async" });
    if (!spec.href) return img;
    return el("a", { href: spec.href, target: "_blank", rel: "sponsored noopener" }, [img]);
  }

  if (usingAdsense) {
    const script = el("script", {
      async: "",
      src: "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + encodeURIComponent(client),
      crossorigin: "anonymous",
    });
    document.head.append(script);
  }

  document.querySelectorAll("[data-ad]").forEach((slot) => {
    const name = slot.dataset.ad;
    const spec = slots[name] || {};
    const box = slot.querySelector(".ad__box");
    const size = SIZES[name] || (name.startsWith("tile") ? "300 × 250" : "");

    if (spec.image) {
      box.append(ownAd(spec));
    } else if (spec.adsense && usingAdsense) {
      const fixed = name === "left-skyscraper" || name === "right-vertical" || name.startsWith("tile");
      const ins = el("ins", {
        class: "adsbygoogle",
        style: fixed ? "display:inline-block;width:100%;height:100%" : "display:block;width:100%;height:100%",
        "data-ad-client": client,
        "data-ad-slot": String(spec.adsense),
      });
      if (!fixed) {
        ins.setAttribute("data-ad-format", "horizontal");
        ins.setAttribute("data-full-width-responsive", "true");
      }
      box.append(ins);
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } else if (config.showPlaceholders) {
      box.append(placeholder(size));
    } else {
      slot.hidden = true;
    }
  });

  // ---- Floating video, bottom right ----
  const video = config.video || {};
  const videoDismissed = (() => {
    try { return sessionStorage.getItem("ad-video-closed") === "1"; } catch (e) { return false; }
  })();

  if (video.enabled && (video.src || config.showPlaceholders) && !videoDismissed) {
    let media;
    if (video.src) {
      const player = el("video", {
        src: video.src,
        muted: "",
        autoplay: "",
        loop: "",
        playsinline: "",
        preload: "metadata",
        "aria-label": "Advertisement video",
      });
      if (video.poster) player.setAttribute("poster", video.poster);
      player.muted = true;
      media = video.href ? el("a", { href: video.href, target: "_blank", rel: "sponsored noopener" }, [player]) : player;
    } else {
      media = placeholder("Video · 16:9");
    }

    const close = el("button", { class: "close-btn", type: "button", "aria-label": "Close video ad", text: "×" });
    const box = el("aside", { class: "video-ad", "aria-label": "Advertisement", hidden: "" }, [
      el("div", { class: "video-ad__bar" }, [el("span", { text: "Advertisement" }), close]),
      el("div", { class: "video-ad__media" }, [media]),
    ]);
    close.addEventListener("click", () => {
      box.remove();
      try { sessionStorage.setItem("ad-video-closed", "1"); } catch (e) { /* private mode */ }
    });
    document.body.append(box);
    // Appear once the visitor scrolls past the calculator, so the video never
    // covers the form or the side ads at the top of the page.
    const threshold = video.showAfterScroll || 700;
    const reveal = () => {
      if (window.scrollY < threshold) return;
      window.removeEventListener("scroll", reveal);
      box.hidden = false;
      box.classList.add("is-entering");
    };
    window.addEventListener("scroll", reveal, { passive: true });
    reveal();
  }

  // ---- Full-screen popup ----
  const popup = config.popup || {};
  const lastShown = Number(storage("ad-popup-shown") || 0);
  const due = Date.now() - lastShown > (popup.frequencyHours || 24) * 3600 * 1000;

  if (popup.enabled && (popup.image || config.showPlaceholders) && due && "HTMLDialogElement" in window) {
    const close = el("button", { class: "close-btn", type: "button", "aria-label": "Close ad", text: "×" });
    const proceed = el("button", { class: "btn popup-ad__continue", type: "button", text: "Continue to calculator" });
    const box = el("div", { class: "ad__box" }, [popup.image ? ownAd(popup) : placeholder("Full-screen ad")]);
    const dialog = el("dialog", { class: "popup-ad", "aria-label": "Advertisement" }, [
      el("div", { class: "popup-ad__bar" }, [el("span", { text: "Advertisement" }), close]),
      el("div", { class: "popup-ad__body" }, [box]),
      proceed,
    ]);
    const shut = () => dialog.close();
    close.addEventListener("click", shut);
    proceed.addEventListener("click", shut);
    dialog.addEventListener("click", (event) => { if (event.target === dialog) shut(); });
    document.body.append(dialog);

    setTimeout(() => {
      // Don't interrupt someone who is typing into the calculator.
      const active = document.activeElement;
      if (active && /^(INPUT|SELECT|TEXTAREA)$/.test(active.tagName)) return;
      dialog.showModal();
      proceed.focus();
      storage("ad-popup-shown", String(Date.now()));
    }, (popup.delaySeconds || 0) * 1000);
  }
})();
