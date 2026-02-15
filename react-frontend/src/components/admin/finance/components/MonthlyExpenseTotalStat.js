import React, { useState, useEffect, useCallback } from 'react';
import { Statistic, Spin, message } from 'antd';
import { financeApi } from '../../../../services/financeApi';

const MonthlyTotalStatistic = ({
    year,
    month,
    initialValue = null, // 如果父層已經有資料，可以直接傳入
    prefix = "$",
    title = "月總支出",
}) => {
    const [amount, setAmount] = useState(initialValue);
    const [loading, setLoading] = useState(false);

    const fetchTotal = useCallback(async () => {
        // 如果已經有傳入值，且沒有切換年月，就不重複抓取
        if (initialValue !== null && initialValue !== undefined) {
            setAmount(initialValue);
            return;
        }

        setLoading(true);
        try {
            // 使用你現有的 getExpenses API 來計算總和
            // 或者如果你後端有「直接回傳總額」的 API 會更有效率
            const data = await financeApi.getExpenses(year, month);
            const total = (data || []).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
            setAmount(total);
        } catch (error) {
            console.error("抓取月總額失敗:", error);
            message.error("無法載入月總額");
        } finally {
            setLoading(false);
        }
    }, [year, month, initialValue]);

    useEffect(() => {
        fetchTotal();
    }, [fetchTotal]);

    return (

        <Spin spinning={loading} size="small">
            <Statistic
                title={<span style={{ color: '--primary-color' }}>{title} ({month}月)</span>}
                value={amount || 0}
                precision={0}
                prefix={prefix}
            />
        </Spin>
    );
};

export default MonthlyTotalStatistic;