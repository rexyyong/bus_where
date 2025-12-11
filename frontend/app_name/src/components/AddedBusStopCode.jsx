import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/Delete';

function AddedBusStopCode() {
  return (
    <Box className='AddedBusStopBox'>
      <Typography variant="h6">Added Bus Stops</Typography>
      <Grid container spacing={3} className='AddedBusStopCodeCss'>
        <Typography variant="body1">Added Bus stop</Typography>
        <Button variant="outlined" size='small' startIcon={<DeleteIcon />}>Remove</Button>
      </Grid>
    </Box>
  );
}

export default AddedBusStopCode;