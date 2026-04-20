import { ArrowRight, Wallet, Zap, PieChart } from 'lucide-react';

const steps = [
  {
    icon: Wallet,
    title: 'Money Arrives',
    description: 'Incoming revenue hits your account via payment processor, bank transfer, or any source.',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: Zap,
    title: 'TaxFlow Fires',
    description: 'Your rules engine evaluates the transaction and determines the optimal allocation split.',
    color: 'bg-[#534AB7]/10 text-[#534AB7]',
  },
  {
    icon: PieChart,
    title: 'Buckets Fill',
    description: 'Funds are automatically distributed to tax, operations, growth, or any custom bucket you define.',
    color: 'bg-amber-100 text-amber-600',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            How it works
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Three simple steps to automated financial management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              {/* Arrow for desktop */}
              {index < steps.length - 1 && (
                <div className="hidden md:flex absolute top-12 -right-6 translate-x-1/2 z-20 items-center justify-center">
                  <ArrowRight className="w-8 h-8 text-slate-300" />
                </div>
              )}

              <div className="flex flex-col items-center text-center">
                <div className={`w-24 h-24 ${step.color} rounded-2xl flex items-center justify-center mb-6 relative z-10`}>
                  <step.icon className="w-12 h-12" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600 px-4">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
