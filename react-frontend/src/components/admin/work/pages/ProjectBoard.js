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
import TechMeetingMinutes from '../components/TechMeetingMinutes';
import dayjs from 'dayjs';
const { Sider, Content, Header } = Layout;
const { Title, Text } = Typography;

const ProjectBoard = ({ projectId, onBack }) => {
  const { project, loading, error, actions } = useProjectDetail(projectId);
  const [selectedMeetingId, setSelectedMeetingId] = useState(null);

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


  // 2. 處理：點擊「撰寫新會議」
  const handleMeetingSelect = () => {
    setViewMode('meeting');
    setSelectedMeetingId(null); // 重要：清空 ID 代表是「新增」
    setSelectedFeatureId(null);
    setCurrentAnalysisId(null);
    setIsAddingFeature(false);
  };

  // 3. 處理：選擇歷史會議
  const handleSelectMeeting = (id) => {
    setSelectedMeetingId(id);
    setViewMode('meeting');
    setSelectedFeatureId(null);
    setCurrentAnalysisId(null);
    setIsAddingFeature(false);
  };

  // 4. 處理：刪除會議
  const handleDeleteMeeting = (meeting) => {
    Modal.confirm({
      title: '確定要刪除這份會議記錄嗎？',
      content: `會議「${meeting.title}」刪除後將無法復原。`,
      okText: '確定刪除',
      okType: 'danger',
      onOk: async () => {
        const success = await actions.deleteMeetingMinute(meeting.id); // 需在 hook 補上此 action
        if (success) {
          message.success('會議記錄已刪除');
          if (selectedMeetingId === meeting.id) setSelectedMeetingId(null);
        }
      }
    });
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
      margin:'20px',
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


            <Divider style={{ margin: '0 0 8px 0' }} />

            <Text type="secondary" style={{ fontSize: '12px', fontWeight: 600 }}>技術管理</Text>
            <Button
              block
              type="text"
              icon={<FileTextOutlined />}
              onClick={handleMeetingSelect}
              style={{
                textAlign: 'left', marginTop: 8, height: '40px', borderRadius: '8px',
                background: viewMode === 'thinking' && !currentAnalysisId ? '#e6f7ff' : 'transparent',
                color: viewMode === 'thinking' && !currentAnalysisId ? '#1890ff' : 'inherit'
              }}
            >
              撰寫技術會議記錄
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

            {project?.meeting_minutes?.length > 0 && (
              <List
                size="small"
                style={{ marginTop: 8 }}
                dataSource={project.meeting_minutes}
                renderItem={item => {
                  const isSelected = selectedMeetingId === item.id && viewMode === 'meeting';

                  return (
                    <List.Item
                      className="thinking-nav-item"
                      onClick={() => handleSelectMeeting(item.id)}
                      style={{
                        cursor: 'pointer',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        marginBottom: '4px',
                        background: isSelected ? '#f0f9ff' : 'transparent',
                        transition: 'all 0.3s',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      actions={[
                        <Tooltip title="刪除會議記錄">
                          <Button
                            type="text"
                            size="small"
                            icon={<DeleteOutlined style={{ fontSize: '12px' }} />}
                            danger
                            onClick={(e) => {
                              e.stopPropagation(); // 防止觸發點擊選中
                              handleDeleteMeeting(item);
                            }}
                          />
                        </Tooltip>
                      ]}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', width: '100%', overflow: 'hidden' }}>
                        {/* 圖示 */}
                        <FileTextOutlined
                          style={{
                            marginRight: 10,
                            color: isSelected ? '#1890ff' : '#8c8c8c',
                            fontSize: '14px'
                          }}
                        />

                        {/* 文字內容區 */}
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                          <Text
                            ellipsis
                            style={{
                              fontSize: '13px',
                              color: isSelected ? '#1890ff' : 'inherit',
                              fontWeight: isSelected ? 600 : 400,
                              lineHeight: '1.2'
                            }}
                          >
                            {item.title || "未命名會議"}
                          </Text>
                          <Text
                            type="secondary"
                            style={{
                              fontSize: '11px',
                              marginTop: '2px',
                              color: isSelected ? '#69c0ff' : '#bfbfbf'
                            }}
                          >
                            {item.date ? dayjs(item.date).format('YYYY/MM/DD') : '無日期'}
                          </Text>
                        </div>
                      </div>
                    </List.Item>
                  );
                }}
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
                <ThinkingProjectDetail
                  key={`detail-${currentAnalysisId}`}
                  analysisId={currentAnalysisId}
                />
              ) : (
                <ThinkingProjectForm
                  key="new-thinking"
                  projectIdFromContext={projectId}
                  templateId={selectedTemplateId}
                  onCreated={(newId) => {
                    actions.refresh(true);
                    setCurrentAnalysisId(newId);
                  }}
                />
              )}
            </div>
          ) : viewMode === 'meeting' ? (
            /* --- 💡 新增：技術會議記錄介面 --- */
            <TechMeetingMinutes
              key={selectedMeetingId || 'new-meeting'}
              projectId={projectId}
              meetingId={selectedMeetingId} // 這裡傳入 state 中的 ID
              onSaveSuccess={() => {
                actions.refresh(true); // 儲存後刷左側清單
                setSelectedMeetingId(null); // 或者保留 ID 進入編輯模式
              }}
            />
          ) : isAddingFeature ? (
            <div style={{ maxWidth: 800, margin: '0 auto', background: '#fff', padding: '32px', borderRadius: '8px', width: '100%' }}>
              <Title level={3}>新增功能模組</Title>
              <FeatureForm
                projectId={projectId}
                onSuccess={() => { actions.refresh(true); setIsAddingFeature(false); }}
                onCancel={() => setIsAddingFeature(false)}
              />
            </div>
          ) : activeFeature ? (
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
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="選擇功能模組、戰略工具或技術會議以開始" style={{ marginTop: '100px' }}>
              <Space>
                <Button type="dashed" icon={<PlusOutlined />} onClick={() => { setViewMode('feature'); setIsAddingFeature(true); }}>
                  新增 Feature
                </Button>
                <Button type="dashed" icon={<FileTextOutlined />} onClick={handleMeetingSelect}>
                  撰寫會議記錄
                </Button>
              </Space>
            </Empty>
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default ProjectBoard;