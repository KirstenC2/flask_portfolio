import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Typography, Row, Col, ConfigProvider, Space, Divider, Card, Statistic, Progress, Spin, DatePicker, message } from 'antd';
import { WalletOutlined, RocketOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { financeApi } from '../../../services/financeApi';
import SavingGoals from './SavingGoals';
import AddGoalForm from './components/AddGoalForm';
import AccountJars from './components/AccountJars';
import MonthlyExpenseTotalStat from './components/MonthlyExpenseTotalStat';

const { Title, Text } = Typography;

const SavingSection = ({ refreshAll, selectedYear, setSelectedYear, selectedMonth, setSelectedMonth }) => {

    const [incomes, setIncomes] = useState([]);
    const [currentViewDate, setCurrentViewDate] = useState(dayjs());
    // 初始值給予空陣列，防止 SavingGoals 渲染時 map 出錯
    const [goals, setGoals] = useState([]);
    const [loadingGoals, setLoadingGoals] = useState(false);
    const [loading, setLoading] = useState(false);
    // 2. 核心抓取邏輯：加入嚴格的參數檢查
    const fetchGoalsByMonth = useCallback(async (dateObj) => {
        // 1. 強制確保有有效的年份與月份，若無則用當下時間
        const target = (dateObj && dateObj.isValid()) ? dateObj : dayjs();
        const year = target.year();
        const month = target.month() + 1;

        if (!year || !month) return; // 再次防禦

        setLoadingGoals(true);
        try {
            const response = await financeApi.getSavingGoals(year, month);

            // 這裡要解構後端回傳，確保一定是陣列
            const data = Array.isArray(response) ? response : (response?.data || []);
            setGoals(data);
        } catch (error) {
            console.error("載入儲蓄目標失敗:", error);
            setGoals([]); // 失敗時清空，避免舊資料誤導
        } finally {
            setLoadingGoals(false);
        }
    }, []);

    const refreshData = useCallback(async (date) => {
        setLoading(true);
        try {
            const year = date.year();
            const month = date.month() + 1;
            // 假設你後端有對應的 getIncomes API
            const data = await financeApi.getIncomes(year, month);
            setIncomes(data || []);
        } catch (error) {
            console.error("抓取收入數據失敗:", error);
            message.error("無法載入收入資料");
        } finally {
            setLoading(false);
        }
    }, []);
    // 當日期改變時同步所有狀態
    useEffect(() => {
        const year = currentViewDate.year();
        const month = currentViewDate.month() + 1;

        if (year !== selectedYear) setSelectedYear(year);
        if (month !== selectedMonth) setSelectedMonth(month);

        fetchGoalsByMonth(currentViewDate);
        refreshData(currentViewDate);
    }, [currentViewDate, selectedYear, selectedMonth, setSelectedYear, setSelectedMonth]);
    // 3. 計算邏輯：加入更強大的 Null Check
    const currentMonthTotal = useMemo(() => {
        const targetMonth = currentViewDate.month();
        const targetYear = currentViewDate.year();

        return (incomes || [])
            .filter(inc => {
                // 解析 "Thu, 05 Feb 2026 00:00:00 GMT"
                const d = dayjs(inc.income_date || inc.date);

                // 檢查是否解析成功
                if (!d.isValid()) return false;

                const isMatch = d.year() === targetYear && d.month() === targetMonth;

                // 如果 API 有資料但沒顯示，通常是這裡 filter 沒過
                if (!isMatch && incomes.length > 0) {
                    // console.log(`日期不匹配: ${d.format('YYYY-MM')} vs 目標 ${targetYear}-${targetMonth + 1}`);
                }

                return isMatch;
            })
            .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
    }, [incomes, currentViewDate]);

    // 計算本月計畫存入總額
    const totalMonthlySavingGoal = useMemo(() => {
        return (goals || []).reduce((acc, goal) => {
            // 注意：這裡的欄位名稱必須與你後端 Python _goal_to_dict 定義的一致
            return acc + (parseFloat(goal.monthly_push) || 0);
        }, 0);
    }, [goals]);

    const fixedExpenseRate = 0.35;
    const estimatedFixedExpenses = currentMonthTotal * fixedExpenseRate;
    const disposableIncome = currentMonthTotal - totalMonthlySavingGoal - estimatedFixedExpenses;

    const handleAddGoal = async (formData) => {
        try {
            // 1. 檢查 formData 內容，將 AntD 表單可能的 camelCase 轉為 snake_case
            const payload = {
                title: formData.title,
                target_amount: parseFloat(formData.target_amount || formData.targetAmount), // 相容兩種寫法
                monthly_push: parseFloat(formData.monthly_push || formData.monthlyPush || 0),
                icon: formData.icon || '💰',
                // 2. 重要：補回被註解的日期，否則後端計算生效月份會出錯
                effective_date: currentViewDate.startOf('month').format('YYYY-MM-DD')
            };

            console.log("🚀 準備送出的資料:", payload);

            await financeApi.createSavingGoal(payload);
            message.success('已新增儲蓄目標');

            // 3. 重新整理資料
            fetchGoalsByMonth(currentViewDate);
            refreshAll();
        } catch (err) {
            console.error("新增失敗詳情:", err);
            message.error(`新增失敗: ${err.message}`);
        }
    };

    return (
        <Card variant="outlined" style={{ height: '100%' }}>
            <ConfigProvider theme={{ token: { borderRadius: 12, colorPrimary: '#5ec2c2' } }}>
                <Row justify="space-between" align="middle" style={{ marginBottom: 32 }}>
                    <Col>
                        <Title level={2} style={{ marginBottom: 4 }}>財務調度中心</Title>
                        <Space size="middle">
                            <Text type="secondary">切換統計月份：</Text>
                            <DatePicker
                                picker="month"
                                value={currentViewDate}
                                onChange={(date) => {
                                    if (date) setCurrentViewDate(date);
                                }}
                                allowClear={false}
                            />
                            {loadingGoals && <Spin size="small" />}
                        </Space>
                    </Col>
                    <Col>
                        <Statistic
                            title={`${currentViewDate.format('M')} 月總收入`}
                            value={currentMonthTotal}
                            prefix="$"
                            styles={{ color: '#5ec2c2' }}
                        />
                    </Col>
                </Row>

                <Space direction="vertical" size={32} style={{ display: 'flex' }}>
                    <AccountJars income={currentMonthTotal} />

                    <Card size="small" className="shadow-sm" style={{ borderRadius: '16px' }}>
                        <div style={{ padding: '24px' }}>
                            <Title level={4} style={{ marginBottom: 32, textAlign: 'center' }}>
                                <span style={{ marginRight: 8 }}>⚖️</span>資金分配監控
                            </Title>

                            <Row gutter={[16, 24]} justify="space-around" align="top">
                                {/* 1. 儲蓄目標 */}
                                <Col xs={12} sm={6} style={{ textAlign: 'center' }}>
                                    <Statistic
                                        title="本月儲蓄目標"
                                        value={totalMonthlySavingGoal}
                                        prefix={<RocketOutlined />}
                                        suffix="元"
                                        styles={{ fontSize: '20px' }}
                                    />
                                </Col>

                                {/* 2. 預估支出 - 解決小數點問題 */}
                                <Col xs={12} sm={6} style={{ textAlign: 'center' }}>
                                    <Statistic
                                        title="預估固定支出"
                                        // 💡 使用 Math.round 解決 32,535.999999 的顯示問題
                                        value={Math.round(estimatedFixedExpenses)}
                                        prefix={<SafetyCertificateOutlined />}
                                        suffix="元"
                                        styles={{ fontSize: '20px' }}
                                    />
                                </Col>

                                {/* 3. 實際支出 - 建議修改該組件內容使其只渲染 Statistic */}
                                <Col xs={12} sm={6} style={{ textAlign: 'center' }}>
                                    {/* 建議進入 MonthlyExpenseTotalStat 組件，
                   把外層的 Card 或背景 Div 拿掉，直接回傳 <Statistic />
                */}
                                    <MonthlyExpenseTotalStat
                                        year={currentViewDate.year()}
                                        month={currentViewDate.month() + 1}
                                        title="本月實際支出"
                                    />
                                </Col>

                                {/* 4. 剩餘金額 */}
                                <Col xs={12} sm={6} style={{ textAlign: 'center' }}>
                                    <Statistic
                                        title="剩餘可動用金額"
                                        value={Math.round(disposableIncome)}
                                        prefix={<WalletOutlined />}
                                        suffix="元"
                                        styles={{
                                            color: disposableIncome < 0 ? '#ff4d4f' : '#52c41a',
                                            fontSize: '24px', // 讓結果稍微大一點點
                                            fontWeight: 'bold'
                                        }}
                                    />
                                </Col>
                            </Row>
                        </div>
                    </Card>

                    <Divider orientation="left">儲蓄進度詳情</Divider>

                    <Row gutter={[32, 32]}>
                        <Col xs={24} lg={9}>
                            <AddGoalForm onAdd={handleAddGoal} />
                        </Col>
                        <Col xs={24} lg={15}>
                            {/* 傳入 goals，並在 SavingGoals 組件內也要做空值判斷 */}
                            <SavingGoals
                                goals={goals || []}
                                onRefresh={() => fetchGoalsByMonth(currentViewDate)}
                            />
                        </Col>
                    </Row>
                </Space>
            </ConfigProvider>
        </Card>
    );
};

export default SavingSection;