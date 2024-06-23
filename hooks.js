import { useCallback } from 'react';
import debounce from 'lodash/debounce';

export function useDebouncedCallback(callback, delay) {
  const debouncedFn = useCallback(debounce(callback, delay), [callback, delay]);
  return [debouncedFn];
}