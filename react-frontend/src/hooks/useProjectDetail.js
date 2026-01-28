// src/hooks/useProjectDetail.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { featureApi } from '../services/featureApi';

export const useProjectDetail = (projectId) => {
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 獲取專案詳情
    const fetchProjectDetail = useCallback(async (isSilent = false) => {
        if (!projectId) return;
        try {
            if (!isSilent) setLoading(true);
            const token = localStorage.getItem('adminToken');
            // 這裡保留 axios 因為它是獲取資料，而 featureApi 使用 fetch 處理操作，兩者可共存
            const response = await axios.get(`http://localhost:5001/api/admin/projects/info/${projectId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const projectData = Array.isArray(response.data) ? response.data[0] : response.data;
            setProject({ ...projectData });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    // 刪除 Feature 邏輯
    const removeFeature = async (featureId) => {
        try {
            const res = await featureApi.delete(featureId);
            if (res.ok) {
                await fetchProjectDetail(true); // 靜默更新
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
            removeFeature
        }
    };
};