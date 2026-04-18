import os
import re

root_dir = 'd:/prompt wars/src/tests'

# Regex to match: import { ... } from '../../lib/...'
# and replace with: import { ... } from '@/shared/lib/...'
pattern = re.compile(r"import\s+(.*?)\s+from\s+['\"](?:\.\./)+(lib|types|hooks)/(.*?)['\"]")

for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            file_path = os.path.join(root, file)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = pattern.sub(r"import \1 from '@/shared/\2/\3'", content)
            
            if content != new_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated: {file_path}")
