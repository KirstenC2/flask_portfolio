import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileUpload, faCheckCircle, faTrash, faEye, faTimes, faSpinner, faEdit, faPlus 
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import ResumeBuilder from './ResumeBuilder'; // 導入編輯器
import './ResumePanel.css';

const ResumePanel = () => {
    const [resumes, setResumes] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    
    // --- 視圖控制 ---
    const [view, setView] = useState('list'); // 'list' 或 'builder'
    const [editingResume, setEditingResume] = useState(null);

    // --- 預覽 Modal State ---
    const [showModal, setShowModal] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => { fetchResumes(); }, []);

    const fetchResumes = async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/upload/resumes');
            setResumes(response.data);
        } catch (error) { console.error('Error:', error); }
    };

    // 切換到 Builder
    const openBuilder = (resume = null) => {
        setEditingResume(resume);
        setView('builder');
    };

    // 回到列表並刷新
    const backToList = () => {
        setView('list');
        setEditingResume(null);
        fetchResumes();
    };

    // --- PDF 預覽邏輯 ---
    const handlePreview = async (filename) => {
        try {
            const res = await axios.get(`http://localhost:5001/api/attachments/view/resume/${filename}`);
            if (res.data.url) {
                setPreviewUrl(res.data.url.replace("minio:9000", "localhost:9000"));
                setShowModal(true);
            }
        } catch (err) { alert("無法預覽"); }
    };

    const handleDelete = async (file_name) => {
        try {
            await axios.delete(`http://localhost:5001/api/attachments/remove/resume/${file_name}`);
            fetchResumes();
        } catch (err) { alert("刪除失敗"); }
    };

    // 如果目前是 Builder 模式，直接回傳 Builder 組件
    if (view === 'builder') {
        return <ResumeBuilder resume={editingResume} onBack={backToList} />;
    }

    return (
        <div className="resume-container">
            <div className="section-header">
                <h1>Resume Management</h1>
                <div className="header-actions">
                    <button className="btn btn-secondary" onClick={() => openBuilder()}>
                        <FontAwesomeIcon icon={faPlus} /> Create Live Resume
                    </button>
                    <label className="btn btn-primary clickable">
                        <FontAwesomeIcon icon={isUploading ? faSpinner : faFileUpload} spin={isUploading} /> 
                        {isUploading ? ' Uploading...' : ' Upload PDF'}
                        <input type="file" onChange={(e) => {/* ...原本的上傳邏輯... */}} hidden />
                    </label>
                </div>
            </div>

            <div className="resume-items-list">
                {resumes.map(resume => (
                    <div key={resume.id} className={`resume-card-item ${resume.is_active ? 'active-border' : ''}`}>
                        <div className="card-main">
                            <div className="card-info">
                                <div className="post-title-cell">{resume.title}</div>
                                <div className="date-text">Updated: {new Date(resume.created_at).toLocaleDateString()}</div>
                            </div>

                            <div className="actions">
                                {/* 編輯按鈕：導向 Builder */}
                                <button className="btn-icon text-warning" onClick={() => openBuilder(resume)}>
                                    <FontAwesomeIcon icon={faEdit} />
                                </button>
                                <button className="btn-icon text-info" onClick={() => handlePreview(resume.file_name)}>
                                    <FontAwesomeIcon icon={faEye} />
                                </button>
                                <button className={`btn-icon ${resume.is_active ? 'text-success' : 'text-gray'}`} onClick={() => {/* ... */}}>
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

            {/* Preview Modal 保持不變 */}
            {showModal && (
                <div className="preview-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="preview-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>PDF Preview</h3>
                            <button onClick={() => setShowModal(false)}><FontAwesomeIcon icon={faTimes}/></button>
                        </div>
                        <div className="modal-body">
                            <iframe src={previewUrl} width="100%" height="100%" title="Preview"/>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResumePanel;