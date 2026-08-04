"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface DashboardChartsProps {
  leadsByAgent?: { name: string; count: number }[];
  salesByMonth: { month: string; sales: number }[];
}

export function DashboardCharts({ leadsByAgent, salesByMonth }: DashboardChartsProps) {
  return (
    <div className={leadsByAgent ? "grid gap-6 lg:grid-cols-2" : "grid gap-6"}>
      {leadsByAgent ? (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-stone-900">Leads per Sales Agent</h2>
          </CardHeader>
          <CardContent>
            {leadsByAgent.length === 0 ? (
              <p className="py-12 text-center text-sm text-stone-400">No assigned leads yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={240} minHeight={200}>
                <BarChart data={leadsByAgent}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#b45309" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-stone-900">Sales Trend</h2>
        </CardHeader>
        <CardContent>
          {salesByMonth.length === 0 ? (
            <p className="py-12 text-center text-sm text-stone-400">No delivered orders yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={240} minHeight={200}>
              <LineChart data={salesByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#b45309"
                  strokeWidth={2}
                  dot={{ fill: "#b45309" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
