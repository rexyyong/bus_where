import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

function ConvertedBinaryImage() {
  return (
    <Box className='PreviewBusTimingsBox'>
      <Typography variant="h6">Converted Preview</Typography>
      <Box className='PreviewBusTimingsImage'> 
        {/* Image will be displayed here */}
        <Typography variant="h6">image will be displayed here</Typography>
      </Box>
    </Box>
  ); 
}

export default ConvertedBinaryImage;