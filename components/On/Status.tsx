import React, { ReactNode } from 'react';
import { GameState } from '../../types';
import { Hamburger, Drop, Brain, Lightning, Heartbeat, BatteryFull, Wind, Shield, Pulse } from '@phosphor-icons/react';
import clsx from 'clsx';

interface StatusProps {
  state: GameState;
}

export default function Status({ state }: StatusProps) {
  const { player, bunker } = state;
  const isHallucinating = player.sanity < 25;

  return (
    <div className={clsx(
      "cyber-panel p-5 bg-[#060806] relative group/status overflow-hidden transition-all duration-500",
      player.health < 25 && "extreme-threat-mode"
    )}>
      {/* Dynamic Background Effects */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.05)_0%,transparent_70%)] pointer-events-none group-hover/status:opacity-100 opacity-50 transition-opacity"></div>

      <div className="flex items-center justify-between mb-6 pb-2 border-b border-zinc-800/80 relative">
        <h1 className="text-[11px] font-black tracking-[0.3em] text-green-500 flex items-center gap-2 text-glow uppercase italic">
          <Pulse className="animate-pulse text-lg" weight="bold" />
          <span className="data-flicker">Bio_Telemetry & System_Sync</span>
        </h1>
        <div className="flex gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-800"></div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 gap-x-5 gap-y-4 px-1">
          <StatBar label="NUTR" value={player.hunger} icon={<Hamburger weight="bold" />} color="green" sanity={player.sanity} />
          <StatBar label="PWR" value={bunker.power} icon={<BatteryFull weight="bold" />} color="cyan" sanity={player.sanity} />
          <StatBar label="HYDR" value={player.thirst} icon={<Drop weight="bold" />} color="blue" sanity={player.sanity} />
          <StatBar label="O2" value={bunker.airQuality} icon={<Wind weight="bold" />} color="teal" sanity={player.sanity} />
          <StatBar label="SYNC" value={player.sanity} icon={<Brain weight="bold" />} color="purple" sanity={player.sanity} critical />
          <StatBar label="HULL" value={bunker.integrity} icon={<Shield weight="bold" />} color="zinc" sanity={player.sanity} />
          <StatBar label="STAM" value={player.fatigue} icon={<Lightning weight="bold" />} color="yellow" sanity={player.sanity} />
          <StatBar label="VITL" value={player.health} icon={<Heartbeat weight="bold" />} color="red" sanity={player.sanity} critical />
        </div>
      </div>
    </div>
  );
}

interface StatBarProps {
  label: string;
  value: number;
  icon: ReactNode;
  color: 'green' | 'blue' | 'purple' | 'yellow' | 'red' | 'zinc' | 'cyan' | 'teal';
  sanity?: number;
  critical?: boolean;
}

function StatBar({ label, value, icon, color, sanity = 100, critical }: StatBarProps) {
  const isLow = value <= 30;
  const isCrit = value <= 15;
  const isHallucinating = sanity < 25 && Math.random() > 0.65;

  const colors = {
    green: { text: 'text-green-500', bg: 'bg-green-500', glow: 'shadow-[0_0_12px_rgba(34,197,94,0.4)]' },
    blue: { text: 'text-blue-500', bg: 'bg-blue-500', glow: 'shadow-[0_0_12px_rgba(59,130,246,0.4)]' },
    purple: { text: 'text-purple-500', bg: 'bg-purple-500', glow: 'shadow-[0_0_12px_rgba(168,85,247,0.4)]' },
    yellow: { text: 'text-yellow-500', bg: 'bg-yellow-500', glow: 'shadow-[0_0_12px_rgba(234,179,8,0.4)]' },
    red: { text: 'text-red-500', bg: 'bg-red-500', glow: 'shadow-[0_0_12px_rgba(239,68,68,0.4)]' },
    zinc: { text: 'text-zinc-400', bg: 'bg-zinc-400', glow: 'shadow-[0_0_12px_rgba(161,161,170,0.4)]' },
    cyan: { text: 'text-cyan-400', bg: 'bg-cyan-400', glow: 'shadow-[0_0_12px_rgba(34,211,238,0.4)]' },
    teal: { text: 'text-teal-400', bg: 'bg-teal-400', glow: 'shadow-[0_0_12px_rgba(45,212,191,0.4)]' },
  };

  let theme = colors[color];
  if (isLow) theme = colors.red;

  const displayValue = isHallucinating ? (['ERR', '99', '??', 'VOID'][Math.floor(Math.random() * 4)]) : Math.floor(value);

  return (
    <div className="flex flex-col gap-1.5 group/stat">
      <div className="flex items-center justify-between px-0.5">
        <div className={clsx(
          "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors",
          isHallucinating ? "text-red-500 chromatic-aberration" : (isLow ? "text-red-500" : "text-zinc-500 group-hover/stat:text-white")
        )}>
          <span className={clsx(theme.text, "group-hover/stat:scale-110 transition-transform")}>{icon}</span>
          <span className={isHallucinating ? "line-through opacity-50" : ""}>{label}</span>
        </div>
        <span className={clsx(
          "font-mono text-[11px] font-black tracking-tighter",
          isLow ? "text-red-500 animate-pulse text-glow-red" : theme.text
        )}>
          {displayValue}{!isHallucinating && '%'}
        </span>
      </div>

      <div className="h-2 bg-black border border-zinc-800/80 relative overflow-hidden rounded-full p-[1px]">
        <div className="absolute inset-0 bar-bg opacity-30"></div>
        <div
          className={clsx(
            "h-full rounded-full transition-all duration-700 ease-out relative",
            theme.bg,
            theme.glow,
            (isCrit || isHallucinating) && "animate-pulse"
          )}
          style={{ width: `${Math.max(2, isHallucinating ? Math.random() * 100 : value)}% ` }}
        >
          {/* Inner Highlight */}
          <div className="absolute inset-0 bg-white/20 h-1/2 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}


