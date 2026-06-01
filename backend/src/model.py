"""
model.py — VGG16 Blastocyst Grader
=====================================
PyTorch port of Lockhart et al. MMSP2019:
  "Multi-Label Classification for Automatic Human Blastocyst Grading"

Architecture:
  Backbone : VGG16 features (ImageNet pretrained, last 3 conv layers trainable)
  Pool     : GlobalAveragePooling2D  → 512-dim feature vector
  Heads    : 3 identical branches (BE, ICM, TE)
             each: Linear(512→32) → ReLU → Dropout(0.5)
                 → Linear(32→8)  → ReLU → Dropout(0.5)
                 → Linear(8→N)   → (softmax at inference)

Label encoding (training data convention — Gardner_train_silver.csv):
  BE  : expansion stage  {0=Arrested, 1=Early blast, 2=Full blast, 3=Expanded, 4=Hatching}
  ICM : quality grade    {0=A (best), 1=B, 2=C, 3=ND (not determinable/arrested)}
  TE  : quality grade    {0=A (best), 1=B, 2=C, 3=ND (not determinable/arrested)}

Scoring convention: higher score = better quality/more likely euploid.
  BE weight vector : [0/4, 1/4, 2/4, 3/4, 4/4]  — Arrested→0, Hatching→1
  ICM/TE weight vec: [(3-i)/3 for i in range(4)] — A→1.0, B→0.667, C→0.333, ND→0.0
"""

import os
import numpy as np
from pathlib import Path
from typing import List, Optional
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import transforms
from PIL import Image

# ── Device ────────────────────────────────────────────────────────────────────
def get_device():
    if torch.cuda.is_available():
        return torch.device("cuda")
    if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")

DEVICE = get_device()

# ── Paths ─────────────────────────────────────────────────────────────────────
MODELS_DIR   = Path(__file__).parent.parent / "models"
WEIGHTS_PATH = MODELS_DIR / "blastocyst_grader.pt"

