import React, { useCallback } from 'react';
import { GameState } from '../types';

interface CommandProps {
    stateRef: React.MutableRefObject<GameState>;
    setState: React.Dispatch<React.SetStateAction<GameState>>;
    handleAction: (action: string) => void;
    addLog: (message: string, type?: any) => void;
}

/**
 * 命令处理 Hook
 * 负责解析终端输入的字符串命令并映射到相应的动作。
 */
export function useGameCommands({
    stateRef,
    setState,
    handleAction,
    addLog
}: CommandProps) {
    const handleCommand = useCallback((cmd: string) => {
        const parts = cmd.toLowerCase().trim().split(/\s+/);
        const base = parts[0];

        if (!base) return;

        // 系统帮助
        if (base === 'help' || base === '?') {
            addLog("--- AVAILABLE COMMANDS ---", 'info');
            addLog("STATUS: 查看机体与避难所状态");
            addLog("MOVE [ZONE]: 移动至 CORE / ENGINEERING / REC_ROOM");
            addLog("USE [ITEM]: 使用 RATIONS / WATER / MEDKIT");
            addLog("SCAVENGE: 执行当前区域搜刮");
            addLog("SLEEP: 进入休眠 (仅限 CORE)");
            addLog("CLEAR: 清除终端日志");
            return;
        }

        if (base === 'clear') {
            setState(prev => ({ ...prev, logs: [] }));
            return;
        }

        if (base === 'status') {
            const s = stateRef.current;
            addLog("--- BIO_METRIC STATUS ---", 'sys');
            addLog(`HUNGER: ${Math.floor(s.player.hunger)}% | THIRST: ${Math.floor(s.player.thirst)}%`);
            addLog(`SYNC: ${Math.floor(s.player.sanity)}% | HEALTH: ${Math.floor(s.player.health)}%`);
            addLog(`BUNKER INTEGRITY: ${Math.floor(s.bunker.integrity)}%`);
            return;
        }

        // 移动命令映射
        if (base === 'move') {
            const zone = parts[1]?.toUpperCase();
            if (['CORE', 'ENGINEERING', 'REC_ROOM'].includes(zone)) {
                handleAction(`move_${zone}`);
            } else {
                addLog(`未知区域: ${zone || 'NULL'}`, 'warn');
            }
            return;
        }

        // 使用物品命令映射
        if (base === 'use') {
            const item = parts[1];
            if (item === 'rations' || item === 'rat') handleAction('eat');
            else if (item === 'water' || item === 'wat') handleAction('drink');
            else if (item === 'medkit' || item === 'med') handleAction('heal');
            else addLog(`未知物品: ${item}`, 'warn');
            return;
        }

        if (base === 'scavenge') {
            if (stateRef.current.currentZone === 'CORE') handleAction('scavenge_drone');
            else handleAction('scavenge_manual');
            return;
        }

        if (base === 'sleep') {
            if (stateRef.current.currentZone === 'CORE') handleAction('sleep');
            else addLog("警告: 只能在 CORE 安全区进行休眠。", 'warn');
            return;
        }

        // 默认回退：尝试作为原始动作字符串执行
        handleAction(cmd);
    }, [handleAction, addLog, setState, stateRef]);

    return { handleCommand };
}
