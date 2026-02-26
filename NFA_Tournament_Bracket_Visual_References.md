# NFA Tournament Bracket - Visual Text Routing Map

This file shows full bracket movement using only game references.
No player names are used.

Legend:
- `W(Mx)` = Winner of match `Mx`
- `L(Mx)` = Loser of match `Mx`
- `-> My` = advances/drops to match `My`
- `-> D2-S#` / `-> D3-S#` = seeded into Division 2 / Division 3 seed slot
- `ELIM` = eliminated from tournament path

---

## 1) Division 1 (Main Open Double Elimination)

### 1.1 Winners Bracket

#### W1 (16 matches)
- `M1`  : Team A vs Team B
- `M2`  : Team C vs Team D
- `M3`  : Team E vs Team F
- `M4`  : Team G vs Team H
- `M5`  : Team I vs Team J
- `M6`  : Team K vs Team L
- `M7`  : Team M vs Team N
- `M8`  : Team O vs Team P
- `M9`  : Team Q vs Team R
- `M10` : Team S vs Team T
- `M11` : Team U vs Team V
- `M12` : Team W vs Team X
- `M13` : Team Y vs Team Z
- `M14` : Team AA vs Team AB
- `M15` : Team AC vs Team AD
- `M16` : Team AE vs Team AF

#### W2 (8 matches)
- `M17` : `W(M1)`  vs `W(M2)`
- `M18` : `W(M3)`  vs `W(M4)`
- `M19` : `W(M5)`  vs `W(M6)`
- `M20` : `W(M7)`  vs `W(M8)`
- `M21` : `W(M9)`  vs `W(M10)`
- `M22` : `W(M11)` vs `W(M12)`
- `M23` : `W(M13)` vs `W(M14)`
- `M24` : `W(M15)` vs `W(M16)`

#### W3 (4 matches)
- `M25` : `W(M17)` vs `W(M18)`
- `M26` : `W(M19)` vs `W(M20)`
- `M27` : `W(M21)` vs `W(M22)`
- `M28` : `W(M23)` vs `W(M24)`

#### W4 (2 matches)
- `M29` : `W(M25)` vs `W(M26)`
- `M30` : `W(M27)` vs `W(M28)`

### 1.2 Losers Ladder

#### L1 (8 matches)
- `M31` : `L(M1)`  vs `L(M2)`
- `M32` : `L(M3)`  vs `L(M4)`
- `M33` : `L(M5)`  vs `L(M6)`
- `M34` : `L(M7)`  vs `L(M8)`
- `M35` : `L(M9)`  vs `L(M10)`
- `M36` : `L(M11)` vs `L(M12)`
- `M37` : `L(M13)` vs `L(M14)`
- `M38` : `L(M15)` vs `L(M16)`

#### L2 (8 matches)
- `M39` : `W(M31)` vs `L(M17)`
- `M40` : `W(M32)` vs `L(M18)`
- `M41` : `W(M33)` vs `L(M19)`
- `M42` : `W(M34)` vs `L(M20)`
- `M43` : `W(M35)` vs `L(M21)`
- `M44` : `W(M36)` vs `L(M22)`
- `M45` : `W(M37)` vs `L(M23)`
- `M46` : `W(M38)` vs `L(M24)`

#### L3 (4 matches)
- `M47` : `W(M39)` vs `W(M40)`
- `M48` : `W(M41)` vs `W(M42)`
- `M49` : `W(M43)` vs `W(M44)`
- `M50` : `W(M45)` vs `W(M46)`

#### L4 (4 matches)
- `M51` : `W(M47)` vs `L(M25)`
- `M52` : `W(M48)` vs `L(M26)`
- `M53` : `W(M49)` vs `L(M27)`
- `M54` : `W(M50)` vs `L(M28)`

#### L5 (2 matches)
- `M55` : `W(M51)` vs `W(M52)`
- `M56` : `W(M53)` vs `W(M54)`

#### L6 (2 matches)
- `M57` : `W(M55)` vs `L(M29)`
- `M58` : `W(M56)` vs `L(M30)`

### 1.3 D1 Finals
- `M59` (SF1): `W(M29)` vs `W(M57)`
- `M60` (SF2): `W(M30)` vs `W(M58)`
- `M61` (3rd/4th): `L(M59)` vs `L(M60)`
- `M62` (D1 Final): `W(M59)` vs `W(M60)`

