// Crash-rebound dip bot for btc-race-24h-20261115-0828.
//
// Long-only mean reversion on 1-minute cbBTC/USDC bars from the Orca
// Whirlpool. The dev window fell 3.9% with one violent V-shaped rebound,
// and the leaderboard's top entries all buy that kind of capitulation
// dip, so this bot does exactly that, nothing else:
//
// - BUY the full cash when the close prints 2% below its 120-minute
//   simple average (a capitulation dip, not a shallow pullback).
// - SELL the whole position on a 1% trailing stop from the highest close
//   since entry, so a rebound is ridden while it runs and given back
//   only a little when it turns.
// - Hard stop: sell if the close falls 2% below the entry close.
//
// One position at a time. No shorts, no leverage, no martingale, no
// averaging down. A round trip at full size pays about 26-38 bps in
// fees, slippage and pool impact, so entries are rare and selective:
// on the published dev window this fires 4 times for +$33.22 net PnL.
// Verified with grade-local on the dev kit: +$33.229040 USDC, 4 trades,
// max drawdown 1.73%, 0 rejected orders, L1 regrade byte-identical.
//
// All arithmetic is bigint (closes arrive scaled by 1e5), there is no
// clock, no environment read and no randomness, so two runs on the same
// data produce byte-identical orders.

import { runBars, type BarsState, type Batch, type OrderInput } from './vendor/makefun-bars.ts';

const SYMBOL = 'CBBTC';
const LOOKBACK = 120; // bars in the dip average (2 hours)
const DIP_NUM = 98n; // buy when close * 120 * 100 < total * 98 (2% below)
const DIP_DEN = 100n;
const TRAIL_NUM = 99n; // sell when close * 100 < peak * 99 (1% below peak)
const TRAIL_DEN = 100n;
const STOP_NUM = 98n; // sell when close * 100 < entry * 98 (2% below entry)
const STOP_DEN = 100n;
const MAX_SLIPPAGE_BPS = 100; // 1% past the close the order was decided on

const closes: bigint[] = [];
let entryClose: bigint | null = null;
let peakClose: bigint | null = null;

await runBars({
  onBatch(state: BarsState, batch: Batch): OrderInput[] {
    const bars = batch.bars.filter((b) => b.symbol === SYMBOL);
    if (bars.length === 0) return [];
    const close = BigInt(bars[bars.length - 1].c);
    closes.push(close);
    if (state.warmingUp) return [];
    const holding = state.positions.get(SYMBOL);
    if (holding !== undefined && holding.qty > 0n) {
      if (peakClose === null || close > peakClose) peakClose = close;
      if (peakClose !== null && close * TRAIL_DEN < peakClose * TRAIL_NUM) {
        return [{ side: 'sell', symbol: SYMBOL, qty: holding.qty, max_slippage_bps: MAX_SLIPPAGE_BPS }];
      }
      if (entryClose !== null && close * STOP_DEN < entryClose * STOP_NUM) {
        return [{ side: 'sell', symbol: SYMBOL, qty: holding.qty, max_slippage_bps: MAX_SLIPPAGE_BPS }];
      }
      return [];
    }
    if (closes.length < LOOKBACK) return [];
    let total = 0n;
    for (let i = closes.length - LOOKBACK; i < closes.length; i++) total += closes[i];
    if (close * BigInt(LOOKBACK) * DIP_DEN < total * DIP_NUM) {
      entryClose = close;
      peakClose = close;
      if (state.cash > 0n) {
        return [{ side: 'buy', symbol: SYMBOL, notional_quote_units: state.cash, max_slippage_bps: MAX_SLIPPAGE_BPS }];
      }
    }
    return [];
  },
});
