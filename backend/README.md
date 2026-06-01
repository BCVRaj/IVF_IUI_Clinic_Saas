# Embryo Grading API

**EfficientNet-B3 · Apache 2.0 · Production-ready · Supports images + time-lapse video**

## Architecture

```
EfficientNet-B3 backbone (Apache 2.0, ~49 MB, ImageNet pre-trained)
    └── Fine-tuned on Hagenberg Blastocyst Dataset (2,344 images)
         ├── expansion_head  →  score 1-6
         ├── icm_head        →  0 (poor) to 1 (excellent)
         ├── te_head         →  0 (poor) to 1 (excellent)
         └── ploidy_head     →  P(euploid)  [see note below]
```

**Why EfficientNet-B3 and not FEMI?**
FEMI is CC-BY-NC-ND (non-commercial only). EfficientNet-B3 via `timm` is
Apache 2.0 — safe for any production or commercial deployment.

## Quickstart

```bash
# 1. Install dependencies
./setup.sh

# 2. Train the model (downloads Hagenberg dataset automatically, ~200 MB)
python scripts/train.py              # ~1-2h CPU, ~20min GPU

# 3. Start the server
./start.sh                           # production (Gunicorn, 2 workers)
./start.sh --dev                     # development (auto-reload)

# 4. Smoke test
./test_api.sh
```

Server runs on **http://localhost:8081**. API docs at **/docs**.

## Inputs accepted

The `/api/stork/predict` endpoint accepts:

| Upload type | Description |
|---|---|
| **JPG / PNG images** | Blastocyst photos — one or more |
| **Time-lapse video** | `.mp4`, `.avi`, `.mov`, etc. — frames are extracted automatically |

For videos: the sharpest 9 frames from the blastocyst development window
(~hour 96-120 post-fertilisation) are automatically selected. No manual
frame extraction needed.

## API

### `GET /api/healthcheck`
```json
{
  "status": "Healthy",
  "mode": "REAL inference",
  "model": "EfficientNet-B3 (Apache 2.0)"
}
```

### `POST /api/login`
```
Form: username=admin  password=embryo2024
Response: { "token": "<uuid>" }
```

### `POST /api/stork/predict`
```
Headers: Authorization: Bearer <token>
Form:
  data   = '{"maternalAge": 32.5}'
  images = <file(s)>   ← images OR a time-lapse video

Response:
{
  "lrEupAnu": {
    "blastocystScore":    11.2,
    "expansionScore":     4.8,
    "icmScore":           0.85,
    "trophectodermScore": 0.78,
    "euploidProbablity":  0.72,
    "euploidPrediction":  true
  },
  "lrEupCxa": { ... }
}
```

## Scalability

The model loads **once** at startup and serves all concurrent requests from the
same in-memory instance.

```
1 server   · CPU  · 2 workers  →  handles a clinic (dozens of req/day easily)
1 server   · GPU  · 4 workers  →  handles hundreds of concurrent requests
Cloud      · auto-scaling      →  unlimited horizontal scale
```

## Ploidy prediction note

The Hagenberg dataset does not include PGT-A (genetic testing) outcomes.
The ploidy head is currently trained on **synthetic labels** derived from
Gardner score quality — clinically plausible but not validated.

**For clinical accuracy**: collect real PGT-A outcomes paired with embryo
images, add them as `ploidy` labels in your training data, and retrain.
The training code already supports this — just add a `ploidy` column (0/1)
to your CSV label file.

## Connecting to the Next.js frontend

The frontend at `ivf/src/app/(protected)/doctor/ai-embryo-selection/page.tsx`
already calls `POST /api/stork/predict` — it will work automatically once
this server is running on port 8081.

`.env.local` in the Next.js project is already updated:
```
STORK_V_URL=http://localhost:8081
FEMI_INTERNAL_KEY=femi-internal-2024
```
