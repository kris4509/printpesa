import classnames from 'classnames';
import { formatMoney, getCurrencyDisplayCode } from '@/components/shared';
import Text from '@/components/shared_ui/text';
import { LogTypes } from '@/external/bot-skeleton';
import { Localize, localize } from '@deriv-com/translations';
import { TFormatMessageProps } from '../journal.types';

const FormatMessage = ({ logType, className, extra }: TFormatMessageProps) => {
    const getLogMessage = () => {
        switch (logType) {
            case LogTypes.LOAD_BLOCK: {
                return localize('Blocks are loaded successfully');
            }
            case LogTypes.NOT_OFFERED: {
                return localize('Resale of this contract is not offered.');
            }
            case LogTypes.PURCHASE: {
                const { transaction_id } = extra;
                return (
                    <Localize
                        i18n_default_text='<0>Bought</0>: Contract purchased (ID: {{transaction_id}})'
                        values={{ transaction_id }}
                        components={[<Text key={0} size='xxs' styles={{ color: 'var(--status-info)' }} />]}
                        options={{ interpolation: { escapeValue: false } }}
                    />
                );
            }
            case LogTypes.SELL: {
                const { sold_for } = extra;
                return (
                    <Localize
                        i18n_default_text='<0>Sold for</0>: {{sold_for}}'
                        values={{ sold_for }}
                        components={[<Text key={0} size='xxs' styles={{ color: 'var(--status-warning)' }} />]}
                    />
                );
            }
            case LogTypes.PROFIT: {
                const { currency, profit } = extra;
                return (
                    <Localize
                        i18n_default_text='Profit amount: <0>{{profit}}</0>'
                        values={{
                            profit: `${formatMoney(currency, profit, true)} ${getCurrencyDisplayCode(currency)}`,
                        }}
                        components={[<Text key={0} size='xxs' styles={{ color: 'var(--status-success)' }} />]}
                    />
                );
            }
            case LogTypes.LOST: {
                const { currency, profit } = extra;
                return (
                    <Localize
                        i18n_default_text='Loss amount: <0>{{profit}}</0>'
                        values={{
                            profit: `${formatMoney(currency, profit, true)} ${getCurrencyDisplayCode(currency)}`,
                        }}
                        components={[<Text key={0} size='xxs' styles={{ color: 'var(--status-danger)' }} />]}
                    />
                );
            }
            case LogTypes.WELCOME_BACK: {
                const { current_currency } = extra;
                if (current_currency)
                    return (
                        <Localize
                            i18n_default_text='Welcome back! Your messages have been restored. You are using your {{current_currency}} account.'
                            values={{
                                current_currency,
                            }}
                        />
                    );
                return <Localize i18n_default_text='Welcome back! Your messages have been restored.' />;
            }

            case LogTypes.WELCOME: {
                const { current_currency } = extra;
                if (current_currency)
                    return (
                        <Localize
                            i18n_default_text='You are using your {{current_currency}} account.'
                            values={{
                                current_currency,
                            }}
                        />
                    );
                break;
            }
            case LogTypes.LAST_DIGITS_ANALYSIS: {
                const { market, condition, threshold, digits, result } = extra;
                const conditions: Record<string, string> = {
                    LESS_THAN: localize('less than'),
                    LESS_OR_EQUAL: localize('less than or equal to'),
                    GREATER_THAN: localize('greater than'),
                    GREATER_OR_EQUAL: localize('greater than or equal to'),
                    EQUAL: localize('equal to'),
                    NOT_EQUAL: localize('not equal to'),
                    ALL_EVEN: localize('all even'),
                    ALL_ODD: localize('all odd'),
                };
                const conditionLabel = conditions[condition || ''] || condition || '';
                const conditionText =
                    condition === 'ALL_EVEN' || condition === 'ALL_ODD'
                        ? conditionLabel
                        : `${conditionLabel} ${threshold ?? ''}`.trim();

                return (
                    <Localize
                        i18n_default_text='Last Digits Analysis Market: {{market}} Condition: {{condition}} Digits: [{{digits}}] Result: {{result}}'
                        values={{
                            market: market || 'N/A',
                            condition: conditionText,
                            digits: (digits || []).join(', '),
                            result: result ? '✅ TRUE' : '❌ FALSE',
                        }}
                    />
                );
            }
            default:
                return null;
        }
    };

    return <div className={classnames('journal__text', className)}>{getLogMessage()}</div>;
};

export default FormatMessage;
