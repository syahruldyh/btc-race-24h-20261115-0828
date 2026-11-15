# Crash-Rebound Dip Bot — btc-race-24h-20261115-0828

Long-only mean-reversion bot trading cbBTC/USDC on 1-minute Orca
Whirlpool bars, for the make.fun 24-hour live BTC trading race.

## Strategy

- **Buy** the full cash when the close prints **2% below its 120-minute
  simple average** (a capitulation dip).
- **Sell** everything on a **1% trailing stop** from the highest close
  since entry, with a hard **-2% stop** from the entry close.
- One position at a time; no shorts, no leverage, no averaging down.

## Why this shape

The published dev window fell 3.9% with one violent V-shaped rebound
(+4.7% in an hour). The dev leaderboard's top 10 are all dip-buy /
capitulation bots (3-10 trades, +$54-58). Trend and EMA-cross bots
whipsaw to death on 1-minute noise once fees, slippage and pool
impact (~26-38 bps a full-size round trip) are counted. This bot is
deliberately selective: few trades, deep entries, trailing exits.

## Backtest (own simulator, real fill model, dev window)

| Variant | Net PnL | Trades | Max DD |
|---|---|---|---|
| Dip -2% vs SMA120, trail -1% (this bot) | +$33.22 | 4 | 1.75% |
| Dip -1.8% vs SMA120, trail -1% | +$15.41 | 6 | — |
| Dip -2.2% vs SMA120, trail -1% | +$34.77 | 4 | — |
| EMA 8/21 cross | -$134.99 | 63 | 13.66% |
| Buy-and-hold | -$43.96 | 1 | 7.93% |

The -1.8% to -2.2% dip band all clear the dev gate (PnL > $0), so the
parameters sit on a plateau, not a knife edge. Nothing here is tuned
to squeeze the dev window: the race window is unseen, and a simple
two-parameter rule is the honest defence against overfitting it.

## Run

```sh
node <kit>/cli/makefun.mjs grade-local --kit <kit> --bot .
```

Entrypoint: `main.ts` (Node 22, standard library only, plus the
vendored `vendor/makefun-bars.ts` SDK shim copied byte-identical from
the kit). Deterministic: bigint arithmetic only, no clock, no
randomness.
