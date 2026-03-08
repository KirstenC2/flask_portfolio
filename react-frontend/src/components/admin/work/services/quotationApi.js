// services/quotationApi.js
const API_BASE = 'http://localhost:5001/api/admin'; // 根據你的環境調整

const token = localStorage.getItem('adminToken');

export const quotationApi = {
    // 獲取軍火庫清單
    getStandardServices: async () => {
        const res = await fetch(`${API_BASE}/services`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const json = await res.json();
        // 如果後端回傳 { "services": [...] }，這裡要 return json.services
        return Array.isArray(json) ? json : (json.services || []); 
    },
    // 儲存報價單
    createQuotation: async (data) => {
        const res = await fetch(`${API_BASE}/quotations`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });
        return res.json();
    }
};