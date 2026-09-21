import { BrowserRouter, Routes, Route } from "react-router";

import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";
import { Plans } from "./pages/Plans";
import { Checkout } from "./pages/Checkout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/checkout/:planId" element={<Checkout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
