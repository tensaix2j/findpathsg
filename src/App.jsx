

import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import Mapbox from './Mapbox'
import "./index.css"
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {

    

	return (
    	<div className="flex flex-col h-screen">
            <Mapbox className="flex-1" />
            <ToastContainer />
        </div>
        
	)
}

export default App
