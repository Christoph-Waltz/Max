import express from "express";
import path from "path";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import sceneRoutes from "./routes/scenes.js";
import modelRoutes from "./routes/models.js";

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Storage (static files) ───────────────────────────────────────────────────
app.use("/api/storage", express.static("storage"));
app.use("/api/scenes", sceneRoutes);
app.use("/api/models", modelRoutes);

// ─── SPA fallback ─────────────────────────────────────────────────────────────
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.use((req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// ─── Database + server ────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 80;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));