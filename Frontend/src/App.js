import { useRef, useState, useEffect } from "react";
import "./App.css";

const themes = {
  dark: {
    name: "Dark",
    bg: "#000",
    bgSecondary: "rgba(255,255,255,0.03)",
    text: "#fff",
    textSecondary: "rgba(255,255,255,0.7)",
    border: "rgba(255,255,255,0.1)",
    borderLight: "rgba(255,255,255,0.08)",
    buttonBg: "#fff",
    buttonText: "#000",
    buttonBorder: "rgba(255,255,255,0.1)",
    overlayBg: "rgba(0, 0, 0, 0.9)",
  },
  light: {
    name: "Light",
    bg: "#fff",
    bgSecondary: "rgba(0,0,0,0.03)",
    text: "#000",
    textSecondary: "rgba(0,0,0,0.7)",
    border: "rgba(0,0,0,0.1)",
    borderLight: "rgba(0,0,0,0.08)",
    buttonBg: "#000",
    buttonText: "#fff",
    buttonBorder: "rgba(0,0,0,0.1)",
    overlayBg: "rgba(255, 255, 255, 0.95)",
  },
};

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const [result, setResult] = useState(null);
  const [isInPiP, setIsInPiP] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");

    return savedTheme && themes[savedTheme] ? savedTheme : "dark";
  });
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const intervalRef = useRef(null);

  const theme = themes[currentTheme] || themes.dark;

  useEffect(() => {
    localStorage.setItem("theme", currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showThemeMenu && !event.target.closest(".theme-menu")) {
        setShowThemeMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showThemeMenu]);

  const startCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      videoRef.current.srcObject = stream;
      setIsCapturing(true);

      console.log("화면 공유 시작됨");

      videoRef.current.onloadedmetadata = () => {
        console.log(
          "비디오 메타데이터 로드됨:",
          videoRef.current.videoWidth,
          videoRef.current.videoHeight
        );

        intervalRef.current = setInterval(() => {
          console.log("captureFrame 호출됨");
          captureFrame();
        }, 2000);
      };

      stream.getVideoTracks()[0].onended = () => {
        stopCapture();
      };
    } catch (err) {
      console.error("화면 공유 실패:", err);
    }
  };

  const stopCapture = () => {
    const video = videoRef.current;
    if (video && video.srcObject) {
      const tracks = video.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      video.srcObject = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsCapturing(false);
    setResult(null);
    if (isInPiP) {
      exitPiPMode();
    }
  };

  const enterPiPMode = async () => {
    try {
      if (!document.pictureInPictureEnabled) {
        alert("Picture-in-Picture is not supported in this browser");
        return;
      }

      const video = videoRef.current;
      if (video && video.srcObject) {
        await video.requestPictureInPicture();
      } else {
        alert("Please start screen capture first");
      }
    } catch (error) {
      console.error("Failed to enter PiP mode:", error);
    }
  };

  const exitPiPMode = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      }
    } catch (error) {
      console.error("Failed to exit PiP mode:", error);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnterPiP = () => {
      setIsInPiP(true);
      console.log("Entered PiP mode");
    };

    const handleLeavePiP = () => {
      setIsInPiP(false);
      console.log("Left PiP mode");
    };

    video.addEventListener("enterpictureinpicture", handleEnterPiP);
    video.addEventListener("leavepictureinpicture", handleLeavePiP);

    return () => {
      video.removeEventListener("enterpictureinpicture", handleEnterPiP);
      video.removeEventListener("leavepictureinpicture", handleLeavePiP);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

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
        const response = await fetch("http://127.0.0.1:8000/analyze-frame/", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        console.log("서버 응답:", data);
        setResult(data);
      } catch (error) {
        console.error("서버 요청 실패:", error);
      }
    }, "image/png");
  };

  const getStatusColor = (probability) => {
    if (!probability && probability !== 0) return "rgba(255,255,255,0.2)";
    if (probability > 70) return "#ef4444";
    if (probability > 40) return "#f59e0b";
    return "#10b981";
  };

  const getStatusText = (probability) => {
    if (!probability && probability !== 0) return "Analyzing...";
    if (probability > 70) return "HIGH RISK - Likely Deepfake";
    if (probability > 40) return "MEDIUM RISK - Possible Deepfake";
    return "LOW RISK - Likely Authentic";
  };

  return (
    <div
      style={{
        padding: "48px 24px",
        backgroundColor: theme.bg,
        minHeight: "100vh",
        color: theme.text,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', 'Roboto', sans-serif",
        transition: "all 0.3s ease",
      }}
    >
      <div
        style={{ maxWidth: "1200px", margin: "0 auto", position: "relative" }}
      >
        <div
          className="theme-menu"
          style={{
            position: "absolute",
            top: "0",
            right: "0",
            zIndex: 10,
          }}
        >
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            style={{
              padding: "8px 16px",
              fontSize: "13px",
              backgroundColor: theme.buttonBg,
              color: theme.buttonText,
              border: `1px solid ${theme.buttonBorder}`,
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            Theme: {themes[currentTheme]?.name}
          </button>

          {showThemeMenu && (
            <div
              style={{
                position: "absolute",
                top: "40px",
                right: "0",
                backgroundColor: theme.bg,
                border: `1px solid ${theme.border}`,
                borderRadius: "8px",
                padding: "8px",
                minWidth: "150px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            >
              {Object.keys(themes).map((themeName) => (
                <button
                  key={themeName}
                  onClick={() => {
                    setCurrentTheme(themeName);
                    setShowThemeMenu(false);
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "13px",
                    backgroundColor:
                      currentTheme === themeName
                        ? theme.bgSecondary
                        : "transparent",
                    color: theme.text,
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    textAlign: "left",
                    fontWeight: currentTheme === themeName ? "600" : "400",
                  }}
                >
                  {themes[themeName].name}
                </button>
              ))}
            </div>
          )}
        </div>

        <h1
          style={{
            textAlign: "center",
            marginBottom: "48px",
            fontSize: "32px",
            fontWeight: "600",
            letterSpacing: "-0.02em",
            color: theme.text,
          }}
        >
          LunarByte Deepfake Detector
        </h1>

        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "center",
            marginBottom: "20px",
          }}
        >
          {!isCapturing ? (
            <button
              onClick={startCapture}
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                backgroundColor: theme.buttonBg,
                color: theme.buttonText,
                border: `1px solid ${theme.buttonBorder}`,
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              Start Screen Capture
            </button>
          ) : (
            <>
              <button
                onClick={stopCapture}
                style={{
                  padding: "10px 20px",
                  fontSize: "14px",
                  backgroundColor: "#dc2626",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Stop Capture
              </button>
              <button
                onClick={isInPiP ? exitPiPMode : enterPiPMode}
                style={{
                  padding: "10px 20px",
                  fontSize: "14px",
                  backgroundColor: "transparent",
                  color: theme.text,
                  border: `1px solid ${theme.border}`,
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                {isInPiP ? "Exit PiP Mode" : "Enter PiP Mode"}
              </button>
            </>
          )}
        </div>

        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "center",
            width: "100%",
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{
              width: "100%",
              maxWidth: "900px",
              borderRadius: "12px",
              border: `1px solid ${theme.border}`,
              backgroundColor: currentTheme === "light" ? "#f5f5f5" : "#000",
            }}
          />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          <canvas ref={overlayCanvasRef} style={{ display: "none" }} />

          {isCapturing && result && (
            <div
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                backgroundColor: theme.overlayBg,
                padding: "16px",
                borderRadius: "8px",
                border: `1px solid ${getStatusColor(result.fake_probability)}`,
                backdropFilter: "blur(10px)",
                minWidth: "250px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "500",
                  marginBottom: "8px",
                  color: getStatusColor(result.fake_probability),
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {getStatusText(result.fake_probability)}
              </div>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "600",
                  lineHeight: "1",
                  letterSpacing: "-0.02em",
                }}
              >
                {result.fake_probability !== undefined
                  ? `${Math.round(result.fake_probability)}%`
                  : "Processing..."}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  marginTop: "8px",
                  opacity: 0.6,
                  fontWeight: "400",
                }}
              >
                Deepfake Probability
              </div>
              {result.timestamp && (
                <div
                  style={{
                    fontSize: "10px",
                    marginTop: "10px",
                    opacity: 0.6,
                  }}
                >
                  Last updated:{" "}
                  {new Date(result.timestamp).toLocaleTimeString()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        {!isCapturing && (
          <div
            style={{
              marginTop: "64px",
              padding: "32px",
              backgroundColor: theme.bgSecondary,
              border: `1px solid ${theme.borderLight}`,
              borderRadius: "12px",
              maxWidth: "600px",
              margin: "64px auto 0",
            }}
          >
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "600",
                marginBottom: "16px",
                color: theme.text,
              }}
            >
              How to use
            </h3>
            <ol
              style={{
                textAlign: "left",
                fontSize: "14px",
                lineHeight: "1.8",
                color: theme.textSecondary,
                paddingLeft: "20px",
              }}
            >
              <li>Click "Start Screen Capture" to share your screen</li>
              <li>
                Select the window or screen with the video you want to analyze
              </li>
              <li>
                The system will automatically analyze frames every 2 seconds
              </li>
              <li>Use PiP mode to keep monitoring while using other tabs</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
