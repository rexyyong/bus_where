
function extractRelevantBusData(busData, busStopCode) {
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

module.exports = { extractRelevantBusData };