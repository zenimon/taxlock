import { Zap, Shield, BarChart3, Webhook, Code, Layers } from 'lucide-react';

const features = [
  {
    name: 'Real-time Allocation',
    description: 'Automatically split incoming revenue into custom buckets the moment money arrives.',
    icon: Zap,
  },
  {
    name: 'Risk Scoring',
    description: 'Get instant risk assessments on every transaction with configurable thresholds.',
    icon: Shield,
  },
  {
    name: 'Custom Rules Engine',
    description: 'Build powerful allocation rules with conditions on amount, source, metadata, and more.',
    icon: Layers,
  },
  {
    name: 'Simulation Engine',
    description: 'Test scenarios and project cashflow without affecting real data or firing webhooks.',
    icon: BarChart3,
  },
  {
    name: 'Webhook Events',
    description: 'Get notified instantly when allocations happen, risks are detected, or rules fire.',
    icon: Webhook,
  },
  {
    name: 'API-First Design',
    description: 'Built for developers with clean REST APIs, comprehensive docs, and SDKs coming soon.',
    icon: Code,
  },
];

export default function FeatureGrid() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Everything you need to manage money smarter
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Powerful features that help you automate financial decisions and stay compliant.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="bg-slate-50 rounded-xl p-6 border border-slate-200 hover:border-indigo-200 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.name}</h3>
              <p className="text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
