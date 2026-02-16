import React,{ useState, useCallback } from "react";
import { financeApi } from "../services/financeApi";
import { message } from "antd";
export const useExpenseData = () => {
    const [data, setData] = useState({
        expenses: [], dailySummaries: [], monthlyStats: [], 
        yearlyStats: [], monthlyTrend: []
    });
    const [loading, setLoading] = useState(false);

    const refreshData = useCallback(async (date) => {
        setLoading(true);
        try {
            const year = date.year();
            const month = date.month() + 1;
            const [expenseList, summaryData, mStats, yStats, trendData] = await Promise.all([
                financeApi.getExpenses(year, month),
                financeApi.getDailySummary(year, month),
                financeApi.getCategoryStats(year, month),
                financeApi.getCategoryStats(year),
                financeApi.getExpenseStats(year)
            ]);

            setData({
                expenses: expenseList || [],
                dailySummaries: summaryData || [],
                monthlyStats: mStats || [],
                yearlyStats: yStats || [],
                monthlyTrend: Array.isArray(trendData) ? trendData : []
            });
        } catch (error) {
            message.error("獲取數據失敗");
        } finally {
            setLoading(false);
        }
    }, []);

    return { ...data, loading, refreshData };
};

