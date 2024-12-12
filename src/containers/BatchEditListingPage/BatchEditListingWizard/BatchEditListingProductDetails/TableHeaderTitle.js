import { Space, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

export function TableHeaderTitle({ helperText, children }) {
  return (
    <Space horizontal size="large">
      <span>{children}</span>
      {helperText && (
        <Tooltip title={helperText}>
          <InfoCircleOutlined />
        </Tooltip>
      )}
    </Space>
  );
}
