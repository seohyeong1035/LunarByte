import React, { useRef, useState } from "react";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [result, setResult] = useState(null);

  const startCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      videoRef.current.srcObject = stream;

      // 디버그 로그
      console.log("화면 공유 시작됨");

      videoRef.current.onloadedmetadata = () => {
        console.log("비디오 메타데이터 로드됨:", videoRef.current.videoWidth, videoRef.current.videoHeight);

        setInterval(() => {
          console.log("captureFrame 호출됨");
          captureFrame();
        }, 2000);
      };

    } catch (err) {
      console.error("화면 공유 실패:", err);
    }
  };

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!video || !canvas) return;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn("비디오 크기 준비 안 됨");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

     canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append("file", blob, "frame.png");

      try {
        // 서버에 업로드
        const response = await fetch("http://127.0.0.1:8000/analyze-frame/", {
          method: "POST",
          body: formData,
        });

         const data = await response.json();
        console.log("서버 응답:", data);
        setResult(data); //  결과를 state에 저장해서 화면 표시 가능
      } catch (error) {
        console.error("서버 요청 실패:", error);
      }
    }, "image/png");
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Deepfake Checker</h1>
      <button onClick={startCapture}>화면 공유 시작</button>
      <div style={{ marginTop: "20px" }}>
        <video ref={videoRef} autoPlay playsInline width="600" />
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>

      {result && (
        <div style={{ marginTop: "20px" }}>
          <h3>분석 결과:</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default App;
