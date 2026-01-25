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
    }
};