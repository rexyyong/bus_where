const express = require('express');
const axios = require('axios');
require('dotenv').config();
const mongoose = require('mongoose');
const xml2js = require('xml2js');

const app = express();
const PORT = 8080;

const allowedOrigins = [process.env.allowed_origin];


// connect mongodb
const url = process.env.MONGODB_URI;
const connectDB = async () => {
    try {
        await mongoose.connect(url, {
           
        });
        console.log('Database is connected');
    } catch (err) {
        console.error('Error connecting to the database:', err);
        process.exit(1);
    }
};

module.exports = connectDB;

connectDB();

// Mongoose Schema for bus stop codes
const configuredBusCodesSchema = new mongoose.Schema({
    busStopCodes: [String]
}, {
    timestamps: true
});

const ConfiguredBusCodes = mongoose.model('ConfiguredBusCodes', configuredBusCodesSchema);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());

app.get('/', (req, res) => {
    res.send('API caller is running');
});

//api to allow frontend to get LTA data based on bus stop code
app.get('/api/bus-arrival/:busStopCode', async (req, res) => {
    console.log("Received request for bus stop code:", req.params.busStopCode);
    const busStopCode = req.params.busStopCode;
    try {
        const response = await axios.get('https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival', {
            params: {
                BusStopCode: busStopCode
            },
            headers: {
                'AccountKey': process.env.LTA_ACCOUNT_KEY,
                'Accept': 'application/json',
            }
        });
        // res.json(response.data);
        console.log('Full API Response:', JSON.stringify(response.data, null, 2));
        const countBusServices = response.data.Services.length;
        console.log(`Number of bus services at bus stop 46679: ${countBusServices}`);
        const sendToFrontend = [];
        for (let i = 0; i < countBusServices; i++) {
            const service = response.data.Services[i];
            console.log(`Bus Service No: ${service.ServiceNo}`);
            // console.log(`Next Bus Arrival Time: ${service.NextBus.EstimatedArrival}`);
            const arrivalTime = new Date(service.NextBus.EstimatedArrival);
            if (isNaN(arrivalTime)) {
                console.log(`Invalid arrival time for next bus ${service.ServiceNo}, skipping...`);
                continue;
            }
            const currentTime = new Date();
            // console.log(`Current Time: ${currentTime.toISOString()}`);
            const timeDifferenceMs = arrivalTime - currentTime; // Difference in milliseconds
            const timeDifferenceMinutes = Math.floor(timeDifferenceMs / 60000);
            timeDifferenceMinutes < 0 ? 0 : timeDifferenceMinutes;
            console.log(`Time until arrival: ${timeDifferenceMinutes} minutes`);
            console.log(`Bus Load: ${service.NextBus.Load}`);
            sendToFrontend.push({
                serviceNo: service.ServiceNo,
                arrivalInMinutes: timeDifferenceMinutes,
                busLoad: service.NextBus.Load
            });

            const arrivalTime2 = new Date(service.NextBus2.EstimatedArrival);
            if (isNaN(arrivalTime2)) {
                console.log(`Invalid arrival time for 2nd bus ${service.ServiceNo}, skipping...`);
                continue;
            }
            const timeDifferenceMs2 = arrivalTime2 - currentTime;
            const timeDifferenceMinutes2 = Math.floor(timeDifferenceMs2 / 60000);
            timeDifferenceMinutes2 < 0 ? 0 : timeDifferenceMinutes2;
            console.log(`Time until arrival for 2nd bus: ${timeDifferenceMinutes2} minutes`);
            console.log(`Bus Load for 2nd bus: ${service.NextBus2.Load}`);
            sendToFrontend.push({
                serviceNo: service.ServiceNo,
                arrivalInMinutes: timeDifferenceMinutes2,
                busLoad: service.NextBus2.Load
            });
            
            const arrivalTime3 = new Date(service.NextBus3.EstimatedArrival);
            if (isNaN(arrivalTime3)) {
                console.log(`Invalid arrival time for 3rd bus ${service.ServiceNo}, skipping...`);
                continue;
            }
            const timeDifferenceMs3 = arrivalTime3 - currentTime;
            const timeDifferenceMinutes3 = Math.floor(timeDifferenceMs3 / 60000);
            timeDifferenceMinutes3 < 0 ? 0 : timeDifferenceMinutes3;
            console.log(`Time until arrival for 3rd bus: ${timeDifferenceMinutes3} minutes`);
            console.log(`Bus Load for 3rd bus: ${service.NextBus3.Load}`);
            sendToFrontend.push({
                serviceNo: service.ServiceNo,
                arrivalInMinutes: timeDifferenceMinutes3,
                busLoad: service.NextBus3.Load
            });
        }
        console.log('Data to send to frontend:', sendToFrontend);
        res.json(sendToFrontend);
        console.log("Response sent to frontend successfully.");
    } catch (error) {
        console.error('Error fetching bus arrival data:', error);
        res.status(500).json({ error: 'Failed to fetch bus arrival data' });
    }
});


