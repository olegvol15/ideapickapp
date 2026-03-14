'use client';

import { useEffect, useState } from 'react';
import { listPlans, PLANS_EVENT, type PlanEntry } from '@/services/storage.service';
import { getRoadmapsFromDB } from '@/services/db.service';
import { useAuth } from '@/context/auth';

export function useRoadmapPlans() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<PlanEntry[]>([]);

  useEffect(() => {
    async function load() {
      if (user) {
        const rows = await getRoadmapsFromDB(user.id);
        setPlans(rows.map((r) => ({ id: r.slug, title: r.title })));
      } else {
        setPlans(listPlans());
      }
    }

    load();
    window.addEventListener(PLANS_EVENT, load);
    return () => window.removeEventListener(PLANS_EVENT, load);
  }, [user]);

  return plans;
}
