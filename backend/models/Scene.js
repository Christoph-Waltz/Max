import mongoose from 'mongoose';

const sceneSchema = new mongoose.Schema({
    sceneId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    models: [{
        _id: { type: mongoose.Schema.Types.ObjectId, ref: "Model" },
        name: { type: String, required: true }
    }],
    production: { type: String, required: true },
    tags: {
        couple: { type: Boolean, default: false },
        threesome: { type: Boolean, default: false },
        fmf: { type: Boolean, default: false },
        mfm: { type: Boolean, default: false },
        orgy: { type: Boolean, default: false },
        gangbang: { type: Boolean, default: false },
        straight: { type: Boolean, default: false },
        anal: { type: Boolean, default: false },
        facial: { type: Boolean, default: false },
        cumshot: { type: Boolean, default: false },
        creampie: { type: Boolean, default: false },
        analCreampie: { type: Boolean, default: false },
        dp: { type: Boolean, default: false },
        squirting: { type: Boolean, default: false },
        cumSwap: { type: Boolean, default: false },
        cumSwallow: { type: Boolean, default: false },
        piss: { type: Boolean, default: false },
        favourite: { type: Boolean, default: false },
    },
    video: { type: String, unique: true },
    cover: { type: String, unique: true },
    sneak: { type: String, unique: true }
}, {
    timestamps: true,
    versionKey: false
});

export default mongoose.model("Scene", sceneSchema);
