import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import { HeaderWithSearch } from "../components/Header";
import { FooterMinimal } from "../components/Footer";
import favicon from "../assets/favicon.png";
import styles from "./css/Models.module.scss";

const LETTERS = ["All", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
const TYPES = ["babe", "milf", "petite"];
const RANKS = ["mature", "naughty", "slut"];
const BOOBS = [["big", "Big tits"], ["natural", "Natural"], ["small", "Small"]];
const PUSSY_OPTS = [["clean", "Clean"], ["bush", "Bush"], ["hairy", "Hairy"]];
const ASS_OPTS = [["fat", "Fat ass"], ["big", "Big ass"], ["tiny", "Tiny ass"]];

// ─── Folder accordion ─────────────────────────────────────────────────────────
function Folder({ title, children }) {
    const [open, setOpen] = useState(false);
    return (
        <div className={styles["folder"]}>
            <button
                className={styles["folder__header"]}
                onClick={() => setOpen(o => !o)}
            >
                <span className={`${styles["folder__header-arrow"]} ${open ? styles["folder__header-arrow--open"] : ""}`}>
                    ▶
                </span>
                <span className={styles["folder__header-title"]}>{title}</span>
            </button>
            <ul className={`${styles["folder__list"]} ${open ? styles["folder__list--open"] : ""}`}>
                {children}
            </ul>
        </div>
    );
}

// ─── Filter item ──────────────────────────────────────────────────────────────
function FilterItem({ label, name, value, type = "radio", checked, onToggle }) {
    return (
        <li
            className={styles["filter-item"]}
            onClick={() => onToggle(name, value)}
        >
            <span className={`${styles["filter-item__indicator"]} ${styles[`filter-item__indicator--${type}`]} ${checked ? styles["filter-item__indicator--checked"] : ""}`} />
            <span className={`${styles["filter-item__label"]} ${checked ? styles["filter-item__label--checked"] : ""}`}>
                {label}
            </span>
        </li>
    );
}

// ─── Model card ───────────────────────────────────────────────────────────────
function ModelCard({ model, index = 0 }) {
    return (
        <Link
            className={styles["model-card"]}
            to={`/model/${encodeURIComponent(model.name)}`}
            style={{ "--i": index % 24 }}
        >
            <div className={styles["model-card__img"]}>
                <img
                    src={model.portrait}
                    alt={model.name}
                    className={styles["model-card__img-photo"]}
                    loading="lazy"
                />
                <div className={styles["model-card__img-gradient"]} />
            </div>
            <div className={styles["model-card__foot"]}>
                <span className={styles["model-card__foot-name"]}>{model.name}</span>
            </div>
        </Link>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ModelsPage() {
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();

    const [search, setSearch] = useState(searchParams.get("search") ?? "");
    const [letter, setLetter] = useState(searchParams.get("letter") ?? "All");
    const [type, setType] = useState(searchParams.get("type") ?? "");
    const [rank, setRank] = useState(searchParams.get("rank") ?? "");
    const [boobs, setBoobs] = useState(searchParams.get("tits") ?? "");
    const [pussy, setPussy] = useState(searchParams.get("pussy") ?? "");
    const [ass, setAss] = useState(searchParams.get("ass") ?? "");
    const [tattoo, setTattoo] = useState(searchParams.get("tattoo") === "1");
    const [piercing, setPiercing] = useState(searchParams.get("piercing") === "1");
    const [clean, setClean] = useState(searchParams.get("clean") === "1");

    // ── Title work & Fetch ─────────────────────────────────────────────────────
    useEffect(() => {
        let link = document.querySelector("link[rel='icon']");
        link.href = favicon;
        document.title = "Max — Browse Profiles of Top Models";

        const controller = new AbortController();
        axios
            .get("/api/models", { signal: controller.signal })
            .then(res => { setModels(res.data); setLoading(false); })
            .catch(err => { if (!axios.isCancel(err)) { setError(err.message); setLoading(false); } });
        return () => controller.abort();
    }, []);

    // ── Sync → URL ─────────────────────────────────────────────────────────────
    useEffect(() => {
        const params = {};
        if (search) params.search = search;
        if (letter !== "All") params.letter = letter;
        if (type) params.type = type;
        if (rank) params.rank = rank;
        if (boobs) params.tits = boobs;
        if (pussy) params.pussy = pussy;
        if (ass) params.ass = ass;
        if (tattoo) params.tattoo = "1";
        if (piercing) params.piercing = "1";
        if (clean) params.clean = "1";
        setSearchParams(params, { replace: true });
    }, [search, letter, type, rank, boobs, pussy, ass, tattoo, piercing, clean, setSearchParams]);

    const handleSearch = e => {
        setSearch(e.target.value);
        if (e.target.value.trim()) {
            setType(""); setRank(""); setBoobs(""); setPussy(""); setAss("");
            setTattoo(false); setPiercing(false); setClean(false); setLetter("All");
        }
    };

    const toggleRadio = useCallback((name, value) => {
        if (name === "tattoo") { setTattoo(v => !v); setClean(false); return; }
        if (name === "piercing") { setPiercing(v => !v); setClean(false); return; }
        if (name === "clean") { setClean(v => { if (!v) { setTattoo(false); setPiercing(false); } return !v; }); return; }
        const map = {
            type: [type, setType],
            rank: [rank, setRank],
            tits: [boobs, setBoobs],
            pussy: [pussy, setPussy],
            ass: [ass, setAss],
        };
        const [cur, set] = map[name];
        set(cur === value ? "" : value);
    }, [type, rank, boobs, pussy, ass]);

    const clearAll = () => {
        setSearch(""); setType(""); setRank(""); setBoobs(""); setPussy(""); setAss("");
        setTattoo(false); setPiercing(false); setClean(false); setLetter("All");
    };

    // ── Filter ─────────────────────────────────────────────────────────────────
    const filtered = models.filter(m => {
        if (letter !== "All" && !m.name.toLowerCase().startsWith(letter.toLowerCase())) return false;
        if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
        if (type && m.type?.toLowerCase() !== type) return false;
        if (rank && m.rank?.toLowerCase() !== rank) return false;
        if (boobs && m.tits !== boobs) return false;
        if (pussy && m.pussy !== pussy) return false;
        if (ass && m.ass !== ass) return false;
        if (tattoo && !m.tattoo) return false;
        if (piercing && !m.piercing) return false;
        if (clean && (m.tattoo || m.piercing)) return false;
        return true;
    });

    const hasFilters = letter !== "All" || type || rank || boobs || pussy || ass || tattoo || piercing || clean || search;

    return (
        <>
            <HeaderWithSearch search={search} onSearchChange={handleSearch} />

            <div className={styles["page"]}>

                {/* ══════════════════════════════════ SIDEBAR */}
                <aside className={styles["sidebar"]}>

                    <div className={styles["sidebar__count"]}>
                        <span className={styles["sidebar__count-num"]}>
                            {loading ? "—" : filtered.length}
                        </span>
                        <span className={styles["sidebar__count-label"]}>
                            {filtered.length === 1 ? "model" : "models"}
                        </span>
                    </div>

                    <div className={styles["sidebar__divider"]} />

                    <div className={styles["sidebar__letters"]}>
                        {LETTERS.map(l => (
                            <button
                                key={l}
                                className={`${styles["sidebar__letters-btn"]} ${l === "All" ? styles["sidebar__letters-btn--all"] : ""} ${letter === l ? styles["sidebar__letters-btn--active"] : ""}`}
                                onClick={() => setLetter(l)}
                            >
                                {l}
                            </button>
                        ))}
                    </div>

                    <div className={styles["sidebar__divider"]} />

                    <div className={styles["sidebar__filters"]}>
                        <Folder title="Type">
                            {TYPES.map(v => (
                                <FilterItem
                                    key={v}
                                    label={v.charAt(0).toUpperCase() + v.slice(1)}
                                    name="type" value={v}
                                    checked={type === v}
                                    onToggle={toggleRadio}
                                />
                            ))}
                        </Folder>

                        <Folder title="Rank">
                            {RANKS.map(v => (
                                <FilterItem
                                    key={v}
                                    label={v.charAt(0).toUpperCase() + v.slice(1)}
                                    name="rank" value={v}
                                    checked={rank === v}
                                    onToggle={toggleRadio}
                                />
                            ))}
                        </Folder>

                        <Folder title="Boobs">
                            {BOOBS.map(([v, l]) => (
                                <FilterItem key={v} label={l} name="tits" value={v} checked={boobs === v} onToggle={toggleRadio} />
                            ))}
                        </Folder>

                        <Folder title="Pussy">
                            {PUSSY_OPTS.map(([v, l]) => (
                                <FilterItem key={v} label={l} name="pussy" value={v} checked={pussy === v} onToggle={toggleRadio} />
                            ))}
                        </Folder>

                        <Folder title="Ass">
                            {ASS_OPTS.map(([v, l]) => (
                                <FilterItem key={v} label={l} name="ass" value={v} checked={ass === v} onToggle={toggleRadio} />
                            ))}
                        </Folder>
                    </div>

                    <div className={styles["sidebar__divider"]} />

                    <div className={styles["sidebar__flags"]}>
                        <FilterItem label="Tattoo" name="tattoo" value="tattoo" type="checkbox" checked={tattoo} onToggle={toggleRadio} />
                        <FilterItem label="Piercing" name="piercing" value="piercing" type="checkbox" checked={piercing} onToggle={toggleRadio} />
                        <FilterItem label="Clean" name="clean" value="clean" type="checkbox" checked={clean} onToggle={toggleRadio} />
                    </div>

                    <div className={styles["sidebar__divider"]} />

                    {hasFilters && (
                        <button className={styles["sidebar__clear"]} onClick={clearAll}>
                            Clear all
                        </button>
                    )}

                </aside>

                {/* ══════════════════════════════════ MAIN GRID */}
                <main className={styles["main"]}>
                    {loading && (
                        <div className={styles["main__state"]}>
                            <div className={styles["main__state-ring"]} />
                        </div>
                    )}
                    {error && (
                        <p className={`${styles["main__state-msg"]} ${styles["main__state-msg--error"]}`}>
                            Failed to load models.
                        </p>
                    )}
                    {!loading && !error && filtered.length === 0 && (
                        <div className={styles["main__empty"]}>
                            <span className={styles["main__empty-glyph"]}>∅</span>
                            <p className={styles["main__empty-text"]}>No models match your filters.</p>
                        </div>
                    )}
                    {!loading && !error && filtered.length > 0 && (
                        <div className={styles["model-grid"]}>
                            {filtered.map((m, i) => (
                                <ModelCard key={m.name} model={m} index={i} />
                            ))}
                        </div>
                    )}
                </main>

            </div>

            <FooterMinimal />
        </>
    );
}