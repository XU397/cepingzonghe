@echo off
echo ========================================
echo 上传项目到GitHub仓库脚本
echo ========================================

REM 检查是否已经是git仓库
if not exist ".git" (
    echo 初始化Git仓库...
    git init
)

REM 添加远程仓库（请根据图片中的URL修改）
echo 添加远程仓库...
git remote remove origin 2>nul
git remote add origin https://github.com/XU397/cepingzonghe.git

REM 创建.gitignore文件（如果不存在）
if not exist ".gitignore" (
    echo 创建.gitignore文件...
    echo node_modules/ > .gitignore
    echo dist/ >> .gitignore
    echo .env.local >> .gitignore
    echo .env.development >> .gitignore
    echo .env.production >> .gitignore
    echo *.log >> .gitignore
    echo .DS_Store >> .gitignore
    echo Thumbs.db >> .gitignore
)

REM 添加所有文件
echo 添加所有文件...
git add .

REM 检查状态
echo 当前状态:
git status

REM 提交更改
echo 提交更改...
git commit -m "初次提交：上传完整项目文件"

REM 推送到GitHub
echo 推送到GitHub仓库...
git branch -M main
git push -u origin main

echo ========================================
echo 上传完成！请检查GitHub仓库
echo ========================================
pause