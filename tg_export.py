from telethon.sync import TelegramClient
import json

api_id = 38184803
api_hash = '6516581733e814fa125e595fc3eb8410'

with TelegramClient('my_session', api_id, api_hash) as client:
    messages = []
    
    print("开始下载 Agent0Kitchen 消息...")
    for msg in client.iter_messages('Agent0Kitchen', limit=10000):
        if msg.text:
            sender_name = ""
            if msg.sender:
                sender_name = getattr(msg.sender, 'first_name', '') or str(msg.sender_id)
            messages.append({
                'date': str(msg.date),
                'sender': sender_name,
                'text': msg.text
            })
        if len(messages) % 500 == 0:
            print(f"已下载 {len(messages)} 条...")
    
    with open('agent0_kitchen.json', 'w', encoding='utf-8') as f:
        json.dump(messages, f, ensure_ascii=False, indent=2)
    
    print(f"完成！共导出 {len(messages)} 条消息到 agent0_kitchen.json")
