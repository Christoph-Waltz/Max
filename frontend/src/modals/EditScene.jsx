import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import styles from "./css/EditScene.module.scss";

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
const formatTag = t => t.replace(/([A-Z])/g, " $1").toLowerCase();

const parseSceneId = id => {
    if (!id) return { prefix: "", num: "" };
    const parts = id.split(" ");
    return { prefix: parts[0] ?? "", num: parts.slice(1).join(" ") ?? "" };
};

// ─── Base modal shell ─────────────────────────────────────────────────────────
function Base({ children, onClose }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setVisible(true));
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = prev; };
    }, []);

    const handleClose = useCallback(() => {
        setVisible(false);
        setTimeout(onClose, 250);
    }, [onClose]);

    return createPortal(
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
        </div>,
        document.body
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
                            ? <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l3 3 5-5" /></svg>
                            : i + 1}
                    </span>
                    <span className={styles["step-bar__name"]}>{s}</span>
                    {i < STEPS.length - 1 && <span className={styles["step-bar__line"]} />}
                </div>
            ))}
        </div>
    );
}

// ─── Step 1 — Details ─────────────────────────────────────────────────────────
function StepDetails({ form, origSceneId, setField, sceneIdError }) {
    const sceneIdChanged = `${form.sceneIdPrefix} ${form.sceneIdNum}` !== origSceneId;
    return (
        <div className={styles["step-details"]}>
            <div className={styles["field"]}>
                <label className={styles["field__label"]}>
                    Scene ID
                    {sceneIdChanged && <span className={styles["field__changed-badge"]}>Changed</span>}
                </label>
                <div className={styles["scene-id"]}>
                    <div className={styles["scene-id__prefix"]}>
                        {SCENE_ID_PREFIXES.map(p => (
                            <button key={p} type="button"
                                className={[styles["scene-id__prefix-btn"], form.sceneIdPrefix === p ? styles["scene-id__prefix-btn--on"] : ""].join(" ")}
                                onClick={() => setField("sceneIdPrefix", p)}>{p}</button>
                        ))}
                    </div>
                    <div className={styles["scene-id__num-wrap"]}>
                        <input
                            className={[styles["scene-id__num"], sceneIdError ? styles["scene-id__num--err"] : ""].join(" ")}
                            type="number" min="1" placeholder="Number" value={form.sceneIdNum}
                            onChange={e => { const v = e.target.value; if (v === "" || Number(v) > 0) setField("sceneIdNum", v); }}
                        />
                        {form.sceneIdPrefix && form.sceneIdNum && (
                            <span className={styles["scene-id__preview"]}>→ <strong>{form.sceneIdPrefix} {form.sceneIdNum}</strong></span>
                        )}
                    </div>
                    {sceneIdError && <p className={styles["scene-id__error"]}>{sceneIdError}</p>}
                </div>
            </div>
            <div className={styles["field"]}>
                <label className={styles["field__label"]}>Title</label>
                <input className={styles["field__input"]} type="text" value={form.title} onChange={e => setField("title", e.target.value)} />
            </div>
            <div className={styles["field"]}>
                <label className={styles["field__label"]}>Production</label>
                <input className={styles["field__input"]} type="text" value={form.production} onChange={e => setField("production", e.target.value)} autoComplete="off" />
            </div>
        </div>
    );
}

