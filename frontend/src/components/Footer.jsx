import websiteBox from "../assets/website-box.png";
import logo from "../assets/logo.png";
import styles from "./css/Footer.module.scss";

const LINKS = [
    {
        heading: "Vixen Media Group",
        items: [
            { label: "Blacked",    href: "https://www.blacked.com/" },
            { label: "Tushy",      href: "https://www.tushy.com/" },
            { label: "Vixen",      href: "https://www.vixen.com/" },
            { label: "Blackedraw", href: "https://www.blackedraw.com/" },
            { label: "Tushyraw",   href: "https://www.tushyraw.com/" },
            { label: "Deeper",     href: "https://www.deeper.com/" }
        ],
    },
    {
        heading: "Anal Porn",
        items: [
            { label: "TrueAnal", href: "https://www.trueanal.com/" },
            { label: "AnalOnly", href: "https://www.analonly.com/" },
            { label: "AllAnal",  href: "https://www.allanal.com/" }
        ],
    },
    {
        heading: "Brazzers Group",
        items: [
            { label: "Brazzers",      href: "https://www.brazzers.com/" },
            { label: "BangBros",      href: "https://www.bangbros.com/" },
            { label: "Reality Kings", href: "https://www.realitykings.com/" },
            { label: "Herlimit",      href: "https://www.herlimit.com/" }
        ],
    },
    {
        heading: "Other websites",
        items: [
            { label: "Lubed",  href: "https://www.lubed.com/" },
            { label: "Cum4k",  href: "https://www.cum4k.com/" },
            { label: "BBCPie", href: "https://www.bbcpie.com/" },
            { label: "Anal4k", href: "https://www.anal4k.com/" },
            { label: "Holed",  href: "https://www.holed.com/" },
        ],
    },
];

const COPYRIGHT_LINKS = ["Privacy", "Policy", "Help", "Cookies", "Terms & Conditions"];

function QuickLinks({ className }) {
    return (
        <div className={`${styles["quick-links"]} ${className ?? ""}`}>
            {LINKS.map(col => (
                <ul key={col.heading} className={styles["quick-links__col"]}>
                    <li className={styles["quick-links__heading"]}>{col.heading}</li>
                    {col.items.map(({ label, href }) => (
                        <li key={label} className={styles["quick-links__item"]}>
                            <a href={href} target="_blank" rel="noreferrer">{label}</a>
                        </li>
                    ))}
                </ul>
            ))}
        </div>
    );
}

function Copyright() {
    return (
        <div className={styles["copyright"]}>
            <span className={styles["copyright__year"]}>© 2024 Porn Max, Inc. All rights reserved.</span>
            {COPYRIGHT_LINKS.map(l => (
                <p key={l} className={styles["copyright__link"]}>{l}</p>
            ))}
        </div>
    );
}

// ─── Full footer (Home page) ──────────────────────────────────────────────────
function Footer() {
    return (
        <footer className={styles["footer"]}>
            <div className={styles["footer__watermark"]}>
                <img src={websiteBox} alt="" aria-hidden />
            </div>

            <div className={styles["footer__divider"]} />

            <div className={styles["footer__newsletter"]}>
                <img
                    src={logo}
                    alt="MAX"
                    className={styles["footer__newsletter-logo"]}
                />
                <div className={styles["footer__newsletter-form"]}>
                    <input
                        type="email"
                        placeholder="Your email address"
                        className={styles["footer__newsletter-input"]}
                    />
                    <button className={styles["footer__newsletter-btn"]}>Subscribe</button>
                </div>
            </div>

            <div className={styles["footer__divider"]} />

            <QuickLinks />

            <Copyright />
        </footer>
    );
}

// ─── Minimal footer (Scenes / Models / Scene / Model pages) ──────────────────
export function FooterMinimal() {
    return (
        <footer className={styles["footer-minimal"]}>
            <div className={styles["footer-minimal__inner"]}>
                <QuickLinks />
                <Copyright />
            </div>
        </footer>
    );
}

export default Footer;