"use client";

import { useEffect, useState } from "react";
import { DataService, System, Automation, DashboardMetrics, Plan, SystemLog } from "./data";

// These hooks obscure the data source (mock vs. real backend)
export function useSystems() {
  const [data, setData] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    DataService.getSystems().then((systems) => {
      setData(systems);
      setLoading(false);
    });
  }, []);

  return { data, loading, setData }; // exported setData for optimistic updates mock
}

export function useAutomations() {
  const [data, setData] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    DataService.getAutomations().then((automations) => {
      setData(automations);
      setLoading(false);
    });
  }, []);

  return { data, loading, setData };
}

export function useDashboardMetrics(dateRange: string = "7d") {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [prevDateRange, setPrevDateRange] = useState(dateRange);

  if (dateRange !== prevDateRange) {
    setPrevDateRange(dateRange);
    setLoading(true);
  }

  useEffect(() => {
    DataService.getDashboardMetrics(dateRange).then((metrics) => {
      setData(metrics);
      setLoading(false);
    });
  }, [dateRange]);

  return { data, loading };
}

export function useWorkspace() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    DataService.getWorkspace().then((ws) => {
      setData(ws);
      setLoading(false);
    });
  }, []);

  return { data, loading };
}

export function usePlans() {
  const [data, setData] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    DataService.getPlans().then((plans) => {
      setData(plans);
      setLoading(false);
    });
  }, []);

  return { data, loading };
}

export function useSystemLogs() {
  const [data, setData] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    DataService.getSystemLogs().then((logs) => {
      setData(logs);
      setLoading(false);
    });
  }, []);

  return { data, loading };
}
