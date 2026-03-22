import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Card, Button, Select, Input, Upload, message, Image, Spin } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEdit, faTrash, faSave, faSun, faCloud,
    faCloudRain, faCloudSun, faPlus
} from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import '../styles/DiaryPanel.css';
import DiaryCalendar from './DiaryCalendar';

const { TextArea } = Input;

// --- Helpers ---
const getStatusColor = (status) => {
    const colors = { sunny: '#FFD700', cloudy: '#A9A9A9', rainy: '#1E90FF', default: '#6c757d' };
    return colors[status?.toLowerCase()] || colors.default;
};

const getWeatherIcon = (weather) => {
    const icons = { sunny: faSun, cloudy: faCloud, rainy: faCloudRain, default: faCloudSun };
    return icons[weather?.toLowerCase()] || icons.default;
};

const getEmotionIconImage = (emotion) => {
    const icons = {
        happy: 'happy.png', sad: 'sad.png', angry: 'angry.png',
        neutral: 'neutral.png', tired: 'tired.png', helpless: 'helpless.png'
    };
    return icons[emotion?.toLowerCase()] || icons.neutral;
};

const Diary = () => {
    const [diaries, setDiaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentDiary, setCurrentDiary] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [activeDate, setActiveDate] = useState(new Date());
    const [displayUrls, setDisplayUrls] = useState({});

    const [formData, setFormData] = useState({
        weather: 'sunny',
        date: dayjs().format('YYYY-MM-DD'),
        content: '',
        image_url: '',
        emotion: 'happy'
    });

    const weatherOptions = ['sunny', 'cloudy', 'rainy'];
    const emotionOptions = ['happy', 'sad', 'angry', 'neutral', 'tired', 'helpless'];

    // --- API: 獲取日記列表 ---
    const fetchDiaries = useCallback(async (year, month) => {
        setLoading(true);
        try {
            const queryYear = year || dayjs(activeDate).year();
            const queryMonth = month || (dayjs(activeDate).month() + 1);
            const url = `http://localhost:5001/api/diary?year=${queryYear}&month=${queryMonth}`;
            const response = await fetch(url);
            const result = await response.json();
            setDiaries(result.data || []);
        } catch (err) {
            message.error("無法載入日記數據");
        } finally {
            setLoading(false);
        }
    }, [activeDate]);

    useEffect(() => { fetchDiaries(); }, []);

    // --- API: 獲取圖片預覽連結 ---
    const fetchImageUrl = useCallback(async (path) => {
        if (!path || displayUrls[path] || path === 'undefined') return;
        const parts = path.split('/');
        try {
            const response = await fetch(`http://localhost:5001/api/attachments/view/${parts[0]}/${parts[1]}`);
            const data = await response.json();
            if (data.url) setDisplayUrls(prev => ({ ...prev, [path]: data.url }));
        } catch (err) { console.error("圖片加載失敗", err); }
    }, [displayUrls]); // 依賴 displayUrls

    useEffect(() => {
        if (currentDiary?.image_url) fetchImageUrl(currentDiary.image_url);
    }, [currentDiary, fetchImageUrl]); // 加上 fetchImageUrl

    useEffect(() => {
        if (currentDiary?.image_url) fetchImageUrl(currentDiary.image_url);
    }, [currentDiary]);

    // --- Handle: 點擊日曆日期 ---
    const handleDateClick = (date) => {
        const dateObj = dayjs(date);
        setActiveDate(dateObj.toDate());
        const dateString = dateObj.format('YYYY-MM-DD');

        const foundDiary = diaries.find(d => dayjs(d.date).format('YYYY-MM-DD') === dateString);

        if (foundDiary) {
            setCurrentDiary(foundDiary);
            setEditMode(false);
        } else {
            setCurrentDiary(null);
            setFormData({ weather: 'sunny', date: dateString, content: '', image_url: '', emotion: 'happy' });
            setEditMode(true);
        }
        setIsModalOpen(true);
    };

    // --- Handle: 刪除 ---
    const handleDelete = async (id) => {
        Modal.confirm({
            title: '確定要刪除這篇日記嗎？',
            onOk: async () => {
                try {
                    const token = localStorage.getItem('adminToken');
                    await fetch(`http://localhost:5001/api/diary/${id}`, {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    message.success("已刪除日記");
                    setIsModalOpen(false);
                    fetchDiaries();
                } catch (err) { message.error("刪除失敗"); }
            }
        });
    };

    // --- Handle: 提交表單 ---
    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            let finalImagePath = formData.image_url;
            if (selectedFile) {
                const uploadData = new FormData();
                uploadData.append('file', selectedFile);
                const uploadRes = await fetch(`http://localhost:5001/api/attachments/upload/diary/${Date.now()}`, {
                    method: 'POST',
                    body: uploadData
                });
                const uploadResult = await uploadRes.json();
                finalImagePath = uploadResult.path;
            }

            const isUpdating = currentDiary?.id;
            const url = isUpdating ? `http://localhost:5001/api/diary/${currentDiary.id}` : 'http://localhost:5001/api/diary';

            await fetch(url, {
                method: isUpdating ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, image_url: finalImagePath })
            });

            message.success("日記已保存");
            setIsModalOpen(false);
            fetchDiaries();
        } catch (err) { message.error("保存失敗"); }
        finally { setSubmitting(false); }
    };

    return (
        <div className="diary-page-container" style={{ padding: '20px' }}>
            <Card variant="outlined" className="full-calendar-card" style={{ height: '100%' }}>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>My Diary Calendar</h2>
                    <Button type="primary" icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => handleDateClick(new Date())}>
                        New Entry
                    </Button>
                </div>

                <Spin spinning={loading}>
                    <DiaryCalendar
                        diaries={diaries}
                        onDateClick={handleDateClick}
                        activeDate={activeDate}
                        onActiveStartDateChange={({ activeStartDate }) => {
                            fetchDiaries(activeStartDate.getFullYear(), activeStartDate.getMonth() + 1);
                        }}
                    />
                </Spin>
            </Card>
            {/* Diary Modal */}
            <Modal
                title={editMode ? `Writing for ${formData.date}` : `Diary Detail - ${dayjs(currentDiary?.date).format('YYYY-MM-DD')}`}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={800}
                centered
                destroyOnHidden
            >
                {editMode ? (
                    <div className="diary-form">
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                            <div style={{ flex: 1 }}>
                                <label>Weather</label>
                                <Select style={{ width: '100%' }} value={formData.weather} onChange={v => setFormData({ ...formData, weather: v })}>
                                    {weatherOptions.map(opt => <Select.Option key={opt} value={opt}>{opt}</Select.Option>)}
                                </Select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label>Mood</label>
                                <Select style={{ width: '100%' }} value={formData.emotion} onChange={v => setFormData({ ...formData, emotion: v })}>
                                    {emotionOptions.map(opt => <Select.Option key={opt} value={opt}>{opt}</Select.Option>)}
                                </Select>
                            </div>
                        </div>
                        <TextArea
                            rows={10}
                            placeholder="How was your day?"
                            value={formData.content}
                            onChange={e => setFormData({ ...formData, content: e.target.value })}
                        />
                        <div style={{ marginTop: '15px' }}>
                            <label>Photo</label>
                            <Input type="file" accept="image/*" onChange={e => setSelectedFile(e.target.files[0])} />
                        </div>
                        <div style={{ marginTop: '25px', textAlign: 'right' }}>
                            <Button onClick={() => setIsModalOpen(false)} style={{ marginRight: '10px' }}>Cancel</Button>
                            <Button type="primary" icon={<FontAwesomeIcon icon={faSave} />} loading={submitting} onClick={handleSubmit}>
                                Save Diary
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="diary-view">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <img src={`/emoticons/${getEmotionIconImage(currentDiary?.emotion)}`} style={{ width: '50px' }} alt="mood" />
                                <span className="weather-tag">
                                    <FontAwesomeIcon icon={getWeatherIcon(currentDiary?.weather)} style={{ color: getStatusColor(currentDiary?.weather), marginRight: '8px' }} />
                                    {currentDiary?.weather}
                                </span>
                            </div>
                            <div>
                                <Button icon={<FontAwesomeIcon icon={faEdit} />} onClick={() => {
                                    setFormData({ ...currentDiary, date: dayjs(currentDiary.date).format('YYYY-MM-DD') });
                                    setEditMode(true);
                                }} style={{ marginRight: '10px' }}>Edit</Button>
                                <Button danger icon={<FontAwesomeIcon icon={faTrash} />} onClick={() => handleDelete(currentDiary.id)}>Delete</Button>
                            </div>
                        </div>
                        <p style={{ whiteSpace: 'pre-wrap', fontSize: '16px', lineHeight: '1.8', background: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
                            {currentDiary?.content}
                        </p>
                        {currentDiary?.image_url && (
                            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                                <Image src={displayUrls[currentDiary.image_url]} style={{ maxWidth: '30%', borderRadius: '8px' }} />
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Diary;