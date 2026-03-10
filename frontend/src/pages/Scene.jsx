import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { HeaderPlain } from "../components/Header";
import { FooterMinimal } from "../components/Footer";
import VideoPlayerModal from "../modals/VideoPlayer";
import { useModal } from "../contexts/ModelContext";
import favicon from "../assets/favicon.png";
import styles from "./css/Scene.module.scss";
import EditScene from "../modals/EditScene";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatTag = key => key.replace(/([A-Z])/g, " $1").toLowerCase();

const getActiveTags = tags =>
  tags && typeof tags === "object" && !Array.isArray(tags)
    ? Object.keys(tags).filter(k => tags[k] === true) : [];

const PRIMARY_TAG_RULES = [
  { id: "orgy", match: t => t.includes("orgy") },
  { id: "straight+couple", match: t => t.includes("straight") && t.includes("couple") },
  { id: "gangbang", match: t => t.includes("gangbang") },
  { id: "threesome", match: t => t.includes("threesome") },
  { id: "anal+couple", match: t => t.includes("anal") && t.includes("couple") },
];

const getPrimaryTag = tags => {
  const active = getActiveTags(tags);
  const rule = PRIMARY_TAG_RULES.find(r => r.match(active));
  return rule ? rule.id : (active[0] ?? null);
};

// ─── Play SVG (hero cover) ────────────────────────────────────────────────────
function PlaySVG({ size = 80 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="38" stroke="rgba(255,255,255,0.22)" strokeWidth="2" />
      <polygon points="33,23 61,40 33,57" fill="white" opacity="0.92" />
    </svg>
  );
}

// ─── Strip card ───────────────────────────────────────────────────────────────
function StripCard({ scene, index = 0 }) {
    const models = scene.models.map(m => m.name).join(", ");
    const hasPreview = !!scene.sneak;

    const videoRef = useRef(null);
    const timerRef = useRef(null);
    const [active, setActive] = useState(false);

    const startPreview = useCallback(() => {
        if (!hasPreview) return;
        timerRef.current = setTimeout(() => {
            setActive(true);
            videoRef.current?.play();
        }, 1000);
    }, [hasPreview]);

    const stopPreview = useCallback(() => {
        clearTimeout(timerRef.current);
        setActive(false);
        const v = videoRef.current;
        if (!v) return;
        v.pause();
        v.currentTime = 0;
    }, []);

    return (
        <Link
            className={styles["sc"]}
            to={`/scene/${encodeURIComponent(scene.sceneId)}`}
            style={{ "--i": index }}
            onMouseEnter={startPreview}
            onMouseLeave={stopPreview}
        >
            <div className={styles["sc__thumb"]}>
                {/* static cover */}
                <img src={scene.cover} alt={scene.title} loading="lazy" />

                {/* preview video — only rendered when preview exists */}
                {hasPreview && (
                    <video
                        ref={videoRef}
                        className={`${styles["sc__video"]} ${active ? styles["sc__video--on"] : ""}`}
                        src={scene.sneak}
                        muted
                        loop
                        playsInline
                        preload="none"
                    />
                )}

                {/* 2s progress bar — only shown when hovering and preview not yet active */}
                {hasPreview && (
                    <div className={`${styles["sc__bar"]} ${active ? styles["sc__bar--hide"] : ""}`} />
                )}

                <div className={styles["sc__thumb-veil"]} />
            </div>

            <div className={styles["sc__meta"]}>
                <h3 className={styles["sc__meta-title"]}>{scene.title}</h3>
                <span className={styles["sc__meta-models"]}>{models}</span>
            </div>
        </Link>
    );
}


// ─── Model card ───────────────────────────────────────────────────────────────
function ModelCard({ model }) {
  const count = (model.sceneId ?? []).length;
  return (
    <Link className={styles["cin-card"]} to={`/model/${encodeURIComponent(model.name)}`}>
      <div className={styles["cin-card__img"]}>
        <img src={model.closeup} alt={model.name} />
        <div className={styles["cin-card__veil"]} />
        <div className={styles["cin-card__info"]}>
          <h3 className={styles["cin-card__info-name"]}>{model.name}</h3>
          <span className={styles["cin-card__info-count"]}>{count} scene{count !== 1 ? "s" : ""}</span>
        </div>
      </div>
    </Link>
  );
}

