import React from 'react';
import { GameState } from '../../types';
import { Radio, Warning, Hamburger, Drop, FirstAidKit, Wrench, Cpu, ShieldCheck, Lightning, Waveform, Broadcast } from '@phosphor-icons/react';
import clsx from 'clsx';

interface StatProps {
    state: GameState;
    onAction: (action: string) => void;
    isProcessing: boolean;
}

export default function Stat({ state, onAction, isProcessing }: StatProps) {
    const { bunker, inventory, weather, player, research, upgrades } = state;
    const signal = bunker.signal;
    const isEmp = weather === 'EMP_PULSE';
    const isHallucinating = player.sanity < 25;

    const handleWheel = (e: React.WheelEvent) => {
        const container = e.currentTarget;
        if (Math.abs(e.deltaY) > 0) {
            container.scrollLeft += e.deltaY;
        }
    };

    const getDisplayValue = (val: number) => {
        if (isHallucinating && Math.random() > 0.85) {
            const glitched = ['??', '!!', 'XX', 'ER', 'VO', 'ID'];
            return glitched[Math.floor(Math.random() * glitched.length)];
        }
        return val;
    };

    const HeaderItem = ({ icon: Icon, value, color, label }: any) => {
        const displayValue = getDisplayValue(value);
        const glitched = displayValue !== value;

        return (
            <div className="flex flex-col items-center px-3 border-r border-zinc-800/60 group relative overflow-hidden">
                <div className="flex items-center gap-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
                    <Icon size={12} weight="bold" className={clsx(color, "transition-transform group-hover:scale-110")} />
                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">{label}</span>
                </div>
                <span className={clsx(
                    "text-[12px] font-black font-mono leading-tight mt-0.5 tracking-tighter",
                    glitched ? 'text-red-500 animate-pulse chromatic-aberration' : color,
                    "text-shadow"
                )}>
                    {displayValue}
                </span>
            </div>
        );
    };

    const ResearchItem = ({ icon: Icon, name, level, cost, onResearch, disabled }: any) => {
        const isMax = level >= 5;
        return (
            <div className="flex-shrink-0 min-w-[140px] h-full border-r border-zinc-800/60 bg-black/20 group/res p-1.5 flex flex-col justify-between transition-colors hover:bg-blue-500/5">
                <div className="flex items-center gap-2">
                    <div className="p-1 bg-blue-500/10 border border-blue-500/20 rounded-sm">
                        <Icon size={10} className="text-blue-500" />
                    </div>
                    <div className="flex flex-col leading-none overflow-hidden">
                        <span className="text-[8px] font-black text-zinc-100 uppercase tracking-tighter truncate">{name}</span>
                        <span className="text-[6px] font-mono text-zinc-600 uppercase truncate">LV.{level} | {isMax ? 'MAX' : cost}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-zinc-900 h-1 rounded-full overflow-hidden">
                        <div
                            className="bg-blue-500 h-full shadow-[0_0_5px_#3b82f6] transition-all duration-500"
                            style={{ width: `${(level / 5) * 100}%` }}
                        ></div>
                    </div>
                    <button
                        onClick={onResearch}
                        disabled={disabled || isProcessing || isMax}
                        className={clsx(
                            "px-2 py-0.5 text-[7px] font-black uppercase transition-all rounded-[1px] border flex-shrink-0",
                            (disabled || isProcessing || isMax)
                                ? "bg-zinc-900 border-zinc-800 text-zinc-700 cursor-not-allowed"
                                : "bg-blue-600/10 border-blue-500/30 text-blue-400 hover:bg-blue-500 hover:text-white"
                        )}
                    >
                        {isMax ? 'FIX' : 'UP'}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="h-14 border-b border-zinc-900 bg-black/80 flex items-stretch z-20 relative overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent pointer-events-none"></div>

            {/* OS Identity */}
            <div className="flex items-center gap-4 px-4 border-r border-zinc-900/50">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
                    </span>
                    <div className="flex flex-col leading-none">
                        <span className="text-[10px] text-green-500 uppercase tracking-[0.2em] font-black italic data-flicker">
                            BUNKER_OS
                        </span>
                        <span className="text-[7px] text-zinc-600 font-bold uppercase tracking-widest">K_SYSTEM_ACTIVE</span>
                    </div>
                </div>
            </div>

            {/* Inventory & Resources */}
            <div className="hidden xl:flex items-center bg-zinc-950/40 border-r border-zinc-900/50">
                <HeaderItem icon={Hamburger} label="RAT" value={inventory.rations} color="text-green-500" />
                <HeaderItem icon={Drop} label="WAT" value={inventory.water} color="text-blue-400" />
                <HeaderItem icon={FirstAidKit} label="MED" value={inventory.medkits} color="text-red-400" />
                <HeaderItem icon={Wrench} label="SCR" value={inventory.scrap} color="text-zinc-300" />
                <HeaderItem icon={Cpu} label="PRT" value={inventory.parts} color="text-yellow-500" />
            </div>

            {/* Unified Research List */}
            <div
                className="flex-1 min-w-0 flex overflow-x-auto flex-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                onWheel={handleWheel}
            >
                <ResearchItem
                    icon={ShieldCheck}
                    name="纳米维护"
                    level={research.nanoRepair}
                    cost="1P|3S"
                    onResearch={() => onAction('research_nanoRepair')}
                    disabled={inventory.parts < 1 || inventory.scrap < 3}
                />
                <ResearchItem
                    icon={Lightning}
                    name="功率优化"
                    level={research.powerGrid}
                    cost="1P|3S"
                    onResearch={() => onAction('research_powerGrid')}
                    disabled={inventory.parts < 1 || inventory.scrap < 3}
                />
                <ResearchItem
                    icon={Waveform}
                    name="生物扫描"
                    level={research.bioRadar}
                    cost="1P|3S"
                    onResearch={() => onAction('research_bioRadar')}
                    disabled={inventory.parts < 1 || inventory.scrap < 3}
                />
                <ResearchItem
                    icon={Broadcast}
                    name="信号阵列"
                    level={research.commsArray}
                    cost="1P|3S"
                    onResearch={() => onAction('research_commsArray')}
                    disabled={inventory.parts < 1 || inventory.scrap < 3}
                />
            </div>

            {/* Signal & Hardware Status */}
            <div className="flex items-center gap-4 px-4 bg-zinc-950/20">
                <div className="hidden lg:flex gap-1.5 h-6 items-center border-r border-zinc-800/40 pr-4 mr-2">
                    {upgrades.antenna > 0 && <div className="w-1 h-3 bg-blue-500 shadow-[0_0_5px_#3b82f6] animate-pulse rounded-full" title={`Antenna Mk${upgrades.antenna}`}></div>}
                    {upgrades.waterFilter && <div className="w-1 h-3 bg-teal-500 shadow-[0_0_5px_#2dd4bf] animate-pulse rounded-full" title="Hydraulic Filter"></div>}
                    {upgrades.autoTurret && <div className="w-1 h-3 bg-red-500 shadow-[0_0_5px_#ef4444] animate-pulse rounded-full" title="Sentry Turret"></div>}
                    {upgrades.hydroponics && <div className="w-1 h-3 bg-emerald-500 shadow-[0_0_5px_#10b981] animate-pulse rounded-full" title="Bio Agriculture"></div>}
                </div>

                <div className={clsx(
                    "flex items-center gap-2 px-3 py-1 border backdrop-blur-sm transition-all shadow-sm",
                    isEmp ? "border-red-900/50 bg-red-950/20" : "border-blue-900/50 bg-blue-950/20"
                )}>
                    {isEmp ? (
                        <Warning size={12} className="text-red-500 animate-pulse" />
                    ) : (
                        <Radio size={12} className="text-blue-400 animate-bounce" />
                    )}
                    <span className={clsx(
                        "text-[9px] font-black tracking-[0.2em] uppercase",
                        isEmp ? "text-red-500" : "text-blue-400"
                    )}>
                        {isEmp ? 'LINK_BROKEN' : `SIG: ${signal.toFixed(0)}%`}
                    </span>
                </div>
            </div>
        </div>
    );
}
