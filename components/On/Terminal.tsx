import React, { useRef, useEffect } from 'react';
import { GameState } from '../../types';
import clsx from 'clsx';

export default function Terminal({ state, onCommand }: { state: GameState, onCommand?: (cmd: string) => void }) {
  const { logs, player, weather } = state;
  const isHallucinating = player.sanity < 25;
  const criticalSanity = player.sanity < 15;

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputRef.current && onCommand) {
      const cmd = inputRef.current.value.trim().toLowerCase();
      if (cmd) {
        onCommand(cmd);
        inputRef.current.value = '';
      }
    }
  };

  return (
    <div className={clsx(
      "flex-1 min-h-0 bg-[#040504] flex flex-col cyber-panel relative overflow-hidden group/term",
      criticalSanity && "sanity-critical"
    )} onClick={() => inputRef.current?.focus()}>

      {/* Logs Content Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 text-[12px] md:text-[14px] space-y-3 font-mono pb-6 scroll-smooth custom-scrollbar relative">
        <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#040504] to-transparent pointer-events-none z-10"></div>

        {logs.map((log, idx) => {
          const typeColors = {
            normal: 'text-green-500/80',
            danger: 'text-red-500 font-bold',
            info: 'text-blue-400',
            sys: 'text-zinc-500 italic text-[11px]',
            warn: 'text-yellow-500',
            success: 'text-emerald-500'
          };

          let displayMsg = log.message;
          const isGlitched = isHallucinating && Math.random() > 0.92;
          if (isGlitched) {
            const noises = ['_SYSTEM_ERROR_', '!!VOID!!', '<<REDACTED>>', '??NULL??', 'PLEASE_LEAVE', 'THEY_SEE_YOU'];
            displayMsg = noises[Math.floor(Math.random() * noises.length)];
          }

          return (
            <div key={log.id}
              className={clsx(
                "flex flex-col gap-1 group/log animate-text-reveal",
                log.type === 'danger' && "bg-red-500/5 border-l-2 border-red-500/40 pl-3 -ml-3"
              )}
              style={{ animationDelay: `${Math.min(0.5, idx * 0.05)}s` }}>
              <div className="flex items-center gap-3 opacity-30 group-hover/log:opacity-100 transition-opacity duration-300">
                <span className="text-[10px] font-mono text-zinc-600 tracking-tighter">[{log.time}]</span>
                <span className="h-[1px] flex-1 bg-zinc-800/30"></span>
                <span className={clsx(
                  "text-[8px] uppercase font-black px-1.5 py-0.5 select-none",
                  log.type === 'danger' ? 'bg-red-500/20 text-red-500' : 'bg-green-500/10 text-green-700'
                )}>
                  {log.type}
                </span>
              </div>
              <div className={clsx(
                typeColors[log.type] || typeColors.normal,
                "leading-relaxed break-words relative",
                isGlitched && "chromatic-aberration animate-pulse"
              )}>
                <span className="absolute -left-4 opacity-0 group-hover/log:opacity-100 transition-all duration-300 text-green-500">»</span>
                {displayMsg}
              </div>
            </div>
          );
        })}
        {logs.length === 0 && (
          <div className="h-full flex items-center justify-center opacity-20 italic text-green-500 text-xs tracking-widest uppercase">
            [ Awaiting System Logs... ]
          </div>
        )}
      </div>

      {/* Command Input Area */}
      <div className="px-5 py-3 border-t border-zinc-900 bg-black/60 flex items-center gap-4 z-10 transition-colors focus-within:bg-black/80">
        <div className="flex items-center gap-2">
          <span className="text-green-500 text-[11px] font-black animate-pulse shadow-green-500/20">
            ADMIN@BUNKER:~$
          </span>
        </div>
        <input
          ref={inputRef}
          type="text"
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck="false"
          className="flex-1 bg-transparent border-none outline-none text-green-400 font-mono text-[13px] placeholder:text-zinc-800 uppercase tracking-wider"
          placeholder="ENTER_CMD_SEQUENCE..."
          autoFocus
        />
        <div className="text-[8px] text-zinc-700 font-mono hidden sm:block uppercase opacity-50">
          [ Enter to Submit ]
        </div>
      </div>

      {/* Scanline Overlay Specific to Terminal */}
      <div className="absolute inset-0 scanline-bar opacity-[0.03] pointer-events-none"></div>
    </div>
  );
}
