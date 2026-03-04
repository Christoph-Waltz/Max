import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const update = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const result = await mongoose.connection.db
            .collection("scenes")
            .updateMany(
                { preview: { $exists: true } },
                { $unset: { preview: `` } }
            );

        console.log(
            `✅ Operation complete: ${result.modifiedCount} documents updated`
        );

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err);
        process.exit(1);
    }
};

update();