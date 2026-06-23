import express from "express";
import Scene from "../Models/Scene.js";
import Model from "../models/Model.js";
import mongoose from "mongoose";
import { allowedTags, defaultTags } from "../utils/tags.js";
import { exec } from "child_process";
import { promisify } from "util";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE = path.join(__dirname, "..", "storage");
const execAsync = promisify(exec);

function formatPaths(scene) {
    const obj = typeof scene.toObject === "function" ? scene.toObject() : { ...scene };
    obj.cover = `http://localhost:5000/api${obj.cover}`;
    obj.video = `http://localhost:5000/api${obj.video}`;
    if (obj.sneak) obj.sneak = `http://localhost:5000/api${obj.sneak}`;
    return obj;
}

const sceneUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const folder = path.join(STORAGE, "scenes", req.body.sceneId);
            if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
            cb(null, folder);
        },
        filename: (req, file, cb) => {
            cb(null, file.fieldname === "cover" ? "cover.png" : "video.mp4");
        },
    }),
    limits: { fileSize: 7 * 1024 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.fieldname === "cover" && !file.mimetype.startsWith("image/png"))
            return cb(new Error("Cover image must be a PNG"));
        cb(null, true);
    },
}).fields([{ name: "cover", maxCount: 1 }]);

const patchSceneUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const sceneId = req.body.sceneId?.trim() || decodeURIComponent(req.query.sceneId ?? "");
            const folder = path.join(STORAGE, "scenes", sceneId);
            if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
            cb(null, folder);
        },
        filename: (req, file, cb) => {
            cb(null, file.fieldname === "cover" ? "cover.png" : "video.mp4");
        },
    }),
    limits: { fileSize: 7 * 1024 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.fieldname === "cover" && file.mimetype !== "image/png")
            return cb(new Error("Cover must be PNG"));
        cb(null, true);
    },
}).fields([{ name: "cover", maxCount: 1 }]);


