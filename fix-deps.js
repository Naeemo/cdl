#!/usr/bin/env python3
import json
from pathlib import Path

project_root = Path("/root/.openclaw/workspace/projects/cdl")
packages_dir = project_root / "packages"

updated = 0
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
                if version == "workspace:*":
                    data[dep_type][dep_name] = "^0.1.0"
                    changed = True
                    print(f"{pkg_dir.name}: {dep_name} -> ^0.1.0")
    
    if changed:
        with open(pkg_json, "w") as f:
            json.dump(data, f, indent=2)
            f.write("\n")
        updated += 1

print(f"\n✅ Updated {updated} package.json files: workspace:* -> ^0.1.0")
