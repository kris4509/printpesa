import { observer } from 'mobx-react-lite';
import { useStore } from '../../hooks/useStore';
import RiskCalculator from '@/components/risk-calculator';
import './dashboard.scss';

const Dashboard = observer(() => {
    const { ui } = useStore();
    const { isAuthorized } = ui;
    
    return (
        <div className='dashboard-page'>
            <div className='dashboard-page__container'>
                <h1 className='dashboard-page__title'>Dashboard</h1>
                
                {isAuthorized && (
                    <div className='dashboard-page__content'>
                        <div className='dashboard-page__section'>
                            <RiskCalculator />
                        </div>
                    </div>
                )}
                
                {!isAuthorized && (
                    <div className='dashboard-page__empty'>
                        <p>Please log in to access the dashboard.</p>
                    </div>
                )}
            </div>
        </div>
    );
});

export default Dashboard;
