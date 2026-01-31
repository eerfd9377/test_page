# 일본 주식 우대권 매니저 (Static Demo)

이 폴더는 정적 웹사이트입니다(HTML/CSS/JS only).

## 로컬 실행
```bash
cd jp-shareholder-perks-demo
python3 -m http.server 8080
# 브라우저: http://localhost:8080
```

## 배포 옵션(정적 호스팅)
### 1) GitHub Pages
1. 이 폴더를 GitHub 리포지토리에 올립니다.
2. Settings → Pages → Deploy from branch → `main` / `/ (root)` 또는 `/docs`.

### 2) Netlify (드래그앤드롭)
- Netlify에서 이 폴더를 그대로 업로드하면 됩니다(빌드 없음).

### 3) Vercel
- Framework preset 없이 Static으로 배포 가능(빌드 없음).

## 데이터 저장
- 데모는 브라우저 `localStorage`에 저장됩니다. (기기/브라우저 변경 시 데이터 이동 필요)
- 내보내기/가져오기(JSON) 기능 제공.
