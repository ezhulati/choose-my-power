// Simplified Web Vitals module for local hosting to avoid CSP violations
// This module provides basic Core Web Vitals metrics without external dependencies

export function getCLS(callback) {
  let clsValue = 0;
  let clsEntries = [];
  let sessionValue = 0;
  let sessionEntries = [];

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) {
        const firstSessionEntry = sessionEntries[0];
        const lastSessionEntry = sessionEntries[sessionEntries.length - 1];
        
        if (sessionValue && entry.startTime - lastSessionEntry.startTime < 1000 && 
            entry.startTime - firstSessionEntry.startTime < 5000) {
          sessionValue += entry.value;
          sessionEntries.push(entry);
        } else {
          sessionValue = entry.value;
          sessionEntries = [entry];
        }
        
        if (sessionValue > clsValue) {
          clsValue = sessionValue;
          clsEntries = [...sessionEntries];
          callback({
            value: clsValue,
            entries: clsEntries,
            name: 'CLS',
            id: 'CLS'
          });
        }
      }
    }
  });

  if (typeof PerformanceObserver === 'function' && 
      PerformanceObserver.supportedEntryTypes.includes('layout-shift')) {
    observer.observe({ type: 'layout-shift', buffered: true });
  }
}

export function getFID(callback) {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      callback({
        value: entry.processingStart - entry.startTime,
        entries: [entry],
        name: 'FID',
        id: 'FID'
      });
    }
  });

  if (typeof PerformanceObserver === 'function' && 
      PerformanceObserver.supportedEntryTypes.includes('first-input')) {
    observer.observe({ type: 'first-input', buffered: true });
  }
}

export function getFCP(callback) {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        callback({
          value: entry.startTime,
          entries: [entry],
          name: 'FCP',
          id: 'FCP'
        });
      }
    }
  });

  if (typeof PerformanceObserver === 'function' && 
      PerformanceObserver.supportedEntryTypes.includes('paint')) {
    observer.observe({ type: 'paint', buffered: true });
  }
}

export function getLCP(callback) {
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    callback({
      value: lastEntry.startTime,
      entries: [lastEntry],
      name: 'LCP',
      id: 'LCP'
    });
  });

  if (typeof PerformanceObserver === 'function' && 
      PerformanceObserver.supportedEntryTypes.includes('largest-contentful-paint')) {
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  }
}

export function getTTFB(callback) {
  const navEntry = performance.getEntriesByType('navigation')[0];
  if (navEntry) {
    callback({
      value: navEntry.responseStart,
      entries: [navEntry],
      name: 'TTFB',
      id: 'TTFB'
    });
  }
}