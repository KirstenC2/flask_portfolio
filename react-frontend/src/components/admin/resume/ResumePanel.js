import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileUpload, faCheckCircle, faTrash, faEye } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import '../../../common/global.css';
import './ResumePanel.css';

const ResumePanel = () => {
    const [resumes, setResumes] = useState([]);
    const [isUploading, setIsUploading] = useState(false);

    const fetchResumes = async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/upload/resumes');
            setResumes(response.data);
        } catch (error) {
            console.error('Error fetching resumes:', error);
        }
    };

    useEffect(() => { fetchResumes(); }, []);

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:5001/api/upload/resume', {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) throw new Error('Upload failed');
            fetchResumes();
        } catch (err) {
            alert("Upload failed: " + err.message);
        } finally {
            setIsUploading(false);
        }
    };

    const toggleActive = async (id) => {
        await fetch(`http://localhost:5001/api/admin/resumes/${id}/activate`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        });
        fetchResumes();
    };

    // --- 預覽功能實作 ---
    const handlePreview = async (filename) => {
        try {
            // 向 Flask 請求一個 10 分鐘有效的臨時連結
            const response = await axios.get(`http://localhost:5001/api/attachments/view/${filename}`);
            if (response.data.url) {
                window.open(response.data.url, '_blank');
            }
        } catch (error) {
            console.error('Preview error:', error);
            alert("無法開啟預覽");
        }
    };

    return (
        <div className="resume-container">
            <div className="section-header">
                <h1>Resume Management</h1>
                <label className="btn btn-primary clickable">
                    <FontAwesomeIcon icon={faFileUpload} /> {isUploading ? 'Uploading...' : 'Upload New Resume'}
                    <input type="file" onChange={handleUpload} hidden disabled={isUploading} />
                </label>
            </div>

            <div className="resume-items-list">
                {resumes.map(resume => (
                    <div key={resume.id} className={`resume-card-item ${resume.is_active ? 'active-border' : ''}`}>
                        <div className="card-main">
                            <div className="card-info">
                                <div className="post-title-cell">{resume.title}</div>
                                <div className="date-text">Uploaded on: {new Date(resume.created_at).toLocaleDateString()}</div>
                            </div>

                            <div className="actions">
                                {/* 預覽按鈕 */}
                                <button
                                    className="btn-icon text-info"
                                    onClick={() => handlePreview(resume.file_name)}
                                    title="Preview PDF"
                                >
                                    <FontAwesomeIcon icon={faEye} />
                                </button>

                                <button
                                    className={`btn-icon ${resume.is_active ? 'text-success' : 'text-gray'}`}
                                    onClick={() => toggleActive(resume.id)}
                                    title="Set as Active"
                                >
                                    <FontAwesomeIcon icon={faCheckCircle} />
                                </button>
                                
                                <button className="btn-icon text-danger" onClick={() => {/* 刪除邏輯 */ }}>
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ResumePanel;