import { ComponentProps } from 'react';
import { LabelPairedGlobeSmRegularIcon } from '@deriv/quill-icons';
import { useTranslations } from '@deriv-com/translations';
import { Text } from '@deriv-com/ui';

type TMenuHeader = {
    hideLanguageSetting: boolean;
    openLanguageSetting: ComponentProps<'button'>['onClick'];
};

const MenuHeader = ({ hideLanguageSetting, openLanguageSetting }: TMenuHeader) => {
    const { currentLang, localize } = useTranslations();

    return (
        <div className='mobile-menu__header'>
            <Text size='md' weight='bold' className='mobile-menu__header-title'>
                {localize('Menu')}
            </Text>

            {!hideLanguageSetting && (
                <button
                    className='mobile-menu__header__language items-center'
                    onClick={openLanguageSetting}
                    aria-label={`${localize('Change language')} - ${localize('Current language')}: ${currentLang}`}
                    aria-expanded='false'
                    aria-haspopup='menu'
                >
                    <LabelPairedGlobeSmRegularIcon />
                    <Text className='ml-[0.4rem]' size='sm' weight='bold'>
                        {currentLang}
                    </Text>
                </button>
            )}
        </div>
    );
};

export default MenuHeader;
