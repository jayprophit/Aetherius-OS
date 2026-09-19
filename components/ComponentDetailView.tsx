import React from 'react';
import { ICON_BUTTON_CLASSES } from '../constants';

interface ModalProps {
  title: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  onClose: () => void;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ title, Icon, onClose, children }) => {
  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col w-full max-w-lg h-[70vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <h2 className="text-md font-semibold text-gray-800 dark:text-gray-100 select-none">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className={ICON_BUTTON_CLASSES}
            aria-label={`Close ${title} window`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <div className="flex-grow relative overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
};
