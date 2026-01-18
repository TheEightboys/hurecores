/**
 * Date Format Utilities for Kenya
 * 
 * Kenya uses dd/mm/yyyy format (same as UK)
 * All date displays should use these utilities for consistency
 */

/**
 * Format a date string or Date object to Kenya format (dd/mm/yyyy)
 * @param date - Date object, ISO string, or timestamp
 * @returns Formatted date string (e.g., "18/01/2026")
 */
export function formatDateKE(date: Date | string | number | undefined | null): string {
    if (!date) return '-';

    try {
        const dateObj = typeof date === 'string' || typeof date === 'number'
            ? new Date(date)
            : date;

        if (isNaN(dateObj.getTime())) return '-';

        return dateObj.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch {
        return '-';
    }
}

/**
 * Format a date with time to Kenya format (dd/mm/yyyy HH:mm)
 * @param date - Date object, ISO string, or timestamp
 * @returns Formatted date-time string (e.g., "18/01/2026 14:30")
 */
export function formatDateTimeKE(date: Date | string | number | undefined | null): string {
    if (!date) return '-';

    try {
        const dateObj = typeof date === 'string' || typeof date === 'number'
            ? new Date(date)
            : date;

        if (isNaN(dateObj.getTime())) return '-';

        const datePart = dateObj.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        const timePart = dateObj.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        return `${datePart} ${timePart}`;
    } catch {
        return '-';
    }
}

/**
 * Format date with day name for displays (e.g., "Sat, 18/01/2026")
 * @param date - Date object, ISO string, or timestamp
 * @returns Formatted date with weekday
 */
export function formatDateWithDayKE(date: Date | string | number | undefined | null): string {
    if (!date) return '-';

    try {
        const dateObj = typeof date === 'string' || typeof date === 'number'
            ? new Date(date)
            : date;

        if (isNaN(dateObj.getTime())) return '-';

        return dateObj.toLocaleDateString('en-GB', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch {
        return '-';
    }
}

/**
 * Format date with month name for friendly displays (e.g., "18 Jan 2026")
 * @param date - Date object, ISO string, or timestamp  
 * @returns Formatted date with month name
 */
export function formatDateLongKE(date: Date | string | number | undefined | null): string {
    if (!date) return '-';

    try {
        const dateObj = typeof date === 'string' || typeof date === 'number'
            ? new Date(date)
            : date;

        if (isNaN(dateObj.getTime())) return '-';

        return dateObj.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    } catch {
        return '-';
    }
}

/**
 * Format date with full weekday and month (e.g., "Saturday, 18 January 2026")
 * @param date - Date object, ISO string, or timestamp
 * @returns Full formatted date
 */
export function formatDateFullKE(date: Date | string | number | undefined | null): string {
    if (!date) return '-';

    try {
        const dateObj = typeof date === 'string' || typeof date === 'number'
            ? new Date(date)
            : date;

        if (isNaN(dateObj.getTime())) return '-';

        return dateObj.toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    } catch {
        return '-';
    }
}

/**
 * Get short weekday name (e.g., "Sat")
 * @param date - Date object, ISO string, or timestamp
 * @returns Short weekday name
 */
export function getWeekdayShort(date: Date | string | number | undefined | null): string {
    if (!date) return '-';

    try {
        const dateObj = typeof date === 'string' || typeof date === 'number'
            ? new Date(date)
            : date;

        if (isNaN(dateObj.getTime())) return '-';

        return dateObj.toLocaleDateString('en-GB', { weekday: 'short' });
    } catch {
        return '-';
    }
}

/**
 * Format month and year only (e.g., "January 2026")
 * @param date - Date object, ISO string, or timestamp
 * @returns Month and year string
 */
export function formatMonthYearKE(date: Date | string | number | undefined | null): string {
    if (!date) return '-';

    try {
        const dateObj = typeof date === 'string' || typeof date === 'number'
            ? new Date(date)
            : date;

        if (isNaN(dateObj.getTime())) return '-';

        return dateObj.toLocaleDateString('en-GB', {
            month: 'long',
            year: 'numeric'
        });
    } catch {
        return '-';
    }
}

export default {
    formatDateKE,
    formatDateTimeKE,
    formatDateWithDayKE,
    formatDateLongKE,
    formatDateFullKE,
    getWeekdayShort,
    formatMonthYearKE
};
