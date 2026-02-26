'use client';

import { CheckCircle } from 'lucide-react';

interface StepConfig {
  title: string;
  description?: string;
}

interface StepWizardProps {
  steps: StepConfig[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  children: React.ReactNode;
}

export default function StepWizard({ steps, currentStep, onStepClick, children }: StepWizardProps) {
  return (
    <div>
      {/* Progress Bar */}
      <nav className="mb-8">
        <ol className="flex items-center">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;

            return (
              <li key={index} className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}>
                <button
                  type="button"
                  onClick={() => onStepClick?.(index)}
                  disabled={index > currentStep}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                    isCompleted
                      ? 'text-blue-600 cursor-pointer'
                      : isCurrent
                      ? 'text-blue-600'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors ${
                      isCompleted
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : isCurrent
                        ? 'border-blue-500 bg-slate-800 text-blue-400'
                        : 'border-slate-600/50 bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <CheckCircle size={16} /> : index + 1}
                  </span>
                  <span className="hidden sm:inline">{step.title}</span>
                </button>

                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-3 ${
                      isCompleted ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Step Content */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">{steps[currentStep].title}</h2>
        {steps[currentStep].description && (
          <p className="text-sm text-gray-500 mt-1">{steps[currentStep].description}</p>
        )}
      </div>

      {children}
    </div>
  );
}
