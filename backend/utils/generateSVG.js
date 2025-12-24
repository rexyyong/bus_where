function generateSVG(allBusData) {
    console.log("Generating SVG with bus data:", JSON.stringify(allBusData, null, 2));

    const WIDTH = 800;
    const HEIGHT = 480;
    const PADDING = 20;
    const HEADER_HEIGHT = 50;
    
    // Get Current Singapore Time 
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-SG', { 
        timeZone: 'Asia/Singapore', // Forces Singapore Timezone
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
    
    const updateText = `Updated: ${timeString}`;

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

    // Increased font-size to 35 and added font-weight="bold"
    svgContent += `
    <text x="${WIDTH - 15}" y="${HEIGHT - 15}" font-size="35" font-weight="bold" font-family="Arial" fill="black" text-anchor="end">
        ${updateText}
    </text>
    `;
    
    svgContent += `</svg>`;
    
    return svgContent;
}

function generateBusIcon(type) {
    const iconWidth = 30;
    const iconHeight = 16;
    
    let icon = '';
    
    if (type === 'SD') {
        icon = `<svg width="${iconWidth}" height="${iconHeight}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 16">
            <rect x="2" y="3" width="26" height="8" fill="none" stroke="black" stroke-width="1.5"/>
            <circle cx="8" cy="14" r="1.5" fill="black"/>
            <circle cx="24" cy="14" r="1.5" fill="black"/>
        </svg>`;
    } else if (type === 'DD') {
        icon = `<svg width="${iconWidth}" height="${iconHeight}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 16">
            <rect x="2" y="1" width="26" height="5" fill="none" stroke="black" stroke-width="1.5"/>
            <rect x="2" y="6" width="26" height="5" fill="none" stroke="black" stroke-width="1.5"/>
            <circle cx="8" cy="14" r="1.5" fill="black"/>
            <circle cx="24" cy="14" r="1.5" fill="black"/>
        </svg>`;
    } else if (type === 'BD') {
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

module.exports = { generateSVG, generateBusIcon };