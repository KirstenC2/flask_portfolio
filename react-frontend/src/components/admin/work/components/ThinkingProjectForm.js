import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Card, Input, Typography, Space, Spin, message,
    Progress, Button, Empty, Tag, Divider, Row, Col
} from 'antd';
import {
    SaveOutlined, BulbOutlined, RocketOutlined,
    CheckCircleOutlined, ArrowLeftOutlined, FileTextOutlined
} from '@ant-design/icons';
import _ from 'lodash';
import { thinkingApi } from '../../../../services/thinkingApi';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const ThinkingProjectForm = ({ templateId, projectIdFromContext }) => {
    // 狀態管理
    const [projectId, setProjectId] = useState(null);
    const [projectData, setProjectData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [initTitle, setInitTitle] = useState("");

    useEffect(() => {
        const checkExisting = async () => {
            if (!projectIdFromContext) return;
            try {
                // 這裡呼叫你的 API，根據 ref_id 和 templateId 找分析
                const data = await thinkingApi.getAnalysisByProject(projectIdFromContext, templateId);
                if (data && data.id) {
                    setProjectId(data.id);
                }
            } catch (err) {
                // 找不到就停在初始畫面，沒關係
            }
        };
        checkExisting();
    }, [projectIdFromContext, templateId]);
    const handleCreateProject = async () => {
        if (!initTitle.trim()) return message.warning("請先輸入分析標題");
        setLoading(true);
        try {
            const payload = {
                template_id: templateId,
                title: initTitle,
                ref_id: projectIdFromContext, // 👈 現在這裡拿得到值了
                ref_type: 'project'
            };

            const res = await thinkingApi.createThinkingProject(payload);
            setProjectId(res.id);
            message.success("分析專案已初始化");
        } catch (err) {
            message.error("建立失敗，請檢查網路或參數");
        } finally {
            setLoading(false);
        }
    };

    // --- 階段二：讀取與儲存內容 ---
    const fetchProjectDetail = useCallback(async () => {
        if (!projectId) return;
        setLoading(true);
        try {
            const data = await thinkingApi.getThinkingProjectDetail(projectId);
            setProjectData(data);
        } catch (err) {
            message.error("讀取專案詳情失敗");
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchProjectDetail();
    }, [fetchProjectDetail]);

    // 自動儲存邏輯
    const saveContent = async (updatedSteps) => {
        // 增加這行防禦
        if (!projectId) return;

        setSaving(true);
        try {
            const payload = {
                contents: updatedSteps.map(s => ({
                    step_id: s.step_id,
                    content: s.content
                }))
            };
            // 呼叫時再次確認
            await thinkingApi.updateThinkingProject(projectId, payload);
        } catch (err) {
            console.error("Save failed", err);
        } finally {
            setSaving(false);
        }
    };

    const debouncedSave = useRef(
        _.debounce((nextSteps, currentId) => {
            if (currentId) {
                // 這裡直接呼叫 API 函式，或確保 saveContent 能拿到傳入的 ID
                saveContentWithId(nextSteps, currentId);
            }
        }, 1000)
    ).current;

    // 2. 建立一個接收 ID 的儲存函式
    const saveContentWithId = async (steps, id) => {
        if (!id) return;
        setSaving(true);
        try {
            await thinkingApi.updateThinkingProject(id, {
                contents: steps.map(s => ({ step_id: s.step_id, content: s.content }))
            });
        } finally {
            setSaving(false);
        }
    };

    // 3. 在 handleContentChange 傳入當下的 projectId
    const handleContentChange = (targetStepId, value) => {
        setProjectData(prev => {
            // 確保這裡是用 step_id 進行比較
            const newSteps = prev.steps.map(s =>
                s.step_id === targetStepId ? { ...s, content: value } : s
            );

            // 將最新的 steps 丟給 debounce，並傳入當前的 projectId
            debouncedSave(newSteps, projectId);

            return { ...prev, steps: newSteps };
        });
    };

    // --- 渲染：初始化畫面 ---
    if (!projectId) {
        return (
            <div style={{ maxWidth: 600, margin: '40px auto' }}>
                <Card bordered={false} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderRadius: 16 }}>
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <div style={{ textAlign: 'center' }}>
                            <RocketOutlined style={{ fontSize: 40, color: '#5ec2c2' }} />
                            <Title level={3} style={{ marginTop: 16 }}>啟動新的思考分析</Title>
                            <Text type="secondary">請為這次的麥肯錫/思維模型分析設定一個主題</Text>
                        </div>
                        <Input
                            size="large"
                            placeholder="例如：2026 產品定位分析"
                            value={initTitle}
                            onChange={e => setInitTitle(e.target.value)}
                            onPressEnter={handleCreateProject}
                        />
                        <Button
                            type="primary"
                            block
                            size="large"
                            onClick={handleCreateProject}
                            loading={loading}
                            style={{ background: '#5ec2c2', borderColor: '#5ec2c2', height: 48, borderRadius: 8 }}
                        >
                            開始進入分析
                        </Button>
                    </Space>
                </Card>
            </div>
        );
    }

    // --- 渲染：主要分析介面 ---
    if (loading && !projectData) return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" tip="載入模型中..." /></div>;
    if (!projectData) return <Empty description="找不到資料" />;

    const progress = Math.round((projectData.steps.filter(s => s.content?.trim()).length / projectData.steps.length) * 100);

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 100 }}>
            {/* 標題與進度區 */}
            <div style={{ marginBottom: 24, position: 'sticky', top: 0, zIndex: 10, background: '#f5f7f9', padding: '16px 0' }}>
                <Row justify="space-between" align="bottom">
                    <Col>
                        <Space direction="vertical" size={0}>
                            <Title level={4} style={{ margin: 0 }}>
                                <FileTextOutlined style={{ marginRight: 8 }} />
                                {projectData.title}
                            </Title>
                            <Tag color="cyan">{projectData.template_name}</Tag>
                        </Space>
                    </Col>
                    <Col style={{ textAlign: 'right' }}>
                        {saving ? (
                            <Text type="secondary"><Spin size="small" style={{ marginRight: 8 }} />同步雲端中...</Text>
                        ) : (
                            <Text type="secondary"><CheckCircleOutlined style={{ color: '#52c41a' }} /> 已安全儲存</Text>
                        )}
                    </Col>
                </Row>
                <Progress percent={progress} strokeColor="#5ec2c2" status="active" style={{ marginTop: 12 }} />
            </div>

            {/* 動態步驟列表 */}
            {projectData.steps.map((step, idx) => (
                <Card
                    key={step.step_id}
                    className="thinking-step-card"
                    style={{ marginBottom: 20, borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}
                >
                    <div style={{ display: 'flex', gap: 16 }}>
                        <div style={{
                            flex: '0 0 32px', height: 32, borderRadius: '50%',
                            background: '#f0fdfa', color: '#5ec2c2',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 'bold', border: '1px solid #5ec2c2'
                        }}>
                            {idx + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                            <Title level={5} style={{ marginTop: 4 }}>{step.title}</Title>

                            {step.prompt && (
                                <div style={{ marginBottom: 16, padding: '8px 12px', background: '#f8fafc', borderRadius: 8, borderLeft: '4px solid #cbd5e1' }}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>
                                        <BulbOutlined style={{ marginRight: 4 }} />
                                        引導思考：{step.prompt}
                                    </Text>
                                </div>
                            )}

                            <TextArea
                                key={`input-${step.step_id}`} // 確保 Key 唯一
                                placeholder={step.placeholder || "在此輸入您的思考內容..."}
                                value={step.content}
                                autoSize={{ minRows: 3, maxRows: 10 }}
                                // 確保這裡傳入的是 step_id
                                onChange={(e) => handleContentChange(step.step_id, e.target.value)}
                                style={{ borderRadius: 8, padding: '12px', border: '1px solid #e2e8f0' }}
                            />
                        </div>
                    </div>
                </Card>
            ))}

            {/* 底部按鈕 */}
            <Divider />
            <div style={{ textAlign: 'center' }}>
                <Button icon={<ArrowLeftOutlined />} onClick={() => setProjectId(null)}>
                    返回重新選擇標題
                </Button>
            </div>
        </div>
    );
};

export default ThinkingProjectForm;