router.get("/", async (req, res) => {
    try {
        const { tags, limit, production, sceneId, model } = req.query;
        const cover = "cover" in req.query;
        const count = "count" in req.query;
        const sort = "sort" in req.query;

        if (sceneId) {
            const scene = await Scene.findOne({ sceneId });
            if (!scene) return res.status(404).json({ msg: "Scene not found" });
            return res.status(200).json(formatPaths(scene));
        }

        const query = {};
        if (tags) tags.split("+").forEach(t => { query[`tags.${t}`] = true; });
        if (production) query.production = production;
        if (model) query["models.name"] = model;

        let mq = Scene.find(query).sort({ updatedAt: sort ? 1 : -1 });

        if (cover) {
            const scene = await mq.limit(1).lean();
            if (!scene.length) return res.status(404).json({ msg: "No scenes found" });
            return res.status(200).json(formatPaths(scene[0]));
        }

        if (count && !limit) {
            return res.status(200).json({ count: await Scene.countDocuments(query) });
        }

        if (limit) mq = mq.limit(Number(limit));
        const scenes = await mq.lean();

	if (count) {
    	    return res.status(200).json({ count: await Scene.countDocuments(query), data: scenes.map(s => formatPaths(s, req)) });
	}

        return res.status(200).json(scenes.map(formatPaths));
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


router.post("/", (req, res, next) => {
    if ("preview" in req.query) return next();
    sceneUpload(req, res, err => {
        if (err) return res.status(400).json({ msg: err.message });
        next();
    });
}, async (req, res) => {

    if ("preview" in req.query) {
        const sceneId = decodeURIComponent(req.query.sceneId ?? "").trim();
        if (!sceneId) return res.status(400).json({ msg: "?sceneId= required" });

        const videoPath = path.join(STORAGE, "scenes", sceneId, "video.mp4");
        const sneakPath = path.join(STORAGE, "scenes", sceneId, "sneak.mp4");

        if (!fs.existsSync(videoPath))
            return res.status(404).json({ msg: "video.mp4 not found for this scene" });

        try {
            const { stdout } = await execAsync(
                `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
            );
            const duration = parseFloat(stdout.trim());
            const clips = 7, segLen = 2;
            const inputs = [], filters = [];

            for (let i = 0; i < clips; i++) {
                const start = (duration * (0.10 + i * (0.80 / (clips - 1)))).toFixed(2);
                inputs.push(`-ss ${start} -t ${segLen} -i "${videoPath}"`);
                filters.push(`[${i}:v]scale=1280:720,trim=duration=${segLen},setpts=PTS-STARTPTS[v${i}]`);
            }

            const concat = Array.from({ length: clips }, (_, i) => `[v${i}]`).join("");
            const filter = filters.join(";") + `;${concat}concat=n=${clips}:v=1:a=0[v]`;
            const cmd = `ffmpeg ${inputs.join(" ")} -filter_complex "${filter}" -map "[v]" -c:v libx264 -b:v 1200k -movflags +faststart -y "${sneakPath}"`;

            await execAsync(cmd);

            const scene = await Scene.findOne({ sceneId });
            if (!scene) return res.status(404).json({ msg: "Scene not found in database" });
            return res.status(200).json(formatPaths(scene));
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }

    const cleanup = () => {
        const sceneId = req.body?.sceneId;
        if (sceneId) {
            const folder = path.join(STORAGE, "scenes", sceneId);
            if (fs.existsSync(folder)) fs.rmSync(folder, { recursive: true, force: true });
        }
    };

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { sceneId, title, production } = req.body;
        const pornstars = req.body["pornstars[]"] ?? req.body.pornstars ?? [];
        const pornstarList = Array.isArray(pornstars) ? pornstars : [pornstars];

        if (!sceneId) return res.status(400).json({ msg: "Scene id is required" });
        if (!title) return res.status(400).json({ msg: "Title is required" });
        if (!pornstarList.length) return res.status(400).json({ msg: "Scene should have at least one model" });
        if (!production) return res.status(400).json({ msg: "Production is required" });
        if (!req.files?.cover) return res.status(400).json({ msg: "Cover image is required" });

        const sceneIdRegex = /^(Anal|FMF|Gangbang|MFM|Orgy|Straight) [0-9]+$/;
        if (!sceneIdRegex.test(sceneId)) { cleanup(); return res.status(400).json({ msg: "Invalid sceneId format. Example: 'Anal 69'" }); }
        if (await Scene.exists({ sceneId })) { cleanup(); return res.status(400).json({ msg: "Scene already exists by this id" }); }

        const models = [];
        for (const name of pornstarList) {
            const model = await Model.findOne({ name }).session(session);
            if (!model) { cleanup(); return res.status(404).json({ msg: `${name} is not in the database` }); }
            models.push(model);
        }

        let parsedTags = {};
        try { parsedTags = JSON.parse(req.body.tags || "{}"); } catch { }

        const flags = Object.fromEntries(
            Object.entries(parsedTags)
                .filter(([key]) => allowedTags.includes(key))
                .map(([key, value]) => [key, value === true || value === "true"])
        );

        const scene = await Scene.create([{
            sceneId,
            title,
            production,
            models: models.map(m => ({ _id: m._id, name: m.name })),
            tags: { ...defaultTags, ...flags },
            cover: `/storage/scenes/${sceneId}/cover.png`,
            video: `/storage/scenes/${sceneId}/video.mp4`,
            sneak: `/storage/scenes/${sceneId}/sneak.mp4`,
        }], { session });

        for (const model of models) {
            model.sceneId.push(scene[0]._id);
            await model.save({ session });
        }

        await session.commitTransaction();
        res.status(201).json(formatPaths(scene[0]));
    } catch (err) {
        await session.abortTransaction();
        cleanup();
        res.status(500).json({ msg: err.message });
    } finally {
        session.endSession();
    }
});


router.patch("/", (req, res, next) => {
    patchSceneUpload(req, res, err => {
        if (err) return res.status(400).json({ msg: err.message });
        next();
    });
}, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    const cleanup = (id) => {
        const folder = path.join(STORAGE, "scenes", id);
        if (fs.existsSync(folder)) {
            if (req.files?.cover) fs.rmSync(path.join(folder, "cover.png"), { force: true });
        }
    };

    try {
        const originalId = decodeURIComponent(req.query.sceneId ?? "").trim();
        if (!originalId) return res.status(400).json({ msg: "Query param ?sceneId= is required" });

        const scene = await Scene.findOne({ sceneId: originalId }).session(session);
        if (!scene) return res.status(404).json({ msg: "Scene not found" });

        const updates = {};

        const newId = req.body.sceneId?.trim();
        if (newId && newId !== originalId) {
            const sceneIdRegex = /^(Anal|FMF|Gangbang|MFM|Orgy|Straight) [0-9]+$/;
            if (!sceneIdRegex.test(newId)) return res.status(400).json({ msg: "Invalid sceneId format" });
            if (await Scene.exists({ sceneId: newId })) return res.status(409).json({ msg: `${newId} already exists` });

            updates.sceneId = newId;

            const oldFolder = path.join(STORAGE, "scenes", originalId);
            const newFolder = path.join(STORAGE, "scenes", newId);
            if (fs.existsSync(oldFolder) && !fs.existsSync(newFolder))
                fs.renameSync(oldFolder, newFolder);

            updates.cover = `/storage/scenes/${newId}/cover.png`;
            updates.video = `/storage/scenes/${newId}/video.mp4`;
            updates.sneak = `/storage/scenes/${newId}/sneak.mp4`;
        }

        if (req.body.title?.trim()) updates.title = req.body.title.trim();
        if (req.body.production?.trim()) updates.production = req.body.production.trim();

        const pornstars = req.body["pornstars[]"] ?? req.body.pornstars ?? [];
        const pornstarList = Array.isArray(pornstars) ? pornstars : [pornstars];

        if (pornstarList.length > 0) {
            const modelDocs = [];
            for (const name of pornstarList) {
                const m = await Model.findOne({ name }).session(session);
                if (!m) { cleanup(newId || originalId); return res.status(404).json({ msg: `${name} not in database` }); }
                modelDocs.push(m);
            }

            const oldIds = scene.models.map(m => m._id.toString());
            const newIds = modelDocs.map(m => m._id.toString());

            for (const m of modelDocs) {
                if (!oldIds.includes(m._id.toString())) { m.sceneId.push(scene._id); await m.save({ session }); }
            }
            for (const oldM of scene.models) {
                if (!newIds.includes(oldM._id.toString()))
                    await Model.updateOne({ _id: oldM._id }, { $pull: { sceneId: scene._id } }, { session });
            }

            updates.models = modelDocs.map(m => ({ _id: m._id, name: m.name }));
        }

        if (req.body.tags) {
            try {
                const incoming = JSON.parse(req.body.tags);
                updates.tags = { ...scene.tags.toObject(), ...incoming };
            } catch { }
        }

        const activeId = updates.sceneId || originalId;
        if (req.files?.cover) updates.cover = `/storage/scenes/${activeId}/cover.png`;

        if (!Object.keys(updates).length) {
            await session.abortTransaction();
            return res.status(200).json(formatPaths(scene));
        }

        const updated = await Scene.findOneAndUpdate(
            { sceneId: originalId },
            { $set: updates },
            { new: true, runValidators: true, session }
        );

        await session.commitTransaction();
        res.status(200).json(formatPaths(updated));
    } catch (err) {
        await session.abortTransaction();
        res.status(500).json({ msg: err.message });
    } finally {
        session.endSession();
    }
});


export default router;