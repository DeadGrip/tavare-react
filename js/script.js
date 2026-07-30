(function () {
  "use strict";

  var header = document.getElementById("site-header");
  var navToggle = document.getElementById("navToggle");
  var mobileNav = document.getElementById("mobileNav");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Header background on scroll */
  function onScroll() {
    if (window.scrollY > 8) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* Mobile nav toggle */
  navToggle.addEventListener("click", function () {
    var open = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!open));
    navToggle.setAttribute("aria-label", open ? "Open menu" : "Close menu");
    mobileNav.classList.toggle("open", !open);
  });

  mobileNav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open menu");
      mobileNav.classList.remove("open");
    });
  });

  /* ---------- Scroll reveal (re-usable for dynamically inserted cards) ---------- */
  var io =
    !reduceMotion && "IntersectionObserver" in window
      ? new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) {
                entry.target.classList.add("in-view");
                io.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
        )
      : null;

  function observeReveals(root) {
    var els = root.querySelectorAll(".reveal");
    els.forEach(function (el) {
      if (io) {
        io.observe(el);
      } else {
        el.classList.add("in-view");
      }
    });
  }

  observeReveals(document);

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  var supabaseClient =
    window.supabase && window.TAVARE_SUPABASE_URL
      ? window.supabase.createClient(window.TAVARE_SUPABASE_URL, window.TAVARE_SUPABASE_ANON_KEY)
      : null;

  /* ---------- Hero: four ways to wear ---------- */
  var WEAR_CAPTIONS = {
    earrings: "Worn separately, as a simple pair of drop earrings. The chain rests, unused.",
    necklace: "Both earrings interlock at the centre of the chain, forming a single pendant necklace.",
    chain: "The chain sits as a necklace on its own, while the earrings are worn as usual — a layered look from one set.",
    bracelet: "The chain wraps twice to sit as a bracelet. Earrings rest until you switch it back.",
  };

  var wearTabs = document.querySelectorAll(".wear-tab");
  var wearCaption = document.getElementById("wearCaption");

  wearTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      if (tab.classList.contains("is-active")) return;
      wearTabs.forEach(function (t) {
        t.classList.remove("is-active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("is-active");
      tab.setAttribute("aria-selected", "true");

      var next = WEAR_CAPTIONS[tab.getAttribute("data-wear")] || "";
      if (reduceMotion) {
        wearCaption.textContent = next;
        return;
      }
      wearCaption.classList.add("is-fading");
      window.setTimeout(function () {
        wearCaption.textContent = next;
        wearCaption.classList.remove("is-fading");
      }, 160);
    });
  });

  /* ---------- Catalogue rendering ---------- */
  var STATUS_LABEL = { available: "Now Reserving", reserved: "Fully Reserved", sold: "Series Closed" };
  var STATUS_CLASS = { available: "status-available", reserved: "status-reserved", sold: "status-sold" };

  function archFrameSvg() {
    return (
      '<svg class="frame-svg" viewBox="0 0 220 220" aria-hidden="true">' +
      '<path d="M20,204 V90 C20,52 50,22 110,14 C170,22 200,52 200,90 V204" stroke="url(#silverGrad)" stroke-width="1.6" fill="none"/>' +
      '<path d="M32,204 V96 C32,64 56,40 110,32 C164,40 188,64 188,96 V204" stroke="url(#silverGrad)" stroke-width="0.7" fill="none" opacity="0.5"/>' +
      '<path d="M110,4 L116,10 L110,16 L104,10 Z" fill="url(#silverGrad)"/>' +
      "</svg>"
    );
  }

  function jewelleryPlaceholderSvg() {
    return (
      '<svg class="placeholder-svg" viewBox="0 0 220 220" aria-hidden="true">' +
      '<path d="M92 96 A11 10 0 0 1 116 96 L112 112 L96 112 Z" stroke="url(#silverGrad)" stroke-width="1.1" fill="none"/>' +
      '<path d="M124 96 A11 10 0 0 1 148 96 L144 112 L128 112 Z" stroke="url(#silverGrad)" stroke-width="1.1" fill="none"/>' +
      '<path d="M104 112 L118 138 M136 112 L122 138" stroke="url(#silverGrad)" stroke-width="0.8" opacity="0.7"/>' +
      '<circle cx="120" cy="142" r="6" stroke="url(#silverGrad)" stroke-width="1" fill="none"/>' +
      "</svg>"
    );
  }

  function lotCardHtml(p) {
    var statusLabel = STATUS_LABEL[p.status] || "Now Reserving";
    var statusClass = STATUS_CLASS[p.status] || "status-available";
    var soldClass = p.status === "sold" ? " lot-sold" : "";
    var media = p.image
      ? '<img class="lot-photo" src="' + escapeHtml(p.image) + '" alt="' + escapeHtml(p.name) + '">'
      : jewelleryPlaceholderSvg();
    var caption = p.image ? "" : "Plate awaiting development";

    return (
      '<article class="lot-card reveal' + soldClass + '" data-reveal>' +
      '<div class="lot-image">' +
      archFrameSvg() +
      media +
      '<div class="lot-label">' +
      '<span class="lot-no">Design&nbsp;No.&nbsp;' + escapeHtml(p.lotNumber || "") + "</span>" +
      "<span>" + escapeHtml(p.material || "") + "</span>" +
      (caption ? "<span>" + caption + "</span>" : "") +
      '<span class="lot-status ' + statusClass + '">' + statusLabel + "</span>" +
      "</div>" +
      "</div>" +
      "<h3>" + escapeHtml(p.name) + "</h3>" +
      "<p>" + escapeHtml(p.description || "") + "</p>" +
      '<p class="lot-meta">Design&nbsp;No.&nbsp;' + escapeHtml(p.lotNumber || "") + " &middot; " + escapeHtml(p.priceNote || "Price on request") + "</p>" +
      "</article>"
    );
  }

  function loadProducts() {
    var lotGrid = document.getElementById("lotGrid");
    if (!lotGrid) return;

    if (!supabaseClient) {
      lotGrid.innerHTML = '<p class="loading-note">Supabase isn&rsquo;t configured yet — see SETUP.md.</p>';
      return;
    }

    supabaseClient
      .from("products")
      .select(
        "id,category,name,lotNumber:lot_number,era,material,description,priceNote:price_note,status,image,sortOrder:sort_order"
      )
      .order("sort_order", { ascending: true })
      .then(function (result) {
        if (result.error) throw result.error;
        var products = result.data;

        lotGrid.innerHTML = products.length
          ? products.map(lotCardHtml).join("")
          : '<p class="loading-note">The catalogue is being refreshed — please check back shortly.</p>';

        observeReveals(lotGrid);
      })
      .catch(function () {
        lotGrid.innerHTML = '<p class="loading-note">Couldn&rsquo;t load the catalogue right now.</p>';
      });
  }

  loadProducts();

  /* ---------- Live reservation count ---------- */
  var reserveCountEl = document.getElementById("reserveCount");
  var reserveCountNumberEl = document.getElementById("reserveCountNumber");

  function loadReservationCount() {
    if (!supabaseClient || !reserveCountEl) return;
    supabaseClient
      .rpc("reservation_count")
      .then(function (result) {
        if (result.error) throw result.error;
        reserveCountNumberEl.textContent = result.data;
        reserveCountEl.hidden = false;
      })
      .catch(function () {
        /* quietly hide the counter if it can't load — not critical to the page */
      });
  }
  loadReservationCount();

  /* ---------- Countdown timer (admin-controlled via site_settings) ---------- */
  var countdownEl = document.getElementById("countdown");
  var countdownTimer = null;

  function renderCountdown(endsAt) {
    var msLeft = new Date(endsAt).getTime() - Date.now();
    if (msLeft <= 0) {
      countdownEl.hidden = true;
      if (countdownTimer) window.clearInterval(countdownTimer);
      return;
    }
    var totalSeconds = Math.floor(msLeft / 1000);
    var days = Math.floor(totalSeconds / 86400);
    var hours = Math.floor((totalSeconds % 86400) / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;

    document.getElementById("cdDays").textContent = String(days).padStart(2, "0");
    document.getElementById("cdHours").textContent = String(hours).padStart(2, "0");
    document.getElementById("cdMinutes").textContent = String(minutes).padStart(2, "0");
    document.getElementById("cdSeconds").textContent = String(seconds).padStart(2, "0");
  }

  function loadCountdown() {
    if (!supabaseClient || !countdownEl) return;
    supabaseClient
      .from("site_settings")
      .select("timer_enabled,timer_label,timer_ends_at")
      .eq("id", true)
      .single()
      .then(function (result) {
        if (result.error) throw result.error;
        var settings = result.data;
        if (!settings || !settings.timer_enabled || !settings.timer_ends_at) return;
        if (new Date(settings.timer_ends_at).getTime() <= Date.now()) return;

        document.getElementById("countdownLabel").textContent = settings.timer_label || "Series I closes in";
        countdownEl.hidden = false;
        renderCountdown(settings.timer_ends_at);
        countdownTimer = window.setInterval(function () {
          renderCountdown(settings.timer_ends_at);
        }, 1000);
      })
      .catch(function () {
        /* quietly skip the countdown if settings can't load */
      });
  }
  loadCountdown();

  /* ---------- Reserve form (only present on reserve.html) ---------- */
  var form = document.getElementById("reserveForm");
  var success = document.getElementById("formSuccess");
  var formErrorEl = document.getElementById("formErrorNote");

  if (form) {
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    var submitBtn = form.querySelector(".form-submit");
    var label = submitBtn.querySelector(".btn-label");
    submitBtn.setAttribute("disabled", "true");
    label.textContent = "Reserving…";
    if (formErrorEl) formErrorEl.textContent = "";
    success.classList.remove("show");

    var payload = {
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      finish: document.getElementById("finish").value,
    };

    fetch("/api/reserve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        if (!result.ok) throw new Error(result.data.error || "Couldn't save that.");
        label.textContent = "Reserved";
        success.innerHTML =
          "You're on the list — <strong>" + escapeHtml(result.data.numberLabel) + "</strong><br>" +
          "That's your number in Series I, fixed by reservation order. We'll email you the moment the series is ready.";
        success.classList.add("show");
        form.reset();
        if (reserveCountNumberEl && !reserveCountEl.hidden) {
          reserveCountNumberEl.textContent = String((parseInt(reserveCountNumberEl.textContent, 10) || 0) + 1);
        }
      })
      .catch(function () {
        submitBtn.removeAttribute("disabled");
        label.textContent = "Reserve My Set";
        if (formErrorEl) formErrorEl.textContent = "Couldn’t save your reservation — please try again or email us directly.";
      });
  });
  }

  /* ---------- Cookie consent ---------- */
  var cookieBanner = document.getElementById("cookieBanner");
  if (cookieBanner) {
    var COOKIE_KEY = "tavareCookieConsent";
    if (!window.localStorage.getItem(COOKIE_KEY)) {
      cookieBanner.hidden = false;
    }
    function setCookieConsent(value) {
      try {
        window.localStorage.setItem(COOKIE_KEY, value);
      } catch (e) {
        /* localStorage unavailable — banner will just reappear next visit */
      }
      cookieBanner.hidden = true;
    }
    var cookieAccept = document.getElementById("cookieAccept");
    var cookieDecline = document.getElementById("cookieDecline");
    if (cookieAccept) cookieAccept.addEventListener("click", function () { setCookieConsent("accepted"); });
    if (cookieDecline) cookieDecline.addEventListener("click", function () { setCookieConsent("declined"); });
  }

  /* ---------- Site content overrides (admin-editable copy) ---------- */
  function loadSiteContent() {
    var els = document.querySelectorAll("[data-ck]");
    if (!supabaseClient || !els.length) return;
    supabaseClient
      .from("site_content")
      .select("key,value")
      .then(function (result) {
        if (result.error) throw result.error;
        var map = {};
        result.data.forEach(function (row) {
          if (row.value) map[row.key] = row.value;
        });
        els.forEach(function (el) {
          var key = el.getAttribute("data-ck");
          if (!map[key]) return;
          el.textContent = map[key];
          if (key === "contact.email") el.setAttribute("href", "mailto:" + map[key]);
        });
      })
      .catch(function () {
        /* quietly keep the hardcoded default copy if this fails */
      });
  }
  loadSiteContent();

  /* ---------- Hero image (admin-editable, falls back to line-art) ---------- */
  function loadHeroImage() {
    var heroPlate = document.getElementById("heroPlate");
    var heroSvg = document.getElementById("heroSvg");
    if (!supabaseClient || !heroPlate || !heroSvg) return;
    supabaseClient
      .from("site_settings")
      .select("hero_image")
      .eq("id", true)
      .single()
      .then(function (result) {
        if (result.error) throw result.error;
        var url = result.data && result.data.hero_image;
        if (!url) return;
        var img = document.createElement("img");
        img.className = "hero-photo";
        img.src = url;
        img.alt = "The Convertible Set";
        heroSvg.replaceWith(img);
      })
      .catch(function () {
        /* quietly keep the SVG illustration if this fails */
      });
  }
  loadHeroImage();
})();
