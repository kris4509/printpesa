import React, { useState } from 'react';
import classNames from 'classnames';
import RiskManagement from './components/risk-management';
import RiskCalculator from './components/risk-calculator';
import './risk-tools.scss';

const RiskTools: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'management' | 'calculator'>('management');

    return (
        <div className='risk-tools-page'>
            <div className='risk-tools-tabs'>
                <button
                    className={classNames('risk-tools-tab', { 'risk-tools-tab--active': activeTab === 'management' })}
                    onClick={() => setActiveTab('management')}
                >
                    Risk Management
                </button>
                <button
                    className={classNames('risk-tools-tab', { 'risk-tools-tab--active': activeTab === 'calculator' })}
                    onClick={() => setActiveTab('calculator')}
                >
                    Risk Calculator
                </button>
            </div>

            <div className='risk-tools-content'>
                {activeTab === 'management' ? <RiskManagement /> : <RiskCalculator />}
            </div>
        </div>
    );
};

export default RiskTools;
