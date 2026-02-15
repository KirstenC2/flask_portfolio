import React, { useState, useEffect } from 'react';
import { Modal, Table, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { financeApi } from '../../../../services/financeApi';

const { Text } = Typography;

const SavingHistoryModal = ({ visible, onCancel, goal }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible && goal?.id) {
            fetchHistory();
        }
    }, [visible, goal]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            // 💡 假設後端有一個 API 可以獲取特定目標的交易紀錄
            const data = await financeApi.getSavingGoalHistory(goal.id);
            setHistory(data);
        } catch (err) {
            message.error("獲取紀錄失敗");
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: '日期',
            dataIndex: 'transaction_date',
            key: 'date',
            render: (date) => dayjs(date).format('YYYY-MM-DD'),
        },
        {
            title: '金額',
            dataIndex: 'amount',
            key: 'amount',
            render: (val) => <Text strong style={{ color: '#52c41a' }}>+${val.toLocaleString()}</Text>,
        },
        {
            title: '備註',
            dataIndex: 'note',
            key: 'note',
            ellipsis: true,
        },
        {
            title: '狀態',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={status === 'COMPLETED' ? 'green' : 'gold'}>
                    {status === 'COMPLETED' ? '已完成' : '處理中'}
                </Tag>
            ),
        }
    ];

    return (
        <Modal
            title={`💸 ${goal?.title} - 存款紀錄`}
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={600}
        >
            <Table
                dataSource={history}
                columns={columns}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 5 }}
                size="small"
            />
        </Modal>
    );
};

export default SavingHistoryModal;