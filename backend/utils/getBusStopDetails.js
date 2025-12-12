// Cache for bus stop data to avoid repeated fetches
let busStopsCache = null;
const axios = require('axios');
const xml2js = require('xml2js');

async function getBusStopDetails(busStopCode) {
    try {
        // Fetch XML if not already cached
        if (!busStopsCache) {
            const response = await axios.get('https://www.lta.gov.sg/map/busService/bus_stops.xml');
            const parser = new xml2js.Parser();
            const parsed = await parser.parseStringPromise(response.data);
            busStopsCache = parsed;
            console.log('Bus stops XML fetched and cached');
        }
        
        // Parse the XML structure: busstops > busstop (with name attribute) > details
        const busStops = busStopsCache.busstops?.busstop || [];
        
        console.log(`Searching for bus stop ${busStopCode} in ${busStops.length} stops`);
        
        for (let stop of busStops) {
            // The bus stop code is in the 'name' attribute
            const stopCode = stop.$.name;
            // The bus stop description is in the 'details' element
            const stopDescription = stop.details?.[0];
            
            if (stopCode === busStopCode || stopCode === `-${busStopCode}`) {
                console.log(`Found bus stop: ${stopCode} - ${stopDescription}`);
                return {
                    code: busStopCode,
                    name: stopDescription || 'Unknown'
                };
            }
        }
        
        console.log(`Bus stop ${busStopCode} not found in XML`);
        return { code: busStopCode, name: 'Unknown' };
    } catch (error) {
        console.error(`Error fetching bus stop details for ${busStopCode}:`, error);
        return { code: busStopCode, name: 'Unknown' };
    }
}

module.exports = { getBusStopDetails };