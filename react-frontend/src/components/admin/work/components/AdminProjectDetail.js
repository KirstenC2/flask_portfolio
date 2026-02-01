import React, { useState, useMemo } from 'react';
import {
  Layout, List, Input, Select, Button, Tag,
  Empty, Spin, Modal, Space, Typography, Tooltip
} from 'antd';
import {
  ArrowLeftOutlined, PlusOutlined, DeleteOutlined,
  SearchOutlined, FilterOutlined, HighlightOutlined,
  ProjectOutlined, RocketOutlined
} from '@ant-design/icons';
import TaskManager from './TaskManager';
import FeatureForm from './FeatureForm';
import '../../../../common/global.css';
import '../style/AdminProjectDetail.css';
import { useProjectDetail } from '../../../../hooks/useProjectDetail';

const { Sider, Content, Header } = Layout;
const { Title, Text } = Typography;

const AdminProjectDetail = ({ projectId, onBack }) => {
  const { project, loading, error, actions } = useProjectDetail(projectId);

  const [selectedFeatureId, setSelectedFeatureId] = useState(null);
  const [featureSearch, setFeatureSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddingFeature, setIsAddingFeature] = useState(false);

  // 1. 過濾 Feature 列表
  const filteredNavList = useMemo(() => {
    return project?.dev_features?.filter(f =>
      f.title.toLowerCase().includes(featureSearch.toLowerCase())
    ) || [];
  }, [project, featureSearch]);

  // 2. 處理當前選中的 Feature 及其任務
  const activeFeature = useMemo(() => {
    const feature = project?.dev_features?.find(f => f.id === selectedFeatureId);
    if (!feature) return null;

    const filteredTasks = (feature.tasks || []).filter(task => {
      if (statusFilter === 'all') return true;
      return task.status === statusFilter;
    });

    return { ...feature, filteredTasks };
  }, [project, selectedFeatureId, statusFilter]);

  // 3. 刪除處理 (使用 AntD Modal)
  const handleDeleteFeature = (e, feature) => {
    e.stopPropagation();
    Modal.confirm({
      title: '確定要刪除此 Feature 嗎？',
      content: `將會永久刪除 「${feature.title}」 及其下所有任務。`,
      okText: '確定刪除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        const success = await actions.removeFeature(feature.id);
        if (success && selectedFeatureId === feature.id) {
          setSelectedFeatureId(null);
        }
      },
    });
  };

  const handleUpdateFeature = async (field, value) => {
    // 避免無意義的更新
    if (activeFeature[field] === value) return;

    try {
      // 假設你的 actions 裡有 updateFeature 這個方法
      // 傳入 featureId 以及要修改的欄位物件，例如 { title: '新標題' }
      await actions.updateFeature(activeFeature.id, { [field]: value });

      // 靜默重新抓取資料，保持畫面最新
      actions.refresh(true);
    } catch (err) {
      console.error("更新失敗:", err);
    }
  };

  if (loading && !project) return (
    <div style={{ padding: '100px', textAlign: 'center' }}>
      <Spin size="large" tip="Loading Project..." />
    </div>
  );

  return (
    <Layout style={{ minHeight: '80vh', background: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
      {/* 頂部 Header */}
      <Header style={{
        background: '#fff',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <Space size="middle">
          <Button
            shape="circle"
            icon={<ArrowLeftOutlined />}
            onClick={onBack}
          />
          <Title level={4} style={{ margin: 0 }}>{project?.title}</Title>
        </Space>

        <Space>
          <Select
            defaultValue="all"
            style={{ width: 140 }}
            onChange={setStatusFilter}
            suffixIcon={<FilterOutlined />}
          >
            <Select.Option value="all">所有任務</Select.Option>
            <Select.Option value="pending">待處理</Select.Option>
            <Select.Option value="doing">進行中</Select.Option>
            <Select.Option value="done">已完成</Select.Option>
          </Select>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsAddingFeature(true)}
          >
            New Feature
          </Button>
        </Space>
      </Header>

      <Layout>
        {/* 左側 Sidebar */}
        <Sider width={300} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
          <div style={{ padding: '16px' }}>
            <Input
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="搜尋功能模組..."
              value={featureSearch}
              onChange={e => setFeatureSearch(e.target.value)}
              allowClear
            />
          </div>
          <div style={{ height: 'calc(100% - 64px)', overflowY: 'auto' }}>
            <List
              dataSource={filteredNavList}
              renderItem={item => (
                <List.Item
                  onClick={() => {
                    setSelectedFeatureId(item.id);
                    setIsAddingFeature(false);
                  }}
                  className={`feature-nav-item ${selectedFeatureId === item.id ? 'active' : ''}`}
                  style={{
                    cursor: 'pointer',
                    padding: '12px 20px',
                    background: selectedFeatureId === item.id ? '#f0f9ff' : 'transparent',
                    borderRight: selectedFeatureId === item.id ? '3px solid #1890ff' : 'none',
                    transition: 'all 0.3s'
                  }}
                  actions={[
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={(e) => handleDeleteFeature(e, item)}
                    />
                  ]}
                >
                  <List.Item.Meta
                    avatar={<RocketOutlined style={{ color: selectedFeatureId === item.id ? '#1890ff' : '#8c8c8c' }} />}
                    title={<Text strong={selectedFeatureId === item.id}>{item.title}</Text>}
                    description={`${item.tasks?.length || 0} 個任務`}
                  />
                </List.Item>
              )}
            />
          </div>
        </Sider>

        {/* 右側 工作區 */}
        <Content style={{ padding: '24px', background: '#fafafa', overflowY: 'auto' }}>
          {isAddingFeature ? (
            <div style={{ maxWidth: 800, margin: '0 auto', background: '#fff', padding: '32px', borderRadius: '8px' }}>
              <Title level={3}>新增功能模組</Title>
              <FeatureForm
                projectId={projectId}
                onSuccess={() => {
                  actions.refresh(true);
                  setIsAddingFeature(false);
                }}
                onCancel={() => setIsAddingFeature(false)}
              />
            </div>
          ) : activeFeature ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ marginBottom: '24px', padding: '16px', background: '#fff', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
                <Title
                  level={3}
                  style={{ margin: 0 }}
                  editable={{
                    icon: <HighlightOutlined />, // 你需要從 @ant-design/icons 引入
                    tooltip: '點擊編輯標題',
                    onChange: (val) => handleUpdateFeature('title', val),
                  }}
                >
                  {activeFeature.title}
                </Title>

                <div style={{ marginTop: '8px' }}>
                  <Text
                    type="secondary"
                    editable={{
                      tooltip: '點擊編輯描述',
                      onChange: (val) => handleUpdateFeature('description', val),
                    }}
                  >
                    {activeFeature.description || "暫無描述，點擊新增..."}
                  </Text>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <TaskManager
                  feature_id={activeFeature.id}
                  tasks={activeFeature.filteredTasks}
                  onUpdate={() => actions.refresh(true)}
                />
              </div>
            </div>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="請從左側選擇一個功能模組來管理任務"
              style={{ marginTop: '100px' }}
            >
              <Button type="dashed" icon={<PlusOutlined />} onClick={() => setIsAddingFeature(true)}>
                立即新增一個 Feature
              </Button>
            </Empty>
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminProjectDetail;