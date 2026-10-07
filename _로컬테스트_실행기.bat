@echo off
chcp 65001 > nul
echo ==========================================
echo 로컬 테스트 서버를 시작합니다...
echo 브라우저가 열리면 게임을 테스트하실 수 있습니다!
echo (검은 창을 끄면 서버가 종료됩니다)
echo ==========================================
start http://localhost:8000
python -m http.server 8000
