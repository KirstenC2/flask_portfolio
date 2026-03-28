import { faPlus, faBug, faEdit, faSearch, faSave } from '@fortawesome/free-solid-svg-icons';

export const TASK_TYPE_CONFIG = {
    feature: { label: '功能', color: '#1890ff', icon: faPlus, bg: '#e6f7ff' },
    bug: { label: 'Bug', color: '#ff4d4f', icon: faBug, bg: '#fff1f0' },
    refactor: { label: '重構', color: '#722ed1', icon: faEdit, bg: '#f9f0ff' },
    research: { label: '研究', color: '#faad14', icon: faSearch, bg: '#fffbe6' },
    docs: { label: '文件', color: '#13c2c2', icon: faSave, bg: '#e6fffb' },
};

export const PRIORITY_OPTIONS = [1,2,3,4,5];