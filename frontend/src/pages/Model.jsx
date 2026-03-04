import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { HeaderPlain } from "../components/Header";
import { FooterMinimal } from "../components/Footer";
import favicon from "../assets/favicon.png";
import styles from "./css/Model.module.scss";
import EditModel from "../modals/EditModel";

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ on }) {
  return (
    <span className={`${styles["toggle"]} ${on ? styles["toggle--on"] : styles["toggle--off"]}`} />
  );
}

// ─── Scene row ────────────────────────────────────────────────────────────────
function SceneRow({ scene, index }) {
  const hasPreview = !!scene.sneak;
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const [active, setActive] = useState(false);

  const startPreview = useCallback(() => {
    if (!hasPreview) return;
    timerRef.current = setTimeout(() => {
      setActive(true);
      videoRef.current?.play();
    }, 750);
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
      className={styles["scene-row"]}
      to={`/scene/${encodeURIComponent(scene.sceneId ?? scene.id)}`}
      onMouseEnter={startPreview}
      onMouseLeave={stopPreview}
    >
      <span className={styles["scene-row__index"]}>
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className={styles["scene-row__thumb"]}>
        <img src={scene.cover} alt={scene.title} loading="lazy" />

        {hasPreview && (
          <video
            ref={videoRef}
            className={`${styles["scene-row__video"]} ${active ? styles["scene-row__video--on"] : ""}`}
            src={scene.sneak}
            muted
            loop
            playsInline
            preload="none"
          />
        )}

        {hasPreview && (
          <div className={`${styles["scene-row__bar"]} ${active ? styles["scene-row__bar--hide"] : ""}`} />
        )}

        <div className={styles["scene-row__thumb-veil"]} />
      </div>

      <div className={styles["scene-row__body"]}>
        <div className={styles["scene-row__body-meta"]}>
          <span className={styles["scene-row__body-meta-studio"]}>{scene.production}</span>
          {scene.category && (
            <span className={styles["scene-row__body-meta-tag"]}>{scene.category}</span>
          )}
          <span className={styles["scene-row__body-meta-tag"]}>HD</span>
          <span className={styles["scene-row__body-meta-tag"]}>TV-MA</span>
        </div>
        <h2 className={styles["scene-row__body-title"]}>{scene.title}</h2>
        <p className={styles["scene-row__body-desc"]}>
          With each breathless whisper and lingering caress, they surrender completely,
          riding the waves of passion until nothing else in the world exists — just them,
          lost in pure, uninhibited pleasure.
        </p>
      </div>
    </Link>
  );
}

// ─── Related model card ───────────────────────────────────────────────────────
function RelatedModel({ model }) {
  return (
    <Link
      className={styles["related-card"]}
      to={`/model/${encodeURIComponent(model.name)}`}
    >
      <div className={styles["related-card__img"]}>
        <img src={model.closeup} alt={model.name} loading="lazy" />
        <div className={styles["related-card__img-gradient"]} />
      </div>
      <div className={styles["related-card__info"]}>
        <span className={styles["related-card__info-name"]}>{model.name}</span>
        <span className={styles["related-card__info-cta"]}>View profile</span>
      </div>
    </Link>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────
function StatsBar({ model, allModels, scenes }) {
  if (!allModels.length) return null;

  const total = allModels.length;

  const sameType = allModels.filter(m => m.type === model.type).length;
  const typePct = Math.round((sameType / total) * 100);
  const sameAss = allModels.filter(m => m.ass === model.ass).length;
  const assPct = Math.round((sameAss / total) * 100);
  const sameTits = allModels.filter(m => m.tits === model.tits).length;
  const titsPct = Math.round((sameTits / total) * 100);

  const bothCount = allModels.filter(m => m.tattoo && m.piercing).length;
  const tattooOnlyCount = allModels.filter(m => m.tattoo && !m.piercing).length;
  const piercingOnlyCount = allModels.filter(m => !m.tattoo && m.piercing).length;
  const cleanCount = allModels.filter(m => !m.tattoo && !m.piercing).length;
  const bothPct = Math.round((bothCount / total) * 100);
  const tattooOnlyPct = Math.round((tattooOnlyCount / total) * 100);
  const piercingOnlyPct = Math.round((piercingOnlyCount / total) * 100);
  const cleanPct = Math.round((cleanCount / total) * 100);

  const coStars = new Set(
    scenes.flatMap(s => (s.models ?? []).map(m => m.name).filter(n => n !== model.name))
  );
  const coStarList = [...coStars];
  const first = model.name.split(" ")[0];

  const inkCard = (() => {
    if (model.tattoo && model.piercing) return {
      value: `${bothPct}%`,
      heading: `${bothPct}% of this roster have both ink and metal`,
      body: `${first} is tattooed and pierced — a combination shared by just ${bothCount} out of ${total} models here. Decorated from head to toe, and unapologetically so.`,
    };
    if (model.tattoo && !model.piercing) return {
      value: `${tattooOnlyPct}%`,
      heading: `${tattooOnlyPct}% have tattoos but no piercings`,
      body: `${first} carries ink without the metal — shared by ${tattooOnlyCount} models. The art is permanent; the attitude even more so.`,
    };
    if (!model.tattoo && model.piercing) return {
      value: `${piercingOnlyPct}%`,
      heading: `${piercingOnlyPct}% are pierced but ink-free`,
      body: `${first} has piercings but no tattoos — that specific combination belongs to just ${piercingOnlyCount} out of ${total} models here. Subtle edge, clean canvas.`,
    };
    return {
      value: `${cleanPct}%`,
      heading: `${cleanPct}% of this roster are completely clean`,
      body: `No tattoos, no piercings — ${first} is among the ${cleanCount} models here who let their natural form do all the talking. Rare and refreshing.`,
    };
  })();

  const cards = [
    {
      value: `${typePct}%`,
      heading: `Only ${typePct}% of models here are ${model.type}s`,
      body: `That's ${sameType} out of ${total} — making ${first} part of a ${typePct < 30 ? "rare" : typePct < 60 ? "select" : "well-represented"} group in this collection.`,
    },
    {
      value: sameAss,
      heading: `${sameAss} models share her ${model.ass} ass`,
      body: `${assPct}% of the roster matches this body attribute. ${model.ass === "big" ? "Big is popular for a reason." : model.ass === "fat" ? "A fat ass is a rare gift." : "Small and tight — a minority worth celebrating."}`,
    },
    {
      value: `${titsPct}%`,
      heading: `${titsPct}% of models have ${model.tits} tits`,
      body: `${sameTits} out of ${total} share this trait. ${model.tits === "natural" ? "Natural is timeless and always in demand." : model.tits === "big" ? "Big tits dominate the fantasy." : "Small and perfectly formed."}`,
    },
    inkCard,
    {
      value: scenes.length,
      heading: `${scenes.length} scene${scenes.length !== 1 ? "s" : ""} in this collection`,
      body: scenes.length === 0
        ? `Nothing archived yet — but the best things are worth waiting for.`
        : `Every one of ${first}'s scenes has been personally curated. Quality over quantity${scenes.length > 10 ? ", and there's plenty of both" : ""}.`,
    },
    {
      value: coStarList.length || "—",
      heading: coStarList.length
        ? `Shared the screen with ${coStarList.length} co-star${coStarList.length !== 1 ? "s" : ""}`
        : "No co-stars on record",
      body: coStarList.length
        ? `Appeared alongside ${coStarList.slice(0, 3).join(", ")}${coStarList.length > 3 ? ` and ${coStarList.length - 3} more` : ""}. Chemistry is half the performance.`
        : `All of ${first}'s archived scenes are solo or co-stars haven't been logged yet.`,
    },
  ];

  return (
    <div className={styles["stats"]}>
      {cards.map((c, i) => (
        <div className={styles["stats__card"]} key={i}>
          <span className={styles["stats__card-value"]}>{c.value}</span>
          <h4 className={styles["stats__card-heading"]}>{c.heading}</h4>
          <p className={styles["stats__card-body"]}>{c.body}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ModelPage() {
  const { name } = useParams();
  const modelName = decodeURIComponent(name);

  const [model, setModel] = useState(null);
  const [scenes, setScenes] = useState([]);
  const [related, setRelated] = useState([]);
  const [allModels, setAllModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let link = document.querySelector("link[rel='icon']");
    link.href = favicon;

    const controller = new AbortController();
    const sig = { signal: controller.signal };

    axios.get(`/api/models?name=${encodeURIComponent(modelName)}`, sig)
      .then(res => {
        const found = Array.isArray(res.data) ? res.data[0] : res.data;
        if (!found) { setError("Model not found."); setLoading(false); return; }

        setModel(found);
        document.title = `Max — ${found.name}'s favourite porn`;

        return Promise.all([
          axios.get(`/api/scenes?model=${encodeURIComponent(found.name)}&sort`, sig),
          axios.get(`/api/models?type=${encodeURIComponent(found.type)}&limit=10`, sig),
          axios.get(`/api/models`, sig),
        ]).then(([scenesRes, relatedRes, allModelsRes]) => {
          setScenes(scenesRes.data);
          setRelated((Array.isArray(relatedRes.data) ? relatedRes.data : []).filter(m => m.name !== found.name));
          setAllModels(Array.isArray(allModelsRes.data) ? allModelsRes.data : []);
          setLoading(false);
        });
      })
      .catch(err => {
        if (!axios.isCancel(err)) { setError(err.message); setLoading(false); }
      });

    return () => controller.abort();
  }, [modelName, editing]);

  const handleUpdated = (updated) => {
    setModel(updated);
    setEditing(false);
  };

  if (loading) return (
    <>
      <HeaderPlain />
      <div className={styles["loading"]}>
        <div className={styles["loading__dots"]}>
          <span className={styles["loading__dot"]} />
          <span className={styles["loading__dot"]} />
          <span className={styles["loading__dot"]} />
        </div>
        <span className={styles["loading__label"]}>MAX</span>
      </div>
    </>
  );

  if (error) return (
    <>
      <HeaderPlain />
      <div className={styles["error"]}>{error}</div>
    </>
  );

  return (
    <>
      <HeaderPlain />

      {/* ══════════════════════════════════ HERO */}
      <div className={styles["hero"]}>
        <div className={styles["hero__bg"]}>
          <img
            className={styles["hero__bg-img"]}
            src={model.landscape}
            alt={model.name}
          />
          <div className={styles["hero__bg-fade"]} />
        </div>
        <div className={styles["hero__content"]}>
          <div className={styles["hero__content-eyeline"]}>
            <span className={styles["hero__content-eyeline-dash"]} />
            <span className={styles["hero__content-eyeline-label"]}>Model profile</span>
          </div>
          <h1 className={styles["hero__content-name"]}>{model.name}</h1>
          <p className={styles["hero__content-bio"]}>
            Filled with stunning visuals that showcase her versatility — whether it's
            the bold attitude of an editorial spread or the soft, intimate glow of a
            boudoir session. Get to know {model.name} beyond the lens, from
            behind-the-scenes moments to personal favourites and upcoming projects.
          </p>
        </div>
      </div>

      <div className={styles["page-body"]}>

        {/* ══════════════════════════════════ PROFILE STRIP */}
        <div className={styles["profile"]}>
          <span className={styles["profile__type"]}>{model.type}</span>
          <span className={styles["profile__dot"]} />
          <span className={styles["profile__stat"]}>{model.tits} tits</span>
          <span className={styles["profile__dot"]} />
          <span className={styles["profile__stat"]}>{model.pussy} pussy</span>
          <span className={styles["profile__dot"]} />
          <span className={styles["profile__stat"]}>{model.ass} ass</span>
          <span className={styles["profile__dot"]} />
          <span className={styles["profile__label"]}>Tattoo</span>
          <Toggle on={model.tattoo} />
          <span className={styles["profile__dot"]} />
          <span className={styles["profile__label"]}>Piercing</span>
          <Toggle on={model.piercing} />
          <button
            className={styles["profile__edit"]}
            onClick={() => setEditing(true)}
            aria-label="Edit model"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11.5 2.5a1.414 1.414 0 012 2L5 13H3v-2L11.5 2.5z" />
            </svg>
            Edit
          </button>
        </div>

        {editing && (
          <EditModel
            model={model}
            onClose={() => setEditing(false)}
            onUpdated={handleUpdated}
          />
        )}

        {/* ══════════════════════════════════ STATS */}
        <StatsBar model={model} allModels={allModels} scenes={scenes} />

        {/* ══════════════════════════════════ SCENES */}
        <div className={styles["scenes"]}>
          <div className={styles["scenes__head"]}>
            <span className={styles["scenes__head-eyebrow"]}>Pornography</span>
            <h2 className={styles["scenes__head-title"]}>{model.name}'s scenes</h2>
          </div>
          <div className={styles["scenes__list"]}>
            {scenes.length === 0
              ? (
                <div className={styles["scenes__empty"]}>
                  <span className={styles["scenes__empty-glyph"]}>∅</span>
                  <p className={styles["scenes__empty-text"]}>No scenes found.</p>
                </div>
              )
              : scenes.map((s, i) => (
                <SceneRow key={s.sceneId ?? s.id ?? i} scene={s} index={i} />
              ))
            }
          </div>
        </div>

        {/* ══════════════════════════════════ RELATED */}
        {related.length > 0 && (
          <div className={styles["related"]}>
            <div className={styles["related__head"]}>
              <div className={styles["related__head-left"]}>
                <span className={styles["related__head-left-eyebrow"]}>Similar models</span>
                <h3 className={styles["related__head-left-title"]}>More of her type</h3>
              </div>
              <Link className={styles["related__head-link"]} to={`/models?type=${model.type}`}>
                View all <span className={styles["related__head-arrow"]}>→</span>
              </Link>
            </div>
            <div className={styles["related__strip"]}>
              {related.map(m => <RelatedModel key={m.name} model={m} />)}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════ TAGLINE */}
        <div className={styles["tagline"]}>
          <div className={styles["tagline__quote"]}>
            <span className={styles["tagline__mark"]} aria-hidden="true">&ldquo;</span>
            <p className={styles["tagline__text"]}>
              This isn't about pleasure—it's about desire. About letting the hoe take over while the cock forgets every wall inside her asshole, not even after the cunt is wet and the bitch is still warm. They sure know how good it feels to be ruined.
            </p>
            <span className={styles["tagline__mark"]} aria-hidden="true">&rdquo;</span>
          </div>
        </div>

      </div>

      <FooterMinimal />
    </>
  );
}