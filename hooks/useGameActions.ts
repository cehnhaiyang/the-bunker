import React, { useState, useCallback } from 'react';
import { GameState, Zone, ResearchState } from '../types';
import { audio } from '../services/audio';

interface ActionProps {
    state: GameState;
    setState: React.Dispatch<React.SetStateAction<GameState>>;
    addLog: (message: string, type?: any) => void;
    passTime: (hours: number) => void;
    triggerDamageFx: () => void;
}

/**
 * 玩家动作 Hook
 * 处理所有主动触发的操作，如移动、搜刮、建造及研究。
 */
export function useGameActions({
    state,
    setState,
    addLog,
    passTime,
    triggerDamageFx
}: ActionProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingText, setProcessingText] = useState('');
    const [processingProgress, setProcessingProgress] = useState(0);

    const executeActionWithProgress = useCallback((durationMs: number, text: string, onComplete: () => void) => {
        setIsProcessing(true);
        setProcessingText(text);
        setProcessingProgress(0);

        const fatigueMultiplier = state.player.fatigue <= 30 ? 1.6 : 1.0;
        const finalDurationMs = durationMs * fatigueMultiplier;

        const start = Date.now();
        const tick = () => {
            const elapsed = Date.now() - start;
            const percent = Math.min(100, (elapsed / finalDurationMs) * 100);
            setProcessingProgress(percent);

            if (percent < 100) {
                requestAnimationFrame(tick);
            } else {
                setIsProcessing(false);
                onComplete();
            }
        };
        requestAnimationFrame(tick);
    }, [state.player.fatigue]);

    const handleAction = useCallback((action: string) => {
        if (state.status !== 'PLAYING' || isProcessing) return;

        // 移动逻辑
        if (action.startsWith('move_')) {
            const targetZone = action.replace('move_', '') as Zone;
            if (state.currentZone === 'CORE' && targetZone !== 'CORE') {
                audio.door();
                addLog(`离开 CORE。进入 ${targetZone}。气密门已强制上锁 4 小时。`, 'warn');
                setState(prev => ({ ...prev, currentZone: targetZone, doorLockdownTimer: 4, zoneThreat: 10 }));
                passTime(0.5);
                return;
            }
            if (targetZone === 'CORE') {
                audio.door();
                addLog("返回 CORE 核心区。生命维持系统接管。", 'success');
                setState(prev => ({ ...prev, currentZone: 'CORE', zoneThreat: 0 }));
                passTime(0.5);
                return;
            }
            audio.droneStart();
            addLog(`在阴影中转移至 ${targetZone}...`, 'info');
            setState(prev => ({
                ...prev,
                currentZone: targetZone,
                zoneThreat: Math.max(15, prev.zoneThreat - 15),
                player: { ...prev.player, fatigue: prev.player.fatigue - 8 }
            }));
            passTime(1.0);
            return;
        }

        // 事件选择处理
        if (action.startsWith('event_choice_')) {
            const choice = action.replace('event_choice_', '');
            setState(prev => {
                const p = { ...prev.player };
                const b = { ...prev.bunker };
                const inv = { ...prev.inventory };

                if (choice === 'stranger_accept') {
                    inv.medkits += 1;
                    addLog("你让那名生还者进入了卸压舱。但他很快死去了，且吸引了更多变异体...", "warn");
                    return { ...prev, inventory: inv, zoneThreat: Math.min(100, prev.zoneThreat + 30), activeEvent: null };
                }
                if (choice === 'stranger_ignore') {
                    addLog("那张绝望的脸在你脑海中挥之不去。(SYNC -20)", "danger");
                    p.sanity = Math.max(0, p.sanity - 20);
                    return { ...prev, player: p, activeEvent: null };
                }
                if (choice === 'broadcast_mark') {
                    addLog("坐标已同步至采集清单。(SCRAP +2)", "success");
                    inv.scrap += 2;
                    return { ...prev, inventory: inv, activeEvent: null };
                }
                if (choice === 'glitch_reset') {
                    b.power = Math.max(0, b.power - 5);
                    p.sanity = Math.max(0, p.sanity - 10);
                    addLog("系统紧急重启。那些低语消失了。(PWR -5, SYNC -10)", "info");
                    return { ...prev, bunker: b, player: p, activeEvent: null };
                }
                if (choice === 'glitch_check') {
                    addLog("阴影中只有蠕动的线缆...(HEALTH -10, SYNC -15)", "danger");
                    p.health = Math.max(0, p.health - 10);
                    p.sanity = Math.max(0, p.sanity - 15);
                    triggerDamageFx();
                    return { ...prev, player: p, activeEvent: null };
                }

                return { ...prev, activeEvent: null };
            });
            audio.confirm();
            return;
        }

        // 研究逻辑
        if (action.startsWith('research_')) {
            const researchKey = action.replace('research_', '') as keyof ResearchState;
            audio.process();
            addLog(`正在提交资源以推进 [${String(researchKey).toUpperCase()}] 研究计划...`, 'info');
            executeActionWithProgress(3000, "RESEARCHING...", () => {
                setState(prev => {
                    const inv = { ...prev.inventory };
                    const res = { ...prev.research };
                    if (inv.parts >= 1 && inv.scrap >= 3) {
                        inv.parts -= 1;
                        inv.scrap -= 3;
                        res[researchKey] += 1;
                        addLog(`研究成功。${String(researchKey)} 等级提升至 Lv.${res[researchKey]}。`, 'success');
                    } else {
                        addLog("资源不足，研究失败。", 'danger');
                    }
                    return { ...prev, inventory: inv, research: res, player: { ...prev.player, fatigue: prev.player.fatigue - 15 } };
                });
                passTime(2);
            });
            return;
        }

        // 基础生存动作
        switch (action) {
            case 'eat':
                audio.confirm();
                setState(prev => ({ ...prev, inventory: { ...prev.inventory, rations: prev.inventory.rations - 1 }, player: { ...prev.player, hunger: Math.min(100, prev.player.hunger + 35) } }));
                addLog("摄入配给。类似机油的口感。");
                passTime(0.2);
                break;
            case 'drink':
                audio.confirm();
                setState(prev => ({ ...prev, inventory: { ...prev.inventory, water: prev.inventory.water - 1 }, player: { ...prev.player, thirst: Math.min(100, prev.player.thirst + 40) } }));
                addLog("饮用净水。略带铁锈味。");
                passTime(0.2);
                break;
            case 'heal':
                audio.confirm();
                setState(prev => ({ ...prev, inventory: { ...prev.inventory, medkits: prev.inventory.medkits - 1 }, player: { ...prev.player, health: Math.min(100, prev.player.health + 50) } }));
                addLog("注射凝血剂与纳米修复液。", 'success');
                passTime(0.5);
                break;
            case 'sleep':
                audio.click();
                addLog("注入镇静剂。休眠舱盖闭合...");
                executeActionWithProgress(2000, "HIBERNATING...", () => {
                    setState(prev => ({ ...prev, player: { ...prev.player, fatigue: 100, sanity: Math.min(100, prev.player.sanity + 20) } }));
                    addLog("深度休眠结束。机体机能恢复。", 'info');
                    passTime(8);
                });
                break;
            case 'scavenge_drone':
                audio.droneStart();
                setState(prev => ({ ...prev, viewMode: 'DRONE' }));
                addLog("建立远程无人机链接...", 'info');
                executeActionWithProgress(3500, "REMOTE_SCAVENGING...", () => {
                    setState(prev => {
                        const inv = { ...prev.inventory };
                        const loot = [];
                        if (Math.random() > 0.2) { inv.scrap += Math.floor(Math.random() * 3) + 1; loot.push("SCRAP"); }
                        if (Math.random() > 0.7) { inv.rations += 1; loot.push("RATION"); }
                        if (Math.random() > 0.8) { inv.parts += 1; loot.push("PARTS"); }
                        if (loot.length > 0) addLog(`遥控回收成功。获得: ${loot.join(', ')}`, 'success');
                        else addLog("一无所获。", 'warn');
                        return { ...prev, inventory: inv, viewMode: 'STATIONARY', bunker: { ...prev.bunker, power: prev.bunker.power - 10 } };
                    });
                    passTime(1.5);
                });
                break;
            case 'decrypt':
                audio.process();
                executeActionWithProgress(2500, "DECRYPTING_SIGNAL...", () => {
                    setState(prev => {
                        const decryptBoost = 1 + (prev.research.commsArray * 0.25);
                        const progress = ((Math.random() * 8 + 4) + (prev.upgrades.antenna * 4.0)) * decryptBoost;
                        addLog(`捕获高频波段。解密进度 +${progress.toFixed(1)}%`, 'success');
                        return {
                            ...prev,
                            bunker: { ...prev.bunker, signal: Math.min(100, prev.bunker.signal + progress), power: prev.bunker.power - 8 },
                            player: { ...prev.player, fatigue: prev.player.fatigue - 12 }
                        };
                    });
                    passTime(2);
                });
                break;
            case 'harvest_hydro':
                audio.process();
                addLog("启动紫外线催熟灯管并注入净水...", 'info');
                executeActionWithProgress(2000, "HARVESTING...", () => {
                    setState(prev => ({
                        ...prev,
                        inventory: { ...prev.inventory, water: prev.inventory.water - 1, rations: prev.inventory.rations + 3 },
                        bunker: { ...prev.bunker, power: prev.bunker.power - 5 }
                    }));
                    addLog(`收割完毕。获得高能培养藻块。`, 'success');
                    passTime(2);
                });
                break;
            case 'scavenge_manual':
                audio.process();
                addLog("在区域杂物中翻找...", 'info');
                executeActionWithProgress(2000, "MANUAL_SCAVENGE...", () => {
                    setState(prev => {
                        const inv = { ...prev.inventory };
                        const r = Math.random();
                        let isDangerousZone = prev.currentZone === 'REC_ROOM';

                        if (r < (isDangerousZone ? 0.6 : 0.4)) {
                            const gain = isDangerousZone ? Math.floor(Math.random() * 2) + 2 : 2;
                            inv.scrap += gain;
                            addLog(`找到一些可用的钢材。(SCRAP +${gain})`, "success");
                        }
                        else if (r < (isDangerousZone ? 0.75 : 0.55)) {
                            inv.medkits++;
                            addLog("未开封的抗凝血清！", "success");
                        }
                        else if (r < (isDangerousZone ? 0.90 : 0.65)) {
                            inv.parts++;
                            addLog("从坏掉的终端里拆出芯片。(PARTS +1)", "success");
                        }
                        else { addLog("只找到几根人骨。", "warn"); }

                        return {
                            ...prev,
                            inventory: inv,
                            player: { ...prev.player, fatigue: prev.player.fatigue - (isDangerousZone ? 20 : 15) },
                            zoneThreat: Math.min(100, prev.zoneThreat + (isDangerousZone ? 30 : 20))
                        };
                    });
                    passTime(1.5);
                });
                break;
            case 'repair_generator':
                audio.process();
                addLog("更换主轴承部件...", 'warn');
                executeActionWithProgress(4500, "REPAIRING_GEN...", () => {
                    setState(prev => ({
                        ...prev,
                        inventory: { ...prev.inventory, parts: prev.inventory.parts - 1, scrap: prev.inventory.scrap - 3 },
                        bunker: { ...prev.bunker, generatorBroken: false, power: Math.min(100, prev.bunker.power + 25) },
                        player: { ...prev.player, fatigue: prev.player.fatigue - 25, health: prev.player.health - 10 }
                    }));
                    addLog("主发电机功恢复正常。", 'success');
                    passTime(3.5);
                });
                break;
            case 'craft_parts':
                audio.process();
                addLog("提炼精密元件...", 'info');
                executeActionWithProgress(2000, "CRAFTING...", () => {
                    setState(prev => ({
                        ...prev,
                        inventory: { ...prev.inventory, scrap: prev.inventory.scrap - 3, parts: prev.inventory.parts + 1 },
                        player: { ...prev.player, fatigue: prev.player.fatigue - 10 }
                    }));
                    addLog(`提炼成功。(PARTS +1)`, 'success');
                    passTime(2);
                });
                break;
            case 'upgrade_antenna':
                audio.process();
                addLog("布线天线列阵...", 'info');
                executeActionWithProgress(3000, "UPGRADING_ANTENNA...", () => {
                    setState(prev => ({
                        ...prev,
                        inventory: { ...prev.inventory, scrap: prev.inventory.scrap - 2, parts: prev.inventory.parts - 1 },
                        upgrades: { ...prev.upgrades, antenna: prev.upgrades.antenna + 1 },
                        player: { ...prev.player, fatigue: prev.player.fatigue - 15 }
                    }));
                    addLog(`天线升级成功。`, 'success');
                    passTime(3);
                });
                break;
            case 'upgrade_turret':
                audio.process();
                addLog("组装自动炮塔中...", 'info');
                executeActionWithProgress(4000, "ASSEMBLING_TURRET...", () => {
                    setState(prev => ({
                        ...prev,
                        inventory: { ...prev.inventory, scrap: prev.inventory.scrap - 6, parts: prev.inventory.parts - 3 },
                        upgrades: { ...prev.upgrades, autoTurret: true },
                        player: { ...prev.player, fatigue: prev.player.fatigue - 25 }
                    }));
                    addLog(`自动炮塔已部署。`, 'success');
                    passTime(5);
                });
                break;
            case 'listen_music':
                audio.click();
                executeActionWithProgress(1000, "SYNCING...", () => {
                    setState(prev => ({ ...prev, player: { ...prev.player, sanity: Math.min(100, prev.player.sanity + 15), fatigue: prev.player.fatigue - 5 } }));
                    addLog("老式磁带在咔哒声中播放。你感到片刻的宁静。", 'success');
                    passTime(1.0);
                });
                break;
            case 'distract':
                audio.bang();
                setState(prev => ({
                    ...prev,
                    inventory: { ...prev.inventory, rations: prev.inventory.rations - 1 },
                    zoneThreat: Math.max(0, prev.zoneThreat - 25)
                }));
                addLog("投掷引诱性食物。变异体的注意力被分散了。", 'info');
                passTime(0.5);
                break;
            case 'stealth_hide':
                audio.confirm();
                executeActionWithProgress(2000, "HIDING...", () => {
                    setState(prev => ({
                        ...prev,
                        zoneThreat: Math.max(0, prev.zoneThreat - 30),
                        player: { ...prev.player, fatigue: prev.player.fatigue - 20 }
                    }));
                    addLog("潜伏在阴影中，直到那股恶寒感消失。", 'info');
                    passTime(1.0);
                });
                break;
            case 'set_trap':
                audio.process();
                executeActionWithProgress(2000, "SETTING_TRAP...", () => {
                    setState(prev => ({
                        ...prev,
                        inventory: { ...prev.inventory, parts: prev.inventory.parts - 1, scrap: prev.inventory.scrap - 2 },
                        zoneThreat: Math.max(0, prev.zoneThreat - 40)
                    }));
                    addLog("部署简易电弧陷阱。区域防御增强。", 'success');
                    passTime(1.0);
                });
                break;
            case 'manual_refuel':
                audio.click();
                executeActionWithProgress(3000, "GENERATING_PWR...", () => {
                    setState(prev => ({
                        ...prev,
                        bunker: { ...prev.bunker, power: Math.min(100, prev.bunker.power + 15) },
                        player: { ...prev.player, fatigue: prev.player.fatigue - 25 }
                    }));
                    addLog("通过手动泵为备用电池充电。", 'info');
                    passTime(1.5);
                });
                break;
            case 'reinforce':
                audio.process();
                executeActionWithProgress(2500, "REINFORCING...", () => {
                    setState(prev => ({
                        ...prev,
                        inventory: { ...prev.inventory, scrap: prev.inventory.scrap - 2 },
                        bunker: { ...prev.bunker, integrity: Math.min(100, prev.bunker.integrity + 10) },
                        player: { ...prev.player, fatigue: prev.player.fatigue - 20 }
                    }));
                    addLog("焊接钢板修复结构损伤。(INTEG +10)", 'success');
                    passTime(2.0);
                });
                break;
            case 'upgrade_water':
                audio.process();
                executeActionWithProgress(4000, "INSTALLING_FILTER...", () => {
                    setState(prev => ({
                        ...prev,
                        inventory: { ...prev.inventory, parts: prev.inventory.parts - 1 },
                        upgrades: { ...prev.upgrades, waterFilter: true },
                        player: { ...prev.player, fatigue: prev.player.fatigue - 15 }
                    }));
                    addLog("净水循环模块安装完成。水消耗效率提升。", 'success');
                    passTime(3.0);
                });
                break;
        }
    }, [state.status, isProcessing, passTime, executeActionWithProgress, addLog, state.currentZone, state.upgrades.antenna]);

    return {
        isProcessing,
        processingText,
        processingProgress,
        handleAction
    };
}
