import React, { useMemo } from 'react';
import { CheckCircle2, Circle, Ban, Loader2, BarChart3 } from 'lucide-react';
import '../style/todo.css';
import '../../../../common/global.css';

const TaskStatsSection = ({ tasks = [] }) => {
  // Debug 用：如果畫面是 0，請打開 F12 看看印出什麼
  // console.log("Standalone Stats Received:", tasks);

  const stats = useMemo(() => {
    // 確保 tasks 存在且為陣列
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const total = safeTasks.length;

    if (total === 0) {
      return { total: 0, done: 0, doing: 0, todo: 0, canceled: 0, percent: 0 };
    }

    // 獲取狀態的輔助函式（相容不同 API 命名格式）
    const getStatus = (t) => (t.status || t.task_status || '').toLowerCase();

    const done = safeTasks.filter(t => getStatus(t) === 'done').length;
    const doing = safeTasks.filter(t => getStatus(t) === 'doing' || getStatus(t) === 'in progress').length;
    const todo = safeTasks.filter(t => getStatus(t) === 'todo').length;
    const canceled = safeTasks.filter(t => getStatus(t) === 'canceled').length;
    
    // 計算進度：已完成 / (總數 - 已取消)
    const activeTotal = total - canceled;
    const percent = activeTotal > 0 ? Math.round((done / activeTotal) * 100) : 0;

    return { total, done, doing, todo, canceled, percent };
  }, [tasks]);

  return (
    <div className="todo-container stats-mode">
      <div className="stats-inner-box">
        <h2 className="todo-header">
          <BarChart3 className="text-indigo-500" size={20} />
          Feature Health
        </h2>

        {/* 進度條 */}
        <div className="stats-progress-wrapper">
          <div className="flex justify-between items-end mb-2">
            <span className="stats-label">Completion</span>
            <span className="stats-value">{stats.percent}%</span>
          </div>
          <div className="progress-bg">
            <div 
              className="progress-fill" 
              style={{ width: `${stats.percent}%` }}
            ></div>
          </div>
        </div>

        {/* 數據網格 */}
        <div className="stats-grid">
          <div className="stat-item done">
            <CheckCircle2 size={16} className="icon" />
            <div className="stat-content">
              <span className="num">{stats.done}</span>
              <span className="txt">Done</span>
            </div>
          </div>

          <div className="stat-item doing">
            <Loader2 size={16} className="icon" />
            <div className="stat-content">
              <span className="num">{stats.doing}</span>
              <span className="txt">Doing</span>
            </div>
          </div>

          <div className="stat-item todo">
            <Circle size={16} className="icon" />
            <div className="stat-content">
              <span className="num">{stats.todo}</span>
              <span className="txt">To Do</span>
            </div>
          </div>

          <div className="stat-item canceled">
            <Ban size={16} className="icon" />
            <div className="stat-content">
              <span className="num">{stats.canceled}</span>
              <span className="txt">Canceled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskStatsSection;