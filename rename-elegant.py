#!/usr/bin/env python3
import os
import json
from pathlib import Path

project_root = Path("/root/.openclaw/workspace/projects/cdl")
packages_dir = project_root / "packages"

# Elegant naming: all packages under @naeemo/cdl-*
# Special cases that are already good:
# - unscoped packages need to be scoped
# - existing @naeemo/* need to become @naeemo/cdl-*
rename_mapping = {
    "@naeemo/ai": "@naeemo/cdl-ai",
    "@naeemo/cli": "@naeemo/cdl-cli",
    "@naeemo/compiler": "@naeemo/cdl-compiler",
    "@naeemo/integration-test": "@naeemo/cdl-integration-test",
    "@naeemo/react": "@naeemo/cdl-react",
    "@naeemo/renderer-d3": "@naeemo/cdl-renderer-d3",
    "@naeemo/renderer-echarts": "@naeemo/cdl-renderer-echarts",
    "@naeemo/ssr": "@naeemo/cdl-ssr",
    "@naeemo/templates": "@naeemo/cdl-templates",
    "@naeemo/themes": "@naeemo/cdl-themes",
    "@naeemo/vue": "@naeemo/cdl-vue",
    # Unscoped packages
    "renderer-canvas": "@naeemo/cdl-renderer-canvas",
    "cdl-vscode": "@naeemo/cdl-vscode",
}

print("Elegant package rename plan: @naeemo/* → @naeemo/cdl-*")
print("=" * 60)
for old, new in rename_mapping.items():
    print(f"  {old:<40} → {new}")

# Find all package.json files
package_files = list(packages_dir.glob("*/package.json"))

updated_count = 0
for pkg_file in package_files:
    with open(pkg_file, 'r') as f:
        content = f.read()
    
    original = content
    for old_name, new_name in rename_mapping.items():
        # Replace package name field
        content = content.replace(f'"name": "{old_name}"', f'"name": "{new_name}"')
        # Also replace any bare references in dependencies
        content = content.replace(f'"{old_name}"', f'"{new_name}"')
    
    if content != original:
        with open(pkg_file, 'w') as f:
            f.write(content)
        print(f"\n✓ Updated {pkg_file.relative_to(project_root)}")
        updated_count += 1

# Update workspace configuration
print("\nUpdating workspace files...")
workspace_files = [
    project_root / "pnpm-workspace.yaml",
    project_root / "PROMPT.md",
    project_root / "README.md",
]

for wf in workspace_files:
    if wf.exists():
        with open(wf, 'r') as f:
            content = f.read()
        original = content
        for old_name, new_name in rename_mapping.items():
            content = content.replace(old_name, new_name)
        if content != original:
            with open(wf, 'w') as f:
                f.write(content)
            print(f"✓ Updated {wf.relative_to(project_root)}")

print(f"\n✅ Renamed {updated_count} packages to @naeemo/cdl-* pattern")
print("   All packages now have consistent, elegant naming!")
