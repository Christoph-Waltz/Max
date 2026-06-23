import express from "express";
import Model from "../models/Model.js";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const allowedFlags = ["tattoo", "piercing"];
const enumFields = {
    type: ["babe", "milf", "petite"],
    rank: ["mature", "naughty", "slut"],
    tits: ["big", "natural", "small"],
    pussy: ["clean", "bush", "hairy"],
    ass: ["fat", "big", "tiny"],
};


function formatPaths(model) {
    model.portrait = `http://localhost:5000/api${model.portrait}`;
    model.closeup = `http://localhost:5000/api${model.closeup}`;
    model.landscape = `http://localhost:5000/api${model.landscape}`;
    return model;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE = path.join(__dirname, "..", "storage");

const imageUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const folder = path.join(STORAGE, "models", file.fieldname);
            if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
            cb(null, folder);
        },
        filename: (req, file, cb) => {
            cb(null, `${req.body.name}.png`);
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        file.mimetype === "image/png" ? cb(null, true) : cb(new Error("PNG only"));
    },
}).fields([
    { name: "portrait", maxCount: 1 },
    { name: "landscape", maxCount: 1 },
    { name: "closeup", maxCount: 1 },
]);

const patchUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const folder = path.join(STORAGE, "models", file.fieldname);
            if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
            cb(null, folder);
        },
        filename: (req, file, cb) => {
            const name = req.body.name?.trim() || req.query.name;
            cb(null, `${name}.png`);
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        file.mimetype === "image/png" ? cb(null, true) : cb(new Error("PNG only"));
    },
}).fields([
    { name: "portrait", maxCount: 1 },
    { name: "landscape", maxCount: 1 },
    { name: "closeup", maxCount: 1 },
]);


// POST /api/models
router.post("/", imageUpload, async (req, res) => {
    try {
        const { name, type, rank, tits, pussy, ass } = req.body;
        if (!name) return res.status(400).json({ msg: "Model name is required" });
        if (!type) return res.status(400).json({ msg: "Model type is required" });
        if (!rank) return res.status(400).json({ msg: "Model rank is required" });
        if (!tits) return res.status(400).json({ msg: "Model tits are required" });
        if (!pussy) return res.status(400).json({ msg: "Model pussy is required" });
        if (!ass) return res.status(400).json({ msg: "Model ass is required" });

        if (!req.files?.portrait) return res.status(400).json({ msg: "Portrait image is required" });
        if (!req.files?.landscape) return res.status(400).json({ msg: "Landscape image is required" });
        if (!req.files?.closeup) return res.status(400).json({ msg: "Closeup image is required" });

        const exists = await Model.exists({ name });
        if (exists) return res.status(409).json({ msg: "Model already exists" });

        const flags = Object.fromEntries(
            Object.entries(req.body)
                .filter(([key]) => allowedFlags.includes(key))
                .map(([key, value]) => [key, value === "true" || value === true])
        );

        const model = await Model.create({
            name,
            type,
            rank,
            tits,
            pussy,
            ass,
            ...flags,
            portrait: `/storage/models/portrait/${name}.png`,
            landscape: `/storage/models/landscape/${name}.png`,
            closeup: `/storage/models/closeup/${name}.png`,
        });

        res.status(201).json(model);
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ msg: err.message });
    }
});


// PATCH /api/models
router.patch("/", (req, res, next) => {
    patchUpload(req, res, err => {
        if (err) return res.status(400).json({ msg: err.message });
        next();
    });
}, async (req, res) => {
    try {
        const originalName = decodeURIComponent(req.query.name ?? "").trim();
        if (!originalName) return res.status(400).json({ msg: "Query param 'name' is required" });

        const model = await Model.findOne({ name: originalName });
        if (!model) return res.status(404).json({ msg: "Model not found" });

        const updates = {};

        const newName = req.body.name?.trim();
        if (newName && newName !== originalName) {
            const taken = await Model.exists({ name: newName });
            if (taken) return res.status(409).json({ msg: "Name already taken" });
            updates.name = newName;

            for (const folder of ["portrait", "landscape", "closeup"]) {
                const oldPath = path.join(STORAGE, "models", folder, `${originalName}.png`);
                const newPath = path.join(STORAGE, "models", folder, `${newName}.png`);
                if (fs.existsSync(oldPath) && !req.files?.[folder]) {
                    fs.renameSync(oldPath, newPath);
                }
            }

            updates.portrait = `/storage/models/portrait/${newName}.png`;
            updates.landscape = `/storage/models/landscape/${newName}.png`;
            updates.closeup = `/storage/models/closeup/${newName}.png`;
        }

        for (const [field, allowed] of Object.entries(enumFields)) {
            if (req.body[field] !== undefined) {
                if (!allowed.includes(req.body[field]))
                    return res.status(400).json({ msg: `Invalid value for ${field}` });
                updates[field] = req.body[field];
            }
        }

        for (const flag of allowedFlags) {
            if (req.body[flag] !== undefined) {
                updates[flag] = req.body[flag] === "true" || req.body[flag] === true;
            }
        }

        for (const imgField of ["portrait", "landscape", "closeup"]) {
            if (req.files?.[imgField]) {
                const name = updates.name || originalName;
                updates[imgField] = `/storage/models/${imgField}/${name}.png`;
            }
        }

        if (!Object.keys(updates).length)
            return res.status(200).json(model);

        const updated = await Model.findOneAndUpdate(
            { name: originalName },
            { $set: updates },
            { new: true, runValidators: true }
        );

        res.status(200).json(updated);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


// GET /api/models
router.get("/", async (req, res) => {
    try {
        const { name, names, type, rank, tits, pussy, ass, tattoo, piercing, limit } = req.query;
        const count = "count" in req.query;
        const query = {};

        if (name) {
            const model = await Model.findOne({ name });
            if (!model) return res.status(404).json({ msg: "Model could not found" });
            return res.status(200).json(formatPaths(model));
        }
        else if (names) {
            const nameArray = decodeURIComponent(names).split(/\+|,/).map(n => n.trim());
            query.name = { $in: nameArray };
        }

        // other filters
        if (type) query.type = type;
        if (rank) query.rank = rank;
        if (tits) query.tits = tits;
        if (pussy) query.pussy = pussy;
        if (ass) query.ass = ass;
        if (tattoo) query.tattoo = tattoo === "true";
        if (piercing) query.piercing = piercing === "true";

        let mongooseQuery = Model.find(query);

        mongooseQuery = mongooseQuery.sort({ updatedAt: -1 });

        if (limit) mongooseQuery = mongooseQuery.limit(Number(limit));

        const models = await mongooseQuery.lean();

        if (count) {
            const totalCount = await Model.countDocuments(query);
            return res.status(200).json({
                count: totalCount,
                data: formatPaths(models)
            });
        }

        if (!models.length) return res.status(404).json({ msg: "No models found" });
        res.status(200).json(models.map(formatPaths));
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});


export default router;


// {
// 	"name": "Scarlett Hampton",
// 	"type": "petite",
// 	"rank": "naughty",
// 	"tits": "small",
// 	"pussy": "clean",
// 	"ass": "tiny",
//  "tattoo": true,
//  "piercing": true
// }