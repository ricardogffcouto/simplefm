'use client';

import { useMemo, useState } from 'react';
import type { Player, Team } from '@/game';
import type { OperationResult } from '@/hooks/useGameEngine';

interface TransferHubProps {
  team: Team;
  onRefresh: () => OperationResult;
  onBuy: (player: Player) => OperationResult;
  onSell: (player: Player) => OperationResult;
  onRenew: (player: Player) => OperationResult;
  onFeedback: (result: OperationResult) => void;
}

function formatMoney(value: number): string {
  return `€${value.toLocaleString()}`;
}

export function TransferHub({ team, onRefresh, onBuy, onSell, onRenew, onFeedback }: TransferHubProps) {
  const [selectedTransfer, setSelectedTransfer] = useState<Player | null>(null);
  const [selectedSquad, setSelectedSquad] = useState<Player | null>(null);

  const transferTargets = useMemo(
    () => team.playersToBuy.slice().sort((a, b) => b.skill - a.skill || a.currentValue() - b.currentValue()),
    [team.playersToBuy]
  );

  const squadPlayers = useMemo(
    () =>
      team.players
        .slice()
        .sort((a, b) => a.position - b.position || b.skill - a.skill || a.age - b.age),
    [team.players]
  );

  const handleRefresh = () => {
    onFeedback(onRefresh());
  };

  const handleBuy = (player: Player) => {
    setSelectedTransfer(player);
  };

  const handleConfirmBuy = () => {
    if (!selectedTransfer) {
      return;
    }
    onFeedback(onBuy(selectedTransfer));
    setSelectedTransfer(null);
  };

  const handleSell = (player: Player) => {
    setSelectedSquad(player);
  };

  const handleConfirmSell = () => {
    if (!selectedSquad) {
      return;
    }
    onFeedback(onSell(selectedSquad));
    setSelectedSquad(null);
  };

  const handleRenew = (player: Player) => {
    onFeedback(onRenew(player));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-subtle">Transfer war room</h3>
          <p className="text-xs text-subtle">
            Budget: {formatMoney(team.money)} · Weekly wages: {formatMoney(team.playersSalarySum())}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:border-accent hover:text-accent"
        >
          Refresh transfer list
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-accent">Available signings</h3>
              <p className="text-xs text-subtle">Players scouted this week.</p>
            </div>
            <span className="text-xs text-subtle">{transferTargets.length}</span>
          </div>
          <div className="mt-3 space-y-2">
            {transferTargets.map((player) => (
              <button
                key={`target-${player.name}-${player.age}`}
                onClick={() => handleBuy(player)}
                className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left text-xs transition ${
                  selectedTransfer === player
                    ? 'border-accent bg-accent/20 text-white'
                    : 'border-white/10 bg-white/5 text-subtle hover:border-accent hover:text-white'
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-white">{player.name}</p>
                  <p className="text-xs text-subtle">
                    {player.posToStr()} · Skill {player.skill.toFixed(0)} · Wage {formatMoney(player.salary)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-accent">{formatMoney(player.currentValue())}</span>
              </button>
            ))}
            {transferTargets.length === 0 && (
              <p className="rounded-2xl border border-dashed border-white/10 px-3 py-6 text-center text-xs text-subtle">
                No players currently listed.
              </p>
            )}
          </div>
          {selectedTransfer && (
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/10 p-3 text-xs text-white/80">
              <p className="font-semibold text-accent">Confirm signing</p>
              <p className="mt-1">
                Sign {selectedTransfer.name} for {formatMoney(selectedTransfer.currentValue())}? Their weekly wage demand is
                {formatMoney(selectedTransfer.salary)}.
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={handleConfirmBuy}
                  className="rounded-full bg-accent/80 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-midnight"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setSelectedTransfer(null)}
                  className="rounded-full border border-white/20 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-white/70"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-accent">Your squad</h3>
              <p className="text-xs text-subtle">Manage contracts and departures.</p>
            </div>
            <span className="text-xs text-subtle">{team.players.length}</span>
          </div>
          <div className="mt-3 space-y-2">
            {squadPlayers.map((player) => {
              const canSell = player.canBeSold();
              const contractLabel = player.contract > 0 ? `${player.contract} weeks` : 'Expiring';
              return (
                <div
                  key={`squad-${player.name}-${player.age}`}
                  className={`flex flex-col gap-2 rounded-2xl border px-3 py-2 text-xs transition sm:flex-row sm:items-center sm:justify-between ${
                    selectedSquad === player
                      ? 'border-accent bg-accent/20 text-white'
                      : 'border-white/10 bg-white/5 text-subtle hover:border-accent hover:text-white'
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{player.name}</p>
                    <p className="text-xs text-subtle">
                      {player.posToStr()} · Skill {player.skill.toFixed(0)} · Value {formatMoney(player.currentValue())}
                    </p>
                    <p className="text-xs text-subtle">Contract: {contractLabel}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleSell(player)}
                      disabled={!canSell}
                      className="rounded-full border border-white/20 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-white/80 transition hover:border-red-400 hover:text-red-200 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/40"
                    >
                      Sell
                    </button>
                    <button
                      onClick={() => handleRenew(player)}
                      disabled={player.contract > 0}
                      className="rounded-full border border-white/20 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-white/80 transition hover:border-emerald-400 hover:text-emerald-200 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/40"
                    >
                      Renew
                    </button>
                  </div>
                </div>
              );
            })}
            {squadPlayers.length === 0 && (
              <p className="rounded-2xl border border-dashed border-white/10 px-3 py-6 text-center text-xs text-subtle">
                No registered players.
              </p>
            )}
          </div>
          {selectedSquad && (
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/10 p-3 text-xs text-white/80">
              <p className="font-semibold text-accent">Confirm sale</p>
              <p className="mt-1">
                Sell {selectedSquad.name} for {formatMoney(selectedSquad.currentValue())}? This action is final.
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={handleConfirmSell}
                  className="rounded-full bg-red-500/80 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-white"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setSelectedSquad(null)}
                  className="rounded-full border border-white/20 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-white/70"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
