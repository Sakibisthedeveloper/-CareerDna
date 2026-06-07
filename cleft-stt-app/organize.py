import os
import shutil
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CALIBRATION_DIR = os.path.join(BASE_DIR, 'data', 'calibration')
os.makedirs(CALIBRATION_DIR, exist_ok=True)

# List of files and their sizes
files_in_dir = os.listdir(BASE_DIR)
mpeg_files = [f for f in files_in_dir if f.endswith('.mpeg') and 'WhatsApp' in f]

# Let's map size to file
mpeg_with_sizes = [(f, os.path.getsize(os.path.join(BASE_DIR, f))) for f in mpeg_files]
# Sort by size ascending
mpeg_with_sizes.sort(key=lambda x: x[1])

print("Found files sorted by size:")
for f, size in mpeg_with_sizes:
    print(f" - {f}: {size} bytes")

# We expect exactly 6 files
if len(mpeg_with_sizes) != 6:
    print(f"Error: Expected 6 WhatsApp audio files, found {len(mpeg_with_sizes)}")
    exit(1)

# Script mappings sorted by length (and thus size)
# 1. 59 chars -> audio6
# 2. 111 chars -> audio5
# 3. 137 chars -> audio3
# 4. 178 chars -> audio4
# 5. 673 chars -> audio1
# 6. 955 chars -> audio2

size_to_target = {
    0: ("audio6.mpeg", "Phrase 10: \"The total amount is exactly one hundred and twenty-five.\""),
    1: ("audio5.mpeg", "Phrase 8: \"Many morning meetings make for a very long Monday.\"\n\nPhrase 9: \"Running an online business requires great focus and time.\""),
    2: ("audio3.mpeg", "Phrase 1: \"Open the computer and check my tasks for today.\"\n\nPhrase 2: \"Copy this text directly to the system clipboard.\"\n\nPhrase 3: \"Please send a quick message to my family.\""),
    3: ("audio4.mpeg", "Phrase 4: \"The quick brown fox jumps over the lazy dog.\"\n\nPhrase 5: \"Please bake a fresh batch of tall pecan pies.\"\n\nPhrase 6: \"Keep the blue shiny keys inside the grey desktop drawer.\"\n\nPhrase 7: \"Start the local backend server on my laptop right now.\""),
    4: ("audio1.mpeg", "THE house sat the only one in the entire valley on the crest of a low hill. From this height one could see the river and the field of ripe corn dotted with the flowers that always promised a good harvest. The only thing the earth needed was a downpour or at least a shower Throughout the morning Lencho who knew his fields intimately had done nothing else but see the sky towards the north-east.\n\n\"Now we're really going to get some water, woman.\"\n\nThe woman who was preparing supper, replied. \"Yes. God willing The older boys were working in the field, while the smaller ones were playing near the house until the woman called to them all, \"Come for dinner It was during the meal that. Just as Lencho had predicted, big drops of rain began to fall. In the north-east huge mountains of clouds could be seen approaching. The air was fresh and sweet. The man went out for no other reason than to have the pleasure of feeling the rain on his body. and when he returned he exclaimed. These aren't raindrops falling from the sky, they are new coins. The big drops are ten cent pieces and the little ones are fives.\""),
    5: ("audio2.mpeg", "With a satisfied expression he regarded the field of ripe corn with its flowers, draped in a curtain of rain. But suddenly a strong wind began to blow and along with the rain very large hailstones began to fall. These truly did resemble new silver coins. The boys, exposing themselves to the rain, ran out to collect the frozen pearls.\n\n\"It's really getting bad now,\" exclaimed the man. \"I hope it passes quickly. It did not pass quickly. For an hour the hail rained on the house, the garden, the hillside, the cornfield, on the whole valley. The field was white, as if covered with salt.\n\nNot a leaf remained on the trees. The corn was totally destroyed. The flowers were gone from the plants. Lencho's soul was filled with sadness. When the storm had passed, he stood in the middle of the b field and said to his sons. \"A plague of locusts would have left more than this. The hail has left nothing.\n\nThis year we will have no corn.\"\n\nThat night was a sorrowful one.\n\n\"All our work, for nothing.\"\n\n\"There's no one who can help us.\"\n\n\"We'll all go hungry this year.\"\n\nBut in the hearts of all who lived in that solitary house in the middle of the valley, there was a single hope: help from God.")
}

new_map = {}

for idx, (filename, size) in enumerate(mpeg_with_sizes):
    target_name, script = size_to_target[idx]
    src_path = os.path.join(BASE_DIR, filename)
    dest_path = os.path.join(CALIBRATION_DIR, target_name)
    
    # Copy file to data/calibration/target_name
    shutil.copy2(src_path, dest_path)
    print(f"Copied {filename} -> data/calibration/{target_name}")
    
    # Save in map
    new_map[target_name] = script

# Write new map
map_path = os.path.join(BASE_DIR, 'calibration_map.json')
with open(map_path, 'w', encoding='utf-8') as f:
    json.dump(new_map, f, indent=2)

print("\nSuccessfully updated calibration_map.json with new mpeg file mappings!")
