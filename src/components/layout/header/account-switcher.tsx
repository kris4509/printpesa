import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { addComma, getDecimalPlaces } from '@/components/shared';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { api_base } from '@/external/bot-skeleton/services/api/api-base';
import { generateDerivApiInstance } from '@/external/bot-skeleton/services/api/appId';
import { useApiBase } from '@/hooks/useApiBase';
import { useStore } from '@/hooks/useStore';
import { useLogout } from '@/hooks/useLogout';
import { isDemoAccount } from '@/utils/account-helpers';
import { Localize } from '@deriv-com/translations';
import { TAccountSwitcher } from './common/types';
import AccountInfoWrapper from './account-info-wrapper';
import './account-switcher.scss';


const AccountSwitcher = observer(({ activeAccount }: TAccountSwitcher) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'real' | 'demo'>('real');
    const [resetAmount, setResetAmount] = useState('10000');
    const [isResetting, setIsResetting] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
    const [demoBalanceOffset, setDemoBalanceOffset] = useState<number>(() => 
        Number(localStorage.getItem('demo_balance_offset') || 0)
    );

    const wrapperRef = useRef<HTMLDivElement>(null);
    const currencyMenuRef = useRef<HTMLDivElement>(null);

    const { accountList, activeLoginid } = useApiBase();
    const { client, run_panel } = useStore() ?? {};
    const handleLogout = useLogout();

    const { displayCurrency, setDisplayCurrency, convertCurrency, formatCurrency } = useCurrencyConverter(
        activeAccount?.currency ?? 'USD'
    );

    const is_bot_running = run_panel?.is_running || api_base.is_running;

    // Close dropdown on outside click or Escape
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setShowCurrencyMenu(false);
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
                setShowCurrencyMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Auto-set tab based on active account type
    useEffect(() => {
        if (activeLoginid) {
            setActiveTab(isDemoAccount(activeLoginid) ? 'demo' : 'real');
        }
    }, [activeLoginid]);

    const toggleDropdown = useCallback(() => {
        if (is_bot_running) return;
        setIsOpen(prev => !prev);
        setShowCurrencyMenu(false);
    }, [is_bot_running]);

    const handleAccountSelect = useCallback(
        (loginid: string) => {
            localStorage.setItem('active_loginid', loginid);
            client?.checkAndRegenerateWebSocket();
            setIsOpen(false);
        },
        [client]
    );

    const handleResetDemoBalance = useCallback(async () => {
        if (isResetting) return;
        setIsResetting(true);
        setResetSuccess(false);
        try {
            const requestedAmount = parseFloat(resetAmount) || 10000;
            
            // Parse current actual backend balance
            let currentRealBalance = 0;
            if (activeAccount?.balance != null) {
                currentRealBalance = typeof activeAccount.balance === 'string'
                    ? parseFloat(activeAccount.balance.replace(/,/g, ''))
                    : Number(activeAccount.balance);
            }
            
            try {
                const response = await api_base.api?.send({ topup_virtual: 1 });
                if (response && response.error) {
                    console.warn('Deriv API topup_virtual returned error:', response.error.message);
                } else if (response) {
                    currentRealBalance = 10000; // API successfully topped up to 10k
                }
            } catch (err: any) {
                console.warn('Deriv API topup_virtual threw error:', err?.message || err);
            }

            // Store the offset so the UI simulates the requested amount
            const offset = currentRealBalance - requestedAmount;
            
            localStorage.setItem('demo_balance_offset', offset.toString());
            setDemoBalanceOffset(offset);

            setResetSuccess(true);
            client?.checkAndRegenerateWebSocket();
            setTimeout(() => setResetSuccess(false), 3000);
        } catch (err) {
            console.error('Reset demo balance failed:', err);
        } finally {
            setIsResetting(false);
        }
    }, [isResetting, resetAmount, client, activeAccount]);

    // Build account lists split by real/demo
    const formattedAccounts = useMemo(() => {
        if (!accountList) return [];

        return accountList.map(account => {
            const isVirtual = isDemoAccount(account.loginid);
            
            let rawBalance = 0;
            if (account.balance != null) {
                rawBalance = typeof account.balance === 'string'
                    ? parseFloat(account.balance.replace(/,/g, ''))
                    : Number(account.balance);
            }

            if (isVirtual) {
                rawBalance = Math.max(0, rawBalance - demoBalanceOffset);
            }

            return {
                loginid: account.loginid,
                currency: account.currency,
                balance: addComma(rawBalance.toFixed(getDecimalPlaces(account.currency))),
                rawBalance,
                isVirtual,
                isActive: account.loginid === activeLoginid,
            };
        });
    }, [accountList, activeLoginid, demoBalanceOffset]);

    const realAccounts = formattedAccounts.filter(a => !a.isVirtual);
    const demoAccounts = formattedAccounts.filter(a => a.isVirtual);
    const activeIsDemo = activeLoginid ? isDemoAccount(activeLoginid) : false;

    const { currency: activeCurrency, balance: activeBalance } = activeAccount ?? { currency: 'USD', balance: '0' };
    let numBalance = typeof activeBalance === 'string'
        ? parseFloat((activeBalance as string).replace(/,/g, ''))
        : Number(activeBalance ?? 0);

    if (activeIsDemo) {
        numBalance = Math.max(0, numBalance - demoBalanceOffset);
    }

    // Convert balance for header display
    const displayBalance = useMemo(() => {
        const converted = convertCurrency(numBalance, activeCurrency ?? 'USD', displayCurrency);
        const prefix = displayCurrency === 'KES' ? '' : '$';
        const code = displayCurrency;
        return `${prefix}${converted.toFixed(2)} ${code}`;
    }, [numBalance, activeCurrency, displayCurrency, convertCurrency]);

    // Per-account balance in selected currency
    const getAccountBalance = useCallback((rawBalance: number, acctCurrency: string) => {
        const converted = convertCurrency(rawBalance, acctCurrency ?? 'USD', displayCurrency);
        return `${converted.toFixed(2)} ${displayCurrency}`;
    }, [convertCurrency, displayCurrency]);

    if (!activeAccount) return null;

    const { currency, balance } = activeAccount;

    const getCurrencyIcon = (cur: string, isVirtual: boolean) => {
        if (isVirtual) {
            return (
                <span className='accs-icon accs-icon--demo'>
                    <svg width='20' height='20' viewBox='0 0 20 20' fill='none'>
                        <circle cx='10' cy='10' r='9' stroke='#6C86AD' strokeWidth='2' />
                        <text x='10' y='15' textAnchor='middle' fontSize='10' fill='#6C86AD' fontWeight='bold'>D</text>
                    </svg>
                </span>
            );
        }
        if (cur === 'USD') {
            return (
                <span className='accs-icon accs-icon--usd'>
                    <svg width='24' height='24' viewBox='0 0 32 32'>
                        <circle cx='16' cy='16' r='16' fill='#3C4670' />
                        <text x='16' y='22' textAnchor='middle' fontSize='16' fill='white' fontWeight='bold'>$</text>
                    </svg>
                </span>
            );
        }
        return (
            <span className='accs-icon accs-icon--default'>
                <svg width='24' height='24' viewBox='0 0 32 32'>
                    <circle cx='16' cy='16' r='16' fill='#3C4670' />
                    <text x='16' y='22' textAnchor='middle' fontSize='13' fill='white' fontWeight='bold'>{cur?.[0] ?? '?'}</text>
                </svg>
            </span>
        );
    };

    return (
        <div className='acc-info__wrapper new-acc-switcher' ref={wrapperRef}>
            {/* ── Currency selector pill ── */}
            <div className='new-acc-switcher__currency-pill' ref={currencyMenuRef}>
                <button
                    className='new-acc-switcher__currency-btn'
                    onClick={e => { e.stopPropagation(); setShowCurrencyMenu(p => !p); setIsOpen(false); }}
                    aria-haspopup='listbox'
                    aria-expanded={showCurrencyMenu}
                >
                    {displayCurrency}
                    <svg className={classNames('new-acc-switcher__caret', { 'new-acc-switcher__caret--up': showCurrencyMenu })} width='10' height='10' viewBox='0 0 10 10' fill='none'>
                        <path d='M2 3.5L5 6.5L8 3.5' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
                    </svg>
                </button>
                {showCurrencyMenu && (
                    <div className='new-acc-switcher__currency-menu' role='listbox'>
                        {(['USD', 'KES'] as const).map(cur => (
                            <button
                                key={cur}
                                role='option'
                                aria-selected={displayCurrency === cur}
                                className={classNames('new-acc-switcher__currency-option', {
                                    'new-acc-switcher__currency-option--active': displayCurrency === cur,
                                })}
                                onClick={() => { setDisplayCurrency(cur); setShowCurrencyMenu(false); }}
                            >
                                {cur}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Balance button (opens main dropdown) ── */}
            <AccountInfoWrapper>
                <button
                    className={classNames('new-acc-switcher__balance-btn', {
                        'new-acc-switcher__balance-btn--open': isOpen,
                        'new-acc-switcher__balance-btn--disabled': is_bot_running,
                    })}
                    onClick={toggleDropdown}
                    aria-haspopup='dialog'
                    aria-expanded={isOpen}
                    disabled={is_bot_running}
                    title='Account balance'
                >
                    <span className='new-acc-switcher__balance-icon'>
                        {getCurrencyIcon(currency ?? '', activeIsDemo)}
                    </span>
                    <span className='new-acc-switcher__balance-amount'>{displayBalance}</span>
                    <svg
                        className={classNames('new-acc-switcher__caret new-acc-switcher__caret--balance', {
                            'new-acc-switcher__caret--up': isOpen,
                        })}
                        width='12' height='12' viewBox='0 0 12 12' fill='none'
                    >
                        <path d='M2 4.5L6 8.5L10 4.5' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
                    </svg>
                </button>
            </AccountInfoWrapper>

            {/* ── Dropdown Panel ── */}
            {isOpen && (
                <div className='new-acc-switcher__panel' role='dialog' aria-label='Account switcher'>
                    {/* Tabs */}
                    <div className='new-acc-switcher__tabs'>
                        <button
                            className={classNames('new-acc-switcher__tab', { 'new-acc-switcher__tab--active': activeTab === 'real' })}
                            onClick={() => setActiveTab('real')}
                        >
                            <Localize i18n_default_text='Real' />
                        </button>
                        <button
                            className={classNames('new-acc-switcher__tab', { 'new-acc-switcher__tab--active': activeTab === 'demo' })}
                            onClick={() => setActiveTab('demo')}
                        >
                            <Localize i18n_default_text='Demo' />
                        </button>
                    </div>

                    <div className='new-acc-switcher__panel-body'>
                        {/* Account Group */}
                        <div className='new-acc-switcher__group'>
                            <div className='new-acc-switcher__group-header'>
                                <span className='new-acc-switcher__group-title'>
                                    {activeTab === 'real' ? (
                                        <Localize i18n_default_text='Deriv accounts' />
                                    ) : (
                                        <Localize i18n_default_text='Demo accounts' />
                                    )}
                                </span>
                                <button className='new-acc-switcher__collapse-btn' aria-label='Collapse'>
                                    <svg width='12' height='12' viewBox='0 0 12 12' fill='none'>
                                        <path d='M2 8L6 4L10 8' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
                                    </svg>
                                </button>
                            </div>

                            {/* Account list */}
                            <div className='new-acc-switcher__accounts'>
                                {(activeTab === 'real' ? realAccounts : demoAccounts).length === 0 ? (
                                    <p className='new-acc-switcher__no-accounts'>
                                        <Localize i18n_default_text='No accounts available' />
                                    </p>
                                ) : (
                                    (activeTab === 'real' ? realAccounts : demoAccounts).map(account => (
                                        <div
                                            key={account.loginid}
                                            className={classNames('new-acc-switcher__account-row', {
                                                'new-acc-switcher__account-row--active': account.isActive,
                                            })}
                                            onClick={() => !account.isActive && handleAccountSelect(account.loginid)}
                                            role='button'
                                            tabIndex={0}
                                            onKeyDown={e => {
                                                if (!account.isActive && (e.key === 'Enter' || e.key === ' ')) {
                                                    e.preventDefault();
                                                    handleAccountSelect(account.loginid);
                                                }
                                            }}
                                        >
                                            <div className='new-acc-switcher__account-left'>
                                                {getCurrencyIcon(account.currency ?? '', account.isVirtual)}
                                                <div className='new-acc-switcher__account-info'>
                                                    <span className='new-acc-switcher__account-name'>
                                                        {account.isVirtual ? (
                                                            <Localize i18n_default_text='Demo' />
                                                        ) : (
                                                            account.currency === 'USD' ? 'US Dollar' : (account.currency ?? 'Real')
                                                        )}
                                                    </span>
                                                    <span className='new-acc-switcher__account-id'>{account.loginid}</span>
                                                </div>
                                            </div>
                                            <span className='new-acc-switcher__account-balance'>
                                                {getAccountBalance(account.rawBalance, account.currency ?? 'USD')}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Reset Demo Balance (demo tab only) */}
                        {activeTab === 'demo' && (
                            <div className='new-acc-switcher__reset-section'>
                                <h4 className='new-acc-switcher__reset-title'>
                                    <Localize i18n_default_text='Reset demo balance' />
                                </h4>
                                <p className='new-acc-switcher__reset-desc'>
                                    <Localize i18n_default_text='Set a starting balance for your active demo account.' />
                                </p>
                                <div className='new-acc-switcher__reset-row'>
                                    <div className='new-acc-switcher__reset-input-group'>
                                        <label className='new-acc-switcher__reset-label'>
                                            <Localize i18n_default_text='Demo balance amount' />
                                        </label>
                                        <input
                                            className='new-acc-switcher__reset-input'
                                            type='number'
                                            value={resetAmount}
                                            min='100'
                                            max='1000000'
                                            onChange={e => setResetAmount(e.target.value)}
                                            placeholder='10000'
                                        />
                                        <span className='new-acc-switcher__reset-default'>
                                            <Localize i18n_default_text='Default: 10000 USD' />
                                        </span>
                                    </div>
                                    <button
                                        className={classNames('new-acc-switcher__reset-btn', {
                                            'new-acc-switcher__reset-btn--loading': isResetting,
                                            'new-acc-switcher__reset-btn--success': resetSuccess,
                                        })}
                                        onClick={handleResetDemoBalance}
                                        disabled={isResetting || demoAccounts.length === 0}
                                    >
                                        {isResetting ? (
                                            <span className='new-acc-switcher__reset-spinner' />
                                        ) : resetSuccess ? (
                                            <Localize i18n_default_text='Done!' />
                                        ) : (
                                            <>
                                                <Localize i18n_default_text='Reset Demo' />
                                                <br />
                                                <Localize i18n_default_text='Account Balance' />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* CFD link */}
                        <p className='new-acc-switcher__cfd-link'>
                            <Localize i18n_default_text="Looking for CFD accounts? Go to Trader's Hub" />
                        </p>

                        {/* Footer: Manage + Logout */}
                        <div className='new-acc-switcher__footer'>
                            <button className='new-acc-switcher__manage-btn' onClick={() => setIsOpen(false)}>
                                <Localize i18n_default_text='Manage accounts' />
                            </button>
                            <button className='new-acc-switcher__logout-btn' onClick={() => { setIsOpen(false); handleLogout(); }}>
                                <Localize i18n_default_text='Logout' />
                                <svg width='16' height='16' viewBox='0 0 16 16' fill='none' style={{ marginLeft: '6px' }}>
                                    <path d='M10 2H13a1 1 0 011 1v10a1 1 0 01-1 1H10M7 11l3-3-3-3M10 8H3' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default AccountSwitcher;
