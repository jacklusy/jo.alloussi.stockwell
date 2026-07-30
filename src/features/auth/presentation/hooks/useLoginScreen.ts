import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { container, TOKENS } from '@/core/di';
import type { LoginUseCase } from '@/features/auth/application/use-cases/login.usecase';
import { readBiometricPreference } from '@/features/auth/application/use-cases/login.usecase';
import type { BiometricUnlockUseCase } from '@/features/auth/application/use-cases/biometric-unlock.usecase';
import { OfflineError } from '@/core/errors';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export type LoginViewState = {
  isSubmitting: boolean;
  errorMessage: string | null;
  isOffline: boolean;
  biometricAvailable: boolean;
  submit: (values: LoginFormValues) => Promise<boolean>;
  unlockWithBiometrics: () => Promise<boolean>;
  form: ReturnType<typeof useForm<LoginFormValues>>;
};

export function useLoginScreen(): LoginViewState {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const biometricAvailable = readBiometricPreference();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const submit = useCallback(async (values: LoginFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const useCase = container.resolve<LoginUseCase>(TOKENS.LOGIN_USE_CASE);
      const result = await useCase.execute(values);
      if (!result.ok) {
        if (result.error instanceof OfflineError) {
          setIsOffline(true);
        }
        setErrorMessage(result.error.userMessage);
        return false;
      }
      setIsOffline(false);
      return true;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const unlockWithBiometrics = useCallback(async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const useCase = container.resolve<BiometricUnlockUseCase>(TOKENS.BIOMETRIC_UNLOCK_USE_CASE);
      const result = await useCase.execute();
      if (!result.ok) {
        setErrorMessage(result.error.userMessage);
        return false;
      }
      return true;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    isSubmitting,
    errorMessage,
    isOffline,
    biometricAvailable,
    submit,
    unlockWithBiometrics,
    form,
  };
}
