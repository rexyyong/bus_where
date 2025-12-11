import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/Delete';

function listAddedBusStops(sharedBusStopCodes, removeBusStopCode) {
    const allBusStops = sharedBusStopCodes.map(code =>
        <Grid container spacing={3} className='AddedBusStopCodeCss' key={code.id}>
            <Typography variant="body1" key={code.id}>{code.code}</Typography>
            <Button 
                variant="outlined" 
                size='small' 
                startIcon={<DeleteIcon />}
                // onClick={removeBusStopCode}
                onClick={() => {
                    console.log("Remove bus stop code clicked");
                    console.log("id clicked: ", code);
                    removeBusStopCode(code);
                }}
            >
                Remove
            </Button>
        </Grid>
    );
    return <ul>{allBusStops}</ul>;
}

function AddedBusStopCode({sharedBusStopCodes, removeBusStopCode}) {
  return (
    <Box className='AddedBusStopBox'>
        <Typography variant="h6">Added Bus Stop Codes</Typography>
        <Box sx={{border: '3px solid #61dafb', borderRadius: '10px'}}>
            {listAddedBusStops(sharedBusStopCodes, removeBusStopCode)}
        </Box>
    </Box>
  );
}

export default AddedBusStopCode;