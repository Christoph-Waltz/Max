import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./css/VideoPlayer.module.scss";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtTime = s => {
    if (!s || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
};

// ─── SVGs ─────────────────────────────────────────────────────────────────────
const IconPlay = () => <svg viewBox="0 0 20 20" fill="currentColor"><polygon points="4,3 17,10 4,17" /></svg>;
const IconPause = () => <svg viewBox="0 0 20 20" fill="currentColor"><rect x="4" y="3" width="4" height="14" rx="1" /><rect x="12" y="3" width="4" height="14" rx="1" /></svg>;
const IconMute = () => (
    <svg viewBox="0 0 20 20" fill="currentColor">
        <path d="M3 7h3l5-4v14l-5-4H3V7z" />
        <line x1="13" y1="7" x2="18" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="18" y1="7" x2="13" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
);
const IconVolume = () => (
    <svg viewBox="0 0 20 20" fill="currentColor">
        <path d="M3 7h3l5-4v14l-5-4H3V7z" />
        <path d="M14 6q2 1.5 2 4t-2 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
);
const IconEnterFs = () => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M3 8V3h5M12 3h5v5M17 12v5h-5M8 17H3v-5" />
    </svg>
);
const IconExitFs = () => (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M8 3H3v5M17 3h-5M3 12v5h5M12 17h5v-5" />
    </svg>
);
const IconPlayLg = () => (
    <svg width="60" height="60" viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="38" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />
        <circle cx="40" cy="40" r="38" stroke="rgba(255,255,255,0.06)" strokeWidth="14" />
        <polygon points="33,23 61,40 33,57" fill="white" opacity="0.92" />
    </svg>
);

// ─── Base modal shell (animation + overlay dismiss) ───────────────────────────
function Base({ children, onClose }) {
    const [visible, setVisible] = useState(false);
    const contentRef = useRef(null);

    useEffect(() => {
        requestAnimationFrame(() => setVisible(true));
    }, []);

    const handleClose = useCallback(() => {
        setVisible(false);
        setTimeout(onClose, 220);
    }, [onClose]);

    const handleOverlay = (e) => {
        if (contentRef.current && !contentRef.current.contains(e.target)) {
            handleClose();
        }
    };

    return (
        <div
            className={`${styles.overlay} ${visible ? styles["overlay--vis"] : ""}`}
            onMouseDown={handleOverlay}
        >
            <div
                ref={contentRef}
                className={`${styles.window} ${visible ? styles["window--vis"] : ""}`}
                onMouseDown={e => e.stopPropagation()}
            >
                {typeof children === "function"
                    ? children({ handleClose, fsRef: contentRef })
                    : children}
            </div>
        </div>
    );
}

// ─── VideoPlayer ──────────────────────────────────────────────────────────────
export default function VideoPlayerModal({ scene, onClose }) {
    return (
        <Base onClose={onClose}>
            {({ handleClose, fsRef }) => <Player scene={scene} onClose={handleClose} fsRef={fsRef} />}
        </Base>
    );
}

