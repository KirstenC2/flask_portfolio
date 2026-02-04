const API_BASE = "http://localhost:5001/api";

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
});

export const financeApi = {
    // 債務相關
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

    // 支出相關
    getExpenses: (year, month) => fetch(`${API_BASE}/admin/expenses?year=${year}&month=${month}`, { headers: getHeaders() }).then(res => res.json()),
    // 獲取月份與每日統計
    getExpenseStats: (year) => 
    fetch(`${API_BASE}/admin/expenses/stats?year=${year}`, { headers: getHeaders() }).then(res => res.json()),
    getCategories: () => fetch(`${API_BASE}/admin/expense-categories`, { headers: getHeaders() }).then(res => res.json()),
    createExpense: (data) => fetch(`${API_BASE}/admin/expenses`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    }),
    getDailySummary: (year, month) => 
        fetch(`${API_BASE}/admin/expenses/daily-summary?year=${year}&month=${month}`, { headers: getHeaders() })
             .then(res => res.json()),
};