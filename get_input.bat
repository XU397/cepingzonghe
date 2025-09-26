@echo off
echo 请输入您的指令 (输入 'stop' 退出):
set /p user_input="prompt: "
echo 您输入的内容: %user_input%
echo %user_input% > user_command.txt
pause