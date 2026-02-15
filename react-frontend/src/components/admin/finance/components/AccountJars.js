import React from 'react';
import { Row, Col, Typography, Tooltip } from 'antd';

const { Text } = Typography;

const AccountJars = ({ income = 67818 }) => {
  const configs = [
    { label: '儲蓄', percent: 20, color: '#F6AD55', desc: '生活固定開銷' },
    { label: '投資', percent: 20, color: '#A0715F', desc: '長期財富累積' },
    { label: '緊急備用', percent: 10, color: '#EF4444', desc: '應付突發狀況' },
    { label: '生活消費', percent: 40, color: '#059669', desc: '一般日常花費' },
    { label: '娛樂', percent: 10, color: '#6366F1', desc: '犒賞自己的預算' },
  ];

  return (
    <div style={{ background: '#fff9f0', padding: '24px', borderRadius: '16px', marginBottom: '32px' }}>
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <Text strong style={{ fontSize: '16px' }}>💰 建議分配比例 (月收入: {income.toLocaleString()}元)</Text>
      </div>
      
      <Row gutter={[16, 16]} justify="center">
        {configs.map((item) => (
          <Col key={item.label} xs={12} sm={8} md={4}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* 罐子容器 */}
              <Tooltip title={item.desc}>
                <div style={{
                  position: 'relative',
                  width: '80px',
                  height: '110px',
                  border: '3px solid #d9d9d9',
                  borderRadius: '10px 10px 25px 25px',
                  background: 'white',
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}>
                  {/* 瓶蓋 */}
                  <div style={{ height: '12px', background: '#f0f0f0', borderBottom: '1px solid #d9d9d9' }} />
                  {/* 水位 */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    width: '100%',
                    height: `${item.percent * 2.2}%`, // 比例換算高度
                    minHeight: '35%',
                    backgroundColor: item.color,
                    transition: 'all 0.5s ease-out',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    <div>{item.label}</div>
                    <div>{item.percent}%</div>
                  </div>
                </div>
              </Tooltip>
              <Text strong style={{ marginTop: '8px' }}>
                {Math.round(income * item.percent / 100).toLocaleString()}元
              </Text>
            </div>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default AccountJars;