
console.log("Second Loop extension script loaded");

(function () {
    console.log("Second Loop extension script executing", window.currentShopifyCustomer.id);
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

    function showModal() {
        modal.setAttribute("aria-hidden", "false");
        setTimeout(() => document.getElementById("sl-name").focus(), 10);
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
        previews.innerHTML = "";
    }

    function updatePreviews() {
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
        const name = document.getElementById("sl-name").value.trim();
        const email = document.getElementById("sl-email").value.trim();
        const product = document.getElementById("sl-product").value.trim();
        const condition = document.getElementById("sl-condition").value;

        if (!name) { showError("err-name", "name is required"); ok = false; }
        if (!email) {
            showError("err-email", "email is required"); ok = false;
        } else {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!re.test(email)) { showError("err-email", "enter a valid email"); ok = false; }
        }
        if (!product) { showError("err-product", "product name is required"); ok = false; }
        if (!condition) { showError("err-condition", "please select condition"); ok = false; }
        if (currentFiles.length < 3) { showError("err-images", "please upload at least 3 image"); ok = false; }
        if (currentFiles.length > 8) { showError("err-images", "maximum 8 images allowed"); ok = false; }

        return ok;
    }

    // Customer get karne ka function - SIMPLIFIED
    async function getShopifyCustomer() {
        // Method 1: Liquid se (Sabse reliable)
        if (window.currentShopifyCustomer) {
            document.getElementById("customer_id_input").value =
                window.currentShopifyCustomer.id;

            // document.getElementById("sl-name").value =
            //     window.currentShopifyCustomer.name || "";

            // document.getElementById("sl-email").value =
            //     window.currentShopifyCustomer.email || "";

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

                // Auto-fill name and email if empty
                const nameField = document.getElementById('sl-name');
                const emailField = document.getElementById('sl-email');

                if (nameField && !nameField.value.trim() && customer.name) {
                    nameField.value = customer.name;
                }
                if (emailField && !emailField.value.trim() && customer.email) {
                    emailField.value = customer.email;
                }
            }
        } catch (err) {
            console.log('Customer fetch skipped:', err);
        }

        // 2. FORM DATA BANAO (customer_id ke saath)
        const fd = new FormData();
        fd.append("name", document.getElementById("sl-name").value.trim());
        fd.append("email", document.getElementById("sl-email").value.trim());
        fd.append("order_id", document.getElementById("sl-order-id").value.trim());
        fd.append("product", document.getElementById("sl-product").value.trim());
        fd.append("quantity", document.getElementById("sl-quantity").value);
        fd.append("condition", document.getElementById("sl-condition").value);
        fd.append("notes", document.getElementById("sl-notes").value.trim());
        // fd.append("base_price", document.getElementById("sl-base-price").value);

        // ✅ CUSTOMER ID ADD KARO
        if (customerId) {
            fd.append("customer_id", customerId);
        }

        // append product_id hidden
        if (productIdHidden && productIdHidden.value) {
            fd.append("product_id", productIdHidden.value);
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
            // card.className = "sl-suggestion-card";
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
        productInput.value = product.title || product.handle || "";
        if (productIdHidden) productIdHidden.value = product.id || "";

        // hide suggestions
        if (suggestionsContainer) {
            suggestionsContainer.innerHTML = "";
            suggestionsContainer.style.display = "none";
        }

        // show selected card permanently
        if (!selectedProductBox) return;

        selectedProductBox.innerHTML = "";

        const card = document.createElement("div");
        card.className = "sl-selected-card";

        const img = document.createElement("img");
        const imgNode = product.images && product.images.nodes && product.images.nodes[0];
        img.src = (imgNode && imgNode.url) ? imgNode.url : "";

        const info = document.createElement("div");
        info.className = "sl-selected-info";

        const title = document.createElement("div");
        title.textContent = product.title || "";

        const vendor = document.createElement("small");
        vendor.textContent = product.vendor || "";

        info.appendChild(title);
        info.appendChild(vendor);

        // create remove button (cross)
        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "sl-remove-product";
        removeBtn.title = "Remove selected product";
        removeBtn.innerHTML = "&times;"; // ×
        removeBtn.addEventListener("click", () => {
            // clear UI
            selectedProductBox.innerHTML = "";
            // clear input + hidden id
            productInput.value = "";
            if (productIdHidden) productIdHidden.value = "";
            // optional: re-focus to product input
            productInput.focus();
        });


        card.appendChild(img);
        card.appendChild(info);
        card.appendChild(removeBtn);

        selectedProductBox.appendChild(card);
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

                // if user typed something and no productId set -> create a local id
                const title = (productInput.value || "").trim();
                if (title && productIdHidden && !productIdHidden.value) {
                    // generate a local id and show mini selected card
                    const localId = generateLocalProductId(title);
                    productIdHidden.value = localId;

                    // show selected box similar to selectProduct but for a local product
                    selectedProductBox.innerHTML = "";

                    const card = document.createElement("div");
                    card.className = "sl-selected-card";

                    const placeholder = document.createElement("div");
                    placeholder.className = "sl-selected-placeholder";
                    placeholder.textContent = title[0]?.toUpperCase() || "P";
                    placeholder.style.width = "48px";
                    placeholder.style.height = "48px";
                    placeholder.style.display = "flex";
                    placeholder.style.alignItems = "center";
                    placeholder.style.justifyContent = "center";
                    placeholder.style.borderRadius = "6px";
                    placeholder.style.background = "#f4f4f4";
                    placeholder.style.fontWeight = "600";

                    const info = document.createElement("div");
                    info.className = "sl-selected-info";
                    const titleEl = document.createElement("div");
                    titleEl.textContent = title;
                    const tag = document.createElement("small");
                    tag.textContent = "Local product (not in Shopify)";
                    tag.className = "muted";

                    info.appendChild(titleEl);
                    info.appendChild(tag);

                    // remove button
                    const removeBtn = document.createElement("button");
                    removeBtn.type = "button";
                    removeBtn.className = "sl-remove-product";
                    removeBtn.title = "Remove selected product";
                    removeBtn.innerHTML = "&times;";
                    removeBtn.addEventListener("click", () => {
                        selectedProductBox.innerHTML = "";
                        productInput.value = "";
                        productIdHidden.value = "";
                        productInput.focus();
                    });

                    card.appendChild(placeholder);
                    card.appendChild(info);
                    card.appendChild(removeBtn);

                    selectedProductBox.appendChild(card);
                }
            }, 200);
        });

    }

})();
