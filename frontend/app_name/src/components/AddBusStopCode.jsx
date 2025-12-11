import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import React from 'react';

function AddBusStopCode() {
    const [busStopCode, setBusStopCode] = React.useState('');

    function addBusStop (event) {
        // function to add bus stop code
        event.preventDefault();
        console.log("Bus stop code added: ", busStopCode);
    }

    return (
        <Box component="form" onSubmit={addBusStop}>
            <Grid container spacing={1} className='AddBusStopCodeCss'>
                <TextField 
                    required 
                    id="bus_stop_code_value" 
                    label="Enter Bus stop Code" 
                    variant="outlined" 
                    size='small'
                    value = {busStopCode}
                    onChange={(e) => setBusStopCode(e.target.value)}
                />
                <Button 
                    variant="contained" 
                    size='small' 
                    type="submit"
                >
                    Add
                </Button>
            </Grid>
        </Box>
    );
}


export default AddBusStopCode;