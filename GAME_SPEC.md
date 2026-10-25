# Jerry Can Relay: Game Spec

Source of truth for the game's design and logic. If a rule changes, update this file first, then update the code to match.

## 1. Overview

- **What it is:** A mobile-first browser game for charity: water, aimed at college students.
- **Core loop:** First-person view of two hands gripping a jerry can. The player is always walking toward a well and only controls balance. Keep the can from tipping so water doesn't spill. Reach the well with as much water as possible.
- **Session length:** About 30 to 60 seconds per run. Quick and replayable.
- **Tech:** Vanilla HTML, CSS, and JS (Vite optional). No backend. No frameworks required.

## 2. Files and structure

```
/index.html
/style.css
/game.js
/assets/        SVGs: hands-and-can, well, background layers
/design/        wireframe images
GAME_SPEC.md
```

## 3. Visual direction (from the Figma wireframes)

Reference: "Jerry Can Relay wireframes" (mobile portrait 375x812, desktop landscape 1440x900). The wireframes are the visual source of truth. This spec covers behavior, copy, and layout rules. Pull exact colors, fonts, and sizes from the Figma styles.

- Flat and minimal. No gradients, no drop shadows. Thick dark outlines on the can and icons.
- **Palette:** warm sand background and ground, a lighter terracotta band above a darker rust band at the horizon, a pale cream sun circle, near-black brown for text and buttons, a cream fact card, brown skin tones for the hands.
- **Color rule:** blue is used only for water (can, water meter, droplets, liters stats, "Water" label). Everything else stays warm.
- **Typography:** heavy, tightly tracked sans for the title, headings, and big stats. Small uppercase tracked labels for eyebrows and HUD labels ("Distance to well", "Water", "Tap to balance"). Regular sans for body text. Headings and buttons use sentence case.
- **Scene layers, back to front:** sand sky, sun circle, light terracotta band, rust band (horizon), well on the horizon, sand ground with a few faint dash lines for path and motion, hands + can.
- **Hands + can:** blue jerry can with dark outline, cream label window, "5L" label, dark cap, two brown hands gripping the top. One group anchored bottom-center, rotation bound to `tiltAngle`.
- HUD stays minimal. The scene dominates.

## 3a. Responsive layout (mobile and desktop)

Two layouts, one game. Same rules, same feel, same copy.

| | Mobile portrait | Desktop landscape |
|---|---|---|
| Reference size | 375x812 | 1440x900 |
| Used when | Viewport is taller than wide | Viewport is wider than tall |
| Container | Fills the viewport (use `100dvh`) | Fills the browser window, full-bleed scene. Cap at about 1920x1200 and center beyond that. |
| Title | Stacked: title, well, tagline, button, caption | Split: title and caption bottom-left, tagline and button in a right-of-center column, wider horizon |
| Gameplay | Hands + can large at the bottom, HUD along the top and right | "Expanded peripheral view": wider horizon with more sky and ground either side, hands + can centered at the bottom, arrows at about 20% and 80% of width, distance bar top-left of center, water meter on the right edge under the sun |
| Results | Stacked: heading, stat + icon, fact card, two buttons | Side panel: well stays on the left of the scene, content column sits right of center, buttons side by side |

**Rules:**
- Portrait tablets use the mobile layout, capped at about 480px wide and centered on a sand-colored page background.
- Use CSS `aspect-ratio`, `clamp()`, `%`, `vw`, `vh`, and `dvh` units. No fixed pixel widths for the scene.
- Use SVG for the hands, can, well, sun, and horizon bands so they scale without blurring.
- Hands + can stays anchored bottom-center at a fixed percentage of container height. Rotation is applied around the can's base so tilt looks the same at every size.
- HUD stays in the same relative positions at every size. Text sizes use `clamp()` so they stay readable (minimum 12px).
- Touch targets (buttons) are at least 44x44px.
- Respect safe areas on phones (`env(safe-area-inset-*)`).
- Prevent page scrolling, pinch zoom, and double-tap zoom during play (`touch-action: none` on the game container, `user-select: none`).
- Results screens use the same container and scale the same way.

**Test checklist:** 375x812, 360x640, 768x1024 (portrait tablet), 1024x768, 1440x900, 1920x1080, and a phone in landscape (812x375).

## 4. Config (tunable values)

Keep every tunable number in one `CONFIG` object at the top of `game.js`.

