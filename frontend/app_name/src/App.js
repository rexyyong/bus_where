import './App.css';
import HeaderOne from './components/HeaderOne';
import AddBusStopCode from './components/AddBusStopCode';
import AddedBusStopCode from './components/AddedBusStopCode';
import PreviewBusTimings from './components/PreviewBusTimings';
import ConvertedBinaryImage from './components/ConvertedBinaryImage';
import React from 'react';


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
