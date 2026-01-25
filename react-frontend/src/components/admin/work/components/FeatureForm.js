// src/components/FeatureForm.js
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimes, faSave } from '@fortawesome/free-solid-svg-icons';
import { featureApi } from '../../../../services/featureApi';

const FeatureForm = ({ projectId, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({ title: '', description: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) return alert("請輸入 Feature 標題");

        setIsSubmitting(true);
        try {
            const res = await featureApi.create(projectId, formData);
            if (res.ok) {
                setFormData({ title: '', description: '' });
                onSuccess(); // 重新抓取專案詳情
            }
        } catch (err) {
            console.error("Failed to create feature:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className="feature-add-form" onSubmit={handleSubmit}>
            <div className="form-group">
                <input 
                    type="text" 
                    placeholder="Feature 標題 (例如: 使用者權限系統)" 
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                />
            </div>
            <div className="form-group">
                <textarea 
                    placeholder="描述這個 Feature 的詳細功能..." 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                />
            </div>
            <div className="form-actions">
                <button type="submit" className="btn-save" disabled={isSubmitting}>
                    <FontAwesomeIcon icon={faSave} /> {isSubmitting ? '儲存中...' : '儲存 Feature'}
                </button>
                <button type="button" className="btn-cancel" onClick={onCancel}>
                    取消
                </button>
            </div>
        </form>
    );
};

export default FeatureForm;