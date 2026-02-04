import { faSun, faCloud, faCloudRain, faCloudSun } from '@fortawesome/free-solid-svg-icons';

export const getStatusColor = (status) => {
    const colors = { sunny: '#FFD700', cloudy: '#A9A9A9', rainy: '#1E90FF', default: '#6c757d' };
    return colors[status?.toLowerCase()] || colors.default;
};

export const getWeatherIcon = (weather) => {
    const icons = { sunny: faSun, cloudy: faCloud, rainy: faCloudRain, default: faCloudSun };
    return icons[weather?.toLowerCase()] || icons.default;
};
