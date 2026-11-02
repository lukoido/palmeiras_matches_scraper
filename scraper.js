import { gotScraping } from 'got-scraping';
import fs from 'fs';

async function runScraper() {
  console.log('--- Palmeiras Multi-Month Match Scraper ---\n');

  const currentDate = new Date();
  const allGames = [];
  const numberOfMonths = 2; // Scrape current month and next month

  for (let i = 0; i < numberOfMonths; i++) {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
    const month = targetDate.getMonth() + 1;
    const year = targetDate.getFullYear();

    const targetUrl = `https://palmeiras.com.br/wp-json/apiverdao/v1/jogos-mes/?mes=${month}&ano=${year}&v=1`;
    console.log(`Fetching schedule for ${month}/${year}...`);

    try {
      const response = await gotScraping({
        url: targetUrl,
        retry: {
          limit: 3, // Retries transient TCP drops
        },
        headers: {
          'referer': 'https://www.palmeiras.com.br/calendario/',
          'accept': 'application/json, text/plain, */*',
        },
        headerGeneratorOptions: {
          browsers: [{ name: 'chrome' }],
          devices: ['desktop'],
          locales: ['pt-BR', 'pt'],
        },
      });

      if (response.statusCode !== 200) {
        throw new Error(`Server returned HTTP ${response.statusCode}`);
      }

      const rawData = JSON.parse(response.body);

      if (Array.isArray(rawData)) {
        allGames.push(...rawData);
        console.log(` -> Found ${rawData.length} entries for ${month}/${year}`);
      } else if (rawData) {
        allGames.push(rawData);
      }
    } catch (error) {
      console.error(` -> Failed to fetch matches for ${month}/${year}: ${error.message}`);
    }
  }

  const outputFilename = 'palmeiras_matches.json';
  fs.writeFileSync(outputFilename, JSON.stringify(allGames, null, 2));

  console.log(`\nSuccess! Total of ${allGames.length} entries saved to ${outputFilename}`);
}

await runScraper();
