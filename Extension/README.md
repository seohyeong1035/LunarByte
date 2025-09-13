# LunarByte 브라우저 확장 프로그램

실시간 딥페이크 탐지를 위한 브라우저 확장 프로그램입니다.

## 기능

- 웹사이트의 모든 비디오 자동 감지
- 실시간 딥페이크 분석 (5초마다)
- 결과를 오버레이로 표시
- 토글 on/off 가능
- 사용 통계 추적

## 설치 방법

1. Backend 서버 실행:
```bash
cd Backend
python main.py
```

2. Chrome 확장 프로그램 로드:
- Chrome에서 `chrome://extensions/` 접속
- 우측 상단 "개발자 모드" 활성화
- "압축해제된 확장 프로그램을 로드합니다" 클릭
- `Extension` 폴더 선택

## 사용법

1. 확장 프로그램 설치 후 YouTube, Netflix 등 비디오 사이트 접속
2. 비디오 재생 시 자동으로 분석 시작
3. 우측 상단에 결과 오버레이 표시
4. 확장 프로그램 아이콘 클릭으로 on/off 가능

## API 연동

Backend의 `/analyze-frame` 엔드포인트를 사용하여 실시간 분석을 수행합니다.

## 지원 사이트

- YouTube
- Netflix
- 기타 모든 웹사이트의 HTML5 비디오