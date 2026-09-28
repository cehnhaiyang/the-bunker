import { GameEvent, GameState } from '../types';

export const EVENTS: GameEvent[] = [
    {
        id: 'stranger_at_door',
        title: '生还者门铃？',
        description: '外层监视器捕捉到一个穿着破烂动力箱的人正在猛敲 Core 的气密门。他看起来快要断气了，手里紧握着一个医疗包。你是否要开启第一道减压阀让他进入外廊？',
        options: [
            { label: '开启泄压阀 (入舱)', action: 'event_choice_stranger_accept', cost: 'RISK: THREAT' },
            { label: '保持封锁 (无视)', action: 'event_choice_stranger_ignore', cost: 'LOSS: SYNC' }
        ]
    },
    {
        id: 'strange_broadcast',
        title: '远古广播',
        description: '你的通信控制台跳出了一段未加密的音频：一架失踪已久的货运无人机正在附近的废墟中循环播放紧急迫降坐标。那坐标就在 REC ROOM 附近。',
        options: [
            { label: '标记坐标', action: 'event_choice_broadcast_mark', cost: 'BUFF: LOOT+' },
            { label: '这是陷阱', action: 'event_choice_broadcast_ignore', cost: 'NONE' }
        ]
    },
    {
        id: 'system_glitch_core',
        title: '系统核心悖论',
        description: '避难所的主控 AI 开始循环播放你的个人加密日志，并声称检测到舱内有未授权生命体（就在你身后）。这可能是严重的硬件故障，或者是某种认知干扰。',
        options: [
            { label: '强行重置 AI', action: 'event_choice_glitch_reset', cost: 'PWR / SYNC' },
            { label: '回头检查...', action: 'event_choice_glitch_check', cost: 'SYNC / HEALTH' }
        ]
    }
];

export function pickRandomEvent(state: GameState): GameEvent | null {
    // Only trigger if no event is active
    if (state.activeEvent) return null;

    // 5% chance per game hour (approx)
    if (Math.random() > 0.05) return null;

    // Filter events based on conditions (optional)
    const available = EVENTS.filter(e => {
        if (e.id === 'stranger_at_door' && state.currentZone !== 'CORE') return false;
        return true;
    });

    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
}
