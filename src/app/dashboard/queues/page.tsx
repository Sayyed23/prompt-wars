'use client';

import React from 'react';
import Link from 'next/link';
import QueueDisplay from '@/components/attendee/QueueDisplay';
import { ArrowRight, Clock, Coffee, DoorOpen, Sparkles } from 'lucide-react';

const QUEUE_SUMMARY = [
  {
    label: 'Fastest entry',
    value: 'West Gate',
    detail: '5 min estimated wait',
    icon: DoorOpen,
  },
  {
    label: 'Best food stop',
    value: 'Burger & Brew',
    detail: 'Shorter than venue average',
    icon: Coffee,
  },
  {
    label: 'Refresh cycle',
    value: '30 sec',
    detail: 'Predictions update automatically',
    icon: Clock,
  },
];

export default function QueuesPage() {
  return (
    <div className="space-y-10 pb-24">
      <header className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
        <div className="space-y-4">
          <div className="flex items-center gap-3" role="status" aria-live="polite">
            <div className="rounded-lg bg-primary p-2">
              <Clock className="h-4 w-4 text-background" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">
              Queue Intelligence
            </span>
          </div>
          <h2 className="max-w-3xl text-4xl font-black uppercase leading-none tracking-tighter md:text-5xl">
            Pick the shortest line before the crowd moves.
          </h2>
          <p className="max-w-2xl text-sm font-medium leading-relaxed text-stealth-400 md:text-base">
            Live predictions combine current zone density with facility throughput so attendees can choose food, gates, and services without wandering into bottlenecks.
          </p>
        </div>

        <aside className="rounded-lg border border-card-border bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-stealth-500">
              Route suggestion
            </h3>
          </div>
          <p className="text-2xl font-black uppercase tracking-tighter">
            Coffee Lab via Level 2 Bridge
          </p>
          <p className="mt-2 text-xs font-semibold leading-relaxed text-stealth-500">
            Avoids the main food concourse and keeps you within low-density zones.
          </p>
          <Link
            href="/dashboard/map"
            className="mt-6 flex touch-target items-center justify-center gap-2 rounded-md bg-foreground px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-primary hover:text-foreground"
          >
            Open map <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </aside>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {QUEUE_SUMMARY.map((item) => (
          <div key={item.label} className="rounded-lg border border-card-border bg-white p-6 shadow-sm">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md bg-stealth-100 text-stealth-500">
              <item.icon className="h-5 w-5" />
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stealth-400">{item.label}</p>
            <p className="mt-2 text-2xl font-black uppercase tracking-tighter">{item.value}</p>
            <p className="mt-1 text-xs font-semibold text-stealth-500">{item.detail}</p>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-card-border bg-white p-2 shadow-sm">
        <QueueDisplay />
      </section>
    </div>
  );
}
