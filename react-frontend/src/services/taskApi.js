// src/api/taskApi.js
const API_BASE = "http://localhost:5001/api/admin";

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
});

export const taskApi = {
    // 新增任務
    create: async (feature_id, taskData) => {
        const res = await fetch(`${API_BASE}/features/${feature_id}/tasks`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ ...taskData, feature_id })
        });
        return res; // 直接回傳 res，不要回傳 res.json()
    },
    // 更新任務 (狀態, 內容, 優先級, 取消原因)
    update: async (taskId, fields) => {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(fields)
        });
        return res; // 確保回傳原始 res 物件
    },

    // 刪除任務
    delete: async (taskId) => {
        return fetch(`${API_BASE}/tasks/${taskId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
    }
};