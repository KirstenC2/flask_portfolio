// src/services/alcoholService.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api/admin';
const getAuthHeader = () => ({
    headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
});

export const healthService = {
    // 獲取清單 (mode: daily/monthly)
    getLogs: async (mode) => {
        const res = await axios.get(`${API_BASE_URL}/health/alcohol/${mode}`, getAuthHeader());
        return Array.isArray(res.data) ? res.data : [];
    },

    // 獲取連續清醒天數
    getSobrietyStatus: async () => {
        const res = await axios.get(`${API_BASE_URL}/health/sobriety-status`, getAuthHeader());
        return res.data; // { days_count, encouragement: { title, text, color } }
    },

    // 新增紀錄
    createLog: (payload) => axios.post(`${API_BASE_URL}/health/alcohol`, payload, getAuthHeader()),

    // 更新紀錄
    updateLog: (id, payload) => axios.put(`${API_BASE_URL}/health/alcohol/${id}`, payload, getAuthHeader()),

    // 刪除紀錄
    deleteLog: (id) => axios.delete(`${API_BASE_URL}/health/alcohol/${id}`, getAuthHeader()),
};