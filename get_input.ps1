# PowerShell脚本获取用户输入
Write-Host "请输入您的指令 (输入 'stop' 退出):"
$userInput = Read-Host "prompt"
Write-Host "您输入的内容: $userInput"
$userInput | Out-File -FilePath 'user_command.txt' -Encoding UTF8
Write-Host "输入已保存到 user_command.txt"