import { useSyncExternalStore } from "react";
import { LEADS as INITIAL, type Lead } from "./mockData";

let leads: Lead[] = INITIAL;
let revision = 0;
const listeners = new Set<() => void>();

function emit() {
  revision++;
  listeners.forEach((l) => l());
}

export const leadsStore = {
  getAll: () => leads,
  getRevision: () => revision,
  add: (newOnes: Lead[]) => {
    leads = [...newOnes, ...leads];
    emit();
  },
  replace: (next: Lead[]) => {
    leads = next;
    emit();
  },
  reset: () => {
    leads = INITIAL;
    emit();
  },
  subscribe: (fn: () => void) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};

export function useLeads(): Lead[] {
  return useSyncExternalStore(
    leadsStore.subscribe,
    leadsStore.getAll,
    () => INITIAL,
  );
}
