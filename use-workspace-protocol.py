#!/usr/bin/env python3
import json
from pathlib import Path

project_root = Path("/root/.openclaw/workspace/projects/cdl")
packages_dir = project_root / "packages"

# Get all package names in the workspace
package_names = []
for pkg_dir in packages_dir.iterdir():
    if pkg_dir.is_dir():
        pkg_json = pkg_dir / "package.json"
        if pkg_json.exists():
            with open(pkg_json) as f:
                data = json.load(f)
                package_names.append(data["name"])

print(f"Found {len(package_names)} packages in workspace")

# For each package, update dependencies that reference other workspace packages
updated_count = 0
for pkg_dir in packages_dir.iterdir():
    if not pkg_dir.is_dir():
        continue
    pkg_json = pkg_dir / "package.json"
    if not pkg_json.exists():
        continue
    
    with open(pkg_json) as f:
        data = json.load(f)
    
    changed = False
    for dep_type in ["dependencies", "devDependencies", "peerDependencies"]:
        if dep_type in data:
            for dep_name, version in list(data[dep_type].items()):
                # Check if this dependency is another workspace package
                for ws_name in package_names:
                    if dep_name == ws_name:
                        # Change to workspace protocol
                        data[dep_type][dep_name] = "workspace:*"
                        changed = True
                        print(f"  {pkg_dir.name}: {dep_name} -> workspace:*")
    
    if changed:
        with open(pkg_json, "w") as f:
            json.dump(data, f, indent=2)
            f.write("\n")
        updated_count += 1

print(f"\n✅ Updated {updated_count} package.json files to use workspace:* protocol")
