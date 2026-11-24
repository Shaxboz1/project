@ECHO OFF
title KEBABO! - Maxfiy Fayl Qulfi (Parol: 2011)
chcp 65001 >nul
cls

echo ====================================================
echo           KEBABO! - LOYIHA XAVFSIZLIK QULFI
echo ====================================================
echo.

if EXIST "Maxfiy_Fayllar" goto UNLOCK
if EXIST "Locker" goto CONFIRM
goto MDLOCKER

:CONFIRM
echo Diqqat: KEBABO loyiha papkasini qulflashni (yashirishni) xohlaysizmi?
set /p "cho=Tanlang [H - Ha / Y - Yo'q]: "
if /i "%cho%"=="H" goto LOCK
if /i "%cho%"=="Ha" goto LOCK
if /i "%cho%"=="Y" goto END
if /i "%cho%"=="Yoq" goto END
echo Noto'g'ri tanlov. Qaytadan urinib ko'ring.
goto CONFIRM

:LOCK
ren "Locker" "Maxfiy_Fayllar"
attrib +h +s "Maxfiy_Fayllar"
echo.
echo [Muvaffaqiyatli] Fayllar qulflandi va yashirildi!
echo.
pause
goto END

:UNLOCK
echo.
echo Loyiha fayllarini ochish uchun maxfiy parolni kiriting:
set /p "pass=Parol: "
if "%pass%"=="2011" goto UNLOCK_OK
echo.
echo [XATO] Noto'g'ri parol! Kirish rad etildi.
echo.
pause
goto END

:UNLOCK_OK
attrib -h -s "Maxfiy_Fayllar"
ren "Maxfiy_Fayllar" "Locker"
echo.
echo [Muvaffaqiyatli] Parol to'g'ri (2011)! Fayllar ochildi.
echo.
pause
goto END

:MDLOCKER
md "Locker"
echo "Locker" papkasi yaratildi.
echo Himoyalamoqchi bo'lgan fayllaringizni "Locker" ichiga joylashtiring va ushbu faylni qayta bosing.
echo.
pause
goto END

:END
