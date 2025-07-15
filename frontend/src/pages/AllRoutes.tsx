// frontend/src/pages/AllRoutes.tsx

import { Route, Routes, BrowserRouter } from "react-router-dom";

import LandingPg from "./LandingPg";

import Converse from "./Converse";

export default function AllRoutes() {

  return (<>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPg />} />
        <Route path="/converse" element={<Converse />} />
      </Routes>
    </BrowserRouter>
  </>
  )
}

