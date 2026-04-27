'use client';

import { AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { ValidationProgress } from './ValidationProgress';
import { ValidationReport } from './ValidationReport';
import { RefinePanel } from './RefinePanel';
import { useValidateWorkflow } from '@/hooks/use-validate-workflow';
import { PRODUCT_TYPE_OPTIONS } from '@/constants/products';

export function ValidateForm() {
  const {
    description,
    setDescription,
    productType,
    setProductType,
    audience,
    setAudience,
    problem,
    setProblem,
    phase,
    error,
    isActive,
    cancel,
    canSubmit,
    result,
    prevResult,
    competitors,
    version,
    handleSubmit,
  } = useValidateWorkflow();

  return (
    <div className="flex flex-col gap-5">
      {(phase === 'idle' || phase === 'error') && (
        <>
          <Textarea
            rows={4}
            placeholder="A tool that helps freelancers automatically track billable hours from their calendar and generate invoices…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[120px]"
            maxLength={600}
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <Select
                value={productType || undefined}
                onValueChange={setProductType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Product type (required)" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Input
                placeholder="Who is this for? (optional)"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                maxLength={200}
              />
            </div>
          </div>
          <Input
            placeholder="What pain does it solve? (optional)"
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            maxLength={300}
          />
          <Button onClick={() => handleSubmit()} disabled={!canSubmit}>
            Validate Idea →
          </Button>
        </>
      )}

      <AnimatePresence mode="wait">
        {(phase === 'thinking' ||
          phase === 'researching' ||
          phase === 'analyzing') && (
          <motion.div
            key="thinking"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ValidationProgress
              phase={phase}
              competitors={competitors}
              productType={productType}
              description={description}
              onCancel={cancel}
            />
          </motion.div>
        )}

        {phase === 'done' && result && (
          <motion.div
            key="done"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mt-8 flex flex-col"
          >
            <ValidationReport
              result={result}
              competitors={competitors}
              previousResult={prevResult ?? undefined}
              ideaContext={{
                description,
                audience: audience || undefined,
                problem: problem || undefined,
              }}
            />
            <RefinePanel
              description={description}
              result={result}
              version={version}
              isLoading={isActive}
              onRevalidate={(newDesc) => handleSubmit({ description: newDesc })}
            />
          </motion.div>
        )}

        {phase === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="mt-10 flex flex-col items-center gap-4 rounded-xl border border-red-500/20 bg-red-50/60 px-8 py-12 text-center dark:bg-red-500/5"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-red-500/30 bg-red-50 dark:bg-red-500/10">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-foreground">
                Validation failed
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {error}
              </p>
            </div>
            <Button variant="link" size="sm" onClick={() => handleSubmit()}>
              Try again →
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
