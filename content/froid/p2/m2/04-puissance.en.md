## Stage 4: total installed power

Add up the power of every load, then apply a **demand factor** (diversity): the appliances never all run at full power at the same time.

| Loads in the example house | Quantity | Unit power | Power |
|---|---|---|---|
| LED lighting points | 14 | 15 W | 210 W |
| Socket outlets (general use) | 22 | 100 W | 2,200 W |
| Air conditioners | 2 | 1,200 W | 2,400 W |
| Washing machine | 1 | 2,200 W | 2,200 W |
| Hob | 1 | 3,500 W | 3,500 W |
| **Installed power** | | | **10,510 W** |

With a demand factor of 0.6, the maximum demand is about 0.6 × 10,510 ≈ **6,300 W**.

## Stage 5: rating the protective devices

On a single-phase 230 V supply, the current drawn is **I = P / (U × cos φ)**. With cos φ ≈ 0.9:

I = 6,300 / (230 × 0.9) ≈ **30 A**.

So the supply contract and the **main incoming circuit breaker** (<span lang="fr">disjoncteur de branchement</span>) chosen with the supplier have the next rating up, here **40 A**, with a 500 mA sensitivity. Miniature circuit breakers, on the other hand, are chosen according to the **cross-section of the cable** they protect (see the table in stage 3), never according to the appliance connected.
