from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import torch
import numpy as np
from io import BytesIO
from PIL import Image
import cv2
import re
import os
import sys

sys.path.append(os.path.abspath("../dfdc_deepfake_challenge"))

from training.zoo.classifiers import DeepFakeClassifier  # DFDC 모델 정의

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

device = "cuda" if torch.cuda.is_available() else "cpu"

# weight 파일 경로
weight_paths = [
    "./weights/final_111_DeepFakeClassifier_tf_efficientnet_b7_ns_0_36",
    "./weights/final_555_DeepFakeClassifier_tf_efficientnet_b7_ns_0_19",
    "./weights/final_777_DeepFakeClassifier_tf_efficientnet_b7_ns_0_29",
    "./weights/final_777_DeepFakeClassifier_tf_efficientnet_b7_ns_0_31",
    "./weights/final_888_DeepFakeClassifier_tf_efficientnet_b7_ns_0_37",
    "./weights/final_999_DeepFakeClassifier_tf_efficientnet_b7_ns_0_23",
]

# 모델 로드
models = []
for path in weight_paths:
    model = DeepFakeClassifier(encoder="tf_efficientnet_b7_ns").to(device)
    checkpoint = torch.load(path, map_location=device, weights_only=False)
    state_dict = checkpoint.get("state_dict", checkpoint)
    state_dict = {re.sub("^module.", "", k): v for k, v in state_dict.items()}
    model.load_state_dict(state_dict, strict=True)
    model.eval()
    models.append(model)

print(f" {len(models)}개의 DeepFakeClassifier 모델 로드 완료")

@app.get("/")
def root():
    return {"message": "Deepfake Server Running with DFDC Ensemble Model!"}

@app.post("/analyze-frame/")
async def analyze_frame(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(BytesIO(contents)).convert("RGB")

    img_np = np.array(image)
    img_resized = cv2.resize(img_np, (380, 380))
    img_tensor = torch.tensor(img_resized).permute(2, 0, 1).unsqueeze(0).float() / 255.0
    img_tensor = img_tensor.to(device)

    # 모델 확률 평균
    probs = []
    with torch.no_grad():
        for model in models:
            output = model(img_tensor)
            prob = torch.sigmoid(output).item()
            probs.append(prob)

    avg_prob = float(np.mean(probs))

    status_label = "딥페이크 확률 높음!" if avg_prob > 0.5 else "딥페이크 확률 낮음"

    return JSONResponse(content={
        "deepfake_probability": avg_prob,
        "result" : status_label
    })
