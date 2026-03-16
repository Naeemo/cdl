#!/usr/bin/env python3
import os
import json
import re
from pathlib import Path

project_root = Path("/root/.openclaw/workspace/projects/cdl")
packages_dir = project_root / "packages"

# Map of old scope to new scope
scope_mapping = {
    "@cdl/": "@naeemo/"
}

# Files to update (excluding node_modules)
package_files = list(packages_dir.glob("*/package.json"))
# Also update root package.json if it references @cdl
root_pkg = project_root / "package.json"
if root_pkg.exists():
    package_files.append(root_pkg)

print(f"Updating {len(package_files)} package.json files...")

for pkg_file in package_files:
    with open(pkg_file, 'r') as f:
        content = f.read()
    
    original = content
    # Update package name
    for old_scope, new_scope in scope_mapping.items():
        content = content.replace(old_scope, new_scope)
    
    # Update dependencies that reference old scope
    # This is a simple string replacement; we need to be careful with version ranges
    # We'll do a second pass to fix any dependencies that are file references
    # file:../compiler stays the same, just the name changes if referenced elsewhere
    
    if content != original:
        with open(pkg_file, 'w') as f:
            f.write(content)
        print(f"✓ Updated {pkg_file.relative_to(project_root)}")
    else:
        print(f"✗ No change needed for {pkg_file.relative_to(project_root)}")

# Update any other configuration files that might reference @cdl
print("\nUpdating other configuration files...")
config_files = [
    project_root / "pnpm-workspace.yaml",
    project_root / "PROMPT.md",
    project_root / "README.md",
]

for config_file in config_files:
    if config_file.exists():
        with open(config_file, 'r') as f:
            content = f.read()
        original = content
        for old_scope, new_scope in scope_mapping.items():
            content = content.replace(old_scope, new_scope)
        if content != original:
            with open(config_file, 'w') as f:
                f.write(content)
            print(f"✓ Updated {config_file.relative_to(project_root)}")

print("\n✅ All scope references updated from @cdl to @naeemo")
