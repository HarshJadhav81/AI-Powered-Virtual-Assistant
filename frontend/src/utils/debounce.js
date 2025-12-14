/**
 * Debounce Utility
 * Delays function execution until after a specified wait time
 * Useful for optimizing scroll updates and other frequent operations
 */

export function debounce(func, wait = 100) {
    let timeout;

    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export default debounce;
