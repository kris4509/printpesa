import { getDashboardBackgroundImage, getMillisecondsUntilNextDashboardBackground } from '../dashboard-backgrounds';

describe('dashboard background rotation', () => {
    it('changes the background at each six-hour boundary', () => {
        const six_hours = 6 * 60 * 60 * 1000;

        expect(getDashboardBackgroundImage(0)).toBe('car-0.jpg');
        expect(getDashboardBackgroundImage(six_hours - 1)).toBe('car-0.jpg');
        expect(getDashboardBackgroundImage(six_hours)).toBe('action-0.svg');
        expect(getDashboardBackgroundImage(six_hours * 2)).toBe('car-1.jpg');
    });

    it('cycles through the complete car and anime-action set', () => {
        const six_hours = 6 * 60 * 60 * 1000;

        expect(getDashboardBackgroundImage(six_hours * 15)).toBe('car-0.jpg');
        expect(getDashboardBackgroundImage(six_hours * 11)).toBe('anime-gojo-awakening.png');
        expect(getDashboardBackgroundImage(six_hours * 14)).toBe('anime-ninja-sky.png');
    });

    it('calculates the delay to the next six-hour boundary', () => {
        const six_hours = 6 * 60 * 60 * 1000;

        expect(getMillisecondsUntilNextDashboardBackground(0)).toBe(six_hours);
        expect(getMillisecondsUntilNextDashboardBackground(1_000)).toBe(six_hours - 1_000);
    });
});
