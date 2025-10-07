/**
 * Animation Utilities
 * Reusable animation configurations and helpers
 */

import { ANIMATION } from './constants.js';

/**
 * Check if user prefers reduced motion
 * @returns {boolean}
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get animation duration based on user preferences
 * @param {number} duration - Default duration in ms
 * @returns {number} Duration in ms (0 if reduced motion preferred)
 */
export function getAnimationDuration(duration) {
  return prefersReducedMotion() ? ANIMATION.REDUCED_MOTION_DURATION : duration;
}

/**
 * Create minimize animation keyframes - scale down in place
 * @returns {Keyframe[]} Animation keyframes
 */
export function getMinimizeKeyframes() {
  return [
    {
      transform: 'scale(1)',
      opacity: 1,
      transformOrigin: 'center center',
      offset: 0
    },
    {
      transform: `scale(${ANIMATION.SCALE_TARGET})`,
      opacity: 0,
      transformOrigin: 'center center',
      offset: 1
    }
  ];
}

/**
 * Create restore animation keyframes - scale up in place
 * @returns {Keyframe[]} Animation keyframes
 */
export function getRestoreKeyframes() {
  return [
    {
      transform: `scale(${ANIMATION.SCALE_TARGET})`,
      opacity: 0,
      transformOrigin: 'center center',
      offset: 0
    },
    {
      transform: 'scale(1)',
      opacity: 1,
      transformOrigin: 'center center',
      offset: 1
    }
  ];
}

/**
 * Get minimize animation options
 * @returns {KeyframeAnimationOptions}
 */
export function getMinimizeAnimationOptions() {
  return {
    duration: getAnimationDuration(ANIMATION.WINDOW_MINIMIZE_DURATION),
    easing: ANIMATION.WINDOW_MINIMIZE_EASING,
    fill: 'forwards'
  };
}

/**
 * Get restore animation options
 * @returns {KeyframeAnimationOptions}
 */
export function getRestoreAnimationOptions() {
  return {
    duration: getAnimationDuration(ANIMATION.WINDOW_RESTORE_DURATION),
    easing: ANIMATION.WINDOW_RESTORE_EASING,
    fill: 'forwards'
  };
}
