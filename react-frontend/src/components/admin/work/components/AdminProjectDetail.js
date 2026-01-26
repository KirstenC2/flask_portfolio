import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faTasks, faSpinner,
  faChevronRight, faFilter, faPlus, faTrashAlt, faSearch
} from '@fortawesome/free-solid-svg-icons';
import '../style/AdminProjectDetail.css';
import '../../../../common/global.css'
import TaskManager from './TaskManager';
import FeatureForm from './FeatureForm';
import { featureApi } from '../../../../services/featureApi';

const AdminProjectDetail = ({ projectId, onBack }) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- 重構關鍵 State ---
  const [selectedFeatureId, setSelectedFeatureId] = useState(null);
  const [featureSearch, setFeatureSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddingFeature, setIsAddingFeature] = useState(false);

  const fetchProjectDetail = useCallback(async (isSilent = false) => {
    if (!projectId) return;
    try {
      if (!isSilent) setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`http://localhost:5001/api/admin/projects/info/${projectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const projectData = Array.isArray(response.data) ? response.data[0] : response.data;
      setProject({ ...projectData });

      // 自動選取第一個 Feature
      if (!selectedFeatureId && projectData.dev_features?.length > 0) {
        setSelectedFeatureId(projectData.dev_features[0].id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId, selectedFeatureId]);

  useEffect(() => {
    fetchProjectDetail();
  }, [fetchProjectDetail]);

  const handleDeleteFeature = async (e, featureId) => {
    e.stopPropagation();
    if (!window.confirm("確定要刪除此 Feature 及其下所有任務嗎？")) return;
    try {
      const res = await featureApi.delete(featureId);
      if (res.ok) {
        if (selectedFeatureId === featureId) setSelectedFeatureId(null);
        await fetchProjectDetail(true);
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // 取得左側導覽列表（支援搜尋）
  const filteredNavList = useMemo(() => {
    if (!project?.dev_features) return [];
    return project.dev_features.filter(f => 
      f.title.toLowerCase().includes(featureSearch.toLowerCase())
    );
  }, [project, featureSearch]);

  // 取得當前選中的 Feature 詳細資料
  const activeFeature = useMemo(() => {
    const feature = project?.dev_features?.find(f => f.id === selectedFeatureId);
    if (!feature) return null;

    // 同時在這裡處理 Task 的狀態過濾
    const filteredTasks = (feature.tasks || []).filter(task => {
      if (statusFilter === 'all') return true;
      return task.status === statusFilter;
    });

    return { ...feature, filteredTasks };
  }, [project, selectedFeatureId, statusFilter]);

  if (loading && !project) return <div className="admin-loading"><FontAwesomeIcon icon={faSpinner} spin /> Loading...</div>;
  if (error) return <div className="admin-error">Error: {error} <button onClick={() => fetchProjectDetail()}>Retry</button></div>;

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
              <option value="todo">To Do</option>
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
                <button className="nav-del-btn" onClick={(e) => handleDeleteFeature(e, f.id)}>
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
                  fetchProjectDetail(true);
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
                  onUpdate={() => fetchProjectDetail(true)}
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