import React, { useState, useEffect } from 'react';
import './Settings.css';

export default function Settings({ initial = {}, onSave, apiBase = '/api/setting-color' }) {
    // sensible defaults if not provided
    const defaults = {
        mainTitle: initial.mainTitle || "Trade In with STORE NAME!",
        mainSubTitle: initial.mainSubTitle || "Submit Trade-In Requests Quickly & Easily.",
        mainBg: initial.mainBg || '#0f172a',
        mainText: initial.mainText || '#ffffff',
        btnText: initial.btnText || '#0f172a',
        btnBg: initial.btnBg || '#f8fafc',
        headingBg: initial.headingBg || '#94a3b8',
        headingText: initial.headingText || '#0f172a',
        submitBg: initial.submitBg || '#10b981',
        submitText: initial.submitText || '#ffffff',
        cancelBg: initial.cancelBg || '#ef4444',
        cancelText: initial.cancelText || '#ffffff',
        address: initial.address || "55 East 10th Street, New York, NY 10003, United States"
    };

    const [mainTitle, setMainTitle] = useState(defaults.mainTitle);
    const [mainSubTitle, setMainSubTitle] = useState(defaults.mainSubTitle);
    const [mainBg, setMainBg] = useState(defaults.mainBg);
    const [mainText, setMainText] = useState(defaults.mainText);
    const [btnText, setBtnText] = useState(defaults.btnText);
    const [btnBg, setBtnBg] = useState(defaults.btnBg);

    const [headingBg, setHeadingBg] = useState(defaults.headingBg);
    const [headingText, setHeadingText] = useState(defaults.headingText);

    const [submitBg, setSubmitBg] = useState(defaults.submitBg);
    const [submitText, setSubmitText] = useState(defaults.submitText);
    const [cancelBg, setCancelBg] = useState(defaults.cancelBg);
    const [cancelText, setCancelText] = useState(defaults.cancelText);
    const [address, setAddress] = useState(defaults.address);

    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // remove saved indicator after 2s
        if (saved) {
            const t = setTimeout(() => setSaved(false), 2000);
            return () => clearTimeout(t);
        }
    }, [saved]);

    // fetch current settings from backend on mount
    useEffect(() => {
        let mounted = true;

        async function fetchSettings() {
            setLoading(true);
            try {
                const res = await fetch(apiBase, { method: 'GET' });
                const json = await res.json();
                if (!mounted) return;

                if (json && json.success && json.data) {
                    const d = json.data;
                    // update individual states (fallback to defaults if missing)
                    setMainTitle(d.mainTitle ?? defaults.mainTitle);
                    setMainSubTitle(d.mainSubTitle ?? defaults.mainSubTitle);
                    setMainBg(d.mainBg ?? defaults.mainBg);
                    setMainText(d.mainText ?? defaults.mainText);
                    setBtnText(d.btnText ?? defaults.btnText);
                    setBtnBg(d.btnBg ?? defaults.btnBg);
                    setHeadingBg(d.headingBg ?? defaults.headingBg);
                    setHeadingText(d.headingText ?? defaults.headingText);
                    setSubmitBg(d.submitBg ?? defaults.submitBg);
                    setSubmitText(d.submitText ?? defaults.submitText);
                    setCancelBg(d.cancelBg ?? defaults.cancelBg);
                    setCancelText(d.cancelText ?? defaults.cancelText);
                    setAddress(d.address ?? defaults.address);
                } else {
                    // if backend didn't return data, ensure UI uses defaults
                    setMainTitle(defaults.mainTitle);
                    setMainSubTitle(defaults.mainSubTitle);
                    setMainBg(defaults.mainBg);
                    setMainText(defaults.mainText);
                    setBtnText(defaults.btnText);
                    setBtnBg(defaults.btnBg);
                    setHeadingBg(defaults.headingBg);
                    setHeadingText(defaults.headingText);
                    setSubmitBg(defaults.submitBg);
                    setSubmitText(defaults.submitText);
                    setCancelBg(defaults.cancelBg);
                    setCancelText(defaults.cancelText);
                    setAddress(defaults.address);
                }
            } catch (err) {
                console.error('Failed to fetch settings:', err);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        fetchSettings();
        return () => { mounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // run once

    const handleSave = async () => {
        const payload = {
            mainTitle,
            mainSubTitle,
            mainBg,
            mainText,
            btnText,
            btnBg,
            headingBg,
            headingText,
            submitBg,
            submitText,
            cancelBg,
            cancelText,
            address
        };

        // call parent callback if provided (optional, local-only)
        if (typeof onSave === 'function') onSave(payload);

        // save to backend
        setSaving(true);
        try {
            const res = await fetch(apiBase, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const json = await res.json();
            if (json && json.success && json.data) {
                const d = json.data;
                // update states from returned data (ensures saved canonical values)
                setMainTitle(d.mainTitle ?? payload.mainTitle);
                setMainSubTitle(d.mainSubTitle ?? payload.mainSubTitle);
                setMainBg(d.mainBg ?? payload.mainBg);
                setMainText(d.mainText ?? payload.mainText);
                setBtnText(d.btnText ?? payload.btnText);
                setBtnBg(d.btnBg ?? payload.btnBg);
                setHeadingBg(d.headingBg ?? payload.headingBg);
                setHeadingText(d.headingText ?? payload.headingText);
                setSubmitBg(d.submitBg ?? payload.submitBg);
                setSubmitText(d.submitText ?? payload.submitText);
                setCancelBg(d.cancelBg ?? payload.cancelBg);
                setCancelText(d.cancelText ?? payload.cancelText);
                setAddress(d.address ?? payload.address);
                setSaved(true);
            } else {
                console.error('Save failed:', json);
            }
        } catch (err) {
            console.error('Error saving settings:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        // update UI to defaults first (instant feedback)
        setMainTitle(defaults.mainTitle);
        setMainSubTitle(defaults.mainSubTitle);
        setMainBg(defaults.mainBg);
        setMainText(defaults.mainText);
        setBtnText(defaults.btnText);
        setBtnBg(defaults.btnBg);
        setHeadingBg(defaults.headingBg);
        setHeadingText(defaults.headingText);
        setSubmitBg(defaults.submitBg);
        setSubmitText(defaults.submitText);
        setCancelBg(defaults.cancelBg);
        setCancelText(defaults.cancelText);
        setAddress(defaults.address);

        // persist defaults to backend (PUT)
        setSaving(true);
        try {
            const res = await fetch(apiBase, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(defaults)
            });
            const json = await res.json();
            if (json && json.success && json.data) {
                setSaved(true);
                // in case backend returns slightly different values, sync them
                const d = json.data;
                setMainTitle(d.mainTitle ?? defaults.mainTitle);
                setMainSubTitle(d.mainSubTitle ?? defaults.mainSubTitle);
                setMainBg(d.mainBg ?? defaults.mainBg);
                setMainText(d.mainText ?? defaults.mainText);
                setBtnText(d.btnText ?? defaults.btnText);
                setBtnBg(d.btnBg ?? defaults.btnBg);
                setHeadingBg(d.headingBg ?? defaults.headingBg);
                setHeadingText(d.headingText ?? defaults.headingText);
                setSubmitBg(d.submitBg ?? defaults.submitBg);
                setSubmitText(d.submitText ?? defaults.submitText);
                setCancelBg(d.cancelBg ?? defaults.cancelBg);
                setCancelText(d.cancelText ?? defaults.cancelText);
                setAddress(d.address ?? defaults.address);
            } else {
                console.error('Reset failed:', json);
            }
        } catch (err) {
            console.error('Error resetting settings:', err);
        } finally {
            setSaving(false);
        }
    };

    // If loading, show minimal message but keep UI structure intact
    if (loading) {
        return (
            <div className="sl-settings-root">
                <div className="sl-settings-grid">
                    <section className="sl-card sl-controls">
                        <header className="sl-card-header">
                            <h1>Second Loop — Visual Settings</h1>
                            <p className="muted">Loading settings…</p>
                        </header>
                    </section>
                </div>
            </div>
        );
    }

    return (
        <div className="sl-settings-root">
            <div className="sl-settings-grid">
                <section className="sl-card sl-controls">
                    <header className="sl-card-header">
                        <h1>Second Loop — Visual Settings</h1>
                        <p className="muted">Customize the look & feel. Live preview updates instantly.</p>
                    </header>

                    <div className="sl-<strong> sect <strong>ion">
                        <h2 style={{ marginTop: "10px", marginBottom: "20px" }}><strong> Main </strong></h2>

                        {/* NEW: Main Title & SubTitle */}
                        <div className="sl-row">
                            <label className="sl-text-input-field">
                                <span>Main Title</span>
                                <input
                                    type="text"
                                    value={mainTitle}
                                    onChange={(e) => setMainTitle(e.target.value)}
                                    placeholder="Enter main title..."
                                />
                            </label>

                            <label className="sl-text-input-field">
                                <span>Main SubTitle</span>
                                <input
                                    type="text"
                                    value={mainSubTitle}
                                    onChange={(e) => setMainSubTitle(e.target.value)}
                                    placeholder="Enter main subtitle..."
                                />
                            </label>
                        </div>
                        <div className="sl-row">
                            <label className="sl-color-field">
                                <span>Box Background</span>
                                <input type="color" value={mainBg} onChange={(e) => setMainBg(e.target.value)} />
                                <input className="hex-input" value={mainBg} onChange={(e) => setMainBg(e.target.value)} />
                            </label>

                            <label className="sl-color-field">
                                <span>Box Text Color</span>
                                <input type="color" value={mainText} onChange={(e) => setMainText(e.target.value)} />
                                <input className="hex-input" value={mainText} onChange={(e) => setMainText(e.target.value)} />
                            </label>
                        </div>

                        <div className="sl-row">
                            <label className="sl-color-field">
                                <span>Button Text Color</span>
                                <input type="color" value={btnText} onChange={(e) => setBtnText(e.target.value)} />
                                <input className="hex-input" value={btnText} onChange={(e) => setBtnText(e.target.value)} />
                            </label>

                            <label className="sl-color-field">
                                <span>Button Background</span>
                                <input type="color" value={btnBg} onChange={(e) => setBtnBg(e.target.value)} />
                                <input className="hex-input" value={btnBg} onChange={(e) => setBtnBg(e.target.value)} />
                            </label>
                        </div>
                    </div>

                    <div className="sl-section">
                        <h2><strong> Form Color </strong></h2>

                        <div className="sl-row">
                            <label className="sl-color-field">
                                <span>Heading Background</span>
                                <input type="color" value={headingBg} onChange={(e) => setHeadingBg(e.target.value)} />
                                <input className="hex-input" value={headingBg} onChange={(e) => setHeadingBg(e.target.value)} />
                            </label>

                            <label className="sl-color-field">
                                <span>Heading Text Color</span>
                                <input type="color" value={headingText} onChange={(e) => setHeadingText(e.target.value)} />
                                <input className="hex-input" value={headingText} onChange={(e) => setHeadingText(e.target.value)} />
                            </label>
                        </div>

                        <div className="sl-row">
                            <label className="sl-color-field">
                                <span>Form Submit — BG</span>
                                <input type="color" value={submitBg} onChange={(e) => setSubmitBg(e.target.value)} />
                                <input className="hex-input" value={submitBg} onChange={(e) => setSubmitBg(e.target.value)} />
                            </label>

                            <label className="sl-color-field">
                                <span>Form Submit — Text</span>
                                <input type="color" value={submitText} onChange={(e) => setSubmitText(e.target.value)} />
                                <input className="hex-input" value={submitText} onChange={(e) => setSubmitText(e.target.value)} />
                            </label>
                        </div>

                        <div className="sl-row">
                            <label className="sl-color-field">
                                <span>Form Cancel — BG</span>
                                <input type="color" value={cancelBg} onChange={(e) => setCancelBg(e.target.value)} />
                                <input className="hex-input" value={cancelBg} onChange={(e) => setCancelBg(e.target.value)} />
                            </label>

                            <label className="sl-color-field">
                                <span>Form Cancel — Text</span>
                                <input type="color" value={cancelText} onChange={(e) => setCancelText(e.target.value)} />
                                <input className="hex-input" value={cancelText} onChange={(e) => setCancelText(e.target.value)} />
                            </label>
                        </div>

                        <div className="sl-row">
                            <label className="sl-textarea-field">
                                <span>Trade-in Address</span>

                                <textarea
                                    className="sl-textarea"
                                    placeholder="Enter the address where customers should send their trades..."
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    rows={4}
                                />
                            </label>
                        </div>
                    </div>

                    <div className="sl-actions-bottom">
                        <button
                            className="sl-btn sl-btn-primary"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? 'Saving…' : (saved ? 'Saved' : 'Save Changes')}
                        </button>
                        <button className="sl-btn sl-btn-ghost" onClick={handleReset} disabled={saving}>
                            Reset
                        </button>
                    </div>
                </section>
            </div>

            <div className="settings-container">

                {/* ===== LIVE PREVIEW ===== */}
                <aside className="sl-card sl-preview full-width" aria-label="Live preview">
                    <header className="sl-card-header">
                        <h3>Live Preview</h3>
                        <p className="muted">This updates as you pick colors.</p>
                    </header>

                    <div
                        className="sl-preview-box"
                        style={{
                            ['--sl-main-bg']: mainBg,
                            ['--sl-main-text']: mainText,
                            ['--sl-btn-text']: btnText,
                            ['--sl-btn-bg']: btnBg,
                            ['--sl-heading-bg']: headingBg,
                            ['--sl-heading-text']: headingText,
                            ['--sl-submit-bg']: submitBg,
                            ['--sl-submit-text']: submitText,
                            ['--sl-cancel-bg']: cancelBg,
                            ['--sl-cancel-text']: cancelText
                        }}
                    >
                        <div className="preview-inner">
                            <h2 className="preview-title">{mainTitle}</h2>
                            <p className="preview-sub">{mainSubTitle}</p>

                            <div className="preview-buttons">
                                <button className="preview-btn">Trade In Form</button>
                            </div>

                            <div className="preview-form">
                                <div className="form-header">Trade-in Form</div>
                                <div className="form-row">Name: <strong>John Doe</strong></div>
                                <div className="form-row">Email: <strong>john@example.com</strong></div>

                                <div className="form-actions">
                                    <button className="form-submit">Submit My Trade In Request</button>
                                    <button className="form-cancel">Cancel</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>


            <footer className="sl-footer">
                <small>Tip: copy these values to your Shopify section schema or save them in your app backend.</small>
            </footer>
        </div>
    );
}
