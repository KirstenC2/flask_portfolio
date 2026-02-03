import React, { useState, useEffect } from 'react';
import { Table, Tag, Card, Typography,Button, Space, Spin, List, Badge,
   Empty, Tabs, message } from 'antd';
import { 
  CalendarOutlined, CheckCircleFilled, RocketOutlined, 
  HistoryOutlined, FormOutlined, LeftOutlined, PlusOutlined 
} from '@ant-design/icons';
import axios from 'axios';

// 引入子組件
import ReportFormPage from '../components/forms/ReportFormPage'; // 確保路徑正確
import WeeklyReportList from '../components/WeeklyReportList';

const { Text, Title } = Typography;

const WarBoardPage = () => {
  const [loading, setLoading] = useState(true);
  const [warData, setWarData] = useState({ start_date: '', data: [] });
  const [activeTab, setActiveTab] = useState('1');
  const [isAdding, setIsAdding] = useState(false); // 控制是否正在新增匯報

  useEffect(() => {
    fetchWarBoard();
  }, []);

  const fetchWarBoard = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('http://localhost:5001/api/admin/warboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWarData(response.data);
    } catch (error) {
      message.error("獲取戰報失敗");
    } finally {
      setLoading(false);
    }
  };

  const expandedRowRender = (project) => (
    <div style={{ margin: '0 20px', background: '#f6ffed', padding: '16px', borderRadius: '8px', border: '1px solid #d9f7be' }}>
      {project.features.map(feature => (
        <div key={feature.id} style={{ marginBottom: '12px' }}>
          <Text strong style={{ color: '#389e0d' }}>● {feature.title}</Text>
          <List
            size="small"
            dataSource={feature.tasks}
            renderItem={item => (
              <List.Item style={{ border: 'none', padding: '2px 0 2px 15px' }}>
                <Space>
                  <CheckCircleFilled style={{ color: '#52c41a', fontSize: '12px' }} />
                  <Text type="secondary">{item.content}</Text>
                </Space>
              </List.Item>
            )}
          />
        </div>
      ))}
    </div>
  );

  const columns = [
    { title: '專案名稱', dataIndex: 'title', key: 'title', render: (t) => <Text strong style={{ fontSize: '16px' }}>{t}</Text> },
    { 
      title: '專案類型', dataIndex: 'project_type', key: 'type', 
      render: (tag) => <Tag color={tag === 'work' ? 'volcano' : 'geekblue'} style={{ borderRadius: '10px' }}>{tag ? tag.toUpperCase() : 'SIDE'}</Tag> 
    },
    { 
      title: '本週達成任務數', key: 'count', align: 'center',
      render: (_, record) => {
        const count = record.features.reduce((acc, f) => acc + f.tasks.length, 0);
        return <Badge count={count} showZero color="#52c41a" style={{ boxShadow: 'none' }} />;
      }
    }
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}><Spin size="large" tip="正在讀取戰場數據..." /></div>;

  return (
    <div style={{ padding: '30px', background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Title level={2}><RocketOutlined style={{ color: '#1890ff', marginRight: '12px' }} />戰鬥指揮中心</Title>

        <Tabs 
          activeKey={activeTab} 
          onChange={(key) => {
            setActiveTab(key);
            if (key === '1') setIsAdding(false); // 切換回戰報時重置新增狀態
          }}
          size="large"
          items={[
            {
              key: '1',
              label: (<span><FormOutlined /> 本週即時戰報</span>),
              children: (
                <Card bordered={false} style={{ 
                  height: '100%',
                  borderRadius: '16px', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <div style={{ marginBottom: '20px' }}>
                    <Title level={4}>本週即時戰果</Title>
                    <Text type="secondary"><CalendarOutlined /> 統計區間：{warData.start_date} 至今</Text>
                  </div>
                  <Table
                    columns={columns}
                    dataSource={warData.data} 
                    rowKey="id"
                    expandable={{ expandedRowRender, defaultExpandAllRows: true, showExpandColumn: false }}
                    pagination={false}
                    locale={{ emptyText: <Empty description="本週尚未有達成目標" /> }}
                  />
                </Card>
              )
            },
            {
              key: '2',
              label: (<span><HistoryOutlined /> 匯報管理</span>),
              children: (
                <div style={{ transition: 'all 0.3s' }}>
                  {isAdding ? (
                    /* 新增模式：顯示表單 */
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Button 
                        icon={<LeftOutlined />} 
                        onClick={() => setIsAdding(false)}
                        style={{ marginBottom: '16px' }}
                      >
                        返回歷史清單
                      </Button>
                      <ReportFormPage 
                        weeklyData={warData.data} 
                        onSuccess={() => {
                          setIsAdding(false);
                          // 這裡可以觸發 WeeklyReportList 的重新抓取邏輯
                        }}
                      />
                    </Space>
                  ) : (
                    /* 預設模式：顯示列表與新增按鈕 */
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button 
                          type="primary" 
                          icon={<PlusOutlined />} 
                          size="large"
                          onClick={() => setIsAdding(true)}
                          disabled={warData.data.length === 0} // 沒戰果不讓寫匯報
                        >
                          新增本週匯報
                        </Button>
                      </div>
                      <WeeklyReportList />
                    </Space>
                  )}
                </div>
              )
            }
          ]}
        />
      </div>
    </div>
  );
};

export default WarBoardPage;