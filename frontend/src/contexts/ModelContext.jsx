import { createContext, useContext, useState } from "react";

// ─── Context ──────────────────────────────────────────────────────────────────
const ModalContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ModalProvider({ children }) {
    const [modal, setModal] = useState(null);

    const openModal = (type, payload = {}) => setModal({ type, payload });
    const closeModal = () => setModal(null);

    return (
        <ModalContext.Provider value={{ modal, openModal, closeModal }}>
            {children}
        </ModalContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useModal() {
    const ctx = useContext(ModalContext);
    if (!ctx) throw new Error("useModal must be used within <ModalProvider>");
    return ctx;
}