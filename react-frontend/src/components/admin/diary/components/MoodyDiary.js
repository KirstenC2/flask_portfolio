import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEdit, faTrash, faSave, faCalendarDay,
    faQuoteLeft, faCalendar, faChevronLeft, faBrain, faHeart
} from '@fortawesome/free-solid-svg-icons';
import '../styles/DiaryPanel.css';
import '../../../../common/global.css';
import DiaryCalendar from './DiaryCalendar';

const Diary = () => {
    // --- State Management ---
    const [diaries, setDiaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [currentDiary, setCurrentDiary] = useState(null);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [activeDate, setActiveDate] = useState(new Date());

    const initialFormState = {
        log_date: new Date().toISOString().split('T')[0],
        keyword: '',
        event_description: '',
        physical_feeling: '',
        ideal_result: '',
        real_result: '',
        root_cause: '',
        reflection: '',
    };

    const [formData, setFormData] = useState(initialFormState);

    // --- API Interactions ---
    const fetchDiaries = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const year = activeDate.getFullYear();
            const month = activeDate.getMonth() + 1; // JS months are 0-indexed

            const response = await fetch(
                `http://localhost:5001/api/admin/health/mood?year=${year}&month=${month}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) throw new Error('Failed to fetch entries');
            const result = await response.json();

            // result.data now contains the full objects for that month
            setDiaries(result.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [activeDate]); // Re-fetch whenever the active year/month changes

    useEffect(() => {
        fetchDiaries();
    }, [fetchDiaries]);

    // --- Handlers ---
    const handleDateClick = (date) => {
        setActiveDate(date); // Sync calendar highlight
        const dateString = date.toLocaleDateString('en-CA'); // YYYY-MM-DD

        const foundDiary = diaries.find(d => {
            const dDate = new Date(d.log_date).toLocaleDateString('en-CA');
            return dDate === dateString;
        });

        if (foundDiary) {
            setCurrentDiary(foundDiary);
            setEditMode(false);
        } else {
            setCurrentDiary(null);
            setFormData({ ...initialFormState, log_date: dateString });
            setEditMode(true);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        const isUpdating = currentDiary && currentDiary.id;
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

            if (!response.ok) throw new Error('Save failed');

            setEditMode(false);
            setCurrentDiary(null);
            await fetchDiaries();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenEdit = () => {
        setFormData({
            ...currentDiary,
            log_date: new Date(currentDiary.log_date).toLocaleDateString('en-CA')
        });
        setEditMode(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this mood entry?")) return;
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`http://localhost:5001/api/admin/health/mood/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Delete failed');
            setCurrentDiary(null);
            await fetchDiaries();
        } catch (err) {
            setError(err.message);
        }
    };

    // --- Render ---
    return (
        <div className="admin-container">
            {/* LEFT: Calendar Sidebar */}
            <div className={`section calendar-section ${isCollapsed ? 'collapsed' : ''} ${editMode || currentDiary ? 'shrink' : ''}`}>
                <button
                    className="calendar-toggle-btn"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    aria-label="Toggle Calendar"
                >
                    <FontAwesomeIcon icon={isCollapsed ? faCalendar : faChevronLeft} />
                </button>
                <div className="calendar-wrapper">
                    {loading && <div className="loader">Loading...</div>}
                    <DiaryCalendar
                        diaries={diaries}
                        onDateClick={handleDateClick}
                        activeDate={activeDate}
                        dateField="log_date"
                    />
                </div>
            </div>

            {/* RIGHT: Content Area */}
            <div className="content-container">
                <div className="editor-sidepanel">
                    {error && <div className="error-banner">{error}</div>}

                    {editMode || currentDiary ? (
                        <>
                            <div className="sidepanel-header">
                                <h2>{editMode ? (currentDiary ? '編輯情緒日記' : '新的情緒日記') : '情緒日記'}</h2>
                                <button className="btn-close" onClick={() => { setEditMode(false); setCurrentDiary(null); }}>✕</button>
                            </div>

                            {editMode ? (
                                <form onSubmit={handleSubmit} className="mood-form">
                                    <div className="form-group-row">
                                        <div className="input-half">
                                            <label>日期</label>
                                            <input
                                                type="date"
                                                value={formData.log_date}
                                                onChange={e => setFormData({ ...formData, log_date: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="input-half">
                                            <label>情緒關鍵字</label>
                                            <input
                                                type="text"
                                                placeholder="e.g., Anxiety, Joy"
                                                value={formData.keyword}
                                                onChange={e => setFormData({ ...formData, keyword: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-section">
                                        <label>事件描述</label>
                                        <textarea
                                            placeholder="What happened?"
                                            value={formData.event_description || ''}
                                            onChange={e => setFormData({ ...formData, event_description: e.target.value })}
                                            rows="3"
                                        />

                                        <label>身體感受</label>
                                        <textarea
                                            placeholder="Rapid heartbeat, tension, etc."
                                            value={formData.physical_feeling || ''}
                                            onChange={e => setFormData({ ...formData, physical_feeling: e.target.value })}
                                            rows="2"
                                        />

                                        <div className="form-group-row">
                                            <div className="input-half">
                                                <label>理想結果</label>
                                                <textarea value={formData.ideal_result || ''} onChange={e => setFormData({ ...formData, ideal_result: e.target.value })} />
                                            </div>
                                            <div className="input-half">
                                                <label>實際結果</label>
                                                <textarea value={formData.real_result || ''} onChange={e => setFormData({ ...formData, real_result: e.target.value })} />
                                            </div>
                                        </div>

                                        <label>根本原因</label>
                                        <textarea value={formData.root_cause || ''} onChange={e => setFormData({ ...formData, root_cause: e.target.value })} />

                                        <label>反思</label>
                                        <textarea value={formData.reflection || ''} onChange={e => setFormData({ ...formData, reflection: e.target.value })} />
                                    </div>

                                    <div className="form-actions">
                                        <button type="submit" className="btn btn-save" disabled={submitting}>
                                            <FontAwesomeIcon icon={faSave} /> {submitting ? 'Saving...' : 'Save Analysis'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="view-content mood-details">
                                    <div className="diary-header">
                                        <h3>{new Date(currentDiary.log_date).toLocaleDateString()}</h3>
                                        <span className="keyword-badge">{currentDiary.keyword}</span>
                                    </div>

                                    <div className="details-grid">
                                        <section className="detail-item">
                                            <h4><FontAwesomeIcon icon={faQuoteLeft} /> 發生了什麼事情？</h4>
                                            <label className="helper-text">簡單描述事件的時間、地點、人物與經過。</label>
                                            <p>{currentDiary.event_description || 'No description provided.'}</p>
                                        </section>

                                        <section className="detail-item">
                                            <h4><FontAwesomeIcon icon={faHeart} /> 身體感受</h4>
                                            <label className="helper-text">描述身體的感受，例如心跳加速、出汗、疲倦等。</label>
                                            <p>{currentDiary.physical_feeling || 'No record.'}</p>
                                        </section>

                                        <div className="comparison-section">
                                            <h4><FontAwesomeIcon icon={faHeart} /> 期望 vs 現實</h4>
                                            <div className="comparison-box">
                                                <span className="ideal-title">期待</span>
                                                <p>{currentDiary.ideal_result}</p>
                                            </div>
                                            <div className="comparison-box">
                                                <span className="real-title">現實</span>
                                                <p>{currentDiary.real_result}</p>
                                            </div>
                                        </div>

                                        <section className="detail-item highlight">
                                            <h4><FontAwesomeIcon icon={faBrain} /> 根本原因</h4>
                                            <label className="helper-text">描述事件的根本原因，例如情緒、壓力、疲倦等。</label>
                                            <p>{currentDiary.root_cause}</p>
                                        </section>

                                        <section className="detail-item">
                                            <h4>反思</h4>
                                            <label className="hint-text">反思事件的結果，例如情緒、壓力、疲倦等。</label>
                                            <p>{currentDiary.reflection}</p>
                                        </section>
                                    </div>

                                    <div className="diary-actions">
                                        <button className="btn btn-primary" onClick={handleOpenEdit}><FontAwesomeIcon icon={faEdit} /> Edit</button>
                                        <button className="btn btn-danger" onClick={() => handleDelete(currentDiary.id)}><FontAwesomeIcon icon={faTrash} /> Delete</button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="empty-state">
                            <FontAwesomeIcon icon={faCalendarDay} size="3x" />
                            <h3>Self-Reflection</h3>
                            <p>Select a date to start your emotional analysis.</p>
                            <button className="btn btn-primary" onClick={() => setEditMode(true)}>New Entry</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Diary;