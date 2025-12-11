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
      />
      <PreviewBusTimings />
      <ConvertedBinaryImage />
    </div>
   );
}

export default App;
