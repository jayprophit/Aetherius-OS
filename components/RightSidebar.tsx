import React from 'react';
import { SimpleAIChat } from './SimpleAIChat';

interface RightSidebarProps {
  isOpen: boolean;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ isOpen }) => {
  return (
    <aside className={`flex-shrink-0 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'w-96' : 'w-0'}`}>
       <SimpleAIChat />
    </aside>
  );
};