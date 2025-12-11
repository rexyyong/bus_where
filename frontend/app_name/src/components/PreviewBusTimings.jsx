import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';

function PreviewBusTimings({getBusTimings}) {
  return (
    <Box className='PreviewBusTimingsBox'>
      <Grid sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '50%', marginBottom: '4px'}}>
        <Typography variant="h6">Bus Timings Preview</Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => getBusTimings()}
        >
          Refresh Timings
        </Button>
      </Grid>
      <Box className='PreviewBusTimingsImage'>
        {/* Image will be displayed here */}
        <Typography variant="h6">image will be displayed here</Typography>
      </Box>
    </Box>
  );
}

export default PreviewBusTimings;