import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { ArrowRight } from 'lucide-react';

export default function CtaBanner() {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-indigo-600 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Start allocating smarter today
          </h2>
          <p className="text-lg text-indigo-200 max-w-2xl mx-auto mb-8">
            Join hundreds of businesses using Decision API to automate their financial decisions.
            Free to start, no credit card required.
          </p>
          <Link to="/signup">
            <Button variant="secondary" size="lg">
              Sign Up Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
