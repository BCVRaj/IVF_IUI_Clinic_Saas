"""
app.py — FastAPI Blastocyst Grading Server
==========================================
VGG16 multi-label blastocyst grader (BE / ICM / TE)
Based on Lockhart et al. MMSP2019, ported to PyTorch + FastAPI.

Endpoints:
  GET  /api/healthcheck       → server & model status
  POST /api/login             → session auth (Bearer token + cookie)
  POST /api/stork/predict     → main inference
  GET  /docs                  → OpenAPI docs
"""

import os, sys, json, uuid, datetime, pathlib
from ast import literal_eval
from contextlib import asynccontextmanager

sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI, Request, File, Form, UploadFile, HTTPException, Depends
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from model import get_engine
from video_utils import extract_frames_from_video

VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".webm", ".mpg", ".mpeg"}

# ── Auth ──────────────────────────────────────────────────────────────────────
_users_env = os.environ.get("USERS_DICT", '{"admin": "embryo2024", "test": "test123"}')
USERS_DICT: dict    = literal_eval(_users_env)
INTERNAL_KEY: str   = os.environ.get("FEMI_INTERNAL_KEY", "femi-internal-2024")
_active_tokens: set = set()

# ── Upload dir ────────────────────────────────────────────────────────────────
UPLOAD_DIR = pathlib.Path(__file__).parent.parent / "data" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# ── Startup ───────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    import asyncio
    loop = asyncio.get_event_loop()
    print("[SERVER] Pre-loading model at startup…")
    await loop.run_in_executor(None, get_engine)
    print("[SERVER] Model ready.")
    yield

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Blastocyst Grading API",
    description="VGG16 Gardner grading (BE/ICM/TE) + ploidy prediction",
    version="3.0.0",
    lifespan=lifespan,
    docs_url=None if os.environ.get("DISABLE_DOCS") else "/docs",
    redoc_url=None if os.environ.get("DISABLE_DOCS") else "/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Auth helpers ──────────────────────────────────────────────────────────────

def require_auth(request: Request) -> str:
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth.split(" ", 1)[1]
        if token == INTERNAL_KEY or token in _active_tokens:
            return token
    cookie = request.cookies.get("stork-auth", "")
    if cookie and cookie in _active_tokens:
        return cookie
    raise HTTPException(status_code=401, detail="Unauthorised. POST /api/login to obtain a token.")


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse)
async def index():
    engine = get_engine()
    mode = "MOCK" if engine.mock else "REAL inference"
    return f"""<html><body>
    <h2>Blastocyst Grading API v3.0</h2>
    <p>Status: <strong>Online</strong> | Mode: <strong>{mode}</strong></p>
    <p><a href="/docs">Docs</a> | <a href="/api/healthcheck">Healthcheck</a></p>
    </body></html>"""


@app.get("/api/healthcheck")
async def healthcheck():
    engine = get_engine()
    return {
        "status":  "Healthy",
        "version": "3.0.0",
        "model":   "VGG16 Blastocyst Grader (MMSP2019)",
        "mode":    "MOCK — run scripts/train.py" if engine.mock else "REAL inference",
    }


@app.post("/api/login")
async def login(request: Request):
    form = await request.form()
    username = str(form.get("username", ""))
    password = str(form.get("password", ""))
    if USERS_DICT.get(username) != password:
        raise HTTPException(status_code=401, detail="Invalid credentials.")
    token = str(uuid.uuid4())
    _active_tokens.add(token)
    response = JSONResponse({"token": token, "username": username})
    response.set_cookie("stork-auth", token, max_age=86400, httponly=True, samesite="lax")
    return response


@app.post("/api/logout")
async def logout(token: str = Depends(require_auth)):
    _active_tokens.discard(token)
    response = JSONResponse({"status": "logged out"})
    response.delete_cookie("stork-auth")
    return response


@app.post("/api/stork/predict")
async def predict(
    data:   str              = Form(...),
    images: list[UploadFile] = File(default=[]),
    _auth:  str              = Depends(require_auth),
):
    try:
        meta         = json.loads(data)
        maternal_age = float(meta["maternalAge"])
    except Exception:
        raise HTTPException(status_code=400, detail='Invalid data JSON. Expected: {"maternalAge": <float>}')

    if not images:
        raise HTTPException(status_code=400, detail="At least 1 image or video file required.")

    ts      = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")
    req_dir = UPLOAD_DIR / ts
    req_dir.mkdir(parents=True, exist_ok=True)

    image_paths = []
    for upload in images:
        name = pathlib.Path(upload.filename or "file").name
        dest = req_dir / name
        dest.write_bytes(await upload.read())
        ext  = dest.suffix.lower()

        if ext in VIDEO_EXTENSIONS:
            try:
                frames_dir  = req_dir / "frames"
                frames_dir.mkdir(exist_ok=True)
                frame_paths = extract_frames_from_video(str(dest), str(frames_dir))
                image_paths.extend(frame_paths)
            except Exception as e:
                raise HTTPException(status_code=422, detail=f"Video extraction failed: {e}")
        else:
            image_paths.append(str(dest))

    if not image_paths:
        raise HTTPException(status_code=422, detail="No usable images found.")

    try:
        engine = get_engine()
        result = engine.predict(image_paths, maternal_age)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {e}")

    return JSONResponse(content=result)


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8081))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False, workers=1)
