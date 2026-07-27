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

  /* ---------- Product rendering ---------- */
  var STATUS_LABEL = { available: "Available", reserved: "Reserved", sold: "Archived" };
  var STATUS_CLASS = { available: "status-available", reserved: "status-reserved", sold: "status-sold" };

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

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
      '<circle cx="110" cy="128" r="34" stroke="url(#silverGrad)" stroke-width="1.2" fill="none"/>' +
      '<path d="M110 94 L120 72 L132 66 L124 86 L110 94Z" stroke="url(#silverGrad)" stroke-width="1" fill="none"/>' +
      '<circle cx="110" cy="128" r="12" stroke="url(#silverGrad)" stroke-width="0.9" fill="none"/>' +
      "</svg>"
    );
  }

  function artFrameSvg() {
    return (
      '<svg class="frame-svg art-frame-svg" viewBox="0 0 200 240" aria-hidden="true">' +
      '<rect x="14" y="14" width="172" height="212" stroke="url(#verdigrisGrad)" stroke-width="0.7" fill="none" opacity="0.35"/>' +
      '<path d="M10,34 V18 C10,13 13,10 18,10 H34" stroke="url(#verdigrisGrad)" stroke-width="1.3" fill="none"/>' +
      '<path d="M166,10 H182 C187,10 190,13 190,18 V34" stroke="url(#verdigrisGrad)" stroke-width="1.3" fill="none"/>' +
      '<path d="M190,206 V222 C190,227 187,230 182,230 H166" stroke="url(#verdigrisGrad)" stroke-width="1.3" fill="none"/>' +
      '<path d="M34,230 H18 C13,230 10,227 10,222 V206" stroke="url(#verdigrisGrad)" stroke-width="1.3" fill="none"/>' +
      "</svg>"
    );
  }

  function artPlaceholderSvg() {
    return (
      '<svg class="placeholder-svg" viewBox="0 0 200 240" aria-hidden="true">' +
      '<path d="M55,170 L90,110 L112,140 L145,85" stroke="url(#verdigrisGrad)" stroke-width="1" fill="none"/>' +
      '<circle cx="140" cy="70" r="9" stroke="url(#verdigrisGrad)" stroke-width="0.8" fill="none"/>' +
      "</svg>"
    );
  }

  function lotCardHtml(p) {
    var statusLabel = STATUS_LABEL[p.status] || "Available";
    var statusClass = STATUS_CLASS[p.status] || "status-available";
    var soldClass = p.status === "sold" ? " lot-sold" : "";
    var media = p.image
      ? '<img class="lot-photo" src="' + escapeHtml(p.image) + '" alt="' + escapeHtml(p.name) + '">'
      : jewelleryPlaceholderSvg();

    return (
      '<article class="lot-card reveal' + soldClass + '" data-reveal>' +
      '<div class="lot-image">' +
      archFrameSvg() +
      media +
      '<div class="lot-label">' +
      '<span class="lot-no">Lot&nbsp;' + escapeHtml(p.lotNumber || "") + "</span>" +
      "<span>" + escapeHtml(p.era || "") + "</span>" +
      "<span>" + escapeHtml(p.material || "") + "</span>" +
      '<span class="lot-status ' + statusClass + '">' + statusLabel + "</span>" +
      "</div>" +
      "</div>" +
      "<h3>" + escapeHtml(p.name) + "</h3>" +
      "<p>" + escapeHtml(p.description || "") + "</p>" +
      '<p class="lot-meta">No.&nbsp;' + escapeHtml(p.lotNumber || "") + " &middot; " + statusLabel + "</p>" +
      "</article>"
    );
  }

  function artCardHtml(p) {
    var media = p.image
      ? '<img class="art-photo" src="' + escapeHtml(p.image) + '" alt="' + escapeHtml(p.name) + '">'
      : artPlaceholderSvg();

    return (
      '<article class="art-card">' +
      '<div class="art-image">' +
      artFrameSvg() +
      media +
      "</div>" +
      "<h3>" + escapeHtml(p.name) + "</h3>" +
      '<p class="art-meta">' + escapeHtml(p.material || "") + " &middot; " + escapeHtml(p.era || "") + "</p>" +
      '<p class="art-price">' + escapeHtml(p.priceNote || "Price on request") + "</p>" +
      "</article>"
    );
  }

  function populatePieceSelect(products) {
    var select = document.getElementById("piece");
    if (!select) return;
    var fallback = "<option>Something rare I haven&rsquo;t seen yet</option>";
    var options = products
      .filter(function (p) {
        return p.status !== "sold";
      })
      .map(function (p) {
        var label = p.name + " — No. " + (p.lotNumber || "");
        return "<option>" + escapeHtml(label) + "</option>";
      })
      .join("");
    select.innerHTML = options + fallback;
  }

  var supabaseClient =
    window.supabase && window.TAVARE_SUPABASE_URL
      ? window.supabase.createClient(window.TAVARE_SUPABASE_URL, window.TAVARE_SUPABASE_ANON_KEY)
      : null;

  function loadProducts() {
    var lotGrid = document.getElementById("lotGrid");
    var artTrack = document.getElementById("artTrack");

    if (!supabaseClient) {
      lotGrid.innerHTML = '<p class="loading-note">Supabase isn&rsquo;t configured yet — see SETUP.md.</p>';
      artTrack.innerHTML = '<p class="loading-note">Supabase isn&rsquo;t configured yet — see SETUP.md.</p>';
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
        var jewellery = products.filter(function (p) {
          return p.category === "jewellery";
        });
        var art = products.filter(function (p) {
          return p.category === "art";
        });

        lotGrid.innerHTML = jewellery.length
          ? jewellery.map(lotCardHtml).join("")
          : '<p class="loading-note">The collection is being refreshed — please check back shortly.</p>';

        artTrack.innerHTML = art.length
          ? art.map(artCardHtml).join("")
          : '<p class="loading-note">The gallery is being refreshed — please check back shortly.</p>';

        observeReveals(lotGrid);
        populatePieceSelect(products);
      })
      .catch(function () {
        lotGrid.innerHTML = '<p class="loading-note">Couldn&rsquo;t load the collection right now.</p>';
        artTrack.innerHTML = '<p class="loading-note">Couldn&rsquo;t load the gallery right now.</p>';
      });
  }

  loadProducts();

  /* Reserve form: no payment, just an inquiry — sent via /api/reserve (Resend) */
  var form = document.getElementById("reserveForm");
  var success = document.getElementById("formSuccess");
  var formErrorEl = document.getElementById("formErrorNote");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    var submitBtn = form.querySelector(".form-submit");
    var label = submitBtn.querySelector(".btn-label");
    submitBtn.setAttribute("disabled", "true");
    label.textContent = "Sending…";
    if (formErrorEl) formErrorEl.textContent = "";

    var payload = {
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      piece: document.getElementById("piece").value,
      message: document.getElementById("message").value,
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
        if (!result.ok) throw new Error(result.data.error || "Couldn't send that.");
        label.textContent = "Request Sent";
        success.classList.add("show");
        form.reset();
      })
      .catch(function (err) {
        submitBtn.removeAttribute("disabled");
        label.textContent = "Send Request";
        if (formErrorEl) formErrorEl.textContent = "Couldn’t send your request — please try again or email us directly.";
      });
  });
})();
