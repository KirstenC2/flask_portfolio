import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Typography, Row, Col, ConfigProvider, Space, Divider, Card, Statistic, Progress, Spin, DatePicker, message } from 'antd';
import { RocketOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { financeApi } from '../../../services/financeApi';
import SavingGoals from './SavingGoals';
import AddGoalForm from './components/AddGoalForm';
import AccountJars from './components/AccountJars';

const { Title, Text } = Typography;

const SavingSection = ({ refreshAll, selectedYear, setSelectedYear, selectedMonth, setSelectedMonth }) => {
    const [currentViewDate, setCurrentViewDate] = useState(dayjs());
    const [goals, setGoals] = useState([]);
    const [allowanceData, setAllowanceData] = useState({
        monthly_budget: 0,
        total_expenses: 0, // 這裡對應後端的 total_expenses
        remaining: 0,
        total_income: 0,
        analysis: '載入中...'
    });
    const [loadingGoals, setLoadingGoals] = useState(false);

    // 1. 抓取儲蓄目標
    const fetchGoalsByMonth = useCallback(async (dateObj) => {
        const target = (dateObj && dateObj.isValid()) ? dateObj : dayjs();
        const year = target.year();
        const month = target.month() + 1;
        setLoadingGoals(true);
        try {
            const response = await financeApi.getSavingGoals(year, month);
            const data = Array.isArray(response) ? response : (response?.data || []);
            setGoals(data);
        } catch (error) {
            console.error("載入儲蓄目標失敗:", error);
            setGoals([]);
        } finally {
            setLoadingGoals(false);
        }
    }, []);

    // 2. 抓取 55% 預算與總支出數據 (從你剛修改的 Flask API)
    const fetchAllowanceSummary = useCallback(async (date) => {
        try {
            const year = date.year();
            const month = date.month() + 1;
            const data = await financeApi.getAllowanceSummary(year, month);
            setAllowanceData(data);
        } catch (error) {
            console.error("載入預算總覽失敗:", error);
        }
    }, []);

    useEffect(() => {
        const year = currentViewDate.year();
        const month = currentViewDate.month() + 1;

        if (year !== selectedYear) setSelectedYear(year);
        if (month !== selectedMonth) setSelectedMonth(month);

        fetchGoalsByMonth(currentViewDate);
        fetchAllowanceSummary(currentViewDate);
    }, [currentViewDate, selectedYear, selectedMonth, setSelectedYear, setSelectedMonth, fetchGoalsByMonth, fetchAllowanceSummary]);

    // 計算儲蓄目標總額 (顯示用)
    const totalMonthlySavingGoal = useMemo(() => {
        return (goals || []).reduce((acc, goal) => {
            return acc + (parseFloat(goal.monthly_push) || 0);
        }, 0);
    }, [goals]);

    const handleAddGoal = async (formData) => {
        try {
            const payload = {
                title: formData.title,
                target_amount: parseFloat(formData.target_amount),
                monthly_push: parseFloat(formData.monthly_push || 0),
                icon: formData.icon || '💰',
                effective_date: currentViewDate.startOf('month').format('YYYY-MM-DD')
            };
            await financeApi.createSavingGoal(payload);
            message.success('已新增儲蓄目標');
            fetchGoalsByMonth(currentViewDate);
            refreshAll();
        } catch (err) {
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
                                onChange={(date) => date && setCurrentViewDate(date)}
                                allowClear={false}
                            />
                            {loadingGoals && <Spin size="small" />}
                        </Space>
                    </Col>
                    <Col>
                        <Statistic
                            title={`${currentViewDate.format('M')} 月實質收入`}
                            value={allowanceData.total_income}
                            prefix="$"
                            valueStyle={{ color: '#5ec2c2' }}
                        />
                    </Col>
                </Row>

                <Space direction="vertical" size={32} style={{ display: 'flex' }}>
                    {/* 依據實際總收入渲染的罐子分配 */}
                    <AccountJars income={allowanceData.total_income} />

                    <Card size="small" className="shadow-sm" style={{ borderRadius: '16px', background: '#fafafa' }}>
                        <div style={{ padding: '24px' }}>
                            <Title level={4} style={{ marginBottom: 32, textAlign: 'center' }}>
                                <span style={{ marginRight: 8 }}>⚖️</span> 總額預算監控 (55% 法則)
                            </Title>

                            <Row gutter={18} justify="space-around" align="top">
                                {/* 1. 總支出 (包含房租、還債、搬家) */}
                                <Col span={8} style={{ textAlign: 'center' }}>
                                    <Statistic
                                        title="本月總支出"
                                        value={allowanceData.total_expenses}
                                        prefix="NT$"
                                        valueStyle={{ color: '#cf1322' }}
                                    />
                                    <Text type="secondary" style={{ fontSize: '12px' }}>含所有固定與流動開支</Text>
                                </Col>

                                {/* 2. 儲蓄目標 (純顯示) */}
                                <Col span={8} style={{ textAlign: 'center' }}>
                                    <Statistic
                                        title="本月儲蓄計畫"
                                        value={totalMonthlySavingGoal}
                                        prefix={<RocketOutlined />}
                                        suffix="元"
                                    />
                                    <Text type="secondary" style={{ fontSize: '12px' }}>預計存入金額</Text>
                                </Col>

                                {/* 3. 剩餘零用錢 (核心指標) */}
                                <Col span={8} style={{ textAlign: 'center' }}>
                                    <Statistic
                                        title="剩餘可動用金額"
                                        value={allowanceData.remaining}
                                        prefix="NT$"
                                        valueStyle={{
                                            color: allowanceData.remaining >= 0 ? '#52c41a' : '#f5222d',
                                            fontWeight: 'bold'
                                        }}
                                    />
                                    <div style={{ width: '80%', margin: '8px auto 0' }}>
                                        <Progress
                                            percent={Math.max(0, Math.min(100, Math.round((allowanceData.total_expenses / allowanceData.monthly_budget) * 100)))}
                                            status={allowanceData.remaining < 0 ? 'exception' : 'active'}
                                            showInfo={false}
                                            strokeColor={allowanceData.remaining < 0 ? '#f5222d' : '#52c41a'}
                                            size="small"
                                        />
                                    </div>
                                    <Text type="secondary" style={{ fontSize: '11px' }}>
                                        預算上限：{Math.round(allowanceData.monthly_budget)}
                                    </Text>
                                </Col>
                            </Row>
                        </div>
                    </Card>

                    <Divider orientation="left">儲蓄進度詳情</Divider>

                    <Row gutter={18}>
                        <Col xs={24} lg={9}>
                            <AddGoalForm onAdd={handleAddGoal} />
                        </Col>
                        <Col xs={24} lg={15}>
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