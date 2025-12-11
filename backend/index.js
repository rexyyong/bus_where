const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 8080;

const allowedOrigins = [process.env.allowed_origin];

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
