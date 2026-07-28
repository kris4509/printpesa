// Updated mobile-menu.tsx to show hamburger button on all screen sizes & zoom levels
import { useState } from 'react';
import brandConfig from '@/../brand.config.json';
import useModalManager from '@/hooks/useModalManager';
import { useStore } from '@/hooks/useStore';
import { getActiveTabUrl } from '@/utils/getActiveTabUrl';
import { FILTERED_LANGUAGES } from '@/utils/languages';
import { useTranslations } from '@deriv-com/translations';
import { Drawer, MobileLanguagesDrawer } from '@deriv-com/ui';
import NetworkStatus from './../../footer/NetworkStatus';
import ServerTime from './../../footer/ServerTime';
import BackButton from './back-button';
import MenuContent from './menu-content';
import MenuHeader from './menu-header';
import ReportsSubmenu from './reports-submenu';
import ToggleButton from './toggle-button';
import './mobile-menu.scss';

type TMobileMenuProps = {
    onLogout?: () => void;
};

const MobileMenu = ({ onLogout }: TMobileMenuProps) => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
    const { currentLang = 'EN', localize, switchLanguage } = useTranslations();
    const { hideModal, isModalOpenFor, showModal } = useModalManager();
    const { client } = useStore() ?? {};

    const enableLanguageSettings = brandConfig.platform.footer?.enable_language_settings ?? true;
    const enableThemeToggle = brandConfig.platform.footer?.enable_theme_toggle ?? true;

    const openDrawer = () => setIsDrawerOpen(true);
    const closeDrawer = () => {
        setIsDrawerOpen(false);
        setActiveSubmenu(null);
        if (isLanguageSettingVisible) hideModal();
    };

    const closeSubmenu = () => setActiveSubmenu(null);
    const openLanguageSetting = () => showModal('MobileLanguagesDrawer');
    const isLanguageSettingVisible = Boolean(isModalOpenFor('MobileLanguagesDrawer'));

    return (
        <div className='mobile-menu'>
            <div className='mobile-menu__toggle'>
                <ToggleButton onClick={openDrawer} />
            </div>

            <Drawer isOpen={isDrawerOpen} onCloseDrawer={closeDrawer} width='32rem'>
                <Drawer.Header onCloseDrawer={closeDrawer}>
                    <MenuHeader
                        hideLanguageSetting={!enableLanguageSettings || isLanguageSettingVisible}
                        openLanguageSetting={openLanguageSetting}
                    />
                </Drawer.Header>

                <Drawer.Content>
                    {enableLanguageSettings && isLanguageSettingVisible ? (
                        <>
                            <div className='mobile-menu__back-btn'>
                                <BackButton buttonText={localize('Language')} onClick={hideModal} />
                            </div>

                            <MobileLanguagesDrawer
                                isOpen
                                languages={FILTERED_LANGUAGES}
                                onClose={hideModal}
                                onLanguageSwitch={code => {
                                    try {
                                        switchLanguage(code);
                                        hideModal();
                                        window.location.replace(getActiveTabUrl());
                                    } catch (error) {
                                        console.error('Failed to switch language:', error);
                                        hideModal();
                                    }
                                }}
                                selectedLanguage={currentLang}
                                wrapperClassName='mobile-menu__language-drawer'
                            />
                        </>
                    ) : activeSubmenu === 'reports' ? (
                        <>
                            <div className='mobile-menu__back-btn'>
                                <BackButton buttonText={localize('Reports')} onClick={closeSubmenu} />
                            </div>
                            <ReportsSubmenu />
                        </>
                    ) : (
                        <MenuContent
                            enableThemeToggle={enableThemeToggle}
                            onCloseDrawer={closeDrawer}
                            onLogout={() => {
                                closeDrawer();
                                onLogout?.();
                            }}
                        />
                    )}
                </Drawer.Content>

                <Drawer.Footer className='mobile-menu__footer'>
                    <ServerTime />
                    <NetworkStatus />
                </Drawer.Footer>
            </Drawer>
        </div>
    );
};

export default MobileMenu;
