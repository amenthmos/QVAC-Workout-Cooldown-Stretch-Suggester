# QVAC Workout Cooldown Stretch Suggester

Enter the type of workout you just finished, get 3-4 relevant cooldown stretches for those specific muscle groups — generated on-device. No cloud call, no API key.

## Run

```bash
npm install
npm start
```

Then open http://localhost:32030

## QVAC SDK version

`@qvac/sdk` ^0.19.0 (see `package.json`).

## How it works

Built on [Tether's QVAC SDK](https://www.npmjs.com/package/@qvac/sdk) — all inference runs on-device, no cloud call, no API key. The app loads `LLAMA_3_2_1B_INST_Q4_0` locally with `loadModel()`, generates with `completion()` (streamed via `tokenStream`), and releases the model with `unloadModel()` on shutdown.

## Example

**Input:** workout type `running 5k`

**Output:**
```
1. Standing hamstring stretch — sit and reach for your toes with legs extended, hold 30 seconds.
2. Lying hamstring stretch — lie on your back, lift one leg toward the ceiling, and hold 30 seconds each leg.
3. Standing IT band stretch — wrap a towel around the back of your ankle and lean forward, stretch 45 seconds each leg.
4. Seated hip flexor stretch (with a twist) — sit and twist your torso to one side, keep your legs straight, hold 30 seconds each side, then switch to the other side.
```

## License

MIT