---

## 2) Cross-Division Seeding (exact second-loss routing)

### 2.1 Seeds to Division 3 (16 teams)
- `D3-S1  = L(M31)`
- `D3-S2  = L(M32)`
- `D3-S3  = L(M33)`
- `D3-S4  = L(M34)`
- `D3-S5  = L(M35)`
- `D3-S6  = L(M36)`
- `D3-S7  = L(M37)`
- `D3-S8  = L(M38)`
- `D3-S9  = L(M39)`
- `D3-S10 = L(M40)`
- `D3-S11 = L(M41)`
- `D3-S12 = L(M42)`
- `D3-S13 = L(M43)`
- `D3-S14 = L(M44)`
- `D3-S15 = L(M45)`
- `D3-S16 = L(M46)`

### 2.2 Seeds to Division 2 (8 teams)
- `D2-S1 = L(M47)`
- `D2-S2 = L(M48)`
- `D2-S3 = L(M49)`
- `D2-S4 = L(M50)`
- `D2-S5 = L(M51)`
- `D2-S6 = L(M52)`
- `D2-S7 = L(M53)`
- `D2-S8 = L(M54)`

---

## 3) Division 3 (Single Elimination, 16 teams)

### 3.1 D3 W1 (8 matches)
- `M63` : `D3-S1`  vs `D3-S16`
- `M64` : `D3-S8`  vs `D3-S9`
- `M65` : `D3-S4`  vs `D3-S13`
- `M66` : `D3-S5`  vs `D3-S12`
- `M67` : `D3-S2`  vs `D3-S15`
- `M68` : `D3-S7`  vs `D3-S10`
- `M69` : `D3-S3`  vs `D3-S14`
- `M70` : `D3-S6`  vs `D3-S11`

### 3.2 D3 W2 (4 matches)
- `M71` : `W(M63)` vs `W(M64)`
- `M72` : `W(M65)` vs `W(M66)`
- `M73` : `W(M67)` vs `W(M68)`
- `M74` : `W(M69)` vs `W(M70)`

### 3.3 D3 Semi-Finals (2 matches)
- `M75` : `W(M71)` vs `W(M72)`
- `M76` : `W(M73)` vs `W(M74)`

### 3.4 D3 Finals phase
- `M77` (3rd/4th): `L(M75)` vs `L(M76)`
- `M78` (D3 Final): `W(M75)` vs `W(M76)`

Single-elimination note:
- Loser of any D3 match is immediately `ELIM` from D3 placement path.

---

## 4) Division 2 (Double Elimination, 8 teams)

### 4.1 D2 Winners Bracket
- `M79` : `D2-S1` vs `D2-S8`
- `M80` : `D2-S4` vs `D2-S5`
- `M81` : `D2-S2` vs `D2-S7`
- `M82` : `D2-S3` vs `D2-S6`

- `M83` : `W(M79)` vs `W(M80)`
- `M84` : `W(M81)` vs `W(M82)`

### 4.2 D2 Losers Bracket
- `M85` : `L(M79)` vs `L(M80)`
- `M86` : `L(M81)` vs `L(M82)`

- `M87` : `W(M85)` vs `L(M83)`
- `M88` : `W(M86)` vs `L(M84)`

### 4.3 D2 Finals phase
- `M89` (SF1): `W(M83)` vs `W(M87)`
- `M90` (SF2): `W(M84)` vs `W(M88)`
- `M91` (3rd/4th): `L(M89)` vs `L(M90)`
- `M92` (D2 Final): `W(M89)` vs `W(M90)`

---

## 5) Full Match Routing Table (Winner path + Loser path)

### 5.1 D1 Main + D1 Finals

