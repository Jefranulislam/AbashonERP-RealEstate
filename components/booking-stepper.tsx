"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface Step {
  id: number
  title: string
  description?: string
}

interface BookingStepperProps {
  steps: Step[]
  currentStep: number
  onStepClick?: (step: number) => void
}

export function BookingStepper({ steps, currentStep, onStepClick }: BookingStepperProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id
          const isCurrent = currentStep === step.id
          const isClickable = onStepClick && (isCompleted || step.id <= currentStep)

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle and Content */}
              <div 
                className={cn(
                  "flex flex-col items-center cursor-default",
                  isClickable && "cursor-pointer"
                )}
                onClick={() => isClickable && onStepClick(step.id)}
              >
                {/* Circle */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                    isCompleted && "bg-green-600 border-green-600 text-white",
                    isCurrent && "bg-primary border-primary text-primary-foreground",
                    !isCompleted && !isCurrent && "bg-muted border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="font-semibold">{step.id}</span>
                  )}
                </div>
                
                {/* Step Title */}
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isCurrent && "text-primary",
                      isCompleted && "text-green-600",
                      !isCompleted && !isCurrent && "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 hidden md:block">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4 h-0.5 mt-[-20px]">
                  <div
                    className={cn(
                      "h-full transition-all duration-300",
                      isCompleted ? "bg-green-600" : "bg-muted-foreground/30"
                    )}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
