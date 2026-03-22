import React, { useState, useEffect } from 'react';
import { Drawer, List, Input, Select, Button, Tag, Timeline, message, Empty, Divider } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrashAlt, faStickyNote, faBug, faLightbulb, faLink, faQuestion } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const TaskLogManager = ({ visible, onClose, taskId, taskContent }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newLog, setNewLog] = useState({ content: '', log_type: 'note' });
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
            width={500}
            onClose={onClose}
            open={visible}
            extra={
                <Tag color="blue">{taskContent}</Tag>
            }
        >
            {/* --- 新增區塊 --- */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                    <Select 
                        value={newLog.log_type} 
                        onChange={val => setNewLog({...newLog, log_type: val})}
                        style={{ width: 100 }}
                    >
                        {Object.entries(logTypeConfig).map(([key, cfg]) => (
                            <Option key={key} value={key}>{cfg.label}</Option>
                        ))}
                    </Select>
                    <Button type="primary" block onClick={handleAddLog}>
                        送出匯報
                    </Button>
                </div>
                <TextArea 
                    rows={4} 
                    value={newLog.content} 
                    onChange={e => setNewLog({...newLog, content: e.target.value})}
                    placeholder="今天的開發進度如何？遇到了什麼坑？"
                />
            </div>

            <Divider orientation="left">歷史紀錄</Divider>

            {/* --- 列表區塊 --- */}
            <div style={{ padding: '4px' }}>
                {logs.length > 0 ? (
                    <Timeline>
                        {logs.map(log => (
                            <Timeline.Item 
                                key={log.id} 
                                color={logTypeConfig[log.log_type]?.color}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <small style={{ color: '#bfbfbf' }}>
                                        {dayjs(log.date_created).format('YYYY-MM-DD HH:mm')}
                                    </small>
                                    <Button 
                                        type="text" 
                                        danger 
                                        size="small" 
                                        icon={<FontAwesomeIcon icon={faTrashAlt} style={{fontSize: '10px'}} />} 
                                        onClick={() => handleDeleteLog(log.id)}
                                    />
                                </div>
                                <div style={{ marginTop: 4 }}>
                                    <Tag color={logTypeConfig[log.log_type]?.color} style={{ fontSize: '10px' }}>
                                        {logTypeConfig[log.log_type]?.label}
                                    </Tag>
                                    <div style={{ marginTop: 8, whiteSpace: 'pre-wrap', color: '#434343' }}>
                                        {log.content}
                                    </div>
                                </div>
                            </Timeline.Item>
                        ))}
                    </Timeline>
                ) : (
                    <Empty description="尚無開發日誌" />
                )}
            </div>
        </Drawer>
    );
};

export default TaskLogManager;