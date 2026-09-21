with open('C:/Users/jpowe/Desktop/Projects/Aetherius-OS/native/aether-boot-logic/src/policy.rs', 'r') as f:
    lines = f.read().split('\n')
    for i in range(max(0, len(lines)-10), len(lines)):
        line = lines[i]
        print(f'{i+1}: open={line.count("{")}, close={line.count("}")} | {repr(line)}')