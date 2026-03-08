const API_BASE = "http://localhost:5001/api";

export const diaryApi = {
    // 獲取日記列表
    fetchDiaries: async (year, month) => {
        const response = await fetch(`${API_BASE}/diary?year=${year}&month=${month}`);
        if (!response.ok) throw new Error('Failed to fetch diaries');
        return response.json();
    },

    // 刪除日記
    deleteDiary: async (id) => {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE}/diary/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Delete failed');
        return response.json();
    },

    // 圖片預覽連結
    fetchImageUrl: async (path) => {
        const [dir, file] = path.split('/');
        const response = await fetch(`${API_BASE}/attachments/view/${dir}/${file}`);
        if (!response.ok) throw new Error('Image fetch failed');
        return response.json();
    },

    // 上傳檔案
    uploadFile: async (file) => {
        const uploadData = new FormData();
        uploadData.append('file', file);
        const response = await fetch(`${API_BASE}/attachments/upload/diary/${Date.now()}`, {
            method: 'POST',
            body: uploadData
        });
        if (!response.ok) throw new Error('Upload failed');
        return response.json();
    },

    // 儲存日記 (新增或更新)
    saveDiary: async (id, data) => {
        const url = id ? `${API_BASE}/diary/${id}` : `${API_BASE}/diary`;
        const response = await fetch(url, {
            method: id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Save failed');
        return response.json();
    },

    getStats: async (year, month) => {
        const token = localStorage.getItem('adminToken'); // 確保 key 名稱與你登入時存的一致
        const response = await fetch(
            `${API_BASE}/diary/stats?year=${year}&month=${month}`, 
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`, // 💡 補上這行
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (response.status === 401) {
            // 如果 Token 過期，可以導向登入頁或報錯
            throw new Error('身份驗證失效，請重新登入');
        }
        
        if (!response.ok) throw new Error('統計數據加載失敗');
        return response.json();
    }
};