// api to receive confirmed bus stop codes from frontend and store in mongodb
// Data stored as an array of bus stop codes
app.post('/api/confirm-bus-codes', async (req, res) => {
    console.log("Received confirmed bus stop codes from frontend:", req.body);
    try {
        const newConfig = new ConfiguredBusCodes({
            busStopCodes: req.body
        });
        const result = await newConfig.save();
        console.log(`Saved bus codes with ID: ${result._id}`);
        res.status(200).json({ message: 'Bus stop codes received and saved successfully' });
    } catch (err) {
        console.error(`Error saving bus codes: ${err}`);
        res.status(500).json({ error: 'Failed to save bus codes' });
    }
});

const generateBusIcon = (type) => {
    const iconWidth = 30;
    const iconHeight = 16;
    
    let icon = '';
    
    if (type === 'SD') {
        // Single Deck - one rectangle
        icon = `<svg width="${iconWidth}" height="${iconHeight}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 16">
            <rect x="2" y="3" width="26" height="8" fill="none" stroke="black" stroke-width="1.5"/>
            <circle cx="8" cy="14" r="1.5" fill="black"/>
            <circle cx="24" cy="14" r="1.5" fill="black"/>
        </svg>`;
    } else if (type === 'DD') {
        // Double Deck - two stacked rectangles
        icon = `<svg width="${iconWidth}" height="${iconHeight}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 16">
            <rect x="2" y="1" width="26" height="5" fill="none" stroke="black" stroke-width="1.5"/>
            <rect x="2" y="6" width="26" height="5" fill="none" stroke="black" stroke-width="1.5"/>
            <circle cx="8" cy="14" r="1.5" fill="black"/>
            <circle cx="24" cy="14" r="1.5" fill="black"/>
        </svg>`;
    } else if (type === 'BD') {
        // Bendy - two buses together (double length)
        icon = `<svg width="${iconWidth}" height="${iconHeight}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 16">
            <rect x="2" y="3" width="13" height="8" fill="none" stroke="black" stroke-width="1.5"/>
            <rect x="15" y="3" width="13" height="8" fill="none" stroke="black" stroke-width="1.5"/>
            <line x1="15" y1="3" x2="15" y2="11" stroke="black" stroke-width="1"/>
            <circle cx="8" cy="14" r="1.5" fill="black"/>
            <circle cx="24" cy="14" r="1.5" fill="black"/>
        </svg>`;
    }
    
    return icon;
};

const generateSVG = (allBusData) => {
    console.log("Generating SVG with bus data:", JSON.stringify(allBusData, null, 2));

    const WIDTH = 800;
    const HEIGHT = 480;
    const PADDING = 20;
    const HEADER_HEIGHT = 50;
    
    const numStops = allBusData.length;
    const columnWidth = (WIDTH - (PADDING * 2)) / numStops;
    const availableHeight = HEIGHT - HEADER_HEIGHT;
    
    // Calculate dynamic row height based on available space and max buses in any column
    const maxBusesInColumn = Math.max(...allBusData.map(stop => stop.buses.length));
    const dynamicRowHeight = Math.max(35, Math.floor(availableHeight / maxBusesInColumn));
    
    let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${WIDTH}" height="${HEIGHT}" fill="white" stroke="black" stroke-width="2"/>
    `;

    // Generate columns for each bus stop
    let xPosition = PADDING;
    
    for (let stopIndex = 0; stopIndex < numStops; stopIndex++) {
        const busStop = allBusData[stopIndex];
        const buses = busStop.buses;
        
        // Bus stop code header
        svgContent += `  <text x="${xPosition + columnWidth / 2}" y="35" font-size="20" font-weight="bold" text-anchor="middle" fill="black">
        ${busStop.busStopCode} - ${busStop.busStopName}
        </text>
        `;
        
        // Draw separator line after header
        svgContent += `  <line x1="${xPosition}" y1="${HEADER_HEIGHT}" x2="${xPosition + columnWidth}" y2="${HEADER_HEIGHT}" stroke="black" stroke-width="1"/>
        `;
        
        // Bus data rows
        let yPosition = HEADER_HEIGHT + 25;
        const maxRows = Math.floor(availableHeight / dynamicRowHeight);
        let previousServiceNo = null;
        
        for (let i = 0; i < Math.min(buses.length, maxRows); i++) {
            const bus = buses[i];
            
            // Draw separator line when service number changes
            if (previousServiceNo !== null && previousServiceNo !== bus.serviceNo) {
                svgContent += `  <line x1="${xPosition + 10}" y1="${yPosition - dynamicRowHeight / 2}" x2="${xPosition + columnWidth - 10}" y2="${yPosition - dynamicRowHeight / 2}" stroke="black" stroke-width="2"/>
                `;
            }
            
            // Service number, arrival time, bus load, and icon all together
            const busIcon = generateBusIcon(bus.type);
            svgContent += `  <text x="${xPosition + 15}" y="${yPosition}" font-size="20" font-weight="bold" fill="black">
            ${bus.serviceNo} | ${bus.arrivalInMinutes}min | ${bus.busLoad}
            </text>
            <g transform="translate(${xPosition + 210}, ${yPosition - 12})">
            ${busIcon}
            </g>
            `;
            
            previousServiceNo = bus.serviceNo;
            yPosition += dynamicRowHeight;
        }
        
        // Draw vertical column separator
        if (stopIndex < numStops - 1) {
            svgContent += `  <line x1="${xPosition + columnWidth}" y1="0" x2="${xPosition + columnWidth}" y2="${HEIGHT}" stroke="black" stroke-width="1"/>
            `;
        }
        
        // Move to next column
        xPosition += columnWidth;
    }
    
    svgContent += `</svg>`;
    
    // console.log("Generated SVG:", svgContent);
    return svgContent;
}

const extractRelevantBusData = (busData, busStopCode) => {
    const result = [];
    
    if (!busData.Services || busData.Services.length === 0) {
        console.log(`No bus services available for bus stop ${busStopCode}`);
        return result;
    }
    
    const currentTime = new Date();
    
    for (let i = 0; i < busData.Services.length; i++) {
        const service = busData.Services[i];
        
        // Extract NextBus, NextBus2, NextBus3 for each service
        [service.NextBus, service.NextBus2, service.NextBus3].forEach((bus) => {
            if (!bus || !bus.EstimatedArrival) return;
            
            const arrivalTime = new Date(bus.EstimatedArrival);
            if (isNaN(arrivalTime)) return;
            
            const timeDifferenceMs = arrivalTime - currentTime;
            const timeDifferenceMinutes = Math.max(0, Math.floor(timeDifferenceMs / 60000));
            
            result.push({
                serviceNo: service.ServiceNo,
                arrivalInMinutes: timeDifferenceMinutes,
                busLoad: bus.Load,
                type : bus.Type
            });
        });
    }
    
    console.log(`Extracted bus data for stop ${busStopCode}:`, JSON.stringify(result, null, 2));
    return result;
}

// Cache for bus stop data to avoid repeated fetches
let busStopsCache = null;

const getBusStopDetails = async (busStopCode) => {
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



// api to retrieve latest confirmed bus stop codes and to call LTA API for each code and to draw a PNG image based on timings using SVG and sharp
app.get('/api/create-bus-timings-image', async (req, res) => {
    console.log("Received request to create bus timings image");
    let busStopCodes;
    try {
        const latestConfig = await ConfiguredBusCodes.findOne().sort({ createdAt: -1 });
        if (!latestConfig) {
            console.log("No bus stop codes configured yet");   
            return res.status(404).json({ error: 'No bus stop codes configured yet' });
        }
        busStopCodes = latestConfig.busStopCodes;
        console.log("Latest configured bus stop codes:", busStopCodes);
    }
    catch (err) {
        console.error(`Error retrieving latest bus codes: ${err}`);
        res.status(500).json({ error: 'Failed to retrieve latest bus codes' });
    }

    // call LTA API for each bus stop code to get raw data
    const allBusData = [];
    console.log("Fetching bus arrival data from LTA API for bus stop codes:", busStopCodes);
    for (let code of busStopCodes) {
        try {
            const response = await axios.get('https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival', {
                params: {
                    BusStopCode: code
                },
                headers: {
                    'AccountKey': process.env.LTA_ACCOUNT_KEY,
                    'Accept': 'application/json',
                }
            });
            allBusData.push({busStopCode: code, data: response.data});
        } catch (error) {
            console.error(`Error fetching bus arrival data for code ${code}:`, error);
        }
    }
    

    // Extract relevant bus data from all bus stops
    let relevantBusData = [];
    for (let busStopDataObj of allBusData) {
        const extracted = extractRelevantBusData(busStopDataObj.data, busStopDataObj.busStopCode);
        
        // Fetch bus stop details (name/description)
        const busStopDetails = await getBusStopDetails(busStopDataObj.busStopCode);
        
        relevantBusData.push({
            busStopCode: busStopDataObj.busStopCode,
            busStopName: busStopDetails.name,
            buses: extracted
        });
    }
    
    console.log("All relevant bus data:", JSON.stringify(relevantBusData, null, 2));

    // Generate SVG based on all bus data
    const svgContent = generateSVG(relevantBusData);

    // Return SVG to frontend/client
    res.setHeader('Content-Type', 'image/svg+xml');
    res.status(200).send(svgContent);

    // TODO: call function to convert SVG to PNG using sharp
    // TODO: call function to convert PNG to format to send to ESP32 for display on e-ink screen

});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
// Function to call the API
// const callApiContinuously = async () => {
//     try {
//         const response = await axios.get('https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival', {
//             params: {
//                 BusStopCode: 46679
//             },
//             headers: {
//                 'AccountKey': process.env.LTA_ACCOUNT_KEY,
//                 'Accept': 'application/json',
//             }
//         });
//         console.log('Full API Response:', JSON.stringify(response.data, null, 2));
//         const countBusServices = response.data.Services.length;
//         console.log(`Number of bus services at bus stop 46679: ${countBusServices}`);
//         const sendToFrontend = [];
//         for (let i = 0; i < countBusServices; i++) {
//             const service = response.data.Services[i];
//             console.log(`Bus Service No: ${service.ServiceNo}`);
//             // console.log(`Next Bus Arrival Time: ${service.NextBus.EstimatedArrival}`);
//             const arrivalTime = new Date(service.NextBus.EstimatedArrival);
//             const currentTime = new Date();
//             // console.log(`Current Time: ${currentTime.toISOString()}`);
//             const timeDifferenceMs = arrivalTime - currentTime; // Difference in milliseconds
//             const timeDifferenceMinutes = Math.floor(timeDifferenceMs / 60000);
//             console.log(`Time until arrival: ${timeDifferenceMinutes} minutes`);
//             console.log(`Bus Load: ${service.NextBus.Load}`);
//             sendToFrontend.push({
//                 serviceNo: service.ServiceNo,
//                 arrivalInMinutes: timeDifferenceMinutes,
//                 busLoad: service.NextBus.Load
//             });

//             const arrivalTime2 = new Date(service.NextBus2.EstimatedArrival);
//             const timeDifferenceMs2 = arrivalTime2 - currentTime;
//             const timeDifferenceMinutes2 = Math.floor(timeDifferenceMs2 / 60000);
//             console.log(`Time until arrival for 2nd bus: ${timeDifferenceMinutes2} minutes`);
//             console.log(`Bus Load for 2nd bus: ${service.NextBus2.Load}`);
//             sendToFrontend.push({
//                 serviceNo: service.ServiceNo,
//                 arrivalInMinutes: timeDifferenceMinutes2,
//                 busLoad: service.NextBus2.Load
//             });
            
//             const arrivalTime3 = new Date(service.NextBus3.EstimatedArrival);
//             const timeDifferenceMs3 = arrivalTime3 - currentTime;
//             const timeDifferenceMinutes3 = Math.floor(timeDifferenceMs3 / 60000);
//             console.log(`Time until arrival for 3rd bus: ${timeDifferenceMinutes3} minutes`);
//             console.log(`Bus Load for 3rd bus: ${service.NextBus3.Load}`);
//             sendToFrontend.push({
//                 serviceNo: service.ServiceNo,
//                 arrivalInMinutes: timeDifferenceMinutes3,
//                 busLoad: service.NextBus3.Load
//             });
//         }
//         console.log('Data to send to frontend:', sendToFrontend);
//     } catch (error) {
//         console.error('Error calling API:', error);
//     }
// };

// Call the API every 60 seconds
// setInterval(callApiContinuously, 10000);
