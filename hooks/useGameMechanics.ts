import React, { useCallback } from 'react';
import { GameState, WeatherType } from '../types';
import { audio } from '../services/audio';

/**
 * 游戏核心机制 Hook
 * 负责天气更新、死亡检查、音效触发及视觉反馈。
 */
export function useGameMechanics(
    setState: React.Dispatch<React.SetStateAction<GameState>>,
    addLog: (message: string, type?: any) => void
) {
    // 视觉反馈：受损闪烁
    const triggerDamageFx = useCallback(() => {
        const el = document.getElementById('damage-overlay');
        if (el) {
            el.classList.remove('hidden');
            el.classList.remove('damage-flash-anim');
            void el.offsetWidth; // 触发重绘
            el.classList.add('damage-flash-anim');
        }
        document.body.classList.add('glitching-extreme');
        setTimeout(() => document.body.classList.remove('glitching-extreme'), 300);
        audio.error();
        audio.bang();
    }, []);

    // 游戏结束处理
    const endGame = useCallback((reason: string, title: string, victory = false) => {
        setState(prev => ({ ...prev, status: victory ? 'VICTORY' : 'GAME_OVER' }));
        if (victory) audio.win(); else audio.death();
    }, [setState]);

    // 状态检查：判断是否达成赢/输条件
    const checkStatus = useCallback((currentState: GameState) => {
        if (currentState.bunker.signal >= 100) return endGame("加密信号解析完毕。救援队已突破云层。你得救了。", "破晓与救援", true);
        if (currentState.player.hunger <= 0) return endGame("长期缺乏合成口粮，机体消化系统开始溶解自身。", "机体衰竭 (NUTR_FAIL)");
        if (currentState.player.thirst <= 0) return endGame("严重脱水导致血液粘稠，心脏不堪重负。", "严重脱水 (HYDR_FAIL)");
        if (currentState.player.sanity <= 0) return endGame("幻听变成了现实。你在狂笑中迎接了它们。", "神经崩溃 (SYNC_FAIL)");
        if (currentState.player.health <= 0) return endGame("生锈的防护服未能挡住撕咬，生命迹象消失。", "生命体征归零 (VITL_FAIL)");
        if (currentState.bunker.airQuality <= 0) return endGame("过滤系统停机。剧毒孢子灌入，肺部瞬间纤维化。", "毒气窒息 (O2_FAIL)");
        if (currentState.bunker.integrity <= 0) return endGame("避难所的顶层混凝土轰然坍塌。", "结构崩溃 (HULL_FAIL)");
    }, [endGame]);

    // 天气系统更新
    const updateWeather = useCallback((hours: number, currentState: GameState): Partial<GameState> => {
        let { weather, weatherTimer } = currentState;
        weatherTimer -= hours;

        if (weatherTimer <= 0) {
            const r = Math.random();
            let newWeather: WeatherType = 'NORMAL';
            if (r < 0.15) newWeather = 'TOXIC_STORM';
            else if (r < 0.25) newWeather = 'RAD_SURGE';
            else if (r < 0.35) newWeather = 'EMP_PULSE';

            if (newWeather !== weather) {
                weather = newWeather;
                weatherTimer = 8 + Math.random() * 16;

                if (newWeather === 'NORMAL') addLog("气象雷达显示外部环境趋于稳定。", "sys");
                else if (newWeather === 'TOXIC_STORM') addLog("警告：检测到高浓度腐蚀性气体风暴逼近。", "warn");
                else if (newWeather === 'RAD_SURGE') {
                    addLog("危急：伽马辐射激增！理智流失增加。", "danger");
                    audio.geiger();
                }
                else if (newWeather === 'EMP_PULSE') {
                    addLog("系统故障：遭遇电磁脉冲。电力大量流失。", "danger");
                    audio.elecSpark();
                    triggerDamageFx();
                }
            }
        }
        return { weather, weatherTimer };
    }, [addLog, triggerDamageFx]);

    return {
        triggerDamageFx,
        endGame,
        checkStatus,
        updateWeather
    };
}
