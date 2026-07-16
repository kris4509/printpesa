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
                    {/* Official WhatsApp brand icon */}
            <svg
                className='whatsapp-support__icon'
                viewBox='0 0 175.216 175.552'
                xmlns='http://www.w3.org/2000/svg'
                fill='currentColor'
            >
                <path d='M87.184 0C38.888 0 0 38.691 0 86.355c0 15.033 4.098 29.137 11.228 41.274L0 175.552l49.789-13.24c11.644 6.507 25.025 10.242 39.24 10.242 48.297 0 87.187-38.692 87.187-86.355C176.216 38.69 135.481 0 87.184 0zm0 158.108c-13.455 0-25.974-3.676-36.655-10.063l-2.628-1.563-27.24 7.247 7.12-26.715-1.696-2.734C19.7 113.553 15.96 100.356 15.96 86.355c0-39.315 32.072-71.25 71.224-71.25 38.948 0 71.02 31.935 71.02 71.25 0 39.314-32.072 71.753-71.02 71.753zm39.123-53.693c-2.139-1.073-12.663-6.252-14.63-6.966-1.965-.714-3.395-.982-4.828 1.073-1.432 2.054-5.546 6.966-6.797 8.395-1.253 1.428-2.505 1.607-4.644.535-2.139-1.073-9.02-3.32-17.187-10.592-6.354-5.66-10.642-12.654-11.894-14.707-1.253-2.054-.134-3.166 .94-4.189 .964-.921 2.139-2.411 3.213-3.616 1.075-1.205 1.432-2.054 2.14-3.438.714-1.382.357-2.589-.178-3.616-.536-1.026-4.828-11.618-6.617-15.906-1.741-4.174-3.52-3.612-4.828-3.68-.357-.02-.982-.02-1.61-.02-1.43 0-3.749.535-5.712 2.589-1.966 2.054-7.512 7.233-7.512 17.648 0 10.414 7.69 20.473 8.763 21.855 1.074 1.381 15.135 23.088 36.683 32.394 5.132 2.213 9.134 3.536 12.25 4.531 5.148 1.64 9.832 1.407 13.535.853 4.128-.616 12.713-5.188 14.5-10.196 1.787-5.009 1.787-9.3 1.253-10.196-.534-.895-1.966-1.43-4.104-2.502z'/>
            </svg>
        </button>
    );
};

export default WhatsAppSupport;
