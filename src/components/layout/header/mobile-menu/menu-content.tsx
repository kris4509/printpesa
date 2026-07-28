import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';
import useThemeSwitcher from '@/hooks/useThemeSwitcher';
import { generateOAuthURL } from '@/components/shared';
import { useTranslations } from '@deriv-com/translations';
import { ToggleSwitch, Text } from '@deriv-com/ui';
import { LegacyTheme1pxIcon, LegacyLogout1pxIcon } from '@deriv/quill-icons/Legacy';

interface MenuContentProps {
    enableThemeToggle?: boolean;
    onCloseDrawer?: () => void;
    onLogout?: () => void;
}

const NAV_ITEMS = [
    {
        key: 'dashboard',
        hash: '#dashboard',
        label: 'Dashboard',
        icon: (
            <svg height='18' width='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                <rect x='3' y='3' width='7' height='7' rx='1' />
                <rect x='14' y='3' width='7' height='7' rx='1' />
                <rect x='14' y='14' width='7' height='7' rx='1' />
                <rect x='3' y='14' width='7' height='7' rx='1' />
            </svg>
        ),
    },
    {
        key: 'bot_builder',
        hash: '#bot_builder',
        label: 'Bot Builder',
        icon: (
            <svg height='18' width='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                <path d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' />
            </svg>
        ),
    },
    {
        key: 'best_bots',
        hash: '#best_bots',
        label: 'Best Bots',
        icon: (
            <svg height='18' width='18' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' />
            </svg>
        ),
    },
    {
        key: 'market_analyzer',
        hash: '#market_analyzer',
        label: 'Market Analyzer',
        icon: (
            <svg height='18' width='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                <path d='M3 3v18h18M18 9l-5 5-4-4-4 4' />
            </svg>
        ),
    },
    {
        key: 'dcircles',
        hash: '#dcircles',
        label: 'DCircles',
        icon: (
            <svg height='18' width='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                <circle cx='12' cy='12' r='9' />
                <circle cx='12' cy='12' r='3' fill='currentColor' />
            </svg>
        ),
    },
    {
        key: 'manual_trade',
        hash: '#manual_trade',
        label: 'Manual Trader',
        icon: (
            <svg height='18' width='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                <path d='M18 20V10M12 20V4M6 20v-6' />
            </svg>
        ),
    },
    {
        key: 'tutorial',
        hash: '#tutorial',
        label: 'Tutorials',
        icon: (
            <svg height='18' width='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                <polygon points='5 3 19 12 5 21 5 3' />
            </svg>
        ),
    },
];

