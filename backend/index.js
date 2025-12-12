const express = require('express');
const axios = require('axios');
require('dotenv').config();
const mongoose = require('mongoose');
const xml2js = require('xml2js');

const app = express();
const PORT = 8080;

const allowedOrigins = [process.env.allowed_origin];

// import utility functions
const {extractRelevantBusData} = require('./utils/extractRelevantBusData');
const {getBusStopDetails} = require('./utils/getBusStopDetails');
const {generateSVG} = require('./utils/generateSVG');


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

// CORS middleware
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

// Middleware to parse JSON bodies
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
    }
    catch (err) {
        console.error(`Error retrieving latest bus codes: ${err}`);
        res.status(500).json({ error: 'Failed to retrieve latest bus codes' });
    }

    // call LTA API for each bus stop code to get raw data
    const allBusData = [];
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