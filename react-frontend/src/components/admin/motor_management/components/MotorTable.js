
import React from 'react';
import { Table, Button, Space, Popconfirm, Typography } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

const MotorTable = ({ records, loading, onEdit, onDelete }) => {
    const columns = [
        {
            title: '日期',
            dataIndex: 'maintenance_date',
            key: 'maintenance_date',
            sorter: (a, b) => dayjs(a.maintenance_date).unix() - dayjs(b.maintenance_date).unix(),
        },
        { title: '項目', dataIndex: 'item_name', key: 'item_name' },
        { 
            title: '里程數', 
            dataIndex: 'mileage', 
            key: 'mileage', 
            render: (val) => `${val?.toLocaleString()} KM` 
        },
        { title: '備註', dataIndex: 'note', key: 'note', ellipsis: true },
        {
            title: '操作',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button type="link" icon={<EditOutlined />} onClick={() => onEdit(record)} />
                    <Popconfirm title="確定刪除此紀錄？" onConfirm={() => onDelete(record.id)}>
                        <Button type="link" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <Table 
            columns={columns} 
            dataSource={records} 
            rowKey="id" 
            loading={loading}
            pagination={{ pageSize: 6 }}
            className="custom-antd-table"
        />
    );
};

export default MotorTable;