import { audio } from '../services/audio';
import { GameState, WEATHER_TYPES } from '../types';
import { Skull, RocketLaunch, Files, ShieldCheck, Broadcast } from '@phosphor-icons/react';
import { useMemo } from 'react';

interface EndProps {
  state: GameState;
  onReset: () => void;
}

/**
 * 游戏结束界面组件
 * 处理“胜利 (VICTORY)”与“终止 (TERMINATED)”两种极端视觉状态
 */
export default function End({ state, onReset }: EndProps) {
  const isVictory = state.status === 'VICTORY';
  const reason = state.logs.length > 0 ? state.logs[state.logs.length - 1].message : "未知原因";

  // 固定存档 ID，避免重渲染变化
  const archiveId = useMemo(() => `BK-#${Math.random().toString(36).substr(2, 6).toUpperCase()}`, []);

  return (
    <div className={`absolute inset-0 z-50 flex flex-col p-2 md:p-4 transition-all duration-1000 border-[6px] overflow-hidden font-mono ${isVictory
        ? 'bg-blue-950/20 border-blue-900/50'
        : 'bg-red-950/20 border-red-900/50 screen-flicker'
      }`}>
      {/* 动态背景装饰 */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bar-bg"></div>
        <div className="absolute inset-0 tv-static opacity-30"></div>
        {isVictory && <div className="absolute inset-0 bg-blue-500/5 animate-pulse"></div>}
      </div>

      <div className={`cyber-panel flex-1 w-full flex flex-col relative overflow-hidden backdrop-blur-xl ${isVictory ? 'border-blue-500/30' : 'border-red-600/30 glitching-light'
        }`}>
        <EndHeader isVictory={isVictory} archiveId={archiveId} />

        <div className="flex-1 flex flex-col lg:flex-row relative z-10 overflow-hidden">
          <ResultVisualSection isVictory={isVictory} reason={reason} />
          <StatsPanel state={state} isVictory={isVictory} onReset={onReset} />
        </div>

        <VisualFooter isVictory={isVictory} />
      </div>
    </div>
  );
}

// --- 内部子组件 ---

/** 顶部状态栏 */
function EndHeader({ isVictory, archiveId }: { isVictory: boolean; archiveId: string }) {
  return (
    <div className={`flex items-center justify-between px-6 py-2 border-b backdrop-blur-md relative z-20 ${isVictory ? 'border-blue-500/20 bg-blue-500/5' : 'border-red-500/20 bg-red-500/5'
      }`}>
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full animate-pulse ${isVictory ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`}></div>
        <span className={`text-[10px] tracking-[0.4em] uppercase font-bold ${isVictory ? 'text-blue-400' : 'text-red-400'}`}>
          会话 {isVictory ? '成功完成' : '异常终止'}
        </span>
      </div>
      <div className="text-[10px] tracking-[0.2em] text-zinc-500 uppercase font-mono">存档 ID: {archiveId}</div>
    </div>
  );
}

/** 视觉结果展示区 */
function ResultVisualSection({ isVictory, reason }: { isVictory: boolean; reason: string }) {
  return (
    <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-20 text-center border-b lg:border-b-0 lg:border-r border-zinc-800/50 relative overflow-hidden">
      {/* 背景动态图标 */}
      <div className={`absolute opacity-[0.03] scale-[3] pointer-events-none ${isVictory ? 'text-blue-500' : 'text-red-500'}`}>
        {isVictory ? <RocketLaunch weight="fill" /> : <Skull weight="fill" />}
      </div>

      <div className={`text-8xl md:text-9xl mb-10 transition-transform duration-1000 ${isVictory
          ? 'text-blue-500 drop-shadow-[0_0_50px_rgba(59,130,246,0.6)] scale-110'
          : 'text-red-600 drop-shadow-[0_0_50px_rgba(220,38,38,0.6)] glitching-extreme'
        }`}>
        {isVictory ? <RocketLaunch weight="duotone" /> : <Skull weight="duotone" />}
      </div>

      <h1 className={`text-6xl md:text-8xl font-black tracking-[0.3em] mb-6 leading-none ${isVictory ? 'text-blue-500 text-glow' : 'text-red-600 text-glow-red'
        }`}>
        {isVictory ? '胜利' : '系统终止'}
      </h1>

      <div className={`px-8 py-4 border backdrop-blur-md uppercase tracking-[0.3em] font-bold text-sm transition-all duration-500 ${isVictory
          ? 'border-blue-500/40 text-blue-400 bg-blue-500/5'
          : 'border-red-900/50 text-red-500 bg-red-950/20'
        }`}>
        &gt; {reason}
      </div>
    </div>
  );
}

/** 数据统计与操作面板 */
function StatsPanel({ state, isVictory, onReset }: { state: GameState; isVictory: boolean; onReset: () => void }) {
  const stats = [
    { label: '生存时长', value: `${state.time.day}d ${Math.floor(state.time.hour % 24)}h`, color: 'text-green-500', icon: <Broadcast /> },
    { label: '信号解析', value: `${state.bunker.signal.toFixed(1)}%`, color: 'text-blue-400', icon: <ShieldCheck /> },
    { label: '最终天气', value: WEATHER_TYPES[state.weather].name, color: 'text-yellow-500' },
    { label: '最后位置', value: state.currentZone, color: 'text-red-500' },
  ];

  return (
    <div className="w-full lg:w-[450px] flex flex-col bg-black/60 backdrop-blur-md p-8 md:p-12 justify-center border-t lg:border-t-0 lg:border-l border-zinc-800/50">
      <div className="space-y-8">
        <div className="border-l-2 border-zinc-700 pl-6 space-y-6">
          <p className="text-xs text-zinc-500 flex items-center gap-2 tracking-[0.2em] mb-4">
            <Files weight="bold" /> 会话诊断报告
          </p>

          <div className="space-y-4">
            {stats.map((stat, i) => (
              <div key={i} className="flex justify-between items-end group/item border-b border-zinc-900 pb-2">
                <span className="text-zinc-500 text-[10px] tracking-widest group-hover/item:text-zinc-400 transition-colors uppercase">
                  // {stat.label}
                </span>
                <span className={`${stat.color} font-black text-lg text-glow tracking-tighter`}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-10">
          <button
            onClick={onReset}
            onMouseEnter={() => audio.uiHover()}
            className={`w-full py-5 border uppercase font-black tracking-[0.4em] cursor-pointer transition-all relative overflow-hidden group/btn ${isVictory
                ? 'btn-cyber-blue text-blue-400 hover:text-white'
                : 'btn-cyber-danger text-red-500 hover:text-white'
              }`}
          >
            <span className="relative z-10">
              {isVictory ? '[ 重新部署 ]' : '[ 记忆擦除 ]'}
            </span>
          </button>
          <p className="mt-4 text-center text-[9px] text-zinc-600 tracking-[0.4em] uppercase animate-pulse">
            {isVictory ? 'Standard Relaunch Protocol' : 'Permanent Data Deletion Protocol'}
          </p>
        </div>
      </div>
    </div>
  );
}

/** 底部视觉装饰 */
function VisualFooter({ isVictory }: { isVictory: boolean }) {
  return (
    <div className={`h-1.5 w-full relative overflow-hidden shrink-0 ${isVictory ? 'bg-blue-500/20' : 'bg-red-500/20'}`}>
      <div className={`absolute inset-0 translate-x-[-100%] animate-[scanline-move_3s_linear_infinite] ${isVictory ? 'bg-blue-400/60' : 'bg-red-400/60'
        }`}></div>
    </div>
  );
}
