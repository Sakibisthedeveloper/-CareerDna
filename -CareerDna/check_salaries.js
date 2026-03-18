
const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\syeda sania\\Downloads\\Gravity\\CareerDNA_Project\\lib\\career-data.ts', 'utf8');

// Simple regex to extract careers
const careerBlocks = content.split('    {').slice(1);

let count = 0;
careerBlocks.forEach(block => {
    const titleMatch = block.match(/title: "(.*)"/) || block.match(/title: '(.*)'/);
    const rangeMatch = block.match(/salaryRange: "(.*)"/) || block.match(/salaryRange: '(.*)'/);
    const fresherMatch = block.match(/fresher: "(.*)"/) || block.match(/fresher: '(.*)'/);
    const seniorMatch = block.match(/senior: "(.*)"/) || block.match(/senior: '(.*)'/);

    if (titleMatch && rangeMatch && fresherMatch && seniorMatch) {
        count++;
        const title = titleMatch[1];
        const range = rangeMatch[1];
        const fresher = fresherMatch[1].replace('₹', '').replace('L', '');
        const senior = seniorMatch[1].replace('₹', '').replace('L', '');

        const [rangeMin, rangeMax] = range.split('-').map(s => s.replace(' LPA', ''));

        if (fresher !== rangeMin || senior !== rangeMax) {
            console.log(`Mismatch in ${title}: Range is ${range}, but Fresher is ${fresher}L and Senior is ${senior}L`);
        }
    }
});
console.log(`Checked ${count} careers.`);