| Name | Starting value | Meaning |
|---|---|---|
| `MAX_TILT` | 45 | Tilt clamp in degrees (-45 to +45) |
| `SPILL_THRESHOLD` | 25 | Degrees of tilt past which water drains |
| `SPILL_RATE` | 0.1 | Water lost per tick per degree past threshold |
| `START_DRIFT_SPEED` | 0.3 | Degrees per tick |
| `DRIFT_RAMP` | 1.02 | Drift speed multiplier applied every 5 seconds |
| `DRIFT_FLIP_MIN_MS` / `DRIFT_FLIP_MAX_MS` | 2000 / 4000 | Random interval between drift direction flips |
| `TAP_FORCE` | 4 | Degrees of counter-force per tap |
| `TICK_MS` | 100 | Game tick interval (or use requestAnimationFrame with delta time) |
| `DISTANCE_RATE` | Tune so a full run is about 45 seconds | Distance percent gained per tick |
| `CAN_CAPACITY_L` | 5 | Liters in a full can |
| `HINT_FADE_MS` | 3000 | How long tap hints stay visible |
| `TOTAL_DISTANCE_KM` | 2.0 | Starting distance to the well. The readout shows distance remaining in km and counts down to 0 (wireframe shows 1.8 km as a mid-run example) |
| `STEADY_RANGE` | 8 | Degrees of tilt (either side of 0) that count as "Steady" |
| `PARTIAL_CREDIT_FACTOR` | 0.5 | Multiplier for liters credited on a loss |

## 5. Screens (copy and layout from the wireframes)

All text in quotes is the wireframe copy. Items marked dynamic come from game state or from charity: water content.

**1. Title**
- Eyebrow: "Charity: water presents" (uppercase label).
- Title: "Jerry Can Relay" (two lines, heavy display type).
- Well on the horizon.
- Tagline: "Keep every drop steady on the long walk to water."
- Button: "Start walk" with an arrow (dark, primary).
- Caption: "A balance game with a real-world mission" (uppercase label).

**2. Gameplay**
- Top: label "Distance to well", a thin progress line with an end marker dot, and a distance-remaining readout in km that counts down (dynamic, e.g. "1.8 km").
- Sun circle, top right.
- A visible "Reset" button sits in the top-right corner during gameplay so the player can restart any run immediately.
- Water meter under the sun: label "Water", a small jerry-can-shaped gauge that fills blue, and a percent readout (dynamic, e.g. "68%").
- Well on the horizon.
- Hands + can at the bottom. Can shows "Tap to balance", a balance state label, and "5L".
- Left and right arrows at the bottom corners (mobile) or beside the can (desktop). Hint text: "Tap to balance" (mobile) or "Tap to balance or use arrow keys" (desktop).
- Three visual states: balanced (can upright), tilt left (can rotated left, droplet at the top left), tilt right (can rotated right, droplet at the top right).

**3. Result: success**
- Eyebrow: "Walk complete". Heading: "You made it".
- Large blue stat: liters delivered (dynamic, e.g. "3.2L") with the caption "delivered".
- Well icon with a checkmark badge beside the stat.
- Fact card: cream background, terracotta accent rule on the left, tag "Dynamic fact", fact text (dynamic), and "Source: charity: water". Placeholder text: "The average water walk in rural communities can be several kilometers."
- Buttons: "Walk again" (dark, primary) and "Share result" (outlined, secondary), both with arrows.

**4. Result: ran dry**
- Eyebrow: "Run summary". Heading: "The can ran dry".
- Large blue stat: liters delivered (dynamic, e.g. "0.8L") with the caption "delivered".
- Jerry can outline icon with a droplet beside the stat.
- Fact card, same structure. Placeholder text: "The walk for water is a daily reality for millions of people."
- Buttons: "Try again" (dark, primary) and "Learn more" (outlined, secondary), both with arrows.

**5. Share card (1:1)**
- Sand background, "Jerry Can Relay" title, "I kept" + large blue liters stat (dynamic) + "moving forward", and the "charity: water" wordmark at the bottom right.

## 6. Game state

```
tiltAngle      // -45 to 45, 0 is balanced
waterLevel     // 0 to 100 (percent)
distance       // 0 to 100 (percent toward well)
driftDirection // -1 or 1
driftSpeed     // starts at START_DRIFT_SPEED, increases over time
gameState      // "title" | "playing" | "won" | "lost"
```

## 7. Game start

When the player taps "Start walk":

1. Switch to the gameplay screen.
2. Initialize state: `tiltAngle = 0`, `waterLevel = 100`, `distance = 0`, `driftDirection` = random (-1 or 1), `driftSpeed = START_DRIFT_SPEED`, `gameState = "playing"`.
3. Show the hands + can, distance bar, water meter, and tap hints. Hints fade out after `HINT_FADE_MS`.
4. Start the game tick loop. Distance begins increasing immediately. The player never controls forward motion.

## 8. Player input

