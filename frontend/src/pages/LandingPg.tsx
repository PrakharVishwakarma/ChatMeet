// frontend/src/pages/LandingPg.tsx

import { useNavigate } from "react-router-dom";
import { Hero } from "../components/landing/Hero";
import { Features } from "../components/landing/Features";
import { CTA } from "../components/landing/CTA";

export default function LandingPg() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/converse");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
      <div className="absolute inset-0 bg-sky-800 opacity-30"></div>

      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="relative z-10">
        <Hero onGetStarted={handleGetStarted} />
        <Features />
        <CTA onGetStarted={handleGetStarted} />
      </div>
    </div>
  );
}