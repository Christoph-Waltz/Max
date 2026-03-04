import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import styles from "./css/EditModel.module.scss";

// ─── Constants (identical to AddModelModal) ───────────────────────────────────
const STEPS = ["Identity", "Images", "Confirm"];

const FIELDS = {
    type: ["babe", "milf", "petite"],
    rank: ["mature", "naughty", "slut"],
    tits: ["big", "natural", "small"],
    pussy: ["clean", "bush", "hairy"],
    ass: ["fat", "big", "tiny"],
};

const IMAGE_SLOTS = [
    { key: "landscape", label: "Landscape", hint: "16 / 9", ratio: "16 / 9" },
    { key: "portrait", label: "Portrait", hint: "1000 × 1658", ratio: "1000 / 1658" },
    { key: "closeup", label: "Close-up", hint: "1000 × 1351", ratio: "1000 / 1351" },
];

// ─── Base (enter + exit animation) ───────────────────────────────────────────
function Base({ children, onClose }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setVisible(true));

        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, []);

    const handleClose = useCallback(() => {
        setVisible(false);
        setTimeout(onClose, 250);
    }, [onClose]);

    return (
        <div
            className={`${styles.overlay} ${visible ? styles["overlay--vis"] : ""}`}
            onMouseDown={e => { if (e.target === e.currentTarget) handleClose(); }}
        >
            <div
                className={`${styles.shell} ${visible ? styles["shell--vis"] : ""}`}
                onMouseDown={e => e.stopPropagation()}
            >
                {typeof children === "function" ? children({ handleClose }) : children}
            </div>
        </div>
    );
}

// ─── Pill selector ────────────────────────────────────────────────────────────
function PillGroup({ field, options, value, original, onChange }) {
    return (
        <div className={styles["pill-group"]}>
            <span className={styles["pill-group__label"]}>{field}</span>
            <div className={styles["pill-group__options"]}>
                {options.map(opt => (
                    <button
                        key={opt}
                        type="button"
                        className={[
                            styles["pill-group__opt"],
                            value === opt ? styles["pill-group__opt--on"] : "",
                            value === opt && value !== original
                                ? styles["pill-group__opt--changed"] : "",
                        ].join(" ")}
                        onClick={() => onChange(field, opt)}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ label, checked, onChange }) {
    return (
        <label className={styles.toggle}>
            <span className={styles["toggle__label"]}>{label}</span>
            <span
                className={`${styles["toggle__track"]} ${checked ? styles["toggle__track--on"] : ""}`}
                onClick={onChange}
            >
                <span className={styles["toggle__knob"]} />
            </span>
        </label>
    );
}

// ─── Upload zone — shows existing image, badges "Changed" when replaced ───────
function UploadZone({ slot, file, preview, existing, onFile }) {
    const inputRef = useRef(null);
    const [drag, setDrag] = useState(false);
    const changed = !!file; // new file selected

    const accept = useCallback(f => {
        if (!f || !f.type.startsWith("image/")) return;
        onFile(slot.key, f);
    }, [slot.key, onFile]);

    const displayed = preview || existing; // prefer new preview, fall back to existing URL

    return (
        <div
            className={[
                styles["upload-zone"],
                drag ? styles["upload-zone--drag"] : "",
                displayed ? styles["upload-zone--filled"] : "",
                changed ? styles["upload-zone--changed"] : "",
            ].join(" ")}
            style={{ aspectRatio: slot.ratio }}
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); accept(e.dataTransfer.files[0]); }}
        >
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={e => accept(e.target.files[0])}
            />

            {displayed ? (
                <>
                    <img src={displayed} alt={slot.label} className={styles["upload-zone__img"]} />
                    <div className={styles["upload-zone__overlay"]}>
                        <span className={styles["upload-zone__overlay-text"]}>Replace</span>
                    </div>
                    {changed && (
                        <span className={styles["upload-zone__badge"]}>Changed</span>
                    )}
                </>
            ) : (
                <div className={styles["upload-zone__empty"]}>
                    <svg className={styles["upload-zone__icon"]} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                    </svg>
                    <span className={styles["upload-zone__label"]}>{slot.label}</span>
                    <span className={styles["upload-zone__hint"]}>{slot.hint}</span>
                </div>
            )}
        </div>
    );
}

