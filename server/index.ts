const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// 配置上传存储的目录
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const TEMP_DIR = path.join(UPLOAD_DIR, 'temp');
fs.ensureDirSync(UPLOAD_DIR); // 确保目录存在

class FileChunkHandler {
    tempDir: any;
    uploadDir: any;
    constructor(tempDir, uploadDir) {
        this.tempDir = tempDir;
        this.uploadDir = uploadDir;
    }

    getChunkDir(fileId) {
        return path.join(this.tempDir, fileId);
    }

    // 保存分片文件
    async saveChunk({ fileId, chunkIndex, chunkFile }) {
        const chunkDir = this.getChunkDir(fileId);
        await fs.ensureDir(chunkDir);

        const chunkPath = path.join(chunkDir, `${chunkIndex}`);
        await fs.move(chunkFile.path, chunkPath, { overwrite: true });
        return { success: true, chunkIndex };
    }

    async checkUploadedChunks(fileId) {
        const chunkDir = this.getChunkDir(fileId);
        if (!await fs.pathExists(chunkDir)) return { uploadedChunks: [] };
        const chunkFiles = await fs.readdir(chunkDir);
        const uploadedChunks = chunkFiles.map(Number).filter((num) => !isNaN(num)).sort((a, b) => a - b);
        return { uploadedChunks };
    }

    async mergeChunks({ fileId, fileName, totalChunks }) {
        const chunkDir = this.getChunkDir(fileId);
        const targetPath = path.join(this.uploadDir, fileName);

        for (let i = 0; i < totalChunks; i++) {
            const chunkPath = path.join(chunkDir, `${i}`);
            if (!await fs.pathExists(chunkPath)) {
                throw new Error(`Chunk ${i} not found`);
            }
        }

        const writeStream = fs.createWriteStream(targetPath);
        for (let i = 0; i < totalChunks; i++) {
            const chunkPath = path.join(chunkDir, `${i}`);
            const chunkBuffer = await fs.readFile(chunkPath);
            await new Promise((resolve) => {
                writeStream.write(chunkBuffer, resolve);
            })
        }
        writeStream.end();
        await fs.remove(chunkDir);
        return { success: true, path: targetPath };
    }
}
const chunkHandler = new FileChunkHandler(TEMP_DIR, UPLOAD_DIR);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'temp-upload'));
    },
    fileName: (req, file, cb) => {
        cb(null, `temp-${Date.now()}`)
    }
})
const upload = multer({ storage });

app.post('upload-chunk', upload.single('chunk'), async (req, res) => {
    try {
        const { fileId, chunkIndex, totalChunks } = req.body;
        const result = await chunkHandler.saveChunk({
            fileId,
            chunkIndex: +chunkIndex,
            chunkFile: req.file,
        })
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/check-chunks', async (req, res) => {
    try {
        const { fileId } = req.query;
        const result = await chunkHandler.checkUploadedChunks(fileId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/merge-chunks', async (req, res) => {
    try {
        const { fileId, fileName, totalChunks } = req.body;
        const result = await chunkHandler.mergeChunks({ fileId, fileName, totalChunks });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})