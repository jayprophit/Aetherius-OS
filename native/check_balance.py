with open('C:/Users/jpowe/Desktop/Projects/Aetherius-OS/native/aether-boot-logic/src/policy.rs', 'r') as f:
    lines = f.read().split('\n')
    balance = 0
    for i, line in enumerate(lines, 1):
        balance += line.count('{') - line.count('}')
        if i >= 220:
            print(f'Line {i}: balance={balance + line.count("{") - line.count("}")} - {line.strip()[:100]}')
    print(f'Final balance: {balance}')