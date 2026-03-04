import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import styles from "./css/AddModel.module.scss";
import { useNavigate } from "react-router-dom";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STEPS = ["Identity", "Images", "Confirm"];

const FIELDS = {
    type: ["babe", "milf", "petite"],
    rank: ["mature", "naughty", "slut"],
    tits: ["big", "natural", "small"],
    pussy: ["clean", "bush", "hairy"],
    ass: ["fat", "big", "tiny"],
};

const IMAGE_SLOTS = [
    {
        key: "landscape",
        label: "Landscape",
        hint: "Wide hero shot  ·  2000 × 1250",
        ratio: "2000 / 1250",
        aspect: 2000 / 1250,
    },
    {
        key: "portrait",
        label: "Portrait",
        hint: "Full-body  ·  1000 × 1658",
        ratio: "1000 / 1658",
        aspect: 1000 / 1658,
    },
    {
        key: "closeup",
        label: "Close-up",
        hint: "Face / detail  ·  1000 × 1350",
        ratio: "1000 / 1350",
        aspect: 1000 / 1350,
    },
];

// ─── Base modal shell ─────────────────────────────────────────────────────────
function Base({ children, onClose }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setVisible(true));
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
function PillGroup({ field, options, value, onChange }) {
    return (
        <div className={styles["pill-group"]}>
            <span className={styles["pill-group__label"]}>{field}</span>
            <div className={styles["pill-group__options"]}>
                {options.map(opt => (
                    <button
                        key={opt}
                        type="button"
                        className={`${styles["pill-group__opt"]} ${value === opt ? styles["pill-group__opt--on"] : ""}`}
                        onClick={() => onChange(field, opt)}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ─── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({ label, checked, onChange }) {
    return (
        <label className={styles.toggle}>
            <span className={styles["toggle__label"]}>{label}</span>
            <span className={`${styles["toggle__track"]} ${checked ? styles["toggle__track--on"] : ""}`}
                onClick={onChange}>
                <span className={styles["toggle__knob"]} />
            </span>
        </label>
    );
}

// ─── Image upload zone ────────────────────────────────────────────────────────
function UploadZone({ slot, file, preview, onFile }) {
    const inputRef = useRef(null);
    const [drag, setDrag] = useState(false);

    const accept = useCallback(file => {
        if (!file || !file.type.startsWith("image/")) return;
        onFile(slot.key, file);
    }, [slot.key, onFile]);

    const onDrop = e => {
        e.preventDefault();
        setDrag(false);
        accept(e.dataTransfer.files[0]);
    };

    return (
        <div
            className={`${styles["upload-zone"]} ${drag ? styles["upload-zone--drag"] : ""} ${preview ? styles["upload-zone--filled"] : ""}`}
            style={{ aspectRatio: slot.ratio }}
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
        >
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={e => accept(e.target.files[0])}
            />

            {preview ? (
                <>
                    <img src={preview} alt={slot.label} className={styles["upload-zone__img"]} />
                    <div className={styles["upload-zone__overlay"]}>
                        <span className={styles["upload-zone__overlay-text"]}>Replace</span>
                    </div>
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

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepBar({ current }) {
    return (
        <div className={styles["step-bar"]}>
            {STEPS.map((s, i) => (
                <div key={s} className={`${styles["step-bar__item"]} ${i === current ? styles["step-bar__item--active"] : ""} ${i < current ? styles["step-bar__item--done"] : ""}`}>
                    <span className={styles["step-bar__dot"]}>
                        {i < current
                            ? <svg viewBox="0 0 12 12" fill="currentColor"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
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

// ─── Success screen ───────────────────────────────────────────────────────────
function SuccessScreen({ name }) {
    return (
        <div className={styles["success"]}>
            <div className={styles["success__circle"]}>
                <svg viewBox="0 0 64 64" fill="none" className={styles["success__svg"]}>
                    <circle
                        cx="32" cy="32" r="28"
                        stroke="var(--text-sage, #9dc9a0)"
                        strokeWidth="1.5"
                        className={styles["success__ring"]}
                    />
                    <path
                        d="M20 32 l9 9 l15 -16"
                        stroke="var(--text-sage, #9dc9a0)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        className={styles["success__check"]}
                    />
                </svg>
            </div>
            <p className={styles["success__label"]}>Added</p>
            <p className={styles["success__name"]}>{name}</p>
            <div className={styles["success__bar"]}>
                <div className={styles["success__bar-fill"]} />
            </div>
        </div>
    );
}

// ─── Main modal ───────────────────────────────────────────────────────────────
export default function AddModel({ onClose, onSuccess }) {
    const [step, setStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [succeeded, setSucceeded] = useState(false);
    const [error, setError] = useState("");
    const [visible, setVisible] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        requestAnimationFrame(() => setVisible(true));

        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, []);

    const [form, setForm] = useState({
        name: "",
        type: "",
        rank: "",
        tits: "",
        pussy: "",
        ass: "",
        tattoo: false,
        piercing: false,
    });

    const [files, setFiles] = useState({ landscape: null, portrait: null, closeup: null });
    const [previews, setPreviews] = useState({ landscape: "", portrait: "", closeup: "" });

    // ── Field handlers ──
    const setField = (key, val) => {
        setForm(f => ({ ...f, [key]: val }));
        setError("");
    };

    const onFile = useCallback((key, file) => {
        setFiles(f => ({ ...f, [key]: file }));
        const url = URL.createObjectURL(file);
        setPreviews(p => ({ ...p, [key]: url }));
    }, []);

    // ── Validation per step ──
    const validateStep = () => {
        if (step === 0) {
            if (!form.name.trim()) return "Name is required.";
            for (const f of Object.keys(FIELDS)) {
                if (!form[f]) return `Please select a ${f} option.`;
            }
        }
        if (step === 1) {
            for (const s of IMAGE_SLOTS) {
                if (!files[s.key]) return `${s.label} image is required.`;
            }
        }
        return null;
    };

    const next = () => {
        const err = validateStep();
        if (err) { setError(err); return; }
        setError("");
        setStep(s => s + 1);
    };

    const back = () => { setError(""); setStep(s => s - 1); };

    // ── Submit ──
    const submit = async (handleClose) => {
        setSubmitting(true);
        setError("");
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => fd.append(k, v));
            Object.entries(files).forEach(([k, f]) => { if (f) fd.append(k, f); });

            const res = await axios.post("/api/models", fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            onSuccess?.(res.data);
            setSucceeded(true);
            setTimeout(() => {
                handleClose();
                navigate(`/model/${form.name}`);
            }, 2200);
        } catch (err) {
            setError(err.response?.data?.msg ?? err.message);
            setStep(0);
        } finally {
            setSubmitting(false);
        }
    };

    // ── Step content ──
    const stepContent = () => {
        if (step === 0) return (
            <div className={styles["step-identity"]}>
                <div className={styles["field"]}>
                    <label className={styles["field__label"]}>Name</label>
                    <input
                        className={styles["field__input"]}
                        type="text"
                        placeholder="e.g. Aria Valencia"
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

        if (step === 1) return (
            <div className={styles["step-images"]}>
                <p className={styles["step-images__note"]}>
                    Images are served from <code>/storage/models/</code> — filenames are derived from the model name automatically.
                    Upload full-quality originals; they will not be resized server-side.
                </p>
                <div className={styles["step-images__grid"]}>
                    {IMAGE_SLOTS.map(slot => (
                        <div key={slot.key} className={styles["step-images__slot"]}>
                            <UploadZone
                                slot={slot}
                                file={files[slot.key]}
                                preview={previews[slot.key]}
                                onFile={onFile}
                            />
                        </div>
                    ))}
                </div>
            </div>
        );

        if (step === 2) return (
            <div className={styles["step-confirm"]}>
                <div className={styles["step-confirm__card"]}>
                    <div className={styles["step-confirm__images"]}>
                        {IMAGE_SLOTS.map(slot => (
                            previews[slot.key] && (
                                <img key={slot.key}
                                    src={previews[slot.key]}
                                    alt={slot.label}
                                    className={styles["step-confirm__thumb"]}
                                    style={{ aspectRatio: slot.ratio }}
                                />
                            )
                        ))}
                    </div>

                    <div className={styles["step-confirm__details"]}>
                        <h2 className={styles["step-confirm__name"]}>{form.name}</h2>

                        <div className={styles["step-confirm__attrs"]}>
                            {Object.keys(FIELDS).map(f => (
                                <div key={f} className={styles["step-confirm__attr"]}>
                                    <span className={styles["step-confirm__attr-key"]}>{f}</span>
                                    <span className={styles["step-confirm__attr-val"]}>{form[f]}</span>
                                </div>
                            ))}
                        </div>

                        <div className={styles["step-confirm__flags"]}>
                            {form.tattoo && <span className={styles["step-confirm__flag"]}>Tattoo</span>}
                            {form.piercing && <span className={styles["step-confirm__flag"]}>Piercing</span>}
                            {!form.tattoo && !form.piercing && (
                                <span className={styles["step-confirm__flag-none"]}>No flags</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Base onClose={onClose}>
            {({ handleClose }) => (
                <>
                    {succeeded ? (
                        <SuccessScreen name={form.name} />
                    ) : (
                        <>
                            {/* ── Header ── */}
                            <div className={styles.header}>
                                <h2 className={styles["header__title"]}>Add to collection</h2>
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
                                    ? <button className={styles["footer__next"]} onClick={next}>
                                        Continue <span>→</span>
                                    </button>
                                    : <button
                                        className={`${styles["footer__submit"]} ${submitting ? styles["footer__submit--loading"] : ""}`}
                                        onClick={() => submit(handleClose)}
                                        disabled={submitting}
                                    >
                                        {submitting
                                            ? <><span className={styles["footer__submit-ring"]} /> Adding…</>
                                            : "Add model"
                                        }
                                    </button>
                                }
                            </div>
                        </>
                    )}
                </>
            )}
        </Base>
    );
}