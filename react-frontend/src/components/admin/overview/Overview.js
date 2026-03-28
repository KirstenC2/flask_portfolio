import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Divider, Skeleton } from 'antd';
import { MailOutlined, DashboardOutlined } from '@ant-design/icons';
import TaskStatistics from '../work/components/TaskStatistics';
import ProjectProgressTable from '../work/components/ProjectProgressTable';

const { Title, Paragraph } = Typography;

const Overview = ({ unreadMessages }) => {
  const [stats, setStats] = useState(null);
  const [warboardData, setWarboardData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const headers = { 'Authorization': `Bearer ${token}` };

      try {
        // 使用 Promise.all 同時發送請求，效率更高
        const [statsRes, warboardRes] = await Promise.all([
          fetch('http://localhost:5001/api/admin/work/statistics', { headers }),
          fetch('http://localhost:5001/api/admin/projects/warboard-stats', { headers })
        ]);

        const statsResult = await statsRes.json();
        const warboardResult = await warboardRes.json();

        if (statsResult.status === 'success') {
          setStats(statsResult.data);
        }
        // 根據你後端回傳結構取 projects 陣列
        setWarboardData(warboardResult.projects || []);

      } catch (err) {
        console.error("Dashboard fetchData error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="dashboard-overview" style={{ padding: '24px' }}>
      <div style={{ marginBottom: 32 }}>
        <Title level={2}>
          <DashboardOutlined style={{ marginRight: 12 }} />
          Admin Dashboard
        </Title>
        <Paragraph type="secondary">
          歡迎回來，Choo！這裡是你 Portfolio 的控制中心，你可以在此管理開發進度與訊息。
        </Paragraph>
      </div>

      {/* <Row gutter={16}>
        <Col span={24}>
          <Card size="small" style={{ background: '#fff7e6', border: '1px solid #ffd591' }}>
            <Statistic
              title="未讀訊息"
              value={unreadMessages}
              prefix={<MailOutlined style={{ marginRight: 8, color: unreadMessages > 0 ? '#fa8c16' : '#bfbfbf' }} />}
              style={{ color: unreadMessages > 0 ? '#fa8c16' : '#bfbfbf' }}
              suffix="封新郵件"
            />
          </Card>
        </Col>
      </Row> */}

      <Divider orientation="left">工作狀態概覽</Divider>

      {/* 💡 修正處：使用 Fragment 包裹多個組件 */}
      {loading ? (
        <Card>
          <Skeleton active />
          <Divider />
          <Skeleton active />
        </Card>
      ) : (
        <>
          <TaskStatistics stats={stats} loading={loading} />
          <ProjectProgressTable projects={warboardData} loading={loading} />
        </>
      )}

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="近期動態" style={{ background: '#fafafa' }}>
            <Paragraph type="secondary" style={{ textAlign: 'center', padding: '20px 0' }}>
              暫無新動態，繼續保持高效開發！
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Overview;