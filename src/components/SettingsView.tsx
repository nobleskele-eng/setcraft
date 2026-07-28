/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Settings, Shield, ToggleLeft, ToggleRight, UserCheck, Bell, Link2, Key } from "lucide-react";
import { UserRole } from "../types";

interface SettingsViewProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export default function SettingsView({ currentRole, onRoleChange }: SettingsViewProps) {
  const [emailNotify, setEmailNotify] = React.useState(true);
  const [pushNotify, setPushNotify] = React.useState(true);
  const [publicProfile, setPublicProfile] = React.useState(true);
  const [coachShare, setCoachShare] = React.useState(true);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm" id="settings-workspace">
      {/* HEADER */}
      <div className="border-b border-slate-100 pb-6 mb-8">
        <h2 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600" />
          Settings & Connected Accounts
        </h2>
        <p className="text-slate-500 text-xs mt-1">
          Configure profile details, linked coach tokens, and active permissions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ROLE PLAY SWITCHER & INFO (5 COLS) */}
        <div className="lg:col-span-5 bg-slate-50/50 p-6 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 text-indigo-600">
            <UserCheck className="w-5 h-5" />
            <h3 className="font-display font-bold text-slate-800">Perspective Role Switcher</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            In SetCraft, athletes are the primary user class, but coaches and club administrators also interact with the interface. Swap your role below to simulate how the Swim Studio and features adapt to each permission set.
          </p>

          <div className="space-y-3">
            {[
              { role: "Athlete" as UserRole, title: "Individual Athlete (Primary)", desc: "Build sets, calculate paces, and compete regionally." },
              { role: "Coach" as UserRole, title: "Connected Coach (Secondary)", desc: "Write shared workouts, customize lane variations." },
              { role: "ClubAdmin" as UserRole, title: "Club Administrator", desc: "Manage rosters and organize club-vs-club matches." }
            ].map((item) => (
              <button
                key={item.role}
                onClick={() => onRoleChange(item.role)}
                className={`w-full text-left p-4 rounded-xl border text-xs transition flex flex-col justify-between shadow-2xs ${
                  currentRole === item.role 
                    ? "bg-indigo-50 border-indigo-300 text-indigo-950" 
                    : "bg-white border-slate-200 text-slate-650 hover:border-slate-300 hover:bg-slate-50/50"
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="font-bold">{item.title}</span>
                  {currentRole === item.role && (
                    <span className="text-[9px] bg-indigo-600 text-white px-2 py-0.5 rounded-md font-mono uppercase font-bold">
                      Active
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 mt-1.5 font-medium">{item.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* SETTINGS OPTIONS FORMS (7 COLS) */}
        <div className="lg:col-span-7 bg-slate-50/50 p-6 rounded-2xl border border-slate-200 space-y-6">
          {/* Notifications */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
              <Bell className="w-4 h-4 text-slate-500" />
              Notifications
            </h4>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-800 font-bold block">Email workout digests</span>
                  <span className="text-[10px] text-slate-400 block font-medium">Receive your customized weekly plan via email.</span>
                </div>
                <button onClick={() => setEmailNotify(!emailNotify)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  {emailNotify ? <ToggleRight className="w-8 h-8 text-indigo-600" /> : <ToggleLeft className="w-8 h-8 text-slate-300" />}
                </button>
              </div>

              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-800 font-bold block">Coach share alerts</span>
                  <span className="text-[10px] text-slate-400 block font-medium">Notify me when my linked coach logs a set revision.</span>
                </div>
                <button onClick={() => setPushNotify(!pushNotify)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  {pushNotify ? <ToggleRight className="w-8 h-8 text-indigo-600" /> : <ToggleLeft className="w-8 h-8 text-slate-300" />}
                </button>
              </div>
            </div>
          </div>

          {/* Coach & Club Link */}
          <div className="border-t border-slate-100 pt-5 space-y-4">
            <h4 className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
              <Link2 className="w-4 h-4 text-slate-500" />
              Coaching & Roster Links
            </h4>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-800 font-bold block">Automatic coach synchronization</span>
                  <span className="text-[10px] text-slate-400 block font-medium">Allow Coach Sarah G. to assign workouts.</span>
                </div>
                <button onClick={() => setCoachShare(!coachShare)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  {coachShare ? <ToggleRight className="w-8 h-8 text-indigo-600" /> : <ToggleLeft className="w-8 h-8 text-slate-300" />}
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs flex flex-col sm:flex-row justify-between items-center gap-3 shadow-2xs">
                <div>
                  <span className="text-slate-800 font-bold block">Club Invite Token</span>
                  <span className="text-[10px] text-slate-400 font-mono font-medium">Input team code to connect to roster.</span>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    defaultValue="SF-TRI-2026"
                    className="bg-slate-50 border border-slate-200 text-xs font-mono px-3 py-1.5 rounded-lg text-slate-800 w-full sm:w-28 text-center focus:outline-none"
                  />
                  <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 text-[9px] rounded-lg font-bold uppercase shrink-0 flex items-center justify-center">
                    Linked
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Data Security & Opt-Ins */}
          <div className="border-t border-slate-100 pt-5 space-y-4">
            <h4 className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
              <Shield className="w-4 h-4 text-slate-500" />
              Privacy & Opt-Ins
            </h4>

            <div className="flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-800 font-bold block">Public-facing profile metrics</span>
                <span className="text-[10px] text-slate-400 block font-medium">Display personal bests and earned badges to regional swimmers.</span>
              </div>
              <button onClick={() => setPublicProfile(!publicProfile)} className="text-slate-400 hover:text-slate-600 transition-colors">
                {publicProfile ? <ToggleRight className="w-8 h-8 text-indigo-600" /> : <ToggleLeft className="w-8 h-8 text-slate-300" />}
              </button>
            </div>
          </div>

          {/* Secure Environment Notice */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs flex items-start gap-2.5 shadow-2xs">
            <Key className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-slate-500 leading-relaxed text-[11px] font-medium">
              <strong>Security Architecture:</strong> SetCraft stores athlete credentials on high-security servers. Third-party integrations (wearable heart rate sync, pool metric uploads) are sandbox-isolated and conform to GDPR compliance rules.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
