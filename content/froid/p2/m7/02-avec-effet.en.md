## Purpose

The retriggerable timer switches the light on, the light switching off automatically after a preset time. **Pressing the push button again restarts the timing.**

## Architectural plan

![Architectural plan: two push buttons control timer t, which supplies a lighting point; 230 V supply](img/minuterie-plan.svg)

## Wiring diagram

![Wiring diagram of the staircase timer: push button S1 supplies the time-delayed coil K1; contact K1 supplies lamp L1](img/minuterie-developpe.svg)

## Timing study

The timer is set to 3 seconds. Push button S1 is pressed at 1 s, then at 6 s and 7 s.

![Timing diagram of the retriggerable timer: presses at 1, 6 and 7 seconds; the lamp is on from 1 to 4 seconds, then from 6 to 10 seconds](img/chronogramme-avec-effet.svg)

| Time | What happens |
|---|---|
| 1 s | Press: the lamp lights for 3 s |
| 4 s | End of timing: the lamp goes out |
| 6 s | Press: the lamp lights |
| 7 s | New press: the timing **restarts** for 3 s |
| 10 s | The lamp goes out (7 + 3) |

**Note**: every new press on the push button restarts the timing.
