import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AnalysisPage from "./pages/AnalysisPage";
import RoadmapPage from "./pages/RoadmapPage";
import { ThemeToggle } from "./components/ThemeToggle";

function Nav() {
  return (
    <nav className="fixed top-0 right-0 z-50 p-4">
      <ThemeToggle />
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
        <Route path="/roadmap" element={<RoadmapPage />} />
      </Routes>
    </BrowserRouter>
  );
}