// ─── Step 2 — Cast ────────────────────────────────────────────────────────────
function StepCast({ selected, origCast, onToggle, models, loadingModels }) {
    const [query, setQuery] = useState("");
    const filtered = models.filter(m => m.name.toLowerCase().includes(query.toLowerCase()));
    return (
        <div className={styles["step-cast"]}>
            <div className={styles["step-cast__search"]}>
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <circle cx="9" cy="9" r="6" /><path d="M15 15l3 3" />
                </svg>
                <input type="text" placeholder="Search models…" value={query} onChange={e => setQuery(e.target.value)} autoFocus />
            </div>
            {selected.length > 0 && (
                <div className={styles["step-cast__selected"]}>
                    {selected.map(name => (
                        <span key={name} className={[styles["step-cast__chip"], !origCast.includes(name) ? styles["step-cast__chip--new"] : ""].join(" ")}>
                            {name}
                            <button onClick={() => onToggle(name)} aria-label="Remove">×</button>
                        </span>
                    ))}
                </div>
            )}
            <div className={styles["step-cast__grid"]}>
                {loadingModels ? (
                    <div className={styles["step-cast__loading"]}><span className={styles["step-cast__ring"]} /></div>
                ) : filtered.length === 0 ? (
                    <p className={styles["step-cast__empty"]}>No models found</p>
                ) : filtered.map(m => {
                    const active = selected.includes(m.name);
                    const wasIn = origCast.includes(m.name);
                    const isNew = active && !wasIn;
                    const removed = !active && wasIn;
                    return (
                        <button key={m.name} type="button"
                            className={[styles["model-card"], active ? styles["model-card--on"] : "", isNew ? styles["model-card--new"] : "", removed ? styles["model-card--removed"] : ""].join(" ")}
                            onClick={() => onToggle(m.name)}>
                            <div className={styles["model-card__img"]}>
                                <img src={m.closeup} alt={m.name} loading="lazy" />
                                {active && <div className={styles["model-card__check"]}><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8l4 4 6-6" /></svg></div>}
                                {removed && <div className={styles["model-card__removed-veil"]}><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="4" x2="12" y2="12" /><line x1="12" y1="4" x2="4" y2="12" /></svg></div>}
                            </div>
                            <span className={styles["model-card__name"]}>{m.name}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Step 3 — Tags ────────────────────────────────────────────────────────────
function StepTags({ tags, origTags, onToggle }) {
    return (
        <div className={styles["step-tags"]}>
            {TAG_GROUPS.map(group => (
                <div key={group.label} className={styles["tag-group"]}>
                    <span className={styles["tag-group__label"]}>{group.label}</span>
                    <div className={styles["tag-group__pills"]}>
                        {group.tags.map(t => (
                            <button key={t} type="button"
                                className={[styles["tag-pill"], tags[t] ? styles["tag-pill--on"] : "", tags[t] !== origTags[t] ? styles["tag-pill--changed"] : ""].join(" ")}
                                onClick={() => onToggle(t)}>{formatTag(t)}</button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Step 4 — Media (cover only) ──────────────────────────────────────────────
function StepMedia({ coverFile, coverPreview, existingCover, onCover }) {
    const coverRef = useRef(null);
    const [coverDrag, setCoverDrag] = useState(false);
    const acceptCover = useCallback(f => { if (!f || !f.type.startsWith("image/")) return; onCover(f); }, [onCover]);
    const displayedCover = coverPreview || existingCover;
    return (
        <div className={styles["step-media"]}>
            <div className={styles["step-media__section"]}>
                <span className={styles["step-media__section-label"]}>
                    Cover image
                    {coverFile && <span className={styles["step-media__changed-badge"]}>New</span>}
                </span>
                <div
                    className={[styles["drop-zone"], styles["drop-zone--cover"], coverDrag ? styles["drop-zone--drag"] : "", displayedCover ? styles["drop-zone--filled"] : "", coverFile ? styles["drop-zone--changed"] : ""].join(" ")}
                    onClick={() => coverRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setCoverDrag(true); }}
                    onDragLeave={() => setCoverDrag(false)}
                    onDrop={e => { e.preventDefault(); setCoverDrag(false); acceptCover(e.dataTransfer.files[0]); }}
                >
                    <input ref={coverRef} type="file" accept="image/png" style={{ display: "none" }} onChange={e => acceptCover(e.target.files[0])} />
                    {displayedCover ? (
                        <><img src={displayedCover} alt="Cover" className={styles["drop-zone__preview-img"]} /><div className={styles["drop-zone__replace"]}><span>Replace</span></div></>
                    ) : (
                        <div className={styles["drop-zone__empty"]}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <path d="M21 15l-5-5L5 21" />
                            </svg>
                            <span className={styles["drop-zone__empty-label"]}>Drop cover image</span>
                            <span className={styles["drop-zone__empty-hint"]}>PNG · 16 / 9</span>
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
                Leave untouched to keep the existing cover.
                Stored at <code>storage/scenes/{"{sceneId}"}/cover.png</code>.
            </p>
        </div>
    );
}

// ─── Step 5 — Confirm ─────────────────────────────────────────────────────────
function StepConfirm({ form, origForm, cast, origCast, tags, origTags, coverPreview, existingCover }) {
    const sceneId = `${form.sceneIdPrefix} ${form.sceneIdNum}`;
    const origId = origForm.sceneId;
    const idChanged = sceneId !== origId;
    const addedModels = cast.filter(n => !origCast.includes(n));
    const removedModels = origCast.filter(n => !cast.includes(n));
    const castChanged = addedModels.length > 0 || removedModels.length > 0;
    const activeTags = ALL_TAGS.filter(t => tags[t]);
    const addedTags = ALL_TAGS.filter(t => tags[t] && !origTags[t]);
    const removedTags = ALL_TAGS.filter(t => !tags[t] && origTags[t]);
    const tagsChanged = addedTags.length > 0 || removedTags.length > 0;
    const displayedCover = coverPreview || existingCover;
    const anythingChanged = idChanged || form.title !== origForm.title || form.production !== origForm.production
        || castChanged || tagsChanged || !!coverPreview;

    const DiffRow = ({ label, orig, curr }) => {
        const changed = orig !== curr;
        return (
            <div className={[styles["confirm-row"], changed ? styles["confirm-row--changed"] : ""].join(" ")}>
                <span className={styles["confirm-row__key"]}>{label}</span>
                <span className={styles["confirm-row__val"]}>
                    {changed
                        ? <><span className={styles["confirm-row__old"]}>{orig}</span><span className={styles["confirm-row__arrow"]}>→</span><span className={styles["confirm-row__new"]}>{curr}</span></>
                        : curr}
                </span>
            </div>
        );
    };

    return (
        <div className={styles["step-confirm"]}>
            <div className={styles["step-confirm__hero"]}>
                {displayedCover && (
                    <div className={styles["step-confirm__cover-wrap"]}>
                        <img src={displayedCover} alt="Cover" className={styles["step-confirm__cover"]} />
                        {coverPreview && <span className={styles["step-confirm__cover-badge"]}>New</span>}
                    </div>
                )}
                <div className={styles["step-confirm__identity"]}>
                    {idChanged
                        ? <><span className={styles["step-confirm__scene-id-old"]}>{origId}</span><span className={styles["step-confirm__scene-id-arrow"]}>→</span><span className={styles["step-confirm__scene-id"]}>{sceneId}</span></>
                        : <span className={styles["step-confirm__scene-id"]}>{sceneId}</span>}
                    <h3 className={styles["step-confirm__title"]}>{form.title}</h3>
                    <span className={styles["step-confirm__production"]}>{form.production}</span>
                </div>
            </div>
            <div className={styles["step-confirm__rows"]}>
                <DiffRow label="Title" orig={origForm.title} curr={form.title} />
                <DiffRow label="Production" orig={origForm.production} curr={form.production} />
                <div className={[styles["confirm-row"], castChanged ? styles["confirm-row--changed"] : ""].join(" ")}>
                    <span className={styles["confirm-row__key"]}>Cast</span>
                    <span className={styles["confirm-row__val"]}>
                        <div className={styles["confirm-cast"]}>
                            {cast.map(n => <span key={n} className={[styles["confirm-cast__chip"], addedModels.includes(n) ? styles["confirm-cast__chip--added"] : ""].join(" ")}>{n}</span>)}
                            {removedModels.map(n => <span key={n} className={styles["confirm-cast__chip--removed"]}>{n}</span>)}
                        </div>
                    </span>
                </div>
                <div className={[styles["confirm-row"], tagsChanged ? styles["confirm-row--changed"] : ""].join(" ")}>
                    <span className={styles["confirm-row__key"]}>Tags</span>
                    <span className={styles["confirm-row__val"]}>
                        {activeTags.length > 0
                            ? <div className={styles["confirm-tags"]}>
                                {activeTags.map(t => <span key={t} className={[styles["confirm-tags__pill"], addedTags.includes(t) ? styles["confirm-tags__pill--added"] : ""].join(" ")}>{formatTag(t)}</span>)}
                                {removedTags.map(t => <span key={t} className={styles["confirm-tags__pill--removed"]}>{formatTag(t)}</span>)}
                            </div>
                            : <span className={styles["confirm-row__none"]}>No tags</span>}
                    </span>
                </div>
                <div className={[styles["confirm-row"], coverPreview ? styles["confirm-row--changed"] : ""].join(" ")}>
                    <span className={styles["confirm-row__key"]}>Cover</span>
                    <span className={styles["confirm-row__val"]}>
                        {coverPreview
                            ? <span className={styles["confirm-media__item"]}>cover.png replaced</span>
                            : <span className={styles["confirm-row__none"]}>Unchanged</span>}
                    </span>
                </div>
            </div>
            {!anythingChanged && (
                <p className={styles["step-confirm__no-changes"]}>No changes detected — submitting will close without a request.</p>
            )}
        </div>
    );
}

// ─── Preview button ───────────────────────────────────────────────────────────
// Shown in footer on all steps. Calls POST /api/scenes?sceneId=...&preview
// hasPreview — whether preview.mp4 already exists for this scene
function PreviewButton({ sceneId, hasPreview, onDone }) {
    const [state, setState] = useState("idle"); // idle | loading | done | error

    const generate = useCallback(async () => {
        setState("loading");
        try {
            const res = await axios.post(
                `/api/scenes?sceneId=${encodeURIComponent(sceneId)}&preview`
            );
            onDone?.(res.data);
            setState("done");
            setTimeout(() => setState("idle"), 3000);
        } catch (err) {
            setState("error");
            setTimeout(() => setState("idle"), 3000);
        }
    }, [sceneId, onDone]);

    const loading = state === "loading";
    const done = state === "done";
    const error = state === "error";

    return (
        <button
            className={[
                styles["footer__preview"],
                loading ? styles["footer__preview--loading"] : "",
                done ? styles["footer__preview--done"] : "",
                error ? styles["footer__preview--error"] : "",
            ].join(" ")}
            onClick={generate}
            disabled={loading}
            title={hasPreview ? "Regenerate preview clip" : "Generate preview clip from video.mp4"}
        >
            {loading ? (
                <><span className={styles["footer__preview-ring"]} /> Generating…</>
            ) : done ? (
                <><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l3 3 5-5" /></svg> Done</>
            ) : error ? (
                "Failed — retry?"
            ) : (
                <>
                    {/* film strip icon */}
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="1" y="3" width="14" height="10" rx="1" />
                        <line x1="1" y1="6" x2="4" y2="6" />
                        <line x1="1" y1="10" x2="4" y2="10" />
                        <line x1="12" y1="6" x2="15" y2="6" />
                        <line x1="12" y1="10" x2="15" y2="10" />
                        <rect x="5" y="5" width="6" height="6" rx="0.5" />
                    </svg>
                    {hasPreview ? "Regen preview" : "Gen preview"}
                </>
            )}
        </button>
    );
}

// ─── Main modal ───────────────────────────────────────────────────────────────
export default function EditScene({ scene, onClose, onUpdated }) {
    const { prefix: initPrefix, num: initNum } = parseSceneId(scene.sceneId);

    const [step, setStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [succeeded, setSucceeded] = useState(false);
    const [error, setError] = useState("");
    const [sceneIdError, setSceneIdError] = useState("");
    const [models, setModels] = useState([]);
    const [loadingModels, setLoadingModels] = useState(false);

    // Track whether preview exists — initialised from scene prop
    const [hasPreview, setHasPreview] = useState(!!scene.preview);

    const [form, setFormState] = useState({
        sceneIdPrefix: initPrefix,
        sceneIdNum: initNum,
        title: scene.title,
        production: scene.production,
    });

    const origForm = { sceneId: scene.sceneId, title: scene.title, production: scene.production };
    const origCast = (scene.models ?? []).map(m => m.name);
    const [cast, setCast] = useState([...origCast]);

    const origTags = Object.fromEntries(ALL_TAGS.map(t => [t, !!(scene.tags?.[t])]));
    const [tags, setTags] = useState({ ...origTags });

    const [coverFile, setCoverFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState("");

    const setField = useCallback((key, val) => { setFormState(f => ({ ...f, [key]: val })); setError(""); if (key === "sceneIdPrefix" || key === "sceneIdNum") setSceneIdError(""); }, []);
    const toggleTag = useCallback(t => setTags(p => ({ ...p, [t]: !p[t] })), []);
    const toggleCast = useCallback(n => setCast(p => p.includes(n) ? p.filter(x => x !== n) : [...p, n]), []);
    const onCover = useCallback(f => { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); }, []);

    // Called when preview generation succeeds — bubble updated scene up and mark as having preview
    const onPreviewDone = useCallback(updatedScene => {
        setHasPreview(true);
        onUpdated?.(updatedScene);
    }, [onUpdated]);

    useEffect(() => {
        if (step !== 1 || models.length > 0) return;
        setLoadingModels(true);
        axios.get("/api/models")
            .then(r => setModels(r.data ?? []))
            .catch(() => setError("Failed to load models"))
            .finally(() => setLoadingModels(false));
    }, [step, models.length]);

    const checkSceneId = useCallback(async () => {
        const { sceneIdPrefix, sceneIdNum } = form;
        if (!sceneIdPrefix || !sceneIdNum) return false;
        const newId = `${sceneIdPrefix} ${sceneIdNum}`;
        if (newId === scene.sceneId) return true;
        try {
            await axios.get(`/api/scenes?sceneId=${encodeURIComponent(newId)}`);
            setSceneIdError(`${newId} already exists.`);
            return false;
        } catch (err) {
            if (err.response?.status === 404) { setSceneIdError(""); return true; }
            return true;
        }
    }, [form, scene.sceneId]);

    const next = async (currentStep) => {
        setError("");
        if (currentStep === 0) {
            if (!form.sceneIdPrefix) { setError("Select a scene ID prefix."); return; }
            if (!form.sceneIdNum || Number(form.sceneIdNum) < 1) { setError("Enter a valid scene number."); return; }
            const unique = await checkSceneId();
            if (!unique) return;
            if (sceneIdError) return;
            if (!form.title.trim()) { setError("Title is required."); return; }
            if (!form.production.trim()) { setError("Production is required."); return; }
        }
        if (currentStep === 1 && cast.length === 0) { setError("Cast cannot be empty."); return; }
        setStep(currentStep + 1);
    };

    const back = () => { setError(""); setStep(s => s - 1); };

    const newSceneId = `${form.sceneIdPrefix} ${form.sceneIdNum}`;
    const anythingChanged = (
        newSceneId !== scene.sceneId ||
        form.title !== scene.title ||
        form.production !== scene.production ||
        JSON.stringify(cast.slice().sort()) !== JSON.stringify(origCast.slice().sort()) ||
        ALL_TAGS.some(t => tags[t] !== origTags[t]) ||
        !!coverFile
    );

    const submit = async (handleClose) => {
        if (!anythingChanged) { handleClose(); return; }
        setSubmitting(true);
        setError("");
        try {
            const fd = new FormData();
            if (newSceneId !== scene.sceneId) fd.append("sceneId", newSceneId);
            if (form.title !== scene.title) fd.append("title", form.title);
            if (form.production !== scene.production) fd.append("production", form.production);
            cast.forEach(n => fd.append("pornstars[]", n));
            fd.append("tags", JSON.stringify(tags));
            if (coverFile) fd.append("cover", coverFile);

            const res = await axios.patch(
                `/api/scenes?sceneId=${encodeURIComponent(scene.sceneId)}`,
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

    const displaySceneId = (form.sceneIdPrefix && form.sceneIdNum && Number(form.sceneIdNum) > 0)
        ? `${form.sceneIdPrefix} ${form.sceneIdNum}` : "—";

    const stepContent = () => {
        if (step === 0) return <StepDetails form={form} origSceneId={scene.sceneId} setField={setField} sceneIdError={sceneIdError} />;
        if (step === 1) return <StepCast selected={cast} origCast={origCast} onToggle={toggleCast} models={models} loadingModels={loadingModels} />;
        if (step === 2) return <StepTags tags={tags} origTags={origTags} onToggle={toggleTag} />;
        if (step === 3) return <StepMedia coverFile={coverFile} coverPreview={coverPreview} existingCover={scene.cover} onCover={onCover} />;
        if (step === 4) return <StepConfirm form={form} origForm={origForm} cast={cast} origCast={origCast} tags={tags} origTags={origTags} coverPreview={coverPreview} existingCover={scene.cover} />;
    };

    return (
        <Base onClose={onClose}>
            {({ handleClose }) => (<>
                {succeeded ? (
                    <div className={styles["success"]}>
                        <div className={styles["success__ring"]}>
                            <svg viewBox="0 0 52 52" fill="none">
                                <circle cx="26" cy="26" r="24" stroke="currentColor" strokeWidth="1.5" className={styles["success__ring-circle"]} />
                                <path d="M14 26l9 9 15-15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles["success__ring-check"]} />
                            </svg>
                        </div>
                        <h3 className={styles["success__title"]}>{newSceneId}</h3>
                        <p className={styles["success__sub"]}>{form.title}</p>
                        <p className={styles["success__note"]}>Scene updated</p>
                    </div>
                ) : (<>
                    <div className={styles.header}>
                        <h2 className={styles["header__title"]}>{scene.sceneId}</h2>
                        <button className={styles["header__close"]} onClick={handleClose} aria-label="Close">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    <StepBar current={step} />

                    <div className={styles["summary-bar"]}>
                        <span className={styles["summary-bar__id"]}>{displaySceneId}</span>
                        <span className={styles["summary-bar__sep"]}>·</span>
                        <span className={styles["summary-bar__title"]}>{form.title}</span>
                        <span className={styles["summary-bar__cast"]}>{cast.length} model{cast.length !== 1 ? "s" : ""}</span>
                    </div>

                    <div className={styles.body}>{stepContent()}</div>

                    {error && (
                        <div className={styles.error}>
                            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4h1.5v4.5h-1.5V5zm0 6h1.5v1.5h-1.5V11z" /></svg>
                            {error}
                        </div>
                    )}

                    {/* ── Footer ── */}
                    <div className={styles.footer}>
                        {/* Left — back nav */}
                        {step > 0
                            ? <button className={styles["footer__back"]} onClick={back}>← Back</button>
                            : <span />}

                        {/* Centre — preview generator, always visible */}
                        <PreviewButton
                            sceneId={scene.sceneId}
                            hasPreview={hasPreview}
                            onDone={onPreviewDone}
                        />

                        {/* Right — next / submit */}
                        {step < STEPS.length - 1
                            ? <button className={styles["footer__next"]} onClick={() => next(step)}>Continue <span>→</span></button>
                            : <button
                                className={[styles["footer__submit"], submitting ? styles["footer__submit--loading"] : ""].join(" ")}
                                onClick={() => submit(handleClose)}
                                disabled={submitting}
                            >
                                {submitting ? <><span className={styles["footer__submit-ring"]} /> Saving…</> : anythingChanged ? "Save changes" : "No changes"}
                            </button>
                        }
                    </div>
                </>)}
            </>)}
        </Base>
    );
}   