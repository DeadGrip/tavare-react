(function () {
  "use strict";

  var loginView = document.getElementById("loginView");
  var dashboardView = document.getElementById("dashboardView");
  var loginForm = document.getElementById("loginForm");
  var loginError = document.getElementById("loginError");
  var logoutBtn = document.getElementById("logoutBtn");
  var productRows = document.getElementById("productRows");

  var modal = document.getElementById("productModal");
  var modalBackdrop = document.getElementById("modalBackdrop");
  var modalClose = document.getElementById("modalClose");
  var modalCancel = document.getElementById("modalCancel");
  var modalTitle = document.getElementById("modalTitle");
  var newProductBtn = document.getElementById("newProductBtn");
  var productForm = document.getElementById("productForm");
  var formError = document.getElementById("formError");
  var imageInput = document.getElementById("pImage");
  var imagePreview = document.getElementById("pImagePreview");
  var imageRemoveBtn = document.getElementById("pImageRemoveBtn");
  var imageRemoved = false;
  var currentProductImage = null;

  var confirmModal = document.getElementById("confirmModal");
  var confirmBackdrop = document.getElementById("confirmBackdrop");
  var confirmMessage = document.getElementById("confirmMessage");
  var confirmOkBtn = document.getElementById("confirmOk");
  var confirmCancelBtn = document.getElementById("confirmCancel");
  var toasts = document.getElementById("toasts");

  var STATUS_LABEL = { available: "Now Reserving", reserved: "Fully Reserved", sold: "Series Closed" };
  var BUCKET = "product-images";

  var reserveCountEnabled = document.getElementById("reserveCountEnabled");
  var timerEnabled = document.getElementById("timerEnabled");
  var timerLabel = document.getElementById("timerLabel");
  var timerDays = document.getElementById("timerDays");
  var timerCurrentEnds = document.getElementById("timerCurrentEnds");
  var timerSaveBtn = document.getElementById("timerSaveBtn");
  var timerRestartBtn = document.getElementById("timerRestartBtn");

  var heroImagePreview = document.getElementById("heroImagePreview");
  var heroImageInput = document.getElementById("heroImageInput");
  var heroImageUploadBtn = document.getElementById("heroImageUploadBtn");
  var heroImageRemoveBtn = document.getElementById("heroImageRemoveBtn");
  var heroImageError = document.getElementById("heroImageError");
  var heroFrameStyle = document.getElementById("heroFrameStyle");
  var currentHeroImage = null;

  var contentEditorGroups = document.getElementById("contentEditorGroups");
  var contentSaveBtn = document.getElementById("contentSaveBtn");

  /* ---------- toast + confirm dialog (replace alert()/confirm()) ---------- */
  function showToast(message, type) {
    var toast = document.createElement("div");
    toast.className = "admin-toast" + (type === "error" ? " toast-error" : "");
    toast.textContent = message;
    toasts.appendChild(toast);
    window.setTimeout(function () {
      toast.classList.add("toast-leaving");
      toast.addEventListener("animationend", function () {
        toast.remove();
      });
    }, 3200);
  }

  var confirmResolver = null;
  function showConfirm(message) {
    confirmMessage.textContent = message;
    confirmModal.hidden = false;
    confirmOkBtn.focus();
    return new Promise(function (resolve) {
      confirmResolver = resolve;
    });
  }
  function closeConfirm(result) {
    confirmModal.hidden = true;
    if (confirmResolver) {
      confirmResolver(result);
      confirmResolver = null;
    }
  }
  confirmOkBtn.addEventListener("click", function () {
    closeConfirm(true);
  });
  confirmCancelBtn.addEventListener("click", function () {
    closeConfirm(false);
  });
  confirmBackdrop.addEventListener("click", function () {
    closeConfirm(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !confirmModal.hidden) closeConfirm(false);
  });

  var supabaseClient =
    window.supabase && window.TAVARE_SUPABASE_URL
      ? window.supabase.createClient(window.TAVARE_SUPABASE_URL, window.TAVARE_SUPABASE_ANON_KEY)
      : null;

  if (!supabaseClient) {
    document.body.innerHTML =
      '<div style="padding:3rem;font-family:sans-serif;color:#EDEAE3;background:#0D0D0C;min-height:100vh;">' +
      "Supabase isn&rsquo;t configured yet. Fill in <code>public/js/supabase-config.js</code> with your project URL and anon key — see SETUP.md." +
      "</div>";
    return;
  }

  function showView(authenticated) {
    loginView.hidden = authenticated;
    dashboardView.hidden = !authenticated;
  }

  function checkSession() {
    supabaseClient.auth.getSession().then(function (result) {
      var authenticated = !!(result.data && result.data.session);
      showView(authenticated);
      if (authenticated) {
        loadProducts();
        loadSettings();
        loadContentEditor();
        loadReservations();
      }
    });
  }

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    loginError.textContent = "";
    var email = document.getElementById("username").value;
    var password = document.getElementById("password").value;

    supabaseClient.auth
      .signInWithPassword({ email: email, password: password })
      .then(function (result) {
        if (result.error) {
          loginError.textContent = result.error.message || "Sign in failed.";
          return;
        }
        loginForm.reset();
        showView(true);
        loadProducts();
        loadSettings();
        loadContentEditor();
        loadReservations();
      })
      .catch(function () {
        loginError.textContent = "Couldn't reach Supabase. Check your connection.";
      });
  });

  logoutBtn.addEventListener("click", function () {
    supabaseClient.auth.signOut().then(function () {
      showView(false);
    });
  });

  /* ---------- product list ---------- */
  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  var currentProducts = [];
  var PRODUCT_COLUMNS =
    "id,category,name,lotNumber:lot_number,era,material,description,priceNote:price_note,status,image,sortOrder:sort_order";

  function loadProducts() {
    productRows.innerHTML = '<tr><td colspan="4" class="admin-empty">Loading…</td></tr>';
    supabaseClient
      .from("products")
      .select(PRODUCT_COLUMNS)
      .order("sort_order", { ascending: true })
      .then(function (result) {
        if (result.error) throw result.error;
        var products = result.data;
        currentProducts = products;
        if (!products.length) {
          productRows.innerHTML = '<tr><td colspan="4" class="admin-empty">No designs yet — add your first one.</td></tr>';
          return;
        }
        productRows.innerHTML = products.map(rowHtml).join("");
        attachRowHandlers();
      })
      .catch(function () {
        productRows.innerHTML = '<tr><td colspan="4" class="admin-empty">Couldn’t load the catalogue.</td></tr>';
      });
  }

  function rowHtml(p) {
    var thumb = p.image
      ? '<img class="admin-thumb" src="' + escapeHtml(p.image) + '" alt="">'
      : '<span class="admin-thumb-placeholder">&#9671;</span>';

    var statusOptions = Object.keys(STATUS_LABEL)
      .map(function (key) {
        return (
          '<option value="' + key + '"' + (p.status === key ? " selected" : "") + ">" + STATUS_LABEL[key] + "</option>"
        );
      })
      .join("");

    return (
      '<tr data-id="' + escapeHtml(p.id) + '">' +
      '<td><div class="admin-piece-cell">' + thumb + '<span class="admin-piece-name">' + escapeHtml(p.name) + "</span></div></td>" +
      "<td>" + escapeHtml(p.lotNumber || "—") + "</td>" +
      '<td><select class="status-select" data-id="' + escapeHtml(p.id) + '">' + statusOptions + "</select></td>" +
      '<td><div class="admin-row-actions">' +
      '<button type="button" class="admin-icon-btn" data-edit="' + escapeHtml(p.id) + '">Edit</button>' +
      '<button type="button" class="admin-icon-btn danger" data-delete="' + escapeHtml(p.id) + '">Delete</button>' +
      "</div></td>" +
      "</tr>"
    );
  }

  function attachRowHandlers() {
    productRows.querySelectorAll(".status-select").forEach(function (select) {
      select.addEventListener("change", function () {
        var id = select.getAttribute("data-id");
        supabaseClient
          .from("products")
          .update({ status: select.value })
          .eq("id", id)
          .then(function (result) {
            if (result.error) throw result.error;
            var idx = currentProducts.findIndex(function (p) {
              return p.id === id;
            });
            if (idx > -1) currentProducts[idx].status = select.value;
          })
          .catch(function () {
            showToast("Couldn’t update status. Please try again.", "error");
            loadProducts();
          });
      });
    });

    productRows.querySelectorAll("[data-edit]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openModal(btn.getAttribute("data-edit"));
      });
    });

    productRows.querySelectorAll("[data-delete]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-delete");
        var product = currentProducts.find(function (p) {
          return p.id === id;
        });
        var name = product ? product.name : "this design";

        showConfirm('Delete "' + name + '"? This can’t be undone.').then(function (confirmed) {
          if (!confirmed) return;

          supabaseClient
            .from("products")
            .delete()
            .eq("id", id)
            .then(function (result) {
              if (result.error) throw result.error;
              var imagePath = storagePathFromUrl(product && product.image);
              if (imagePath) {
                supabaseClient.storage.from(BUCKET).remove([imagePath]);
              }
              showToast('"' + name + '" deleted.');
              loadProducts();
            })
            .catch(function () {
              showToast("Couldn’t delete this design. Please try again.", "error");
            });
        });
      });
    });
  }

  function storagePathFromUrl(url) {
    if (!url) return null;
    var marker = "/" + BUCKET + "/";
    var idx = url.indexOf(marker);
    if (idx === -1) return null;
    return url.slice(idx + marker.length);
  }

  /* ---------- modal / form ---------- */
  function openModal(id) {
    formError.textContent = "";
    productForm.reset();
    imagePreview.hidden = true;
    imagePreview.src = "";
    imageRemoveBtn.hidden = true;
    imageRemoved = false;
    currentProductImage = null;

    if (id) {
      var product = currentProducts.find(function (p) {
        return p.id === id;
      });
      if (!product) return;
      modalTitle.textContent = "Edit Design";
      document.getElementById("productId").value = product.id;
      document.getElementById("pName").value = product.name || "";
      document.getElementById("pCategory").value = product.category || "jewellery";
      document.getElementById("pLotNumber").value = product.lotNumber || "";
      document.getElementById("pStatus").value = product.status || "available";
      document.getElementById("pMaterial").value = product.material || "";
      document.getElementById("pDescription").value = product.description || "";
      document.getElementById("pPriceNote").value = product.priceNote || "";
      if (product.image) {
        imagePreview.src = product.image;
        imagePreview.hidden = false;
        imageRemoveBtn.hidden = false;
        currentProductImage = product.image;
      }
    } else {
      modalTitle.textContent = "Add a Design";
      document.getElementById("productId").value = "";
    }

    modal.hidden = false;
  }

  function closeModal() {
    modal.hidden = true;
  }

  newProductBtn.addEventListener("click", function () {
    openModal(null);
  });
  modalClose.addEventListener("click", closeModal);
  modalCancel.addEventListener("click", closeModal);
  modalBackdrop.addEventListener("click", closeModal);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });

  imageInput.addEventListener("change", function () {
    var file = imageInput.files && imageInput.files[0];
    if (!file) return;
    imagePreview.src = URL.createObjectURL(file);
    imagePreview.hidden = false;
    imageRemoveBtn.hidden = false;
    imageRemoved = false;
  });

  imageRemoveBtn.addEventListener("click", function () {
    imageInput.value = "";
    imagePreview.hidden = true;
    imagePreview.src = "";
    imageRemoveBtn.hidden = true;
    imageRemoved = !!currentProductImage;
  });

  function uploadImageIfNeeded() {
    var file = imageInput.files && imageInput.files[0];
    if (!file) return Promise.resolve(null);

    var ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    var path = Date.now() + "-" + Math.random().toString(16).slice(2) + "." + ext;

    return supabaseClient.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: false })
      .then(function (result) {
        if (result.error) throw result.error;
        var pub = supabaseClient.storage.from(BUCKET).getPublicUrl(path);
        return pub.data.publicUrl;
      });
  }

  productForm.addEventListener("submit", function (e) {
    e.preventDefault();
    formError.textContent = "";

    var id = document.getElementById("productId").value;
    var submitBtn = productForm.querySelector('button[type="submit"]');
    submitBtn.setAttribute("disabled", "true");

    uploadImageIfNeeded()
      .then(function (imageUrl) {
        var record = {
          category: document.getElementById("pCategory").value,
          name: document.getElementById("pName").value,
          lot_number: document.getElementById("pLotNumber").value,
          material: document.getElementById("pMaterial").value,
          description: document.getElementById("pDescription").value,
          price_note: document.getElementById("pPriceNote").value || "Price on request",
          status: document.getElementById("pStatus").value,
        };
        if (imageUrl) record.image = imageUrl;
        else if (imageRemoved) record.image = null;

        if (id) {
          return supabaseClient.from("products").update(record).eq("id", id);
        }
        record.sort_order = Date.now();
        return supabaseClient.from("products").insert([record]);
      })
      .then(function (result) {
        if (result.error) throw result.error;
        if (imageRemoved && currentProductImage) {
          var oldPath = storagePathFromUrl(currentProductImage);
          if (oldPath) supabaseClient.storage.from(BUCKET).remove([oldPath]);
        }
        closeModal();
        showToast(id ? "Design updated." : "Design added.");
        loadProducts();
      })
      .catch(function (err) {
        formError.textContent = (err && err.message) || "Couldn’t save this design.";
      })
      .finally(function () {
        submitBtn.removeAttribute("disabled");
      });
  });

  /* ---------- Countdown timer settings ---------- */
  function formatEndsAt(iso) {
    if (!iso) return "No end date set yet — use Restart Timer to set one.";
    var d = new Date(iso);
    var past = d.getTime() <= Date.now();
    return (past ? "Ended " : "Ends ") + d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function loadSettings() {
    supabaseClient
      .from("site_settings")
      .select("timer_enabled,timer_label,timer_ends_at,hero_image,reserve_count_enabled,hero_frame_style")
      .eq("id", true)
      .single()
      .then(function (result) {
        if (result.error) throw result.error;
        var s = result.data || {};
        reserveCountEnabled.checked = s.reserve_count_enabled !== false;
        timerEnabled.checked = !!s.timer_enabled;
        timerLabel.value = s.timer_label || "Series I closes in";
        timerCurrentEnds.textContent = formatEndsAt(s.timer_ends_at);
        heroFrameStyle.value = s.hero_frame_style || "quatrefoil";

        currentHeroImage = s.hero_image || null;
        if (currentHeroImage) {
          heroImagePreview.src = currentHeroImage;
          heroImagePreview.hidden = false;
        } else {
          heroImagePreview.hidden = true;
          heroImagePreview.src = "";
        }
      })
      .catch(function () {
        timerCurrentEnds.textContent = "Couldn’t load timer settings.";
      });
  }

  timerSaveBtn.addEventListener("click", function () {
    supabaseClient
      .from("site_settings")
      .update({
        reserve_count_enabled: reserveCountEnabled.checked,
        timer_enabled: timerEnabled.checked,
        timer_label: timerLabel.value.trim() || "Series I closes in",
      })
      .eq("id", true)
      .then(function (result) {
        if (result.error) throw result.error;
        showToast("Settings saved.");
      })
      .catch(function () {
        showToast("Couldn’t save timer settings.", "error");
      });
  });

  timerRestartBtn.addEventListener("click", function () {
    var days = parseInt(timerDays.value, 10);
    if (!days || days < 1) {
      showToast("Enter a number of days first.", "error");
      return;
    }
    var endsAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    supabaseClient
      .from("site_settings")
      .update({
        timer_enabled: true,
        timer_label: timerLabel.value.trim() || "Series I closes in",
        timer_ends_at: endsAt,
      })
      .eq("id", true)
      .then(function (result) {
        if (result.error) throw result.error;
        timerEnabled.checked = true;
        timerCurrentEnds.textContent = formatEndsAt(endsAt);
        showToast("Timer restarted — " + days + " day" + (days === 1 ? "" : "s") + " from now.");
      })
      .catch(function () {
        showToast("Couldn’t restart the timer.", "error");
      });
  });

  /* ---------- Hero image ---------- */
  heroImageInput.addEventListener("change", function () {
    var file = heroImageInput.files && heroImageInput.files[0];
    if (!file) return;
    heroImagePreview.src = URL.createObjectURL(file);
    heroImagePreview.hidden = false;
  });

  heroFrameStyle.addEventListener("change", function () {
    supabaseClient
      .from("site_settings")
      .update({ hero_frame_style: heroFrameStyle.value })
      .eq("id", true)
      .then(function (result) {
        if (result.error) throw result.error;
        showToast("Frame style saved.");
      })
      .catch(function () {
        showToast("Couldn’t save the frame style.", "error");
      });
  });

  heroImageUploadBtn.addEventListener("click", function () {
    var file = heroImageInput.files && heroImageInput.files[0];
    heroImageError.textContent = "";
    if (!file) {
      showToast("Choose a photo first.", "error");
      return;
    }

    var ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    var path = "hero-" + Date.now() + "-" + Math.random().toString(16).slice(2) + "." + ext;

    supabaseClient.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: false })
      .then(function (result) {
        if (result.error) throw result.error;
        var pub = supabaseClient.storage.from(BUCKET).getPublicUrl(path);
        var url = pub.data.publicUrl;

        return supabaseClient
          .from("site_settings")
          .update({ hero_image: url })
          .eq("id", true)
          .then(function (updateResult) {
            if (updateResult.error) throw updateResult.error;
            var oldPath = storagePathFromUrl(currentHeroImage);
            if (oldPath) supabaseClient.storage.from(BUCKET).remove([oldPath]);
            currentHeroImage = url;
            heroImageInput.value = "";
            showToast("Hero image updated.");
          });
      })
      .catch(function (err) {
        heroImageError.textContent = (err && err.message) || "Couldn’t upload that photo.";
      });
  });

  heroImageRemoveBtn.addEventListener("click", function () {
    if (!currentHeroImage) {
      heroImagePreview.hidden = true;
      heroImagePreview.src = "";
      heroImageInput.value = "";
      return;
    }
    supabaseClient
      .from("site_settings")
      .update({ hero_image: null })
      .eq("id", true)
      .then(function (result) {
        if (result.error) throw result.error;
        var oldPath = storagePathFromUrl(currentHeroImage);
        if (oldPath) supabaseClient.storage.from(BUCKET).remove([oldPath]);
        currentHeroImage = null;
        heroImagePreview.hidden = true;
        heroImagePreview.src = "";
        heroImageInput.value = "";
        showToast("Hero image removed — the illustration will show instead.");
      })
      .catch(function () {
        showToast("Couldn’t remove the hero image.", "error");
      });
  });

  /* ---------- Site content editor ---------- */
  var CONTENT_GROUPS = [
    { title: "Home — Hero", fields: [
      { key: "hero.eyebrow", label: "Eyebrow", placeholder: "A Numbered Series, Handcrafted in India for Europe" },
      { key: "hero.heading_line1", label: "Heading line 1", placeholder: "One set of jewellery." },
      { key: "hero.heading_em", label: "Heading line 2 (italic)", placeholder: "Worn four different ways." },
      { key: "hero.subcopy", label: "Subcopy", type: "textarea", placeholder: "Two earrings and a single chain — designed to separate, join, and re-form into a pendant necklace, a layered look, or a bracelet. Made by hand in India in 925 sterling silver, in a series of only 50, each set carrying its own number." },
    ]},
    { title: "Home — Ways to Wear captions", fields: [
      { key: "wear.earrings", label: "Earrings", type: "textarea", placeholder: "Worn separately, as a simple pair of drop earrings. The chain rests, unused." },
      { key: "wear.necklace", label: "Necklace", type: "textarea", placeholder: "Both earrings interlock at the centre of the chain, forming a single pendant necklace." },
      { key: "wear.chain", label: "Chain + Earrings", type: "textarea", placeholder: "The chain sits as a necklace on its own, while the earrings are worn as usual — a layered look from one set." },
      { key: "wear.bracelet", label: "Bracelet", type: "textarea", placeholder: "The chain wraps twice to sit as a bracelet. Earrings rest until you switch it back." },
    ]},
    { title: "Home — The Set", fields: [
      { key: "set.heading", label: "Heading", placeholder: "Three parts. Four outcomes." },
      { key: "set.part1_title", label: "Part 1 title", placeholder: "Drop earrings" },
      { key: "set.part1_desc", label: "Part 1 description", type: "textarea", placeholder: "Each earring closes into a small interlocking hook, so the pair can be worn on their own or joined together." },
      { key: "set.part2_title", label: "Part 2 title", placeholder: "Convertible chain" },
      { key: "set.part2_desc", label: "Part 2 description", type: "textarea", placeholder: "One length of chain that sits as a necklace, wraps as a bracelet, or holds the joined earrings as a pendant." },
      { key: "set.part3_title", label: "Part 3 title", placeholder: "Connector fitting" },
      { key: "set.part3_desc", label: "Part 3 description", type: "textarea", placeholder: "A single hidden clasp point where the earrings attach to the chain — the mechanism behind all four looks." },
    ]},
    { title: "Catalogue Page", fields: [
      { key: "catalogue.eyebrow", label: "Eyebrow", placeholder: "The Catalogue" },
      { key: "catalogue.heading", label: "Heading", placeholder: "Every design, numbered" },
      { key: "catalogue.subcopy", label: "Subcopy", type: "textarea", placeholder: "Each design is released in its own numbered series — this is where new releases will appear as Series II and III open." },
    ]},
    { title: "Heritage Page — Made in Small Batches", fields: [
      { key: "batches.eyebrow", label: "Eyebrow", placeholder: "Made In Small Batches" },
      { key: "batches.heading", label: "Heading", placeholder: "Handmade by our jewellers in India, one series at a time" },
      { key: "batches.copy", label: "Copy", type: "textarea", placeholder: "Every piece in the first series is made to order by our own design and production team — not mass-produced, and not made until the series is full." },
    ]},
    { title: "Heritage Page — Craft cards", fields: [
      { key: "heritage.eyebrow", label: "Eyebrow", placeholder: "Where The Design Comes From" },
      { key: "heritage.heading", label: "Heading", placeholder: "Four ideas from Indian craft, inside one set" },
      { key: "heritage.subcopy", label: "Subcopy", type: "textarea", placeholder: "Every detail of the design is drawn from a real technique or tradition — nothing here is decorative for its own sake." },
      { key: "heritage.card1_title", label: "Card 1 title", placeholder: "Meenakari" },
      { key: "heritage.card1_subtitle", label: "Card 1 subtitle", placeholder: "Enamel work · Rajasthan" },
      { key: "heritage.card1_desc", label: "Card 1 description", type: "textarea", placeholder: "The old technique of firing colour into metal, usually hidden on the reverse of a piece. We use it as a hidden signature inside the chain's connector fitting." },
      { key: "heritage.card2_title", label: "Card 2 title", placeholder: "Kundan" },
      { key: "heritage.card2_subtitle", label: "Card 2 subtitle", placeholder: "Stone setting · North India" },
      { key: "heritage.card2_desc", label: "Card 2 description", type: "textarea", placeholder: "Stones set flush rather than raised on prongs, so the setting reads as one smooth surface — the basis for how our connector is built." },
      { key: "heritage.card3_title", label: "Card 3 title", placeholder: "Jali Lattice" },
      { key: "heritage.card3_subtitle", label: "Card 3 subtitle", placeholder: "Stone screens · Mughal architecture" },
      { key: "heritage.card3_desc", label: "Card 3 description", type: "textarea", placeholder: "The pierced stone lattices found in Mughal-era windows and screens, translated into the fine openwork along the upper edge of each earring." },
      { key: "heritage.card4_title", label: "Card 4 title", placeholder: "Jhumka Silhouette" },
      { key: "heritage.card4_subtitle", label: "Card 4 subtitle", placeholder: "Drop earring · Pan-India" },
      { key: "heritage.card4_desc", label: "Card 4 description", type: "textarea", placeholder: "The bell-shaped drop earring worn across India for generations. Ours softens that silhouette into a slimmer, more minimal line." },
    ]},
    { title: "Heritage Page — Series I", fields: [
      { key: "series.eyebrow", label: "Eyebrow", placeholder: "Series I — Numbered & Limited" },
      { key: "series.heading", label: "Heading", placeholder: "Every set carries its own number" },
      { key: "series.fact1", label: "Fact 1", type: "textarea", placeholder: "Series I is capped at 50 sets. Once it's fully reserved, this exact design isn't repeated in the same finish." },
      { key: "series.fact2", label: "Fact 2", type: "textarea", placeholder: "Your number is fixed the moment you reserve, in the order reservations come in — not assigned at random." },
      { key: "series.fact3", label: "Fact 3", type: "textarea", placeholder: "Each set ships with a small card noting its number and the date it was made." },
      { key: "series.tile1_title", label: "Tile 1 title", placeholder: "Handcrafted in India" },
      { key: "series.tile1_desc", label: "Tile 1 description", type: "textarea", placeholder: "Made after the series closes, by the same small team of jewellers — not a factory production line." },
      { key: "series.tile2_title", label: "Tile 2 title", placeholder: "Shipped to Europe" },
      { key: "series.tile2_desc", label: "Tile 2 description", type: "textarea", placeholder: "Tracked delivery to any EU address, estimated at 10–14 days once production opens." },
      { key: "series.tile3_title", label: "Tile 3 title", placeholder: "Priced in EUR" },
      { key: "series.tile3_desc", label: "Tile 3 description", type: "textarea", placeholder: "Final pricing will be shown in EUR before you're ever asked to pay anything." },
    ]},
    { title: "Reserve Page", fields: [
      { key: "reserve.eyebrow", label: "Eyebrow", placeholder: "Reserve Your Set" },
      { key: "reserve.heading", label: "Heading", placeholder: "Be first when the series opens." },
      { key: "reserve.subcopy", label: "Subcopy", type: "textarea", placeholder: "Reserving costs nothing today. It only tells us there's demand — it isn't an order or a payment." },
    ]},
    { title: "Contact Page", fields: [
      { key: "contact.eyebrow", label: "Eyebrow", placeholder: "Contact" },
      { key: "contact.heading", label: "Heading", placeholder: "Get in touch" },
      { key: "contact.email", label: "Email address", placeholder: "studio@tavarestudio.com" },
      { key: "contact.workshop", label: "Workshop text", type: "textarea", placeholder: "Design and production team, India — full address to follow once Series I is confirmed." },
      { key: "contact.response", label: "Response time text", type: "textarea", placeholder: "We reply to reservation and press enquiries within two working days." },
      { key: "contact.social", label: "Follow along text", type: "textarea", placeholder: "Instagram and newsletter links go here once the accounts are live." },
      { key: "contact.wholesale", label: "Wholesale & press text", type: "textarea", placeholder: "Reach out by email — we're a small team reviewing enquiries by hand for now." },
    ]},
    { title: "Footer (every page)", fields: [
      { key: "footer.tagline", label: "Tagline", type: "textarea", placeholder: "One set of jewellery, worn four ways. Handcrafted in India in numbered, limited series, for Europe." },
      { key: "footer.legal", label: "Legal line", placeholder: "© 2026 Tavaré. Series I limited to 50 numbered sets." },
    ]},
    { title: "Footer — Social Links", fields: [
      { key: "social.instagram", label: "Instagram URL", placeholder: "https://instagram.com/yourhandle" },
      { key: "social.facebook", label: "Facebook URL", placeholder: "https://facebook.com/yourpage" },
      { key: "social.pinterest", label: "Pinterest URL", placeholder: "https://pinterest.com/yourprofile" },
    ]},
  ];

  function buildContentEditorForm() {
    contentEditorGroups.innerHTML = CONTENT_GROUPS.map(function (group) {
      var fieldsHtml = group.fields
        .map(function (f) {
          var id = "ck_" + f.key.replace(/[^a-zA-Z0-9]/g, "_");
          var control =
            f.type === "textarea"
              ? '<textarea id="' + id + '" data-key="' + f.key + '" rows="2" placeholder="' + escapeHtml(f.placeholder) + '"></textarea>'
              : '<input type="text" id="' + id + '" data-key="' + f.key + '" placeholder="' + escapeHtml(f.placeholder) + '">';
          return '<div class="form-row"><label for="' + id + '">' + escapeHtml(f.label) + "</label>" + control + "</div>";
        })
        .join("");
      return '<div class="content-group"><p class="content-group-title">' + escapeHtml(group.title) + "</p>" + fieldsHtml + "</div>";
    }).join("");
  }
  buildContentEditorForm();

  function loadContentEditor() {
    supabaseClient
      .from("site_content")
      .select("key,value")
      .then(function (result) {
        if (result.error) throw result.error;
        var map = {};
        result.data.forEach(function (row) {
          map[row.key] = row.value;
        });
        contentEditorGroups.querySelectorAll("[data-key]").forEach(function (el) {
          if (map[el.getAttribute("data-key")] != null) {
            el.value = map[el.getAttribute("data-key")];
          }
        });
      })
      .catch(function () {
        /* leave fields blank (showing placeholders) if this fails */
      });
  }

  contentSaveBtn.addEventListener("click", function () {
    var records = [];
    contentEditorGroups.querySelectorAll("[data-key]").forEach(function (el) {
      records.push({ key: el.getAttribute("data-key"), value: el.value.trim() });
    });

    supabaseClient
      .from("site_content")
      .upsert(records, { onConflict: "key" })
      .then(function (result) {
        if (result.error) throw result.error;
        showToast("Site content saved.");
      })
      .catch(function (err) {
        showToast((err && err.message) || "Couldn’t save site content.", "error");
      });
  });

  /* ---------- Reservations ---------- */
  var currentReservations = [];
  var reservationRows = document.getElementById("reservationRows");
  var exportReservationsBtn = document.getElementById("exportReservationsBtn");
  var FINISH_LABEL = { polished: "Polished", brushed: "Brushed", no_preference: "No preference" };

  function loadReservations() {
    if (!reservationRows) return;
    reservationRows.innerHTML = '<tr><td colspan="5" class="admin-empty">Loading…</td></tr>';
    supabaseClient
      .from("reservations")
      .select("seq_number,name,email,finish,created_at")
      .order("seq_number", { ascending: true })
      .then(function (result) {
        if (result.error) throw result.error;
        currentReservations = result.data || [];
        if (!currentReservations.length) {
          reservationRows.innerHTML = '<tr><td colspan="5" class="admin-empty">No reservations yet.</td></tr>';
          return;
        }
        reservationRows.innerHTML = currentReservations
          .map(function (r) {
            var date = r.created_at
              ? new Date(r.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })
              : "";
            return (
              "<tr>" +
              "<td>" + String(r.seq_number).padStart(3, "0") + "</td>" +
              "<td>" + escapeHtml(r.name) + "</td>" +
              "<td>" + escapeHtml(r.email) + "</td>" +
              "<td>" + escapeHtml(FINISH_LABEL[r.finish] || r.finish) + "</td>" +
              "<td>" + escapeHtml(date) + "</td>" +
              "</tr>"
            );
          })
          .join("");
      })
      .catch(function () {
        reservationRows.innerHTML = '<tr><td colspan="5" class="admin-empty">Couldn’t load reservations.</td></tr>';
      });
  }

  if (exportReservationsBtn) {
    exportReservationsBtn.addEventListener("click", function () {
      if (!currentReservations.length) {
        showToast("No reservations to export yet.", "error");
        return;
      }
      function csvField(value) {
        var str = value == null ? "" : String(value);
        return '"' + str.replace(/"/g, '""') + '"';
      }
      var lines = [["No.", "Name", "Email", "Finish", "Date"].map(csvField).join(",")];
      currentReservations.forEach(function (r) {
        lines.push(
          [
            r.seq_number,
            r.name,
            r.email,
            FINISH_LABEL[r.finish] || r.finish,
            r.created_at ? new Date(r.created_at).toISOString() : "",
          ]
            .map(csvField)
            .join(",")
        );
      });
      var blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "tavare-reservations-" + new Date().toISOString().slice(0, 10) + ".csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  /* ---------- Admin tabs ---------- */
  var adminTabs = document.querySelectorAll(".admin-tab");
  var tabPanels = document.querySelectorAll("[data-tab-panel]");

  adminTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var target = tab.getAttribute("data-tab");

      adminTabs.forEach(function (t) {
        var active = t === tab;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", active ? "true" : "false");
      });

      tabPanels.forEach(function (panel) {
        panel.hidden = panel.id !== "tabPanel-" + target;
      });
    });
  });

  checkSession();
})();
