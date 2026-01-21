export enum ActionInitiator {
  WORKER_LED = 'WORKER_LED',
  BOSS_LED = 'BOSS_LED',
  OTHER = 'OTHER',
}

export enum ActionInitiatorFilter {
  WORKER_LED = ActionInitiator.WORKER_LED,
  BOSS_LED = ActionInitiator.BOSS_LED,
  OTHER = ActionInitiator.OTHER,
  ALL = 'ALL',
}
