'use client';

import { useMemo, useState } from 'react';
import type { Player, Team } from '@/game';
import type { OperationResult } from '@/hooks/useGameEngine';
import { displayRating } from '@/utils/ratings';

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

  const handleConfirmBuy = () => {
    if (!selectedTransfer) {
      return;
    }
    onFeedback(onBuy(selectedTransfer));
    setSelectedTransfer(null);
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
    <div className="flex flex-col gap-4">
      <div className="kivy-list flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-base font-semibold uppercase tracking-wide">Transfers</h3>
          <p className="kivy-subtle text-sm">
            Budget {formatMoney(team.money)} · Weekly wages {formatMoney(team.playersSalarySum())}
          </p>
        </div>
        <button type="button" className="kivy-button kivy-button--secondary px-6 py-2 text-xs" onClick={handleRefresh}>
          Refresh list
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="kivy-list p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-semibold uppercase tracking-wide">Available signings</h4>
              <p className="kivy-subtle text-xs">Scouted players ready to negotiate.</p>
            </div>
            <span className="text-xs font-semibold text-black/60">{transferTargets.length}</span>
          </div>
          <div className="kivy-scroll mt-3 max-h-80 space-y-2 overflow-y-auto">
            {transferTargets.map((player) => {
              const active = selectedTransfer === player;
              return (
                <button
                  key={`target-${player.name}-${player.age}`}
                  onClick={() => setSelectedTransfer(player)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                    active ? 'border-[#f5d767] bg-[#f5d767]/40' : 'border-black/15 bg-white hover:border-[#f5d767]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{player.name}</p>
                      <p className="kivy-subtle text-xs">
                        {player.posToStr()} · Skill {displayRating(player.skill)} · Wage {formatMoney(player.salary)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-black/70">{formatMoney(player.currentValue())}</span>
                  </div>
                </button>
              );
            })}
            {transferTargets.length === 0 && <p className="kivy-subtle text-sm">No players currently listed.</p>}
          </div>
          {selectedTransfer && (
            <div className="mt-3 rounded-lg border border-black/15 bg-white px-3 py-3 text-sm">
              <p className="font-semibold">Confirm signing</p>
              <p className="kivy-subtle text-xs">
                Sign {selectedTransfer.name} for {formatMoney(selectedTransfer.currentValue())}? Weekly wage request:
                {formatMoney(selectedTransfer.salary)}.
              </p>
              <div className="mt-3 flex gap-2">
                <button type="button" className="kivy-button px-4 py-2 text-xs" onClick={handleConfirmBuy}>
                  Confirm
                </button>
                <button
                  type="button"
                  className="kivy-button kivy-button--secondary px-4 py-2 text-xs"
                  onClick={() => setSelectedTransfer(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="kivy-list p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-semibold uppercase tracking-wide">Your squad</h4>
              <p className="kivy-subtle text-xs">Manage contracts and departures.</p>
            </div>
            <span className="text-xs font-semibold text-black/60">{team.players.length}</span>
          </div>
          <div className="kivy-scroll mt-3 max-h-80 space-y-2 overflow-y-auto">
            {squadPlayers.map((player) => {
              const selected = selectedSquad === player;
              const canSell = player.canBeSold();
              const contractLabel = player.contract > 0 ? `${player.contract} weeks` : 'Expiring';
              return (
                <div
                  key={`squad-${player.name}-${player.age}`}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    selected ? 'border-[#f5d767] bg-[#f5d767]/40' : 'border-black/15 bg-white'
                  }`}
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold">{player.name}</p>
                      <p className="kivy-subtle text-xs">
                        {player.posToStr()} · Skill {displayRating(player.skill)} · Value {formatMoney(player.currentValue())}
                      </p>
                      <p className="kivy-subtle text-xs">Contract: {contractLabel}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedSquad(player)}
                        disabled={!canSell}
                        className="kivy-button kivy-button--secondary px-4 py-2 text-xs disabled:opacity-50"
                      >
                        Sell
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRenew(player)}
                        disabled={player.contract > 0}
                        className="kivy-button kivy-button--secondary px-4 py-2 text-xs disabled:opacity-50"
                      >
                        Renew
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {squadPlayers.length === 0 && <p className="kivy-subtle text-sm">No registered players.</p>}
          </div>
          {selectedSquad && (
            <div className="mt-3 rounded-lg border border-black/15 bg-white px-3 py-3 text-sm">
              <p className="font-semibold">Confirm sale</p>
              <p className="kivy-subtle text-xs">
                Sell {selectedSquad.name} for {formatMoney(selectedSquad.currentValue())}? Weekly wage relief:
                {formatMoney(selectedSquad.salary)}.
              </p>
              <div className="mt-3 flex gap-2">
                <button type="button" className="kivy-button px-4 py-2 text-xs" onClick={handleConfirmSell}>
                  Confirm
                </button>
                <button
                  type="button"
                  className="kivy-button kivy-button--secondary px-4 py-2 text-xs"
                  onClick={() => setSelectedSquad(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
