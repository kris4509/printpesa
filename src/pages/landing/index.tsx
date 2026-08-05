import React, { useCallback, useState } from 'react';
import { Localize, localize } from '@deriv-com/translations';
import { generateOAuthURL } from '@/components/shared';
import Button from '@/components/shared_ui/button';
import './landing.scss';

const LandingPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

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

    return (
        <div className='landing-page'>
            <div className='landing-page__inner'>
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
            </div>
        </div>
    );
};

export default LandingPage;
