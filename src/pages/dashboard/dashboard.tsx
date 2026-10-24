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
    const backgroundImage = getDashboardBackgroundImage(backgroundRotationSlot * 6 * 60 * 60 * 1000);

    useEffect(() => {
        const now = Date.now();
        const timeout_id = window.setTimeout(() => {
            setBackgroundRotationSlot(Math.floor(Date.now() / (6 * 60 * 60 * 1000)));
        }, getMillisecondsUntilNextDashboardBackground(now));

        return () => window.clearTimeout(timeout_id);
    }, [backgroundRotationSlot]);

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
