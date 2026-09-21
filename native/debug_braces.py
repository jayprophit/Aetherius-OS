with open('C:/Users/jpowe/Desktop/Projects/Aetherius-OS/native/aether-boot-logic/src/policy.rs', 'r') as f:
    lines = f.read().split('\n')
    balance = 0
    for i, line in enumerate(lines, 1):
        open_count = line.count('{')
        close_count = line.count('}')
        prev_balance = balance
        balance += line.count('{') - line.count('}')
        if open_count > 0 or close_count > 0:
            print(f'Line {i}: +{open_count} -{close_count} = {open_count - close_count} | balance={balance} | {line.strip()[:100]}')
    print(f'Final balance: {balance}')