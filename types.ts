export type WeatherType = 'NORMAL' | 'TOXIC_STORM' | 'RAD_SURGE' | 'EMP_PULSE';

export interface WeatherInfo {
  name: string;
  desc: string;
  color: string;
  effect: string;
}

export interface PlayerState {
  hunger: number;
  thirst: number;
  sanity: number;
  fatigue: number;
  health: number;
}

export interface BunkerState {
  power: number;
  airQuality: number;
  signal: number;
  integrity: number;
  generatorBroken: boolean;
}

export interface InventoryState {
  rations: number;
  water: number;
  medkits: number;
  scrap: number;
  parts: number;
}

export interface UpgradesState {
  waterFilter: boolean;
  antenna: number;
  autoTurret: boolean;
  hydroponics: boolean;
}

export interface TimeState {
  day: number;
  hour: number;
  totalHours: number;
}

export type GameStatus = 'START_SCREEN' | 'PLAYING' | 'GAME_OVER' | 'VICTORY';
export type ViewMode = 'STATIONARY' | 'DRONE';
export type Zone = 'CORE' | 'REC_ROOM' | 'ENGINEERING';

export interface LogEntry {
  id: string;
  message: string;
  type: 'normal' | 'danger' | 'info' | 'sys' | 'warn' | 'success';
  time: string;
}

export interface ResearchState {
  nanoRepair: number; // 纳米维护：降低完整度流失
  powerGrid: number;  // 改进电网：降低所有设备功耗
  bioRadar: number;   // 生物雷达：提前感知高威胁，降低伏击概率
  commsArray: number; // 复合通信：提升信号解析速度
}

export interface EventOption {
  label: string;
  action: string;
  cost?: string;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  options: EventOption[];
}

export interface EffectState {
  id: string;
  name: string;
  duration: number; // 剩余小时
  onTick?: (state: GameState) => Partial<GameState>;
}

export interface GameState {
  player: PlayerState;
  bunker: BunkerState;
  inventory: InventoryState;
  upgrades: UpgradesState;
  research: ResearchState;
  time: TimeState;
  weather: WeatherType;
  weatherTimer: number;
  status: GameStatus;
  viewMode: ViewMode;
  logs: LogEntry[];
  currentZone: Zone;
  doorLockdownTimer: number;
  zoneThreat: number;
  activeEvent: GameEvent | null; // 当前触发的可交互事件
  effects: EffectState[]; // 持续性效果
  lastActionTime: number; // 上次动作的时间戳
}

export const WEATHER_TYPES: Record<WeatherType, WeatherInfo> = {
  NORMAL: { name: 'NORMAL', desc: '正常', color: 'text-zinc-400', effect: '无' },
  TOXIC_STORM: { name: 'TOXIC STORM', desc: '毒霾风暴', color: 'text-teal-400', effect: 'O2 消耗剧增，外部伤害增加' },
  RAD_SURGE: { name: 'RAD SURGE', desc: '辐射狂潮', color: 'text-yellow-500', effect: '理智流失极快，变异体异常暴躁' },
  EMP_PULSE: { name: 'EMP PULSE', desc: '电磁脉冲', color: 'text-cyan-400', effect: '电力极速枯竭，无法解码信号' }
};
