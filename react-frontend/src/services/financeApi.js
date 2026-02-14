const API_BASE = "http://localhost:5001/api";

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
});

export const financeApi = {
    // === 債務相關 (保持不變) ===
    getDebts: async () => {
        try {
            const res = await fetch(`${API_BASE}/debt`);
            const data = await res.json();
            // 診斷：這裡印出的內容必須是陣列才對
            console.log("FinanceAPI 收到的原始資料:", data);
            
            // 如果後端把資料包在 data 屬性裡，這裡做自動解構
            return Array.isArray(data) ? data : (data.data || []);
        } catch (err) {
            console.error("getDebts API Error:", err);
            return []; // 發生錯誤時回傳空陣列，防止前端崩潰
        }
    },
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

    // // === 支出管理 (CRUD) ===
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

    // // === 統計數據 ===

    // // 獲取圖表用的每月/每日趨勢
    getExpenseStats: (year) =>
        fetch(`${API_BASE}/admin/expenses/stats?year=${year}`, { headers: getHeaders() }).then(res => res.json()),

    // // 獲取日曆格子的金額標籤
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
    getCategories: () => fetch(`${API_BASE}/admin/expense/categories`, { headers: getHeaders() }).then(res => res.json()),
    getIncomeCategories: () => fetch(`${API_BASE}/admin/incomes/categories`, { headers: getHeaders() }).then(res => res.json()),
    getIncomes: (year, month) => 
        fetch(`${API_BASE}/admin/incomes?year=${year}&month=${month}`, { headers: getHeaders() })
            .then(res => res.json()),

    createIncome: (data) =>
        fetch(`${API_BASE}/admin/incomes`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        }).then(res => res.json()),

    updateIncome: (id, data) =>
        fetch(`${API_BASE}/admin/incomes/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        }).then(res => res.json()),

    deleteIncome: (id) =>
        fetch(`${API_BASE}/admin/incomes/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        }).then(res => res.json()),
};