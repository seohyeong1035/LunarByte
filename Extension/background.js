// 확장 프로그램 설치/업데이트 시 실행
chrome.runtime.onInstalled.addListener(() => {
  console.log('LunarByte Deepfake Detector installed');

  // 기본 설정 저장
  chrome.storage.local.set({
    isEnabled: true,
    analysisInterval: 5000,
    apiEndpoint: 'http://localhost:8000'
  });
});

// 메시지 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSettings') {
    chrome.storage.local.get(['isEnabled', 'analysisInterval', 'apiEndpoint'], (result) => {
      sendResponse(result);
    });
    return true;
  }

  if (request.action === 'saveSettings') {
    chrome.storage.local.set(request.settings, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.action === 'toggleDetection') {
    chrome.storage.local.get('isEnabled', (result) => {
      const newState = !result.isEnabled;
      chrome.storage.local.set({ isEnabled: newState }, () => {
        sendResponse({ enabled: newState });
      });
    });
    return true;
  }
});

// 탭 업데이트 감지
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // 새 페이지 로드 시 필요한 작업 수행
    console.log('Page loaded:', tab.url);
  }
});