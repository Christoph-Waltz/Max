import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import { HeaderWithSearch } from "../components/Header";
import { FooterMinimal } from "../components/Footer";
import favicon from "../assets/favicon.png";
import styles from "./css/Scenes.module.scss";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatTag = key =>
  key === "none" ? "All" : key.replace(/([A-Z])/g, " $1").trim();

const getActiveTags = tags =>
  tags && typeof tags === "object" && !Array.isArray(tags)
    ? Object.keys(tags).filter(k => tags[k] === true)
    : [];

// ─── Scene card ───────────────────────────────────────────────────────────────
function SceneCard({ scene, index = 0 }) {
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

// ─── Tag chip ─────────────────────────────────────────────────────────────────
function Chip({ value, active, onClick }) {
  return (
    <button
      className={`${styles["chip"]} ${active ? styles["chip--active"] : ""}`}
      onClick={onClick}
    >
      {formatTag(value)}
    </button>
  );
}

// ─── Site pill ────────────────────────────────────────────────────────────────
function SitePill({ value, active, onClick }) {
  return (
    <button
      className={`${styles["site-pill"]} ${active ? styles["site-pill--active"] : ""}`}
      onClick={onClick}
    >
      {value === "none" ? "All sites" : value}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ScenesPage() {
  const [scenes, setScenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [activeTags, setActiveTags] = useState(() => {
    const t = searchParams.get("tags");
    return t ? t.split("+") : ["none"];
  });
  const [activeWebsites, setActiveWebsites] = useState(() => {
    const w = searchParams.get("production");
    return w ? w.split(",") : ["none"];
  });

  // ── Title work ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let link = document.querySelector("link[rel='icon']");
    link.href = favicon;
    document.title = "Max — Discover a Vast Collection of Porn Scenes";
  }, []);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();
    axios
      .get("/api/scenes", { signal: controller.signal })
      .then(res => { setScenes(res.data); setLoading(false); })
      .catch(err => { if (!axios.isCancel(err)) { setError(err.message); setLoading(false); } });
    return () => controller.abort();
  }, []);

  // ── Derived lists ──────────────────────────────────────────────────────────
  const allTagKeys = useMemo(() => {
    const keys = new Set();
    scenes.forEach(s => getActiveTags(s.tags).forEach(k => keys.add(k)));
    return ["none", ...keys];
  }, [scenes]);

  const allSites = useMemo(
    () => ["none", ...new Set(scenes.map(s => s.production).filter(Boolean))],
    [scenes]
  );

  // ── Sync → URL ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    const rt = activeTags.filter(t => t !== "none");
    const rw = activeWebsites.filter(w => w !== "none");
    if (rt.length) params.tags = rt.join("+");
    if (rw.length) params.production = rw.join(",");
    setSearchParams(params, { replace: true });
  }, [search, activeTags, activeWebsites, setSearchParams]);

  const handleSearch = e => {
    setSearch(e.target.value);
    if (e.target.value.trim()) {
      setActiveTags(["none"]);
      setActiveWebsites(["none"]);
    }
  };

  const toggleFilter = (value, setList) => {
    if (value === "none") { setList(["none"]); return; }
    setList(prev => {
      const without = prev.filter(v => v !== "none");
      const next = without.includes(value)
        ? without.filter(v => v !== value)
        : [...without, value];
      return next.length === 0 ? ["none"] : next;
    });
  };

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let r = scenes;
    if (search.trim())
      r = r.filter(s => s.title.toLowerCase().includes(search.toLowerCase()));
    if (!activeTags.includes("none") && activeTags.length > 0)
      r = r.filter(s => activeTags.every(t => s.tags?.[t] === true));
    if (!activeWebsites.includes("none") && activeWebsites.length > 0)
      r = r.filter(s => activeWebsites.includes(s.production));
    return r;
  }, [scenes, search, activeTags, activeWebsites]);

  return (
    <>
      <HeaderWithSearch search={search} onSearchChange={handleSearch} />

      {/* ══════════════════════════════════ FILTER MASTHEAD */}
      <section className={styles["masthead"]}>
        <div className={styles["masthead__inner"]}>

          <div className={styles["masthead__top"]}>
            <div className={styles["masthead__top-left"]}>
              <h1 className={styles["masthead__top-left-title"]}>Explore the catalogue</h1>
            </div>
            <div className={styles["masthead__top-right"]}>
              <span className={styles["masthead__top-right-count"]}>
                {loading ? "—" : filtered.length}
              </span>
              <span className={styles["masthead__top-right-label"]}>
                {filtered.length === 1 ? "scene" : "scenes"}
              </span>
            </div>
          </div>

          <div className={styles["masthead__divider"]} />

          <div className={styles["masthead__row"]}>
            <span className={styles["masthead__row-label"]}>Tags</span>
            <div className={styles["masthead__row-chips"]}>
              {allTagKeys.map(tag => (
                <Chip
                  key={tag}
                  value={tag}
                  active={activeTags.includes(tag)}
                  onClick={() => toggleFilter(tag, setActiveTags)}
                />
              ))}
            </div>
          </div>

          <div className={styles["masthead__divider"]} />

          <div className={styles["masthead__row"]}>
            <span className={styles["masthead__row-label"]}>Sites</span>
            <div className={`${styles["masthead__row-chips"]} ${styles["masthead__row-chips--scroll"]}`}>
              {allSites.map(site => (
                <SitePill
                  key={site}
                  value={site}
                  active={activeWebsites.includes(site)}
                  onClick={() => toggleFilter(site, setActiveWebsites)}
                />
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════ GRID */}
      <main className={styles["scenes-main"]}>
        {loading && (
          <div className={styles["scenes-main__state"]}>
            <div className={styles["scenes-main__state-ring"]} />
          </div>
        )}
        {error && (
          <p className={`${styles["scenes-main__state-msg"]} ${styles["scenes-main__state-msg--error"]}`}>
            Failed to load scenes.
          </p>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className={styles["scenes-main__empty"]}>
            <span className={styles["scenes-main__empty-glyph"]}>Ø</span>
            <p className={styles["scenes-main__empty-text"]}>No scenes match your filters.</p>
          </div>
        )}
        {!loading && !error && filtered.length > 0 && (
          <div className={styles["scenes-grid"]}>
            {filtered.map((scene, i) => (
              <SceneCard
                key={scene._id?.$oid ?? scene.sceneId}
                scene={scene}
                index={i}
              />
            ))}
          </div>
        )}
      </main>

      <FooterMinimal />
    </>
  );
}