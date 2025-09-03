import fs from "fs";

const apiURL = "https://api.warframestat.us";

async function main() {
	const res = await fetch(`${apiURL}/items`);
	const data = await res.json();
	const mappedData = data
		.filter((v) => v.masterable)
		.map((v) => ({
			category: v.category,
			imageName: v.imageName,
			isPrime: v.isPrime,
			masterable: v.masterable,
			masteryReq: v.masteryReq,
			name: v.name,
			type: v.type,
			maxLevelCap: v.maxLevelCap,
			uniqueName: v.uniqueName,
			wikiAvailable: v.wikiAvailable,
			wikiaThumbnail: v.wikiaThumbnail,
			wikiaUrl: v.wikiaUrl,
		}));
	fs.writeFileSync("./src/lib/items.json", JSON.stringify(mappedData));

	process.exit(0);
}

main();
