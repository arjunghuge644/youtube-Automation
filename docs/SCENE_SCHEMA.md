# Universal Scene Schema & Render Strategies

CreatorFlow AI employs a universal scene schema based on a **discriminated union of validated render strategies**. Video scenes are not coupled to any single subject, template, or animation technique.

```json
{
  "sceneId": "scene_001",
  "sceneNumber": 1,
  "sceneType": "cinematic_intro",
  "durationSeconds": 8,
  "visualDescription": "High-impact visual title with animated geometric backdrop.",
  "renderStrategy": {
    "type": "motion_graphics",
    "headline": "THE SHOCKWAVE EFFECT",
    "subheadline": "Why Traffic Really Happens",
    "style": "bold_minimal",
    "backgroundAnimation": "subtle_grid"
  },
  "audio": {
    "narrationEnabled": true,
    "text": "Have you ever wondered why traffic jams suddenly appear?",
    "language": "en"
  },
  "transition": {
    "type": "crossfade",
    "durationSeconds": 0.5
  }
}
```

---

## Discriminated Render Strategies

### 1. `motion_graphics`
Used for titles, typography, kinetic explainers, statistic callouts, and product promos.
- `headline` (string, 1..150 chars)
- `subheadline` (optional string, 1..250 chars)
- `style` (`'bold_minimal'`, `'kinetic_typography'`, `'infographic'`, `'product_card'`)
- `primaryColor` & `accentColor` (optional hex strings)
- `backgroundAnimation` (`'particles'`, `'geometric_pulse'`, `'subtle_grid'`, `'solid'`)

### 2. `procedural_3d`
Used for deterministic 3D scene simulations. Sub-templates register inside the Procedural 3D Engine.
- `template`: Template registry key (e.g., `'traffic_intersection'`, `'solar_system'`, `'molecule_builder'`)
- `camera`: Bounded camera trajectory (`type: 'orbit' | 'top_down' | 'driver_view' | 'cinematic'`, `zoom: 0.5..3.0`, `angleDegrees: -180..180`)
- `parameters`: Bounded template parameters. For `traffic_intersection`:
  - `density`: `'light' | 'moderate' | 'congested' | 'gridlock'`
  - `vehicleCount`: Integer 1..100
  - `averageSpeed`: 0..80 km/h
  - `trafficSignalState`: `'green' | 'yellow' | 'red' | 'all_red'`
- `deterministicSeed`: Positive integer (1..2147483647) for repeatable physics and trajectories.

### 3. `uploaded_media`
Used for user-uploaded videos or photos, documentary B-roll, product close-ups, and user footage.
- `assetId`: Identifier of uploaded media asset
- `mediaType`: `'image' | 'video'`
- `fit`: `'cover' | 'contain' | 'crop'`
- `motion`: `'static' | 'pan_left' | 'pan_right' | 'zoom_in' | 'zoom_out' | 'ken_burns'`
- `trim`: Optional `{ startSeconds: number; endSeconds: number }`

### 4. `ai_image` (Adapter Backed)
- `prompt`: Image generation prompt
- `stylePreset`: Visual style preset
- `motion`: Camera motion effect (`'zoom_in'`, `'pan'`, etc.)

### 5. `ai_video` (Adapter Backed)
- `prompt`: Video generation prompt
- `seed`: Random seed

### 6. `stock_footage` (Curated / Search Backed)
- `query`: Search query
- `clipId`: Stock provider clip identifier
- `trim`: Trim bounds

### 7. `composited_scene`
- Multi-layer composition combining background media, 3D/video elements, and motion graphics foregrounds.

---

## Audio & Subtitle Tracks

Narration is **completely optional**. A scene may feature:
- Spoken voiceover (`narrationEnabled: true`, `text`, `language`, `speakerId`).
- Music only (`narrationEnabled: false`, ambient soundtrack).
- Subtitles with phrase or word-level timing (`startSeconds`, `endSeconds`, `text`).
- Sound effects (`sfxId`, `timingOffsetSeconds`).
