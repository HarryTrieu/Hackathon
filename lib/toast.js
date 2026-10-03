"use client";

// Small confirmations ("Request sent", "Link copied") in one style, from
// anywhere: toast("Saved"). Shown by <Toaster /> in the layout, so they
// survive moving to another page. Errors stay next to the thing that failed.
const listeners = new Set();
let toasts = [];
let nextId = 1;

function emit() {
  for (const cb of listeners) cb();
}

export function toast(message, { tone = "success", duration = 3200 } = {}) {
  const id = nextId++;
  toasts = [...toasts.slice(-2), { id, message, tone }];
  emit();
  setTimeout(() => dismissToast(id), duration);
  return id;
}

export function dismissToast(id) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function subscribeToasts(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export const getToasts = () => toasts;
