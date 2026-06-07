const fs = require('fs');
const path = require('path');

const baseDir = __dirname;
const calibrationDir = path.join(baseDir, 'data', 'calibration');

// Ensure calibration directory exists
if (!fs.existsSync(calibrationDir)) {
    fs.mkdirSync(calibrationDir, { recursive: true });
}

// Find all WhatsApp mpeg files in baseDir
const files = fs.readdirSync(baseDir);
const mpegFiles = files.filter(f => f.endsWith('.mpeg') && f.includes('WhatsApp'));

// Get file stats and sort by size ascending
const mpegWithSizes = mpegFiles.map(filename => {
    const filePath = path.join(baseDir, filename);
    const stats = fs.statSync(filePath);
    return { filename, size: stats.size };
}).sort((a, b) => a.size - b.size);

console.log("Found files sorted by size:");
mpegWithSizes.forEach(f => {
    console.log(` - ${f.filename}: ${f.size} bytes`);
});

if (mpegWithSizes.length !== 6) {
    console.error(`Error: Expected exactly 6 WhatsApp audio files, found ${mpegWithSizes.length}`);
    process.exit(1);
}

// Scripts sorted by length/complexity to match the sizes:
const sizeToTarget = {
    0: {
        target: "audio6.mpeg",
        script: "Phrase 10: \"The total amount is exactly one hundred and twenty-five.\""
    },
    1: {
        target: "audio5.mpeg",
        script: "Phrase 8: \"Many morning meetings make for a very long Monday.\"\n\nPhrase 9: \"Running an online business requires great focus and time.\""
    },
    2: {
        target: "audio3.mpeg",
        script: "Phrase 1: \"Open the computer and check my tasks for today.\"\n\nPhrase 2: \"Copy this text directly to the system clipboard.\"\n\nPhrase 3: \"Please send a quick message to my family.\""
    },
    3: {
        target: "audio4.mpeg",
        script: "Phrase 4: \"The quick brown fox jumps over the lazy dog.\"\n\nPhrase 5: \"Please bake a fresh batch of tall pecan pies.\"\n\nPhrase 6: \"Keep the blue shiny keys inside the grey desktop drawer.\"\n\nPhrase 7: \"Start the local backend server on my laptop right now.\""
    },
    4: {
        target: "audio1.mpeg",
        script: "THE house sat the only one in the entire valley on the crest of a low hill. From this height one could see the river and the field of ripe corn dotted with the flowers that always promised a good harvest. The only thing the earth needed was a downpour or at least a shower Throughout the morning Lencho who knew his fields intimately had done nothing else but see the sky towards the north-east.\n\n\"Now we're really going to get some water, woman.\"\n\nThe woman who was preparing supper, replied. \"Yes. God willing The older boys were working in the field, while the smaller ones were playing near the house until the woman called to them all, \"Come for dinner It was during the meal that. Just as Lencho had predicted, big drops of rain began to fall. In the north-east huge mountains of clouds could be seen approaching. The air was fresh and sweet. The man went out for no other reason than to have the pleasure of feeling the rain on his body. and when he returned he exclaimed. These aren't raindrops falling from the sky, they are new coins. The big drops are ten cent pieces and the little ones are fives.\""
    },
    5: {
        target: "audio2.mpeg",
        script: "With a satisfied expression he regarded the field of ripe corn with its flowers, draped in a curtain of rain. But suddenly a strong wind began to blow and along with the rain very large hailstones began to fall. These truly did resemble new silver coins. The boys, exposing themselves to the rain, ran out to collect the frozen pearls.\n\n\"It's really getting bad now,\" exclaimed the man. \"I hope it passes quickly. It did not pass quickly. For an hour the hail rained on the house, the garden, the hillside, the cornfield, on the whole valley. The field was white, as if covered with salt.\n\nNot a leaf remained on the trees. The corn was totally destroyed. The flowers were gone from the plants. Lencho's soul was filled with sadness. When the storm had passed, he stood in the middle of the b field and said to his sons. \"A plague of locusts would have left more than this. The hail has left nothing.\n\nThis year we will have no corn.\"\n\nThat night was a sorrowful one.\n\n\"All our work, for nothing.\"\n\n\"There's no one who can help us.\"\n\n\"We'll all go hungry this year.\"\n\nBut in the hearts of all who lived in that solitary house in the middle of the valley, there was a single hope: help from God."
    }
};

const newMap = {};

mpegWithSizes.forEach((fileInfo, idx) => {
    const { target, script } = sizeToTarget[idx];
    const srcPath = path.join(baseDir, fileInfo.filename);
    const destPath = path.join(calibrationDir, target);

    // Copy file
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${fileInfo.filename} -> data/calibration/${target}`);

    // Update map
    newMap[target] = script;
});

// Save updated JSON
const mapPath = path.join(baseDir, 'calibration_map.json');
fs.writeFileSync(mapPath, JSON.stringify(newMap, null, 2), 'utf-8');

console.log("\nSuccessfully updated calibration_map.json with new mpeg file mappings!");
