export enum EventInitiator {
  WORKER_LED = 'WORKER_LED',
  BOSS_LED = 'BOSS_LED',
  OTHER = 'OTHER',
}

export enum EventInitiatorFilter {
  WORKER_LED = EventInitiator.WORKER_LED,
  BOSS_LED = EventInitiator.BOSS_LED,
  OTHER = EventInitiator.OTHER,
  ALL = 'ALL',
}
