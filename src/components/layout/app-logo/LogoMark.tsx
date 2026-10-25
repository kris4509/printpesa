// Printpesa's name is the logo mark, shared by the header and mobile drawer.
import { useEffect, useState } from 'react';
import { getPreviewAppName, subscribePreviewAppName } from '@/utils/live-branding-store';
import { getAppName } from '../../../utils/branding';

export const LogoMark = () => {
    const [previewAppName, setPreviewAppName] = useState<string | null>(getPreviewAppName());

    useEffect(() => subscribePreviewAppName(setPreviewAppName), []);

    const appName = previewAppName || getAppName();

    return (
        <span className='app-header__logo-mark'>
            <span className='app-header__logo-text'>{appName}</span>
        </span>
    );
};
