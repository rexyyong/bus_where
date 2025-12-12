import './App.css';
import HeaderOne from './components/HeaderOne';
import AddBusStopCode from './components/AddBusStopCode';
import AddedBusStopCode from './components/AddedBusStopCode';
import PreviewBusTimings from './components/PreviewBusTimings';
import ConvertedBinaryImage from './components/ConvertedBinaryImage';
import React from 'react';



function App() {
  // shared state for bus stop codes
  const [code, setCode] = React.useState('');
  const [sharedBusStopCodes, setSharedBusStopCodes] = React.useState([]);
  const [availableIDs, setAvailableIDs] = React.useState([...Array(100).keys()]); // IDs from 0 to 99

  // function to add bus stop code passed into the AddBusStopCode component
  function addBusStop (event) {
    const nextBusStopCodes = [
      ...sharedBusStopCodes,
      { id: availableIDs.shift(), code: code }
    ];
    setSharedBusStopCodes(nextBusStopCodes);
    event.preventDefault();
    setCode('');
    setAvailableIDs([...availableIDs]);
    console.log("availableIDS after addition: ", availableIDs);
  }

  //function to remove bus stop code passed into AddedBusStopCode component
  function removeBusStopCode (code) {
    console.log("Removing bus stop code with id: ", code.id);
    setSharedBusStopCodes(
      sharedBusStopCodes.filter(code_clicked => code_clicked.id !== code.id)
    );
    availableIDs.push(code.id);
  }

  // For debugging: log state updates for sharedBusStopCodes
  React.useEffect(() => {
    console.log("State updated for sharedBusStopCodes:", sharedBusStopCodes);
  }, [sharedBusStopCodes]);


  // function to send confirmed bus stop codes to backend
  function confirmBusCodes() {
    console.log("Confirming bus stop codes:", sharedBusStopCodes);
    // prepare payload to send to backend
    let payload = [];
    for (let busStopCodes of sharedBusStopCodes) {
      payload.push(busStopCodes.code);
    }
    console.log("Payload to send to backend:", payload);
    fetch(`${process.env.REACT_APP_BUS_ARRIVAL_BACKEND_LINK}/api/confirm-bus-codes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Successfully confirmed bus stop codes:', data);
    })
    .catch((error) => {
      console.error('Error confirming bus stop codes:', error);
    });
  }

  return (
    <div className="App">
      <HeaderOne />
      <AddBusStopCode 
        busStopCode={code} 
        setBusStopCode={setCode}
        addBusStop = {addBusStop}
      />
      <AddedBusStopCode
        sharedBusStopCodes={sharedBusStopCodes}
        removeBusStopCode={removeBusStopCode}
        confirmBusCodes={confirmBusCodes}
      />
      <PreviewBusTimings />
    </div>
   );
}

export default App;
