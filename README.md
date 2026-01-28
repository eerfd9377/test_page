# 배포 플랫폼 비교 사이트 (정적)

GitHub Pages / Netlify / Vercel 3개를 비교하고, 간단한 체크로 추천까지 해주는 단일 페이지 사이트입니다.

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
- `index.html`: 비교 카드 + 추천 폼 + 체크리스트
- `styles.css`: 카드/배지/콜아웃/체크 UI 스타일
- `script.js`: 다크모드, 시계, 장단점 토글, 간단 추천 로직

## 배포(추천)
- Netlify: 드래그&드롭으로 `site/` 폴더 안 파일을 업로드
- GitHub Pages: 레포에 올리고 Pages 활성화
- Vercel: 프레임워크 프로젝트에 특히 유리
