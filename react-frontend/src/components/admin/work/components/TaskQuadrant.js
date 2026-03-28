import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Select, Button, Checkbox, Tag, Space, Typography, Empty, message, Popconfirm } from 'antd';
import { ReloadOutlined, DeleteOutlined, PushpinOutlined, HolderOutlined } from '@ant-design/icons';

// dnd-kit 核心組件
import { 
  DndContext, closestCorners, KeyboardSensor, PointerSensor, 
  useSensor, useSensors, DragOverlay, useDroppable 
} from '@dnd-kit/core';
import { 
  SortableContext, sortableKeyboardCoordinates, 
  verticalListSortingStrategy, useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


const { Title, Text } = Typography;
const { Option } = Select;

const API_BASE_URL = 'http://localhost:5001/api/admin';
const getToken = () => localStorage.getItem('adminToken');

// --- 1. 子組件：可拖拽的任務列 (SortableItem) ---
const SortableTaskItem = ({ task, onStatusChange, onDelete, color }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    marginBottom: '8px',
    background: '#fff',
    border: `1px solid ${isDragging ? color : '#f0f0f0'}`,
    borderRadius: '8px',
    boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
    opacity: isDragging ? 0.4 : 1,
    position: 'relative',
    zIndex: isDragging ? 100 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* 拖拽手把 */}
      <div {...attributes} {...listeners} style={{ cursor: 'grab', marginRight: '10px', color: '#ccc' }}>
        <HolderOutlined />
      </div>
      
      <Checkbox 
        checked={task.status === 'done'} 
        onChange={() => onStatusChange(task.id, task.status)}
      />
      
      <div style={{ flex: 1, marginLeft: '10px', overflow: 'hidden' }}>
        <Text delete={task.status === 'done'} ellipsis style={{ display: 'block' }}>
          {task.content}
        </Text>
      </div>

      <Popconfirm title="確定刪除？" onConfirm={() => onDelete(task.id)} okText="確定" cancelText="取消">
        <Button type="text" danger icon={<DeleteOutlined />} size="small" />
      </Popconfirm>
    </div>
  );
};

// --- 2. 子組件：象限容器 (Droppable Container) ---
const QuadrantContainer = ({ id, title, color, count, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  const bodyStyle = {
    height: 'calc(45vh - 80px)', 
    minHeight: '280px', 
    overflowY: 'auto',
    background: isOver ? `${color}15` : '#fafafa',
    transition: 'background-color 0.2s ease',
    padding: '12px'
  };

  return (
    <Card 
      ref={setNodeRef}
      title={<Space><PushpinOutlined style={{color}}/>{title}</Space>}
      extra={<Tag color={color}>{count}</Tag>}
      style={{...bodyStyle, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)'}}
    >
      {children}
    </Card>
  );
};

// --- 3. 主組件 ---
const TaskQuadrant = () => {
  const [tasks, setTasks] = useState({ p1: [], p2: [], p3: [], p4: [] });
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [activeId, setActiveId] = useState(null); // 拖拽中的 ID

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // 獲取數據
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/quadrant/tasks?status=all`;
      if (selectedProjectId) url += `&project_id=${selectedProjectId}`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${getToken()}` } });
      const data = await res.json();
      
      const categorized = { p1: [], p2: [], p3: [], p4: [] };
      data.forEach(t => {
        if (t.status !== 'done') categorized[`p${t.priority || 4}`].push(t);
      });
      setTasks(categorized);
    } catch (err) {
      message.error("載入失敗");
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    fetchTasks();
    // 獲取專案列表 (簡化版)
    fetch(`${API_BASE_URL}/projects`, { headers: { 'Authorization': `Bearer ${getToken()}` } })
      .then(res => res.json())
      .then(data => setProjects(data))
      .catch(() => message.error("專案加載失敗"));
  }, [fetchTasks]);

  // 更新狀態 & 刪除
  const handleUpdateStatus = async (id, status) => { /* PATCH API 邏輯同前 */ };
  const handleDelete = async (id) => { /* DELETE API 邏輯同前 */ };

  // --- 拖拽核心邏輯 ---
  const findContainer = (id) => {
    if (id in tasks) return id;
    return Object.keys(tasks).find(key => tasks[key].some(item => item.id === id));
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setTasks(prev => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];
      const activeIndex = activeItems.findIndex(i => i.id === activeId);
      
      return {
        ...prev,
        [activeContainer]: activeItems.filter(i => i.id !== activeId),
        [overContainer]: [
          ...overItems,
          { ...activeItems[activeIndex], priority: parseInt(overContainer.replace('p', '')) }
        ],
      };
    });
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeContainer = findContainer(active.id);
    const priorityMap = { p1: 1, p2: 2, p3: 3, p4: 4 };

    try {
      await fetch(`${API_BASE_URL}/tasks/${active.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ priority: priorityMap[activeContainer] })
      });
      message.success(`任務已移至 ${activeContainer.toUpperCase()}`);
    } catch (err) {
      message.error("同步失敗");
      fetchTasks();
    }
  };

  const quadrantConfigs = {
    p1: { title: '重要 ‧ 緊急', color: '#ff4d4f' },
    p2: { title: '重要 ‧ 不緊急', color: '#52c41a' },
    p3: { title: '不重要 ‧ 緊急', color: '#1890ff' },
    p4: { title: '不重要 ‧ 不緊急', color: '#bfbfbf' }
  };

  return (
    <div style={{ padding: '24px', background: '#f5f7fa', minHeight: '100vh' }}>
      <Card style={{ marginBottom: '20px', borderRadius: '12px', height: '100%' }}>
        <Row justify="space-between" align="middle">
          <Space size="large">
            <Title level={4} style={{ margin: 0 }}>Eisenhower Matrix 四象限</Title>
            <Select 
              placeholder="切換專案" 
              style={{ width: 200 }} 
              allowClear 
              onChange={setSelectedProjectId}
            >
              {projects.map(p => <Option key={p.id} value={p.id}>{p.title}</Option>)}
            </Select>
          </Space>
          <Button type="primary" icon={<ReloadOutlined />} onClick={fetchTasks}>同步數據</Button>
        </Row>
      </Card>

      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCorners} 
        onDragStart={(e) => setActiveId(e.active.id)}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <Row gutter={[16, 16]}>
          {Object.keys(quadrantConfigs).map((key) => (
            <Col xs={24} md={12} key={key}>
              <SortableContext items={tasks[key].map(t => t.id)} strategy={verticalListSortingStrategy}>
                <QuadrantContainer 
                  id={key}
                  title={quadrantConfigs[key].title}
                  color={quadrantConfigs[key].color}
                  count={tasks[key].length}
                >
                  {tasks[key].length > 0 ? (
                    tasks[key].map(task => (
                      <SortableTaskItem 
                        key={task.id} 
                        task={task} 
                        color={quadrantConfigs[key].color}
                        onStatusChange={handleUpdateStatus}
                        onDelete={handleDelete}
                      />
                    ))
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="拖入任務" />
                  )}
                </QuadrantContainer>
              </SortableContext>
            </Col>
          ))}
        </Row>

        <DragOverlay adjustScale={true}>
          {activeId ? (
            <div style={{ 
              padding: '12px', background: '#fff', border: '2px solid #1890ff', 
              borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', width: '300px'
            }}>
              <HolderOutlined style={{ marginRight: 10 }} />
              {Object.values(tasks).flat().find(t => t.id === activeId)?.content}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default TaskQuadrant;