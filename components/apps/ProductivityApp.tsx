
import React from 'react';
import { AppContainer } from './AppContainer';
import { MenuItemData } from '../../types';
import { UniversalAppRenderer } from '../UniversalAppRenderer';
import { SheetEditor } from '../SheetEditor';
import { EnvelopeIcon, CalendarIcon, DocumentTextIcon, CheckCircleIcon, TableCellsIcon } from '../Icons';

const productivityComponentMap: { [key: string]: React.FC<any> } = {
  mail: () => <UniversalAppRenderer type="mail" />,
  calendar: () => <UniversalAppRenderer type="calendar" />,
  notes: () => <UniversalAppRenderer type="list" title="Notes" />,
  documents: () => <UniversalAppRenderer type="dashboard" title="Documents" />,
  todo: () => <UniversalAppRenderer type="todo" />,
  translate: () => <UniversalAppRenderer type="dashboard" title="Translator" />,
  spreadsheet: SheetEditor,
};

interface ProductivityAppProps {
    context: { menuItem: MenuItemData };
    onSetView: (view: string, context?: any) => void;
}

export const ProductivityApp: React.FC<ProductivityAppProps> = ({ context, onSetView }) => {
    if (!context || !context.menuItem) {
        return <div>Error: App context not provided.</div>;
    }

    // Augment menu items if they are empty from the main config
    const augmentedMenuItem = { ...context.menuItem };
    if (!augmentedMenuItem.children || augmentedMenuItem.children.length === 0) {
        augmentedMenuItem.children = [
            { title: 'Mail', icon: EnvelopeIcon, component: 'mail' },
            { title: 'Calendar', icon: CalendarIcon, component: 'calendar' },
            { title: 'Spreadsheets', icon: TableCellsIcon, component: 'spreadsheet' },
            { title: 'To-Do List', icon: CheckCircleIcon, component: 'todo' },
            { title: 'Notes', icon: DocumentTextIcon, component: 'notes' },
        ];
    } else if (!augmentedMenuItem.children.some(c => c.component === 'spreadsheet')) {
        // Inject if missing from existing children
        augmentedMenuItem.children.splice(2, 0, { title: 'Spreadsheets', icon: TableCellsIcon, component: 'spreadsheet' });
    }

    return <AppContainer menuItem={augmentedMenuItem} componentMap={productivityComponentMap} onSetView={onSetView} />;
};
