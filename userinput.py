# userinput.py
import sys

try:
    print("请输入您的指令 (输入 'stop' 退出):")
    user_input = input("prompt: ")
    print(f"您输入的内容: {user_input}")
    
    # 将用户输入写入文件以便后续处理
    with open('user_command.txt', 'w', encoding='utf-8') as f:
        f.write(user_input)
        
except EOFError:
    print("无法读取输入，可能是因为运行在非交互式环境中")
    user_input = "help"
    with open('user_command.txt', 'w', encoding='utf-8') as f:
        f.write(user_input)
except KeyboardInterrupt:
    print("\n用户中断操作")
    user_input = "stop"
    with open('user_command.txt', 'w', encoding='utf-8') as f:
        f.write(user_input)