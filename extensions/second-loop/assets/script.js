console.log("Second Loop extension script loaded");

(function () {
    // safe guard: if Liquid didn't inject currentShopifyCustomer, access may fail in console.log
    try { console.log("Second Loop extension script executing", window.currentShopifyCustomer && window.currentShopifyCustomer.id); } catch (e) {}

    const openBtn = document.getElementById("second-loop-button");
    const modal = document.getElementById("second-loop-modal");
    const closeBtn = document.getElementById("second-loop-close");
    const overlay = document.querySelector(".secondloop-modal-overlay");
    const cancelBtn = document.getElementById("sl-cancel");
    const form = document.getElementById("second-loop-form");
    const submitBtn = document.getElementById("sl-submit");
    const imageInput = document.getElementById("sl-images");
    const previews = document.getElementById("sl-image-previews");
    const formMessage = document.getElementById("sl-form-message");
    const selectedProductBox = document.getElementById("sl-selected-product");
    const hasBoxCheckbox = document.getElementById("sl-has-box");

    // ---------- NEW: product elements ----------
    const productInput = document.getElementById("sl-product");
    const productDatalist = document.getElementById("sl-product-list");
    const suggestionsContainer = document.getElementById("sl-product-suggestions");
    const productIdHidden = document.getElementById("sl-product-id");

    // ---------- state ----------
    let currentFiles = []; // all selected images
    let allProducts = []; // will hold products from backend
    let suggestionTimeout = null;
    let productsLoaded = false;
    let selectedProducts = [];

    function showModal() {
        modal.setAttribute("aria-hidden", "false");
        setTimeout(() => {
            const nameEl = document.getElementById("sl-name");
            if (nameEl) nameEl.focus();
        }, 10);
        document.addEventListener("keydown", onKeyDown);

        // 🔥 load products when modal opens
        loadProductsOnce();
    }

    function hideModal() {
        modal.setAttribute("aria-hidden", "true");
        form.reset();
        currentFiles = [];
        updatePreviews();
        clearErrors();
        formMessage.textContent = "";
        document.removeEventListener("keydown", onKeyDown);

        // clear product suggestions and hidden id on close
        if (suggestionsContainer) suggestionsContainer.innerHTML = "";
        if (productIdHidden) productIdHidden.value = "";

        // clear selected products UI & state (optional: keep if you want)
        selectedProducts = [];
        renderSelectedProducts();
    }

    function onKeyDown(e) {
        if (e.key === "Escape") hideModal();
    }

    openBtn && openBtn.addEventListener("click", showModal);
    closeBtn && closeBtn.addEventListener("click", hideModal);
    overlay && overlay.addEventListener("click", hideModal);
    cancelBtn && cancelBtn.addEventListener("click", hideModal);

    // ===== IMAGE PREVIEWS =====
    function clearPreviews() {
        if (!previews) return;
        previews.innerHTML = "";
    }

    function updatePreviews() {
        if (!previews) return;
        clearPreviews();
        currentFiles.forEach((file, idx) => {
            const reader = new FileReader();
            const thumb = document.createElement("div");
            thumb.className = "sl-thumb";

            const removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.textContent = "×";
            removeBtn.title = "remove";
            removeBtn.addEventListener("click", () => removeFileAtIndex(idx));
            thumb.appendChild(removeBtn);

            const img = document.createElement("img");
            reader.onload = (ev) => img.src = ev.target.result;
            reader.readAsDataURL(file);
            thumb.appendChild(img);

            previews.appendChild(thumb);
        });

        // rebuild input.files for submission
        const dt = new DataTransfer();
        currentFiles.forEach(f => dt.items.add(f));
        imageInput.files = dt.files;
    }

    function renderSelectedProducts() {
        if (!selectedProductBox) return;
        selectedProductBox.innerHTML = "";

        selectedProducts.forEach(p => {
            const card = document.createElement("div");
            card.className = "sl-selected-card multi";

            // thumbnail (image or placeholder)
            const thumb = document.createElement("div");
            thumb.className = "sl-selected-thumb";
            if (p.imageUrl) {
                const img = document.createElement("img");
                img.src = p.imageUrl;
                img.alt = p.title || "";
                thumb.appendChild(img);
            } else {
                const placeholder = document.createElement("div");
                placeholder.className = "sl-selected-placeholder";
                placeholder.textContent = (p.title || "P")[0].toUpperCase();
                thumb.appendChild(placeholder);
            }
            card.appendChild(thumb);

            // info
            const info = document.createElement("div");
            info.className = "sl-selected-info";
            const title = document.createElement("div");
            title.textContent = p.title || "";
            const vendor = document.createElement("small");
            vendor.textContent = p.vendor || "";
            info.appendChild(title);
            info.appendChild(vendor);
            card.appendChild(info);

            // remove button
            const removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.className = "sl-remove-product";
            removeBtn.title = "Remove";
            removeBtn.innerHTML = "&times;";
            removeBtn.addEventListener("click", () => {
                // remove from selectedProducts by id
                selectedProducts = selectedProducts.filter(sp => sp.id !== p.id);
                renderSelectedProducts();
            });
            card.appendChild(removeBtn);

            selectedProductBox.appendChild(card);
        });

        // Update native hidden input if you still want single-value fallback (optional)
        // You can keep the original single hidden input untouched; we will send multiple IDs on submit.
    }


    function removeFileAtIndex(index) {
        currentFiles.splice(index, 1);
        updatePreviews();
    }

    imageInput.addEventListener("change", (e) => {
        const files = Array.from(e.target.files || []);
        files.forEach(f => {
            // avoid duplicates by name+size
            if (!currentFiles.some(cf => cf.name === f.name && cf.size === f.size)) {
                currentFiles.push(f);
            }
        });
        if (currentFiles.length > 8) currentFiles = currentFiles.slice(0, 8);
        updatePreviews();
    });

    // generate a stable-ish unique id for local product
    function generateLocalProductId(title) {
        const slug = (title || "product").toString().trim().toLowerCase()
            .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        const rand = Math.random().toString(36).slice(2, 8);
        return `local-${Date.now()}-${rand}-${slug}`.slice(0, 120); // limit length
    }

    // ===== VALIDATION =====
    function clearErrors() {
        ["err-name", "err-email", "err-product", "err-condition", "err-images"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = "";
        });
    }

    function showError(id, msg) {
        const el = document.getElementById(id);
        if (el) el.textContent = msg;
    }

    function validateForm() {
        clearErrors();
        let ok = true;
        const name = (document.getElementById("sl-name")?.value || "").trim();
        const email = (document.getElementById("sl-email")?.value || "").trim();
        // const product = (document.getElementById("sl-product")?.value || "").trim();
        const condition = document.getElementById("sl-condition")?.value;

        if (!name) { showError("err-name", "name is required"); ok = false; }
        if (!email) {
            showError("err-email", "email is required"); ok = false;
        } else {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!re.test(email)) { showError("err-email", "enter a valid email"); ok = false; }
        }
        // product field itself is optional because we allow selectedProducts
        if (!condition) { showError("err-condition", "please select condition"); ok = false; }
        if (currentFiles.length < 3) { showError("err-images", "please upload at least 3 image"); ok = false; }
        if (currentFiles.length > 8) { showError("err-images", "maximum 8 images allowed"); ok = false; }

        // require at least one selected product
        if (selectedProducts.length === 0 && !(productIdHidden && productIdHidden.value)) {
            showError("err-product", "please select at least one product");
            ok = false;
        }

        return ok;
    }

    // Customer get karne ka function - SIMPLIFIED
    async function getShopifyCustomer() {
        // Method 1: Liquid se (Sabse reliable)
        if (window.currentShopifyCustomer) {
            const cidInput = document.getElementById("customer_id_input");
            if (cidInput) cidInput.value = window.currentShopifyCustomer.id;

            // Auto-fill name/email only if empty
            const nameEl = document.getElementById("sl-name");
            const emailEl = document.getElementById("sl-email");
            if (nameEl && !nameEl.value.trim() && window.currentShopifyCustomer.name) nameEl.value = window.currentShopifyCustomer.name;
            if (emailEl && !emailEl.value.trim() && window.currentShopifyCustomer.email) emailEl.value = window.currentShopifyCustomer.email;

            return window.currentShopifyCustomer; // 🔥 ADD THIS
        }

        // Method 2: Shopify global object
        if (typeof Shopify !== 'undefined' && Shopify.customer) {
            console.log('Found customer via Shopify global:', Shopify.customer);
            return Shopify.customer;
        }

        // Method 3: Check account page (fallback)
        try {
            const response = await fetch('/account', {
                method: 'GET',
                credentials: 'same-origin'
            });
            if (response.ok) {
                console.log('Customer is logged in (account page accessible)');
                return { loggedIn: true };
            }
        } catch (error) {
            // Ignore error
        }

        console.log('No customer found - guest user');
        return null;
    }

    // === NEW HELPERS (for Enter key & adding local product) ===
    function addLocalProductFromInput() {
        if (!productInput) return;
        const title = (productInput.value || "").trim();
        if (!title) return;

        // generate id & avoid duplicates by title or id
        const localId = generateLocalProductId(title);
        const already = selectedProducts.some(sp => sp.id === localId || (sp.title || "").toLowerCase() === title.toLowerCase());
        if (already) {
            productInput.value = "";
            return;
        }

        selectedProducts.push({
            id: localId,
            title,
            vendor: "Local product (not in Shopify)",
            imageUrl: null,
            local: true
        });

        renderSelectedProducts();
        productInput.value = "";
        if (productIdHidden) productIdHidden.value = ""; // don't set single hidden for multi-select
    }

    // handle Enter key: select typed product immediately
    if (productInput) {
        productInput.addEventListener("keydown", async (e) => {
            // if suggestions are visible and arrow/enter handling might be different,
            // we keep it simple: Enter selects typed value as local product (unless matched to a real product)
            if (e.key === "Enter") {
                e.preventDefault();

                // try to match exact product title first (case-insensitive)
                await loadProductsOnce();
                const typed = (productInput.value || "").trim();
                if (!typed) return;

                const match = allProducts.find(p => (p.title || "").toLowerCase() === typed.toLowerCase());
                if (match) {
                    // if exact shopify product match, select it (same as click)
                    selectProduct(match);
                    productInput.value = "";
                    return;
                }

                // otherwise add as local product
                addLocalProductFromInput();
            }
        });
    }

    // ===== SUBMIT HANDLER =====
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        formMessage.textContent = "";
        if (!validateForm()) return;

        submitBtn.disabled = true;
        submitBtn.textContent = "sending...";

        // 1. PEHLE CUSTOMER GET KARO
        let customerId = '';
        try {
            const customer = await getShopifyCustomer();
            if (customer && customer.id) {
                customerId = customer.id;
            }
        } catch (err) {
            console.log('Customer fetch skipped:', err);
        }

        // 2. FORM DATA BANAO (customer_id ke saath)
        const fd = new FormData();
        fd.append("name", (document.getElementById("sl-name")?.value || "").trim());
        fd.append("email", (document.getElementById("sl-email")?.value || "").trim());
        fd.append("order_id", (document.getElementById("sl-order-id")?.value || "").trim());
        // === CHANGED: DO NOT append single product text field here (avoid mismatch)
        // fd.append("product", document.getElementById("sl-product").value.trim());
        fd.append("quantity", (document.getElementById("sl-quantity")?.value || ""));
        fd.append("condition", (document.getElementById("sl-condition")?.value || ""));
        fd.append("notes", (document.getElementById("sl-notes")?.value || "").trim());
        // fd.append("base_price", document.getElementById("sl-base-price").value);

        // ✅ CUSTOMER ID ADD KARO
        if (customerId) {
            fd.append("customer_id", customerId);
        }

        // append product_id and product name for each selected product so backend receives matching arrays
        if (selectedProducts.length > 0) {
            selectedProducts.forEach(p => {
                fd.append("product_id", p.id);
                fd.append("product", p.title || "");
                // optionally append per-product quantity if UI supports it in future:
                // fd.append("quantity", p.quantity != null ? String(p.quantity) : "");
            });
        } else if (productIdHidden && productIdHidden.value) {
            // fallback for legacy single selection (datalist/native)
            fd.append("product_id", productIdHidden.value);
            // append product name from input (if any)
            const typed = (productInput?.value || "").trim();
            fd.append("product", typed || "");
        }

        // append all images
        currentFiles.forEach(file => fd.append("images", file, file.name));

        // append has_box boolean
        const hasBox = hasBoxCheckbox && hasBoxCheckbox.checked;
        fd.append("has_box", hasBox ? "true" : "false");

        // 3. BACKEND KO SEND KARO
        const endpoint = "/apps/secondloop/payback-form";
        try {
            const res = await fetch(endpoint, {
                method: "POST",
                body: fd,
                credentials: "same-origin"
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Server error: ${res.status} - ${errorText}`);
            }

            const result = await res.json();
            formMessage.textContent = result.message || "Your request has been submitted.";
            formMessage.style.color = "green";

            setTimeout(() => hideModal(), 1500);
        } catch (err) {
            console.error("Submit error:", err);
            formMessage.textContent = "Error submitting form. Please try again.";
            formMessage.style.color = "red";
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "submit request";
        }
    });

    async function loadProductsOnce() {
        if (productsLoaded) return;
        try {
            const res = await fetch(`/apps/secondloop/products?shop=${Shopify.shop}`, { credentials: "same-origin" });
            if (!res.ok) throw new Error("failed to load products");
            const json = await res.json();
            // accept both array or object with products prop
            allProducts = Array.isArray(json) ? json : (json.products || []);
            productsLoaded = true;
            populateDatalist(allProducts);
        } catch (err) {
            console.warn("Could not load products:", err);
            allProducts = [];
            productsLoaded = true; // avoid retry spam
        }
    }

    function populateDatalist(products) {
        if (!productDatalist) return;
        productDatalist.innerHTML = "";
        products.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p.title || p.handle || "";
            productDatalist.appendChild(opt);
        });
    }

    // filter products by query
    function filterProducts(query) {
        if (!query) return [];
        const q = query.trim().toLowerCase();
        return allProducts.filter(p => {
            const title = (p.title || "").toLowerCase();
            const handle = (p.handle || "").toLowerCase();
            const vendor = (p.vendor || "").toLowerCase();
            return title.includes(q) || handle.includes(q) || vendor.includes(q);
        });
    }

    // render suggestion cards
    function renderSuggestions(matches) {
        if (!suggestionsContainer) return;
        suggestionsContainer.innerHTML = "";
        if (!matches || matches.length === 0) {
            suggestionsContainer.style.display = "none";
            return;
        }
        suggestionsContainer.style.display = "block";

        matches.slice(0, 6).forEach(p => {
            const card = document.createElement("div");
            card.className = "sl-product-card";

            const thumb = document.createElement("div");
            thumb.className = "sl-suggestion-thumb";
            const img = document.createElement("img");
            const imgNode = p.images && p.images.nodes && p.images.nodes[0];
            img.src = (imgNode && imgNode.url) ? imgNode.url : "";
            img.alt = (imgNode && imgNode.altText) ? imgNode.altText : (p.title || "");
            thumb.appendChild(img);
            card.appendChild(thumb);

            const meta = document.createElement("div");
            meta.className = "sl-suggestion-meta";
            const titleEl = document.createElement("div");
            titleEl.className = "sl-suggestion-title";
            titleEl.textContent = p.title || p.handle || "Untitled";
            const vendorEl = document.createElement("div");
            vendorEl.className = "sl-suggestion-vendor";
            vendorEl.textContent = p.vendor || "";
            const handleEl = document.createElement("div");
            handleEl.className = "sl-suggestion-handle";
            handleEl.textContent = p.handle || "";
            meta.appendChild(titleEl);
            meta.appendChild(vendorEl);
            meta.appendChild(handleEl);
            card.appendChild(meta);

            card.addEventListener("click", () => {
                selectProduct(p);
            });

            suggestionsContainer.appendChild(card);
        });
    }

    // when user selects a product card
    function selectProduct(product) {
        // Prevent duplicates (by id or generated local id)
        const id = product.id || product.handle || generateLocalProductId(product.title);
        if (selectedProducts.some(p => p.id === id)) {
            // already selected — focus or flash
            productInput.focus();
            return;
        }

        // push to selectedProducts
        selectedProducts.push({
            id,
            title: product.title || product.handle || "",
            vendor: product.vendor || "",
            imageUrl: (product.images && product.images.nodes && product.images.nodes[0] && product.images.nodes[0].url) || ""
        });

        // clear suggestions and input UI
        if (suggestionsContainer) {
            suggestionsContainer.innerHTML = "";
            suggestionsContainer.style.display = "none";
        }
        productInput.value = "";

        // re-render all selected products (multiple)
        renderSelectedProducts();
    }

    // try to auto-select product_id if exact title match (for datalist native selection)
    function tryAutoSelectByTitle(title) {
        if (!title) return;
        const match = allProducts.find(p => (p.title || "").toLowerCase() === title.toLowerCase());
        if (match && productIdHidden) productIdHidden.value = match.id || "";
    }

    // wire input events
    if (productInput) {
        productInput.addEventListener("focus", async () => {
            await loadProductsOnce();
            // show top suggestions on focus
            renderSuggestions(allProducts.slice(0, 6));
        });
        productInput.addEventListener("input", async (e) => {
            const q = e.target.value;

            // 🔥 ALWAYS ensure products loaded first
            await loadProductsOnce();

            if (productIdHidden) productIdHidden.value = "";

            const matches = filterProducts(q);

            renderSuggestions(matches);
            populateDatalist(matches.slice(0, 30));
            tryAutoSelectByTitle(q);
        });

        productInput.addEventListener("blur", () => {
            setTimeout(() => {
                if (suggestionsContainer) {
                    suggestionsContainer.innerHTML = "";
                    suggestionsContainer.style.display = "none";
                }

                const title = (productInput.value || "").trim();
                if (title) {
                    // create local product only if it isn't already present
                    const localId = generateLocalProductId(title);
                    const exists = selectedProducts.some(p => (p.id === localId) || ((p.title || "").toLowerCase() === title.toLowerCase()));
                    if (!exists) {
                        selectedProducts.push({
                            id: localId,
                            title,
                            vendor: "Local product (not in Shopify)",
                            imageUrl: null,
                            local: true
                        });
                        renderSelectedProducts();
                    }
                    // clear input (optional)
                    productInput.value = "";
                }
            }, 200);
        });

    }

})();
