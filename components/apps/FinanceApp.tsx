
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
import { UnifiedTerminal } from '../trading/UnifiedTerminal';
import { PlaceholderView } from '../PlaceholderView';
import { ChartBarIcon, CpuChipIcon, GlobeAltIcon, ArrowPathIcon, LockClosedIcon, ScaleIcon, UsersIcon, AcademicCapIcon, GameControllerIcon, WalletIcon } from '../Icons';

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

    const augmentedMenuItem = { ...context.menuItem };
    let children = augmentedMenuItem.children ? [...augmentedMenuItem.children] : [];
    
    // Insert Unified Terminal at the top
    if (!children.some(c => c.component === 'tradingTerminal')) {
         children.unshift({ 
             title: 'Genesis Trade Deck', 
             icon: ChartBarIcon, 
             component: 'tradingTerminal' 
         });
    }

    // Explicitly add the requested sub-menu items if they are missing
    const requiredItems: MenuItemData[] = [
        { title: 'Markets', icon: ChartBarIcon, component: 'tradingMarkets' },
        { title: 'Swap', icon: ArrowPathIcon, component: 'tradingSwap' },
        { title: 'Staking', icon: LockClosedIcon, component: 'tradingStaking' },
        { title: 'Lending', icon: ScaleIcon, component: 'tradingLending' },
        { title: 'Copy Trading', icon: UsersIcon, component: 'tradingCopy' },
        { title: 'Trading Bots', icon: CpuChipIcon, component: 'tradingBots' },
        { title: 'Learn & Earn', icon: AcademicCapIcon, component: 'tradingLearn' },
        { title: 'Crypto Games', icon: GameControllerIcon, component: 'tradingGames' },
        { title: 'Wallet', icon: WalletIcon, component: 'tradingWallet' }
    ];

    requiredItems.forEach(item => {
        if (!children.some(c => c.component === item.component)) {
            children.push(item);
        }
    });

    // Ensure AI Platform Explorer is present
    if (!children.some(c => c.component === 'aiTradingTools')) {
         const aiToolItem: MenuItemData = { 
             title: 'AI Platform Explorer', 
             icon: CpuChipIcon, 
             component: 'aiTradingTools' 
         };
         children.push(aiToolItem);
    }

    augmentedMenuItem.children = children;

    return <AppContainer menuItem={augmentedMenuItem} componentMap={financeComponentMap} onSetView={onSetView} />;
};
