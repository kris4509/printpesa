import React from 'react';
import './whatsapp-support.scss';

interface WhatsAppSupportProps {
    phoneNumber?: string;
}

const WhatsAppSupport: React.FC<WhatsAppSupportProps> = ({ phoneNumber = '+254707546201' }) => {
    const handleWhatsAppClick = () => {
        const message = encodeURIComponent('Hi! I need assistance with the trading bot.');
        const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${message}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <button
            className='whatsapp-support'
            onClick={handleWhatsAppClick}
            aria-label='Contact via WhatsApp'
            title='Get support on WhatsApp'
        >
            {/* Official WhatsApp icon */}
            <svg
                className='whatsapp-support__icon'
                viewBox='0 0 24 24'
                fill='currentColor'
                xmlns='http://www.w3.org/2000/svg'
            >
                <path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-4.929 1.242c-1.524.756-2.809 1.776-3.821 3.011C2.75 10.5 2 12.604 2 14.802 2 18.01 3.78 20.718 6.46 21.88c.577.26 1.111.403 1.55.476.832.117 1.661-.042 2.509-.412l2.779-1.123 2.654 1.119c.28.118.571.169.854.169.331 0 .661-.062.977-.184 1.584-.492 2.906-1.54 3.782-2.957.876-1.418 1.363-3.127 1.363-4.969-.01-3.305-1.91-6.297-4.857-7.849z' />
            </svg>
        </button>
    );
};

export default WhatsAppSupport;
