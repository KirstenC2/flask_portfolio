import React, { useState } from 'react';
import TemplateGallery from './TemplateGallery';
import TemplateEditor from './TemplateEditor';

const TemplateManagementPage = () => {
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const handleEdit = (item) => {
        setEditingItem(item);
        setDrawerVisible(true);
    };

    const handleCreate = () => {
        setEditingItem(null);
        setDrawerVisible(true);
    };

    return (
        <>
            <TemplateGallery onEdit={handleEdit} onCreate={handleCreate} />
            <TemplateEditor 
                visible={drawerVisible} 
                onClose={() => setDrawerVisible(false)} 
                initialData={editingItem}
                onSaveSuccess={() => {
                    // Trigger refresh of the list
                }}
            />
        </>
    );
};

export default TemplateManagementPage;