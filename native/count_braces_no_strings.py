import re
with open('C:/Users/jpowe/Desktop/Projects/Aetherius-OS/native/aether-boot-logic/src/policy.rs', 'r') as f:
    content = f.read()
# Remove strings
content = re.sub(r'"([^"\\]|\\.)*"', '', content)
# Remove comments
content = re.sub(r'//.*', '', content)
print('Open:', content.count('{'))
print('Close:', content.count('}'))
print('Diff:', content.count('{') - content.count('}'))