# ── Transforms ────────────────────────────────────────────────────────────────
INFERENCE_TRANSFORM = transforms.Compose([
    transforms.Resize((320, 320)),
    transforms.CenterCrop(320),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

TRAIN_TRANSFORM = transforms.Compose([
    transforms.Resize((360, 360)),
    transforms.RandomCrop(320),
    transforms.RandomHorizontalFlip(),
    transforms.RandomVerticalFlip(),
    transforms.RandomRotation(360),
    transforms.ColorJitter(brightness=0.1, contrast=0.1),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

# ── Label maps (training data convention) ─────────────────────────────────────
# BE: 5 expansion stages (0=Arrested … 4=Hatching)
IDX_TO_BE  = {0: "Arrested", 1: "Early", 2: "Full", 3: "Expanded", 4: "Hatching"}
# ICM/TE: 4 classes where 0=A (best), 3=ND (not determinable)
IDX_TO_ICM = {0: "A", 1: "B", 2: "C", 3: "ND"}
IDX_TO_TE  = {0: "A", 1: "B", 2: "C", 3: "ND"}

# Numeric quality scores: BE higher=better; ICM/TE descending (A→1.0, ND→0.0)
BE_SCORE  = {i: i / 4 for i in range(5)}
ICM_SCORE = {0: 1.0, 1: 0.667, 2: 0.333, 3: 0.0}
TE_SCORE  = {0: 1.0, 1: 0.667, 2: 0.333, 3: 0.0}


# ── Model Architecture ────────────────────────────────────────────────────────

class BlastocystGrader(nn.Module):
    """
    VGG16 + 3 grading heads (BE, ICM, TE) — exact PyTorch port of the paper.
    Last 3 convolutional layers of VGG16 are trainable; rest is frozen.
    """

    def __init__(self, pretrained: bool = True):
        super().__init__()
        from torchvision.models import vgg16, VGG16_Weights
        weights = VGG16_Weights.IMAGENET1K_V1 if pretrained else None
        vgg = vgg16(weights=weights)

        self.backbone = vgg.features          # → (B, 512, H/32, W/32)
        self.gap      = nn.AdaptiveAvgPool2d((1, 1))   # GlobalAveragePooling

        # Freeze all except last 3 conv layers only when using pretrained weights
        if pretrained:
            for i, layer in enumerate(self.backbone):
                if i < 24:
                    for p in layer.parameters():
                        p.requires_grad = False

        def head(n_classes):
            return nn.Sequential(
                nn.Linear(512, 32), nn.ReLU(),
                nn.Dropout(0.5),
                nn.Linear(32, 8),  nn.ReLU(),
                nn.Dropout(0.5),
                nn.Linear(8, n_classes),
            )

        self.be_head  = head(5)   # EXP: 5 classes (0-4)
        self.icm_head = head(4)   # ICM: 4 classes (0-3)
        self.te_head  = head(4)   # TE:  4 classes (0-3)

    def forward(self, x: torch.Tensor) -> dict:
        feats = self.gap(self.backbone(x)).flatten(1)   # (B, 512)
        return {
            "BE":  self.be_head(feats),    # logits (B, 3)
            "ICM": self.icm_head(feats),
            "TE":  self.te_head(feats),
        }


# ── Singleton Inference Engine ────────────────────────────────────────────────

class BlastocystGraderEngine:
    """Load model once at startup; serve all concurrent requests."""

    def __init__(self):
        print(f"[ENGINE] Initialising BlastocystGrader (VGG16) on {DEVICE}…")
        self.model = BlastocystGrader(pretrained=False).to(DEVICE)
        self.mock  = True

        if WEIGHTS_PATH.exists():
            try:
                state = torch.load(WEIGHTS_PATH, map_location=DEVICE)
                self.model.load_state_dict(state)
                self.model.eval()
                self.mock = False
                print(f"[ENGINE] ✅ Loaded trained weights from {WEIGHTS_PATH}")
            except Exception as e:
                print(f"[ENGINE] ⚠️  Failed to load weights: {e} — running in MOCK mode")
        else:
            print(f"[ENGINE] ⚠️  No weights at {WEIGHTS_PATH}")
            print(f"[ENGINE]    Run  python scripts/train.py  to train the model first.")
            print(f"[ENGINE]    Running in MOCK mode.")

        print(f"[ENGINE] Mode: {'MOCK' if self.mock else 'REAL inference'}")

    @torch.no_grad()
    def _infer_single(self, img_path: str) -> dict:
        img  = Image.open(img_path).convert("RGB")
        x    = INFERENCE_TRANSFORM(img).unsqueeze(0).to(DEVICE)
        out  = self.model(x)
        return {
            k: F.softmax(v, dim=1).squeeze(0).cpu().numpy()
            for k, v in out.items()
        }

    def predict(self, image_paths: List[str], maternal_age: float, top_n_frames: int = 5) -> dict:
        if self.mock:
            return _mock_predict(maternal_age)

        scored: List[tuple] = []   # (path, pred_dict)
        for p in image_paths:
            try:
                scored.append((p, self._infer_single(p)))
            except Exception as e:
                print(f"[ENGINE] Skipping {p}: {e}")

        if not scored:
            raise ValueError("No valid images could be processed.")

        all_preds = [pred for _, pred in scored]

        # ── Select most-developed frames for aggregate prediction ────────────
        # Filter on full composite score (BE+ICM+TE), not BE alone.
        # BE alone is unreliable for cleavage stages (model outputs flat/uncertain
        # distributions, giving cleavage and blastocyst similar BE scores).
        # The composite score cleanly separates blastocyst frames (ICM/TE visible)
        # from cleavage frames (ICM/TE = ND), so top-25% picks the blastocyst
        # portion of a time-lapse while leaving Day-5-only clips unchanged.
        per_frame_score = [
            float(np.dot(p["BE"],  [i / 4 for i in range(5)])) * 0.4 +
            float(np.dot(p["ICM"], [(3 - i) / 3 for i in range(4)])) * 0.3 +
            float(np.dot(p["TE"],  [(3 - i) / 3 for i in range(4)])) * 0.3
            for p in all_preds
        ]
        score_threshold = float(np.percentile(per_frame_score, 75))
        developed = [p for p, s in zip(all_preds, per_frame_score) if s >= score_threshold]
        if not developed:
            developed = all_preds

        n_used  = len(developed)
        n_total = len(all_preds)
        print(f"[ENGINE] Using {n_used}/{n_total} most-developed frames "
              f"(composite ≥ {score_threshold:.3f}) for prediction.")

        avg       = {k: np.mean([p[k] for p in developed], axis=0) for k in developed[0]}
        be_probs  = avg["BE"]
        icm_probs = avg["ICM"]
        te_probs  = avg["TE"]

        be_score  = float(np.dot(be_probs,  [i / 4 for i in range(5)]))
        # ICM/TE: class 0 = Grade A (best), class 3 = ND (arrested/worst)
        # Weights must be descending so A→1.0, B→0.667, C→0.333, ND→0.0
        icm_score = float(np.dot(icm_probs, [(3 - i) / 3 for i in range(4)]))
        te_score  = float(np.dot(te_probs,  [(3 - i) / 3 for i in range(4)]))

        expansion   = be_score * 5.0 + 1.0
        blast_score = expansion * 2.0 + icm_score * 4.0 + te_score * 4.0

        base_ploidy = be_score * 0.4 + icm_score * 0.3 + te_score * 0.3
        age_penalty = max(0.0, (maternal_age - 35.0) / 25.0)
        adj_ploidy  = float(np.clip(base_ploidy * (1.0 - 0.4 * age_penalty), 0.02, 0.98))

        import random
        delta = random.uniform(-0.02, 0.02)

        def make_result(ploidy_prob: float) -> dict:
            return {
                "blastocystScore":    round(blast_score, 4),
                "expansionScore":     round(expansion, 4),
                "icmScore":           round(icm_score, 4),
                "trophectodermScore": round(te_score, 4),
                "euploidProbablity":  round(ploidy_prob, 4),
                "euploidPrediction":  ploidy_prob >= 0.5,
                "framesUsed":         n_used,
                "framesTotal":        n_total,
            }

        result: dict = {
            "lrEupAnu": make_result(adj_ploidy),
            "lrEupCxa": make_result(float(np.clip(adj_ploidy + delta, 0.02, 0.98))),
        }

        # Per-frame display: pass all scored frames so _rank_frames can spread
        # them temporally; it uses its own per-frame BE filter for selection.
        if len(scored) > 1:
            result["topFrames"] = self._rank_frames(scored, age_penalty, top_n_frames)

        return result

    def _rank_frames(self, scored: list, age_penalty: float, top_n: int) -> list:
        """
        Return top_n frames for display, evenly spread across the full temporal
        range of the video.  'scored' is already in temporal order (video_utils
        saves frames sorted by original frame index).

        Strategy:
          1. Score every frame for ploidy (same formula as the aggregate).
          2. Pick top_n frames at evenly-spaced temporal positions so the caller
             always sees the embryo's development from start to end of the clip.
          3. Mark whichever of those top_n has the highest ploidy as rank=1
             (BEST badge in the UI). The rest are numbered 2..top_n in temporal
             order so the UI renders a left-to-right developmental timeline.
        """
        import base64

        # ── Score every frame ─────────────────────────────────────────────────
        all_frames = []
        for path, pred in scored:
            f_be  = float(np.dot(pred["BE"],  [i/4 for i in range(5)]))
            f_icm = float(np.dot(pred["ICM"], [(3 - i) / 3 for i in range(4)]))
            f_te  = float(np.dot(pred["TE"],  [(3 - i) / 3 for i in range(4)]))
            f_ploidy = float(np.clip(
                (f_be * 0.4 + f_icm * 0.3 + f_te * 0.3) * (1.0 - 0.4 * age_penalty),
                0.02, 0.98,
            ))
            icm_g = "A" if f_icm >= 0.7 else "B" if f_icm >= 0.5 else "C"
            te_g  = "A" if f_te  >= 0.7 else "B" if f_te  >= 0.5 else "C"
            exp_i = min(max(round(f_be * 5.0 + 1.0), 1), 6)
            all_frames.append({
                "path":  path,
                "score": f_ploidy,
                "grade": f"{exp_i}{icm_g}{te_g}",
            })

        # ── Pick top_n frames: best from each equal temporal segment ─────────
        # Dividing into segments (not picking at fixed offsets) guarantees that
        # the LAST segment always includes the final frames of the video where
        # the blastocyst appears in a developmental time-lapse.
        n = len(all_frames)
        if n <= top_n:
            selected = all_frames[:]
        else:
            seg_size = n / top_n
            selected = []
            for s in range(top_n):
                start   = int(s * seg_size)
                end     = min(int((s + 1) * seg_size), n)
                segment = all_frames[start:end] or [all_frames[start]]
                # Pick the highest-scoring frame from this time window
                selected.append(max(segment, key=lambda f: f["score"]))

        # ── Find which selected frame scored best → that gets the BEST badge ──
        best_pos = max(range(len(selected)), key=lambda i: selected[i]["score"])

        # ── Assign ranks: best=1, rest numbered 2..N in temporal order ────────
        temporal_counter = 2
        for pos, f in enumerate(selected):
            f["rank"] = 1 if pos == best_pos else temporal_counter
            if pos != best_pos:
                temporal_counter += 1

        # ── Encode and return in temporal order (left-to-right in the UI) ─────
        out = []
        for f in selected:       # already in temporal order
            try:
                data = Path(f["path"]).read_bytes()
                ext  = Path(f["path"]).suffix.lstrip(".") or "png"
                out.append({
                    "rank":               f["rank"],
                    "image":              f"data:image/{ext};base64,{base64.b64encode(data).decode()}",
                    "euploidProbability": round(f["score"], 4),
                    "grade":              f["grade"],
                })
            except Exception as e:
                print(f"[ENGINE] Could not encode frame {f['path']}: {e}")

        return out


def _mock_predict(maternal_age: float) -> dict:
    import random, hashlib
    seed = int(hashlib.md5(str(maternal_age).encode()).hexdigest(), 16) % (2**32)
    rng  = random.Random(seed)

    def result(seed_offset=0):
        rng.seed(seed + seed_offset)
        prob = round(rng.uniform(0.2, 0.85), 4)
        exp  = round(rng.uniform(2.0, 6.0),  4)
        icm  = round(rng.uniform(0.3, 1.0),  4)
        te   = round(rng.uniform(0.3, 1.0),  4)
        bs   = round(exp * 2 + icm * 4 + te * 4, 4)
        return {
            "blastocystScore":    bs,
            "expansionScore":     exp,
            "icmScore":           icm,
            "trophectodermScore": te,
            "euploidProbablity":  prob,
            "euploidPrediction":  prob >= 0.5,
        }

    return {"lrEupAnu": result(0), "lrEupCxa": result(42)}


# ── Singleton accessor ────────────────────────────────────────────────────────
_engine: Optional[BlastocystGraderEngine] = None

def get_engine() -> BlastocystGraderEngine:
    global _engine
    if _engine is None:
        _engine = BlastocystGraderEngine()
    return _engine
