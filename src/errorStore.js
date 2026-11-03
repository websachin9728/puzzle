// Tiny store so a global (async / non-render) JS error can be surfaced on screen.
let current = null;
let listeners = [];

export function reportError(e) {
  current = e;
  listeners.slice().forEach((l) => {
    try {
      l(e);
    } catch (_) {}
  });
}

export function getError() {
  return current;
}

export function subscribe(l) {
  listeners.push(l);
  return () => {
    listeners = listeners.filter((x) => x !== l);
  };
}
