import React, { useState, useEffect, useCallback } from 'react';
import {
    Button, message, Card, Row, Col, Typography,
    Tabs, Dropdown
} from 'antd';
import {
    PlusOutlined, HistoryOutlined, SettingOutlined,
    DownOutlined, FileOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

import MotorMetrics from './components/MotorMetrics';
import MotorTable from './components/MotorTable';
import MotorFormModal from './components/MotorFormModal';
import MotorTaxesView from './components/MotorTaxesView';
import MotorTaxModal from './components/MotorTaxModal';
import MotorFuelAnalysis from './components/MotorFuelAnalysis';

import './MotorManagementPanel.css';
import '../../../common/global.css';

const { Title } = Typography;
const API_URL = "http://localhost:5001/api/admin/motor";

const MotorManagementPanel = () => {
    // --- 狀態管理 ---
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [activeTab, setActiveTab] = useState('maintenance'); // 補上 Tabs 狀態
    const [isDocModalOpen, setIsDocModalOpen] = useState(false);
    const [editingDoc, setEditingDoc] = useState(null);
    const [docRefreshKey, setDocRefreshKey] = useState(0);
    const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
    const [editingTax, setEditingTax] = useState(null);
    const [taxRefreshKey, setTaxRefreshKey] = useState(0);
    // --- 資料操作 ---
    const fetchRecords = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(API_URL);
            const data = await res.json();
            const sortedData = data.sort((a, b) => dayjs(b.maintenance_date).unix() - dayjs(a.maintenance_date).unix());
            setRecords(sortedData);
        } catch (error) {
            message.error("獲取紀錄失敗");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchRecords(); }, [fetchRecords]);

    const handleOpenModal = (record = null) => {
        setEditingRecord(record);
        setIsModalOpen(true);
    };

    const handleOpenTaxModal = (tax = null) => {
        setEditingTax(tax);
        setIsTaxModalOpen(true);
    };


    const handleTaxFinish = async (values) => {
        // 1. 建立符合後端 MotorDocument Model 的 Payload
        const payload = {
            title: values.title,
            amount: values.amount,
            // 格式化日期為後端 db.Date 接受的字串
            expired_date: values.expired_date ? values.expired_date.format('YYYY-MM-DD') : null,
        };

        // 2. 修正 URL：確保新增時也是打到 /taxes
        const method = editingTax ? 'PUT' : 'POST';
        const url = editingTax
            ? `${API_URL}/taxes/${editingTax.id}`   // 修改：/api/admin/motor/taxes/1
            : `${API_URL}/taxes`;                  // 新增：/api/admin/motor/taxes

        console.log(`Sending ${method} request to: ${url}`, payload); // 調試用

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                message.success(editingTax ? "稅務資料更新成功" : "稅務資料新增成功");
                setIsTaxModalOpen(false);
                // 觸發 MotorDocumentView 刷新
                setTaxRefreshKey(prev => prev + 1);
            } else {
                const errorData = await res.json();
                message.error(`提交失敗: ${errorData.error || res.statusText}`);
            }
        } catch (error) {
            console.error("API Error:", error);
            message.error("連線後端失敗，請檢查伺服器狀態");
        }
    };
    const handleFinish = async (values) => {
        const payload = {
            ...values,
            maintenance_date: values.maintenance_date.format('YYYY-MM-DD'),
            item_name: '換機油'
        };
        const method = editingRecord ? 'PUT' : 'POST';
        const url = editingRecord ? `${API_URL}/record/${editingRecord.id}` : `${API_URL}/record`;

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                message.success(editingRecord ? "修改成功" : "新增紀錄成功");
                setIsModalOpen(false);
                fetchRecords();
            }
        } catch (error) {
            message.error("提交失敗");
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await fetch(`${API_URL}/record/${id}`, { method: 'DELETE' });
            if (res.ok) {
                message.success("紀錄已刪除");
                fetchRecords();
            }
        } catch (error) {
            message.error("刪除失敗");
        }
    };

    // --- Tab 內容配置 ---
    const tabComponents = {
        'maintenance': (
            <>
                <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                    <Col>
                        <Title level={2} style={{ margin: 0 }}>
                            <HistoryOutlined style={{ marginRight: 12, color: 'var(--primary-color)' }} />
                            機車保養管理
                        </Title>
                    </Col>
                    <Col>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => handleOpenModal()}
                            size="large"
                        >
                            新增紀錄
                        </Button>
                    </Col>
                </Row>


                <MotorMetrics records={records} />
                <MotorFuelAnalysis />
                <MotorTable
                    records={records}
                    loading={loading}
                    onEdit={handleOpenModal}
                    onDelete={handleDelete}
                />

                

            </>
        ),
        'document-mgmt': (
            <MotorTaxesView
                onEdit={handleOpenTaxModal} // 改為 handleOpenTaxModal
                onAdd={() => handleOpenTaxModal(null)} // 改為 handleOpenTaxModal
                refreshTrigger={taxRefreshKey} // 確保觸發器也是連動稅務的
            />
        )
    };

    const navItems = [
        { label: '保養列表', key: 'maintenance', icon: <HistoryOutlined /> },
        { label: '繳費管理', key: 'document-mgmt', icon: <FileOutlined /> },
    ];

    const managementItems = [
        {
            key: 'category-mgmt',
            label: '項目分類設定',
            icon: <SettingOutlined />,
            onClick: () => setActiveTab('category-mgmt')
        },
    ];

    return (
        <div className="motor-container" style={{ padding: '24px' }}>
            <div className="finance-nav-wrapper" style={{
                background: '#fff',
                padding: '0 20px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
                <Tabs
                    activeKey={activeTab}
                    onChange={(key) => setActiveTab(key)}
                    items={navItems}
                    size="large"
                    tabBarExtraContent={
                        <Dropdown menu={{ items: managementItems }} placement="bottomRight">
                            <span
                                className={`mgmt-dropdown-trigger ${activeTab === 'category-mgmt' ? 'active' : ''}`}
                                style={{
                                    color: activeTab === 'category-mgmt' ? '#5ec2c2' : '#666',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '12px 0',
                                    fontWeight: activeTab === 'category-mgmt' ? '600' : 'normal'
                                }}
                            >
                                <SettingOutlined />
                                管理
                                <DownOutlined style={{ fontSize: '10px' }} />
                            </span>
                        </Dropdown>
                    }
                />
            </div>

            <Card variant="outlined" className="main-glass-card" style={{ marginTop: 16 }}>
                {/* 動態渲染目前選中的 Tab 內容 */}
                {tabComponents[activeTab] || tabComponents['maintenance']}
            </Card>

            <MotorFormModal
                open={isModalOpen}
                editingRecord={editingRecord}
                onCancel={() => setIsModalOpen(false)}
                onFinish={handleFinish}
            />
            {/* 新增的繳費管理 Modal */}
            <MotorTaxModal
                open={isTaxModalOpen}
                editingTax={editingTax}
                onCancel={() => setIsTaxModalOpen(false)}
                onFinish={handleTaxFinish}
            />
        </div >
    );
};

export default MotorManagementPanel;