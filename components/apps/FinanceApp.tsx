
import React from 'react';
import { AppContainer } from './AppContainer';
import { MenuItemData } from '../../types';
import { Markets } from '../trading/Markets';
import { AdvancedChart } from '../trading/AdvancedChart';
import { Swap } from '../trading/Swap';
import { Staking } from '../trading/Staking';
import { Lending } from '../trading/Lending';
import { CopyTrading } from '../trading/CopyTrading';
import { TradingBots } from '../trading/TradingBots';
import { TradingNews } from '../trading/TradingNews';
import { LearnAndEarn } from '../trading/LearnAndEarn';
import { CryptoGames } from '../trading/CryptoGames';
import { Wallet } from '../trading/Wallet';
import { AiTradingTools } from '../trading/AiTradingTools';
import { UnifiedTerminal } from '../trading/UnifiedTerminal'; // Imported UnifiedTerminal
import { PlaceholderView } from '../PlaceholderView';
import { ChartBarIcon, CpuChipIcon, GlobeAltIcon } from '../Icons';

const financeComponentMap: { [key: string]: React.FC<any> } = {
  tradingTerminal: UnifiedTerminal, // Main Pro View
  tradingMarkets: Markets,
  tradingAdvancedChart: AdvancedChart,
  tradingSwap: Swap,
  tradingStaking: Staking,
  tradingLending: Lending,
  tradingCopy: CopyTrading,
  tradingBots: TradingBots,
  tradingNews: TradingNews,
  tradingLearn: LearnAndEarn,
  tradingGames: CryptoGames,
  tradingWallet: Wallet,
  aiTradingTools: AiTradingTools,
  blockchainHub: () => <PlaceholderView viewName="Blockchain Hub" />,
};

interface FinanceAppProps {
    context: { menuItem: MenuItemData };
    onSetView: (view: string, context?: any) => void;
}

export const FinanceApp: React.FC<FinanceAppProps> = ({ context, onSetView }) => {
    if (!context || !context.menuItem) {
        return <div>Error: App context not provided.</div>;
    }

    // Inject AI Trading Tools menu item if not present
    const augmentedMenuItem = { ...context.menuItem };
    let children = augmentedMenuItem.children ? [...augmentedMenuItem.children] : [];
    
    // Insert Unified Terminal at the top
    if (!children.some(c => c.component === 'tradingTerminal')) {
         const terminalItem: MenuItemData = { 
             title: 'Genesis Trade Deck', 
             icon: ChartBarIcon, 
             component: 'tradingTerminal' 
         };
         children.splice(0, 0, terminalItem);
    }

    // Ensure AI Platform Explorer is present
    if (!children.some(c => c.component === 'aiTradingTools')) {
         const aiToolItem: MenuItemData = { 
             title: 'AI Platform Explorer', 
             icon: CpuChipIcon, 
             component: 'aiTradingTools' 
         };
         const marketsIdx = children.findIndex(c => c.component === 'tradingMarkets');
         children.splice(marketsIdx + 1, 0, aiToolItem);
    }

    augmentedMenuItem.children = children;

    return <AppContainer menuItem={augmentedMenuItem} componentMap={financeComponentMap} onSetView={onSetView} />;
};