// ─── Step bar ─────────────────────────────────────────────────────────────────
function StepBar({ current }) {
    return (
        <div className={styles["step-bar"]}>
            {STEPS.map((s, i) => (
                <div key={s} className={[
                    styles["step-bar__item"],
                    i === current ? styles["step-bar__item--active"] : "",
                    i < current ? styles["step-bar__item--done"] : "",
                ].join(" ")}>
                    <span className={styles["step-bar__dot"]}>
                        {i < current
                            ? <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l3 3 5-5" /></svg>
                            : i + 1
                        }
                    </span>
                    <span className={styles["step-bar__name"]}>{s}</span>
                    {i < STEPS.length - 1 && <span className={styles["step-bar__line"]} />}
                </div>
            ))}
        </div>
    );
}

// ─── Change indicator — small diff summary shown in confirm ───────────────────
function DiffRow({ label, original, current }) {
    const changed = original !== current;
    return (
        <div className={`${styles["step-confirm__attr"]} ${changed ? styles["step-confirm__attr--changed"] : ""}`}>
            <span className={styles["step-confirm__attr-key"]}>{label}</span>
            <span className={styles["step-confirm__attr-val"]}>
                {changed ? (
                    <>
                        <span className={styles["step-confirm__attr-old"]}>{String(original)}</span>
                        <span className={styles["step-confirm__attr-arrow"]}>→</span>
                        <span className={styles["step-confirm__attr-new"]}>{String(current)}</span>
                    </>
                ) : (
                    <span>{String(current)}</span>
                )}
            </span>
        </div>
    );
}

