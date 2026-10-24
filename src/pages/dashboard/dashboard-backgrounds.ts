const SIX_HOURS_IN_MS = 6 * 60 * 60 * 1000;

const DASHBOARD_BACKGROUNDS = [
    'car-0.jpg',
    'action-0.svg',
    'car-1.jpg',
    'action-1.svg',
    'car-2.jpg',
    'action-2.svg',
    'car-3.jpg',
    'action-3.svg',
    'car-4.jpg',
    'action-4.svg',
    'car-5.jpg',
    'anime-gojo-awakening.png',
    'anime-gojo-purple.png',
    'anime-ninja-action.png',
    'anime-ninja-sky.png',
];

export const getDashboardBackgroundImage = (timestamp: number): string => {
    const rotation_slot = Math.floor(timestamp / SIX_HOURS_IN_MS);
    return DASHBOARD_BACKGROUNDS[rotation_slot % DASHBOARD_BACKGROUNDS.length];
};

export const getMillisecondsUntilNextDashboardBackground = (timestamp: number): number =>
    SIX_HOURS_IN_MS - (timestamp % SIX_HOURS_IN_MS);
