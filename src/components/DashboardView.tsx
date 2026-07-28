/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Sparkles, Calendar, Award, Zap, ArrowRight, Play, ChevronRight, Calculator, CheckCircle } from "lucide-react";
import { UserRole } from "../types";

interface DashboardViewProps {
  currentRole: UserRole;
  onNavigateTo: (dest: string) => void;
  savedWorkoutsCount: number;
}

export default function DashboardView({ currentRole, onNavigateTo, savedWorkoutsCount }: DashboardViewProps) {
  const activeStreak = 5;
  const completedYardsThisMonth = 34200;

  return (
    <div className="space-y-12" id="athlete-dashboard">
      {/* WELCOME ANCHOR ROW */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-8 md:p-10 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-slate-100 text-slate-700 text-[10px] font-mono font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
              Athlete Dashboard
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Role: <strong className="text-slate-700 font-semibold">{currentRole}</strong>
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-light text-slate-900 tracking-tight">
            Welcome back, <span className="font-semibold text-slate-950">Alex</span>
          </h1>
          <p className="text-slate-500 text-sm max-w-xl leading-relaxed">
            Your weekly microcycle is pacing ahead of schedule. Let's inspect today's sets and prepare for your competition block.
          </p>
        </div>

        <div className="flex gap-3 shrink-0 w-full md:w-auto">
          <button
            onClick={() => onNavigateTo("studio")}
            className="flex-1 md:flex-none bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Launch Swim Studio
          </button>
        </div>
      </div>

      {/* ATHLETE STATS GLANCE ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-mono block uppercase tracking-wider">Active Streak</span>
            <span className="text-2xl font-display font-bold text-slate-900">{activeStreak} Days</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-mono block uppercase tracking-wider">Monthly Volume</span>
            <span className="text-2xl font-display font-bold text-slate-900">{completedYardsThisMonth.toLocaleString()} yd</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
            <Calculator className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-mono block uppercase tracking-wider">Calculators</span>
            <span className="text-2xl font-display font-bold text-slate-900">Pace-Ready</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-mono block uppercase tracking-wider">Saved Templates</span>
            <span className="text-2xl font-display font-bold text-slate-900">{savedWorkoutsCount} Sets</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* TODAY'S PREVIEW BLOCK (8 COLS) */}
        <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-slate-800" />
              Scheduled for Today
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-3 py-1 rounded-md font-mono uppercase font-bold tracking-wider">
              July 8 (Wed)
            </span>
          </div>

          <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-150 space-y-4">
            <div className="flex justify-between items-start gap-4 flex-col sm:flex-row">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider font-mono">
                  Threshold Endurance Focus
                </span>
                <h4 className="text-lg font-display font-bold text-slate-900 mt-1">
                  VO2 Max & Aerobic Threshold Focus
                </h4>
              </div>
              <div className="text-left sm:text-right text-xs font-mono text-slate-500 shrink-0">
                <span className="block font-bold text-slate-800 text-sm">2,800 yards</span>
                <span>Est. 55 mins</span>
              </div>
            </div>

            <div className="border-t border-slate-200/60 pt-4 flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="bg-white border border-slate-200/60 px-3 py-1 rounded-lg">Block 1: Warm-up & Pre-set</span>
              <span className="bg-white border border-slate-200/60 px-3 py-1 rounded-lg">Block 2: Main Set (Threshold reps)</span>
              <span className="bg-white border border-slate-200/60 px-3 py-1 rounded-lg">Equipment: Snorkel, Fins</span>
            </div>

            <div className="pt-2 flex justify-between items-center w-full text-xs">
              <span className="text-slate-400 italic">Assignee: Alex Rivera (Me) • Lane B</span>
              <button
                onClick={() => onNavigateTo("studio")}
                className="text-slate-800 hover:text-slate-950 font-bold flex items-center gap-1 transition-colors"
              >
                View set details
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* AI COACHING LOG TIP */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-150 flex items-start gap-4">
            <Sparkles className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-slate-800 block">AI Coach Block Tip</span>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Your average lactic tolerance score was <strong>8.2 RPE</strong> last Friday. Today's main set cycle allows for exactly 15 seconds of threshold rest. Focus on a strong kick catch during the final 25 meters of each 100 rep!
              </p>
            </div>
          </div>
        </div>

        {/* TEAM ACTIVITY ANNOUNCEMENT (4 COLS) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm space-y-6">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
            Guild Activities
          </h3>

          <div className="space-y-4">
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-150">
              <div className="flex justify-between text-[10px] font-mono tracking-wider text-slate-400">
                <span>Volume Clash</span>
                <span className="text-slate-800 font-bold">82% vs 79%</span>
              </div>
              <h4 className="text-xs font-bold text-slate-800 mt-2">
                SF TriMasters leading East Bay Seals
              </h4>
              <p className="text-[10px] text-slate-400 mt-1">Summer Volume Clash ends in 12 days.</p>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-150">
              <div className="flex justify-between text-[10px] font-mono tracking-wider text-slate-400">
                <span>Roster Update</span>
                <span className="text-slate-800 font-bold">Connected</span>
              </div>
              <h4 className="text-xs font-bold text-slate-800 mt-2">
                Sarah G. published Thursday revision
              </h4>
              <p className="text-[10px] text-slate-400 mt-1">Check Calendar for taper adjustments.</p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTo("community")}
            className="w-full text-center bg-slate-50 hover:bg-slate-100 border border-slate-200 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors flex items-center justify-center gap-1.5"
          >
            Explore Swimmer Guild
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
