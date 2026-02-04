import React, { useState } from 'react';
import { useAlcoholLogData } from '../../../../hooks/useAlcoholLogData';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import '../styles/Healthmanager.css';

const AlcoholManager = () => {
    // 1. 從 Hook 拿出所有邏輯
    const { 
        logs, viewMode, setViewMode, 
        stats, saveLog, removeLog 
    } = useAlcoholLogData();
    
    // 2. 表單本地狀態
    const [editingId, setEditingId] = useState(null);
    const [drinkType, setDrinkType] = useState('beer');
    const [volume, setVolume] = useState('');
    const [abv, setAbv] = useState('5');

    const drinkPresets = {
        beer: { name: '啤酒', abv: 5 },
        wine: { name: '紅酒', abv: 12 },
        whiskey: { name: '威士忌', abv: 40 },
        bubbling: { name: '氣泡酒', abv: 4 },
        custom: { name: '自定義', abv: '' }
    };

    // 💡 修復：定義編輯邏輯
    const startEdit = (log) => {
        setEditingId(log.id);
        setDrinkType('custom');
        setVolume(log.volume);
        setAbv(log.abv);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setVolume('');
        setAbv('5');
    };

    const handleSave = async () => {
        const payload = {
            drink_name: drinkType === 'custom' ? '自定義' : drinkPresets[drinkType].name,
            volume_ml: volume,
            abv_percent: abv
        };
        const success = await saveLog(editingId, payload);
        if (success) cancelEdit();
    };

    // 💡 修復：定義刪除邏輯
    const handleDelete = async (id) => {
        if (window.confirm("確定要刪除嗎？")) {
            await removeLog(id);
        }
    };

    return (
        <div className="health-container">
            {/* 統計面板 */}
            <div className="summary-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div className="health-card summary">
                    <h3>{viewMode === 'daily' ? '今日' : '本月'}攝取統計</h3>
                    <div className="stats-display">
                        <span className="big-number">{stats.totalGrams}</span>
                        <span className="unit">g</span>
                    </div>
                </div>
                <div className="health-card summary">
                    <h3>{viewMode === 'daily' ? '今日' : '本月'}飲酒次數</h3>
                    <div className="stats-display">
                        <span className="big-number" style={{ color: '#4a90e2' }}>{stats.count}</span>
                        <span className="unit">次</span>
                    </div>
                </div>
            </div>

            {/* 輸入區 */}
            <div className={`health-card input-section ${editingId ? 'editing-highlight' : ''}`}>
                <h3>{editingId ? '修改紀錄' : '新增飲酒紀錄'}</h3>
                <div className="input-grid">
                    <select value={drinkType} onChange={(e) => {
                        setDrinkType(e.target.value);
                        setAbv(drinkPresets[e.target.value].abv);
                    }}>
                        {Object.keys(drinkPresets).map(key => (
                            <option key={key} value={key}>{drinkPresets[key].name}</option>
                        ))}
                    </select>
                    <input type="number" placeholder="ml" value={volume} onChange={(e) => setVolume(e.target.value)} />
                    <input type="number" placeholder="%" value={abv} onChange={(e) => setAbv(e.target.value)} />

                    <div className="action-btns">
                        <button className="add-log-btn" onClick={handleSave}>
                            {editingId ? <FontAwesomeIcon icon={faCheck} /> : '紀錄'}
                        </button>
                        {editingId && (
                            <button className="cancel-btn" onClick={cancelEdit}>
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* 清單區 */}
            <div className="health-card list-section">
                <div className="list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3>紀錄清單</h3>
                    <select
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value)} // 💡 直接用 Hook 的 setViewMode
                        style={{ padding: '5px 10px', borderRadius: '5px', border: '1px solid #ddd' }}
                    >
                        <option value="daily">今日檢視</option>
                        <option value="monthly">本月檢視</option>
                    </select>
                </div>

                <div className="log-list">
                    {logs.length > 0 ? logs.map(log => (
                        <div key={log.id} className="log-item">
                            <div className="log-info">
                                <span className="time">{log.time}</span>
                                <span className="type">{log.type}</span>
                                <span className="detail">{log.volume}ml / {log.abv}%</span>
                            </div>
                            <div className="log-stats">
                                <span className="grams">{log.grams}g</span>
                            </div>
                            <div className="item-actions">
                                <button onClick={() => startEdit(log)} className="btn-icon edit">
                                    <FontAwesomeIcon icon={faEdit} />
                                </button>
                                <button onClick={() => handleDelete(log.id)} className="btn-icon delete">
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </div>
                        </div>
                    )) : <p className="empty">尚無紀錄</p>}
                </div>
            </div>
        </div>
    );
};

export default AlcoholManager;