// ─── Player (inner) ───────────────────────────────────────────────────────────
function Player({ scene, onClose, fsRef }) {
    const videoRef = useRef(null);
    const progressRef = useRef(null);
    const hideTimer = useRef(null);
    const isDragging = useRef(false);

    const [paused, setPaused] = useState(false);
    const [muted, setMuted] = useState(false);   // ← unmuted by default
    const [volume, setVolume] = useState(1.0);
    const [current, setCurrent] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isFs, setIsFs] = useState(false);
    const [ctrlsVis, setCtrlsVis] = useState(true);

    // ── Auto-hide controls (and cursor) ──
    const showCtrls = useCallback(() => {
        setCtrlsVis(true);
        clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setCtrlsVis(false), 3000);
    }, []);

    useEffect(() => {
        showCtrls();
        return () => clearTimeout(hideTimer.current);
    }, [showCtrls]);

    // ── Video init & events ──
    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        v.volume = volume;
        v.muted = false;   // ← unmuted on init
        v.play().catch(() => { });

        const onTime = () => { if (!isDragging.current) setCurrent(v.currentTime); };
        const onMeta = () => setDuration(v.duration);
        const onPlay = () => setPaused(false);
        const onPause = () => setPaused(true);

        v.addEventListener("timeupdate", onTime);
        v.addEventListener("loadedmetadata", onMeta);
        v.addEventListener("play", onPlay);
        v.addEventListener("pause", onPause);
        return () => {
            v.removeEventListener("timeupdate", onTime);
            v.removeEventListener("loadedmetadata", onMeta);
            v.removeEventListener("play", onPlay);
            v.removeEventListener("pause", onPause);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Fullscreen ──
    useEffect(() => {
        const onChange = () => setIsFs(!!document.fullscreenElement);
        document.addEventListener("fullscreenchange", onChange);
        return () => document.removeEventListener("fullscreenchange", onChange);
    }, []);

    const toggleFs = useCallback(() => {
        const el = fsRef.current;
        if (!el) return;
        document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen();
    }, [fsRef]);

    // ── Play / mute ──
    const togglePlay = useCallback(() => {
        const v = videoRef.current;
        if (!v) return;
        showCtrls();
        v.paused ? v.play() : v.pause();
    }, [showCtrls]);

    const toggleMute = useCallback(() => {
        const v = videoRef.current;
        if (!v) return;
        const next = !v.muted;
        if (!next && v.volume === 0) { v.volume = 0.5; setVolume(0.5); }
        v.muted = next;
        setMuted(next);
    }, []);

    // ── Volume slider ──
    const onVolumeChange = useCallback(e => {
        const v = videoRef.current;
        const val = parseFloat(e.target.value);
        if (v) { v.volume = val; v.muted = val === 0; }
        setVolume(val);
        setMuted(val === 0);
    }, []);

    // ── Seek ──
    const seekToX = useCallback(clientX => {
        const v = videoRef.current;
        const bar = progressRef.current;
        if (!v || !bar || !v.duration) return;
        const rect = bar.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        v.currentTime = ratio * v.duration;
        setCurrent(v.currentTime);
    }, []);

    const onProgressMouseDown = useCallback(e => {
        e.preventDefault();
        isDragging.current = true;
        seekToX(e.clientX);

        const onMove = (e) => {
            if (!isDragging.current) return;
            seekToX(e.clientX);
        };

        const onUp = (e) => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
            isDragging.current = false;
            seekToX(e.clientX);
        };

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    }, [seekToX]);

    // ── Keybindings ──
    useEffect(() => {
        const handler = e => {
            const v = videoRef.current;
            if (e.target.tagName === "INPUT") return;
            showCtrls();
            switch (e.key) {
                case " ": case "Spacebar":
                    e.preventDefault(); togglePlay(); break;
                case "ArrowRight":
                    e.preventDefault();
                    if (v) { v.currentTime = Math.min(v.duration, v.currentTime + 30); }
                    break;
                case "ArrowLeft":
                    e.preventDefault();
                    if (v) { v.currentTime = Math.max(0, v.currentTime - 30); }
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    if (v) {
                        const nv = Math.min(1, +((v.volume + 0.1).toFixed(1)));
                        v.volume = nv; v.muted = false;
                        setVolume(nv); setMuted(false);
                    }
                    break;
                case "ArrowDown":
                    e.preventDefault();
                    if (v) {
                        const nv = Math.max(0, +((v.volume - 0.1).toFixed(1)));
                        v.volume = nv;
                        if (nv === 0) v.muted = true;
                        setVolume(nv); setMuted(nv === 0);
                    }
                    break;
                case "m": case "M": toggleMute(); break;
                case "f": case "F": e.preventDefault(); toggleFs(); break;
                case "Escape":
                    if (isFs) document.exitFullscreen?.();
                    else onClose();
                    break;
                default: break;
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [isFs, showCtrls, togglePlay, toggleMute, toggleFs, onClose]);

    // ── Lock body scroll ──
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    const pct = duration ? (current / duration) * 100 : 0;
    const volPct = (muted ? 0 : volume) * 100;
    const volStyle = {
        background: `linear-gradient(to right, #9dc9a0 ${volPct}%, rgba(255,255,255,0.18) ${volPct}%)`,
    };

    return (
        <div
            className={styles.player}
            style={{ cursor: ctrlsVis ? "default" : "none" }}  // ← hide cursor with controls
            onMouseMove={showCtrls}
        >
            {/* ── Video area — click to play/pause ── */}
            <div className={styles.player__video} onClick={togglePlay}>
                <video
                    ref={videoRef}
                    src={scene.video}
                    playsInline
                    className={styles["player__video-el"]}
                />
                {paused && (
                    <div className={styles["player__video-paused"]}>
                        <IconPlayLg />
                    </div>
                )}
            </div>

            {/* ── Bottom gradient ── */}
            <div className={`${styles.player__fade} ${ctrlsVis ? styles["player__fade--vis"] : ""}`} />

            {/* ── Controls ── */}
            <div className={`${styles.player__ctrls} ${ctrlsVis ? styles["player__ctrls--vis"] : ""}`}>

                {/* Scene info (fullscreen only) */}
                {isFs && (
                    <div className={styles["player__ctrls-meta"]}>
                        <span className={styles["player__ctrls-meta-studio"]}>{scene.production}</span>
                        <span className={styles["player__ctrls-meta-title"]}>{scene.title}</span>
                    </div>
                )}

                {/* Progress bar */}
                <div
                    className={styles["player__ctrls-progress"]}
                    ref={progressRef}
                    onMouseDown={onProgressMouseDown}
                >
                    <div className={styles["player__ctrls-progress-bg"]} />
                    <div className={styles["player__ctrls-progress-fill"]} style={{ width: `${pct}%` }} />
                    <div className={styles["player__ctrls-progress-thumb"]} style={{ left: `${pct}%` }} />
                </div>

                {/* Button row */}
                <div className={styles["player__ctrls-row"]}>
                    <div className={styles["player__ctrls-row-left"]}>
                        <button className={styles["player__ctrls-btn"]} onClick={togglePlay}>
                            {paused ? <IconPlay /> : <IconPause />}
                        </button>
                        <button className={styles["player__ctrls-btn"]} onClick={toggleMute}>
                            {muted || volume === 0 ? <IconMute /> : <IconVolume />}
                        </button>
                        <input
                            className={styles["player__ctrls-volume"]}
                            type="range" min="0" max="1" step="0.02"
                            value={muted ? 0 : volume}
                            onChange={onVolumeChange}
                            style={volStyle}
                        />
                        <span className={styles["player__ctrls-time"]}>
                            {fmtTime(current)}
                            <span className={styles["player__ctrls-time-sep"]}> / </span>
                            {fmtTime(duration)}
                        </span>
                    </div>
                    <div className={styles["player__ctrls-row-right"]}>
                        <button className={styles["player__ctrls-btn"]} onClick={toggleFs}>
                            {isFs ? <IconExitFs /> : <IconEnterFs />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}