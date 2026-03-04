import mongoose from 'mongoose';

const modelSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    sceneId: [{ type: mongoose.Schema.Types.ObjectId, ref: "Scene" }],
    type: { type: String, enum: ["babe", "milf", "petite"], required: true },
    rank: { type: String, enum: ["mature", "naughty", "slut"], required: true },
    tits: { type: String, enum: ["big", "natural", "small"], required: true },
    pussy: { type: String, enum: ["clean", "bush", "hairy"], required: true },
    ass: { type: String, enum: ["fat", "big", "tiny"], required: true },
    tattoo: { type: Boolean, default: false },
    piercing: { type: Boolean, default: false },
    portrait: { type: String, required: true, unique: true },
    landscape: { type: String, required: true, unique: true },
    closeup: { type: String, required: true, unique: true },
}, {
    timestamps: true,
    versionKey: false
});

export default mongoose.model("Model", modelSchema);
