import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Localize, localize } from '@deriv-com/translations';
import { cleanupUrl, handleOAuthCallback } from '@/external/deriv-core';
import { DerivWSAccountsService } from '@/services/derivws-accounts.service';
import { api_base } from '@/external/bot-skeleton';
import { isPreviewMode, PREVIEW_BASE_PATH } from '@/utils/is-preview-mode';
import Button from '@/components/shared_ui/button';
import './callback.scss';

const CallbackPage = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [authStatus, setAuthStatus] = useState<'pending' | 'success' | 'error'>('pending');

    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const isCallback = searchParams.has('code');

    const getOAuthCallbackUri = () => {
        const basePath = isPreviewMode() ? PREVIEW_BASE_PATH : '';
        return `${window.location.origin}${basePath}/callback`;
    };

    useEffect(() => {
        if (!isCallback) {
            navigate('/', { replace: true });
            return;
        }

        const runCallback = async () => {
            setAuthStatus('pending');
            setErrorMessage('');
            setIsLoading(true);

            try {
                const authInfo = await handleOAuthCallback(window.location.href, {
                    clientId: process.env.NEXT_PUBLIC_DERIV_APP_ID || '',
                    redirectUri: getOAuthCallbackUri(),
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
                cleanupUrl(getOAuthCallbackUri());
                setErrorMessage(localize('Authentication failed. Please try again or use a different account.'));
                setAuthStatus('error');
            } finally {
                setIsLoading(false);
            }
        };

        runCallback();
    }, [isCallback, navigate]);

    return (
        <div className='landing-page'>
            <div className='landing-page__inner'>
                <div className='landing-page__callback-panel'>
                    <h1 className='landing-page__title'>
                        <Localize i18n_default_text='Completing your login' />
                    </h1>
                    <p className='landing-page__subtitle'>
                        <Localize i18n_default_text='We are confirming your account and finalizing access to your dashboard.' />
                    </p>
                    {isLoading && <div className='landing-page__spinner' />}
                    {authStatus === 'error' && (
                        <div className='landing-page__callback-error'>
                            <p>{errorMessage || localize('Something went wrong during authentication.')}</p>
                            <Button primary text={localize('Return to home')} onClick={() => navigate('/')} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CallbackPage;
