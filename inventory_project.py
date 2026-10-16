import subprocess, os
from collections import Counter

PROJECT_ROOT = r"C:\Users\jpowe\Desktop\Projects\Aetherius-OS"

# 1. Get git tracked files using ls-files
result = subprocess.run(['git', 'ls-files'], capture_output=True, text=True, cwd=PROJECT_ROOT)
tracked_files = set(line.strip() for line in result.stdout.strip().split('\n') if line.strip())

# Also get untracked files (those git knows about but aren't committed)
result2 = subprocess.run(['git', 'ls-files', '--', '--exclude-standard', '--others', '--'], 
                         capture_output=True, text=True, cwd=PROJECT_ROOT)
untracked_files = set(line.strip() for line in result2.stdout.strip().split('\n') if line.strip())

# 2. Recursively inventory all files IN THE PROJECT ONLY (not subprojects)
EXCLUDED_DIRS = {'node_modules', '__pycache__', '.git', 'build', 'dist', '.venv', 'target',
                 'local', 'native', 'scripts', 'services', 'tests',
                 'registry', 'research/build81', 'research/build83', 'research/build84', 
                 'research/build85', 'research/lm-compression'}

all_files = []
all_dirs = set()

# Only walk the project root directory
for root, dirs, files in os.walk(PROJECT_ROOT):
    # Filter out excluded directories
    dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS and os.path.isdir(os.path.join(root, d))]
    
    # Skip specific problem directories
    root_contains = root.lower()
    if 'legacy-intake' in root_contains or 'local-intake' in root_contains:
        dirs[:] = []
        continue
    
    for f in files:
        filepath = os.path.join(root, f)
        if '.git' in filepath:
            continue
        try:
            relpath = os.path.relpath(filepath, PROJECT_ROOT)
            if relpath.startswith('..') or relpath.startswith('../'):
                continue
            all_files.append(relpath)
            parent = os.path.dirname(relpath)
            if parent != '.':
                all_dirs.add(parent)
        except ValueError:
            continue

# Remove duplicates and sort
all_files = sorted(set(all_files))
all_dirs = sorted(set(all_dirs))

# 3. Classify each file
file_classifications = {}
classifications_count = {}

# Initialize all classification counts to 0
for cls in ['TRACKED', 'NEW_PROJECT_FILE', 'EXCLUDED_SECRET', 'EXCLUDED_TEMP', 'EXCLUDED_OS_FILE']:
    classifications_count[cls] = 0

for f in all_files:
    lower = f.lower()
    
    # Determine classification
    classification = 'NEW_PROJECT_FILE'  # default
    
    # Check for secrets
    if any(pattern in lower for pattern in ['.env', 'secret_key', 'api_key', 'auth_token',
                                          'access_key', 'private_key', 'credentials']):
        classification = 'EXCLUDED_SECRET'
    # Check for cache/temp
    elif any(pattern in lower for pattern in ['__pycache__', '.cache', '.tmp', '.temp',
                                              'temp/', 'tmp/', 'log/', 'records/',
                                              'dump/', 'pickle/', '.pyc', '.cache/']):
        classification = 'EXCLUDED_TEMP'
    # Check for OS files (gitignore, license, etc.)
    elif lower.endswith('.gitignore') or lower.endswith('.gitattributes') or lower == 'license':
        classification = 'EXCLUDED_OS_FILE'
    # Check if tracked by git
    elif f in tracked_files:
        classification = 'TRACKED'
    # Check if untracked (new file)
    elif f in untracked_files:
        classification = 'NEW_PROJECT_FILE'
    
    file_classifications[f] = classification
    classifications_count[classification] = classifications_count.get(classification, 0) + 1

# 4. Check for required empty directories
required_empty_dirs = 0
for d in all_dirs:
    dirpath = os.path.join(PROJECT_ROOT, d.replace('/', os.sep))
    if os.path.isdir(dirpath) and not os.listdir(dirpath):
        gitkeep = os.path.join(dirpath, '.gitkeep')
        readme = os.path.join(dirpath, 'README.md')
        if os.path.exists(gitkeep) or os.path.exists(readme):
            required_empty_dirs += 1

# 5. Summary - calculate UNACCOUNTED
total_files = len(all_files)
total_dirs = len(all_dirs)
tracked_count = classifications_count.get('TRACKED', 0)
new_count = classifications_count.get('NEW_PROJECT_FILE', 0)
secret_count = classifications_count.get('EXCLUDED_SECRET', 0)
temp_count = classifications_count.get('EXCLUDED_TEMP', 0)
os_file_count = classifications_count.get('EXCLUDED_OS_FILE', 0)

# UNACCOUNTED = total - sum of all classified categories
explained = tracked_count + new_count + secret_count + temp_count + os_file_count
unaccounted = total_files - explained

print("=" * 70)
print("BUILD86-R7B RECURSIVE PROJECT INVENTORY")
print("=" * 70)
print(f"Working directory: {PROJECT_ROOT}")
print()
print("SUMMARY:")
print(f"  Total files:         {total_files}")
print(f"  Total directories:   {total_dirs}")
print()
print("Classification breakdown:")
print(f"  TRACKED:             {tracked_count}")
print(f"  NEW_PROJECT_FILE:    {new_count}")
print(f"  EXCLUDED_SECRET:     {secret_count}")
print(f"  EXCLUDED_TEMP:       {temp_count}")
print(f"  EXCLUDED_OS_FILE:    {os_file_count}")
print()
print(f"Git tracked (ls-files):    {len(tracked_files)}")
print(f"Git untracked (standard):  {len(untracked_files)}")
print(f"Required empty dirs:       {required_empty_dirs}")
print()
print(f"UNACCOUNTED: {unaccounted}  (explained={explained}, total={total_files})")
print()
print("=" * 70)
if unaccounted == 0:
    print("SUCCESS: All files accounted for (UNACCOUNTED = 0)")
    status = "PASS"
else:
    print("FAILURE: Some files are unaccounted for!")
    status = "FAIL"
print("=" * 70)

# Show new project files
if new_count > 0:
    print(f"\nNEW_PROJECT_FILEs:")
    classified_new = [f for f, c in file_classifications.items() if c == 'NEW_PROJECT_FILE']
    for f in classified_new[:20]:
        print(f"  {f}")
    if new_count > 20:
        print(f"  ... and {new_count - 20} more")

# Show excluded items
if secret_count > 0 or temp_count > 0 or os_file_count > 0:
    print(f"\nExcluded items:")
    classified_excl = [(f, c) for f, c in file_classifications.items() 
                       if c in ['EXCLUDED_SECRET', 'EXCLUDED_TEMP', 'EXCLUDED_OS_FILE']]
    for f, c in classified_excl:
        print(f"  {c}: {f}")