"""
train.py — PyTorch port of Lockhart et al. MMSP2019
     VGG16 multi-label blastocyst grader (BE / ICM / TE)
Usage:
  python scripts/train.py              # generates synthetic data + trains
  python scripts/train.py --epochs 50
"""
import os, sys, re, csv, math, random, argparse
from pathlib import Path
import numpy as np
import torch, torch.nn as nn, torch.optim as optim
from torch.utils.data import Dataset, DataLoader, random_split
from torchvision import transforms
from PIL import Image

SCRIPT_DIR  = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
SRC_DIR     = PROJECT_DIR / "src"
sys.path.insert(0, str(SRC_DIR))

from model import BlastocystGrader, TRAIN_TRANSFORM, INFERENCE_TRANSFORM, WEIGHTS_PATH, MODELS_DIR, get_device

DEVICE = get_device()
print(f"[TRAIN] Device: {DEVICE}", flush=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)

REAL_DATA_DIR = PROJECT_DIR / "data" / "blastocyst"
REAL_CSV      = REAL_DATA_DIR / "Gardner_train_silver.csv"
REAL_IMG_DIR  = REAL_DATA_DIR / "Images"

# ── Dataset loader ────────────────────────────────────────────────────────────

def load_real_samples():
    """Load 2,043 real annotated blastocyst images from Gardner_train_silver.csv."""
    if not REAL_CSV.exists() or not REAL_IMG_DIR.exists():
        return []
    samples = []
    with open(REAL_CSV) as f:
        reader = csv.DictReader(f, delimiter=';')
        for row in reader:
            img_path = REAL_IMG_DIR / row['Image'].strip()
            if not img_path.exists():
                continue
            samples.append({
                "path": str(img_path),
                "be":   int(row['EXP_silver']),
                "icm":  int(row['ICM_silver']),
                "te":   int(row['TE_silver']),
            })
    print(f"[TRAIN] Loaded {len(samples)} real labelled samples from {REAL_CSV}", flush=True)
    return samples


class BlastocystDataset(Dataset):
    def __init__(self, samples, transform):
        self.samples   = samples
        self.transform = transform

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        s   = self.samples[idx]
        img = Image.open(s["path"]).convert("RGB")
        x   = self.transform(img)
        return x, torch.tensor(s["be"], dtype=torch.long), \
                  torch.tensor(s["icm"], dtype=torch.long), \
                  torch.tensor(s["te"],  dtype=torch.long)


# ── Training ──────────────────────────────────────────────────────────────────

def train(samples, epochs=50, batch_size=16, lr=1e-5):
    n_train = int(len(samples) * 0.85)
    n_val   = len(samples) - n_train
    train_s, val_s = random_split(
        samples, [n_train, n_val], generator=torch.Generator().manual_seed(42))

    _pin = DEVICE.type == "cuda"
    _nw  = 0  # MPS requires 0 workers
    train_dl = DataLoader(BlastocystDataset(list(train_s), TRAIN_TRANSFORM),
                          batch_size=batch_size, shuffle=True,  num_workers=_nw, pin_memory=_pin)
    val_dl   = DataLoader(BlastocystDataset(list(val_s),   INFERENCE_TRANSFORM),
                          batch_size=batch_size, shuffle=False, num_workers=_nw, pin_memory=_pin)

    # Try pretrained weights; fall back to random init if network is unavailable
    try:
        model = BlastocystGrader(pretrained=True).to(DEVICE)
        print("[TRAIN] VGG16 backbone: ImageNet pretrained", flush=True)
    except Exception as e:
        print(f"[TRAIN] Pretrained download failed ({e}) — using random init", flush=True)
        model = BlastocystGrader(pretrained=False).to(DEVICE)
    criterion = nn.CrossEntropyLoss()

    # Paper uses Adam lr=1e-5
    optimizer = optim.Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=lr)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, factor=0.3, patience=10, min_lr=1e-7)

    best_val, best_state = float("inf"), None

    for epoch in range(1, epochs + 1):
        model.train()
        train_loss = 0.0
        for x, be, icm, te in train_dl:
            x, be, icm, te = x.to(DEVICE), be.to(DEVICE), icm.to(DEVICE), te.to(DEVICE)
            out = model(x)
            loss = (criterion(out["BE"], be) +
                    criterion(out["ICM"], icm) +
                    criterion(out["TE"], te)) / 3.0
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            train_loss += loss.item()

        model.eval()
        val_loss, correct_be, correct_icm, correct_te, total = 0.0, 0, 0, 0, 0
        with torch.no_grad():
            for x, be, icm, te in val_dl:
                x, be, icm, te = x.to(DEVICE), be.to(DEVICE), icm.to(DEVICE), te.to(DEVICE)
                out = model(x)
                loss = (criterion(out["BE"], be) +
                        criterion(out["ICM"], icm) +
                        criterion(out["TE"], te)) / 3.0
                val_loss    += loss.item()
                correct_be  += (out["BE"].argmax(1)  == be).sum().item()
                correct_icm += (out["ICM"].argmax(1) == icm).sum().item()
                correct_te  += (out["TE"].argmax(1)  == te).sum().item()
                total       += len(be)

        train_loss /= len(train_dl)
        val_loss   /= len(val_dl)
        acc_be  = correct_be  / total * 100
        acc_icm = correct_icm / total * 100
        acc_te  = correct_te  / total * 100
        scheduler.step(val_loss)

        print(f"  Epoch {epoch:3d}/{epochs}  "
              f"train={train_loss:.4f}  val={val_loss:.4f}  "
              f"acc BE={acc_be:.1f}% ICM={acc_icm:.1f}% TE={acc_te:.1f}%", flush=True)

        if val_loss < best_val:
            best_val   = val_loss
            best_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}

    torch.save(best_state, WEIGHTS_PATH)
    print(f"\n[TRAIN] ✅ Saved weights → {WEIGHTS_PATH}", flush=True)
    print(f"[TRAIN]    Best val loss: {best_val:.4f}", flush=True)


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs",     type=int,   default=50)
    parser.add_argument("--batch-size", type=int,   default=16)
    parser.add_argument("--lr",         type=float, default=1e-5)
    args = parser.parse_args()

    samples = load_real_samples()

    if len(samples) < 20:
        print("[TRAIN] ERROR: Real dataset not found. Check data/blastocyst/", flush=True)
        sys.exit(1)

    print(f"\n[TRAIN] Starting: {len(samples)} real samples, {args.epochs} epochs, device={DEVICE}", flush=True)
    train(samples, epochs=args.epochs, batch_size=args.batch_size, lr=args.lr)
    print("\n[TRAIN] Done! Start the server:  ./start.sh", flush=True)


if __name__ == "__main__":
    main()