| Match | Winner Goes To | Loser Goes To |
|---|---|---|
| M1 | M17 | M31 |
| M2 | M17 | M31 |
| M3 | M18 | M32 |
| M4 | M18 | M32 |
| M5 | M19 | M33 |
| M6 | M19 | M33 |
| M7 | M20 | M34 |
| M8 | M20 | M34 |
| M9 | M21 | M35 |
| M10 | M21 | M35 |
| M11 | M22 | M36 |
| M12 | M22 | M36 |
| M13 | M23 | M37 |
| M14 | M23 | M37 |
| M15 | M24 | M38 |
| M16 | M24 | M38 |
| M17 | M25 | M39 |
| M18 | M25 | M40 |
| M19 | M26 | M41 |
| M20 | M26 | M42 |
| M21 | M27 | M43 |
| M22 | M27 | M44 |
| M23 | M28 | M45 |
| M24 | M28 | M46 |
| M25 | M29 | M51 |
| M26 | M29 | M52 |
| M27 | M30 | M53 |
| M28 | M30 | M54 |
| M29 | M59 | M57 |
| M30 | M60 | M58 |
| M31 | M39 | D3-S1 |
| M32 | M40 | D3-S2 |
| M33 | M41 | D3-S3 |
| M34 | M42 | D3-S4 |
| M35 | M43 | D3-S5 |
| M36 | M44 | D3-S6 |
| M37 | M45 | D3-S7 |
| M38 | M46 | D3-S8 |
| M39 | M47 | D3-S9 |
| M40 | M47 | D3-S10 |
| M41 | M48 | D3-S11 |
| M42 | M48 | D3-S12 |
| M43 | M49 | D3-S13 |
| M44 | M49 | D3-S14 |
| M45 | M50 | D3-S15 |
| M46 | M50 | D3-S16 |
| M47 | M51 | D2-S1 |
| M48 | M52 | D2-S2 |
| M49 | M53 | D2-S3 |
| M50 | M54 | D2-S4 |
| M51 | M55 | D2-S5 |
| M52 | M55 | D2-S6 |
| M53 | M56 | D2-S7 |
| M54 | M56 | D2-S8 |
| M55 | M57 | ELIM (D1 path) |
| M56 | M58 | ELIM (D1 path) |
| M57 | M59 | ELIM (D1 path) |
| M58 | M60 | ELIM (D1 path) |
| M59 | M62 | M61 |
| M60 | M62 | M61 |
| M61 | D1-3rd | D1-4th |
| M62 | D1-Champion | D1-RunnerUp |

### 5.2 D3

| Match | Winner Goes To | Loser Goes To |
|---|---|---|
| M63 | M71 | ELIM |
| M64 | M71 | ELIM |
| M65 | M72 | ELIM |
| M66 | M72 | ELIM |
| M67 | M73 | ELIM |
| M68 | M73 | ELIM |
| M69 | M74 | ELIM |
| M70 | M74 | ELIM |
| M71 | M75 | ELIM |
| M72 | M75 | ELIM |
| M73 | M76 | ELIM |
| M74 | M76 | ELIM |
| M75 | M78 | M77 |
| M76 | M78 | M77 |
| M77 | D3-3rd | D3-4th |
| M78 | D3-Champion | D3-RunnerUp |

### 5.3 D2

| Match | Winner Goes To | Loser Goes To |
|---|---|---|
| M79 | M83 | M85 |
| M80 | M83 | M85 |
| M81 | M84 | M86 |
| M82 | M84 | M86 |
| M83 | M89 | M87 |
| M84 | M90 | M88 |
| M85 | M87 | ELIM |
| M86 | M88 | ELIM |
| M87 | M89 | ELIM |
| M88 | M90 | ELIM |
| M89 | M92 | M91 |
| M90 | M92 | M91 |
| M91 | D2-3rd | D2-4th |
| M92 | D2-Champion | D2-RunnerUp |

---

## 6) Compact Visual Flows

### 6.1 Division 1 core

```text
Winners Side:
M1..M16 -> M17..M24 -> M25..M28 -> M29..M30 -> M59/M60 -> M62

Losers Side:
L(M1..M16) -> M31..M38 -> M39..M46 -> M47..M50 -> M51..M54 -> M55..M56 -> M57..M58 -> M59/M60

D1 placement:
M61 => 3rd/4th
M62 => Champion/Runner-up
```

### 6.2 D3 seed and finish

```text
D3-S1..S16 (from losers M31..M46)
-> M63..M70 -> M71..M74 -> M75..M76 -> M77/M78
```

### 6.3 D2 seed and finish

```text
D2-S1..S8 (from losers M47..M54)
Winners: M79..M82 -> M83..M84
Losers : M85..M86 -> M87..M88
Finals : M89/M90 -> M91/M92
```

