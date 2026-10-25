// Customizable text wordmark for desktop and mobile headers.
import { localize } from '@deriv-com/translations';
import { LogoMark } from './LogoMark';
import './app-logo.scss';

export const AppLogo = () => {
    return (
        <a href='/' className='app-header__logo' aria-label={localize('Home')}>
            <LogoMark />
        </a>
    );
};
