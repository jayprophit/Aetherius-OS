import React from 'react';
import { AppContainer } from './AppContainer';
import { MenuItemData } from '../../types';
import { CreatorMarketplace } from '../CreatorMarketplace';
import { Marketplace } from '../Marketplace';
import { ProductPage } from '../ProductPage';

const eCommerceComponentMap: { [key: string]: React.FC<any> } = {
  creatorMarketplace: CreatorMarketplace,
  marketplace: Marketplace,
  productPage: ProductPage,
};

interface ECommerceAppProps {
    context: { menuItem: MenuItemData };
    onSetView: (view: string, context?: any) => void;
}

export const ECommerceApp: React.FC<ECommerceAppProps> = ({ context, onSetView }) => {
    if (!context || !context.menuItem) {
        return <div>Error: App context not provided.</div>;
    }
    return <AppContainer menuItem={context.menuItem} componentMap={eCommerceComponentMap} onSetView={onSetView} />;
};
