import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Card, Button, Input, Spin, message, Tag, Divider } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEdit, faTrash, faSave, faCalendarDay,
    faQuoteLeft, faBrain, faHeart, faPlus
} from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import '../styles/DiaryPanel.css'; // 請確保 CSS 已更新
import DiaryCalendar from './DiaryCalendar';

const { TextArea } = Input;

const MoodyDiary = () => {
    // --- 狀態管理 ---
    const [diaries, setDiaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentDiary, setCurrentDiary] = useState(null);
    const [activeDate, setActiveDate] = useState(new Date());

    const initialFormState = {
        log_date: dayjs().format('YYYY-MM-DD'),
        keyword: '',
        event_description: '',
        physical_feeling: '',
        ideal_result: '',
        real_result: '',
        root_cause: '',
        reflection: '',
    };

    const [formData, setFormData] = useState(initialFormState);

    // --- API: 獲取情緒數據 ---
    const fetchDiaries = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const year = dayjs(activeDate).year();
            const month = dayjs(activeDate).month() + 1;

            const response = await fetch(
                `http://localhost:5001/api/admin/health/mood?year=${year}&month=${month}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            const result = await response.json();
            setDiaries(result.data || []);
        } catch (err) {
            message.error("無法獲取數據: " + err.message);
        } finally {
            setLoading(false);
        }
    }, [activeDate]);

    useEffect(() => { 
    fetchDiaries(); 
}, [fetchDiaries]);

    // --- Handle: 點擊日期 ---
    const handleDateClick = (date) => {
        const dateString = dayjs(date).format('YYYY-MM-DD');
        setActiveDate(date);

        const foundDiary = diaries.find(d => 
            dayjs(d.log_date).format('YYYY-MM-DD') === dateString
        );

        if (foundDiary) {
            setCurrentDiary(foundDiary);
            setEditMode(false);
        } else {
            setCurrentDiary(null);
            setFormData({ ...initialFormState, log_date: dateString });
            setEditMode(true);
        }
        setIsModalOpen(true);
    };

    

    // --- Handle: 提交表單 ---
    const handleSubmit = async () => {
        setSubmitting(true);
        const isUpdating = currentDiary?.id;
        const url = isUpdating
            ? `http://localhost:5001/api/admin/health/mood/${currentDiary.id}`
            : 'http://localhost:5001/api/admin/health/mood';

        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(url, {
                method: isUpdating ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('保存失敗');
            message.success("情緒分析已保存");
            setIsModalOpen(false);
            fetchDiaries();
        } catch (err) {
            message.error(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        Modal.confirm({
            title: '確定要刪除這條情緒記錄嗎？',
            content: '刪除後無法復原。',
            okText: '刪除',
            okType: 'danger',
            cancelText: '取消',
            onOk: async () => {
                try {
                    const token = localStorage.getItem('adminToken');
                    await fetch(`http://localhost:5001/api/admin/health/mood/${id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    message.success("已刪除");
                    setIsModalOpen(false);
                    fetchDiaries();
                } catch (err) { message.error("刪除失敗"); }
            }
        });
    };

    return (
        <div className="diary-main-container" style={{ padding: '30px' }}>
            <Card bordered={false} className="full-calendar-card" style={{ height: '100%' }}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <h2 style={{ margin: 0 }}>情緒與反思日誌</h2>
                        <p style={{ color: '#888' }}>透過結構化分析，了解你的情緒起伏與根本原因</p>
                    </div>
                    <Button 
                        type="primary" 
                        size="large" 
                        icon={<FontAwesomeIcon icon={faPlus} />}
                        onClick={() => handleDateClick(new Date())}
                    >
                        新增情緒分析
                    </Button>
                </div>

                <Spin spinning={loading}>
                    <DiaryCalendar
                        diaries={diaries}
                        onDateClick={handleDateClick}
                        activeDate={activeDate}
                        dateField="log_date"
                    />
                </Spin>
            </Card>

            {/* 情緒分析 Modal */}
            <Modal
                title={editMode ? "情緒深度分析表" : "情緒日誌詳情"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={850}
                centered
                destroyOnClose
            >
                <div className="mood-modal-body" style={{ paddingTop: '10px' }}>
                    {editMode ? (
                        <div className="mood-form-layout">
                            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                                <div style={{ flex: 1 }}>
                                    <label>記錄日期</label>
                                    <Input type="date" value={formData.log_date} readOnly />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label>情緒關鍵字</label>
                                    <Input 
                                        placeholder="例如：焦慮、欣喜、挫折..." 
                                        value={formData.keyword} 
                                        onChange={e => setFormData({...formData, keyword: e.target.value})}
                                    />
                                </div>
                            </div>

                            <label>1. 事件描述</label>
                            <TextArea rows={3} value={formData.event_description} onChange={e => setFormData({...formData, event_description: e.target.value})} placeholder="發生了什麼事？" />

                            <label style={{ marginTop: '15px', display: 'block' }}>2. 身體感受</label>
                            <TextArea rows={2} value={formData.physical_feeling} onChange={e => setFormData({...formData, physical_feeling: e.target.value})} placeholder="心跳加快、肌肉緊繃、疲倦..." />

                            <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
                                <div style={{ flex: 1 }}>
                                    <label>3. 期望結果</label>
                                    <TextArea rows={2} value={formData.ideal_result} onChange={e => setFormData({...formData, ideal_result: e.target.value})} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label>4. 實際結果</label>
                                    <TextArea rows={2} value={formData.real_result} onChange={e => setFormData({...formData, real_result: e.target.value})} />
                                </div>
                            </div>

                            <label style={{ marginTop: '15px', display: 'block' }}>5. 根本原因分析</label>
                            <TextArea rows={2} value={formData.root_cause} onChange={e => setFormData({...formData, root_cause: e.target.value})} />

                            <label style={{ marginTop: '15px', display: 'block' }}>6. 反思與行動</label>
                            <TextArea rows={2} value={formData.reflection} onChange={e => setFormData({...formData, reflection: e.target.value})} />

                            <div style={{ marginTop: '30px', textAlign: 'right' }}>
                                <Button onClick={() => setIsModalOpen(false)} style={{ marginRight: '10px' }}>取消</Button>
                                <Button type="primary" loading={submitting} onClick={handleSubmit} icon={<FontAwesomeIcon icon={faSave} />}>
                                    保存分析
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="mood-view-layout">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <h3>{dayjs(currentDiary?.log_date).format('YYYY年MM月DD日')}</h3>
                                <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>{currentDiary?.keyword}</Tag>
                            </div>
                            
                            <Divider />

                            <div className="mood-details-grid">
                                <section>
                                    <h4><FontAwesomeIcon icon={faQuoteLeft} /> 事件描述</h4>
                                    <p>{currentDiary?.event_description || '無描述'}</p>
                                </section>

                                <section>
                                    <h4><FontAwesomeIcon icon={faHeart} /> 身體感受</h4>
                                    <p>{currentDiary?.physical_feeling || '未記錄'}</p>
                                </section>

                                <div style={{ display: 'flex', gap: '20px', background: '#f5f5f5', padding: '15px', borderRadius: '8px' }}>
                                    <div style={{ flex: 1 }}>
                                        <h5 style={{ color: '#555' }}>期待結果</h5>
                                        <p>{currentDiary?.ideal_result}</p>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h5 style={{ color: '#555' }}>實際結果</h5>
                                        <p>{currentDiary?.real_result}</p>
                                    </div>
                                </div>

                                <section style={{ borderLeft: '4px solid #1890ff', paddingLeft: '15px', marginTop: '20px' }}>
                                    <h4><FontAwesomeIcon icon={faBrain} /> 根本原因</h4>
                                    <p>{currentDiary?.root_cause}</p>
                                </section>

                                <section>
                                    <h4>反思</h4>
                                    <p>{currentDiary?.reflection}</p>
                                </section>
                            </div>

                            <div style={{ marginTop: '40px', textAlign: 'right', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                                <Button icon={<FontAwesomeIcon icon={faEdit} />} onClick={() => {
                                    setFormData({
                                        ...currentDiary,
                                        log_date: dayjs(currentDiary.log_date).format('YYYY-MM-DD')
                                    });
                                    setEditMode(true);
                                }} style={{ marginRight: '10px' }}>編輯</Button>
                                <Button danger icon={<FontAwesomeIcon icon={faTrash} />} onClick={() => handleDelete(currentDiary.id)}>刪除</Button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default MoodyDiary;