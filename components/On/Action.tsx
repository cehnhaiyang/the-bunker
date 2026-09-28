import React, { useState } from 'react';
import { GameState } from '../../types';
import { audio } from '../../services/audio';
import { Hamburger, Drop, FirstAidKit, Moon, VideoCamera, Radio, Plant, SpeakerHifi, Package, MagnifyingGlass, Ghost, BatteryCharging, Cpu, Wrench, Broadcast, DropHalfBottom, Crosshair, Door, DoorOpen, Clock, Lightning, Flask, ShieldCheck, Waveform, Skull, Warning } from '@phosphor-icons/react';
import clsx from 'clsx';

interface ActionProps {
  state: GameState;
  onAction: (action: string) => void;
  isProcessing: boolean;
}

export default function Action({ state, onAction, isProcessing }: ActionProps) {
  const handleWheel = (e: React.WheelEvent) => {
    const container = e.currentTarget;
    if (Math.abs(e.deltaY) > 0) {
      container.scrollLeft += e.deltaY;
    }
  };

  const Btn = ({ icon: Icon, label, cost, time, action, disabled, type = 'normal', className }: any) => {
    let displayLabel = label;
    let DisplayIcon = Icon;
    let isHallucinating = false;

    if (state.player.sanity < 25 && Math.random() > 0.75) {
      const creeps = ['开门迎接', '切开皮肤', '拥抱虚空', '全是假的', '终结痛苦', '加入它们', '腐烂', '谁在看你'];
      displayLabel = creeps[Math.floor(Math.random() * creeps.length)];
      DisplayIcon = Skull;
      isHallucinating = true;
    }

    const colorVariants: any = {
      normal: 'border-green-900/40 text-green-500 hover:border-green-400 hover:text-green-400',
      danger: 'border-red-900/40 text-red-500 hover:border-red-500 hover:text-red-400',
      tech: 'border-blue-900/40 text-blue-400 hover:border-blue-400 hover:text-blue-300',
      craft: 'border-yellow-900/40 text-yellow-500 hover:border-yellow-400 hover:text-yellow-400'
    };

    return (
      <button
        onClick={() => !disabled && !isProcessing && onAction(action)}
        onMouseEnter={() => !disabled && !isProcessing && audio.uiHover()}
        disabled={disabled || isProcessing}
        className={clsx(
          "group relative flex flex-col items-center justify-center p-3 border btn-cyber-premium transition-all duration-300",
          colorVariants[type] || colorVariants.normal,
          (disabled || isProcessing) && "opacity-30 cursor-not-allowed grayscale scale-95",
          isHallucinating && "animate-pulse chromatic-aberration",
          className
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
        <DisplayIcon weight="bold" className={clsx("text-xl mb-1.5 transition-transform group-hover:scale-125", isHallucinating && "text-red-600")} />
        <span className={clsx(
          "font-black text-[10px] uppercase tracking-widest mb-1 text-center w-full truncate px-1",
          isHallucinating && "text-glow-red"
        )}>
          {displayLabel}
        </span>
        <div className="flex items-center justify-center gap-2 w-full mt-1 border-t border-white/5 pt-1.5">
          <span className="text-[8px] font-mono opacity-60 flex items-center gap-1" dangerouslySetInnerHTML={{ __html: cost }} />
          <span className="text-zinc-700 font-mono text-[8px]">|</span>
          <span className="text-[8px] font-mono text-zinc-500 flex items-center gap-0.5">
            <Clock size={8} className="opacity-70" /> {time}
          </span>
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#050605] overflow-hidden">
      <div className="flex-1 relative overflow-hidden">
        <div className="flex flex-col h-full animate-text-reveal">
          {/* Row 1: Survival */}
          <div
            onWheel={handleWheel}
            className="flex h-1/4 min-h-[80px] overflow-x-auto flex-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            <Btn icon={Hamburger} label="摄入" cost='-1 RAT' time="0.2H" action="eat" disabled={state.inventory.rations <= 0 || state.player.hunger >= 100} className="flex-1 min-w-[33.333%] flex-shrink-0 border-r-0 border-b-0 last:border-r" />
            <Btn icon={Drop} label="饮水" cost='-1 WAT' time="0.2H" action="drink" disabled={state.inventory.water <= 0 || state.player.thirst >= 100} className="flex-1 min-w-[33.333%] flex-shrink-0 border-r-0 border-b-0 last:border-r" />
            <Btn icon={FirstAidKit} label="医疗" cost='-1 MED' time="0.5H" action="heal" disabled={state.inventory.medkits <= 0 || state.player.health >= 100} className="flex-1 min-w-[33.333%] flex-shrink-0 border-b-0 last:border-r" />
          </div>

          {/* Row 2: Zone Actions (Center Row - Core Gameplay) */}
          <div
            onWheel={handleWheel}
            className="flex flex-1 min-h-[120px] overflow-x-auto flex-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {state.currentZone === 'CORE' && (
              <>
                <Btn icon={Moon} label="深度休眠" cost='+STAM' time="8.0H" action="sleep" disabled={false} type="craft" className="flex-1 min-w-[33.333%] flex-shrink-0 border-r-0 border-b-0 last:border-r" />
                <Btn icon={VideoCamera} label="监控搜刮" cost='-10 PWR' time="1.5H" action="scavenge_drone" disabled={state.bunker.power < 10} type="tech" className="flex-1 min-w-[33.333%] flex-shrink-0 border-r-0 border-b-0 last:border-r" />
                <Btn icon={Radio} label="破译信号" cost='-8 PWR' time="2.0H" action="decrypt" disabled={state.bunker.power < 8 || state.weather === 'EMP_PULSE'} type="tech" className="flex-1 min-w-[33.333%] flex-shrink-0 border-r-0 border-b-0 last:border-r" />
                {state.upgrades.hydroponics && (
                  <Btn icon={Plant} label="收割作物" cost='-1 WAT' time="2.0H" action="harvest_hydro" disabled={state.inventory.water < 1} type="tech" className="flex-1 min-w-[33.333%] flex-shrink-0 border-r-0 border-b-0 last:border-r" />
                )}
              </>
            )}

            {state.currentZone === 'REC_ROOM' && (
              <>
                <Btn icon={SpeakerHifi} label="播放磁带" cost='+SYNC' time="1.0H" action="listen_music" disabled={false} type="craft" className="flex-1 min-w-[33.333%] flex-shrink-0 border-r-0 border-b-0 last:border-r" />
                <Btn icon={Package} label="抛投诱饵" cost='-1 RAT' time="0.5H" action="distract" disabled={state.inventory.rations < 1} type="danger" className="flex-1 min-w-[33.333%] flex-shrink-0 border-r-0 border-b-0 last:border-r" />
                <Btn icon={MagnifyingGlass} label="废墟搜寻" cost='LOOT' time="1.5H" action="scavenge_manual" disabled={state.player.fatigue < 15} className="flex-1 min-w-[33.333%] flex-shrink-0 border-r-0 border-b-0 last:border-r" />
                <Btn icon={Ghost} label="静默潜行" cost='-THREAT' time="1.0H" action="stealth_hide" disabled={state.player.fatigue < 20} className="flex-1 min-w-[33.333%] flex-shrink-0 border-r-0 border-b-0 last:border-r" />
                <Btn icon={Lightning} label="电弧陷阱" cost='-1 PRT' time="1.0H" action="set_trap" disabled={state.inventory.parts < 1 || state.inventory.scrap < 2} type="tech" className="flex-1 min-w-[33.333%] flex-shrink-0 border-r-0 border-b-0 last:border-r" />
              </>
            )}

            {state.currentZone === 'ENGINEERING' && (
              <>
                {state.bunker.generatorBroken ? (
                  <Btn icon={Wrench} label="抢修发电机" cost='-1 PRT' time="4.5H" action="repair_generator" disabled={state.inventory.parts < 1 || state.inventory.scrap < 3} type="danger" className="flex-1 min-w-[33.333%] flex-shrink-0 border-r-0 border-b-0 last:border-r" />
                ) : (
                  <Btn icon={BatteryCharging} label="手摇发电" cost='+PWR' time="1.5H" action="manual_refuel" disabled={state.player.fatigue < 20} className="flex-1 min-w-[33.333%] flex-shrink-0 border-r-0 border-b-0 last:border-r" />
                )}
                <Btn icon={Cpu} label="精炼元件" cost='-3 SCR' time="2.0H" action="craft_parts" disabled={state.inventory.scrap < 3} type="craft" className="flex-1 min-w-[33.333%] flex-shrink-0 border-r-0 border-b-0 last:border-r" />
                <Btn icon={Wrench} label="结构加固" cost='-2 SCR' time="2.0H" action="reinforce" disabled={state.inventory.scrap < 2} className="flex-1 min-w-[33.333%] flex-shrink-0 border-r-0 border-b-0 last:border-r" />

                {state.upgrades.antenna < 3 && (
                  <Btn icon={Broadcast} label={`天线 Mk${state.upgrades.antenna + 1}`} cost='-1 PRT' time="3.0H" action="upgrade_antenna" disabled={state.inventory.parts < 1} type="tech" className="flex-1 min-w-[33.333%] flex-shrink-0 border-r-0 border-b-0 last:border-r" />
                )}
                {!state.upgrades.waterFilter && (
                  <Btn icon={DropHalfBottom} label="净水模块" cost='-1 PRT' time="3.0H" action="upgrade_water" disabled={state.inventory.parts < 1} type="tech" className="flex-1 min-w-[33.333%] flex-shrink-0 border-r-0 border-b-0 last:border-r" />
                )}
                {!state.upgrades.autoTurret && (
                  <Btn icon={Crosshair} label="近防炮塔" cost='-3 PRT' time="5.0H" action="upgrade_turret" disabled={state.inventory.parts < 3} type="tech" className="flex-1 min-w-[33.333%] flex-shrink-0 border-r-0 border-b-0 last:border-r" />
                )}
              </>
            )}
          </div>

          {/* Row 3: Movement */}
          <div
            onWheel={handleWheel}
            className="flex h-1/4 min-h-[80px] overflow-x-auto flex-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {state.currentZone !== 'CORE' && (
              <Btn icon={Door} label="返回 CORE" cost={state.doorLockdownTimer > 0 ? 'LOCKED' : 'SECURE'} time="0.5H" action="move_CORE" disabled={state.doorLockdownTimer > 0} className="flex-1 min-w-[33.333%] flex-shrink-0 border-r-0 last:border-r" />
            )}
            {state.currentZone !== 'REC_ROOM' && (
              <Btn icon={DoorOpen} label="进 REC" cost='LOCK 4H' time="1.0H" action="move_REC_ROOM" disabled={false} type="danger" className="flex-1 min-w-[33.333%] flex-shrink-0 border-r-0 last:border-r" />
            )}
            {state.currentZone !== 'ENGINEERING' && (
              <Btn icon={DoorOpen} label="进 ENG" cost='LOCK 4H' time="1.0H" action="move_ENGINEERING" disabled={false} type="danger" className="flex-1 min-w-[33.333%] flex-shrink-0 last:border-r" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
