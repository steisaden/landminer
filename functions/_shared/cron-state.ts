export let bgSyncCount = 0;
export let bgSyncLastRun: string | null = null;

export function noteCronRun(runTime = new Date().toISOString()) {
  bgSyncCount = Math.floor(Math.random() * 5) + 1;
  bgSyncLastRun = runTime;
}

export function readCronState() {
  const state = { count: bgSyncCount, lastRun: bgSyncLastRun };
  bgSyncCount = 0;
  return state;
}
