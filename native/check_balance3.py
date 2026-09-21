with open('C:/Users/jpowe/Desktop/Projects/Aetherius-OS/native/aether-boot-logic/src/policy.rs', 'r') as f:
    lines = f.read().split('\n')
    balance = 0
    for i, line in enumerate(lines, 1):
        balance += line.count('{') - line.count('}')
        if i == 242:  # line before mod tests
            print(f'Before test module: balance={balance}')
        if i == 242:  # mod tests line
            print(f'Line {i+1}: mod tests {{ - balance before: {balance}')
        balance += line.count('{') - line.count('}')
        if i >= 242:
            print(f'  Line {i+1}: balance={balance + line.count("{") - line.count("}")} | {line.strip()[:60]}')
    print(f'Final balance: {balance}')