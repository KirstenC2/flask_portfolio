const API_BASE = "http://localhost:5001/api";

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
});

export const financeApi = {
    // === 債務相關 (保持不變) ===
    getDebts: () => fetch(`${API_BASE}/debt`).then(res => res.json()),
    createDebt: (data) => fetch(`${API_BASE}/debt`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    }),
    addPayment: (debtId, data) => fetch(`${API_BASE}/debt/${debtId}/payment`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    }),

    // === 支出管理 (CRUD) ===
    getExpenses: (year, month) =>
        fetch(`${API_BASE}/admin/expenses?year=${year}&month=${month}`, { headers: getHeaders() }).then(res => res.json()),

    createExpense: (data) => fetch(`${API_BASE}/admin/expenses`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    }),

    // 補上編輯功能
    updateExpense: (id, data) => fetch(`${API_BASE}/admin/expenses/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
    }),

    // 補上刪除功能
    deleteExpense: (id) => fetch(`${API_BASE}/admin/expenses/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
    }).then(res => res.json()),

    // === 統計數據 ===

    // 獲取圖表用的每月/每日趨勢
    getExpenseStats: (year) =>
        fetch(`${API_BASE}/admin/expenses/stats?year=${year}`, { headers: getHeaders() }).then(res => res.json()),

    // 獲取日曆格子的金額標籤
    getDailySummary: (year, month) =>
        fetch(`${API_BASE}/admin/expenses/daily-summary?year=${year}&month=${month}`, { headers: getHeaders() })
            .then(res => res.json()),

    // 新增：獲取分類加總 (對應 Flask 的 /expenses/by-category)
    getCategoryStats: (year, month) => {
        // 使用 URLSearchParams 來確保參數正確編碼
        const params = new URLSearchParams();
        if (year) params.append('year', year);
        if (month) params.append('month', month);

        return fetch(`${API_BASE}/admin/expenses/stats/by-category?${params.toString()}`, {
            headers: getHeaders()
        }).then(res => res.json());
    },

    // === 類別管理 ===
    getCategories: () => fetch(`${API_BASE}/admin/expense-categories`, { headers: getHeaders() }).then(res => res.json()),
};