import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Input, Typography, Space, Spin, message, Progress, Tag, Button, Divider } from 'antd';
import { SaveOutlined, BulbOutlined, RocketOutlined, CheckCircleOutlined } from '@ant-design/icons';
import _ from 'lodash';
import { thinkingApi } from '../../../../../services/thinkingApi';

const { Title, Text } = Typography;
const { TextArea } = Input;

const ThinkingProjectForm = ({ projectIdFromContext, templateId, existingAnalysisId, onCreated }) => {
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isCreating, setIsCreating] = useState(false); 
    const [initTitle, setInitTitle] = useState("");

    // --- 1. 取得詳情 (對應你提供的 ThinkingProjectDetail 邏輯) ---
    const fetchDetail = useCallback(async (id) => {
        setLoading(true);
        try {
            const data = await thinkingApi.getThinkingProjectDetail(id);
            setProject(data);
        } catch (err) {
            message.error("讀取分析詳情失敗");
        } finally {
            setLoading(false);
        }
    }, []);

    // 監聽 ID 變化：如果父組件傳入 ID，直接進入編輯模式；若 ID 為 null，重置回介紹頁
    useEffect(() => {
        setIsCreating(false); 
        if (existingAnalysisId) {
            fetchDetail(existingAnalysisId);
        } else {
            setProject(null); // 清空舊資料，回到 Landing 狀態
        }
    }, [existingAnalysisId, fetchDetail]);

    // --- 2. 自動儲存邏輯 (Debounced Save) ---
    const debouncedSave = useRef(
        _.debounce(async (updatedSteps, id) => {
            setSaving(true);
            try {
                const payload = {
                    contents: updatedSteps.map(s => ({ step_id: s.step_id, content: s.content }))
                };
                await thinkingApi.updateThinkingProject(id, payload);
            } catch (err) {
                message.error("自動儲存失敗");
            } finally {
                setSaving(false);
            }
        }, 1000)
    ).current;

    const handleContentChange = (stepId, value) => {
        const newSteps = project.steps.map(s => 
            s.step_id === stepId ? { ...s, content: value } : s
        );
        setProject({ ...project, steps: newSteps });
        debouncedSave(newSteps, project.id);
    };

    // --- 3. 新增分析 ---
    const handleCreateProject = async () => {
        if (!initTitle.trim()) return message.warning("請輸入分析標題");
        setLoading(true);
        try {
            const res = await thinkingApi.createThinkingProject({
                template_id: templateId,
                title: initTitle,
                ref_id: projectIdFromContext,
                ref_type: 'project'
            });
            setIsCreating(false);
            fetchDetail(res.id);
            if (onCreated) onCreated(); // 通知父組件重新整理左側 List
        } catch (err) {
            message.error("初始化分析失敗");
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // 渲染分流
    // ==========================================

    // A. 載入中
    if (loading && !project) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

    // B. 編輯模式：當 project 有資料時 (這就是你的 ThinkingProjectDetail 呈現方式)
    if (project) {
        const completedSteps = project.steps.filter(s => s.content?.trim()).length;
        const progressPercent = Math.round((completedSteps / project.steps.length) * 100);

        return (
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                <div style={{ marginBottom: '32px', position: 'sticky', top: 0, background: '#fff', zIndex: 10, padding: '10px 0' }}>
                    <Space align="baseline" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                            <Title level={2} style={{ margin: 0 }}>{project.title}</Title>
                            <Tag color="blue">{project.template_name}</Tag>
                        </div>
                        {saving ? <Text type="secondary"><SaveOutlined spin /> 儲存中...</Text> : <Text type="success"><CheckCircleOutlined /> 已存檔</Text>}
                    </Space>
                    <Progress percent={progressPercent} status="active" strokeColor="#5ec2c2" style={{ marginTop: 12 }} />
                </div>

                {project.steps.map((step, index) => (
                    <Card 
                        key={step.step_id}
                        title={<Space><span style={{ background: '#5ec2c2', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{index + 1}</span>{step.title}</Space>}
                        style={{ marginBottom: '24px', borderRadius: '12px' }}
                        hoverable
                    >
                        <div style={{ marginBottom: '12px', background: '#f9f9f9', padding: '12px', borderRadius: '8px' }}>
                            <Text type="secondary" style={{ fontSize: '13px' }}><BulbOutlined /> 引導思考：{step.prompt}</Text>
                        </div>
                        <TextArea
                            rows={4}
                            placeholder={step.placeholder}
                            value={step.content}
                            onChange={(e) => handleContentChange(step.step_id, e.target.value)}
                            style={{ borderRadius: '8px' }}
                        />
                    </Card>
                ))}
            </div>
        );
    }

    // C. 標題輸入模式：點擊「立即啟動」後
    if (isCreating) {
        return (
            <div style={{ maxWidth: 500, margin: '100px auto' }}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <Title level={3}>為您的分析命名</Title>
                    <Input size="large" autoFocus placeholder="例如：2026 產品定位分析" value={initTitle} onChange={e => setInitTitle(e.target.value)} onPressEnter={handleCreateProject} />
                    <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                        <Button type="text" onClick={() => setIsCreating(false)}>返回介紹</Button>
                        <Button type="primary" onClick={handleCreateProject} loading={loading} style={{ background: '#5ec2c2' }}>開始分析</Button>
                    </Space>
                </Space>
            </div>
        );
    }

    // D. 預設 Landing Page：點擊大按鈕時顯示
    return (
        <div style={{ maxWidth: 700, margin: '60px auto' }}>
            <Card variant="outlined" style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', padding: '20px' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <BulbOutlined style={{ fontSize: 48, color: '#5ec2c2', marginBottom: 16 }} />
                    <Title level={2}>麥肯錫戰略分析</Title>
                    <Text type="secondary">透過專業框架檢視專案一致性與組織效能</Text>
                </div>
                <Divider />
                <div style={{ marginBottom: 32 }}>
                    <Text strong>使用本工具您可以：</Text>
                    <ul style={{ color: '#666', marginTop: 12 }}>
                        <li>系統化檢視策略、系統與人員的配套</li>
                        <li>自動記錄思考過程，隨時中斷隨時回來</li>
                        <li>產出具備邏輯深度的分析報告</li>
                    </ul>
                </div>
                <Button type="primary" block size="large" icon={<RocketOutlined />} onClick={() => setIsCreating(true)} style={{ background: '#5ec2c2', height: 50, borderRadius: '10px' }}>
                    立即啟動新分析
                </Button>
            </Card>
        </div>
    );
};

export default ThinkingProjectForm;