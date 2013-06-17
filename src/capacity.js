/* exported DEFAULT_CAPACITY, LOAD_FACTOR, MAX_CAPACITY, pow2AtLeast,
    clampCapacity */
/**
 * Get the closest next power of two of the given integer
 * or the number itself if it is a power of two.
 *
 * @param {number} n Must be greater than zero.
 * @return {number} The power of two integer.
 *
 */
function pow2AtLeast( n ) {
    n = n >>> 0;
    n = n - 1;
    n = n | (n >> 1);
    n = n | (n >> 2);
    n = n | (n >> 4);
    n = n | (n >> 8);
    n = n | (n >> 16);
    return n + 1;
}

/**
 * Forces the capacity integer to be in the sane range.
 *
 * @param {int} capacity The capacity integer to sanitize.
 * @return {int} The sanitized capacity.
 *
 */
function clampCapacity( capacity ) {
    return Math.max( DEFAULT_CAPACITY, Math.min( MAX_CAPACITY, capacity ) );
}

var DEFAULT_CAPACITY = 1 << 4;
var MAX_CAPACITY = 1 << 30;
var LOAD_FACTOR = 0.67;