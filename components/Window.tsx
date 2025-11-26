
import React, { useState } from 'react';
import { CheckCircleIcon, ClockIcon, GlobeAltIcon, LockClosedIcon, BeakerIcon, ChipIcon, ShieldCheckIcon, WifiIcon, MapIcon, DocumentTextIcon, XMarkIcon, CreditCardIcon, CheckCircleIcon as SuccessIcon } from './Icons';

interface Plan {
    name: string;
    price: string;
    mcu: string;
    bestFor: string;
    feature: string;
    highlight?: boolean;
}

const PricingCard: React.FC<{
  plan: Plan;
  onSelect: (plan: Plan) => void;
}> = ({ plan, onSelect }) => (
  <div className={`border rounded-xl p-6 flex flex-col h-full relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
    plan.highlight ? 'bg-primary/10 dark:bg-primary/20 border-primary' : 'bg-white/5 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
  }`}>
    {plan.highlight && (
      <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-4 py-1 rounded-bl-lg">Most Popular</div>
    )}
    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
    <p className="mt-2 text-gray-900 dark:text-white">
      <span className="text-4xl font-extrabold">£{plan.price}</span>
      <span className="text-lg font-medium text-gray-500 dark:text-gray-400">/month</span>
    </p>
    <p className="mt-4 text-lg font-semibold text-gray-800 dark:text-gray-200">{plan.mcu}</p>
    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 flex-grow">{plan.bestFor}</p>
    <ul className="mt-6 space-y-2 text-sm text-gray-700 dark:text-gray-300">
      <li className="flex items-center gap-2">
        <CheckCircleIcon className="w-5 h-5 text-green-500" />
        <span>{plan.feature}</span>
      </li>
       <li className="flex items-center gap-2">
        <CheckCircleIcon className="w-5 h-5 text-green-500" />
        <span>Unlimited standard-speed queue</span>
      </li>
       <li className="flex items-center gap-2">
        <CheckCircleIcon className="w-5 h-5 text-green-500" />
        <span>Unlimited text &amp; code outputs</span>
      </li>
    </ul>
    <button 
        onClick={() => onSelect(plan)}
        className={`w-full py-3 font-semibold rounded-lg mt-8 transition-colors ${
      plan.highlight ? 'bg-primary text-white hover:bg-blue-600' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
    }`}>
      Choose Plan
    </button>
  </div>
);

const SubscriptionModal: React.FC<{ plan: Plan; onClose: () => void; onConfirm: () => void }> = ({ plan, onClose, onConfirm }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700 relative animate-fade-in-up">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                <XMarkIcon className="w-6 h-6" />
            </button>
            
            <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">Confirm Subscription</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">You are upgrading to the <span className="font-bold text-primary">{plan.name}</span> plan.</p>

            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6 border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Plan Cost</span>
                    <span className="text-xl font-bold text-gray-900 dark:text-white">£{plan.price}<span className="text-sm font-normal text-gray-500">/mo</span></span>
                </div>
                <div className="flex justify-between items-center">
                     <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Compute Units</span>
                     <span className="text-sm font-mono text-blue-500">{plan.mcu}</span>
                </div>
            </div>

            <div className="space-y-3 mb-6">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <CreditCardIcon className="w-4 h-4" /> Payment Method
                </h3>
                <div className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-primary transition-colors bg-white dark:bg-gray-900/30">
                    <div className="w-8 h-5 bg-gray-800 rounded"></div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200">Aetherius Wallet</p>
                        <p className="text-xs text-gray-500">Balance: 1,250 Æ</p>
                    </div>
                    <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                    </div>
                </div>
            </div>

            <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-lg font-semibold text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Cancel</button>
                <button onClick={onConfirm} className="flex-1 py-2.5 rounded-lg font-semibold text-white bg-primary hover:bg-blue-600 transition-colors shadow-lg">Confirm & Pay</button>
            </div>
        </div>
    </div>
);

const SuccessModal: React.FC<{ planName: string; onClose: () => void }> = ({ planName, onClose }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
         <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-8 border border-gray-200 dark:border-gray-700 flex flex-col items-center text-center animate-fade-in-up">
             <SuccessIcon className="w-16 h-16 text-green-500 mb-4" />
             <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Upgrade Successful!</h2>
             <p className="text-gray-600 dark:text-gray-300 mb-6">You are now subscribed to the <strong>{planName}</strong> plan. Your compute units have been allocated.</p>
             <button onClick={onClose} className="w-full py-2.5 rounded-lg font-semibold text-white bg-primary hover:bg-blue-600 transition-colors">Done</button>
         </div>
    </div>
);

