import React, { useRef, useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';

function PreviewBusTimings() {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("Idle");

  // We wrap the fetch logic in useCallback (optional but good practice) 
  // or simply define it inside the component.
  const fetchAndDrawBinary = async () => {
    setStatus("Fetching binary from backend...");
    try {
      const response = await fetch(`${process.env.REACT_APP_BUS_ARRIVAL_BACKEND_LINK}/api/create-bus-timings-image`);
      
      if (!response.ok) {
        throw new Error(`Server Error: ${response.status}`);
      }

      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();
      const packedView = new Uint8Array(buffer);

      if (packedView.length !== 48000) {
        setStatus(`Error: Received ${packedView.length} bytes. Expected 48,000.`);
        return;
      }

      const canvas = canvasRef.current;
      // Safety check: ensure canvas exists before drawing
      if (!canvas) return; 

      const ctx = canvas.getContext('2d');
      const width = 800;
      const height = 480;

      const imgData = ctx.createImageData(width, height);
      const data = imgData.data; 

      let pixelIndex = 0; 

      for (let i = 0; i < packedView.length; i++) {
        const byte = packedView[i];
        for (let bit = 0; bit < 8; bit++) {
          const mask = 1 << (7 - bit);
          const isWhite = (byte & mask) !== 0;
          const color = isWhite ? 255 : 0; 

          data[pixelIndex]     = color; 
          data[pixelIndex + 1] = color; 
          data[pixelIndex + 2] = color; 
          data[pixelIndex + 3] = 255;   

          pixelIndex += 4; 
        }
      }

      ctx.putImageData(imgData, 0, 0);
      
      // Update the status with the current time so you know it worked
      const time = new Date().toLocaleTimeString();
      setStatus(`Display Updated at ${time} (Binary Verified)`);

    } catch (error) {
      console.error('Error fetching binary:', error);
      setStatus("Failed to fetch data");
    }
  };

  //  Auto-Update Logic 
  useEffect(() => {
    // 1. Fetch immediately when the component mounts
    fetchAndDrawBinary();

    // 2. Set up a timer to fetch every 60 seconds (60000 ms)
    const intervalId = setInterval(() => {
      console.log("Auto-refreshing bus timings...");
      fetchAndDrawBinary();
    }, 60000);

    // 3. Cleanup: Stop the timer if the user leaves the page
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array [] means "run once on mount"

  return (
    <Box className='PreviewBusTimingsBox' sx={{ p: 2, border: '1px solid #ddd', mt: 2 }}>
      <Grid sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '50%', marginBottom: '4px'}}>
        <Typography variant="h6">Bus Timings Preview</Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={fetchAndDrawBinary}
        >
          Refresh Now
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
          backgroundColor: '#ccc',
          padding: '10px',
          border: '1px dashed #999',
          overflow: 'auto' 
        }}
      >
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