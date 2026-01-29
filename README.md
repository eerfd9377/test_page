# 금 가격 트래커 사이트 (정적)

현재 금(XAU) 시세를 통화별로 확인하고, 최근 기록을 저장해 간단한 추세를 보여주는 단일 페이지 사이트입니다.

## 실행(로컬 미리보기)

### 옵션 A: 그냥 파일로 열기
- `site/index.html` 더블클릭

### 옵션 B: 간단한 로컬 서버(권장)

```bash
cd site
python3 -m http.server 5173
```

그 다음 브라우저에서:
- http://localhost:5173

## 구성
- `index.html`: 현재 시세 + 추세(차트) + 설명
- `styles.css`: 컨트롤/차트/카드 스타일
- `script.js`: 다크모드, 시계, 시세 fetch, 로컬 기록 저장, 간단 차트 렌더

## 데이터 소스
- https://data-asg.goldprice.org/dbXRates/<CURRENCY>

## 배포
- GitHub Pages(현재 세팅): `eerfd9377/test_page`에 푸시하면 자동 반영

## GitHub Pages로 계속 배포하기 (eerfd9377/test_page)

```bash
cd /Users/biseogun/clawd-dev/site
./deploy_github_pages.sh
```

배포 URL:
- https://eerfd9377.github.io/test_page/
