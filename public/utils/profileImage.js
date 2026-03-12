import { BASE_URL } from '/utils/apiList.js';

export const DEFAULT_PROFILE_IMAGE = '/images/default-profile.svg';

function toCleanString(value) {
    if (value == null) {
        return '';
    }

    const normalized = String(value).trim();
    const lowerCased = normalized.toLowerCase();

    if (!normalized || lowerCased === 'null' || lowerCased === 'undefined') {
        return '';
    }

    return normalized;
}

export function pickProfileImageValue(...candidates) {
    for (const candidate of candidates) {
        const normalized = toCleanString(candidate);
        if (normalized) {
            return normalized;
        }
    }

    return '';
}

export function resolveProfileImageUrl(...candidates) {
    const imageValue = pickProfileImageValue(...candidates);

    if (!imageValue) {
        return DEFAULT_PROFILE_IMAGE;
    }

    if (
        imageValue.startsWith('http://') ||
        imageValue.startsWith('https://') ||
        imageValue.startsWith('data:') ||
        imageValue.startsWith('blob:')
    ) {
        return imageValue;
    }

    if (imageValue.startsWith('/')) {
        return `${BASE_URL}${imageValue}`;
    }

    return `${BASE_URL}/${imageValue}`;
}