const MenuContent = observer(({ enableThemeToggle = true, onCloseDrawer, onLogout }: MenuContentProps) => {
    const { localize } = useTranslations();
    const { is_dark_mode_on, toggleTheme } = useThemeSwitcher();
    const { client } = useStore() ?? {};
    const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));

    const currentHash = window.location.hash || '#dashboard';

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(Boolean(document.fullscreenElement));
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error('Failed to enter fullscreen:', err);
            });
        } else {
            document.exitFullscreen().catch(err => {
                console.error('Failed to exit fullscreen:', err);
            });
        }
    };

    const handleNavClick = (hash: string) => {
        window.location.hash = hash;
        onCloseDrawer?.();
    };

    const handleWhatsAppClick = () => {
        const phoneNumber = '+254707546201';
        const message = encodeURIComponent('Hi! I need assistance with the trading bot.');
        window.open(`https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
        onCloseDrawer?.();
    };

    const handleLogin = async () => {
        try {
            onCloseDrawer?.();
            const oauthUrl = await generateOAuthURL();
            if (oauthUrl) window.location.replace(oauthUrl);
        } catch (e) {
            console.error('Login redirection failed:', e);
        }
    };

    const handleSignup = async () => {
        try {
            onCloseDrawer?.();
            const oauthUrl = await generateOAuthURL('registration');
            if (oauthUrl) window.location.replace(oauthUrl);
        } catch (e) {
            console.error('Signup redirection failed:', e);
        }
    };

    return (
        <div className='drawer-menu-content'>

            {/* ── 1. Hub / Platform Header Card ── */}
            <div className='drawer-menu-content__hub-card'>
                <div className='drawer-menu-content__hub-icon'>
                    <svg width='18' height='18' viewBox='0 0 24 24' fill='currentColor'>
                        <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z' />
                    </svg>
                </div>
                <span className='drawer-menu-content__hub-name'>printpesa Trading Hub</span>
                <span className='drawer-menu-content__hub-arrow'>▼</span>
            </div>

            {/* ── 2. Navigation Items List ── */}
            <div className='drawer-menu-content__section'>
                {NAV_ITEMS.map(item => {
                    const isActive = currentHash.startsWith(item.hash);
                    return (
                        <button
                            key={item.key}
                            className={clsx('drawer-menu-item', { 'drawer-menu-item--active': isActive })}
                            onClick={() => handleNavClick(item.hash)}
                            type='button'
                        >
                            <span className='drawer-menu-item__icon'>{item.icon}</span>
                            <span className='drawer-menu-item__label'>{item.label}</span>
                        </button>
                    );
                })}

                {/* WhatsApp Support Item inside Drawer */}
                <button
                    className='drawer-menu-item drawer-menu-item--whatsapp'
                    onClick={handleWhatsAppClick}
                    type='button'
                >
                    <span className='drawer-menu-item__icon drawer-menu-item__icon--wa'>
                        <svg viewBox='0 0 175.216 175.552' width='18' height='18' fill='currentColor'>
                            <path d='M87.184 0C38.888 0 0 38.691 0 86.355c0 15.033 4.098 29.137 11.228 41.274L0 175.552l49.789-13.24c11.644 6.507 25.025 10.242 39.24 10.242 48.297 0 87.187-38.692 87.187-86.355C176.216 38.69 135.481 0 87.184 0zm0 158.108c-13.455 0-25.974-3.676-36.655-10.063l-2.628-1.563-27.24 7.247 7.12-26.715-1.696-2.734C19.7 113.553 15.96 100.356 15.96 86.355c0-39.315 32.072-71.25 71.224-71.25 38.948 0 71.02 31.935 71.02 71.25 0 39.314-32.072 71.753-71.02 71.753zm39.123-53.693c-2.139-1.073-12.663-6.252-14.63-6.966-1.965-.714-3.395-.982-4.828 1.073-1.432 2.054-5.546 6.966-6.797 8.395-1.253 1.428-2.505 1.607-4.644.535-2.139-1.073-9.02-3.32-17.187-10.592-6.354-5.66-10.642-12.654-11.894-14.707-1.253-2.054-.134-3.166 .94-4.189 .964-.921 2.139-2.411 3.213-3.616 1.075-1.205 1.432-2.054 2.14-3.438.714-1.382.357-2.589-.178-3.616-.536-1.026-4.828-11.618-6.617-15.906-1.741-4.174-3.52-3.612-4.828-3.68-.357-.02-.982-.02-1.61-.02-1.43 0-3.749.535-5.712 2.589-1.966 2.054-7.512 7.233-7.512 17.648 0 10.414 7.69 20.473 8.763 21.855 1.074 1.381 15.135 23.088 36.683 32.394 5.132 2.213 9.134 3.536 12.25 4.531 5.148 1.64 9.832 1.407 13.535.853 4.128-.616 12.713-5.188 14.5-10.196 1.787-5.009 1.787-9.3 1.253-10.196-.534-.895-1.966-1.43-4.104-2.502z' />
                        </svg>
                    </span>
                    <span className='drawer-menu-item__label'>WhatsApp Support</span>
                </button>
            </div>

            <div className='drawer-menu-content__divider' />

            {/* ── 3. Toggles Section (Theme & Fullscreen) ── */}
            <div className='drawer-menu-content__section'>
                {enableThemeToggle && (
                    <div className='drawer-menu-row'>
                        <div className='drawer-menu-row__left'>
                            <span className='drawer-menu-item__icon'>
                                <LegacyTheme1pxIcon iconSize='xs' />
                            </span>
                            <span className='drawer-menu-item__label'>
                                {is_dark_mode_on ? localize('Dark Mode') : localize('Light Mode')}
                            </span>
                        </div>
                        <ToggleSwitch value={is_dark_mode_on} onChange={toggleTheme} />
                    </div>
                )}

                <div className='drawer-menu-row'>
                    <div className='drawer-menu-row__left'>
                        <span className='drawer-menu-item__icon'>
                            <svg height='18' width='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                                <path d='M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3' />
                            </svg>
                        </span>
                        <span className='drawer-menu-item__label'>{localize('Full screen')}</span>
                    </div>
                    <ToggleSwitch value={isFullscreen} onChange={toggleFullscreen} />
                </div>
            </div>

            <div className='drawer-menu-content__divider' />

            {/* ── 4. Account / Authentication Actions ── */}
            <div className='drawer-menu-content__auth-section'>
                {client?.is_logged_in ? (
                    <button
                        className='drawer-menu-item drawer-menu-item--logout'
                        onClick={() => {
                            onCloseDrawer?.();
                            onLogout?.();
                        }}
                        type='button'
                    >
                        <span className='drawer-menu-item__icon'>
                            <LegacyLogout1pxIcon iconSize='xs' />
                        </span>
                        <span className='drawer-menu-item__label'>{localize('Log out')}</span>
                    </button>
                ) : (
                    <div className='drawer-menu-content__auth-btns'>
                        <button className='drawer-btn drawer-btn--secondary' onClick={handleLogin} type='button'>
                            {localize('Log in')}
                        </button>
                        <button className='drawer-btn drawer-btn--primary' onClick={handleSignup} type='button'>
                            {localize('Sign up')}
                        </button>
                    </div>
                )}
            </div>

        </div>
    );
});

export default MenuContent;
