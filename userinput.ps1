# Interactive task loop
Write-Host "Interactive task loop started" -ForegroundColor Green
Write-Host "Available commands: help, clear, stop" -ForegroundColor Cyan

while ($true) {
    Write-Host ""
    $userInput = Read-Host "Enter command (type 'stop' to exit)"
    
    if ($userInput -eq "stop") {
        Write-Host "Exiting interactive loop..." -ForegroundColor Red
        break
    }
    
    # Save user input to file
    $userInput | Out-File -FilePath "user_command.txt" -Encoding UTF8 -NoNewline
    
    Write-Host "You entered: $userInput" -ForegroundColor Green
    
    if ($userInput -eq "clear") {
        Clear-Host
        Write-Host "Screen cleared" -ForegroundColor Cyan
    } elseif ($userInput -eq "help") {
        Write-Host "Available commands:" -ForegroundColor Cyan
        Write-Host "- clear: Clear screen"
        Write-Host "- help: Show help"
        Write-Host "- stop: Exit program"
    } elseif ($userInput -eq "") {
        Write-Host "Please enter a valid command" -ForegroundColor Yellow
    } else {
        Write-Host "Processing command: $userInput" -ForegroundColor Cyan
    }
}

Write-Host "Interactive loop ended" -ForegroundColor Red