import React, { useState, useEffect } from 'react';
import { Drawer, List, Input, Select, Button, Tag, Timeline, message, Empty, Divider, Card, Tooltip } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrashAlt, faStickyNote, faBug, faLightbulb, faLink, faQuestion, faCheckCircle, faClock } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const TaskLogManager = ({ visible, onClose, taskId, taskContent }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newLog, setNewLog] = useState({ content: '', log_type: 'note' });
    
    // 用於紀錄正在編輯哪一個 Log 的答案
    const [editingAnswer, setEditingAnswer] = useState({ id: null, text: '' });

    const token = localStorage.getItem('adminToken');

    const logTypeConfig = {
        note: { color: 'blue', icon: faStickyNote, label: '筆記' },
        bug: { color: 'red', icon: faBug, label: 'Bug' },
        question: { color: 'purple', icon: faQuestion, label: '疑問' },
        solution: { color: 'green', icon: faLightbulb, label: '解法' },
        link: { color: 'orange', icon: faLink, label: '連結' },
    };

    const fetchLogs = async () => {
        if (!taskId) return;
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:5001/api/admin/tasks/${taskId}/logs`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setLogs(res.data);
        } catch (err) {
            message.error("無法載入紀錄");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (visible) fetchLogs();
    }, [visible, taskId]);

    const handleAddLog = async () => {
        if (!newLog.content.trim()) return;
        try {
            await axios.post(`http://localhost:5001/api/admin/tasks/${taskId}/logs`, newLog, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            message.success("匯報成功");
            setNewLog({ ...newLog, content: '' });
            fetchLogs();
        } catch (err) {
            message.error("新增失敗");
        }
    };

    // --- 新增：提交答案的函式 ---
    const handleSubmitAnswer = async (logId) => {
        if (!editingAnswer.text.trim()) return;
        try {
            await axios.patch(`http://localhost:5001/api/admin/task-logs/${logId}`, 
                { new_response: editingAnswer.text }, // 注意這裡改名了
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            message.success("已新增回覆");
            setEditingAnswer({ id: null, text: '' });
            fetchLogs();
        } catch (err) {
            message.error("更新失敗");
        }
    };

    const handleDeleteLog = async (logId) => {
        try {
            await axios.delete(`http://localhost:5001/api/admin/task-logs/${logId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchLogs();
        } catch (err) {
            message.error("刪除失敗");
        }
    };

    return (
        <Drawer
            title="任務執行日誌"
            placement="right"
            width={550}
            onClose={onClose}
            open={visible}
            extra={<Tag color="blue">{taskContent}</Tag>}
        >
            {/* 新增紀錄區 */}
            <div style={{ marginBottom: 24, background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                    <Select 
                        value={newLog.log_type} 
                        onChange={val => setNewLog({...newLog, log_type: val})}
                        style={{ width: 120 }}
                    >
                        {Object.entries(logTypeConfig).map(([key, cfg]) => (
                            <Option key={key} value={key}>
                                <FontAwesomeIcon icon={cfg.icon} style={{ marginRight: 8 }} />
                                {cfg.label}
                            </Option>
                        ))}
                    </Select>
                    <Button type="primary" block onClick={handleAddLog}>
                        送出匯報
                    </Button>
                </div>
                <TextArea 
                    rows={3} 
                    value={newLog.content} 
                    onChange={e => setNewLog({...newLog, content: e.target.value})}
                    placeholder="今天的開發進度如何？遇到了什麼坑？"
                />
            </div>

            <Divider orientation="left">歷史紀錄</Divider>

            <div style={{ padding: '4px' }}>
                {logs.length > 0 ? (
                    <Timeline>
                        {logs.map(log => {
                            const isNeedAnswer = log.log_type === 'bug' || log.log_type === 'question';
                            
                            return (
                                <Timeline.Item 
                                    key={log.id} 
                                    color={logTypeConfig[log.log_type]?.color}
                                >
                                    {/* 頂部資訊列 */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>
                                            <Tag color={logTypeConfig[log.log_type]?.color}>
                                                {logTypeConfig[log.log_type]?.label}
                                            </Tag>
                                            {isNeedAnswer && (
                                                log.is_resolved ? 
                                                <Tag color="success" icon={<FontAwesomeIcon icon={faCheckCircle} />}>已解決</Tag> : 
                                                <Tag color="warning" icon={<FontAwesomeIcon icon={faClock} />}>待處理</Tag>
                                            )}
                                        </span>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            <small style={{ color: '#bfbfbf' }}>{dayjs(log.date_created).format('MM-DD HH:mm')}</small>
                                            <Button type="text" danger size="small" onClick={() => handleDeleteLog(log.id)} icon={<FontAwesomeIcon icon={faTrashAlt} />} />
                                        </div>
                                    </div>

                                    {/* 原始內容 */}
                                    <div style={{ marginTop: 8, whiteSpace: 'pre-wrap', color: '#434343', fontWeight: 500 }}>
                                        {log.content}
                                    </div>

                                    {/* 解答區塊 */}
                                    {/* --- 改動區：JSON Responses 渲染 --- */}
                            {isNeedAnswer && (
                                <div style={{ marginTop: 12, padding: '12px', background: '#f9f9f9', borderRadius: '4px' }}>
                                    {/* 顯示所有的對話紀錄 */}
                                    {log.responses && log.responses.length > 0 && (
                                        <div style={{ marginBottom: 12 }}>
                                            {log.responses.map((resp, idx) => (
                                                <div key={idx} style={{ marginBottom: 8, borderBottom: '1px solid #eee', paddingBottom: 4 }}>
                                                    <div style={{ fontSize: '11px', color: '#8c8c8c', display: 'flex', justifyContent: 'space-between' }}>
                                                        <span><FontAwesomeIcon icon={faLightbulb} /> {resp.admin}</span>
                                                        <span>{dayjs(resp.date_created).format('MM-DD HH:mm')}</span>
                                                    </div>
                                                    <div style={{ color: '#1d39c4', marginTop: 2 }}>{resp.text}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* 回覆輸入框 */}
                                    {editingAnswer.id === log.id ? (
                                        <div style={{ marginTop: 8 }}>
                                            <TextArea 
                                                rows={2}
                                                value={editingAnswer.text}
                                                onChange={e => setEditingAnswer({ ...editingAnswer, text: e.target.value })}
                                                placeholder="輸入新的補充說明或解答..."
                                            />
                                            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                                                <Button size="small" type="primary" onClick={() => handleSubmitAnswer(log.id)}>送出回覆</Button>
                                                <Button size="small" onClick={() => setEditingAnswer({ id: null, text: '' })}>取消</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button size="small" type="dashed" block onClick={() => setEditingAnswer({ id: log.id, text: '' })}>
                                            {log.responses?.length > 0 ? "新增補充回覆" : "提供解決方案"}
                                        </Button>
                                    )}
                                </div>
                            )}
                        </Timeline.Item>
                            );
                        })}
                    </Timeline>
                ) : (
                    <Empty description="尚無開發日誌" />
                )}
            </div>
        </Drawer>
    );
};

export default TaskLogManager;