with open('C:/Users/jpowe/Desktop/Projects/Aetherius-OS/native/aether-boot-logic/src/policy.rs', 'r') as f:
    content = f.read()
    print(f'Total length: {len(content)}')
    print(f'Last 100 chars: {repr(content[-100:])}')
    print(f'Ends with newline: {content.endswith(chr(10))}')
    print(f'Ends with }}: {content.rstrip().endswith("}")}')
    lines = content.split('\n')
    print(f'Total lines: {len(lines)}')