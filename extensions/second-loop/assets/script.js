// script.js - updated
console.log("Second Loop extension script loaded");

(function () {
    try { console.log("Second Loop extension script executing", window.currentShopifyCustomer && window.currentShopifyCustomer.id); } catch (e) { }

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
    const address = document.getElementById("address");

    // ---------- NEW: product elements ----------
    const productInput = document.getElementById("sl-product");
    const productDatalist = document.getElementById("sl-product-list");
    const suggestionsContainer = document.getElementById("sl-product-suggestions");
    const productIdHidden = document.getElementById("sl-product-id");

    // ---------- state ----------
    let currentFiles = [];
    let allProducts = [];
    let suggestionTimeout = null;
    let productsLoaded = false;
    let selectedProducts = [];

    // ---------- settings state ----------
    let settingsLoaded = false;
    const defaultSettings = {
        mainBg: "#0f172a",
        mainText: "#ffffff",
        btnBg: "#f8fafc",
        btnText: "#0f172a",
        headingBg: "#94a3b8",
        headingText: "#0f172a",
        submitBg: "#10b981",
        submitText: "#ffffff",
        cancelBg: "#ef4444",
        cancelText: "#ffffff"
    };

    /**
     * Fetch settings from backend and apply them to UI.
     * Endpoint: GET /apps/secondloop/setting-color
     */
    async function loadAndApplySettings() {
        if (settingsLoaded) return;
        try {
            const res = await fetch("/apps/secondloop/setting-color", { method: "GET", credentials: "same-origin" });
            if (!res.ok) throw new Error(`Settings fetch failed ${res.status}`);
            const json = await res.json();
            const s = (json && json.success && json.data) ? json.data : (json && json.data) ? json.data : null;

            const settings = Object.assign({}, defaultSettings, s || {});
            applySettings(settings);
            settingsLoaded = true;
            console.log("SecondLoop settings applied", settings);
            address.textContent = settings.address || defaultSettings.address;

        } catch (err) {
            // fallback to defaults (do not break UI)
            console.warn("Could not load settings, using defaults:", err);
            applySettings(defaultSettings);
            settingsLoaded = true; // mark as tried to avoid repeated network spam
        }
    }

    /**
     * Apply setting object to DOM:
     * - set CSS variables on :root
     * - directly style main box, button, modal header, submit & cancel buttons
     */
    function applySettings(settings) {
        try {
            const root = document.documentElement;

            // set css variables (useful for future styling)
            root.style.setProperty('--sl-main-bg', settings.mainBg || defaultSettings.mainBg);
            root.style.setProperty('--sl-main-text', settings.mainText || defaultSettings.mainText);
            root.style.setProperty('--sl-btn-bg', settings.btnBg || defaultSettings.btnBg);
            root.style.setProperty('--sl-btn-text', settings.btnText || defaultSettings.btnText);
            root.style.setProperty('--sl-heading-bg', settings.headingBg || defaultSettings.headingBg);
            root.style.setProperty('--sl-heading-text', settings.headingText || defaultSettings.headingText);
            root.style.setProperty('--sl-submit-bg', settings.submitBg || defaultSettings.submitBg);
            root.style.setProperty('--sl-submit-text', settings.submitText || defaultSettings.submitText);
            root.style.setProperty('--sl-cancel-bg', settings.cancelBg || defaultSettings.cancelBg);
            root.style.setProperty('--sl-cancel-text', settings.cancelText || defaultSettings.cancelText);
            // main box (FIXED — gradient override)
            const mainBox = document.querySelector('.SecondLoop.vip');
            const mainBoxh2 = document.querySelector('#SecondLooph');
            if (mainBox) {

                mainBox.style.setProperty(
                    'background',
                    settings.mainBg || defaultSettings.mainBg,
                    'important'
                );

                mainBox.style.backgroundImage = 'none';

                mainBox.style.setProperty(
                    'color',
                    settings.mainText || defaultSettings.mainText,
                    'important'
                );
                mainBoxh2.style.setProperty(
                    'color',
                    settings.mainText || defaultSettings.mainText,
                    'important'
                );
                mainBoxh2.style.color = settings.mainText || defaultSettings.mainText;
                // remove !important requirement: inline styles take precedence
            }

            // main button inside the box
            const mainButton = document.getElementById('second-loop-button');
            if (mainButton) {
                // apply strong inline styles (overrides Liquid inline if any)
                mainButton.style.setProperty(
                    'background',
                    settings.btnBg,
                    'important'
                );

                mainButton.style.backgroundImage = 'none';

                mainButton.style.color = settings.btnText
                mainButton.style.color = settings.btnText || defaultSettings.btnText;
                // remove !important requirement: inline styles take precedence
            }

            // modal header
            const modalHeader = document.querySelector('.secondloop-modal-header');
            const modalhead = document.querySelector('#sl-modal-title');
            if (modalHeader) {
                modalHeader.style.background = settings.headingBg || defaultSettings.headingBg;
                modalhead.style.color = settings.headingText || defaultSettings.headingText;
            }

            // submit button
            const submitEl = document.getElementById('sl-submit');
            if (submitEl) {
                submitEl.style.background = settings.submitBg || defaultSettings.submitBg;
                submitEl.style.color = settings.submitText || defaultSettings.submitText;
                // if button has class-based styles, inline override ensures color
            }

            // cancel button
            const cancelEl = document.getElementById('sl-cancel');
            if (cancelEl) {
                cancelEl.style.backgroundColor = settings.cancelBg || defaultSettings.cancelBg;
                cancelEl.style.color = settings.cancelText || defaultSettings.cancelText;
            }

            // also attempt to style other matching buttons (in case multiple elements)
            document.querySelectorAll('.vip-btn').forEach(btn => {
                btn.style.backgroundColor = settings.submitBg || defaultSettings.submitBg;
                btn.style.color = settings.submitText || defaultSettings.submitText;
            });
            document.querySelectorAll('.vip-btn-secondary').forEach(btn => {
                btn.style.backgroundColor = settings.cancelBg || defaultSettings.cancelBg;
                btn.style.color = settings.cancelText || defaultSettings.cancelText;
            });
        } catch (err) {
            console.warn("applySettings failed", err);
        }
    }

    // Call immediately to apply settings as soon as possible (won't block UI)
    loadAndApplySettings();

    // ------------------ existing modal logic (unchanged) ------------------

    function showModal() {
        modal.setAttribute("aria-hidden", "false");
        setTimeout(() => {
            const nameEl = document.getElementById("sl-name");
            if (nameEl) nameEl.focus();
        }, 10);
        document.addEventListener("keydown", onKeyDown);

        loadProductsOnce();

        // ensure settings applied before showing modal header (in case initial fetch didn't finish)
        if (!settingsLoaded) {
            loadAndApplySettings();
        }
    }

    function hideModal() {
        modal.setAttribute("aria-hidden", "true");
        form.reset();
        currentFiles = [];
        updatePreviews();
        clearErrors();
        formMessage.textContent = "";
        document.removeEventListener("keydown", onKeyDown);

        if (suggestionsContainer) suggestionsContainer.innerHTML = "";
        if (productIdHidden) productIdHidden.value = "";

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
                selectedProducts = selectedProducts.filter(sp => sp.id !== p.id);
                renderSelectedProducts();
            });
            card.appendChild(removeBtn);

            selectedProductBox.appendChild(card);
        });
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
        const condition = document.getElementById("sl-condition")?.value;

        if (!name) { showError("err-name", "name is required"); ok = false; }
        if (!email) {
            showError("err-email", "email is required"); ok = false;
        } else {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!re.test(email)) { showError("err-email", "enter a valid email"); ok = false; }
        }
        if (!condition) { showError("err-condition", "please select condition"); ok = false; }
        if (currentFiles.length < 3) { showError("err-images", "please upload at least 3 image"); ok = false; }
        if (currentFiles.length > 8) { showError("err-images", "maximum 8 images allowed"); ok = false; }

        if (selectedProducts.length === 0 && !(productIdHidden && productIdHidden.value)) {
            showError("err-product", "please select at least one product");
            ok = false;
        }
        return ok;
    }

    async function getShopifyCustomer() {
        if (window.currentShopifyCustomer) {
            const cidInput = document.getElementById("customer_id_input");
            if (cidInput) cidInput.value = window.currentShopifyCustomer.id;

            const nameEl = document.getElementById("sl-name");
            const emailEl = document.getElementById("sl-email");
            if (nameEl && !nameEl.value.trim() && window.currentShopifyCustomer.name) nameEl.value = window.currentShopifyCustomer.name;
            if (emailEl && !emailEl.value.trim() && window.currentShopifyCustomer.email) emailEl.value = window.currentShopifyCustomer.email;

            return window.currentShopifyCustomer; // 🔥 ADD THIS
        }

        if (typeof Shopify !== 'undefined' && Shopify.customer) {
            console.log('Found customer via Shopify global:', Shopify.customer);
            return Shopify.customer;
        }

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

    if (productInput) {
        productInput.addEventListener("keydown", async (e) => {
            if (e.key === "Enter") {
                e.preventDefault();

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
        // === CHANGED: DO NOT append single product text field here (avoid mismatch)
        fd.append("quantity", (document.getElementById("sl-quantity")?.value || ""));
        fd.append("condition", (document.getElementById("sl-condition")?.value || ""));
        fd.append("notes", (document.getElementById("sl-notes")?.value || "").trim());

        // ✅ CUSTOMER ID ADD KARO
        if (customerId) {
            fd.append("customer_id", customerId);
        }

        if (selectedProducts.length > 0) {
            selectedProducts.forEach(p => {
                fd.append("product_id", p.id);
                fd.append("product", p.title || "");
            });
        } else if (productIdHidden && productIdHidden.value) {
            fd.append("product_id", productIdHidden.value);
            const typed = (productInput?.value || "").trim();
            fd.append("product", typed || "");
        }

        currentFiles.forEach(file => fd.append("images", file, file.name));

        const hasBox = hasBoxCheckbox && hasBoxCheckbox.checked;
        fd.append("has_box", hasBox ? "true" : "false");

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