- **Tap or click left half of screen:** `tiltAngle -= TAP_FORCE` (push left).
- **Tap or click right half of screen:** `tiltAngle += TAP_FORCE` (push right).
- **Mobile:** tap the left or right half of the game container (touch events).
- **Desktop:** click the left or right half of the game container, or press the left and right arrow keys / A and D.
- Use pointer events (`pointerdown`) so one handler covers touch and mouse. Split left and right based on the container's width, not the full window's width, so the zones stay correct when the container is centered on desktop.
- Hint copy: mobile shows "Tap to balance". Desktop shows "Tap to balance or use arrow keys". (The desktop wording is a change from the wireframes, which show "Tap to balance" on both. Update the desktop frames to match.)
- Optional (stretch): device tilt on mobile via the gyroscope, which needs a permission prompt on iOS.
- The can graphic rotates to match `tiltAngle` with a smooth transition of about 100 to 150ms. No instant snapping.
- Optional: holding a side applies a continuous push instead of one-off taps.

## 9. Tick logic (runs every tick while `gameState === "playing"`)

1. Apply drift: `tiltAngle += driftSpeed * driftDirection`.
2. At random intervals between `DRIFT_FLIP_MIN_MS` and `DRIFT_FLIP_MAX_MS`, flip `driftDirection`. This forces the player to keep adjusting.
3. Clamp `tiltAngle` to `[-MAX_TILT, MAX_TILT]`.
4. Spill check: if `abs(tiltAngle) > SPILL_THRESHOLD`, then `waterLevel -= (abs(tiltAngle) - SPILL_THRESHOLD) * SPILL_RATE`. Otherwise no water loss. Clamp `waterLevel` at 0.
5. Advance progress: `distance += DISTANCE_RATE`. (Optional: slow this slightly when water is very low.)
6. Difficulty ramp: every 5 seconds, `driftSpeed *= DRIFT_RAMP`.
7. Update the HUD and can rotation.
8. Check win and lose conditions.

## 10. Feedback

**Visual (during play):**
- Water meter updates in real time as `waterLevel` changes.
- When tilt exceeds the spill threshold, show a droplet animation escaping the can's cap (on the side the can is leaning toward) and briefly pulse the water meter.
- Balance state label on the can: "Steady" when `abs(tiltAngle) <= STEADY_RANGE`, otherwise "Leaning left" or "Leaning right".
- Distance readout: `remainingKm = TOTAL_DISTANCE_KM * (1 - distance / 100)`, shown to one decimal. Water readout: `Math.round(waterLevel) + "%"`.
- Distance bar fills smoothly.
- Background path lines move to suggest forward motion.

**Audio (optional):**
- Soft splash on spill ticks.
- Looping footstep or ambient walking sound during play.
- Rising tension cue as `driftSpeed` increases near the well.

**Scoring:**
- No numeric score during play. Only the water meter and distance bar are shown, to keep the first-person view uncluttered.
- Score shows only on the results screen as liters delivered.

## 11. Win and lose conditions

- **Win:** `distance >= 100` and `waterLevel > 0`. Set `gameState = "won"`, stop the tick loop, show the success results screen.
  - `litersDelivered = (waterLevel / 100) * CAN_CAPACITY_L`
- **Lose:** `waterLevel <= 0` before `distance >= 100`. Set `gameState = "lost"`, stop the tick loop, show the "ran dry" results screen.
  - The wireframe shows a non-zero stat on a loss (0.8L), so a loss gets partial credit based on distance covered: `litersDelivered = (distance / 100) * CAN_CAPACITY_L * PARTIAL_CREDIT_FACTOR`. Tune the factor so a run that fails late shows a small, non-zero number.
- On either outcome, freeze all state and stop the loop before changing screens.

## 12. Reset and replay

- **Gameplay reset button:** During active play, a visible "Reset" button is always available in the top-right of the gameplay screen. Clicking it immediately restarts the run and resets the game state to the values in section 7.
- **"Walk again" / "Try again":** Reset all state to the values in section 7 and go straight to the gameplay screen (skip the title screen).
- **"Learn more" (fail variant):** Open https://www.charitywater.org in a new tab. Does not change game state.
- **"Share result" (success variant):** Generate the 1:1 share card ("I kept X.XL moving forward") using the current `litersDelivered`. Does not reset state. Player stays on the results screen.
- **Optional (stretch):** Persist `bestLitersDelivered` and `totalRuns` in localStorage.

## 13. Brand and content

- Link out to charitywater.org from the results screen.
- Results screens show a real charity: water fact or statistic. Copy is placeholder until the charity: water team supplies approved content.
- Share card carries the charity: water wordmark. The wireframes use plain text as a placeholder, so swap in the official logo and brand assets once the team provides them.

## 14. Suggested build order

1. Project setup and static layouts for the title and gameplay screens (no logic). Build the mobile portrait version first, then the desktop landscape version, and check both before moving on.
2. Game loop and tilt drift, with the can rotating on screen.
3. Tap and keyboard input for balancing.
4. Spill threshold, water loss, and droplet and meter feedback.
5. Distance progress and the difficulty ramp.
6. Win and lose detection and the two results screens.
7. Reset and replay, "Learn more" link, then polish (audio, share card, localStorage).

Test each step in the browser before moving to the next.
