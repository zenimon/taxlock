import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import Playground from './pages/Playground/Playground';
import Simulation from './pages/Simulation/Simulation';

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
      <Layout>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/playground" element={<Playground />} />
          <Route path="/simulation" element={<Simulation />} />
          <Route path="/rules" element={<div className="text-2xl font-bold">Rules Engine (Coming Soon)</div>} />
          <Route path="/history" element={<div className="text-2xl font-bold">History (Coming Soon)</div>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
