document.addEventListener('DOMContentLoaded', function() {
  const toggleSwitch = document.getElementById('detection-toggle');
  const status = document.getElementById('status');
  const videosAnalyzed = document.getElementById('videos-analyzed');
  const deepfakesDetected = document.getElementById('deepfakes-detected');
  const accuracyRate = document.getElementById('accuracy-rate');
  const settingsBtn = document.getElementById('settings-btn');

  // 설정 로드
  loadSettings();

  // 통계 로드
  loadStats();

  // 토글 변경 이벤트
  toggleSwitch.addEventListener('change', function() {
    const isEnabled = this.checked;

    chrome.runtime.sendMessage({
      action: 'saveSettings',
      settings: { isEnabled: isEnabled }
    }, (response) => {
      updateStatus(isEnabled);

      // 현재 탭에 설정 변경 알림
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'toggleDetection',
          enabled: isEnabled
        });
      });
    });
  });

  // 설정 버튼 클릭
  settingsBtn.addEventListener('click', function() {
    chrome.tabs.create({ url: 'options.html' });
  });

  function loadSettings() {
    chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
      if (response) {
        toggleSwitch.checked = response.isEnabled !== false;
        updateStatus(response.isEnabled !== false);
      }
    });
  }

  function updateStatus(enabled) {
    status.textContent = enabled ? 'Active on this page' : 'Disabled';
    status.style.color = enabled ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 100, 100, 0.8)';
  }

  function loadStats() {
    chrome.storage.local.get(['stats'], (result) => {
      const stats = result.stats || {
        videosAnalyzed: 0,
        deepfakesDetected: 0,
        totalFrames: 0,
        correctDetections: 0
      };

      videosAnalyzed.textContent = stats.videosAnalyzed;
      deepfakesDetected.textContent = stats.deepfakesDetected;

      if (stats.totalFrames > 0) {
        const accuracy = ((stats.correctDetections / stats.totalFrames) * 100).toFixed(1);
        accuracyRate.textContent = accuracy + '%';
      } else {
        accuracyRate.textContent = '--';
      }
    });
  }

  // 5초마다 통계 업데이트
  setInterval(loadStats, 5000);
});