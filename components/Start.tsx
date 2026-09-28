import { audio } from '../services/audio';
import { useState, useEffect } from 'react';

interface StartProps {
  onStart: () => void;
}

/**
 * 启动界面组件
 * 采用赛博朋克风格（Bunker 101 视觉系统）
 */
export default function Start({ onStart }: StartProps) {
  return (
    <div className="absolute inset-0 z-50 bg-[#010201] flex flex-col p-2 md:p-4 transition-all duration-700 border-[6px] border-zinc-950 overflow-hidden selection:bg-green-900 selection:text-white font-mono">
      <BackgroundDecorations />

      <div className="cyber-panel flex-1 w-full flex flex-col relative overflow-hidden border-green-500/20 shadow-[inset_0_0_100px_rgba(0,0,0,1)] group">
        <StatusHeader />

        <div className="flex-1 flex flex-col lg:flex-row relative z-10 overflow-hidden">
          <HeroSection />
          <SidebarDiagnostics onStart={onStart} />
        </div>

        <BottomStatusIndicator />
      </div>

      <div className="absolute inset-0 pointer-events-none opacity-20 scanline-bar"></div>
    </div>
  );
}

// --- 内部子组件 ---

/** 背景装饰层 */
function BackgroundDecorations() {
  return (
    <div className="absolute inset-0 opacity-10 pointer-events-none">
      <div className="absolute inset-0 bar-bg"></div>
      <div className="absolute inset-0 tv-static opacity-40"></div>
      {/* 边界发光 */}
      <div className="absolute top-0 w-full h-px bg-green-500/20"></div>
      <div className="absolute bottom-0 w-full h-px bg-green-500/20"></div>
      <div className="absolute left-0 h-full w-px bg-green-500/20"></div>
      <div className="absolute right-0 h-full w-px bg-green-500/20"></div>
    </div>
  );
}

/** 顶部状态条 */
function StatusHeader() {
  return (
    <div className="flex items-center justify-between px-6 py-2 border-b border-green-500/20 bg-green-500/5 backdrop-blur-sm relative z-20">
      <div className="flex items-center gap-4">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-green-500/30 rounded-full"></div>
          <div className="w-2 h-2 bg-green-500/10 rounded-full"></div>
        </div>
        <span className="text-[10px] tracking-[0.4em] text-green-500/60 uppercase">系统状态: 运行正常</span>
      </div>
      <div className="text-[10px] tracking-[0.2em] text-green-500/40 uppercase">加密链路 // 避难所 101</div>
    </div>
  );
}

/** 核心标题区域 */
function HeroSection() {
  return (
    <div className="flex-1 flex flex-col justify-center p-8 md:p-16 lg:p-24 border-b lg:border-b-0 lg:border-r border-green-500/10">
      <div className="space-y-4">
        <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-green-500 tracking-[0.2em] text-glow leading-none">
          BUNKER <span className="text-zinc-800 transition-colors group-hover:text-zinc-700">101</span>
        </h1>
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-green-500/50 to-transparent"></div>
          <div className="text-xs text-green-400/50 tracking-[0.6em] uppercase animate-pulse">v6.0 导演剪辑版</div>
        </div>
      </div>

      <div className="mt-12 max-w-xl">
        <div className="flex items-start gap-4 text-green-500/90 text-sm md:text-base leading-relaxed tracking-wide bg-black/40 p-6 border border-green-900/20 backdrop-blur-md relative overflow-hidden group/text">
          <div className="absolute left-0 top-0 w-1 h-full bg-green-500/20 group-hover/text:bg-green-500/50 transition-colors"></div>
          <div className="text-green-500/40 font-bold shrink-0 mt-1 select-none">&gt;</div>
          <p className="text-zinc-400 italic">
            你被遗留在此。外部充斥着辐射尘与不可名状的异变体。维持生命体征，收集废料与电子元件，武装你的避难所。
            <span className="text-green-500 font-bold ml-2 text-glow">解密求救信号是你唯一的出路。</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/** 右侧诊断与操作面板 */
function SidebarDiagnostics({ onStart }: { onStart: () => void }) {
  const [visibleLogs, setVisibleLogs] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleLogs(prev => (prev < 3 ? prev + 1 : prev));
    }, 400);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full lg:w-[400px] flex flex-col bg-black/40 backdrop-blur-md p-8 justify-center border-t lg:border-t-0 lg:border-l border-green-500/5">
      <div className="space-y-6">
        {/* 动态日志 */}
        <div className="space-y-2 font-mono text-xs">
          {visibleLogs >= 1 && <p className="text-green-500/60 animate-text-reveal">&gt; 初始化引导程序...</p>}
          {visibleLogs >= 2 && <p className="text-green-500/60 animate-text-reveal">&gt; 同步神经链路... <span className="text-green-400 font-bold">成功</span></p>}
          {visibleLogs >= 3 && <p className="text-green-500/40 animate-text-reveal">&gt; 环境辐射等级: <span className="text-yellow-500">稳定</span></p>}
        </div>

        {/* 紧急通报 */}
        <div className="p-4 border border-red-900/40 bg-red-950/10 text-red-500/80 text-xs leading-relaxed data-flicker">
          <div className="font-bold mb-1">[ 紧急警告 ]</div>
          &gt; 孤独会侵蚀你的理智。避难所内部环境往往比外部世界更加致命。
        </div>

        {/* 启动按钮 */}
        <div className="pt-8">
          <button
            onClick={onStart}
            onMouseEnter={() => audio.uiHover()}
            className="btn-cyber-premium w-full py-6 text-green-400 text-xl tracking-[0.4em] font-black uppercase cursor-pointer group/btn relative overflow-hidden"
          >
            <span className="relative z-10 group-hover/btn:text-white transition-colors duration-300">
              [ 连接神经网络 ]
            </span>
          </button>

          <div className="mt-4 flex justify-between px-2 text-[9px] text-green-500/30 tracking-widest uppercase font-bold">
            <span>仅限授权人员</span>
            <span>Bit-ID: 7X-092-A</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 底部装饰条 */
function BottomStatusIndicator() {
  return (
    <div className="h-2 w-full bg-zinc-950 relative overflow-hidden shrink-0">
      <div className="absolute top-0 left-0 h-full w-1/3 bg-green-500/20 blur-sm animate-[scanline-move_4s_linear_infinite]"></div>
      <div className="absolute top-0 left-0 h-full w-full flex justify-between px-4 items-center">
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className={`w-0.5 h-0.5 rounded-full ${i % 5 === 0 ? 'bg-green-500/40' : 'bg-green-500/10'}`}></div>
        ))}
      </div>
    </div>
  );
}
