import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import styles from "./css/AddScene.module.scss";

// ─── Constants ────────────────────────────────────────────────────────────────
const STEPS = ["Details", "Cast", "Tags", "Media", "Confirm"];

const SCENE_ID_PREFIXES = ["Anal", "FMF", "Gangbang", "MFM", "Orgy", "Straight"];

const TAG_GROUPS = [
    { label: "Scene type", tags: ["couple", "threesome", "fmf", "mfm", "orgy", "gangbang"] },
    { label: "Acts", tags: ["straight", "anal", "dp", "squirting"] },
    { label: "Finish", tags: ["facial", "cumshot", "creampie", "analCreampie", "cumSwap", "cumSwallow", "piss"] },
    { label: "Collection", tags: ["favourite"] },
];

const ALL_TAGS = TAG_GROUPS.flatMap(g => g.tags);
const DEFAULT_TAGS = Object.fromEntries(ALL_TAGS.map(t => [t, false]));
const formatTag = t => t.replace(/([A-Z])/g, " $1").toLowerCase();

// ─── Base modal shell ─────────────────────────────────────────────────────────
function Base({ children, onClose }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

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

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepBar({ current }) {
    return (
        <div className={styles["step-bar"]}>
            {STEPS.map((s, i) => (
                <div
                    key={s}
                    className={`${styles["step-bar__item"]}
                        ${i === current ? styles["step-bar__item--active"] : ""}
                        ${i < current ? styles["step-bar__item--done"] : ""}`}
                >
                    <span className={styles["step-bar__dot"]}>
                        {i < current
                            ? <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l3 3 5-5" /></svg>
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

// ─── Step 1 — Details ─────────────────────────────────────────────────────────
function StepDetails({ form, setField, sceneIdError }) {
    return (
        <div className={styles["step-details"]}>
            <div className={styles["field"]}>
                <label className={styles["field__label"]}>
                    Scene ID
                    <span className={styles["field__hint"]}>e.g. Anal 69  ·  Straight 12</span>
                </label>
                <div className={styles["scene-id"]}>
                    <div className={styles["scene-id__prefix"]}>
                        {SCENE_ID_PREFIXES.map(p => (
                            <button
                                key={p}
                                type="button"
                                className={`${styles["scene-id__prefix-btn"]} ${form.sceneIdPrefix === p ? styles["scene-id__prefix-btn--on"] : ""}`}
                                onClick={() => setField("sceneIdPrefix", p)}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                    <div className={styles["scene-id__num-wrap"]}>
                        <input
                            className={`${styles["scene-id__num"]} ${sceneIdError ? styles["scene-id__num--err"] : ""}`}
                            type="number"
                            min="1"
                            placeholder="Number"
                            value={form.sceneIdNum}
                            onChange={e => {
                                const v = e.target.value;
                                if (v === "" || Number(v) > 0) setField("sceneIdNum", v);
                            }}
                        />
                        {form.sceneIdPrefix && form.sceneIdNum && (
                            <span className={styles["scene-id__preview"]}>
                                → <strong>{form.sceneIdPrefix} {form.sceneIdNum}</strong>
                            </span>
                        )}
                    </div>
                    {sceneIdError && <p className={styles["scene-id__error"]}>{sceneIdError}</p>}
                </div>
            </div>

            <div className={styles["field"]}>
                <label className={styles["field__label"]}>Title</label>
                <input
                    className={styles["field__input"]}
                    type="text"
                    placeholder="Scene title"
                    value={form.title}
                    onChange={e => setField("title", e.target.value)}
                />
            </div>

            <div className={styles["field"]}>
                <label className={styles["field__label"]}>Production</label>
                <input
                    className={styles["field__input"]}
                    type="text"
                    placeholder="Studio or production name"
                    value={form.production}
                    onChange={e => setField("production", e.target.value)}
                    autoComplete="off"
                />
            </div>
        </div>
    );
}

// ─── Step 2 — Cast ────────────────────────────────────────────────────────────
function StepCast({ selected, onToggle, models, loadingModels }) {
    const [query, setQuery] = useState("");
    const filtered = models.filter(m => m.name.toLowerCase().includes(query.toLowerCase()));

    return (
        <div className={styles["step-cast"]}>
            <div className={styles["step-cast__search"]}>
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <circle cx="9" cy="9" r="6" /><path d="M15 15l3 3" />
                </svg>
                <input
                    type="text"
                    placeholder="Search models…"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    autoFocus
                />
            </div>

            {selected.length > 0 && (
                <div className={styles["step-cast__selected"]}>
                    {selected.map(name => (
                        <span key={name} className={styles["step-cast__chip"]}>
                            {name}
                            <button onClick={() => onToggle(name)} aria-label="Remove">×</button>
                        </span>
                    ))}
                </div>
            )}

            <div className={styles["step-cast__grid"]}>
                {loadingModels ? (
                    <div className={styles["step-cast__loading"]}>
                        <span className={styles["step-cast__ring"]} />
                    </div>
                ) : filtered.length === 0 ? (
                    <p className={styles["step-cast__empty"]}>No models found</p>
                ) : (
                    filtered.map(m => {
                        const active = selected.includes(m.name);
                        return (
                            <button
                                key={m.name}
                                type="button"
                                className={`${styles["model-card"]} ${active ? styles["model-card--on"] : ""}`}
                                onClick={() => onToggle(m.name)}
                            >
                                <div className={styles["model-card__img"]}>
                                    <img src={m.closeup} alt={m.name} loading="lazy" />
                                    {active && (
                                        <div className={styles["model-card__check"]}>
                                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M3 8l4 4 6-6" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <span className={styles["model-card__name"]}>{m.name}</span>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}

// ─── Step 3 — Tags ────────────────────────────────────────────────────────────
function StepTags({ tags, onToggle }) {
    return (
        <div className={styles["step-tags"]}>
            {TAG_GROUPS.map(group => (
                <div key={group.label} className={styles["tag-group"]}>
                    <span className={styles["tag-group__label"]}>{group.label}</span>
                    <div className={styles["tag-group__pills"]}>
                        {group.tags.map(t => (
                            <button
                                key={t}
                                type="button"
                                className={`${styles["tag-pill"]} ${tags[t] ? styles["tag-pill--on"] : ""}`}
                                onClick={() => onToggle(t)}
                            >
                                {formatTag(t)}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Step 4 — Media (cover only) ──────────────────────────────────────────────
function StepMedia({ coverFile, coverPreview, onCover }) {
    const coverRef = useRef(null);
    const [coverDrag, setCoverDrag] = useState(false);

    const acceptCover = useCallback(f => {
        if (!f || !f.type.startsWith("image/")) return;
        onCover(f);
    }, [onCover]);

    return (
        <div className={styles["step-media"]}>
            <div className={styles["step-media__section"]}>
                <span className={styles["step-media__section-label"]}>Cover image</span>
                <div
                    className={`${styles["drop-zone"]} ${styles["drop-zone--cover"]} ${coverDrag ? styles["drop-zone--drag"] : ""} ${coverFile ? styles["drop-zone--filled"] : ""}`}
                    onClick={() => coverRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setCoverDrag(true); }}
                    onDragLeave={() => setCoverDrag(false)}
                    onDrop={e => { e.preventDefault(); setCoverDrag(false); acceptCover(e.dataTransfer.files[0]); }}
                >
                    <input
                        ref={coverRef}
                        type="file"
                        accept="image/png"
                        style={{ display: "none" }}
                        onChange={e => acceptCover(e.target.files[0])}
                    />

                    {coverPreview ? (
                        <>
                            <img src={coverPreview} alt="Cover preview" className={styles["drop-zone__preview-img"]} />
                            <div className={styles["drop-zone__replace"]}><span>Replace</span></div>
                        </>
                    ) : (
                        <div className={styles["drop-zone__empty"]}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <path d="M21 15l-5-5L5 21" />
                            </svg>
                            <span className={styles["drop-zone__empty-label"]}>Drop cover image</span>
                            <span className={styles["drop-zone__empty-hint"]}>PNG · 16 / 9 · Saved as cover.png</span>
                        </div>
                    )}
                </div>
                {coverFile && (
                    <p className={styles["step-media__filename"]}>
                        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.5 6H9V1.5a.5.5 0 00-.5-.5h-5A1 1 0 002.5 2v12a1 1 0 001 1h9a1 1 0 001-1V6.5a.5.5 0 00-.5-.5z" /></svg>
                        {coverFile.name} → <strong>cover.png</strong>
                    </p>
                )}
            </div>

            <p className={styles["step-media__note"]}>
                Cover is stored at <code>storage/scenes/{"{sceneId}"}/cover.png</code>.
                Add the video manually to the same folder as <code>video.mp4</code>.
            </p>
        </div>
    );
}

// ─── Step 5 — Confirm ─────────────────────────────────────────────────────────
function StepConfirm({ form, cast, tags, coverPreview }) {
    const sceneId = `${form.sceneIdPrefix} ${form.sceneIdNum}`;
    const activeTags = Object.entries(tags).filter(([, v]) => v).map(([k]) => k);

    return (
        <div className={styles["step-confirm"]}>
            <div className={styles["step-confirm__hero"]}>
                {coverPreview && (
                    <img src={coverPreview} alt="Cover" className={styles["step-confirm__cover"]} />
                )}
                <div className={styles["step-confirm__identity"]}>
                    <span className={styles["step-confirm__scene-id"]}>{sceneId}</span>
                    <h3 className={styles["step-confirm__title"]}>{form.title}</h3>
                    <span className={styles["step-confirm__production"]}>{form.production}</span>
                </div>
            </div>

            <div className={styles["step-confirm__attrs"]}>
                <div className={styles["step-confirm__attr"]}>
                    <span className={styles["step-confirm__attr-key"]}>Cast</span>
                    <span className={styles["step-confirm__attr-val"]}>{cast.join(", ")}</span>
                </div>
                <div className={styles["step-confirm__attr"]}>
                    <span className={styles["step-confirm__attr-key"]}>Tags</span>
                    <span className={styles["step-confirm__attr-val"]}>
                        {activeTags.length > 0 ? (
                            <div className={styles["step-confirm__tags"]}>
                                {activeTags.map(t => (
                                    <span key={t} className={styles["step-confirm__tag"]}>
                                        {formatTag(t)}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <span className={styles["step-confirm__attr-none"]}>No tags selected</span>
                        )}
                    </span>
                </div>
            </div>
        </div>
    );
}

// ─── Main modal ───────────────────────────────────────────────────────────────
export default function AddScene({ onClose, onSuccess }) {
    const [step, setStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [succeeded, setSucceeded] = useState(false);
    const [error, setError] = useState("");
    const [sceneIdError, setSceneIdError] = useState("");

    const [models, setModels] = useState([]);
    const [loadingModels, setLoadingModels] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setVisible(true));

        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, []);

    const [form, setFormState] = useState({
        sceneIdPrefix: "",
        sceneIdNum: "",
        title: "",
        production: "",
    });

    const [cast, setCast] = useState([]);
    const [tags, setTags] = useState({ ...DEFAULT_TAGS });
    const [coverFile, setCoverFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState("");

    const setField = useCallback((key, val) => {
        setFormState(f => ({ ...f, [key]: val }));
        setError("");
        if (key === "sceneIdPrefix" || key === "sceneIdNum") setSceneIdError("");
    }, []);

    const toggleTag = useCallback(t => setTags(p => ({ ...p, [t]: !p[t] })), []);
    const toggleCast = useCallback(n => setCast(p => p.includes(n) ? p.filter(x => x !== n) : [...p, n]), []);
    const onCover = useCallback(f => { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); }, []);

    // Fetch models on cast step
    useEffect(() => {
        if (step !== 1 || models.length > 0) return;
        setLoadingModels(true);
        axios.get("/api/models")
            .then(r => setModels(r.data ?? []))
            .catch(() => setError("Failed to load models"))
            .finally(() => setLoadingModels(false));
    }, [step, models.length]);

    // sceneId uniqueness — 200 = taken, 404 = free
    const checkSceneId = useCallback(async () => {
        const { sceneIdPrefix, sceneIdNum } = form;
        if (!sceneIdPrefix || !sceneIdNum) return false;
        const sceneId = `${sceneIdPrefix} ${sceneIdNum}`;
        try {
            await axios.get(`/api/scenes?sceneId=${encodeURIComponent(sceneId)}`);
            setSceneIdError(`${sceneId} already exists.`);
            return false;
        } catch (err) {
            if (err.response?.status === 404) { setSceneIdError(""); return true; }
            return true; // network/500 — non-blocking
        }
    }, [form]);

    const next = async (currentStep) => {
        setError("");

        if (currentStep === 0) {
            if (!form.sceneIdPrefix) { setError("Select a scene ID prefix."); return; }
            if (!form.sceneIdNum || isNaN(Number(form.sceneIdNum)) || Number(form.sceneIdNum) < 1) {
                setError("Enter a valid scene number."); return;
            }
            const unique = await checkSceneId();
            if (!unique) return;
            if (sceneIdError) return;
            if (!form.title.trim()) { setError("Title is required."); return; }
            if (!form.production.trim()) { setError("Production is required."); return; }
        }

        if (currentStep === 1) {
            if (cast.length === 0) { setError("Add at least one model to the cast."); return; }
        }

        if (currentStep === 3) {
            if (!coverFile) { setError("Cover image is required."); return; }
        }

        setStep(currentStep + 1);
    };

    const back = () => { setError(""); setStep(s => s - 1); };

    const submit = async (handleClose) => {
        setSubmitting(true);
        setError("");
        try {
            const sceneId = `${form.sceneIdPrefix} ${form.sceneIdNum}`;
            const fd = new FormData();
            fd.append("sceneId", sceneId);
            fd.append("title", form.title);
            fd.append("production", form.production);
            cast.forEach(name => fd.append("pornstars[]", name));
            fd.append("tags", JSON.stringify(tags));
            fd.append("cover", coverFile);

            const res = await axios.post("/api/scenes", fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            onSuccess?.(res.data);
            setSucceeded(true);
            setTimeout(handleClose, 2200);
        } catch (err) {
            setError(err.response?.data?.msg ?? err.message);
            setStep(0);
        } finally {
            setSubmitting(false);
        }
    };

    const sceneId = (form.sceneIdPrefix && form.sceneIdNum && Number(form.sceneIdNum) > 0)
        ? `${form.sceneIdPrefix} ${form.sceneIdNum}` : "—";

    const stepContent = () => {
        if (step === 0) return <StepDetails form={form} setField={setField} sceneIdError={sceneIdError} />;
        if (step === 1) return <StepCast selected={cast} onToggle={toggleCast} models={models} loadingModels={loadingModels} />;
        if (step === 2) return <StepTags tags={tags} onToggle={toggleTag} />;
        if (step === 3) return <StepMedia coverFile={coverFile} coverPreview={coverPreview} onCover={onCover} />;
        if (step === 4) return <StepConfirm form={form} cast={cast} tags={tags} coverPreview={coverPreview} />;
    };

    return (
        <Base onClose={onClose}>
            {({ handleClose }) => (<>

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
                        <h3 className={styles["success__title"]}>{form.sceneIdPrefix} {form.sceneIdNum}</h3>
                        <p className={styles["success__sub"]}>{form.title}</p>
                        <p className={styles["success__note"]}>Added to collection</p>
                    </div>
                ) : (<>

                    <div className={styles.header}>
                        <h2 className={styles["header__title"]}>Add to collection</h2>
                        <button className={styles["header__close"]} onClick={handleClose} aria-label="Close">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    <StepBar current={step} />

                    <div className={styles["summary-bar"]}>
                        <span className={styles["summary-bar__id"]}>{sceneId}</span>
                        <span className={styles["summary-bar__sep"]}>·</span>
                        <span className={styles["summary-bar__title"]}>{form.title || ""}</span>
                        <span className={styles["summary-bar__cast"]}>{cast.length} model{cast.length !== 1 ? "s" : ""}</span>
                    </div>

                    <div className={styles.body}>{stepContent()}</div>

                    {error && (
                        <div className={styles.error}>
                            <svg viewBox="0 0 16 16" fill="currentColor">
                                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4h1.5v4.5h-1.5V5zm0 6h1.5v1.5h-1.5V11z" />
                            </svg>
                            {error}
                        </div>
                    )}

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
                                    ? <><span className={styles["footer__submit-ring"]} /> Adding…</>
                                    : "Add scene"
                                }
                            </button>
                        }
                    </div>

                </>)}
            </>)}
        </Base>
    );
}