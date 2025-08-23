import os

# Define expected BloomBug names (canonical lowercase)
expected_bloombugs = [
    "bloomglow", "thornling", "mirthmite", "grizzlepod", "fluttergrim",
    "gleambite", "snaggledew", "hushspore", "glintfang", "squabblebud",
    "twistroot", "gloomglee", "bramblewink", "flickerfuzz", "whimthorn"
]

# Define paths
web_path = "assets/bloombugs"
tool_path = "tools/ByteBloom-Bloombug/assets"

def scan_folder(path, expected_names, case_sensitive=False):
    found = set()
    missing = []
    files = os.listdir(path)

    for name in expected_names:
        variants = [f"{name}.png", f"{name}.PNG", f"{name}.webp"]
        if not case_sensitive:
            variants += [f"{name.capitalize()}.png", f"{name.upper()}.png"]

        if any(v in files for v in variants):
            found.add(name)
        else:
            missing.append(name)

    return found, missing

# Run audits
web_found, web_missing = scan_folder(web_path, expected_bloombugs)
tool_found, tool_missing = scan_folder(tool_path, expected_bloombugs)

# Compare results
print("🌐 Web Assets:")
print(f"✅ Found: {sorted(web_found)}")
print(f"❌ Missing: {web_missing}\n")

print("🛠 Tool Assets:")
print(f"✅ Found: {sorted(tool_found)}")
print(f"❌ Missing: {tool_missing}\n")

# Cross-check for mismatches
extra_web = web_found - tool_found
extra_tool = tool_found - web_found

if extra_web or extra_tool:
    print("🔁 Mismatched Assets:")
    if extra_web:
        print(f"Web-only: {sorted(extra_web)}")
    if extra_tool:
        print(f"Tool-only: {sorted(extra_tool)}")
else:
    print("✅ All assets match across both folders.")
