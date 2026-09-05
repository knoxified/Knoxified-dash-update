// Systems now come entirely from the real systems_catalog + user_systems
// tables (see lib/actions/dashboard-actions.ts:getRealSystems) -- this file
// used to also hold a hardcoded array of ~20 systems with invented revenue
// figures and call/lead counts that had no connection to real usage data.
// That's gone; only the shape real data actually fills is kept here.
export interface System {
  id: string;
  name: string;
  tier: string; // 'pro' | 'enterprise' | 'custom'
  description: string;
  iconName?: string;
  complexity?: string;
  isEnabled: boolean;
  activatedAt?: string | null;
}
