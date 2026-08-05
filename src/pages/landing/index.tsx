import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Localize, localize } from '@deriv-com/translations';
import { generateOAuthURL } from '@/components/shared';
import { api_base } from '@/external/bot-skeleton';
import { cleanupUrl, handleOAuthCallback } from '@/external/deriv-core';
import { DerivWSAccountsService } from '@/services/derivws-accounts.service';
import Button from '@/components/shared_ui/button';
import './landing.scss';

const LandingPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [authStatus, setAuthStatus] = useState<'pending' | 'success' | 'error'>('pending');

    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const isCallback = searchParams.has('code');

    const handleLogin = useCallback(async () => {
        setErrorMessage('');
        setIsLoading(true);

        try {
            const oauthUrl = await generateOAuthURL();
            if (!oauthUrl) {
                throw new Error('Failed to generate OAuth URL');
            }
            window.location.replace(oauthUrl);
        } catch (error) {
            console.error('Login redirect failed:', error);
            setErrorMessage(localize('Unable to start login. Please try again.'));
            setIsLoading(false);
        }
    }, []);

    const handleSignup = useCallback(async () => {
        setErrorMessage('');
        setIsLoading(true);

        try {
            const oauthUrl = await generateOAuthURL('registration');
            if (!oauthUrl) {
                throw new Error('Failed to generate OAuth URL for signup');
            }
            window.location.replace(oauthUrl);
        } catch (error) {
            console.error('Signup redirect failed:', error);
            setErrorMessage(localize('Unable to start sign up. Please try again.'));
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isCallback) {
            return;
        }

        const runCallback = async () => {
            setAuthStatus('pending');
            setErrorMessage('');

            try {
                const authInfo = await handleOAuthCallback(window.location.href, {
                    clientId: process.env.NEXT_PUBLIC_DERIV_APP_ID || '',
                    redirectUri: window.location.origin,
                    scopes: 'trade',
                });

                const accounts = await DerivWSAccountsService.fetchAccountsList(authInfo.access_token);
                if (!accounts?.length) {
                    throw new Error('No accounts returned after authentication');
                }

                DerivWSAccountsService.storeAccounts(accounts);
                const firstAccount = accounts[0];
                localStorage.setItem('active_loginid', firstAccount.account_id);
                const isDemo =
                    firstAccount.account_id.startsWith('VRT') || firstAccount.account_id.startsWith('VRTC');
                localStorage.setItem('account_type', isDemo ? 'demo' : 'real');

                await api_base.init(true);
                setAuthStatus('success');
                navigate('/dashboard', { replace: true });
            } catch (error) {
                console.error('OAuth callback error:', error);
                cleanupUrl(window.location.origin);
                setErrorMessage(localize('Authentication failed. Please try again or use a different account.'));
                setAuthStatus('error');
            }
        };

        runCallback();
    }, [isCallback, navigate]);

    return (
        <div className='landing-page'>
            <div className='landing-page__inner'>
                {isCallback ? (
                    <div className='landing-page__callback-panel'>
                        <h1 className='landing-page__title'>
                            <Localize i18n_default_text='Completing your login' />
                        </h1>
                        <p className='landing-page__subtitle'>
                            <Localize i18n_default_text='We are confirming your account and finalizing access to your dashboard.' />
                        </p>
                        <div className='landing-page__spinner' />
                        {authStatus === 'error' && (
                            <div className='landing-page__callback-error'>
                                <p>{errorMessage || localize('Something went wrong during authentication.')}</p>
                                <Button primary text={localize('Return to home')} onClick={() => navigate('/')} />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className='landing-page__hero'>
                        <div className='landing-page__content'>
                            <span className='landing-page__eyebrow'>
                                <Localize i18n_default_text='Automated bot trading for Deriv' />
                            </span>
                            <h1 className='landing-page__headline'>
                                <Localize i18n_default_text='Build smarter strategies and manage trades with confidence' />
                            </h1>
                            <p className='landing-page__description'>
                                <Localize i18n_default_text='Start with a secure Deriv login, tune your bot settings, and monitor performance from one centralized dashboard.' />
                            </p>
                            <div className='landing-page__actions'>
                                <Button primary is_loading={isLoading} disabled={isLoading} text={localize('Log in')} onClick={handleLogin} />
                                <Button primary_light is_loading={isLoading} disabled={isLoading} text={localize('Sign up')} onClick={handleSignup} />
                            </div>
                            {errorMessage && <p className='landing-page__error'>{errorMessage}</p>}
                        </div>
                        <div className='landing-page__features'>
                            <div className='landing-page__feature'>
                                <h2>
                                    <Localize i18n_default_text='Live market sync' />
                                </h2>
                                <p>
                                    <Localize i18n_default_text='Connect to Deriv markets instantly and keep your trading bot aligned with real-time data.' />
                                </p>
                            </div>
                            <div className='landing-page__feature'>
                                <h2>
                                    <Localize i18n_default_text='Easy strategy builder' />
                                </h2>
                                <p>
                                    <Localize i18n_default_text='Configure, save, and test strategies using a modern workflow designed for rapid bot development.' />
                                </p>
                            </div>
                            <div className='landing-page__feature'>
                                <h2>
                                    <Localize i18n_default_text='Dashboard insights' />
                                </h2>
                                <p>
                                    <Localize i18n_default_text='Track activity, accounts, and bot health from one place after login.' />
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LandingPage;
