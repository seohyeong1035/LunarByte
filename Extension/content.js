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

      const response = await fetch('http://localhost:8000/analyze-frame', {
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

  updateOverlay(result) {
    if (!this.overlayElement) return;

    const statusElement = this.overlayElement.querySelector('.lunarbyte-status');
    const resultElement = this.overlayElement.querySelector('.lunarbyte-result');

    if (result.error) {
      statusElement.textContent = 'Error';
      resultElement.innerHTML = `<span class="error">${result.error}</span>`;
      return;
    }

    if (result.status === 'analyzing') {
      statusElement.textContent = 'Analyzing video...';
      resultElement.innerHTML = '<div class="loading-spinner"></div>';
      return;
    }

    // 딥페이크 결과 표시
    const confidence = result.confidence || 0;
    const isDeepfake = result.is_deepfake || false;

    statusElement.textContent = isDeepfake ? '⚠️ Deepfake Detected' : '✅ Authentic Video';
    statusElement.className = `lunarbyte-status ${isDeepfake ? 'deepfake' : 'authentic'}`;

    resultElement.innerHTML = `
      <div class="confidence-bar">
        <div class="confidence-fill" style="width: ${confidence * 100}%"></div>
      </div>
      <div class="confidence-text">Confidence: ${(confidence * 100).toFixed(1)}%</div>
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