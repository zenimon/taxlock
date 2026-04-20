import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'Perfect for getting started with automated allocation.',
    features: [
      '1,000 API calls/month',
      '3 custom rules',
      'Basic risk scoring',
      'Email support',
      '1 webhook endpoint',
    ],
    cta: 'Start Free',
    highlighted: false,
  },
  {
    name: 'Growth',
    price: '$49',
    period: '/month',
    description: 'For growing businesses that need more power.',
    features: [
      '50,000 API calls/month',
      'Unlimited rules',
      'Advanced risk scoring',
      'Priority support',
      '10 webhook endpoints',
      'Simulation engine',
      'Cashflow projections',
    ],
    cta: 'Start Growth',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large organizations with custom needs.',
    features: [
      'Unlimited API calls',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantees',
      'Unlimited webhooks',
      'Advanced analytics',
      'Custom contracts',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

export default function PricingCards() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Start free and scale as you grow. No hidden fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 ${
                plan.highlighted
                  ? 'bg-[#534AB7] text-white ring-4 ring-[#534AB7]/20'
                  : 'bg-slate-50 border border-slate-200'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </div>
              )}
              
              <div className="mb-6">
                <h3 className={`text-xl font-semibold mb-2 ${plan.highlighted ? 'text-white' : 'text-slate-900'}`}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className={`text-4xl font-bold ${plan.highlighted ? 'text-white' : 'text-slate-900'}`}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className={plan.highlighted ? 'text-violet-100' : 'text-slate-500'}>
                      {plan.period}
                    </span>
                  )}
                </div>
                <p className={`mt-2 text-sm ${plan.highlighted ? 'text-violet-100' : 'text-slate-600'}`}>
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 flex-shrink-0 ${plan.highlighted ? 'text-emerald-300' : 'text-emerald-600'}`} />
                    <span className={`text-sm ${plan.highlighted ? 'text-violet-50' : 'text-slate-600'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link to="/signup" className="block">
                <Button
                  variant={plan.highlighted ? 'secondary' : 'primary'}
                  size="lg"
                  className="w-full"
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
