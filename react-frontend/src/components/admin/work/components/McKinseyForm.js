import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faChevronLeft, faChevronRight, faSave, faSpinner, faLightbulb 
} from '@fortawesome/free-solid-svg-icons';
import { message, Spin } from 'antd'; // 使用 antd 的提示組件
import '../style/McKinsey.css';

const McKinseyManager = ({ templateId = 1, projectId = null }) => {
    const [template, setTemplate] = useState(null); // 儲存後端抓到的模板結構
    const [currentStepIdx, setCurrentStepIdx] = useState(0); // 改用 Array Index (0-6)
    const [formData, setFormData] = useState({}); // 儲存使用者輸入的內容
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const API_BASE = 'http://localhost:5001/api/admin/templates'; // 你的後端位置
    const token = localStorage.getItem('adminToken');

    // 1. 初始化：抓取模板結構與歷史內容
    useEffect(() => {
        const initData = async () => {
            setIsLoading(true);
            try {
                // 抓取特定模板的步驟配置
                const res = await fetch(`${API_BASE}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const allTemplates = await res.json();
                const target = allTemplates.find(t => t.id === templateId);
                
                if (target) {
                    setTemplate(target);
                    // 如果有傳入 projectId，這裡應該再去抓取該專案已填寫的內容
                    // 暫時從 LocalStorage 模擬
                    const saved = localStorage.getItem(`project_${templateId}_content`);
                    if (saved) setFormData(JSON.parse(saved));
                }
            } catch (err) {
                message.error("無法載入模板配置");
            } finally {
                setIsLoading(false);
            }
        };
        initData();
    }, [templateId]);

    // 2. 處理輸入變更
    const handleInputChange = (value) => {
        const currentStepOrder = template.steps[currentStepIdx].order;
        const updatedData = { ...formData, [currentStepOrder]: value };
        setFormData(updatedData);
        // 即時存草稿
        localStorage.setItem(`project_${templateId}_content`, JSON.stringify(updatedData));
    };

    // 3. 儲存至後端資料庫 (對接 project_contents 表)
    const handleSave = async () => {
        setIsSaving(true);
        try {
            // 這裡轉換成後端要求的格式：[{step_order: 1, content: '...'}, ...]
            const payload = {
                template_id: templateId,
                title: "我的分析專案", // 實際應用中可由使用者輸入
                contents: Object.keys(formData).map(order => ({
                    step_order: parseInt(order),
                    content: formData[order]
                }))
            };

            const res = await fetch('http://localhost:5001/api/projects/save', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                message.success("完整報告已提交至雲端儲存");
            }
        } catch (err) {
            message.error("儲存失敗，請檢查網路連線");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="loading-state"><Spin size="large" /> 載入引擎中...</div>;
    if (!template) return <div>找不到對應的思考模板</div>;

    const steps = template.steps;
    const currentStep = steps[currentStepIdx];

    return (
        <div className="mckinsey-page">
            <header className="mckinsey-header">
                <h1>{template.name}</h1>
                <p>結構化你的思維，將複雜問題轉化為具體行動</p>
            </header>

            {/* 動態進度導覽：根據後端傳回的步驟數量生成 */}
            <div className="step-nav">
                {steps.map((step, index) => (
                    <div 
                        key={step.order} 
                        className={`step-item ${currentStepIdx === index ? 'active' : ''} ${currentStepIdx > index ? 'completed' : ''}`}
                        onClick={() => setCurrentStepIdx(index)}
                    >
                        <div className="step-circle">{step.order}</div>
                        <span className="step-label">{step.title}</span>
                    </div>
                ))}
            </div>

            <div className="mckinsey-card">
                <div className="card-header">
                    <div className="icon-wrap">
                        {/* 這裡可以根據標題選擇圖示，或者後端也傳 icon string */}
                        <FontAwesomeIcon icon={faLightbulb} />
                    </div>
                    <div className="title-wrap">
                        <span className="step-number">Step {currentStep.order}</span>
                        <h2>{currentStep.title}</h2>
                    </div>
                </div>

                <div className="prompt-box">
                    <p>{currentStep.prompt}</p>
                </div>

                <textarea
                    className="mckinsey-textarea"
                    value={formData[currentStep.order] || ''}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder={currentStep.placeholder}
                    rows="12"
                />

                <footer className="card-footer">
                    <div className="footer-left">
                        {currentStepIdx > 0 && (
                            <button className="btn-secondary" onClick={() => setCurrentStepIdx(prev => prev - 1)}>
                                <FontAwesomeIcon icon={faChevronLeft} /> 上一步
                            </button>
                        )}
                    </div>
                    
                    <div className="footer-right">
                        {currentStepIdx < steps.length - 1 ? (
                            <button className="btn-primary" onClick={() => setCurrentStepIdx(prev => prev + 1)}>
                                下一步 <FontAwesomeIcon icon={faChevronRight} />
                            </button>
                        ) : (
                            <button className="btn-success" onClick={handleSave} disabled={isSaving}>
                                <FontAwesomeIcon icon={faSave} /> {isSaving ? '儲存中...' : '提交完整報告'}
                            </button>
                        )}
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default McKinseyManager;