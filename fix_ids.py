import os
import glob
import re

for ext in ('*.md', '*.mdx'):
    for filepath in glob.glob(f'docs/**/{ext}', recursive=True):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace `id: Folder/Filename` with `id: Filename`
        new_content = re.sub(r'(?m)^id:\s*.*?/([^/\n\r]+)$', r'id: \1', content)
        
        if content != new_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Fixed {filepath}")