// ─── Pull quote ───────────────────────────────────────────────────────────────
function PullQuote({ scene }) {
  const quotes = [
    "Two people. One room. Everything stripped away but want.",
    "The oldest story — told with the kind of honesty that never gets old.",
    "Precise. Deliberate. The kind of scene that knows exactly what it is.",
    "A finish that leaves nothing unsaid.",
    "Intimate to the last moment. Nothing held back.",
    "Three is not a crowd — it's a choreography.",
    "Unrestrained. Unscripted. Utterly real.",
    "Every frame deliberate. Every moment earned.",
  ];
  const text = quotes[Math.floor(Math.random() * quotes.length)];
  return (
    <div className={styles["pull-quote"]}>
      <div className={styles["pull-quote__mark"]}>&ldquo;</div>
      <blockquote className={styles["pull-quote__text"]}>{text}</blockquote>
      <div className={styles["pull-quote__attr"]}>
        <span className={styles["pull-quote__dash"]}>—</span>
        <span className={styles["pull-quote__source"]}>{scene.production}</span>
      </div>
    </div>
  );
}

// ─── Related strip ────────────────────────────────────────────────────────────
function RelatedSection({ title, linkTo, scenes }) {
  if (!scenes.length) return null;
  return (
    <section className={styles["related"]}>
      <div className={styles["related__head"]}>
        <h3 className={styles["related__title"]}>{title}</h3>
        <Link className={styles["related__link"]} to={linkTo}>
          View all <span className={styles["related__arrow"]}>→</span>
        </Link>
      </div>
      <div className={styles["related__strip"]}>
        {scenes.map(s => <StripCard key={s._id?.$oid ?? s.sceneId} scene={s} />)}
      </div>
    </section>
  );
}

