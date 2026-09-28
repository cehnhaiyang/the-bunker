import React, { useCallback } from 'react';
import { GameState, LogEntry } from '../types';

/**
 * 日志系统 Hook
 * 负责向游戏终端添加带有时间戳和样式的日志。
 */
export function useGameLog(setState: React.Dispatch<React.SetStateAction<GameState>>) {
    const addLog = useCallback((message: string, type: LogEntry['type'] = 'normal') => {
        setState(prev => {
            const formattedHour = Math.floor(prev.time.hour % 24).toString().padStart(2, '0');
            const formattedMin = Math.floor((prev.time.hour % 1) * 60).toString().padStart(2, '0');

            let finalMessage = message;

            // 理智值较低时的视觉干扰/幻觉逻辑
            if (prev.player.sanity <= 15 && Math.random() > 0.8) {
                const madness = [
                    "它在墙壁里爬行...",
                    "门外根本没有救援。",
                    "把皮剥下来就不冷了。",
                    "血。到处都是血。",
                    "系统撒谎了。"
                ];
                finalMessage = madness[Math.floor(Math.random() * madness.length)];
                type = 'danger';
            } else if (prev.player.sanity < 40 && Math.random() > 0.6) {
                // 字符乱码模拟
                finalMessage = finalMessage.split('').map(c =>
                    (c === ' ' || Math.random() > 0.15)
                        ? c
                        : '!<>-_\\/[]{}—=+*^?#_▓▒░'[Math.floor(Math.random() * 20)]
                ).join('');
            }

            const newLog: LogEntry = {
                id: `log - ${Date.now()} -${Math.random()} `,
                message: finalMessage,
                type,
                time: `${formattedHour}:${formattedMin} `
            };

            const newLogs = [...prev.logs, newLog];
            // 限制日志条数，保持性能
            if (newLogs.length > 60) newLogs.shift();

            return { ...prev, logs: newLogs };
        });
    }, [setState]);

    return { addLog };
}