// ─── Main modal ───────────────────────────────────────────────────────────────
// `model` prop — the full model object from the page (already fetched)
export default function EditModel({ model, onClose, onUpdated }) {
    const [step, setStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [succeeded, setSucceeded] = useState(false);
    const [error, setError] = useState("");

    // ── Form initialised from the existing model ──
    const [form, setFormState] = useState({
        name: model.name,
        type: model.type,
        rank: model.rank,
        tits: model.tits,
        pussy: model.pussy,
        ass: model.ass,
        tattoo: model.tattoo ?? false,
        piercing: model.piercing ?? false,
    });

    // New files (null = keep existing)
    const [files, setFiles] = useState({ landscape: null, portrait: null, closeup: null });
    // New object-URL previews for newly selected files
    const [previews, setPreviews] = useState({ landscape: "", portrait: "", closeup: "" });

    // Existing server URLs (used as fallback display in upload zones)
    const existing = {
        landscape: model.landscape,
        portrait: model.portrait,
        closeup: model.closeup,
    };

    const setField = useCallback((key, val) => {
        setFormState(f => ({ ...f, [key]: val }));
        setError("");
    }, []);

    const onFile = useCallback((key, file) => {
        setFiles(f => ({ ...f, [key]: file }));
        setPreviews(p => ({ ...p, [key]: URL.createObjectURL(file) }));
    }, []);

    // ── Diff helpers ──
    const anyIdentityChanged = (
        form.name !== model.name ||
        form.type !== model.type ||
        form.rank !== model.rank ||
        form.tits !== model.tits ||
        form.pussy !== model.pussy ||
        form.ass !== model.ass ||
        form.tattoo !== model.tattoo ||
        form.piercing !== model.piercing
    );
    const anyImageChanged = Object.values(files).some(Boolean);
    const anythingChanged = anyIdentityChanged || anyImageChanged;

    // ── Validation ──
    const next = (currentStep) => {
        setError("");
        if (currentStep === 0) {
            if (!form.name.trim()) { setError("Name is required."); return; }
            for (const f of Object.keys(FIELDS)) {
                if (!form[f]) { setError(`Please select a ${f} option.`); return; }
            }
        }
        setStep(currentStep + 1);
    };

    const back = () => { setError(""); setStep(s => s - 1); };

    // ── Submit — PATCH with only changed fields ──
    const submit = async (handleClose) => {
        if (!anythingChanged) { handleClose(); return; }

        setSubmitting(true);
        setError("");
        try {
            const fd = new FormData();

            // Only send fields that actually changed
            const identityFields = ["name", "type", "rank", "tits", "pussy", "ass", "tattoo", "piercing"];
            identityFields.forEach(k => {
                if (form[k] !== model[k]) fd.append(k, form[k]);
            });

            // Only send images that were replaced
            Object.entries(files).forEach(([k, f]) => { if (f) fd.append(k, f); });

            const res = await axios.patch(
                `/api/models?name=${encodeURIComponent(model.name)}`,
                fd,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            onUpdated?.(res.data);
            setSucceeded(true);
            setTimeout(handleClose, 2000);
        } catch (err) {
            setError(err.response?.data?.msg ?? err.message);
            setStep(0);
        } finally {
            setSubmitting(false);
        }
    };

    // ── Step content ──
    const stepContent = () => {
        // ── Step 0: Identity ──
        if (step === 0) return (
            <div className={styles["step-identity"]}>
                <div className={styles["field"]}>
                    <label className={styles["field__label"]}>Name</label>
                    <input
                        className={styles["field__input"]}
                        type="text"
                        value={form.name}
                        onChange={e => setField("name", e.target.value)}
                        autoFocus
                    />
                </div>

                <div className={styles["pill-grid"]}>
                    {Object.entries(FIELDS).map(([field, opts]) => (
                        <PillGroup
                            key={field}
                            field={field}
                            options={opts}
                            value={form[field]}
                            original={model[field]}
                            onChange={setField}
                        />
                    ))}
                </div>

                <div className={styles["flags"]}>
                    <Toggle label="Tattoo" checked={form.tattoo} onChange={() => setField("tattoo", !form.tattoo)} />
                    <Toggle label="Piercing" checked={form.piercing} onChange={() => setField("piercing", !form.piercing)} />
                </div>
            </div>
        );

        // ── Step 1: Images ──
        if (step === 1) return (
            <div className={styles["step-images"]}>
                <p className={styles["step-images__note"]}>
                    Leave a slot untouched to keep the existing image.
                    Replacing a file overwrites <code>/storage/models/{"{type}"}/{model.name}.png</code>.
                </p>
                <div className={styles["step-images__grid"]}>
                    {IMAGE_SLOTS.map(slot => (
                        <div key={slot.key} className={styles["step-images__slot"]}>
                            <UploadZone
                                slot={slot}
                                file={files[slot.key]}
                                preview={previews[slot.key]}
                                existing={existing[slot.key]}
                                onFile={onFile}
                            />
                        </div>
                    ))}
                </div>
            </div>
        );

        // ── Step 2: Confirm ──
        if (step === 2) return (
            <div className={styles["step-confirm"]}>
                <div className={styles["step-confirm__card"]}>

                    {/* Thumbnail row — show new or existing */}
                    <div className={styles["step-confirm__images"]}>
                        {IMAGE_SLOTS.map(slot => {
                            const src = previews[slot.key] || existing[slot.key];
                            return src ? (
                                <div key={slot.key} className={styles["step-confirm__thumb-wrap"]}>
                                    <img
                                        src={src}
                                        alt={slot.label}
                                        className={`${styles["step-confirm__thumb"]} ${previews[slot.key] ? styles["step-confirm__thumb--changed"] : ""}`}
                                        style={{ aspectRatio: slot.ratio }}
                                    />
                                    {previews[slot.key] && (
                                        <span className={styles["step-confirm__thumb-badge"]}>New</span>
                                    )}
                                </div>
                            ) : null;
                        })}
                    </div>

                    {/* Diff table */}
                    <div className={styles["step-confirm__details"]}>
                        <h2 className={styles["step-confirm__name"]}>
                            {form.name !== model.name ? (
                                <>
                                    <span className={styles["step-confirm__name-old"]}>{model.name}</span>
                                    <span className={styles["step-confirm__name-arrow"]}> → </span>
                                    {form.name}
                                </>
                            ) : form.name}
                        </h2>

                        <div className={styles["step-confirm__attrs"]}>
                            {Object.keys(FIELDS).map(f => (
                                <DiffRow key={f} label={f} original={model[f]} current={form[f]} />
                            ))}
                        </div>

                        {/* Flags — same chip pattern as AddModel confirm */}
                        <div className={styles["step-confirm__flags"]}>
                            {/* Tattoo */}
                            {form.tattoo ? (
                                <span className={`${styles["step-confirm__flag"]} ${!model.tattoo ? styles["step-confirm__flag--new"] : ""}`}>
                                    Tattoo
                                </span>
                            ) : model.tattoo ? (
                                <span className={styles["step-confirm__flag--removed"]}>Tattoo</span>
                            ) : null}

                            {/* Piercing */}
                            {form.piercing ? (
                                <span className={`${styles["step-confirm__flag"]} ${!model.piercing ? styles["step-confirm__flag--new"] : ""}`}>
                                    Piercing
                                </span>
                            ) : model.piercing ? (
                                <span className={styles["step-confirm__flag--removed"]}>Piercing</span>
                            ) : null}

                            {/* Neither now, neither before */}
                            {!form.tattoo && !form.piercing && (
                                <span className={styles["step-confirm__flag-none"]}>No flags</span>
                            )}
                        </div>

                        {!anythingChanged && (
                            <p className={styles["step-confirm__no-changes"]}>
                                No changes detected — submitting will close without a request.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Base onClose={onClose}>
            {({ handleClose }) => (<>

                {/* ── Success screen ── */}
                {succeeded ? (
                    <div className={styles["success"]}>
                        <div className={styles["success__ring"]}>
                            <svg viewBox="0 0 52 52" fill="none">
                                <circle cx="26" cy="26" r="24" stroke="currentColor" strokeWidth="1.5"
                                    className={styles["success__ring-circle"]} />
                                <path d="M14 26l9 9 15-15" stroke="currentColor" strokeWidth="2"
                                    strokeLinecap="round" strokeLinejoin="round"
                                    className={styles["success__ring-check"]} />
                            </svg>
                        </div>
                        <h3 className={styles["success__title"]}>{form.name}</h3>
                        <p className={styles["success__note"]}>Profile updated</p>
                    </div>
                ) : (<>

                    {/* ── Header ── */}
                    <div className={styles.header}>
                        <h2 className={styles["header__title"]}>{model.name}</h2>
                        <button className={styles["header__close"]} onClick={handleClose} aria-label="Close">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    {/* ── Step bar ── */}
                    <StepBar current={step} />

                    {/* ── Body ── */}
                    <div className={styles.body}>
                        {stepContent()}
                    </div>

                    {/* ── Error ── */}
                    {error && (
                        <div className={styles.error}>
                            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4h1.5v4.5h-1.5V5zm0 6h1.5v1.5h-1.5V11z" /></svg>
                            {error}
                        </div>
                    )}

                    {/* ── Footer ── */}
                    <div className={styles.footer}>
                        {step > 0
                            ? <button className={styles["footer__back"]} onClick={back}>← Back</button>
                            : <span />
                        }
                        {step < STEPS.length - 1
                            ? <button className={styles["footer__next"]} onClick={() => next(step)}>
                                Continue <span>→</span>
                            </button>
                            : <button
                                className={`${styles["footer__submit"]} ${submitting ? styles["footer__submit--loading"] : ""}`}
                                onClick={() => submit(handleClose)}
                                disabled={submitting}
                            >
                                {submitting
                                    ? <><span className={styles["footer__submit-ring"]} /> Saving…</>
                                    : anythingChanged ? "Save changes" : "No changes"
                                }
                            </button>
                        }
                    </div>

                </>)}
            </>)}
        </Base>
    );
}