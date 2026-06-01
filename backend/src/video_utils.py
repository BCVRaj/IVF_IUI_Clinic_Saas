"""Extract every frame from an embryo time-lapse video."""
from pathlib import Path
from typing import List


def extract_frames_from_video(
    video_path: str,
    output_dir: str,
) -> List[str]:
    """
    Extract every frame from an embryo time-lapse video.

    No frames are skipped — the full developmental timeline is preserved.
    The caller (engine.predict) decides how many frames to use for the
    aggregate prediction via its own filtering logic.
    """
    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    try:
        import cv2
        from PIL import Image

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise RuntimeError(f"Cannot open video: {video_path}")

        paths: List[str] = []
        idx = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            p = out_dir / f"frame_{idx:06d}.png"
            Image.fromarray(rgb).save(p)
            paths.append(str(p))
            idx += 1

        cap.release()

        if not paths:
            raise RuntimeError("No frames could be read from video.")

        print(f"[VIDEO] Extracted {len(paths)} frames from {video_path}")
        return paths

    except ImportError:
        raise RuntimeError(
            "opencv-python not installed. Run: pip install opencv-python"
        )
