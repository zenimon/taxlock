import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import Playground from './pages/Playground/Playground';
import Simulation from './pages/Simulation/Simulation';
import Docs from './pages/Docs';

// Simple placeholder components for other routes
const Overview = () => (
  <div className="space-y-6">
    <h1 className="text-3xl font-bold">Overview</h1>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="premium-card">
        <h3 className="text-text-muted text-sm font-medium uppercase tracking-wider">Total Decisions</h3>
        <p className="text-3xl font-bold mt-2">1,284</p>
      </div>
      <div className="premium-card">
        <h3 className="text-text-muted text-sm font-medium uppercase tracking-wider">Risk Flag Rate</h3>
        <p className="text-3xl font-bold mt-2">4.2%</p>
      </div>
      <div className="premium-card">
        <h3 className="text-text-muted text-sm font-medium uppercase tracking-wider">Avg. Latency</h3>
        <p className="text-3xl font-bold mt-2">14ms</p>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* Docs routes - outside Layout to have full control of layout */}
        <Route path="/docs" element={<Docs />} />
        <Route path="/docs/:section" element={<Docs />} />
        
        {/* Main app routes with Layout */}
        <Route path="/" element={<Layout><Overview /></Layout>} />
        <Route path="/playground" element={<Layout><Playground /></Layout>} />
        <Route path="/simulation" element={<Layout><Simulation /></Layout>} />
        <Route path="/rules" element={<Layout><div className="text-2xl font-bold">Rules Engine (Coming Soon)</div></Layout>} />
        <Route path="/history" element={<Layout><div className="text-2xl font-bold">History (Coming Soon)</div></Layout>} />
      </Routes>
    </Router>
  );
}

export default App;
