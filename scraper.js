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
        retry: { limit: 3 },
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

      // FIX: Extract the actual array of matches from the JSON response
      let matchesList = [];
      if (Array.isArray(rawData)) {
        matchesList = rawData; // Response is already a flat array
      } else if (rawData && Array.isArray(rawData.jogos)) {
        matchesList = rawData.jogos; // Response is structured as { "jogos": [...] }
      } else if (rawData) {
        // Fallback: dynamically find whichever key holds the array in the object
        const arrayKey = Object.keys(rawData).find(key => Array.isArray(rawData[key]));
        matchesList = arrayKey ? rawData[arrayKey] : [rawData];
      }

      // Spread and append only the individual match items into our master list
      allGames.push(...matchesList);
      console.log(` -> Merged ${matchesList.length} matches for ${month}/${year}`);

    } catch (error) {
      console.error(` -> Failed to fetch matches for ${month}/${year}: ${error.message}`);
    }
  }

  const outputFilename = 'palmeiras_matches.json';

  // Save as a single, flat array of all combined matches.
  // This format works perfectly with the Google Apps Script you set up!
  fs.writeFileSync(outputFilename, JSON.stringify(allGames, null, 2));

  console.log(`\nSuccess! Total of ${allGames.length} combined match entries saved to ${outputFilename}`);
}

await runScraper();
