import { ArrowRight, Zap, Shield, BarChart3, Webhook, Code, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { PublicNav } from '../layout/PublicNav';
import HeroSection from './HeroSection';
import FeatureGrid from './FeatureGrid';
import HowItWorks from './HowItWorks';
import PricingCards from './PricingCards';
import CtaBanner from './CtaBanner';

export default function Hero() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />
      
      <main className="pt-16">
        <HeroSection />
        <FeatureGrid />
        <HowItWorks />
        <PricingCards />
        <CtaBanner />
      </main>

      <footer className="border-t border-slate-200 bg-slate-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><Link to="/docs" className="hover:text-slate-900">Documentation</Link></li>
                <li><a href="#" className="hover:text-slate-900">API Reference</a></li>
                <li><a href="#" className="hover:text-slate-900">Changelog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-slate-900">About</a></li>
                <li><a href="#" className="hover:text-slate-900">Blog</a></li>
                <li><a href="#" className="hover:text-slate-900">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-slate-900">Privacy</a></li>
                <li><a href="#" className="hover:text-slate-900">Terms</a></li>
                <li><a href="#" className="hover:text-slate-900">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Connect</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-slate-900">Twitter</a></li>
                <li><a href="#" className="hover:text-slate-900">GitHub</a></li>
                <li><a href="#" className="hover:text-slate-900">Discord</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-200 text-center text-sm text-slate-500">
            © 2024 Decision API. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
