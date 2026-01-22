import React, { useState, useEffect } from 'react';
import './MotorManagementPanel.css'; // 複用 DebtPanel 的風格
import '../../../common/global.css';
const MotorManagementPanel = () => {
    const [records, setRecords] = useState([]);
    const [formData, setFormData] = useState({
        item_name: '換機油',
        mileage: '',
        price: '',
        date: new Date().toISOString().split('T')[0],
        note: ''
    });

    const fetchRecords = async () => {
        const res = await fetch("http://localhost:5001/api/motor");
        const data = await res.json();
        setRecords(data);
    };

    // 在 MotorPanel 組件內部
    const checkMaintenanceStatus = () => {
        if (records.length === 0) return { shouldChange: false, days: 0 };

        const lastDate = new Date(records[0].maintenance_date);
        const today = new Date();

        // 計算相差的毫秒數
        const diffTime = Math.abs(today - lastDate);
        // 轉換為天數
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // 超過 90 天 (約 3 個月) 則回傳需要更換
        return {
            shouldChange: diffDays >= 90,
            days: diffDays
        };
    };
    const calculateNextMaintenanceDate = () => {
        if (records.length === 0) return "尚無紀錄";

        // 取得最近一次保養日期 (假設 records[0] 是最新的一筆)
        const lastDate = new Date(records[0].maintenance_date);

        // 加上 3 個月
        const nextDate = new Date(lastDate);
        nextDate.setMonth(nextDate.getMonth() + 3);

        // 格式化為 YYYY-MM-DD
        const yyyy = nextDate.getFullYear();
        const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
        const dd = String(nextDate.getDate()).padStart(2, '0');

        return `${yyyy}-${mm}-${dd}`;
    };

    const calculateRemainingDays = () => {
    // 1. 安全檢查：如果 records 還沒抓到或長度為 0，回傳 null
    if (!records || records.length === 0 || !records[0].maintenance_date) {
        return null;
    }

    try {
        // 2. 取得最近一次保養日期
        const lastDate = new Date(records[0].maintenance_date);
        
        // 檢查日期是否有效
        if (isNaN(lastDate.getTime())) return null;

        // 3. 推算 3 個月後
        const nextMaintenanceDate = new Date(lastDate);
        nextMaintenanceDate.setMonth(nextMaintenanceDate.getMonth() + 3); // 修正這裡：不要寫 nextDate.setMonth(nextDate.setMonth() + 3)

        // 4. 取得今天並重設時間為 00:00:00 確保計算天數精確
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        nextMaintenanceDate.setHours(0, 0, 0, 0);

        // 5. 計算天數差
        const diffTime = nextMaintenanceDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays;
    } catch (error) {
        console.error("計算天數出錯:", error);
        return null;
    }
};

    const remainingDays = calculateRemainingDays();

    const status = checkMaintenanceStatus();
    const nextMaintenance = calculateNextMaintenanceDate();
    const isOverdue = new Date() > new Date(nextMaintenance);
    useEffect(() => { fetchRecords(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await fetch("http://localhost:5001/api/motor", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        setFormData({ ...formData, mileage: '', price: '', note: '' });
        fetchRecords();
    };

    return (
        <div className="motor-container">

            <div className="motor-header-section">
                <h1>機車管理紀錄</h1>
                <form onSubmit={handleSubmit} className="motor-form">
                    <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                    <input type="number" placeholder="當前里程 (KM)" value={formData.mileage} onChange={e => setFormData({ ...formData, mileage: e.target.value })} required />
                    <input type="number" placeholder="價格" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required />
                    <input type="text" placeholder="備註 (機油型號)" value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} />
                    <button type="submit" className="btn-add-main">新增紀錄</button>
                </form>
            </div>
            {records.length > 0 && (
                <div className="status-grid">
                    {/* 日期提醒 */}
                    <div className={`status-card ${status.shouldChange ? 'status-danger' : 'status-safe'}`}>
                        <div className="status-label">上次保養至今</div>
                        <div className="status-value">{status.days} 天</div>
                        <div className="status-hint">
                            {status.shouldChange ? "⚠️ 已超過 3 個月，建議更換" : "✅ 狀態良好"}
                        </div>
                    </div>
                    <div className={`stat-item-card ${isOverdue ? 'border-danger' : ''}`}>
                        <div className="stat-content">
                            <div className="status-label">預計下次保養</div>
                            <div className="stat-value">
                            {remainingDays} 天
                            </div>
                            <p className={`stat-value ${isOverdue ? 'text-red' : ''}`}>
                                日期： {nextMaintenance}
                            </p>
                            {isOverdue && <span className="error-text">⚠️ 已過期</span>}
                        </div>
                    </div>
                </div>

            )}

            <div className="table-wrapper">
                <table className="motor-table">
                    <thead>
                        <tr>
                            <th>日期</th>
                            <th>項目</th>
                            <th>里程數</th>
                            <th>價格</th>
                            <th>備註</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map(r => (
                            <tr key={r.id}>
                                <td>{r.maintenance_date}</td>
                                <td>{r.item_name}</td>
                                <td>{r.mileage} KM</td>
                                <td className="text-price">${r.price}</td>
                                <td className="text-muted">{r.note}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MotorManagementPanel;