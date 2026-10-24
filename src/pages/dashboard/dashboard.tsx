import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import Text from '@/components/shared_ui/text';
import { useStore } from '@/hooks/useStore';
import { localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';
import OnboardTourHandler from '../tutorials/dbot-tours/onboarding-tour';
import Cards from './cards';
import InfoPanel from './info-panel';
import { getDashboardBackgroundImage, getMillisecondsUntilNextDashboardBackground } from './dashboard-backgrounds';

const DASHBOARD_WELCOME_MESSAGES = [
    { headline: 'Build. Automate. Explore.', quote: 'Consistency starts with discipline, not prediction.' },
    { headline: 'Find your trading rhythm', quote: 'Patience is a position. You do not need to take every trade.' },
    { headline: 'Center for automations', quote: 'Know your risk before you enter the market.' },
    { headline: 'Make your next move intentional', quote: 'A clear plan matters more than a fast entry.' },
    { headline: 'Your strategy starts here', quote: 'Review your settings. Trade within your limits.' },
];

type TMobileIconGuide = {
    handleTabChange: (active_number: number) => void;
};

const DashboardComponent = observer(({ handleTabChange }: TMobileIconGuide) => {
    const { load_modal, dashboard, client, google_drive } = useStore();
    const { dashboard_strategies } = load_modal;
    const { is_google_drive_configured } = google_drive;
    const { active_tab, active_tour } = dashboard;
    const has_dashboard_strategies = !!dashboard_strategies?.length;
    const { isDesktop, isTablet } = useDevice();
    const [backgroundRotationSlot, setBackgroundRotationSlot] = useState(() =>
        Math.floor(Date.now() / (6 * 60 * 60 * 1000))
    );
    const [welcomeMessageIndex, setWelcomeMessageIndex] = useState(0);
    const backgroundImage = getDashboardBackgroundImage(backgroundRotationSlot * 6 * 60 * 60 * 1000);
    const welcomeMessage = DASHBOARD_WELCOME_MESSAGES[welcomeMessageIndex];

    useEffect(() => {
        const now = Date.now();
        const timeout_id = window.setTimeout(() => {
            setBackgroundRotationSlot(Math.floor(Date.now() / (6 * 60 * 60 * 1000)));
        }, getMillisecondsUntilNextDashboardBackground(now));

        return () => window.clearTimeout(timeout_id);
    }, [backgroundRotationSlot]);

    useEffect(() => {
        const interval_id = window.setInterval(() => {
            setWelcomeMessageIndex(index => (index + 1) % DASHBOARD_WELCOME_MESSAGES.length);
        }, 8000);

        return () => window.clearInterval(interval_id);
    }, []);

    return (
        <React.Fragment>
            <div
                className={classNames('tab__dashboard', {
                    'tab__dashboard--tour-active': active_tour,
                })}
            >
                <div
                    className='tab__dashboard__content'
                    style={{
                        backgroundImage: `linear-gradient(to bottom, rgba(5, 10, 20, 0.15) 0%, rgba(5, 10, 20, 0.35) 100%), url('/backgrounds/${backgroundImage}')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center center',
                        backgroundAttachment: 'fixed',
                        backgroundRepeat: 'no-repeat',
                    }}
                >
                    <section className='dashboard-welcome' aria-live='polite' aria-atomic='true'>
                        <p className='dashboard-welcome__eyebrow'>
                            <span aria-hidden='true' />
                            TRADERSCHEME <span className='dashboard-welcome__slash'>/</span> YOUR TRADING WORKSPACE
                        </p>
                        <h1 key={welcomeMessage.headline} className='dashboard-welcome__headline'>
                            {welcomeMessage.headline}
                            <span className='dashboard-welcome__cursor' aria-hidden='true' />
                        </h1>
                        <div className='dashboard-welcome__divider' aria-hidden='true'>
                            <span />
                            <i />
                            <span />
                        </div>
                        <p key={welcomeMessage.quote} className='dashboard-welcome__quote'>
                            “{welcomeMessage.quote}”
                        </p>
                    </section>
                    <div className='quick-panel'>
                        <div className='tab__dashboard__header'>
                            <Text
                                as='p'
                                color='prominent'
                                lineHeight='s'
                                size={isDesktop ? 's' : 'xxs'}
                                className='subtitle'
                            >
                                {is_google_drive_configured
                                    ? localize(
                                          'Import a bot from your computer or Google Drive, build it from scratch, or start with a quick strategy.'
                                      )
                                    : localize(
                                          'Import a bot from your computer, build it from scratch, or start with a quick strategy.'
                                      )}
                            </Text>
                        </div>
                        <Cards has_dashboard_strategies={has_dashboard_strategies} is_mobile={!isDesktop} />
                    </div>
                </div>
            </div>
            <InfoPanel />
            {active_tab === 0 && <OnboardTourHandler is_mobile={!isDesktop} />}
        </React.Fragment>
    );
});

export default DashboardComponent;
