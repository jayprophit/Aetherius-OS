import React from 'react';
import { SocialFeed } from './SocialFeed';

// The Dashboard can act as a container or alias for the main SocialFeed view.
export const Dashboard: React.FC<{onSetView: (view: string) => void}> = ({ onSetView }) => {
    return <SocialFeed onSetView={onSetView} />;
};