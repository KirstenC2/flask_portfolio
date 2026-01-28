import { useState } from 'react';
import '../../../common/global.css';
import AlcoholManager from './components/AlcoholManager';

const HealthPanel = () => {
    const [activeTab, setActiveTab] = useState('alcoholic');

    const renderContent = () => {
        switch (activeTab) {
            case 'alcoholic':
                return <AlcoholManager />;
            default:
                return null;
        }
    };

    return (
        <div className="container">
            {/* 模組切換導覽列 */}
            <div className="main-nav" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                    className={`nav-btn ${activeTab === 'alcoholic' ? 'active' : ''}`}
                    onClick={() => setActiveTab('alcoholic')}
                >
                    酒精攝取管理
                </button>
            </div>

            {/* 主要內容顯示區 */}
            <div className="content-area" style={{ marginTop: '20px' }}>
                {renderContent()}
            </div>
        </div>
    );
};

export default HealthPanel;