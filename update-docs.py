#!/usr/bin/env python3
from pathlib import Path

project_root = Path("/root/.openclaw/workspace/projects/cdl")

# Files to update
files_to_update = [
    "README.md",
    "PROMPT.md",
    "docs/index.md",
    "docs/guide/index.md",
]

# Also scan all markdown files in docs and examples
files_to_update.extend([str(f) for f in (project_root / "docs").rglob("*.md")])
files_to_update.extend([str(f) for f in (project_root / "examples").rglob("*.md")])

# Remove duplicates
files_to_update = list(set(files_to_update))

print(f"Updating {len(files_to_update)} files...")

replacements = [
    ("@cdl/compiler", "@naeemo/cdl-compiler"),
    ("@cdl/renderer-echarts", "@naeemo/cdl-renderer-echarts"),
    ("@cdl/cli", "@naeemo/cdl-cli"),
    ("@cdl/ai", "@naeemo/cdl-ai"),
    ("@cdl/ssr", "@naeemo/cdl-ssr"),
    ("@cdl/react", "@naeemo/cdl-react"),
    ("@cdl/vue", "@naeemo/cdl-vue"),
    ("@cdl/templates", "@naeemo/cdl-templates"),
    ("@cdl/themes", "@naeemo/cdl-themes"),
    ("@naeemo/compiler", "@naeemo/cdl-compiler"),  # Fix old @naeemo packages
    ("@naeemo/cli", "@naeemo/cdl-cli"),
    ("@naeemo/ai", "@naeemo/cdl-ai"),
    ("@naeemo/ssr", "@naeemo/cdl-ssr"),
    ("@naeemo/react", "@naeemo/cdl-react"),
    ("@naeemo/vue", "@naeemo/cdl-vue"),
    ("@naeemo/templates", "@naeemo/cdl-templates"),
    ("@naeemo/themes", "@naeemo/cdl-themes"),
]

updated_count = 0
for file_path_str in files_to_update:
    file_path = Path(file_path_str)
    if not file_path.exists() or file_path.is_dir():
        continue
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    for old, new in replacements:
        content = content.replace(old, new)
    
    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✓ {file_path.relative_to(project_root)}")
        updated_count += 1

print(f"\n✅ Updated {updated_count} files with new package names")
