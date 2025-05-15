import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { solveTask } from "./services/solver.js";
import { recognizeText } from './services/ocr.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();


app.use(cors({
    origin: 'http://localhost:4001',
    credentials: true,
    optionsSuccessStatus: 200
}));


const tempDir = path.join(__dirname, '_temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
}).array('files');


const cleanupFiles = (files) => {
    if (!files) return;
    files.forEach(file => {
        const filePath = path.join(tempDir, file.filename);
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, err => err && console.error('Cleanup error:', err));
        }
    });
};

app.post("/api/check", (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error('Upload error:', err);
            return res.status(500).json({ error: err.message });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        try {
            const results = await Promise.all(req.files.map(async file => {
                const imagePath = path.join(tempDir, file.filename);
                try {



                    // здесь логика обработки изображения и гипер крутая ml моделька
                    // const text = await recognizeText(imagePath); // что то типо этого из скачанного tf сюда добавь

                    const solutions = solveTask({
                        text: "",
                        examples: ["2x + 3 = 7"]
                    });
                    // чтобы русские названия не превращались в кракозябры
                    const originalName = Buffer.from(file.originalname, 'binary').toString('utf8');

                    return {
                        originalName: originalName,
                        filename: file.filename,
                        imageUrl: `/temp/${file.filename}`,
                        solutions,
                        status: 'success'
                    };
                } catch (error) {
                    console.error(`Error processing ${file.originalname}:`, error);
                    return {
                        originalName: file.originalname,
                        filename: file.filename,
                        error: error.message,
                        status: 'error'
                    };
                }
            }));

            res.json(results);
        } catch (error) {
            console.error('Processing error:', error);
            res.status(500).json({ error: 'Internal server error' });
        } finally {

            // setTimeout(() => cleanupFiles(req.files), 5000);
        }
    });
});


app.use('/temp', express.static(tempDir));

setInterval(() => {
    fs.readdir(tempDir, (err, files) => {
        if (err) return;
        const now = Date.now();
        files.forEach(file => {
            const filePath = path.join(tempDir, file);
            const stat = fs.statSync(filePath);
            if (now - stat.mtimeMs > 3 * 60 * 1000) {
                fs.unlink(filePath, err => err && console.error('Cleanup error:', err));
            }
        });
    });
}, 10000);

app.listen(process.env.PORT || 4000, () => {
    console.log(`Server running on port ${process.env.PORT || 4000}`);
});