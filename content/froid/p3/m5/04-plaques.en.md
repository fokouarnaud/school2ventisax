## Consolidation exercise: reading a rating plate

The rated values on a rating plate describe how the manufacturer intends the motor to run, at its best performance. They include: rated power, rated speed, operating frequency, number of phases, rated efficiency, rated power factor, rated current, permitted temperature rise (insulation class) and the supply voltages with their connection.

Answer the questions for each of the two plates below. The supply is a **230/400 V** three-phase network (400 V between phases).

## Plate A

| Quantity | Value |
|---|---|
| Motor | Three-phase induction |
| Voltages | 230 V in delta, 400 V in star |
| Frequency | 50 Hz |

## Plate B

| Connection and voltage | Frequency | Speed (rpm) | Power (kW) | cos φ | Current (A) |
|---|---|---|---|---|---|
| Δ 380 V | 50 Hz | 2970 | 250 | 0.92 | 434 |
| Δ 400 V | 50 Hz | 2974 | 250 | 0.90 | 422 |
| Y 690 V | 50 Hz | 2974 | 250 | 0.90 | 244 |
| Δ 415 V | 50 Hz | 2976 | 250 | 0.88 | 415 |
| Δ 440 V | 60 Hz | 3568 | 288 | 0.92 | 418 |
| Δ 460 V | 60 Hz | 3572 | 288 | 0.91 | 417 |

Other information on plate B: protection rating IP23, maximum ambient temperature 40 °C, duty S1 (continuous), weight 790 kg.

## Questions

For each plate:

1. Can this motor be started in star?
2. Can this motor be started in delta?
3. Can this motor be started star-delta?

## Answers

**Plate A** (230/400 V):

1. **Yes**: the higher voltage on the plate, 400 V, equals the line voltage of the supply. The motor is connected in star.
2. **No**: in delta, each winding would receive 400 V instead of the 230 V it is designed for; it would be destroyed.
3. **No**: star-delta starting needs a motor that runs in delta on the supply. This motor runs in star; it is started direct-on-line.

**Plate B** (Δ 400 V / Y 690 V):

1. **No** for running in star: star is meant for 690 V; on 400 V each winding would only get 230 V instead of 400 V. Star is only used as the first step of star-delta starting.
2. **Yes**: the lower voltage (400 V in delta) equals the line voltage of the supply.
3. **Yes**: the motor runs in delta on this supply; star-delta starting is possible and even advisable, given its power (250 kW) and current (422 A).