// ─── Scene stats ──────────────────────────────────────────────────────────────
function SceneStats({ scene, allScenes }) {
  if (!allScenes.length) return null;
  const total = allScenes.length;
  const prodCount = allScenes.filter(s => s.production === scene.production).length;
  const prodPct = (prodCount / total) * 100;
  const studioMap = allScenes.reduce((a, s) => { a[s.production] = (a[s.production] || 0) + 1; return a; }, {});
  const topStudios = Object.entries(studioMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const barMax = topStudios[0]?.[1] ?? 1;
  const R = 72, cx = 90, cy = 90, strokeW = 16, circ = 2 * Math.PI * R;
  const otherCount = total - topStudios.reduce((s, [, c]) => s + c, 0);
  const segs = [...topStudios.map(([name, count]) => ({ name, count, isThis: name === scene.production })), { name: "Other", count: otherCount, isThis: false }];
  const palette = ["#9dc9a0", "#6aaa6e", "#c9a0a0", "#a08080", "#7aaa8a", "#5a8a6a", "#444"];
  let cum = 0;
  const arcs = segs.map((seg, i) => {
    const filled = (seg.count / total) * circ;
    const rotate = (cum / total) * 360 - 90;
    cum += seg.count;
    return { ...seg, filled, rotate, color: palette[i] ?? "#333" };
  });

  return (
    <div className={styles["stats-section"]}>
      <div className={styles["stats-section__eyebrow"]}>
        <span className={styles["stats-section__eyebrow-rule"]} />
        <span className={styles["stats-section__eyebrow-label"]}>Collection data</span>
      </div>
      <div className={styles["stats-grid"]}>
        <div className={styles["scard"]}>
          <span className={styles["scard__label"]}>Production share</span>
          <div className={styles["scard__value"]}>{prodPct.toFixed(0)}<span className={styles["scard__unit"]}>%</span></div>
          <p className={styles["scard__desc"]}>{prodCount} of {total} scenes from {scene.production}.</p>
          <div className={styles["scard__bar"]}><div className={styles["scard__bar-fill"]} style={{ width: `${prodPct}%` }} /></div>
        </div>
        <div className={styles["scard"]}>
          <span className={styles["scard__label"]}>Studio output</span>
          <div className={styles["hbar-list"]}>
            {topStudios.map(([name, count]) => (
              <div key={name} className={`${styles["hbar"]} ${name === scene.production ? styles["hbar--active"] : ""}`}>
                <span className={styles["hbar__label"]}>{name}</span>
                <div className={styles["hbar__track"]}><div className={styles["hbar__fill"]} style={{ width: `${(count / barMax) * 100}%` }} /></div>
                <span className={styles["hbar__count"]}>{count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={styles["scard"]}>
          <span className={styles["scard__label"]}>Collection split</span>
          <div className={styles["donut-wrap"]}>
            <svg className={styles["donut-svg"]} viewBox="0 0 180 180">
              {arcs.map((arc, i) => (
                <circle key={i} cx={cx} cy={cy} r={R} fill="none"
                  stroke={arc.color} strokeWidth={strokeW}
                  strokeDasharray={`${arc.filled} ${circ - arc.filled}`}
                  transform={`rotate(${arc.rotate} ${cx} ${cy})`}
                  opacity={arc.isThis ? 1 : 0.18} />
              ))}
              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" className={styles["donut-val"]}>{prodPct.toFixed(0)}%</text>
            </svg>
            <ul className={styles["donut-legend"]}>
              {arcs.slice(0, 5).map((arc, i) => (
                <li key={i} className={`${styles["donut-item"]} ${arc.isThis ? styles["donut-item--active"] : ""}`}>
                  <span className={styles["donut-item__dot"]} style={{ background: arc.color }} />
                  <span className={styles["donut-item__name"]}>{arc.name}</span>
                  <span className={styles["donut-item__count"]}>{arc.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ScenePage() {
  const { id } = useParams();
  const sceneId = decodeURIComponent(id);

  const [scene, setScene] = useState(null);
  const [featuredModels, setFeaturedModels] = useState([]);
  const [favourites, setFavourites] = useState([]);
  const [relatedByTag, setRelatedByTag] = useState([]);
  const [relatedBySite, setRelatedBySite] = useState([]);
  const [allScenes, setAllScenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { openModal, closeModal, modal } = useModal();
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const link = document.querySelector("link[rel='icon']");
    if (link) link.href = favicon;
    const controller = new AbortController();
    const sig = { signal: controller.signal };

    axios.get(`/api/scenes?sceneId=${encodeURIComponent(sceneId)}`, sig)
      .then(res => {
        const found = Array.isArray(res.data) ? res.data[0] : res.data;
        if (!found) { setError("Scene not found."); setLoading(false); return; }
        setScene(found);
        document.title = `Max — ${found.title}`;
        const primaryTag = getPrimaryTag(found.tags);
        const modelNames = (found.models ?? []).map(m => m.name);
        return Promise.all([
          ...modelNames.map(name =>
            axios.get(`/api/models?name=${encodeURIComponent(name)}`, sig)
              .then(r => Array.isArray(r.data) ? r.data[0] : r.data).catch(() => null)
          ),
          axios.get(`/api/scenes?tags=favourite&limit=8`, sig),
          primaryTag ? axios.get(`/api/scenes?tags=${encodeURIComponent(primaryTag)}&limit=10`, sig) : Promise.resolve({ data: [] }),
          axios.get(`/api/scenes?production=${encodeURIComponent(found.production)}&limit=10`, sig),
          axios.get(`/api/scenes`, sig),
        ]).then(results => {
          const mc = modelNames.length;
          setFeaturedModels(results.slice(0, mc).filter(Boolean));
          setFavourites((results[mc].data ?? []).filter(s => s.sceneId !== found.sceneId));
          setRelatedByTag((results[mc + 1].data ?? []).filter(s => s.sceneId !== found.sceneId));
          setRelatedBySite((results[mc + 2].data ?? []).filter(s => s.sceneId !== found.sceneId));
          setAllScenes(results[mc + 3].data ?? []);
          setLoading(false);
        });
      })
      .catch(err => { if (!axios.isCancel(err)) { setError(err.message); setLoading(false); } });

    return () => controller.abort();
  }, [sceneId]);

  const handleUpdated = (updated) => {
    setScene(updated);
    setEditing(false);
  };



  if (loading) return <><HeaderPlain /><div className={styles["sp-state"]}><div className={styles["sp-state__ring"]} /></div></>;
  if (error) return <><HeaderPlain /><div className={`${styles["sp-state"]} ${styles["sp-state--err"]}`}>{error}</div></>;

  const activeTags = getActiveTags(scene.tags);
  const primaryTag = getPrimaryTag(scene.tags);

  return (
    <>
      <HeaderPlain />

      {/* ══════════ HERO */}
      <div className={styles["hero"]}>
        <div className={styles["hero__backdrop"]}>
          <img className={styles["hero__img"]} src={scene.cover} alt={scene.title} />
          <div className={styles["hero__vignette"]} />
        </div>

        {/* Centered play button */}
        <button className={styles["hero__play-btn"]} onClick={() => openModal("video", { scene })} aria-label="Play scene">
          <PlaySVG size={80} />
        </button>

        {/* Content row — left info + right favourites */}
        <div className={styles["hero__body"]}>
          <div className={styles["hero__left"]}>
            <p className={styles["hero__studio"]}>{scene.production}</p>
            <h1 className={styles["hero__title"]}>{scene.title}</h1>
            <div className={styles["hero__badges"]}>
              <button
                className={styles["hero__edit-btn"]}
                onClick={() => setEditing(true)}
                aria-label="Edit scene">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11.5 2.5a1.414 1.414 0 012 2L5 13H3v-2L11.5 2.5z" />
                </svg>
                Edit
              </button>
              <span className={styles["badge"]}>TV-MA</span>
              <span className={styles["badge"]}>HD</span>
              <span className={`${styles["badge"]} ${styles["badge--pill"]}`}>18+</span>
            </div>
            <p className={styles["hero__desc"]}>
              Every frame deliberate, every moment earned. This scene doesn't rush —
              it builds, lingers, and delivers with the kind of confidence that only
              comes from knowing exactly what it is. Curated for this collection
              because nothing less would do.
            </p>
            {activeTags.length > 0 && (
              <div className={styles["hero__tags"]}>
                {activeTags.map(t => (
                  <Link key={t} className={styles["hero__tag"]} to={`/scenes?tags=${t}`}>{formatTag(t)}</Link>
                ))}
              </div>
            )}
          </div>

          {editing && (
            <EditScene
              scene={scene}
              onClose={() => setEditing(false)}
              onUpdated={handleUpdated}
            />
          )}

          {favourites.length > 0 && (
            <div className={styles["hero__favs"]}>
              <p className={styles["hero__favs-label"]}>— Favourites —</p>
              <div className={styles["hero__favs-strip"]}>
                {favourites.map(s => (
                  <Link key={s._id?.$oid ?? s.sceneId} className={styles["fav-tile"]}
                    to={`/scene/${encodeURIComponent(s.sceneId)}`}>
                    <img src={s.cover} alt={s.title} loading="lazy" />
                    <div className={styles["fav-tile__shine"]} />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════ CONTENT */}
      <div className={styles["content"]}>
        {featuredModels.length > 0 && (
          <div className={styles["featuring"]}>
            <span className={styles["eyebrow"]}>Featuring</span>
            <div className={styles["featuring__list"]}>
              {featuredModels.map(m => <ModelCard key={m.name} model={m} />)}
            </div>
          </div>
        )}
        <PullQuote scene={scene} />
      </div>

      {/* ══════════ STATS */}
      <SceneStats scene={scene} allScenes={allScenes} />

      {/* ══════════ RELATED */}
      <RelatedSection title={`More from ${scene.production}`} linkTo={`/scenes?production=${encodeURIComponent(scene.production)}`} scenes={relatedBySite} />

      <RelatedSection title="Similar scenes" linkTo={`/scenes?tags=${encodeURIComponent(primaryTag)}`} scenes={relatedByTag} />

      <FooterMinimal />

      {/* ══════════ VIDEO MODAL */}
      {modal?.type === "video" && (
        <VideoPlayerModal scene={modal.payload.scene} onClose={closeModal} />
      )}
    </>
  );
}