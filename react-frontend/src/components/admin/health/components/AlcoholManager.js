import React, { useEffect, useState } from 'react';
import '../styles/Healthmanager.css';

const AlcoholManager = () => {
    const API_BASE_URL = 'http://localhost:5001/api/admin';
  const getToken = () => localStorage.getItem('adminToken');

    const [logs, setLogs] = useState([]);
    const [drinkType, setDrinkType] = useState('beer');
    const [volume, setVolume] = useState('');
    const [abv, setAbv] = useState(''); // 酒精濃度 %
    // 飲酒預設值
    const drinkPresets = {
        beer: { name: '啤酒', abv: 5 },
        wine: { name: '紅酒', abv: 12 },
        whiskey: { name: '威士忌', abv: 40 },
        custom: { name: '自定義', abv: '' },
        bubbling: { name: '氣泡酒', abv: 4 }
    };

    // GET - 獲取資料
    const fetchTodayLogs = async () => {
    try {
        const token = getToken();
        const res = await fetch(`${API_BASE_URL}/health/alcohol/all`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        // 關鍵檢查：確保 data 是陣列，否則設為空陣列
        if (Array.isArray(data)) {
            setLogs(data);
        } else {
            console.error("API 回傳格式錯誤，預期陣列但收到:", data);
            setLogs([]); // 防止崩潰
        }
    } catch (err) {
        console.error("抓取失敗", err);
        setLogs([]);
    }
};

    // POST - 新增資料
    const handleAddLog = async () => {
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

        if (res.ok) fetchTodayLogs(); // 重新整理列表
    };

    // DELETE - 刪除資料
    const handleDelete = async (id) => {
        if (!window.confirm("確定刪除此紀錄？")) return;
        await fetch(`${API_BASE_URL}/health/alcohol/${id}`, { 
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        fetchTodayLogs();
    };

    useEffect(() => {
        console.log("組件已掛載，開始抓取資料...");
        fetchTodayLogs();
    }, []);

    const totalGrams = logs.reduce((sum, log) => sum + parseFloat(log.grams), 0).toFixed(1);

    return (
        <div className="health-container">
            <div className="health-card summary">
                <h3>今日攝取統計</h3>
                <div className="stats-display">
                    <span className="big-number">{totalGrams}</span>
                    <span className="unit">酒精克數 (g)</span>
                </div>
                <p className={totalGrams > 40 ? "warning" : "safe"}>
                    {totalGrams > 40 ? "⚠️ 今日攝取已過量，請停止飲酒" : "✅ 目前攝取量尚在適量範圍"}
                </p>
            </div>

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

                    <input
                        type="number"
                        placeholder="飲用量 (ml)"
                        value={volume}
                        onChange={(e) => setVolume(e.target.value)}
                    />

                    <input
                        type="number"
                        placeholder="濃度 (%)"
                        value={abv}
                        onChange={(e) => setAbv(e.target.value)}
                    />

                    <button className="add-log-btn" onClick={handleAddLog}>紀錄</button>
                </div>
            </div>

            <div className="health-card list-section">
                <h3>今日紀錄清單</h3>
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