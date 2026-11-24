@echo off
title KEBABO Locker (2011)
chcp 65001 >nul
if exist "Maxfiy" goto UNLOCK
if exist "Locker" goto LOCK
md "Locker"
echo "Locker" papkasi yaratildi. Fayllaringizni shu yerga soling va qayta ishga tushiring.
pause
exit /b

:LOCK
ren "Locker" "Maxfiy"
attrib +h +s "Maxfiy"
echo [Qulflandi] Fayllar muvaffaqiyatli yashirildi!
pause
exit /b

:UNLOCK
set /p "p=Parolni kiriting: "
if "%p%"=="2011" (
  attrib -h -s "Maxfiy"
  ren "Maxfiy" "Locker"
  echo [Ochildi] Parol to'g'ri (2011). Fayllar ochildi!
) else (
  echo [XATO] Noto'g'ri parol!
)
pause
exit /b
