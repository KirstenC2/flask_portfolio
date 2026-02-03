import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Typography, Card } from 'antd';
import { EyeOutlined, HistoryOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import ReportViewDrawer from './ReportViewDrawer';

const { Title } = Typography;

const WeeklyReportList = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

    const fetchReports = async () => {
        const token = localStorage.getItem('adminToken');
        try {
            const res = await axios.get('http://localhost:5001/api/admin/thinking/weekly-reports', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReports(res.data);
        } catch (error) {
            console.error("獲取列表失敗", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReports(); }, []);

    const columns = [
        {
            title: '匯報日期',
            dataIndex: 'ref_tag',
            key: 'ref_tag',
            render: (text) => <Tag color="blue">{text}</Tag>,
            sorter: (a, b) => dayjs(a.ref_tag).unix() - dayjs(b.ref_tag).unix(),
        },
        {
            title: '報告標題',
            dataIndex: 'title',
            key: 'title',
            render: (text) => <strong>{text}</strong>,
        },
        {
            title: '使用模板',
            dataIndex: 'template_name',
            key: 'template_name',
            render: (text, record) => (
                <Tag color="purple">{text} ({record.category})</Tag>
            ),
        },
        {
            title: '建立時間',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
        },
        {
            title: '操作',
            key: 'action',
            render: (_, record) => (
                <Button 
                    icon={<EyeOutlined />} 
                    onClick={() => {
                        setSelectedId(record.id);
                        setDrawerVisible(true);
                    }}
                >
                    閱讀內容
                </Button>
            ),
        },
    ];

    return (
        <Card style={{ height: '100%', borderRadius: '15px' }}>
            <Space style={{ marginBottom: 20 }}>
                <HistoryOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                <Title level={3} style={{ margin: 0 }}>週報歷史紀錄</Title>
            </Space>
            
            <Table 
                columns={columns} 
                dataSource={reports} 
                rowKey="id" 
                loading={loading}
                pagination={{ pageSize: 10 }}
            />

            <ReportViewDrawer 
                visible={drawerVisible} 
                reportId={selectedId} 
                onClose={() => setDrawerVisible(false)} 
            />
        </Card>
    );
};

export default WeeklyReportList;