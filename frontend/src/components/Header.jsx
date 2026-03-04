import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import hamburger from "../assets/hamburger.png";
import styles from "./css/Header.module.scss";
import { useModal } from "../contexts/ModelContext";
import AddModel from "../modals/AddModel";
import AddScene from "../modals/AddScene";

// ─── Shared + dropdown ────────────────────────────────────────────────────────
function AddDropdown() {
    const { openModal, closeModal, modal } = useModal();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handler = e => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const trigger = (type) => {
        setOpen(false);
        openModal(type);
    };

    return (
        <>
            <div className={styles["add-menu"]} ref={ref}>
                <button
                    className={`${styles["add-menu__btn"]} ${open ? styles["add-menu__btn--open"] : ""}`}
                    onClick={() => setOpen(v => !v)}
                    aria-label="Add new"
                >
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                        <line x1="8" y1="2" x2="8" y2="14" />
                        <line x1="2" y1="8" x2="14" y2="8" />
                    </svg>
                    Add
                </button>

                <div className={`${styles["add-menu__dropdown"]} ${open ? styles["add-menu__dropdown--open"] : ""}`}>
                    <button className={styles["add-menu__item"]} onClick={() => trigger("addScene")}>
                        <span className={styles["add-menu__item-icon"]}>
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="1" y="3" width="14" height="10" rx="1.5" />
                                <polygon points="6.5,6 10.5,8 6.5,10" fill="currentColor" stroke="none" />
                            </svg>
                        </span>
                        <span className={styles["add-menu__item-label"]}>Add Scene</span>
                    </button>
                    <button className={styles["add-menu__item"]} onClick={() => trigger("addModel")}>
                        <span className={styles["add-menu__item-icon"]}>
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="8" cy="5.5" r="2.5" />
                                <path d="M2.5 13.5c0-3 11 -3 11 0" />
                            </svg>
                        </span>
                        <span className={styles["add-menu__item-label"]}>Add Model</span>
                    </button>
                </div>
            </div>

            {/* ═════════ MODALS */}
            {modal?.type === "addScene" && <AddScene onClose={closeModal} />}
            {modal?.type === "addModel" && <AddModel onClose={closeModal} />}
        </>
    );
}

// ─── Header WITH search (Scenes / Models) ────────────────────────────────────
export function HeaderWithSearch({ search = "", onSearchChange }) {
    return (
        <nav className={`${styles["nav"]} ${styles["nav--search"]}`}>
            <Link to="/" className={styles["nav__logo-link"]}>
                <img src={logo} alt="MAX" className={styles["nav__logo"]} />
            </Link>

            <div className={styles["nav__search-wrap"]}>
                <svg
                    className={styles["nav__search-icon"]}
                    width="14" height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                >
                    <circle cx="6" cy="6" r="4.5" />
                    <line x1="9.5" y1="9.5" x2="13" y2="13" />
                </svg>
                <input
                    className={styles["nav__search"]}
                    type="search"
                    placeholder="Search…"
                    value={search}
                    onChange={onSearchChange}
                />
            </div>

            <ul className={styles["nav__links"]}>
                <li className={styles["nav__link-item"]}>
                    <Link to="/scenes" className={styles["nav__link"]}>Scenes</Link>
                </li>
                <li className={styles["nav__link-item"]}>
                    <Link to="/models" className={styles["nav__link"]}>Models</Link>
                </li>
                <li className={styles["nav__link-item"]}>
                    <AddDropdown />
                </li>
            </ul>
        </nav>
    );
}

// ─── Header WITHOUT search (Home / Scene / Model) ─────────────────────────────
export function HeaderPlain() {
    return (
        <nav className={`${styles["nav"]} ${styles["nav--plain"]}`}>
            <div className={styles["nav__left"]}>
                <img src={hamburger} alt="menu" className={styles["nav__hamburger"]} />
            </div>

            <Link to="/" className={styles["nav__logo-link"]}>
                <img src={logo} alt="MAX" className={styles["nav__logo"]} />
            </Link>

            <ul className={styles["nav__links"]}>
                <li className={styles["nav__link-item"]}>
                    <Link to="/scenes" className={styles["nav__link"]}>Scenes</Link>
                </li>
                <li className={styles["nav__link-item"]}>
                    <Link to="/models" className={styles["nav__link"]}>Models</Link>
                </li>
                <li className={styles["nav__link-item"]}>
                    <AddDropdown />
                </li>
            </ul>
        </nav>
    );
}