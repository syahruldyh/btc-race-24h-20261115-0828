# BTC Predator v2 — btc-race-24h-20261115-0828

Multi-regime long-only bot trading cbBTC/USDC on 1-minute Orca
Whirlpool bars, for the make.fun 24-hour live BTC trading race.
Round 2 resubmission: replaces the v1 "Crash-Rebound Dip Bot".

## Strategy (three families, one regime filter)

- **Regime**: EMA(9)/EMA(21)/EMA(50) alignment + EMA(50) slope.
  Bull -> breakout + pullback. Range -> mean-reversion only.
  Bear -> no new longs except a confirmed sweep reversal.
- **Momentum breakout** (primary in the skill): bull regime, close
  breaks the prior 20-bar high by >= 0.15 ATR, closes in the top
  quartile of its bar, not extended > 1.5% above EMA(9), above
  EMA(50). Stop 1.5 ATR below the actual fill.
- **Trend pullback**: bull regime, a genuine reclaim — previous bar
  closed below EMA(21), this one closes back above it on a strong
  green candle, above EMA(50). Stop 1.3 ATR.
- **Liquidity-sweep reversal**: a deep dip — close 2% below the
  2-hour average — while RSI(14) < 45. Stop 6 ATR, risk 1% of
  equity. Fires in any regime: a capitulation dip happens inside a
  bear regime by definition.
- **Sizing**: risk 1.5% of equity per trade (1% for sweeps);
  quantity = risk budget / stop distance, capped by cash.
  One position max. No averaging down, no martingale, no pyramiding.
- **Exits**: scale out 35% at +3R, 30% at +6R; trail the rest at
  6 ATR below the highest close since entry; hard stop; bull
  setups exit if the close breaks below EMA(50) (not applied to
  sweep trades — they are bought below EMA(50) by design).

## What is actually enabled, and why

The grid (official evaluator, 20+ configurations on the published
1,440-bar dev window) says the full three-family version loses:
research defaults -$96.71 (70 trades), breakout-only -$31.17,
pullback-only -$101.67, any combined variant -$38 to -$143.
On this market the momentum families chase the snapback's top and
bleed on 1-minute noise. The sweep is the only family with an edge,
so the regime filter enables only it here (`enableBreakout: false,
enablePullback: false` in `main.ts`). The breakout/pullback code
stays in the file — documented and tested, not deleted — for a
genuinely bullish race window. The skill says "do not force trades
when signals are weak"; this selection is that rule applied.

## Backtest (official evaluator, grade-local --driver process)

| Variant | Net PnL | Trades | Max DD |
|---|---|---|---|
| Predator v2, sweep-only, stop/trail 6 ATR, scale +3R/+6R (this bot) | +$28.29 | 5 | 1.22% |
| Same, scale +2R/+4R | +$25.47 | 5 | 1.22% |
| Same, scale +1.5R/+2.5R | +$21.56 | 6 | 1.22% |
| Same, never scale out | +$17.56 | 4 | 0.62% |
| Predator v2, all three families (research defaults) | -$96.71 | 70 | 9.67% |
| v1 Crash-Rebound Dip Bot (round 1 entry) | +$33.22 | 4 | 1.73% |
| Buy-and-hold | -$43.96 | 1 | 7.93% |

The dev gate is PnL > $0; this bot clears it with margin
(+$28.29). It scores below v1 on dev (+$33.22) — the scale-outs
bank profit earlier than v1's pure trail — but v1 is a single
two-parameter rule and v2 is the strategy Sepa ordered for this
resubmission, with the same dip-buy edge underneath. The race
window is unseen; nothing here promises a top-10 finish.

## Run

```sh
node <kit>/cli/makefun.mjs grade-local --kit <kit> --bot . --driver process --worktree
```

Entrypoint: `main.ts` (Node 22, standard library only, plus the
vendored `vendor/makefun-bars.ts` SDK shim copied byte-identical from
the kit). Deterministic: two grade-local runs produce byte-identical
action logs (L1 regrade reproduced). No clock, no environment, no
randomness, no network.
