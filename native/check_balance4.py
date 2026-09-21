with open('C:/Users/jpowe/Desktop/Projects/Aetherius-OS/native/aether-boot-logic/src/policy.rs', 'r') as f:
    lines = f.read().split('\n')
    balance = 0
    for i, line in enumerate(lines):
        open_count = line.count('{')
        close_count = line.count('}')
        if open_count != close_count:
            balance += open_count - close_count
            print(f'Line {i+1}: +{line.count("{")} -{line.count("}")} = {line.count("{") - line.count("}")} | balance={balance} | {line.strip()[:80]}')
print(f'Final balance: {balance}')