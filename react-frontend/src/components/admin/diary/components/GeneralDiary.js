import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEdit, faTrash, faSave, faTimes,
    faSun, faCloud, faCloudRain, faCloudSun, faCalendarDay, faQuoteLeft,
    faCalendar, faChevronLeft
} from '@fortawesome/free-solid-svg-icons';
import '../styles/DiaryPanel.css';
import '../../../../common/global.css';
import DiaryCalendar from './DiaryCalendar';

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
    const [error, setError] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [currentDiary, setCurrentDiary] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [activeDate, setActiveDate] = useState(new Date());
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [displayUrls, setDisplayUrls] = useState({});

    const [formData, setFormData] = useState({
        weather: 'sunny',
        date: new Date().toISOString().split('T')[0],
        content: '',
        image_url: '',
        emotion: 'happy'
    });

    const weatherOptions = ['sunny', 'cloudy', 'rainy'];
    const emotionOptions = ['happy', 'sad', 'angry', 'neutral', 'tired', 'helpless'];

    // --- API Calls ---
    const fetchDiaries = useCallback(async (year, month) => {
        setLoading(true);
        try {
            const queryYear = year || activeDate.getFullYear();
            const queryMonth = month || (activeDate.getMonth() + 1);
            const url = `http://localhost:5001/api/diary?year=${queryYear}&month=${queryMonth}`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch diaries');
            const result = await response.json();
            setDiaries(result.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [activeDate]);

    useEffect(() => {
        // Initial fetch for current month
        fetchDiaries();
    }, []);

    const fetchImageUrl = async (path) => {
        if (!path || displayUrls[path] || path === 'undefined') return;
        const parts = path.split('/');
        if (parts.length < 2) return;

        try {
            const response = await fetch(`http://localhost:5001/api/attachments/view/${parts[0]}/${parts[1]}`);
            if (!response.ok) return;
            const data = await response.json();
            if (data.url) setDisplayUrls(prev => ({ ...prev, [path]: data.url }));
        } catch (err) {
            console.error("Image link error", err);
        }
    };

    useEffect(() => {
        if (currentDiary?.image_url) fetchImageUrl(currentDiary.image_url);
    }, [currentDiary]);

    // --- Handlers ---
    const handleDateClick = (date) => {
        setActiveDate(date);
        const dateString = date.toLocaleDateString('en-CA');

        const foundDiary = diaries.find(d => {
            const dDate = new Date(d.date).toLocaleDateString('en-CA');
            return dDate === dateString;
        });

        if (foundDiary) {
            setCurrentDiary(foundDiary);
            setEditMode(false);
        } else {
            setCurrentDiary(null);
            setFormData({ ...formData, date: dateString, content: '', image_url: '' });
            setEditMode(true);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this entry?")) return;
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`http://localhost:5001/api/diary/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Failed to delete');
            setCurrentDiary(null);
            fetchDiaries();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            let finalImagePath = formData.image_url;

            if (selectedFile) {
                const bucket = 'diary';
                const cleanFileName = `${Date.now()}-${selectedFile.name.replace(/\s+/g, '_')}`;
                const uploadData = new FormData();
                uploadData.append('file', selectedFile);

                const uploadRes = await fetch(`http://localhost:5001/api/attachments/upload/${bucket}/${cleanFileName}`, {
                    method: 'POST',
                    body: uploadData
                });
                if (!uploadRes.ok) throw new Error('Upload failed');
                const uploadResult = await uploadRes.json();
                finalImagePath = uploadResult.path;
            }

            const isUpdating = currentDiary && currentDiary.id;
            const url = isUpdating ? `http://localhost:5001/api/diary/${currentDiary.id}` : 'http://localhost:5001/api/diary';

            const response = await fetch(url, {
                method: isUpdating ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, image_url: finalImagePath })
            });

            if (!response.ok) throw new Error('Save failed');

            setEditMode(false);
            setSelectedFile(null);
            setCurrentDiary(null);
            fetchDiaries();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="admin-container">
            {/* Sidebar Calendar */}
            <div className={`section calendar-section ${isCollapsed ? 'collapsed' : ''} ${editMode || currentDiary ? 'shrink' : ''}`}>
                <button className="calendar-toggle-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
                    <FontAwesomeIcon icon={isCollapsed ? faCalendar : faChevronLeft} />
                </button>
                <div className="calendar-wrapper">
                    {loading && <div className="loader">Loading...</div>}
                    <DiaryCalendar 
                        diaries={diaries} 
                        onDateClick={handleDateClick} 
                        activeDate={activeDate} 
                        // Trigger fetch when month changes in Calendar (requires Calendar to support onActiveStartDateChange)
                        onActiveStartDateChange={({ activeStartDate }) => {
                            fetchDiaries(activeStartDate.getFullYear(), activeStartDate.getMonth() + 1);
                        }}
                    />
                </div>
            </div>

            {/* Content Area */}
            <div className="content-container">
                <div className="editor-sidepanel">
                    {error && <div className="error-banner">{error}</div>}

                    {editMode || currentDiary ? (
                        <>
                            <div className="sidepanel-header">
                                <h2>{editMode ? 'Write Diary' : 'Diary Details'}</h2>
                                <button className="btn-close" onClick={() => { setEditMode(false); setCurrentDiary(null); }}>✕</button>
                            </div>

                            {editMode ? (
                                <form onSubmit={handleSubmit} className="form">
                                    <div className="form-row">
                                        <label>Date</label>
                                        <input type="date" className="form-control" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
                                    </div>

                                    <div className="form-group-row" style={{ display: 'flex', gap: '10px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label>Weather</label>
                                            <select className="form-control" value={formData.weather} onChange={e => setFormData({ ...formData, weather: e.target.value })}>
                                                {weatherOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label>Mood</label>
                                            <select className="form-control" value={formData.emotion} onChange={e => setFormData({ ...formData, emotion: e.target.value })}>
                                                {emotionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <label>Your Thoughts</label>
                                    <textarea className="form-control" value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} rows="8" required />

                                    <label>Image</label>
                                    <input type="file" className="form-control" accept="image/*" onChange={(e) => setSelectedFile(e.target.files[0])} />

                                    <div className="form-actions">
                                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                                            <FontAwesomeIcon icon={faSave} /> {submitting ? 'Saving...' : 'Save Entry'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="view-content">
                                    <div className="diary-header">
                                        <h3>{new Date(currentDiary.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                                        <div className="diary-meta">
                                            <img src={`/emoticons/${getEmotionIconImage(currentDiary.emotion)}`} alt={currentDiary.emotion} className="emotion-icon" style={{ width: '40px' }} />
                                            <span className="weather-tag">
                                                <FontAwesomeIcon icon={getWeatherIcon(currentDiary.weather)} style={{ color: getStatusColor(currentDiary.weather) }} />
                                                {currentDiary.weather}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="diary-content">
                                        <p style={{ whiteSpace: 'pre-wrap' }}>{currentDiary.content}</p>
                                        {currentDiary.image_url && (
                                            <div className="diary-image-display">
                                                <img src={displayUrls[currentDiary.image_url] || ''} alt="Entry" style={{ width: '100%', borderRadius: '12px' }} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="diary-actions">
                                        <button className="btn btn-primary" onClick={() => {
                                            setFormData({ ...currentDiary, date: new Date(currentDiary.date).toLocaleDateString('en-CA') });
                                            setEditMode(true);
                                        }}><FontAwesomeIcon icon={faEdit} /> Edit</button>
                                        <button className="btn btn-danger" onClick={() => handleDelete(currentDiary.id)}><FontAwesomeIcon icon={faTrash} /> Delete</button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="empty-state">
                            <FontAwesomeIcon icon={faCalendarDay} size="3x" />
                            <h3>How was your day?</h3>
                            <button className="btn btn-primary" onClick={() => setEditMode(true)}>New Entry</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Diary;