import json
from wordfreq import top_n_list

TARGET_COUNT = 4200

# Load your vocab file
with open("scripts/vocabulary.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Extract IDs from your file
existing_words = set()
for entry in data.get("words", []):
    if "id" in entry:
        existing_words.add(entry["id"].lower().strip())

# Generate expected frequency list
expected_words = set(top_n_list("ur", TARGET_COUNT))

# Compare
missing_words = sorted(expected_words - existing_words)
extra_words = sorted(existing_words - expected_words)
present_words = sorted(existing_words & expected_words)

# Stats
print("========== SUMMARY ==========")
print(f"Expected (top {TARGET_COUNT}): {len(expected_words)}")
print(f"In your vocab: {len(existing_words)}")
print(f"Present: {len(present_words)}")
print(f"Missing: {len(missing_words)}")
print(f"Extra: {len(extra_words)}")

# Save results
with open("missing_words.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(missing_words))

with open("extra_words.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(extra_words))

print("\n📁 Files generated:")
print("- missing_words.txt")
print("- extra_words.txt")
