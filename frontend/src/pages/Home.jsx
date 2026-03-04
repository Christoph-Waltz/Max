import favicon from "../assets/favicon.png";
import sponsor1 from "../assets/sponsor 1.png";
import sponsor2 from "../assets/sponsor 2.png";
import sponsor3 from "../assets/sponsor 3.png";
import discord_png from "../assets/discord.png";
import partner_png from "../assets/partner.png";
import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import { HeaderPlain } from "../components/Header";
import styles from "./css/Home.module.scss";


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


// ─── Scene strip section ──────────────────────────────────────────────────────
function SceneSection({ title, sub, linkTo, scenes, overlap }) {
    if (!scenes.length) return null;
    return (
        <section className={styles["scene-section"]} style={overlap ? { marginTop: "-120px", position: "relative", zIndex: 2 } : undefined}>
            <div className={styles["scene-section__head"]}>
                <div className={styles["scene-section__head-left"]}>
                    <span className={styles["scene-section__head-sub"]}>{sub}</span>
                    <h2 className={styles["scene-section__head-title"]}>{title}</h2>
                </div>
                {linkTo && (
                    <Link className={styles["scene-section__head-link"]} to={linkTo}>
                        View all <span className={styles["scene-section__head-arrow"]}>→</span>
                    </Link>
                )}
            </div>
            <div className={styles["scene-section__strip"]}>
                {scenes.map((s, i) => (
                    <SceneCard key={s._id ?? s.sceneId} scene={s} index={i} />
                ))}
            </div>
        </section>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Home() {
    const [ready, setReady] = useState(false);
    const [coverScene, setCoverScene] = useState(null);
    const [favourites, setFavourites] = useState([]);
    const [recentScenes, setRecentScenes] = useState([]);
    const [straightScenes, setStraightScenes] = useState([]);
    const [analScenes, setAnalScenes] = useState([]);
    const [topModels, setTopModels] = useState([]);
    const [sceneCount, setSceneCount] = useState(0);
    const [modelCount, setModelCount] = useState(0);
    const [stats, setStats] = useState({
        anal: 0, fmf: 0, gangbang: 0, mfm: 0, straight: 0, orgy: 0,
    });

    useEffect(() => {
        let link = document.querySelector("link[rel='icon']");
        if (link) link.href = favicon;
        document.title = "Max — A Private Adult Entertainment Platform";
    }, []);

    useEffect(() => {
        const get = url => axios.get(url).then(r => r.data).catch(() => null);

        const MODEL_NAMES = [
            "Rae Lil Black", "Catherine Knight", "Scarlett Hampton",
            "Hope Heaven", "Rika Fane", "Scarlett Alexis", "Hazel Moore",
            "Haley Reed", "Aubrey Lovelace", "Gabbie Carter",
        ];

        Promise.all([
            get("/api/scenes?cover"),
            get("/api/scenes?tags=favourite"),
            get("/api/scenes?limit=12&sort"),
            get("/api/scenes?tags=straight&limit=12"),
            get("/api/scenes?tags=anal&limit=12"),
            get(`/api/models?names=${encodeURIComponent(MODEL_NAMES.join("%2B"))}`),
            get("/api/scenes?count"),
            get("/api/models?count"),
            get("/api/scenes?tags=anal%2Bcouple&count"),
            get("/api/scenes?tags=fmf&count"),
            get("/api/scenes?tags=gangbang&count"),
            get("/api/scenes?tags=mfm&count"),
            get("/api/scenes?tags=straight%2Bcouple&count"),
            get("/api/scenes?tags=orgy&count"),
        ]).then(([
            cover, favs, recent, straight, anal, models,
            scCnt, mdCnt, anCnt, fmfCnt, gbCnt, mfmCnt, stCnt, ogCnt,
        ]) => {
            if (cover) setCoverScene(cover);
            if (favs) setFavourites(Array.isArray(favs) ? favs : []);
            if (recent) setRecentScenes(Array.isArray(recent) ? recent : []);
            if (straight) setStraightScenes(Array.isArray(straight) ? straight : []);
            if (anal) setAnalScenes(Array.isArray(anal) ? anal : []);
            if (models) setTopModels(Array.isArray(models) ? models : []);
            if (scCnt) setSceneCount(scCnt.count ?? 0);
            if (mdCnt) setModelCount(mdCnt.count ?? 0);
            setStats({
                anal: anCnt?.count ?? 0,
                fmf: fmfCnt?.count ?? 0,
                gangbang: gbCnt?.count ?? 0,
                mfm: mfmCnt?.count ?? 0,
                straight: stCnt?.count ?? 0,
                orgy: ogCnt?.count ?? 0,
            });
            setReady(true);
        });
    }, []);

    // ── Loading ───────────────────────────────────────────────────────────────
    if (!ready) return (
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

    const statTiles = [
        { label: "Straight", value: stats.straight, tag: "straight+couple" },
        { label: "Anal", value: stats.anal, tag: "anal+couple" },
        { label: "FMF", value: stats.fmf, tag: "fmf" },
        { label: "MFM", value: stats.mfm, tag: "mfm" },
        { label: "Gangbang", value: stats.gangbang, tag: "gangbang" },
        { label: "Orgy", value: stats.orgy, tag: "orgy" },
    ];

    return (
        <>
            <HeaderPlain />

            {/* ══════════════════════════════════ HERO */}
            <div className={styles["hero"]}>
                {coverScene && (
                    <div className={styles["hero__backdrop"]}>
                        <img
                            src={coverScene.cover}
                            alt={coverScene.title}
                            className={styles["hero__backdrop-img"]}
                        />
                        <div className={styles["hero__backdrop-vignette"]} />
                    </div>
                )}

                <div className={styles["hero__body"]}>

                    {/* left — scene info */}
                    {coverScene && (
                        <div className={styles["hero__content"]}>
                            <div className={styles["hero__content-eyeline"]}>
                                <span className={styles["hero__content-eyeline-dash"]} />
                                <span className={styles["hero__content-eyeline-text"]}>Newest</span>
                            </div>

                            <p className={styles["hero__content-studio"]}>{coverScene.production}</p>
                            <h1 className={styles["hero__content-title"]}>{coverScene.title}</h1>

                            <div className={styles["hero__content-badges"]}>
                                <span className={styles["hero__content-badges-pill"]}>TV-MA</span>
                                <span className={styles["hero__content-badges-pill"]}>HD</span>
                                <span className={`${styles["hero__content-badges-pill"]} ${styles["hero__content-badges-pill--outline"]}`}>18+</span>
                            </div>

                            <p className={styles["hero__content-desc"]}>
                                Handpicked for the collection. Every scene that earns this spotlight
                                does so because it demands to be seen — no filler, no compromise.
                            </p>

                            <div className={styles["hero__content-actions"]}>
                                <Link
                                    className={styles["hero__content-actions-primary"]}
                                    to={`/scene/${encodeURIComponent(coverScene.sceneId)}`}>
                                    <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor" aria-hidden>
                                        <path d="M0 0l10 6-10 6V0z" />
                                    </svg>
                                    Go to scene
                                </Link>
                                <Link className={styles["hero__content-actions-ghost"]} to="/scenes">
                                    Browse all
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* right — favourites rail */}
                    {favourites.length > 0 && (
                        <div className={styles["hero__favs"]}>
                            <p className={styles["hero__favs-label"]}>— Favourites —</p>
                            <div className={styles["hero__favs-rail"]}>
                                {favourites.map(s => (
                                    <Link
                                        key={s._id ?? s.sceneId}
                                        className={styles["hero__favs-rail-tile"]}
                                        to={`/scene/${encodeURIComponent(s.sceneId)}`}
                                    >
                                        <img src={s.cover} alt={s.title} loading="lazy" />
                                        <div className={styles["hero__favs-rail-tile-shine"]} />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* ══════════════════════════════════ RECENT */}
            <SceneSection
                title="New arrivals"
                sub="Constantly added. Never compromised."
                linkTo="/scenes"
                scenes={recentScenes}
                overlap
            />

            {/* ══════════════════════════════════ SPONSORS */}
            <div className={styles["sponsors"]}>
                <div className={styles["sponsors__head"]}>
                    <span className={styles["sponsors__head-eyebrow"]}>Official Sponsors</span>
                    <div className={styles["sponsors__head-line"]} />
                </div>
                <div className={styles["sponsors__grid"]}>
                    {[
                        { src: sponsor1, label: "Sponsor One", num: "01" },
                        { src: sponsor2, label: "Sponsor Two", num: "02" },
                        { src: sponsor3, label: "Sponsor Three", num: "03" },
                    ].map(({ src, label, num }) => (
                        <div key={label} className={styles["sponsors__card"]}>
                            <div className={styles["sponsors__card-glass"]}>
                                <div className={styles["sponsors__card-glass-glow"]} />
                                <div className={styles["sponsors__card-glass-img"]}>
                                    <img src={src} alt={label} />
                                </div>
                                <div className={styles["sponsors__card-glass-shimmer"]} />
                            </div>
                            <div className={styles["sponsors__card-foot"]}>
                                <span className={styles["sponsors__card-foot-num"]}>{num}</span>
                                <span className={styles["sponsors__card-foot-dot"]} />
                                <span className={styles["sponsors__card-foot-label"]}>{label}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ══════════════════════════════════ STRAIGHT */}
            <SceneSection
                title="Straight"
                sub="Pussy only. Finish wherever — make it count."
                linkTo="/scenes?tags=straight"
                scenes={straightScenes}
            />

            {/* ══════════════════════════════════ ANAL */}
            <SceneSection
                title="Anal"
                sub="Backdoor affairs where limits doesn't exist."
                linkTo="/scenes?tags=anal"
                scenes={analScenes}
            />

            {/* ══════════════════════════════════ DISCORD */}
            <a
                className={styles["discord"]}
                href="https://discord.com/channels/@me"
                target="_blank"
                rel="noreferrer"
            >
                <img src={discord_png} alt="Join our Discord" className={styles["discord__img"]} />
                <div className={styles["discord__overlay"]}>
                    <span className={styles["discord__overlay-eyebrow"]}>Community</span>
                    <span className={styles["discord__overlay-cta"]}>Join the server →</span>
                </div>
            </a>

            {/* ══════════════════════════════════ TOP MODELS */}
            {topModels.length > 0 && (
                <section className={styles["models-section"]}>
                    <div className={styles["models-section__head"]}>
                        <div className={styles["models-section__head-left"]}>
                            <span className={styles["models-section__head-sub"]}>Performers</span>
                            <h2 className={styles["models-section__head-title"]}>Top models</h2>
                        </div>
                        <Link className={styles["models-section__head-link"]} to="/models">
                            View all <span className={styles["models-section__head-arrow"]}>→</span>
                        </Link>
                    </div>
                    <div className={styles["models-section__strip"]}>
                        {topModels.map((m, i) => (
                            <Link
                                key={m._id ?? m.name}
                                className={styles["mc"]}
                                to={`/model/${encodeURIComponent(m.name)}`}
                                style={{ "--i": i }}
                            >
                                <div className={styles["mc__img"]}>
                                    <img src={m.portrait} alt={m.name} loading="lazy" />
                                    <div className={styles["mc__img-gradient"]} />
                                </div>
                                <div className={styles["mc__info"]}>
                                    <h3 className={styles["mc__info-name"]}>{m.name}</h3>
                                    <span className={styles["mc__info-cta"]}>View profile →</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* ══════════════════════════════════ STATS */}
            <section className={styles["stats"]}>
                <div className={styles["stats__header"]}>
                    <span className={styles["stats__header-eyebrow"]}>The archive</span>
                    <h2 className={styles["stats__header-title"]}>What's in the collection</h2>
                </div>

                <div className={styles["stats__totals"]}>
                    <div className={styles["stats__totals-card"]}>
                        <span className={styles["stats__totals-card-num"]}>{sceneCount}</span>
                        <span className={styles["stats__totals-card-label"]}>Total scenes</span>
                        <div className={styles["stats__totals-card-bar"]} />
                    </div>
                    <div className={styles["stats__totals-divider"]} />
                    <div className={styles["stats__totals-card"]}>
                        <span className={`${styles["stats__totals-card-num"]} ${styles["stats__totals-card-num--rose"]}`}>
                            {modelCount}
                        </span>
                        <span className={styles["stats__totals-card-label"]}>Total models</span>
                        <div className={`${styles["stats__totals-card-bar"]} ${styles["stats__totals-card-bar--rose"]}`} />
                    </div>
                </div>

                <div className={styles["stats__grid"]}>
                    {statTiles.map(({ label, value, tag }) => (
                        <Link
                            key={label}
                            className={styles["stats__grid-tile"]}
                            to={`/scenes?tags=${encodeURIComponent(tag)}`}
                        >
                            <span className={styles["stats__grid-tile-num"]}>{value}</span>
                            <span className={styles["stats__grid-tile-label"]}>{label}</span>
                            <span className={styles["stats__grid-tile-arrow"]}>→</span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* ══════════════════════════════════ PARTNER */}
            <div className={styles["partner"]}>
                <div className={styles["partner__text"]}>
                    <span className={styles["partner__text-eyebrow"]}>Official partner</span>
                    <h3 className={styles["partner__text-heading"]}>Local expertise. Global resources.</h3>
                    <p className={styles["partner__text-sub"]}>In collaboration since day one.</p>
                </div>
                <img src={partner_png} alt="Partner" className={styles["partner__logo"]} />
            </div>

            <Footer />
        </>
    );
}