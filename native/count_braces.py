with open('C:/Users/jpowe/Desktop/Projects/Aetherius-OS/native/aether-boot-logic/src/policy.rs', 'r') as f:
    content = f.read()
open_count = content.count('{')
close_count = content.count('}')
print('Open braces:', open_count)
print('Close braces:', close_count)
print('Diff:', open_count - close_count)