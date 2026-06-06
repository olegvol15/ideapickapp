import { Suspense } from 'react';
import { ValidateForm } from '@/components/validate/ValidateForm';

export default function ValidatePage() {
  return (
    <main className="relative mx-auto flex min-h-svh max-w-5xl flex-col justify-center px-5 pb-24 pt-14 sm:px-8">
      <Suspense fallback={null}>
        <ValidateForm />
      </Suspense>
    </main>
  );
}
