import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Store, ShoppingCart, Package, ChevronRight, ChevronLeft, Check } from "lucide-react";
import teamWolfLogo from "@/assets/teamwolf-logo.png";

interface OnboardingGuideProps {
  open: boolean;
  onComplete: () => void;
}

const STEPS = [
  {
    icon: Store,
    title: "Browse Stores",
    description: "Browse our premium supplement collection — protein, pre-workout, BCAAs and more!",
    action: "Shop Now",
    path: "/products",
  },
  {
    icon: ShoppingCart,
    title: "Add to Cart",
    description: "Found something you like? Tap the product to add it to your cart. Adjust quantities as needed.",
    action: "I understand",
    path: null,
  },
  {
    icon: Package,
    title: "Checkout & Track",
    description: "Review your cart, confirm your address (from your profile), and place your order. Track it in real-time!",
    action: "Complete Setup",
    path: null,
  },
];

const OnboardingGuide = ({ open, onComplete }: OnboardingGuideProps) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const currentStep = STEPS[step];
  const Icon = currentStep.icon;
  const progress = ((step + 1) / STEPS.length) * 100;

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleAction = () => {
    if (currentStep.path) {
      onComplete();
      navigate(currentStep.path);
    } else {
      handleNext();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md p-0 overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header with mascot */}
        <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-6 pb-10 text-center relative">
          <img
            src={teamWolfLogo}
            alt="Team Wolf"
            className="w-20 h-20 mx-auto mb-3 rounded-full"
          />
          <h2 className="font-outfit font-bold text-xl">Welcome to Team Wolf!</h2>
          <p className="text-sm text-muted-foreground mt-1">Let me show you around</p>

          {/* Progress */}
          <div className="absolute bottom-0 left-0 right-0 px-6 -mb-1">
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Step content */}
        <div className="p-6 pt-8 space-y-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Icon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="font-outfit font-semibold text-lg">
                Step {step + 1}: {currentStep.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {currentStep.description}
              </p>
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex justify-center gap-2">
            {STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === step
                    ? "bg-primary"
                    : idx < step
                    ? "bg-primary/50"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
            <Button onClick={handleAction} className="flex-1">
              {step === STEPS.length - 1 ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  {currentStep.action}
                </>
              ) : (
                <>
                  {currentStep.action}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>

          {/* Skip */}
          <button
            onClick={onComplete}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingGuide;
