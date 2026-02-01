// src/hooks/useProjectDetail.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { featureApi } from '../services/featureApi';

export const useProjectDetail = (projectId) => {
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const token = localStorage.getItem('adminToken');

    const API_BASE = 'http://localhost:5001/api/admin';

    // 獲取專案詳情
    const fetchProjectDetail = useCallback(async (isSilent = false) => {
        if (!projectId) return;
        try {
            if (!isSilent) setLoading(true);
            const response = await axios.get(`${API_BASE}/projects/info/${projectId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const projectData = Array.isArray(response.data) ? response.data[0] : response.data;
            setProject({ ...projectData });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [projectId, token]);

    // 更新 Feature 邏輯 (修正 axios 語法)
    const updateFeature = async (featureId, data) => {
        try {
            // axios.patch(url, data, config)
            const response = await axios.patch(`${API_BASE}/features/${featureId}`, data, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.status === 200 || response.status === 204) {
                await fetchProjectDetail(true); // 靜默更新數據
                return true;
            }
            return false;
        } catch (err) {
            console.error("Update feature error:", err);
            return false;
        }
    };

    // 刪除 Feature 邏輯
    const removeFeature = async (featureId) => {
        try {
            const res = await featureApi.delete(featureId);
            if (res.ok) {
                await fetchProjectDetail(true); 
                return true;
            }
            return false;
        } catch (err) {
            console.error("Delete feature error:", err);
            return false;
        }
    };

    useEffect(() => {
        fetchProjectDetail();
    }, [fetchProjectDetail]);

    return {
        project,
        loading,
        error,
        actions: {
            refresh: fetchProjectDetail,
            removeFeature,
            updateFeature
        }
    };
};