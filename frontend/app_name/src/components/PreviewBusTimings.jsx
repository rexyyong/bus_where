import React, { useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';

function PreviewBusTimings() {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("Idle");

  const fetchAndDrawBinary = async () => {
    setStatus("Fetching binary from backend...");
    try {
      // 1. Fetch the RAW binary data (Same endpoint ESP32 uses)
      // Make sure this matches your actual backend route
      const response = await fetch(`${process.env.REACT_APP_BUS_ARRIVAL_BACKEND_LINK}/api/create-bus-timings-image`);
      
      if (!response.ok) {
        throw new Error(`Server Error: ${response.status}`);
      }

      // 2. Get data as ArrayBuffer
      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();
      const packedView = new Uint8Array(buffer);

      // Validation: 800 * 480 pixels / 8 bits per byte = 48,000 bytes
      if (packedView.length !== 48000) {
        setStatus(`Error: Received ${packedView.length} bytes. Expected 48,000.`);
        return;
      }

      // 3. Render to Canvas (Unpacking Logic)
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const width = 800;
      const height = 480;

      // Create a blank image buffer for the canvas (RGBA format)
      const imgData = ctx.createImageData(width, height);
      const data = imgData.data; // This is a 1D array: [R, G, B, A, R, G, B, A...]

      let pixelIndex = 0; // Pointer for the target Canvas array

      // Loop through every byte of the packed binary
      for (let i = 0; i < packedView.length; i++) {
        const byte = packedView[i];

        // Loop through the 8 bits inside this byte
        for (let bit = 0; bit < 8; bit++) {
          // Extract the single bit (MSB first)
          // (1 << 7) checks the first bit, (1 << 6) the second, etc.
          const mask = 1 << (7 - bit);
          const isWhite = (byte & mask) !== 0;

          // Convert 1-bit color to 32-bit RGBA color
          const color = isWhite ? 255 : 0; // 255 = White, 0 = Black

          data[pixelIndex]     = color; // Red
          data[pixelIndex + 1] = color; // Green
          data[pixelIndex + 2] = color; // Blue
          data[pixelIndex + 3] = 255;   // Alpha (Fully Opaque)

          pixelIndex += 4; // Move to the next pixel block
        }
      }

      // Paint the pixels onto the canvas
      ctx.putImageData(imgData, 0, 0);
      setStatus("Display Updated (Binary Verified)");

    } catch (error) {
      console.error('Error fetching binary:', error);
      setStatus("Failed to fetch data");
    }
  };

  return (
    <Box className='PreviewBusTimingsBox' sx={{ p: 2, border: '1px solid #ddd', mt: 2 }}>
      <Grid sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '50%', marginBottom: '4px'}}>
        <Typography variant="h6">Bus Timings Preview</Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={fetchAndDrawBinary}
        >
          Refresh Timings
        </Button>
      </Grid>
      
      <Typography variant="body1" display="block" mb={1}>
        Status: {status}
      </Typography>

      <Box 
        className='PreviewBusTimingsImage'
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#ccc', // Grey background to see the white canvas clearly
          padding: '10px',
          border: '1px dashed #999',
          overflow: 'auto' 
        }}
      >
        {/* The Canvas matches the physical screen resolution */}
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={480} 
          style={{ 
            border: '2px solid black', 
            maxWidth: '100%', 
            height: 'auto' 
          }} 
        />
      </Box>
    </Box>
  );
}

export default PreviewBusTimings;