import sys
import json
import os
import requests

def perplexity_chat(prompt):
    api_key = os.getenv('PERPLEXITY_API')
    if not api_key:
        print("Error: PERPLEXITY_API environment variable not set")
        sys.exit(1)

    headers = {
        'accept': 'application/json',
        'authorization': f'Bearer {api_key}',
        'content-type': 'application/json'
    }

    data = {
        'model': 'llama-3.1-sonar-large-128k-online',
        'messages': [
            {
                'role': 'system',
                'content': 'Be precise and concise.'
            },
            {
                'role': 'user',
                'content': prompt
            }
        ],
        'stream': True
    }

    response = requests.post(
        'https://api.perplexity.ai/chat/completions',
        headers=headers,
        json=data,
        stream=True
    )

    citations = None
    usage = None
    
    for line in response.iter_lines():
        if not line:
            continue
            
        line = line.decode('utf-8')
        if not line.startswith('data: '):
            continue
        
        try:
            data = json.loads(line[6:])
            
            # 直接输出内容
            if 'choices' in data and data['choices'][0].get('delta', {}).get('content'):
                print(data['choices'][0]['delta']['content'], end='', flush=True)
            # 存储citations和usage
            elif 'citations' in data:
                citations = data['citations']
            elif 'usage' in data:
                usage = data['usage']
                
        except json.JSONDecodeError:
            continue

    # 显示citations和usage
    if citations:
        print('\n\n📚 Citations:')
        for citation in citations:
            print(citation)
    
    if usage:
        print('\n📊 Usage:')
        print(f"Prompt tokens: {usage['prompt_tokens']}")
        print(f"Completion tokens: {usage['completion_tokens']}")
        print(f"Total tokens: {usage['total_tokens']}")

def main():
    if len(sys.argv) < 2:
        print("Usage: p <prompt>")
        sys.exit(1)
    
    prompt = ' '.join(sys.argv[1:])
    perplexity_chat(prompt)

if __name__ == '__main__':
    main() 
