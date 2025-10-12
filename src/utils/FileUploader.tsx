import React, { useEffect, useState } from 'react';
import axios from 'axios';

class FileUploader {
    uploadedChunks: Set<any>;
    chunkSize: number;
    baseUrl: string;
    file: File | null;
    fileId: string;
    totalChunks: number;
    progress: number;
    constructor({ chunkSize = 1024 * 1024, baseUrl = 'http://localhost:3001' }) {
        this.chunkSize = chunkSize;
        this.baseUrl = baseUrl;
        this.file = null;
        this.fileId = ''; // 文件唯一标识
        this.totalChunks = 0; // 总分片数
        this.uploadedChunks = new Set(); // 已上传的切片索引
        this.progress = 0; // 上传进度
    }
    initFile(file: File) {
        this.file = file;
        this.totalChunks = Math.ceil(file.size / this.chunkSize);
        this.fileId = `${file.name}-${file.size}-${file.lastModified}`;
        this.uploadedChunks.clear();
        this.progress = 0;
        return this.fileId;
    }
    getChunk(chunkIndex: number) {
        const start = chunkIndex * this.chunkSize;
        const end = Math.min(start + this.chunkSize, this.file.size);
        return this.file.slice(start, end);
    }
    async uploadChunk(chunkIndex: number) {
        if (this.uploadedChunks.has(chunkIndex)) {
            return;
        }
        const chunk = this.getChunk(chunkIndex);
        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('fileId', this.fileId);
        formData.append('chunkIndex', chunkIndex.toString());
        formData.append('totalChunks', this.totalChunks.toString());

        await axios.post(`${this.baseUrl}/upload-chunk`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (e) => {
                const chunkProgress = e.loaded / e.total;
                const overallProgress = (this.uploadedChunks.size + chunkProgress) / this.totalChunks * 100;
                this.progress = Math.min(100, Math.round(overallProgress));
            },
        });
        this.uploadedChunks.add(chunkIndex);
        return chunkIndex;
    }

    async uploadAllChunks(concurrency = 3) {
        if (!this.file) throw new Error('File not initialized');

        const chunkIndices = Array.from({ length: this.totalChunks }, (_, i) => i);
        const results = [];
        for (let i = 0; i < chunkIndices.length; i += concurrency) {
            const batch = chunkIndices.slice(i, i + concurrency);
            const batchResults = await Promise.all(
                batch.map((index) => this.uploadChunk(index))
            );
            results.push(...batchResults);
        }
        return results;
    }

    async mergeChunks() {
        return axios.post(`${this.baseUrl}/merge-chunks`, {
            fileId: this.fileId,
            fileName: this.file.name,
            totalChunks: this.totalChunks,
        })
    }

    async checkUploadedChunks() {
        const res = await axios.get(`${this.baseUrl}/check-chunks`, {
            params: { fileId: this.fileId }
        });
        this.uploadedChunks = new Set(res.data.uploadAllChunks);
        this.progress = (this.uploadedChunks.size / this.totalChunks) * 100;
        return this.uploadedChunks;
    }

    const FileUploadComponent = () => {
        const [progress, setProgress] = useState(0);
        const [status, setStatus] = useState('idle'); // idle, uploading, paused, completed, error
        const fileInputRef = useRef<HTMLInputElement>(null);
        const uploader = new FileUploader({});

        const handleFileSelect = async (e: { target: { files: any[]; }; }) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                setStatus('uploading');
                const fileId = uploader.initFile(file);
                await uploader.checkUploadedChunks();
                setProgress(uploader.progress);

                await uploader.uploadAllChunks();
                await uploader.mergeChunks();

                setStatus('success');
                alert('文件上传成功')
            } catch (error) {
                setStatus('error');
                console.error('文件上传失败:', error);
            }
        }

        useEffect(() => {
            if (status === 'uploading') {
                const timer = setInterval(() => {
                    setProgress(uploader.progress);
                }, 3000)
                return () => clearInterval(timer);
            }
        }, [status])

        return (
            <div style={{maxWidth: 500, margin:'20px auto'}}>
                <h2>大文件分片上传</h2>
                <input type="file" disabled={status === 'uploading'} ref={fileInputRef} onChange={handleFileSelect} style={{display:'none'}}/>
                {status === 'uploading' && (
                    <progress value={progress} max="100"></progress>
                )}
                {status === 'success' && (
                    <p>文件上传成功</p>
                )}
                {status === 'error' && (
                    <p>文件上传失败</p>
                )}
            </div>
        )
    }
}