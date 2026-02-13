// File: Settings.jsx
import React, { useState, useEffect } from 'react';
import './Settings.css';

export default function Settings({ initial = {}, onSave }) {
    // sensible defaults if not provided
    const defaults = {
        mainBg: initial.mainBg || '#0f172a',
        mainText: initial.mainText || '#ffffff',
        btnText: initial.btnText || '#0f172a',
        btnBg: initial.btnBg || '#f8fafc',
        headingBg: initial.headingBg || '#94a3b8',
        headingText: initial.headingText || '#0f172a',
        submitBg: initial.submitBg || '#10b981',
        submitText: initial.submitText || '#ffffff',
        cancelBg: initial.cancelBg || '#ef4444',
        cancelText: initial.cancelText || '#ffffff'
    };

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

    const [saved, setSaved] = useState(false);

    useEffect(() => {
        // remove saved indicator after 2s
        if (saved) {
            const t = setTimeout(() => setSaved(false), 2000);
            return () => clearTimeout(t);
        }
    }, [saved]);

    const handleSave = () => {
        const payload = {
            mainBg,
            mainText,
            btnText,
            btnBg,
            headingBg,
            headingText,
            submitBg,
            submitText,
            cancelBg,
            cancelText
        };

        // call parent callback if provided
        if (typeof onSave === 'function') onSave(payload);

        // temporary UX: show saved and log
        console.log('Settings saved', payload);
        setSaved(true);
    };

    const handleReset = () => {
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
    };

    return (
        <div className="sl-settings-root">
            <div className="sl-settings-grid">
                <section className="sl-card sl-controls">
                    <header className="sl-card-header">
                        <h1>Second Loop — Visual Settings</h1>
                        <p className="muted">Customize the look & feel. Live preview updates instantly.</p>
                    </header>

                    <div className="sl-<strong> sect <strong>ion">
                        <h2 style={{ marginTop: "10px" }}><strong> Main </strong></h2>
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
                    </div>

                    <div className="sl-actions-bottom">
                        <button className="sl-btn sl-btn-primary" onClick={handleSave}>{saved ? 'Saved' : 'Save Changes'}</button>
                        <button className="sl-btn sl-btn-ghost" onClick={handleReset}>Reset</button>
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
                            <h2 className="preview-title">Welcome to Second Loop!</h2>
                            <p className="preview-sub">Submit Trade-In Requests Quickly & Easily.</p>

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
