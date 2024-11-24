
import { useState, useCallback, useEffect } from 'react'

interface OnboardingState {
  isComplete: boolean
  setIsComplete: (value: boolean) => void
}

const onboardingState: OnboardingState = {
  isComplete: false,
  setIsComplete: () => {},
}

export function useOnboarding(): OnboardingState {
  const [isComplete, setIsComplete] = useState<boolean>(onboardingState.isComplete)

  useEffect(() => {
    onboardingState.isComplete = isComplete
  }, [isComplete])

  const setIsCompleteCallback = useCallback((value: boolean) => {
    setIsComplete(value)
    onboardingState.setIsComplete(value)
  }, [])

  useEffect(() => {
    const originalSetIsComplete = onboardingState.setIsComplete
    onboardingState.setIsComplete = setIsCompleteCallback
    return () => {
      onboardingState.setIsComplete = originalSetIsComplete
    }
  }, [setIsCompleteCallback])

  return {
    isComplete,
    setIsComplete: setIsCompleteCallback,
  }
}