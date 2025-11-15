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
import { PlaceholderView } from '../PlaceholderView';

const financeComponentMap: { [key: string]: React.FC<any> } = {
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
    return <AppContainer menuItem={context.menuItem} componentMap={financeComponentMap} onSetView={onSetView} />;
};
