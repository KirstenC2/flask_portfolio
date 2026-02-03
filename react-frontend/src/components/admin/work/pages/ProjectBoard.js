import React, { useState, useMemo } from 'react';
import {
  Layout, List, Select, Button,
  Empty, Spin, Modal, Space, Typography, Tooltip, Divider, message
} from 'antd';
import {
  ArrowLeftOutlined, PlusOutlined, DeleteOutlined,
  FilterOutlined, RocketOutlined, FileTextOutlined
} from '@ant-design/icons';
import TaskBoard from '../components/TaskBoard';
import FeatureForm from '../components/forms/FeatureForm';
import ThinkingProjectForm from '../components/forms/ThinkingProjectForm';// 確保路徑正確
import ThinkingProjectDetail from '../components/ThinkingProjectDetail'; // 確保路徑正確
import '../../../../common/global.css';
import '../style/AdminProjectDetail.css';
import { useProjectDetail } from '../../../../hooks/useProjectDetail';

const { Sider, Content, Header } = Layout;
const { Title, Text } = Typography;

const ProjectBoard = ({ projectId, onBack }) => {
  const { project, loading, error, actions } = useProjectDetail(projectId);

  const [selectedFeatureId, setSelectedFeatureId] = useState(null);
  const [featureSearch, setFeatureSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddingFeature, setIsAddingFeature] = useState(false);

  // 核心控制模式
  const [viewMode, setViewMode] = useState('feature'); // 'feature' 或 'thinking'
  const [selectedTemplateId, setSelectedTemplateId] = useState(1); // 預設麥肯錫為 1
  const [currentAnalysisId, setCurrentAnalysisId] = useState(null); // 新增：追蹤目前選中的分析 ID

  // 1. 過濾 Feature 列表
  const filteredNavList = useMemo(() => {
    return project?.dev_features?.filter(f =>
      f.title.toLowerCase().includes(featureSearch.toLowerCase())
    ) || [];
  }, [project, featureSearch]);

  // 2. 處理當前選中的 Feature
  const activeFeature = useMemo(() => {
    const feature = project?.dev_features?.find(f => f.id === selectedFeatureId);
    if (!feature) return null;

    const filteredTasks = (feature.tasks || []).filter(task => {
      if (statusFilter === 'all') return true;
      return task.status === statusFilter;
    });

    return { ...feature, filteredTasks };
  }, [project, selectedFeatureId, statusFilter]);

  // 處理：點擊「建立新分析」
  const handleCreateNewThinking = (templateId) => {
    setSelectedTemplateId(templateId);
    setCurrentAnalysisId(null); // 這裡現在會讓右側顯示「Landing Page 介紹頁」
    setViewMode('thinking');
    setSelectedFeatureId(null);
    setIsAddingFeature(false);
  };


  // 處理：點擊「歷史分析紀錄」
  const handleSelectExistingThinking = (analysisId) => {
    setCurrentAnalysisId(analysisId);
    setViewMode('thinking');
    setSelectedFeatureId(null);
    setIsAddingFeature(false);
  };

  // 處理：刪除歷史分析紀錄
  const handleDeleteThinking = (analysis) => {
  Modal.confirm({
    title: '確定要刪除此分析嗎？',
    icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
    content: `戰略分析「${analysis.title}」刪除後將無法復原。`,
    okText: '確定刪除',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      // 呼叫 Hook 裡的 deleteThinkingProject
      const success = await actions.deleteThinkingProject(analysis.id);
      if (success) {
        message.success('分析已刪除');
        // 如果目前右側正開著這一筆，就清空 ID 回到 Landing Page
        if (currentAnalysisId === analysis.id) {
          setCurrentAnalysisId(null);
        }
      } else {
        message.error('刪除失敗，請檢查網路連線');
      }
    },
  });
};

  // 切換至 Feature
  const handleFeatureSelect = (id) => {
    setSelectedFeatureId(id);
    setViewMode('feature');
    setIsAddingFeature(false);
  };

  // 刪除處理
  const handleDeleteFeature = (e, feature) => {
    e.stopPropagation();
    Modal.confirm({
      title: '確定要刪除此 Feature 嗎？',
      content: `將會永久刪除 「${feature.title}」 及其下所有任務。`,
      okText: '確定刪除',
      okType: 'danger',
      onOk: async () => {
        const success = await actions.removeFeature(feature.id);
        if (success && selectedFeatureId === feature.id) {
          setSelectedFeatureId(null);
        }
      },
    });
  };

  const handleUpdateFeature = async (field, value) => {
    if (activeFeature[field] === value) return;
    try {
      await actions.updateFeature(activeFeature.id, { [field]: value });
      actions.refresh(true);
    } catch (err) {
      console.error("更新失敗:", err);
    }
  };

  if (loading && !project) return (
    <div style={{ padding: '100px', textAlign: 'center' }}>
      <Spin size="large" tip="載入專案中..." />
    </div>
  );

  return (
    <Layout style={{ 
      minHeight: '80vh', 
      background: '#fff', 
      borderRadius: '12px', 
      padding: '24px',
      overflow: 'hidden' 
    }}>
      <Header style={{
        background: '#fff',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <Space size="middle">
          <Button shape="circle" icon={<ArrowLeftOutlined />} onClick={onBack} />
          <Title level={4} style={{ margin: 0 }}>{project?.title}</Title>
        </Space>

        <Space>
          {viewMode === 'feature' && (
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
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setViewMode('feature'); setIsAddingFeature(true); }}>
            New Feature
          </Button>
        </Space>
      </Header>

      <Layout>
        {/* 左側 Sidebar */}

        {/* 左側 Sidebar */}
        <Sider width={280} theme="light" style={{ borderRight: '1px solid #f0f0f0', overflowY: 'auto' }}>

          {/* 戰略分析區塊 */}
          <div style={{ padding: '16px' }}>
            <Text type="secondary" style={{ fontSize: '12px', fontWeight: 600 }}>戰略思考</Text>
            <Button
              block
              type="text"
              icon={<PlusOutlined />}
              onClick={() => handleCreateNewThinking(1)}
              style={{
                textAlign: 'left', marginTop: 8, height: '40px', borderRadius: '8px',
                background: viewMode === 'thinking' && !currentAnalysisId ? '#e6f7ff' : 'transparent',
                color: viewMode === 'thinking' && !currentAnalysisId ? '#1890ff' : 'inherit'
              }}
            >
              啟動麥肯錫分析
            </Button>

            {/* Listing: 歷史分析紀錄 */}
            {/* Listing: 歷史分析紀錄 */}
            {project?.thinking_analyses?.length > 0 && (
              <List
                size="small"
                style={{ marginTop: 8 }}
                dataSource={project.thinking_analyses}
                renderItem={item => (
                  <List.Item
                    className="thinking-nav-item"
                    onClick={() => handleSelectExistingThinking(item.id)}
                    style={{
                      cursor: 'pointer', border: 'none', padding: '8px 12px', borderRadius: '6px',
                      background: currentAnalysisId === item.id ? '#f0f9ff' : 'transparent',
                      transition: 'all 0.3s'
                    }}
                    // --- 在這裡加入右側動作按鈕 ---
                    actions={[
                      <Tooltip title="刪除此分析">
                        <Button
                          type="text"
                          size="small"
                          icon={<DeleteOutlined style={{ fontSize: '12px' }} />}
                          danger
                          onClick={(e) => {
                            e.stopPropagation(); // 關鍵：防止觸發 List.Item 的 onClick (切換分析)
                            handleDeleteThinking(item);
                          }}
                        />
                      </Tooltip>
                    ]}
                  >
                    <Space size="small">
                      <FileTextOutlined style={{ color: currentAnalysisId === item.id ? '#1890ff' : '#8c8c8c' }} />
                      <Text
                        ellipsis
                        style={{
                          width: 130, // 稍微縮減寬度以騰出空間給刪除鈕
                          color: currentAnalysisId === item.id ? '#1890ff' : 'inherit',
                          fontWeight: currentAnalysisId === item.id ? 500 : 400
                        }}
                      >
                        {item.title}
                      </Text>
                    </Space>
                  </List.Item>
                )}
              />
            )}
          </div>
          <Divider style={{ margin: '0 0 8px 0' }} />
          
          <div style={{ height: 'calc(100% - 130px)', overflowY: 'auto' }}>
            <Text type="secondary" style={{ padding: '16px', fontSize: '12px', fontWeight: 600 }}>專案工項</Text>
            <List
              dataSource={filteredNavList}
              renderItem={item => (
                <List.Item
                  onClick={() => handleFeatureSelect(item.id)}
                  className={`feature-nav-item ${selectedFeatureId === item.id && viewMode === 'feature' ? 'active' : ''}`}
                  style={{
                    cursor: 'pointer',
                    padding: '12px 20px',
                    background: (selectedFeatureId === item.id && viewMode === 'feature') ? '#f0f9ff' : 'transparent',
                    borderRight: (selectedFeatureId === item.id && viewMode === 'feature') ? '3px solid #1890ff' : 'none',
                  }}
                  actions={[
                    <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={(e) => handleDeleteFeature(e, item)} />
                  ]}
                >
                  <List.Item.Meta
                    avatar={<RocketOutlined style={{ color: (selectedFeatureId === item.id && viewMode === 'feature') ? '#1890ff' : '#8c8c8c' }} />}
                    title={<Text strong={selectedFeatureId === item.id}>{item.title}</Text>}
                  />
                </List.Item>
              )}
            />
          </div>
        </Sider>

        {/* 右側 工作區 */}
        {/* 右側 工作區 */}
        <Content style={{ padding: '24px', background: '#fafafa', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {viewMode === 'thinking' ? (
            <div style={{ background: '#fff', padding: '40px 24px', borderRadius: '12px', minHeight: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              {currentAnalysisId ? (
                /* 模式 A：編輯詳情模式 - 點擊歷史紀錄或建立成功後進入 */
                <ThinkingProjectDetail
                  key={`detail-${currentAnalysisId}`}
                  analysisId={currentAnalysisId}
                />
              ) : (
                /* 模式 B：建立模式 - 顯示 Landing Page 與標題輸入 */
                <ThinkingProjectForm
                  key="new-thinking"
                  projectIdFromContext={projectId}
                  templateId={selectedTemplateId}
                  onCreated={(newId) => {
                    actions.refresh(true);        // 重新整理左側 Sidebar 的歷史清單
                    setCurrentAnalysisId(newId);  // 自動切換到 Detail 模式
                  }}
                />
              )}
            </div>
          ) : isAddingFeature ? (
            /* --- 新增 Feature 介面 --- */
            <div style={{ maxWidth: 800, margin: '0 auto', background: '#fff', padding: '32px', borderRadius: '8px', width: '100%' }}>
              <Title level={3}>新增功能模組</Title>
              <FeatureForm
                projectId={projectId}
                onSuccess={() => { actions.refresh(true); setIsAddingFeature(false); }}
                onCancel={() => setIsAddingFeature(false)}
              />
            </div>
          ) : activeFeature ? (
            /* --- Feature 任務看板模式 --- */
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
              <div style={{ marginBottom: '24px', padding: '16px', background: '#fff', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
                <Title level={3} style={{ margin: 0 }} editable={{ onChange: (val) => handleUpdateFeature('title', val) }}>
                  {activeFeature.title}
                </Title>
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary" editable={{ onChange: (val) => handleUpdateFeature('description', val) }}>
                    {activeFeature.description || "暫無描述，點擊新增..."}
                  </Text>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <TaskBoard
                  feature_id={activeFeature.id}
                  tasks={activeFeature.filteredTasks}
                  onUpdate={() => actions.refresh(true)}
                />
              </div>
            </div>
          ) : (
            /* --- 預設空白狀態 --- */
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="選擇功能模組或戰略工具以開始" style={{ marginTop: '100px' }}>
              <Button type="dashed" icon={<PlusOutlined />} onClick={() => { setViewMode('feature'); setIsAddingFeature(true); }}>
                立即新增一個 Feature
              </Button>
            </Empty>
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default ProjectBoard;