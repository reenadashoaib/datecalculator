/* Percentage calculators. Each <form data-calc> has inputs named a and b (and sometimes mode). */
(function () {
  "use strict";

  var nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 });
  function fmt(n) { return nf.format(Math.abs(n) < 1e-12 ? 0 : n); }
  function clamp(n) { return Math.max(0, Math.min(100, n)); }

  // Each returns { result, working, bar } or { error }.
  var calcs = {
    of: function (a, b) {
      var r = (a / 100) * b;
      return { result: fmt(r), working: fmt(a) + " ÷ 100 × " + fmt(b) + " = " + fmt(r), bar: a };
    },
    whatPercent: function (a, b) {
      if (b === 0) return { error: "Enter a total other than 0." };
      var r = (a / b) * 100;
      return { result: fmt(r) + "%", working: fmt(a) + " ÷ " + fmt(b) + " × 100 = " + fmt(r) + "%", bar: r };
    },
    change: function (a, b) {
      if (a === 0) return { error: "Enter a starting value other than 0." };
      var r = ((b - a) / Math.abs(a)) * 100;
      var word = r > 0 ? "increase" : r < 0 ? "decrease" : "no change";
      return {
        result: (r === 0 ? "0%" : fmt(Math.abs(r)) + "% " + word),
        working: "(" + fmt(b) + " − " + fmt(a) + ") ÷ " + fmt(Math.abs(a)) + " × 100 = " + fmt(r) + "%",
        bar: Math.abs(r)
      };
    },
    adjust: function (a, b, mode) {
      var sign = mode === "decrease" ? -1 : 1;
      var r = b * (1 + sign * a / 100);
      return {
        result: fmt(r),
        working: fmt(b) + " × (1 " + (sign > 0 ? "+" : "−") + " " + fmt(a) + " ÷ 100) = " + fmt(r),
        bar: a
      };
    },
    reverse: function (a, b) {
      if (b === 0) return { error: "Enter a percentage other than 0." };
      var r = a / (b / 100);
      return { result: fmt(r), working: fmt(a) + " ÷ (" + fmt(b) + " ÷ 100) = " + fmt(r), bar: b };
    },
    difference: function (a, b) {
      if (a + b === 0) return { error: "The two values can't add up to 0." };
      var r = (Math.abs(a - b) / ((a + b) / 2)) * 100;
      return {
        result: fmt(r) + "%",
        working: "|" + fmt(a) + " − " + fmt(b) + "| ÷ ((" + fmt(a) + " + " + fmt(b) + ") ÷ 2) × 100 = " + fmt(r) + "%",
        bar: r
      };
    }
  };

  function read(input) {
    var v = input.value.trim().replace(/,/g, "");
    if (v === "") return null;
    var n = Number(v);
    return isFinite(n) ? n : NaN;
  }

  function update(form) {
    var fn = calcs[form.getAttribute("data-calc")];
    var out = form.querySelector(".calc__result");
    var work = form.querySelector(".calc__working");
    var fill = form.querySelector(".bar__fill");
    var a = read(form.elements.a), b = read(form.elements.b);
    var mode = form.elements.mode ? form.elements.mode.value : null;

    form.classList.remove("has-error");
    if (a === null || b === null) {
      out.textContent = "—";
      work.textContent = "Fill in both numbers.";
      fill.style.width = "0%";
      return false;
    }
    var r = isNaN(a) || isNaN(b) ? { error: "Use numbers only, like 25 or 12.5." } : fn(a, b, mode);
    if (r.error) {
      form.classList.add("has-error");
      out.textContent = "—";
      work.textContent = r.error;
      fill.style.width = "0%";
      return false;
    }
    out.textContent = r.result;
    work.textContent = r.working;
    fill.style.width = clamp(r.bar) + "%";
    return true;
  }

  document.querySelectorAll("form[data-calc]").forEach(function (form) {
    form.addEventListener("input", function () { update(form); });
    // A finished entry (blur or Enter) counts as one calculation.
    form.addEventListener("change", function () {
      if (update(form)) document.dispatchEvent(new CustomEvent("calculated"));
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (update(form)) document.dispatchEvent(new CustomEvent("calculated"));
    });
    update(form);
  });

  var copyBtns = document.querySelectorAll("[data-copy]");
  copyBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.closest("form").querySelector(".calc__result").textContent;
      if (text === "—" || !navigator.clipboard) return;
      navigator.clipboard.writeText(text).then(function () {
        btn.textContent = "Copied";
        setTimeout(function () { btn.textContent = "Copy result"; }, 1500);
      });
    });
  });

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
