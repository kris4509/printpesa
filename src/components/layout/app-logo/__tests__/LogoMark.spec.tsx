import { render, screen } from '@testing-library/react';
import { LogoMark } from '../LogoMark';
import { getAppName } from '@/utils/branding';

describe('LogoMark', () => {
    it('renders the resolved app name as a text wordmark without an image', () => {
        const { container } = render(<LogoMark />);

        expect(container.querySelector('.app-header__logo-text')).toHaveTextContent(getAppName());
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
});
