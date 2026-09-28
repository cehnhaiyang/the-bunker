import { useState, useRef, useEffect } from 'react';
import { GameState } from '../types';

export const INITIAL_STATE: GameState = {
    player: { hunger: 100, thirst: 100, sanity: 100, fatigue: 100, health: 100 },
    bunker: { power: 100, airQuality: 100, signal: 0, integrity: 100, generatorBroken: false },
    inventory: { rations: 5, water: 5, medkits: 2, scrap: 5, parts: 1 },
    upgrades: { waterFilter: false, antenna: 0, autoTurret: false, hydroponics: false },
    research: { nanoRepair: 0, powerGrid: 0, bioRadar: 0, commsArray: 0 },
    time: { day: 1, hour: 8, totalHours: 0 },
    weather: 'NORMAL',
    weatherTimer: 0,
    status: 'START_SCREEN',
    viewMode: 'STATIONARY',
    logs: [],
    currentZone: 'CORE',
    doorLockdownTimer: 0,
    zoneThreat: 0,
    activeEvent: null,
    effects: [],
    lastActionTime: 0,
};

/**
 * 核心状态 Hook
 * 负责维护游戏的基础状态对象及其引用。
 */
export function useGameState() {
    const [state, setState] = useState<GameState>(INITIAL_STATE);

    // 使用 Ref 同步状态，以便在一些闭包逻辑（如命令处理）中获取最新值
    const stateRef = useRef(state);
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    return {
        state,
        setState,
        stateRef,
    };
}
