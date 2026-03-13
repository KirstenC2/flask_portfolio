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
    // src/hooks/useProjectDetail.js 修正 fetch 邏輯

    const fetchProjectDetail = useCallback(async (isSilent = false) => {
        if (!projectId) return;
        try {
            if (!isSilent) setLoading(true);

            // 1. 拿專案基本資料
            const infoRes = await axios.get(`${API_BASE}/projects/info/${projectId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const projectData = Array.isArray(infoRes.data) ? infoRes.data[0] : infoRes.data;

            // 2. 拿會議紀錄列表 (這就是剛才 404 的那個 API)
            const meetingsRes = await axios.get(`${API_BASE}/projects/${projectId}/meetings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // 3. 合併資料
            setProject({
                ...projectData,
                meeting_minutes: meetingsRes.data // 將列表塞進去，左側 List 就會動了
            });

        } catch (err) {
            console.error("載入失敗:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [projectId, token]);

    // --- 🚀 新增：會議記錄相關 Actions ---

    // 1. 刪除會議紀錄
    const deleteMeetingMinute = async (meetingId) => {
        try {
            const response = await axios.delete(`${API_BASE}/meetings/${meetingId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 200) {
                await fetchProjectDetail(true); // 成功後靜默刷新 Sidebar 清單
                return true;
            }
        } catch (err) {
            console.error("刪除會議紀錄失敗", err);
        }
        return false;
    };

    const fetchMeetingMinutes = useCallback(async () => {
        if (!projectId) return;
        try {
            const response = await axios.get(`${API_BASE}/projects/${projectId}/meetings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // 將抓到的會議列表合併進 project 物件中，這樣 List 才會重新渲染
            setProject(prev => ({
                ...prev,
                meeting_minutes: response.data
            }));
        } catch (err) {
            console.error("Fetch meetings error:", err);
        }
    }, [projectId, token]);

    const getMeetingMinuteDetail = async (meetingId) => {
        try {
            const response = await axios.get(`${API_BASE}/meetings/${meetingId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.data; // 直接回傳詳情，不要 setProject
        } catch (err) {
            console.error("Fetch meeting detail error:", err);
            throw err;
        }
    };

    // --- 原有其他 Actions ---

    const deleteThinkingProject = async (analysisId) => {
        try {
            const response = await axios.delete(`${API_BASE}/thinking-projects/${analysisId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 200 || response.status === 204) {
                await fetchProjectDetail(true);
                return true;
            }
        } catch (err) {
            console.error("Delete thinking project error:", err);
        }
        return false;
    };

    const updateFeature = async (featureId, data) => {
        try {
            const response = await axios.patch(`${API_BASE}/features/${featureId}`, data, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 200 || response.status === 204) {
                await fetchProjectDetail(true);
                return true;
            }
        } catch (err) {
            console.error("Update feature error:", err);
        }
        return false;
    };

    const removeFeature = async (featureId) => {
        try {
            const res = await featureApi.delete(featureId);
            if (res.ok) {
                await fetchProjectDetail(true);
                return true;
            }
        } catch (err) {
            console.error("Delete feature error:", err);
        }
        return false;
    }

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
            updateFeature,
            deleteThinkingProject,
            deleteMeetingMinute,  // 💡 記得回傳這個
            fetchMeetingMinutes,      // 💡 記得回傳這個
            getMeetingMinuteDetail
        }
    };
};