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

  var confirmModal = document.getElementById("confirmModal");
  var confirmBackdrop = document.getElementById("confirmBackdrop");
  var confirmMessage = document.getElementById("confirmMessage");
  var confirmOkBtn = document.getElementById("confirmOk");
  var confirmCancelBtn = document.getElementById("confirmCancel");
  var toasts = document.getElementById("toasts");

  var STATUS_LABEL = { available: "Available", reserved: "Reserved", sold: "Sold / Archived" };
  var BUCKET = "product-images";

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
      if (authenticated) loadProducts();
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
    productRows.innerHTML = '<tr><td colspan="5" class="admin-empty">Loading…</td></tr>';
    supabaseClient
      .from("products")
      .select(PRODUCT_COLUMNS)
      .order("sort_order", { ascending: true })
      .then(function (result) {
        if (result.error) throw result.error;
        var products = result.data;
        currentProducts = products;
        if (!products.length) {
          productRows.innerHTML = '<tr><td colspan="5" class="admin-empty">No pieces yet — add your first one.</td></tr>';
          return;
        }
        productRows.innerHTML = products.map(rowHtml).join("");
        attachRowHandlers();
      })
      .catch(function () {
        productRows.innerHTML = '<tr><td colspan="5" class="admin-empty">Couldn’t load products.</td></tr>';
      });
  }

  function rowHtml(p) {
    var thumb = p.image
      ? '<img class="admin-thumb" src="' + escapeHtml(p.image) + '" alt="">'
      : '<span class="admin-thumb-placeholder">' + (p.category === "art" ? "◆" : "○") + "</span>";

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
      "<td>" + (p.category === "art" ? "Rare Art" : "Jewellery") + "</td>" +
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
        var name = product ? product.name : "this piece";

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
              showToast("Couldn’t delete this piece. Please try again.", "error");
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

    if (id) {
      var product = currentProducts.find(function (p) {
        return p.id === id;
      });
      if (!product) return;
      modalTitle.textContent = "Edit Piece";
      document.getElementById("productId").value = product.id;
      document.getElementById("pName").value = product.name || "";
      document.getElementById("pCategory").value = product.category || "jewellery";
      document.getElementById("pLotNumber").value = product.lotNumber || "";
      document.getElementById("pStatus").value = product.status || "available";
      document.getElementById("pEra").value = product.era || "";
      document.getElementById("pMaterial").value = product.material || "";
      document.getElementById("pDescription").value = product.description || "";
      document.getElementById("pPriceNote").value = product.priceNote || "";
      if (product.image) {
        imagePreview.src = product.image;
        imagePreview.hidden = false;
      }
    } else {
      modalTitle.textContent = "Add a Piece";
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
          era: document.getElementById("pEra").value,
          material: document.getElementById("pMaterial").value,
          description: document.getElementById("pDescription").value,
          price_note: document.getElementById("pPriceNote").value || "Price on request",
          status: document.getElementById("pStatus").value,
        };
        if (imageUrl) record.image = imageUrl;

        if (id) {
          return supabaseClient.from("products").update(record).eq("id", id);
        }
        record.sort_order = Date.now();
        return supabaseClient.from("products").insert([record]);
      })
      .then(function (result) {
        if (result.error) throw result.error;
        closeModal();
        showToast(id ? "Piece updated." : "Piece added.");
        loadProducts();
      })
      .catch(function (err) {
        formError.textContent = (err && err.message) || "Couldn’t save this piece.";
      })
      .finally(function () {
        submitBtn.removeAttribute("disabled");
      });
  });

  checkSession();
})();
