import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileUpload, faCheckCircle, faTrash, faEye, faTimes, faSpinner 
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import '../../../common/global.css';
import './ResumePanel.css';

const ResumePanel = () => {
    const [resumes, setResumes] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    
    // --- 預覽相關 State ---
    const [showModal, setShowModal] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);

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

    const handleDelete = async (filename) => {
        await fetch(`http://localhost:5001/api/attachments/remove/resume/${filename}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        fetchResumes();
    };

    // --- 觸發預覽 ---
    const handlePreview = async (filename) => {
        try {
            const response = await axios.get(`http://localhost:5001/api/attachments/view/resume/${filename}`);
            if (response.data.url) {
                // 將 Minio 容器內部地址替換為本地開發地址
                const browserUrl = response.data.url.replace("minio:9000", "localhost:9000");
                setPreviewUrl(browserUrl);
                setShowModal(true);
            }
        } catch (error) {
            console.error('Preview error:', error);
            alert("無法開啟預覽");
        }
    };

    const closePreview = () => {
        setShowModal(false);
        setPreviewUrl(null);
    };

    return (
        <div className="resume-container">
            <div className="section-header">
                <h1>Resume Management</h1>
                <label className="btn btn-primary clickable">
                    <FontAwesomeIcon icon={isUploading ? faSpinner : faFileUpload} spin={isUploading} /> 
                    {isUploading ? ' Uploading...' : ' Upload New Resume'}
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
                                <button
                                    className="btn-icon text-info"
                                    onClick={() => handlePreview(resume.file_name)}
                                    title="Quick Preview"
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
                                
                                <button className="btn-icon text-danger" onClick={() => handleDelete(resume.file_name)}>
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- 內置 PDF 預覽彈窗 (Modal) --- */}
            {showModal && (
                <div className="preview-modal-overlay" onClick={closePreview}>
                    <div className="preview-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Resume Preview</h3>
                            <button className="close-x" onClick={closePreview}>
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                        <div className="modal-body">
                            {previewUrl ? (
                                <iframe 
                                    src={previewUrl} 
                                    title="PDF Preview"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 'none' }}
                                />
                            ) : (
                                <div className="modal-loading">
                                    <FontAwesomeIcon icon={faSpinner} spin size="2x" />
                                    <p>Loading PDF...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResumePanel;