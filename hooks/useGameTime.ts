import React, { useCallback } from 'react';
import { GameState } from '../types';
import { audio } from '../services/audio';
import { pickRandomEvent } from '../services/events';

interface TimeProps {
    setState: React.Dispatch<React.SetStateAction<GameState>>;
    addLog: (message: string, type?: any) => void;
    updateWeather: (hours: number, state: GameState) => Partial<GameState>;
    triggerDamageFx: () => void;
}

/**
 * 时间流逝逻辑 Hook
 * 仅包含 passTime 的核心计算逻辑，不包含定时器。
 */
export function useGameTime({
    setState,
    addLog,
    updateWeather,
    triggerDamageFx
}: TimeProps) {

    const passTime = useCallback((hoursToPass: number) => {
        setState(prev => {
            const prevTime = prev.time.hour;
            const newHour = prev.time.hour + hoursToPass;
            const newTotalHours = prev.time.totalHours + hoursToPass;
            let newDay = prev.time.day;

            if (Math.floor(newHour / 24) > Math.floor(prevTime / 24)) {
                addLog(`=== CYCLE_LOG: DAY ${Math.floor(newHour / 24) + 1} ===`, 'sys');
                newDay++;
            }

            const weatherUpdates = updateWeather(hoursToPass, prev);
            const currentWeather = weatherUpdates.weather || prev.weather;

            let newLockdownTimer = prev.doorLockdownTimer;
            if (newLockdownTimer > 0) {
                newLockdownTimer = Math.max(0, newLockdownTimer - hoursToPass);
                if (newLockdownTimer === 0 && prev.doorLockdownTimer > 0) {
                    audio.door();
                    addLog("隔离解除。CORE 气密门允许通行。", 'success');
                }
            }

            const p = { ...prev.player };
            const fatigueMultiplier = p.fatigue < 30 ? 1.5 : 1.0;

            p.hunger = Math.max(0, p.hunger - (1.4 * hoursToPass * fatigueMultiplier));
            p.thirst = Math.max(0, p.thirst - (2.1 * hoursToPass * fatigueMultiplier));
            p.fatigue = Math.max(0, p.fatigue - (3.5 * hoursToPass));

            let sanChange = prev.currentZone === 'CORE' ? -1.0 * hoursToPass : -3.0 * hoursToPass;
            if (prev.bunker.power <= 20) sanChange -= 3.0 * hoursToPass;
            if (prev.bunker.airQuality < 50) sanChange -= 2.0 * hoursToPass;
            if (prev.zoneThreat > 80) sanChange -= 4.0 * hoursToPass;
            if (currentWeather === 'RAD_SURGE') sanChange -= 5.0 * hoursToPass;
            p.sanity = Math.max(0, Math.min(100, p.sanity + sanChange));

            const b = { ...prev.bunker };
            const powerSaving = Math.min(0.5, prev.research.powerGrid * 0.1);
            let pwrDrain = b.generatorBroken ? 0 : (0.8 * hoursToPass) * (1 - powerSaving);
            let o2Drain = 0.6 * hoursToPass;

            if (prev.upgrades.hydroponics) o2Drain -= 0.4 * hoursToPass;
            if (currentWeather === 'EMP_PULSE') pwrDrain *= 5.0;
            if (currentWeather === 'TOXIC_STORM') o2Drain *= 3.0;

            b.power = Math.max(0, b.power - pwrDrain);
            b.airQuality = Math.max(0, b.airQuality - o2Drain);

            if (b.generatorBroken) {
                b.power = Math.max(0, b.power - 1.5 * hoursToPass);
            }

            let newZoneThreat = prev.zoneThreat;
            if (prev.currentZone !== 'CORE') {
                const hullPenalty = b.integrity < 50 ? 2 : 1;
                const threatGainMod = Math.max(0.4, 1 - (prev.research.bioRadar * 0.15));
                let threatInc = 5 * hoursToPass * hullPenalty * threatGainMod;
                if (currentWeather === 'RAD_SURGE') threatInc *= 2.0;
                newZoneThreat = Math.min(100, newZoneThreat + threatInc);

                let dmgChance = Math.min(1.0, (newZoneThreat / 120) * hoursToPass);
                if (currentWeather === 'TOXIC_STORM') dmgChance = Math.min(1.0, dmgChance * 1.5);

                if (newZoneThreat > 60 && Math.random() < dmgChance) {
                    const damage = Math.floor(Math.random() * 20) + 10;
                    p.health = Math.max(0, p.health - damage);
                    const integrityDmg = Math.max(2, 10 - (prev.research.nanoRepair * 2));
                    if (Math.random() > 0.5) b.integrity = Math.max(0, b.integrity - integrityDmg);
                    addLog(`[BREACH] 变异体突破防线！VITL -${damage}`, 'danger');
                    triggerDamageFx();
                }
            } else {
                newZoneThreat = Math.max(0, newZoneThreat - (25 * hoursToPass));
            }

            if (!b.generatorBroken && prev.time.totalHours > 48 && Math.random() < 0.005 * hoursToPass) {
                b.generatorBroken = true;
                addLog("警告：发电机宕机。", "danger");
                triggerDamageFx();
            }

            const inv = { ...prev.inventory };
            const upg = { ...prev.upgrades };
            let activeEvent = prev.activeEvent;

            if (!activeEvent && Math.random() < 0.05 * hoursToPass) {
                const newEvt = pickRandomEvent(prev);
                if (newEvt) {
                    activeEvent = newEvt;
                    addLog(`>>> [外部信号]: ${newEvt.title} <<<`, 'warn');
                    audio.process();
                }
            }

            if (upg.autoTurret && newZoneThreat > 20 && b.power > 5 && currentWeather !== 'EMP_PULSE') {
                if (Math.random() < 0.3) {
                    b.power -= 1;
                    newZoneThreat = Math.max(0, newZoneThreat - 20);
                    addLog("炮塔自动开火。", "info");
                    audio.gunfire();
                }
            }

            let currentEffects = [...prev.effects];
            let effectStats: Partial<GameState> = {};

            currentEffects = currentEffects.map(eff => ({ ...eff, duration: eff.duration - hoursToPass })).filter(eff => {
                if (eff.duration <= 0) {
                    addLog(`效果消失: ${eff.name}`, 'info');
                    return false;
                }
                if (eff.onTick) {
                    const updates = eff.onTick({ ...prev, ...effectStats });
                    effectStats = { ...effectStats, ...updates };
                }
                return true;
            });

            return {
                ...prev,
                ...effectStats,
                player: p,
                bunker: b,
                inventory: inv,
                time: { day: newDay, hour: newHour, totalHours: newTotalHours },
                weather: currentWeather,
                weatherTimer: weatherUpdates.weatherTimer ?? prev.weatherTimer,
                doorLockdownTimer: newLockdownTimer,
                zoneThreat: newZoneThreat,
                activeEvent,
                effects: currentEffects,
            };
        });
    }, [setState, addLog, updateWeather, triggerDamageFx]);

    return { passTime };
}
