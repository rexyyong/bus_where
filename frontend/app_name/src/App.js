import logo from './logo.svg';
import './App.css';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import DeleteIcon from '@mui/icons-material/Delete';






function HeaderOne() {
  return (
    <h1 className='HeadOne'>Bus Where?!</h1>
  );
}

function AddBusStopCode() {
  return (
    <Box>
      <Grid container spacing={1} className='AddBusStopCodeCss'>
        <TextField required id="outlined" label="Enter Bus stop Code" variant="outlined" size='small' />
        <Button variant="contained" size='small'>Add</Button>
      </Grid>
    </Box>

  );
}

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

function App() {
  return (
    <div className="App">
      <HeaderOne />
      <AddBusStopCode />
      <AddedBusStopCode />
      <PreviewBusTimings />
      <ConvertedBinaryImage />
    </div>
   );
}

export default App;
