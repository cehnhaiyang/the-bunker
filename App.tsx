import { CloudRain, WarningOctagon, LockKey, Brain, Crosshair, Warning, ArrowRight, Skull, CircleNotch } from '@phosphor-icons/react';
import clsx from 'clsx';
import React, { useMemo } from 'react';
import { WEATHER_TYPES } from './types';
import { audio } from './services/audio';
import { useGame } from './hooks';
import Camera from './components/On/Camera';
import Terminal from './components/On/Terminal';
import Status from './components/On/Status';
import Action from './components/On/Action';
import Stat from './components/On/Stat';
import Start from './components/Start';
import End from './components/End';

/**
 * 地堡生存系统主程序
 * 采用完全扁平化的组件结构，所有系统渲染逻辑均由 App 组件直接承担
 */
export default function App() {
  const {
    state,
    handleAction,
    handleCommand,
    startGame,
    resetGame,
    isProcessing,
    processingText,
    processingProgress
  } = useGame();

  // --- 派生状态与渲染变量 ---

  const isPlaying = state.status === 'PLAYING';
  const isDead = state.status === 'GAME_OVER' || state.status === 'VICTORY';
  const showStart = state.status === 'START_SCREEN';
  const isCore = state.currentZone === 'CORE';
  const weatherInfo = WEATHER_TYPES[state.weather];
  const isHallucinating = state.player.sanity < 30;

  // 格式化时间显示
  const timeDisplay = useMemo(() => {
    const hours = Math.floor(state.time.hour % 24).toString().padStart(2, '0');
    const mins = Math.floor((state.time.hour % 1) * 60).toString().padStart(2, '0');
    return `${hours}:${mins}`;
  }, [state.time.hour]);

  return (
    <div className="w-screen h-screen bg-[#020302] text-green-500 font-mono overflow-hidden relative selection:bg-green-500/30 selection:text-white antialiased">

      {/* 1. 基础视觉特效层 (原 GameOverlay) */}
      <div className="crt-overlay fixed inset-0 z-[100] pointer-events-none opacity-30" />
      <div className="scanline-bar fixed top-0 left-0 w-full h-[10vh] z-[99] pointer-events-none" />
      <div
        id="damage-overlay"
        className={clsx(
          "absolute inset-0 z-[60] pointer-events-none mix-blend-screen bg-red-500/0 transition-all duration-300",
          state.player.health < 30 && "bg-red-500/10 opacity-100" // 联动低生命值效果
        )}
      />

      {/* 2. 场景切换逻辑 */}
      {showStart && <Start onStart={startGame} />}
      {isDead && <End state={state} onReset={resetGame} />}

      {/* 3. 核心游戏界面 */}
      {isPlaying && (
        <main className={clsx(
          "flex flex-col lg:flex-row h-full w-full p-0 gap-0 bg-[#010201] relative z-10 transition-all duration-1000 ease-in-out box-border overflow-hidden",
          state.player.sanity < 20 ? "sanity-critical" : (state.player.sanity < 45 ? "sanity-drain" : "")
        )}>

          {/* A. 左侧：监控与指令区 */}
          <section className="flex-1 lg:flex-[7.4] flex flex-col min-w-0 h-full gap-0 relative">

            {/* 顶层：监控画面与战术 HUD (原 HUD 逻辑内联) */}
            <div className="w-full relative flex-[6.1] min-h-[350px] bg-black overflow-hidden cyber-panel group border-b border-zinc-800/40 lg:border-r border-zinc-800/50">
              <Camera gameState={state} />

              {/* 战术抬头显示器 (HUD) */}
              <div className="absolute top-4 left-4 z-30 pointer-events-none select-none">
                <div className={clsx(
                  "px-4 py-2 border bg-black/85 backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.8)] relative transition-all duration-500",
                  isCore ? "border-green-500/30" : "border-red-500/60 bg-red-950/70 animate-pulse"
                )}>
                  <div className={clsx(
                    "absolute -left-[1px] top-1/2 -translate-y-1/2 w-[3px] h-2/3 transition-colors",
                    isCore ? "bg-green-500 shadow-[0_0_10px_#22c55e]" : "bg-red-500 shadow-[0_0_10px_#ef4444]"
                  )} />
                  <div className={clsx(
                    "font-mono text-[10px] uppercase font-bold tracking-[0.2em] flex items-center gap-2",
                    isCore ? "text-green-500 text-glow" : "text-red-500 text-glow-red",
                    isHallucinating && "animate-pulse italic"
                  )}>
                    <Crosshair className={clsx("text-sm", isHallucinating && "animate-spin")} />
                    <span>LOC // {isHallucinating && Math.random() > 0.82 ? "ERR_UNKNOWN" : state.currentZone.replace('_', ' ')}</span>
                  </div>
                  <div className="text-white font-mono font-black text-2xl tracking-tighter mt-1 text-shadow flex items-baseline gap-2">
                    <span className="text-xs text-zinc-400 font-normal">DAY {state.time.day}</span>
                    <span>{timeDisplay}</span>
                  </div>
                </div>

                <div className={clsx(
                  "mt-3 font-mono text-[10px] uppercase tracking-widest bg-black/70 px-3 py-1.5 inline-flex items-center gap-2 border transition-all",
                  weatherInfo.color,
                  state.weather !== 'NORMAL' ? `border-current animate-pulse bg-current/5` : 'border-white/10'
                )}>
                  <CloudRain weight="bold" />
                  <span className="opacity-60">ENV_SYSTEM //</span>
                  <span className="font-black">{weatherInfo.name}</span>
                </div>

                {!isCore && (
                  <div className="mt-6 w-52 bg-black/60 p-2.5 border border-red-900/40 backdrop-blur-sm">
                    <div className="text-red-500 font-mono text-[9px] font-black mb-2 flex items-center justify-between tracking-tighter">
                      <span className="flex items-center gap-2">
                        <WarningOctagon className="animate-ping text-xs" />
                        THREAT_INDEX
                      </span>
                      <span className="text-glow-red text-xs">{Math.floor(state.zoneThreat)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-950 border border-red-900/30 relative overflow-hidden">
                      <div className="absolute inset-0 bar-bg opacity-10" />
                      <div className="h-full bg-red-600 transition-all duration-700 shadow-[0_0_12px_#ef4444]" style={{ width: `${state.zoneThreat}%` }} />
                    </div>
                  </div>
                )}

                {state.doorLockdownTimer > 0 && (
                  <div className="mt-4 text-yellow-500 font-mono text-[11px] font-bold border border-yellow-600/40 bg-yellow-950/70 px-3 py-2 flex items-center gap-3 shadow-lg backdrop-blur">
                    <LockKey weight="fill" className="animate-pulse text-base" />
                    <span>CORE_LOCKDOWN: <span className="text-yellow-300 text-glow-warn font-black">{state.doorLockdownTimer.toFixed(1)}H</span></span>
                  </div>
                )}

                {isHallucinating && (
                  <div className="mt-4 flex flex-col gap-1 overflow-hidden">
                    <div className="text-red-500 font-black font-mono animate-pulse text-xs border-l-4 border-red-600 bg-red-950/50 px-4 py-2 uppercase tracking-[0.2em] shadow-xl">
                      <Brain className="mr-2 inline text-sm" />
                      SYNC_CRITICAL // HALLUCINATION_DETECTED
                    </div>
                  </div>
                )}
              </div>

              {/* 监控视觉层 */}
              {state.zoneThreat > 80 && <div className="absolute inset-0 z-20 bg-red-900/15 animate-pulse pointer-events-none mix-blend-color-dodge" />}
              <div className="absolute inset-0 tv-static opacity-[0.12] pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40 pointer-events-none" />

              {/* 无人机视角 UI (内联) */}
              {state.viewMode === 'DRONE' && (
                <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-6">
                  <div className="flex justify-between items-start">
                    <div className="border-t-2 border-l-2 border-white/20 w-8 h-8" />
                    <div className="flex flex-col items-end gap-3 translate-y-2">
                      <div className="flex items-center gap-3 text-red-500 font-mono text-[11px] bg-black/90 px-4 py-2 border border-red-900/50 shadow-2xl backdrop-blur-sm">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_12px_#ef4444]" />
                        <span className="font-black tracking-widest uppercase">Signal // Feed_Cam_09</span>
                      </div>
                    </div>
                    <div className="border-t-2 border-r-2 border-white/20 w-8 h-8" />
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="border-b-2 border-l-2 border-white/20 w-8 h-8" />
                    <div className="text-[10px] text-zinc-500 font-mono flex gap-6">
                      <span>FPS: 24.2</span>
                      <span>LAT: 12MS</span>
                    </div>
                    <div className="border-b-2 border-r-2 border-white/20 w-8 h-8" />
                  </div>
                </div>
              )}
            </div>

            {/* 下层：统计与终端 */}
            <div className="flex-[3.9] min-h-0 flex flex-col bg-black/20">
              <Stat state={state} onAction={handleAction} isProcessing={isProcessing} />
              <div className="flex-1 min-h-0 relative">
                <Terminal state={state} onCommand={handleCommand} />
              </div>
            </div>
          </section>

          {/* B. 右侧：地堡管理侧边栏 */}
          <aside className="lg:w-[440px] w-full flex flex-col gap-0 z-30 min-h-0 border-l border-zinc-800/60 bg-[#030403]">
            <div className="shrink-0"><Status state={state} /></div>
            <div className="flex-1 min-h-0 relative shadow-2xl overflow-hidden flex flex-col border-t border-zinc-800/40">

              {/* 处理中覆盖层 (原 ProcessingOverlay 内联) */}
              {isProcessing && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-lg z-[50] flex flex-col items-center justify-center p-12 border border-green-500/20">
                  <CircleNotch weight="bold" className="animate-spin text-green-500 text-5xl mb-6 text-glow-strong" />
                  <div className="text-green-400 font-mono text-sm mb-6 uppercase tracking-[0.5em] text-glow font-black border-y border-green-500/20 py-2">
                    {processingText}
                  </div>
                  <div className="w-full max-w-sm h-1.5 bg-zinc-950 border border-green-900/40 relative overflow-hidden rounded-full">
                    <div className="h-full bg-green-500 shadow-[0_0_20px_#22c55e] transition-all duration-200" style={{ width: `${processingProgress}%` }} />
                  </div>
                  <div className="mt-4 font-mono text-[10px] text-green-700 animate-pulse">
                    EXECUTING_LOW_LEVEL_PROTOCOL... {Math.floor(processingProgress)}%
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto custom-scrollbar bg-gradient-to-b from-[#050605] to-black">
                <Action state={state} onAction={handleAction} isProcessing={isProcessing} />
              </div>
            </div>
          </aside>
        </main>
      )}

      {/* 4. 全屏事件弹窗 (原 EventOverlay 逻辑内联) */}
      {state.activeEvent && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6 transition-all animate-in fade-in duration-500">
          <div className="max-w-xl w-full glass-panel border border-yellow-500/30 p-10 relative overflow-hidden shadow-[0_0_100px_rgba(234,179,8,0.1)]">
            {/* 装饰性背景 */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-yellow-500 to-transparent animate-pulse" />
            <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-yellow-500/5 rounded-full blur-[100px]" />

            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-yellow-500/10 rounded-sm border border-yellow-500/30">
                <Warning className="text-yellow-500 text-3xl animate-pulse" />
              </div>
              <div>
                <div className="text-[10px] text-yellow-500/60 font-mono tracking-[0.4em] mb-1">PRIORITY_OVERRIDE</div>
                <h2 className="text-2xl font-black text-yellow-500 tracking-[0.15em] uppercase italic">{state.activeEvent.title}</h2>
              </div>
            </div>
            <div className="bg-zinc-900/40 border-l-4 border-yellow-500/50 p-6 mb-10 shadow-inner">
              <p className="text-zinc-300 text-base leading-relaxed font-mono opacity-90 whitespace-pre-wrap selection:bg-yellow-500/30">{state.activeEvent.description}</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {state.activeEvent.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => { audio.confirm(); handleAction(opt.action); }}
                  onMouseEnter={() => audio.uiHover()}
                  className="group relative flex items-center justify-between p-5 bg-zinc-900/60 border border-zinc-700/50 hover:border-yellow-500/60 hover:bg-yellow-500/10 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-y-0 left-0 w-0 group-hover:w-1 bg-yellow-500/50 transition-all duration-300" />
                  <div className="flex flex-col relative z-10">
                    <span className="text-sm font-black text-zinc-100 uppercase tracking-widest flex items-center gap-3">
                      <ArrowRight weight="bold" className="text-yellow-500 group-hover:translate-x-2 transition-transform" />
                      {opt.label}
                    </span>
                    {opt.cost && (
                      <span className="text-[10px] text-zinc-500 font-mono mt-1.5 opacity-80 flex items-center gap-1">
                        <span className="w-1 h-1 bg-zinc-700" /> REQUIREMENT // {opt.cost}
                      </span>
                    )}
                  </div>
                  <Skull className="text-yellow-500/10 text-2xl group-hover:text-yellow-500/40 transition-colors" />
                </button>
              ))}
            </div>
            <div className="mt-10 pt-5 border-t border-white/5 flex justify-between items-center text-[9px] font-mono text-zinc-600 tracking-tighter">
              <span>REF_ID: {state.activeEvent.id}</span>
              <span className="animate-pulse">OS_WAITING_COMMAND...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
