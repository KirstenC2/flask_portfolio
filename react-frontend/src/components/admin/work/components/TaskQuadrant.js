import React, { useState, useEffect } from 'react';
import '../style/TaskQuadrant.css';

const TaskQuadrant = () => {
  // --- 基礎狀態 ---
  const [tasks, setTasks] = useState({ p1: [], p2: [], p3: [], p4: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // --- 篩選與編輯狀態 ---
  const [statusFilter, setStatusFilter] = useState('all'); 
  const [draggingTask, setDraggingTask] = useState(null);

  // --- 新增：專案與功能連動狀態 ---
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [features, setFeatures] = useState([]);
  const [selectedFeatureId, setSelectedFeatureId] = useState('');

  const API_BASE_URL = 'http://localhost:5001/api/admin';
  const getToken = () => localStorage.getItem('adminToken');

  // 1. 初始化：獲取專案列表
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = getToken();
        if (!token) return;
        
        const res = await fetch(`${API_BASE_URL}/projects`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProjects(data);
        }
      } catch (err) {
        console.error("初始化專案失敗", err);
      }
    };
    fetchInitialData();
  }, []);

  // 2. 當選擇專案改變時：自動抓取該專案的功能模組 (Features)
  useEffect(() => {
    const fetchFeatures = async () => {
      if (!selectedProjectId) {
        setFeatures([]);
        setSelectedFeatureId('');
        return;
      }
      try {
        const token = getToken();
        const res = await fetch(`${API_BASE_URL}/projects/${selectedProjectId}/features`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setFeatures(data);
          if (data.length > 0) setSelectedFeatureId(data[0].id);
        }
      } catch (err) {
        console.error("抓取功能模組失敗", err);
      }
    };
    fetchFeatures();
  }, [selectedProjectId]);

  // 3. 核心：獲取任務數據 (包含專案篩選)
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) throw new Error('請先登入');

      let url = `${API_BASE_URL}/quadrant/tasks?status=${statusFilter}`;
      if (selectedProjectId) url += `&project_id=${selectedProjectId}`;

      const response = await fetch(url, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });

      if (!response.ok) throw new Error('API 回傳錯誤');
      
      const apiTasks = await response.json();
      setTasks(formatTasksFromAPI(apiTasks));
    } catch (err) {
      setError(err.message);
      setTasks({ p1: [], p2: [], p3: [], p4: [] });
    } finally {
      setLoading(false);
    }
  };

  // 當篩選條件改變時刷新列表
  useEffect(() => {
    fetchTasks();
  }, [statusFilter, selectedProjectId]);

  // 格式化任務並執行「All 模式隱藏 Done」邏輯
  const formatTasksFromAPI = (apiTasks) => {
    const formatted = { p1: [], p2: [], p3: [], p4: [] };
    
    apiTasks.forEach((task) => {
      // 邏輯：如果 statusFilter 是 'all'，手動排除 status === 'done' 的任務
      if (statusFilter === 'all' && task.status === 'done') return;

      const formattedTask = {
        id: task.id,
        text: task.content || '無內容',
        completed: task.status === 'done',
        priority: task.priority || 4,
        status: task.status || 'pending',
        date_created: task.date_created,
        dev_feature_id: task.dev_feature_id
      };

      const key = `p${formattedTask.priority}`;
      if (formatted[key]) formatted[key].push(formattedTask);
    });
    return formatted;
  };

  // 5. 其他功能 (Toggle, Delete, Drag) ...
  const handleToggleComplete = async (quadrant, taskId, currentStatus) => {
    const newStatus = currentStatus === 'done' ? 'pending' : 'done';
    try {
      const token = getToken();
      await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      fetchTasks();
    } catch (err) { console.error(err); }
  };

  const handleDeleteTask = async (quadrant, taskId) => {
    if (!window.confirm('確定刪除？')) return;
    try {
      const token = getToken();
      await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchTasks();
    } catch (err) { console.error(err); }
  };

  // --- 拖拽邏輯 ---
  const handleDragStart = (e, quadrant, task) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ quadrant, taskId: task.id }));
    setDraggingTask(task);
  };

  const handleDrop = async (e, targetQuadrant) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    if (data.quadrant === targetQuadrant) return;

    const priorityMap = { p1: 1, p2: 2, p3: 3, p4: 4 };
    try {
      const token = getToken();
      await fetch(`${API_BASE_URL}/tasks/${data.taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ priority: priorityMap[targetQuadrant] })
      });
      fetchTasks();
    } catch (err) { console.error(err); }
    setDraggingTask(null);
  };

  // --- 渲染組件 ---
  const getQuadrantInfo = (q) => ({
    p1: { title: '重要且緊急', color: '#ff6b6b' },
    p2: { title: '重要不緊急', color: '#51cf66' },
    p3: { title: '不重要但緊急', color: '#339af0' },
    p4: { title: '不重要不緊急', color: '#868e96' }
  })[q];

  const renderTaskItem = (quadrant, task) => (
    <div 
      key={task.id} 
      className={`task-item ${task.completed ? 'completed' : ''}`}
      draggable 
      onDragStart={(e) => handleDragStart(e, quadrant, task)}
    >
      <div className="task-content">
        <input 
          type="checkbox" 
          checked={task.completed} 
          onChange={() => handleToggleComplete(quadrant, task.id, task.status)} 
        />
        <div className="task-text">
          <div className="task-main-text">{task.text}</div>
          <div className="task-meta">
            <span>{task.status}</span>
            {task.date_created && <span>{new Date(task.date_created).toLocaleDateString()}</span>}
          </div>
        </div>
        <button className="delete-btn" onClick={() => handleDeleteTask(quadrant, task.id)}>×</button>
      </div>
    </div>
  );

  const hasToken = !!getToken();

  return (
    <div className="app">
      <header className="header">
        <h1>四象限任務管理</h1>
        <p className="subtitle">高效專案與研發任務追蹤</p>
      </header>

      <div className="main-container">
        <div className="control-bar">
          <div className="filter-group">
            <label>專案: </label>
            <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}>
              <option value="">所有專案</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>

            <label style={{ marginLeft: '15px' }}>模式: </label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">待辦視角 (隱藏已完成)</option>
              <option value="pending">進行中</option>
              <option value="done">已完成紀錄</option>
            </select>
          </div>
          
          <button className="refresh-btn" onClick={fetchTasks}>重新整理</button>
        </div>

        {hasToken ? (
          <>
            <div className="quadrant-container">
              {['p1', 'p2', 'p3', 'p4'].map(qKey => (
                <div 
                  key={qKey} 
                  className={`quadrant quadrant-${qKey}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, qKey)}
                >
                  <div className="quadrant-header">
                    <div className="quadrant-title" style={{ backgroundColor: getQuadrantInfo(qKey).color }}>
                      <h2>{getQuadrantInfo(qKey).title}</h2>
                    </div>
                  </div>
                  <div className="task-list">
                    {tasks[qKey].map(task => renderTaskItem(qKey, task))}
                    {tasks[qKey].length === 0 && <div className="empty-state">暫無任務</div>}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="login-prompt">請先登入系統</div>
        )}
      </div>
    </div>
  );
};

export default TaskQuadrant;