import React from 'react';
import { FolderItem, AppItem } from '../types';
import { LaunchableApp } from '../../App';

interface FolderViewProps {
  context: { folder: FolderItem };
  launchApp: (app: LaunchableApp) => void;
}

export const FolderView: React.FC<FolderViewProps> = ({ context, launchApp }) => {
  if (!context || !context.folder) {
    return <div className="p-4">Folder contents not found.</div>;
  }

  const { folder } = context;

  const handleAppClick = (app: AppItem) => {
    launchApp({
      component: app.component,
      title: app.title,
      icon: app.icon,
    });
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-100 dark:bg-gray-900/50 p-4">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 px-2">{folder.title}</h1>
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-4">
        {folder.children.map(app => {
          const Icon = app.icon;
          return (
            <button
              key={app.id}
              onClick={() => handleAppClick(app)}
              className="flex flex-col items-center justify-center text-center space-y-1 p-2 rounded-lg hover:bg-white/20 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label={`Open ${app.title} application`}
            >
              <div className="w-16 h-16 bg-black/30 dark:bg-black/40 rounded-lg flex items-center justify-center backdrop-blur-sm shadow-md">
                <Icon className="w-8 h-8 text-white" />
              </div>
              <span className="text-gray-800 dark:text-white text-xs font-medium drop-shadow-md select-none w-20 truncate">{app.title}</span>
            </button>
          );
        })}
      </div>
      {folder.children.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 mt-8">This folder is empty.</p>
      )}
    </div>
  );
};
