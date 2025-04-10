import { useEffect,useRef } from "react";
import { connectWithSocket } from "./utils/wssConnection/wssConnection";
import {BrowserRouter as Router, Route, Routes} from "react-router-dom";
import LoginPage from "./pages/LoginPage/LoginPage";
import Dashboard from "./pages/Dashboard/DashBoard";
function App() {
  const firstRenderRef = useRef(true);
  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    connectWithSocket();
  },[]);
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage/>} />
        <Route path="/login" element={<LoginPage/>} />
        <Route path="/dashboard" element={<Dashboard/>} />
      </Routes>
    </Router>
  );
}

export default App;
