import { useEffect, useCallback } from 'react';
import { useGameState, INITIAL_STATE } from './useGameState';
import { useGameLog } from './useGameLog';
import { useGameMechanics } from './useGameMechanics';
import { useGameTime } from './useGameTime';
import { useGameActions } from './useGameActions';
import { useGameCommands } from './useGameCommands';
import { audio } from '../services/audio';

/**
 * 上帝 Hook: useGame
 * 统一协调所有子挂钩，作为游戏引擎的唯一入口。
 */
export function useGame() {
    // 1. 核心状态
    const { state, setState, stateRef } = useGameState();

    // 2. 日志系统
    const { addLog } = useGameLog(setState);

    // 3. 游戏机制 (天气、检查、受损特效等)
    const {
        triggerDamageFx,
        checkStatus,
        updateWeather
    } = useGameMechanics(setState, addLog);

    // 4. 时间流逝逻辑
    const { passTime } = useGameTime({
        setState,
        addLog,
        updateWeather,
        triggerDamageFx
    });

    // 5. 动作系统
    const {
        isProcessing,
        processingText,
        processingProgress,
        handleAction
    } = useGameActions({
        state,
        setState,
        addLog,
        passTime,
        triggerDamageFx
    });

    // 6. 命令系统
    const { handleCommand } = useGameCommands({
        stateRef,
        setState,
        handleAction,
        addLog
    });

    // 7. 游戏主循环 (定时器)
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (state.status === 'PLAYING' && !isProcessing) {
            interval = setInterval(() => {
                passTime(0.05); // 每秒流逝 0.05 小时
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [state.status, isProcessing, passTime]);

    // 8. 游戏状态检查 (死亡/胜利)
    useEffect(() => {
        if (state.status === 'PLAYING') {
            checkStatus(state);
        }
    }, [state, checkStatus]);

    // 9. 游戏控制接口
    const startGame = useCallback(() => {
        audio.init();
        audio.confirm();
        setState({ ...INITIAL_STATE, status: 'PLAYING' });
        setTimeout(() => {
            addLog("SURVIVAL OS v6.0 神经直连完成。系统接管。", 'sys');
            addLog("PROTOCOL: 收集资源。升级模块。解密信号。活下去。");
        }, 800);
    }, [addLog, setState]);

    const resetGame = useCallback(() => {
        audio.confirm();
        setState({ ...INITIAL_STATE, status: 'PLAYING' });
        addLog("=== MEMORY_PURGED. SYSTEM_REBOOT... ===", 'sys');
    }, [addLog, setState]);

    return {
        state,
        isProcessing,
        processingText,
        processingProgress,
        handleAction,
        handleCommand,
        startGame,
        resetGame,
        addLog
    };
}

export default useGame;
