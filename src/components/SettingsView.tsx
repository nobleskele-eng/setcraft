/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  Settings,
  Shield,
  ToggleLeft,
  ToggleRight,
  UserCheck,
  Bell,
  Link2,
  Key,
  Download,
  Upload,
  RotateCcw,
  HardDrive,
  CheckCircle2,
} from "lucide-react";
import { UserRole } from "../types";

interface SettingsViewProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

type LocalSettings = {
  emailNotify: boolean;
  pushNotify: boolean;
  publicProfile: boolean;
  coachShare: boolean;
  reduceMotion: boolean;
  largerDeckText: boolean;
  inviteCode: string;
};

const SETTINGS_KEY = "setcraft_settings";
const DEFAULT_SETTINGS: LocalSettings = {
  emailNotify: false,
  pushNotify: true,
  publicProfile: false,
  coachShare: false,
  reduceMotion: false,
  largerDeckText: true,
  inviteCode: "",
};

const BACKUP_KEYS = [
  "setcraft_studio_projects",
  "setcraft_project_folders",
  "setcraft_autosave_draft",
  "setcraft_my_blocks",
  "setcraft_favorite_presets",
  "setcraft_backpack",
  "setcraft_coach_library",
  "setcraft_calendar_plan",
  SETTINGS_KEY,
  "setcraft_active_role",
];

