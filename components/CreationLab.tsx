import React from 'react';
import { MusicNoteIcon, VideoIcon, ImageIcon, DocumentTextIcon } from './Icons';

const labDetails = {
    Music: {
        icon: MusicNoteIcon,
        description: 'Tools for music production will be available here.'
    },
    Video: {
        icon: VideoIcon,
        description: 'Tools for video production and editing will be available here.'
    },
    Image: {
        icon: ImageIcon,
        description: 'Tools for image editing and graphic design will be available here.'
    },
    Content: {
        icon: DocumentTextIcon,
        description: 'Tools for general content creation will be available here.'
    }
};

interface CreationLabProps {
    type: 'Music' | 'Video' | 'Image' | 'Content';
}

export const CreationLab: React.FC<CreationLabProps> = ({ type }) => {
    const details = labDetails[type] || labDetails.Content;
    const Icon = details.icon;
    
    return (
        <div className="flex items-center justify-center h-full p-4 sm:p-6 bg-gray-100 dark:bg-gray-900">
            <div className="text-center p-6">
                <Icon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h1 className="text-2xl font-bold">{type} Creation Lab</h1>
                <p className="mt-2 text-gray-500 dark:text-gray-400">This application is under construction.</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{details.description}</p>
            </div>
        </div>
    );
};
