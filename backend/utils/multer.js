import multer from "multer";
import fs from "fs";

const createUploader = ({ folder, allowedTypes }) => {
    const uploadDir = `/storage/${folder}`;

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            const name = req.params.name || req.body.name;
            cb(null, `${name}.png`);
        }
    });

    return multer({
        storage,
        limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
        fileFilter: (req, file, cb) => {
            if (!allowedTypes.includes(file.mimetype)) {
                cb(new Error("Invalid file type"));
            } else {
                cb(null, true);
            }
        },
    });
};

export default createUploader;
