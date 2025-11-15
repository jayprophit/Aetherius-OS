import React from 'react';
import { AppContainer } from './AppContainer';
import { MenuItemData } from '../../types';
import { HealthHub } from '../health/HealthHub';
import { BodyComposition } from '../health/BodyComposition';
import { FrequencyHealing } from '../health/FrequencyHealing';
import { HealingWeb } from '../health/HealingWeb';
import { NutritionGuide } from '../health/NutritionGuide';

const healthComponentMap: { [key: string]: React.FC<any> } = {
  healthHub: HealthHub,
  bodyComposition: BodyComposition,
  frequencyHealing: FrequencyHealing,
  healingWeb: HealingWeb,
  nutritionGuide: NutritionGuide,
};

interface HealthAppProps {
    context: { menuItem: MenuItemData };
    onSetView: (view: string, context?: any) => void;
}

export const HealthApp: React.FC<HealthAppProps> = ({ context, onSetView }) => {
    if (!context || !context.menuItem) {
        return <div>Error: App context not provided.</div>;
    }
    return <AppContainer menuItem={context.menuItem} componentMap={healthComponentMap} onSetView={onSetView} />;
};
