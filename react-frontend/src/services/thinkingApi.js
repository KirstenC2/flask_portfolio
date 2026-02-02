const API_BASE = 'http://localhost:5001/api/admin'; // 根據你的後端路徑調整

export const thinkingApi = {
    // 1. 取得所有可用模板 (McKinsey, SWOT 等)
    getTemplates: async () => {
        const res = await fetch(`${API_BASE}/templates`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
        });
        return await res.json();
    },

    // 2. 建立新的思考分析專案 (初始化步驟內容)
    createThinkingProject: async (payload) => {
        // payload 包含 { template_id, title }
        const res = await fetch(`${API_BASE}/thinking-projects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("建立失敗");
        return await res.json();
    },

    // 3. 取得特定分析專案的詳細內容 (包含各步驟內容)
    getThinkingProjectDetail: async (projectId) => {
        const res = await fetch(`${API_BASE}/thinking-projects/${projectId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
        });
        if (!res.ok) throw new Error("讀取失敗");
        return await res.json();
    },

    // 4. 更新分析內容 (自動儲存用)
    updateThinkingProject: async (projectId, payload) => {
        if (!projectId || projectId === 'null') {
            console.error("中止請求：projectId 為空");
            return; 
        }
        // payload 格式: { contents: [{ step_order: 1, content: "..." }, ...] }
        const res = await fetch(`${API_BASE}/thinking-projects/${projectId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify(payload)
        });
        return await res.json();
    },

    // 5. 刪除專案
    deleteThinkingProject: async (projectId) => {
        const res = await fetch(`${API_BASE}/thinking-projects/${projectId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
        });
        return await res.json();
    }
};