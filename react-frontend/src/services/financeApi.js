const API_BASE = "http://localhost:5001/api";

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
});

// 通用的處理函數，減少重複代碼
const handleResponse = async (res) => {
    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || 'API request failed');
    }
    return res.json();
};

export const financeApi = {
    // === 債務管理 (Debts) ===
    getDebts: async () => {
        const res = await fetch(`${API_BASE}/debt`, { headers: getHeaders() });
        const data = await handleResponse(res);
        return Array.isArray(data) ? data : (data.data || []);
    },
    createDebt: (data) => fetch(`${API_BASE}/debt`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    }).then(handleResponse),

    addPayment: (debtId, data) => fetch(`${API_BASE}/debt/${debtId}/payment`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    }).then(handleResponse),

    // === 支出管理 (Expenses) ===
    getExpenses: (year, month) =>
        fetch(`${API_BASE}/admin/expenses?year=${year}&month=${month}`, { headers: getHeaders() }).then(handleResponse),

    createExpense: (data) => fetch(`${API_BASE}/admin/expenses`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    }).then(handleResponse),

    updateExpense: (id, data) => fetch(`${API_BASE}/admin/expenses/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
    }).then(handleResponse),

    deleteExpense: (id) => fetch(`${API_BASE}/admin/expenses/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
    }).then(handleResponse),

    // === 統計與摘要 (Stats) ===
    getExpenseStats: (year) =>
        fetch(`${API_BASE}/admin/expenses/stats?year=${year}`, { headers: getHeaders() }).then(handleResponse),

    getDailySummary: (year, month) =>
        fetch(`${API_BASE}/admin/expenses/daily-summary?year=${year}&month=${month}`, { headers: getHeaders() }).then(handleResponse),

    getCategoryStats: (year, month) =>
        fetch(`${API_BASE}/admin/expenses/stats/by-category?year=${year}&month=${month}`, { headers: getHeaders() }).then(handleResponse),

    // === 收入管理 (Incomes) ===
    getIncomes: (year, month) =>
        fetch(`${API_BASE}/admin/incomes?year=${year}&month=${month}`, { headers: getHeaders() }).then(handleResponse),

    createIncome: (data) => fetch(`${API_BASE}/admin/incomes`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
    }).then(handleResponse),

    updateIncome: (id, data) => fetch(`${API_BASE}/admin/incomes/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
    }).then(handleResponse),

    deleteIncome: (id) => fetch(`${API_BASE}/admin/incomes/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    }).then(handleResponse),

    // === 儲蓄目標與計畫 (Saving Goals) ===

    // 獲取特定月份的目標及其對應撥款額
    // financeApi.js
    getSavingGoals: (year, month) => {
        // 加上這行 Debug，看看瀏覽器發出請求前，參數是什麼
        return fetch(`${API_BASE}/admin/saving/goals?year=${year}&month=${month}`, {
            headers: getHeaders()
        }).then(handleResponse);
    },
    // 建立新目標及其初始計畫
    createSavingGoal: (data) => fetch(`${API_BASE}/admin/saving/goals`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
            title: data.title,
            target_amount: data.target_amount,
            icon: data.icon || '💰',
            monthly_push: data.monthly_push,
            effective_date: data.effective_date // 應傳入 YYYY-MM-DD
        })
    }).then(handleResponse),

    // 調整特定月份之後的計畫金額 (對應 PUT 接口)
    adjustSavingPlan: (goalId, data) => fetch(`${API_BASE}/admin/saving/goals/${goalId}/plan`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
            monthly_push: data.monthly_push,
            effective_date: data.effective_date // 指撥款金額變動的月份
        })
    }).then(handleResponse),

    // 刪除目標 (會連帶刪除歷史計畫)
    deleteSavingGoal: (goalId) => fetch(`${API_BASE}/admin/saving/goals/${goalId}`, {
        method: 'DELETE',
        headers: getHeaders()
    }).then(handleResponse),

    // === 類別與基礎設定 ===
    getCategories: () => fetch(`${API_BASE}/admin/expense/categories`, { headers: getHeaders() }).then(handleResponse),
    getIncomeCategories: () => fetch(`${API_BASE}/admin/incomes/categories`, { headers: getHeaders() }).then(handleResponse),
    depositToGoal: (data) => fetch(`${API_BASE}/admin/saving/deposit`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
    }).then(handleResponse),
    getSavingGoalHistory: (goalId) =>
        fetch(`${API_BASE}/admin/saving/goals/${goalId}/history`, {
            headers: getHeaders()
        }).then(handleResponse),

    getRecurringExpenses: () =>
        fetch(`${API_BASE}/admin/expense/recurring`, {
            headers: getHeaders()
        }).then(handleResponse),
    createRecurringExpense: (data) => fetch(`${API_BASE}/admin/expense/recurring`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
    }).then(handleResponse),
    updateRecurringExpenses: (id, data) => fetch(`${API_BASE}/admin/expense/recurring/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
    }).then(handleResponse),
    removeRecurringExpenses: (id) => fetch(`${API_BASE}/admin/expense/recurring/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    }).then(handleResponse),
    getAllowanceSummary: async (year, month) => {
        const response = await fetch(`${API_BASE}/admin/expenses/allowance-summary`, {
            params: { year, month },
            headers: getHeaders()
        }).then(handleResponse);
        return response;
    },

};