import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

function PreviewBusTimings() {
  return (
    <Box className='PreviewBusTimingsBox'>
      <Typography variant="h6">Bus Timings Preview</Typography>
      <Box className='PreviewBusTimingsImage'>
        {/* Image will be displayed here */}
        <Typography variant="h6">image will be displayed here</Typography>
      </Box>
    </Box>
  );
}

export default PreviewBusTimings;