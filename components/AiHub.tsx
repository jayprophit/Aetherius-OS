// This component has been deprecated and its contents merged into AIAssistant.tsx
// to create a single, unified AIHub component. This file is kept to avoid breaking imports
// but should not be used.
import React from 'react';

export const AIHub: React.FC = () => {
    return (
        <div className="p-4">
            <h1 className="text-red-500">This component is deprecated.</h1>
            <p>Please use the AIHub component exported from AIAssistant.tsx.</p>
        </div>
    );
};