export const AetherialNetworksPricing: React.FC = () => {
  const [planType, setPlanType] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showSuccess, setShowSuccess] = useState<string | null>(null);

  const monthlyPlans: Plan[] = [
    { name: 'Spark', price: '8', mcu: '2,000 MCU', bestFor: 'Students, casual users, simple chatbots, basic text summary.', feature: 'Basic API Access' },
    { name: 'Flow', price: '12', mcu: '8,000 MCU', bestFor: 'Power users, content creators, advanced summarization.', feature: 'Standard Priority Queue' },
    { name: 'Surge', price: '18', mcu: '25,000 MCU', bestFor: 'Developers, small businesses, multi-modal projects (image+text).', feature: 'Advanced API + WebSocket Access', highlight: true },
  ];

  const annualPlans: Plan[] = [
    { name: 'Catalyst Builder', price: '15', mcu: '25,000 MCU', bestFor: 'Small businesses and developers committing for the year.', feature: 'High-Priority Processing' },
    { name: 'Catalyst Innovator', price: '22', mcu: '120,000 MCU', bestFor: 'Startups and research teams needing consistent high volume.', feature: 'High-Priority Processing, 128k Context' },
    { name: 'Catalyst Enterprise', price: 'Custom', mcu: 'Tailored MCU', bestFor: 'Large organizations with specific needs.', feature: 'Custom Models & Private Deployment', highlight: true },
  ];

  const addOns = [
    { name: 'Real-Time Sync', price: '£5/month', description: 'Ultra-low latency for real-time chatbot applications.', icon: ClockIcon },
    { name: 'Quantum-Resistant Encryption', price: '£3/month', description: 'Secure all data with post-quantum cryptographic algorithms.', icon: LockClosedIcon },
    { name: 'Neuromorphic Compute Boost', price: '£10/month', description: '10x efficiency boost on pattern-matching workloads.', icon: BeakerIcon },
    { name: 'Sovereign Data Pack', price: 'Varies', description: 'Guarantee data residency within a specific geographic region.', icon: MapIcon },
  ];

   const features = [
    { name: '5G-Fast Inference', description: 'Optimized latency across all plans.', icon: WifiIcon },
    { name: 'Unlimited Outputs', description: 'No per-token charges on generated text/code.', icon: DocumentTextIcon },
    { name: 'Global AI Roaming', description: 'Process over 100 languages with no extra cost.', icon: GlobeAltIcon },
    { name: 'Aetherius Core', description: 'Runs on our distributed, energy-optimized compute grid.', icon: ChipIcon },
    { name: 'Ethical AI Sourcing', description: 'Training data is ethically sourced and fully licensed.', icon: ShieldCheckIcon },
  ];

  const handlePurchase = () => {
      if (selectedPlan) {
          const name = selectedPlan.name;
          setSelectedPlan(null);
          setTimeout(() => setShowSuccess(name), 300);
      }
  };

  return (
    <div className="h-full w-full bg-background-light dark:bg-gray-900 text-content-light dark:text-content-dark overflow-y-auto p-6 sm:p-8">
      {selectedPlan && (
          <SubscriptionModal 
            plan={selectedPlan} 
            onClose={() => setSelectedPlan(null)} 
            onConfirm={handlePurchase}
          />
      )}
      {showSuccess && (
          <SuccessModal 
            planName={showSuccess}
            onClose={() => setShowSuccess(null)}
          />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">Aetherial Networks</h1>
          <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-primary">The Future of AI Compute is Here.</h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">
            Forget tokens. Think smarter. We don't count words; we measure computational value, offering unparalleled efficiency and fairness.
          </p>
        </header>

        {/* Plan Toggle */}
        <div className="flex justify-center mb-10">
          <div className="bg-gray-200 dark:bg-gray-800 rounded-full p-1 flex items-center space-x-1">
            <button
              onClick={() => setPlanType('monthly')}
              className={`px-6 py-2 text-sm font-semibold rounded-full transition-colors ${planType === 'monthly' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}
            >
              Monthly Rolling
            </button>
            <button
              onClick={() => setPlanType('annual')}
              className={`px-6 py-2 text-sm font-semibold rounded-full transition-colors ${planType === 'annual' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}
            >
              Annual Contracts
            </button>
          </div>
        </div>

        {/* Pricing Grids */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${planType !== 'monthly' && 'hidden'}`}>
          {monthlyPlans.map(plan => <PricingCard key={plan.name} plan={plan} onSelect={setSelectedPlan} />)}
        </div>
         <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${planType !== 'annual' && 'hidden'}`}>
          {annualPlans.map(plan => <PricingCard key={plan.name} plan={plan} onSelect={setSelectedPlan} />)}
        </div>

        {/* Other Sections */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
             <section>
              <h3 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Key Features</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {features.map(({ name, description, icon: Icon }) => (
                   <div key={name} className="flex items-start gap-4">
                      <div className="bg-primary/10 text-primary p-3 rounded-full"><Icon className="w-6 h-6"/></div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">{name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
                      </div>
                   </div>
                ))}
              </div>
            </section>
            <section>
              <h3 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Why Our Model is Superior</h3>
              <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 space-y-2">
                  <p><strong>Fairness:</strong> You don't pay the same price to process "hello world" and a complex legal clause. Cost reflects computational complexity.</p>
                  <p><strong>Efficiency:</strong> Our Neural Dynamo Engine uses dynamic byte patching, reducing wasted computation on simple data and allocating it where it's needed most. This saving is passed to you.</p>
                  <p><strong>Transparency:</strong> Compute Units (MCUs) are a clearer representation of the actual server-side effort than abstract token counts.</p>
                  <p><strong>Robustness:</strong> Byte-level processing handles emojis, code formatting, typos, and low-resource languages without breaking a sweat, making the service more reliable and predictable.</p>
              </div>
            </section>
          </div>
          <div className="space-y-8">
            <section className="bg-white/5 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Pay-As-You-Go</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Perfect for low-volume users. You only pay for the computational power you consume.</p>
              <p className="text-center my-4 text-gray-900 dark:text-white">
                <span className="text-3xl font-extrabold">5 Æ</span>
                <span className="text-lg font-medium text-gray-500 dark:text-gray-400"> / Million Compute Units (MCU)</span>
              </p>
            </section>
            <section>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Future-Proof Add-Ons</h3>
              <div className="space-y-4">
                {addOns.map(({name, price, description, icon: Icon}) => (
                  <div key={name} className="bg-white/5 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex items-start gap-3">
                    <Icon className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <div className="flex justify-between items-baseline">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{name}</h4>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{price}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
