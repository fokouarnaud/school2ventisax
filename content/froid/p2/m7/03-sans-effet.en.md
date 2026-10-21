## Purpose

The non-retriggerable timer switches the light on, the light switching off automatically after a preset time. **Pressing the push button again does not restart the timing.** The wiring diagram is the same as for the retriggerable timer: only the behaviour of the device changes.

## Timing study

Same settings: 3-second timing, presses at 1 s, 6 s and 7 s.

![Timing diagram of the non-retriggerable timer: presses at 1, 6 and 7 seconds; the lamp is on from 1 to 4 seconds, then from 6 to 9 seconds](img/chronogramme-sans-effet.svg)

| Time | What happens |
|---|---|
| 1 s | Press: the lamp lights for 3 s |
| 4 s | The lamp goes out |
| 6 s | Press: the lamp lights |
| 7 s | New press: **no effect** |
| 9 s | The lamp goes out (6 + 3) |

**Note**: pressing the push button again before the end of the timing has no effect.

## Variant: override and inhibit

Some electronic modular timers have a three-position selector:

- **normal operation**: the timer responds to the push buttons;
- **override** (<span lang="fr">forçage</span>): the lamps stay on permanently (for cleaning or moving house, for example);
- **inhibit** (position 0): the timer no longer works and the push buttons have no effect.

Several push buttons (BP1, BP2, BP3) are connected **in parallel** to the control input.
