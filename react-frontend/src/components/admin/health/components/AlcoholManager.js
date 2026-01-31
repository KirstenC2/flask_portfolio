import React, { useEffect, useState, useMemo } from 'react';
import '../styles/Healthmanager.css';

const AlcoholManager = () => {
    const API_BASE_URL = 'http://localhost:5001/api/admin';
    const getToken = () => localStorage.getItem('adminToken');

    const [logs, setLogs] = useState([]);
    const [viewMode, setViewMode] = useState('monthly'); // 新增：控制顯示模式
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

    // 修改：根據傳入的 mode 抓取資料
    const fetchLogs = async (mode) => {
        try {
            const token = getToken();
            const res = await fetch(`${API_BASE_URL}/health/alcohol/${mode}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setLogs(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("抓取失敗", err);
        }
    };

    // 統計數據：始終基於當前的 logs 計算
    const stats = useMemo(() => {
        const todayGrams = logs.reduce((sum, log) => sum + parseFloat(log.grams || 0), 0);
        return {
            totalGrams: todayGrams.toFixed(1),
            count: logs.length
        };
    }, [logs]);

    // 切換下拉選單時觸發
    const handleModeChange = (e) => {
        const newMode = e.target.value;
        setViewMode(newMode);
        fetchLogs(newMode);
    };

    const handleAddLog = async () => {
        if (!volume || !abv) return alert("請輸入飲用量與濃度");
        const payload = {
            drink_name: drinkPresets[drinkType].name,
            volume_ml: volume,
            abv_percent: abv
        };

        const res = await fetch(`${API_BASE_URL}/health/alcohol`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            setVolume('');
            fetchLogs(viewMode); // 保持在目前的檢視模式
        }
    };

    useEffect(() => { fetchLogs(viewMode); }, []);

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

            {/* 新增紀錄區塊 */}
            <div className="health-card input-section">
                <h3>新增飲酒紀錄</h3>
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
                    <button className="add-log-btn" onClick={handleAddLog}>紀錄</button>
                </div>
            </div>

            {/* 清單區塊：包含模式切換 Dropdown */}
            <div className="health-card list-section">
                <div className="list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3>{viewMode === 'daily' ? '今日' : '本月'}紀錄清單</h3>
                    <select 
                        value={viewMode} 
                        onChange={handleModeChange}
                        style={{ padding: '5px 10px', borderRadius: '5px', border: '1px solid #ddd' }}
                    >
                        <option value="daily">今日檢視</option>
                        <option value="monthly">本月檢視</option>
                    </select>
                </div>

                <div className="log-list">
                    {logs.length > 0 ? logs.map(log => (
                        <div key={log.id} className="log-item">
                            <span className="time">{log.time}</span>
                            <span className="type">{log.type}</span>
                            <span className="detail">{log.volume}ml / {log.abv}%</span>
                            <span className="grams">{log.grams}g</span>
                        </div>
                    )) : <p className="empty">尚無紀錄</p>}
                </div>
            </div>
        </div>
    );
};

export default AlcoholManager;