function readSettings(): LocalSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export default function SettingsView({ currentRole, onRoleChange }: SettingsViewProps) {
  const [preferences, setPreferences] = React.useState<LocalSettings>(readSettings);
  const [status, setStatus] = React.useState("Preferences save automatically on this device.");
  const importRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(preferences));
    localStorage.setItem("setcraft_active_role", currentRole);
    document.documentElement.dataset.setcraftReduceMotion = String(preferences.reduceMotion);
    document.documentElement.dataset.setcraftLargeDeck = String(preferences.largerDeckText);
  }, [preferences, currentRole]);

  const setPreference = <K extends keyof LocalSettings>(key: K, value: LocalSettings[K]) => {
    setPreferences((current) => ({ ...current, [key]: value }));
    setStatus("Saved locally.");
  };

  const chooseRole = (role: UserRole) => {
    onRoleChange(role);
    localStorage.setItem("setcraft_active_role", role);
    setStatus(`${role} perspective saved.`);
  };

  const exportBackup = () => {
    const data = BACKUP_KEYS.reduce<Record<string, unknown>>((result, key) => {
      const value = localStorage.getItem(key);
      if (value !== null) {
        try { result[key] = JSON.parse(value); } catch { result[key] = value; }
      }
      return result;
    }, {});
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), data }, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `setcraft-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(href);
    setStatus("Workspace backup downloaded.");
  };

  const importBackup = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const data = parsed?.data && typeof parsed.data === "object" ? parsed.data : parsed;
      let restored = 0;
      BACKUP_KEYS.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          const value = data[key];
          localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
          restored += 1;
        }
      });
      setStatus(`Restored ${restored} workspace data group${restored === 1 ? "" : "s"}. Reloading…`);
      window.setTimeout(() => window.location.reload(), 600);
    } catch {
      setStatus("That file is not a valid SetCraft backup.");
    } finally {
      if (importRef.current) importRef.current.value = "";
    }
  };

  const resetPreferences = () => {
    setPreferences(DEFAULT_SETTINGS);
    onRoleChange("Coach");
    localStorage.removeItem("setcraft_active_role");
    setStatus("Interface preferences reset. Projects were not deleted.");
  };

  const Toggle = ({ value, onClick, label }: { value: boolean; onClick: () => void; label: string }) => (
    <button type="button" aria-label={label} aria-pressed={value} onClick={onClick} className="rounded-xl text-ink-muted-on-canvas transition hover:scale-105 hover:text-ink-muted-on-canvas focus:outline-none focus:ring-2 focus:ring-disabled">
      {value ? <ToggleRight className="h-9 w-9 text-accent-active" /> : <ToggleLeft className="h-9 w-9 text-disabled" />}
    </button>
  );

  return (
    <div className="rounded-[28px] border border-hairline-on-canvas/80 bg-white p-6 shadow-sm md:p-9" id="settings-workspace">
      <div className="mb-8 flex flex-col gap-4 border-b border-canvas-raised pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="flex items-center gap-3 font-display text-2xl font-bold text-surface">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-canvas text-accent-active"><Settings className="h-5 w-5" /></span>
            Settings & Local Workspace
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted-on-canvas">Control the interface, role perspective and browser-stored workspace. These prototype preferences persist on this device.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-hairline-on-canvas bg-canvas px-4 py-2 text-xs font-bold text-surface-raised"><CheckCircle2 className="h-4 w-4" />{status}</div>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <section className="space-y-5 rounded-2xl border border-hairline-on-canvas bg-canvas/70 p-6 xl:col-span-5">
          <div className="flex items-center gap-2 text-accent-active"><UserCheck className="h-5 w-5" /><h3 className="font-display text-lg font-bold text-surface">Perspective role</h3></div>
          <p className="text-sm leading-relaxed text-ink-muted-on-canvas">Switch the working perspective inside your secured account. This changes the interface context only; team permissions still require a shared club backend.</p>
          <div className="space-y-3">
            {[
              { role: "Coach" as UserRole, title: "Coach workspace", desc: "Build practices, organize lanes, validate and export." },
              { role: "Athlete" as UserRole, title: "Athlete preview", desc: "Preview how assigned practices and targets may appear." },
              { role: "ClubAdmin" as UserRole, title: "Club administrator preview", desc: "Prototype organization and roster-management perspective." },
            ].map((item) => (
              <button key={item.role} type="button" onClick={() => chooseRole(item.role)} className={`w-full rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${currentRole === item.role ? "border-disabled bg-canvas ring-2 ring-canvas-raised" : "border-hairline-on-canvas bg-white hover:border-hairline-on-canvas"}`}>
                <div className="flex items-center justify-between gap-3"><span className="text-sm font-bold text-surface">{item.title}</span>{currentRole === item.role && <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Active</span>}</div>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-muted-on-canvas">{item.desc}</p>
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-hairline-on-canvas bg-canvas p-5">
            <div className="flex items-center gap-2 text-surface"><HardDrive className="h-5 w-5" /><h4 className="font-bold">Local-first prototype</h4></div>
            <p className="mt-2 text-xs leading-relaxed text-surface-raised">Projects, folders, custom blocks, lane plans and settings stay in this browser’s local storage. AI prompts are sent to the configured Gemini service only when you use AI Coach. Do not treat this prototype as a production athlete-record system.</p>
          </div>
        </section>

        <section className="space-y-7 rounded-2xl border border-hairline-on-canvas bg-canvas/70 p-6 xl:col-span-7">
          <div>
            <h4 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-ink-muted-on-canvas"><Bell className="h-4 w-4" />Interface alerts</h4>
            <div className="space-y-4 rounded-2xl border border-hairline-on-canvas bg-white p-5">
              {([
                ["pushNotify", "In-app save and validation alerts", "Show useful status changes while building a practice."],
                ["emailNotify", "Email-digest preference", "Stored as a preference only; email delivery requires a future backend."],
                ["largerDeckText", "Larger pool-deck text", "Prefer larger text in deck and review modes."],
                ["reduceMotion", "Reduced motion", "Minimize non-essential interface animation."],
              ] as Array<["pushNotify" | "emailNotify" | "largerDeckText" | "reduceMotion", string, string]>).map(([key, title, description]) => (
                <div key={key} className="flex items-center justify-between gap-5 border-b border-canvas-raised pb-4 last:border-0 last:pb-0">
                  <div><span className="block text-sm font-bold text-surface">{title}</span><span className="mt-1 block text-xs leading-relaxed text-ink-muted-on-canvas">{description}</span></div>
                  <Toggle value={preferences[key]} onClick={() => setPreference(key, !preferences[key])} label={`Toggle ${title}`} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-ink-muted-on-canvas"><Link2 className="h-4 w-4" />Prototype team link</h4>
            <div className="rounded-2xl border border-hairline-on-canvas bg-white p-5">
              <div className="flex items-center justify-between gap-5"><div><span className="block text-sm font-bold text-surface">Allow shared-coach features</span><span className="mt-1 block text-xs text-ink-muted-on-canvas">Stored as a workspace preference until shared team records and permissions are added.</span></div><Toggle value={preferences.coachShare} onClick={() => setPreference("coachShare", !preferences.coachShare)} label="Toggle shared coach features" /></div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row"><input value={preferences.inviteCode} onChange={(event) => setPreference("inviteCode", event.target.value.toUpperCase().slice(0, 30))} placeholder="Optional team code" className="min-w-0 flex-1 rounded-xl border border-hairline-on-canvas bg-canvas px-4 py-3 font-mono text-sm font-bold text-surface-raised outline-none focus:border-accent-hover focus:ring-2 focus:ring-canvas-raised" /><span className="flex items-center justify-center rounded-xl border border-hairline-on-canvas bg-canvas-raised px-4 py-3 text-xs font-bold uppercase tracking-wider text-ink-muted-on-canvas">Saved locally</span></div>
            </div>
          </div>

          <div>
            <h4 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-ink-muted-on-canvas"><Shield className="h-4 w-4" />Privacy & portability</h4>
            <div className="space-y-4 rounded-2xl border border-hairline-on-canvas bg-white p-5">
              <div className="flex items-center justify-between gap-5"><div><span className="block text-sm font-bold text-surface">Public-profile preference</span><span className="mt-1 block text-xs text-ink-muted-on-canvas">Disabled by default; no public profile is currently published.</span></div><Toggle value={preferences.publicProfile} onClick={() => setPreference("publicProfile", !preferences.publicProfile)} label="Toggle public profile preference" /></div>
              <div className="grid gap-3 sm:grid-cols-3">
                <button type="button" onClick={exportBackup} className="flex items-center justify-center gap-2 rounded-xl bg-surface px-4 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-surface-raised"><Download className="h-4 w-4" />Export backup</button>
                <button type="button" onClick={() => importRef.current?.click()} className="flex items-center justify-center gap-2 rounded-xl border border-disabled bg-white px-4 py-3 text-sm font-bold text-surface-raised transition hover:-translate-y-0.5 hover:border-disabled"><Upload className="h-4 w-4" />Import backup</button>
                <button type="button" onClick={resetPreferences} className="flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 transition hover:-translate-y-0.5"><RotateCcw className="h-4 w-4" />Reset settings</button>
                <input ref={importRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => importBackup(event.target.files?.[0])} />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-hairline-on-canvas bg-canvas p-5 text-xs leading-relaxed text-surface"><Key className="mt-0.5 h-4 w-4 shrink-0" /><p><strong>Production boundary:</strong> secure account access is active. Projects still live on this device; encrypted shared records, consent management, club permissions and verified regulatory compliance remain future backend work.</p></div>
        </section>
      </div>
    </div>
  );
}
