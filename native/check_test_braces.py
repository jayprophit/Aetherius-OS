with open('C:/Users/jpowe/Desktop/Projects/Aetherius-OS/native/aether-boot-logic/src/policy.rs', 'r') as f:
    lines = f.read().split('\n')
    in_test = False
    balance = 0
    for i, line in enumerate(lines, 1):
        if 'mod tests' in line and '{' in line:
            in_test = True
        if in_test:
            balance += line.count('{') - line.count('}')
            if line.count('{') > 0 or line.count('}') > 0:
                print(f'Line {i}: balance={balance + line.count("{") - line.count("}")} | {line.strip()[:80]}')
    print(f'Test module balance: {balance}')