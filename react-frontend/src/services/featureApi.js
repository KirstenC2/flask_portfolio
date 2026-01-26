// src/api/featureApi.js
const API_BASE = "http://localhost:5001/api/admin";

export const featureApi = {
    create: async (projectId, featureData) => {
        const token = localStorage.getItem('adminToken');
        return await fetch(`${API_BASE}/projects/${projectId}/features`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(featureData)
        });
    },
    delete: async (featureId) => {
        const token = localStorage.getItem('adminToken');
        // 使用 fetch 時，不要直接回傳 .json()，否則 res.ok 會消失
        const res = await fetch(`http://localhost:5001/api/admin/features/${featureId}`, {
            method: 'DELETE',
            headers: { 
                'Authorization': `Bearer ${token}` 
            }
        });
        return res; 
    }
};