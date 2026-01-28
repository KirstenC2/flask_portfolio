import { useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faTasks, faSpinner,
  faChevronRight, faFilter, faPlus, faTrashAlt, faSearch
} from '@fortawesome/free-solid-svg-icons';
import '../style/AdminProjectDetail.css';
import '../../../../common/global.css'
import TaskManager from './TaskManager';
import FeatureForm from './FeatureForm';
import { useProjectDetail } from '../../../../hooks/useProjectDetail';

const AdminProjectDetail = ({ projectId, onBack }) => {
  // --- 1. 使用 Custom Hook 替代原本手寫的 State ---
  const { project, loading, error, actions } = useProjectDetail(projectId);

  // --- 2. 僅保留 UI 專用的局部狀態 ---
  const [selectedFeatureId, setSelectedFeatureId] = useState(null);
  const [featureSearch, setFeatureSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddingFeature, setIsAddingFeature] = useState(false);

  // --- 3. 處理 Feature 列表過濾 ---
  const filteredNavList = useMemo(() => {
    return project?.dev_features?.filter(f => 
      f.title.toLowerCase().includes(featureSearch.toLowerCase())
    ) || [];
  }, [project, featureSearch]);

  // --- 4. 處理當前選中的 Feature 及其任務過濾 ---
  const activeFeature = useMemo(() => {
    const feature = project?.dev_features?.find(f => f.id === selectedFeatureId);
    if (!feature) return null;

    const filteredTasks = (feature.tasks || []).filter(task => {
      if (statusFilter === 'all') return true;
      return task.status === statusFilter;
    });

    return { ...feature, filteredTasks };
  }, [project, selectedFeatureId, statusFilter]);

  // --- 5. 事件處理 (使用 Hook 提供的 actions) ---
  const handleDeleteFeature = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("確定要刪除此 Feature 及其下所有任務嗎？")) {
      const success = await actions.removeFeature(id);
      if (success && selectedFeatureId === id) {
        setSelectedFeatureId(null);
      }
    }
  };

  if (loading && !project) return (
    <div className="admin-loading">
      <FontAwesomeIcon icon={faSpinner} spin /> Loading Project...
    </div>
  );

  if (error) return (
    <div className="admin-error">
      Error: {error} <button onClick={() => actions.refresh()}>Retry</button>
    </div>
  );

  return (
    <div className="project-dashboard">
      {/* 頂部固定 Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <button className="back-circle-btn" onClick={onBack} title="Back">
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <div className="header-info">
            <h1>{project?.title}</h1>
          </div>
        </div>
        
        <div className="header-right">
          <div className="global-status-filter">
            <FontAwesomeIcon icon={faFilter} />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Tasks</option>
              <option value="canceled">Canceled</option>
              <option value="pending">To do</option>
              <option value="doing">In Progress</option>
              <option value="done">Completed</option>
            </select>
          </div>
          <button className="add-primary-btn" onClick={() => setIsAddingFeature(true)}>
            <FontAwesomeIcon icon={faPlus} /> New Feature
          </button>
        </div>
      </header>

      <div className="dashboard-body">
        {/* 左側：Feature 導覽選單 */}
        <aside className="dashboard-sidebar">
          <div className="sidebar-search-box">
            <FontAwesomeIcon icon={faSearch} />
            <input 
              placeholder="Search features..." 
              value={featureSearch}
              onChange={(e) => setFeatureSearch(e.target.value)}
            />
          </div>
          <nav className="feature-nav">
            {filteredNavList.map(f => (
              <div 
                key={f.id} 
                className={`nav-item ${selectedFeatureId === f.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedFeatureId(f.id);
                  setIsAddingFeature(false);
                }}
              >
                <div className="nav-text">
                  <span className="nav-title">{f.title}</span>
                  <span className="nav-count">{f.tasks?.length || 0} tasks</span>
                </div>
                <button 
                  className="nav-del-btn" 
                  onClick={(e) => handleDeleteFeature(e, f.id)}
                >
                  <FontAwesomeIcon icon={faTrashAlt} />
                </button>
                <FontAwesomeIcon icon={faChevronRight} className="active-arrow" />
              </div>
            ))}
          </nav>
        </aside>

        {/* 右側：任務管理工作區 */}
        <main className="dashboard-main">
          {isAddingFeature ? (
            <div className="workspace-card">
              <div className="workspace-header">
                <h2>Create New Feature</h2>
              </div>
              <FeatureForm
                projectId={projectId}
                onSuccess={() => {
                  actions.refresh(true); // 靜默更新
                  setIsAddingFeature(false);
                }}
                onCancel={() => setIsAddingFeature(false)}
              />
            </div>
          ) : activeFeature ? (
            <div className="workspace-content">
              <div className="workspace-header">
                <div className="title-desc">
                  <h2>{activeFeature.title}</h2>
                  <p>{activeFeature.description}</p>
                </div>
              </div>
              <div className="workspace-scroll-area">
                <TaskManager
                  feature_id={activeFeature.id}
                  tasks={activeFeature.filteredTasks}
                  onUpdate={() => actions.refresh(true)} // 靜默更新
                />
              </div>
            </div>
          ) : (
            <div className="workspace-empty">
              <FontAwesomeIcon icon={faTasks} size="4x" />
              <p>Select a feature from the left to manage tasks</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminProjectDetail;