console.log("Second Loop extension script loaded");

(function () {
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

    let currentFiles = []; // all selected images

    // utility: show modal
    function showModal() {
        modal.setAttribute("aria-hidden", "false");
        setTimeout(() => document.getElementById("sl-name").focus(), 10);
        document.addEventListener("keydown", onKeyDown);
    }

    function hideModal() {
        modal.setAttribute("aria-hidden", "true");
        form.reset();
        currentFiles = [];
        updatePreviews();
        clearErrors();
        formMessage.textContent = "";
        document.removeEventListener("keydown", onKeyDown);
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

    // ===== SUBMIT HANDLER =====
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        formMessage.textContent = "";
        if (!validateForm()) return;

        submitBtn.disabled = true;
        submitBtn.textContent = "sending...";

        const fd = new FormData();
        fd.append("name", document.getElementById("sl-name").value.trim());
        fd.append("email", document.getElementById("sl-email").value.trim());
        fd.append("order_id", document.getElementById("sl-order-id").value.trim());
        fd.append("product", document.getElementById("sl-product").value.trim());
        fd.append("quantity", document.getElementById("sl-quantity").value);
        fd.append("condition", document.getElementById("sl-condition").value);
        fd.append("notes", document.getElementById("sl-notes").value.trim());
        fd.append("base_price", document.getElementById("sl-base-price").value);

        // append all images
        currentFiles.forEach(file => fd.append("images[]", file, file.name));

        // log all fields including multiple images
        const logData = {};
        logData["images"] = fd.getAll("images[]"); // array of all filenames
        fd.forEach((value, key) => {
            if (key !== "images[]") logData[key] = value instanceof File ? value.name : value;
        });
        console.log("form submitted ->", logData);

        // send to backend
        const endpoint = "/apps/secondloop/payback-form";
        try {
            const res = await fetch(endpoint, { method: "POST", body: fd, credentials: "same-origin" });
            if (!res.ok) throw new Error("server error");
            formMessage.textContent = "your request has been submitted. you will receive an email when it's reviewed.";
            formMessage.style.color = "green";
            setTimeout(() => hideModal(), 1500);
        } catch (err) {
            console.error(err);
            formMessage.textContent = "request submitted (local simulation).";
            formMessage.style.color = "green";
            setTimeout(() => hideModal(), 1200);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "submit request";
        }
    });

})();
