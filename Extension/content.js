class DeepfakeDetector {
  constructor() {
    this.detectionInterval = null;
    this.overlayElement = null;
    this.lastAnalyzedTime = 0;
    this.analysisInterval = 5000; // 5초마다 분석
    this.initializeDetector();
  }

  initializeDetector() {
    this.observeVideos();
    this.createOverlay();
  }

  observeVideos() {
    // 기존 비디오 감지
    this.detectExistingVideos();

    // 새로 추가되는 비디오 감지
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.checkForVideos(node);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  detectExistingVideos() {
    const videos = document.querySelectorAll('video');
    videos.forEach(video => this.setupVideoMonitoring(video));
  }

  checkForVideos(element) {
    if (element.tagName === 'VIDEO') {
      this.setupVideoMonitoring(element);
    } else {
      const videos = element.querySelectorAll('video');
      videos.forEach(video => this.setupVideoMonitoring(video));
    }
  }

  setupVideoMonitoring(video) {
    if (video.dataset.deepfakeMonitored) return;

    video.dataset.deepfakeMonitored = 'true';
    console.log('LunarByte: Video detected, setting up monitoring');

    video.addEventListener('play', () => {
      this.startAnalysis(video);
    });

    video.addEventListener('pause', () => {
      this.stopAnalysis();
    });

    video.addEventListener('ended', () => {
      this.stopAnalysis();
    });

    // 이미 재생 중인 비디오 처리
    if (!video.paused && !video.ended) {
      this.startAnalysis(video);
    }
  }

  startAnalysis(video) {
    this.stopAnalysis(); // 기존 분석 중지

    this.detectionInterval = setInterval(() => {
      this.analyzeCurrentFrame(video);
    }, this.analysisInterval);

    this.showOverlay();
  }

  stopAnalysis() {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }
    this.hideOverlay();
  }

  async analyzeCurrentFrame(video) {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 캔버스를 blob으로 변환
      canvas.toBlob(async (blob) => {
        if (blob) {
          await this.sendFrameForAnalysis(blob);
        }
      }, 'image/jpeg', 0.8);

    } catch (error) {
      console.error('LunarByte: Frame analysis error:', error);
    }
  }

  async sendFrameForAnalysis(frameBlob) {
    try {
      // Backend API 호출
      const formData = new FormData();
      formData.append('file', frameBlob, 'frame.jpg');

      const response = await fetch('http://127.0.0.1:8000/analyze-frame/', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        this.updateOverlay(result);
      } else {
        console.error('LunarByte: API error:', response.status);
        this.updateOverlay({ error: 'Analysis failed' });
      }
    } catch (error) {
      console.error('LunarByte: Network error:', error);
      this.updateOverlay({ error: 'Connection failed' });
    }
  }

  createOverlay() {
    this.overlayElement = document.createElement('div');
    this.overlayElement.id = 'lunarbyte-overlay';
    this.overlayElement.innerHTML = `
      <div class="lunarbyte-header">
        <span class="lunarbyte-logo">🌙 LunarByte</span>
        <button class="lunarbyte-close" onclick="this.parentElement.parentElement.style.display='none'">×</button>
      </div>
      <div class="lunarbyte-content">
        <div class="lunarbyte-status">Analyzing...</div>
        <div class="lunarbyte-result"></div>
      </div>
    `;

    document.body.appendChild(this.overlayElement);
  }

  showOverlay() {
    if (this.overlayElement) {
      this.overlayElement.style.display = 'block';
      this.updateOverlay({ status: 'analyzing' });
    }
  }

  hideOverlay() {
    if (this.overlayElement) {
      this.overlayElement.style.display = 'none';
    }
  }

  getStatusColor(probability) {
    if (!probability && probability !== 0) return "rgba(255,255,255,0.2)";
    if (probability > 70) return "#ef4444";
    if (probability > 40) return "#f59e0b";
    return "#10b981";
  }

  getStatusText(probability) {
    if (!probability && probability !== 0) return "Analyzing...";
    if (probability > 70) return "HIGH RISK - Likely Deepfake";
    if (probability > 40) return "MEDIUM RISK - Possible Deepfake";
    return "LOW RISK - Likely Authentic";
  }

  updateOverlay(result) {
    if (!this.overlayElement) return;

    const statusElement = this.overlayElement.querySelector('.lunarbyte-status');
    const resultElement = this.overlayElement.querySelector('.lunarbyte-result');

    if (result.error) {
      statusElement.textContent = 'Connection Error';
      statusElement.style.color = '#ef4444';
      resultElement.innerHTML = `<span style="color: #ef4444; font-size: 12px;">${result.error}</span>`;
      return;
    }

    if (result.status === 'analyzing') {
      statusElement.textContent = 'Analyzing video...';
      statusElement.style.color = 'rgba(255,255,255,0.7)';
      resultElement.innerHTML = '<div class="loading-spinner"></div>';
      return;
    }

    // 프론트엔드와 같은 스타일로 딥페이크 결과 표시
    const probability = result.deepfake_probability * 100;
    const statusColor = this.getStatusColor(probability);
    const statusText = this.getStatusText(probability);

    statusElement.textContent = statusText;
    statusElement.style.color = statusColor;
    statusElement.style.fontSize = '11px';
    statusElement.style.fontWeight = '500';
    statusElement.style.textTransform = 'uppercase';
    statusElement.style.letterSpacing = '0.05em';
    statusElement.style.marginBottom = '8px';

    resultElement.innerHTML = `
      <div style="
        font-size: 24px;
        font-weight: 600;
        line-height: 1;
        letter-spacing: -0.02em;
        margin-bottom: 8px;
        color: ${statusColor};
      ">
        ${probability !== undefined ? `${Math.round(probability)}%` : 'Processing...'}
      </div>
      <div style="
        font-size: 10px;
        opacity: 0.6;
        font-weight: 400;
        margin-bottom: 8px;
      ">
        Deepfake Probability
      </div>
      ${result.timestamp ? `
        <div style="
          font-size: 9px;
          opacity: 0.6;
        ">
          Last updated: ${new Date(result.timestamp).toLocaleTimeString()}
        </div>
      ` : ''}
    `;
  }
}

// 페이지 로드 완료 후 감지기 시작
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new DeepfakeDetector();
  });
} else {
  new DeepfakeDetector();
}