/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Users, Award, Trophy, Heart, MessageSquare, Shield } from "lucide-react";
import { SwimmerProfile, LeaderboardEntry, ClubChallenge, FeedItem } from "../types";

const INITIAL_PROFILE: SwimmerProfile = {
  id: "p-me",
  name: "Alex Rivera",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120",
  role: "Athlete",
  clubName: "SF TriMasters Club",
  personalBests: [
    { stroke: "Free", distance: 100, time: "00:53.4" },
    { stroke: "Free", distance: 200, time: "01:56.8" },
    { stroke: "IM", distance: 200, time: "02:12.5" }
  ],
  badges: [
    { name: "Yards Warrior", icon: "🔥", desc: "Logged over 50,000 yards in a single training month." },
    { name: "Lactate Champ", icon: "⚡", desc: "Completed three coach-reviewed threshold sessions under goal cycles." },
    { name: "Early Bird", icon: "🌅", desc: "Logged a workout before 6:00 AM." }
  ]
};

const LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: "Marcus Thorne", clubName: "SF TriMasters Club", score: 48200, avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100" },
  { rank: 2, name: "Chloe Vance", clubName: "East Bay Seals", score: 45600, avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100" },
  { rank: 3, name: "Alex Rivera", clubName: "SF TriMasters Club", score: 41200, avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120" },
  { rank: 4, name: "David Kim", clubName: "Marin Aquatic Club", score: 38400, avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100" },
  { rank: 5, name: "Elena Rostova", clubName: "East Bay Seals", score: 37100, avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100" }
];

const CLUB_MATCHES: ClubChallenge[] = [
  {
    id: "c1",
    title: "July Summer Volume Clash",
    clubA: "SF TriMasters Club",
    clubB: "East Bay Seals",
    progressA: 82,
    progressB: 79,
    deadline: "2026-07-20"
  },
  {
    id: "c2",
    title: "100m Sprint Cycle Relay Challenge",
    clubA: "SF TriMasters Club",
    clubB: "Marin Aquatic Club",
    progressA: 64,
    progressB: 68,
    deadline: "2026-07-15"
  }
];

const FEED_ITEMS: FeedItem[] = [
  {
    id: "f1",
    author: "Coach Sarah G. (SF TriMasters)",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100",
    content: "Example post: the group completed a threshold session and recorded lane splits for coach review.",
    likes: 18,
    comments: 4,
    timeAgo: "2 hours ago"
  },
  {
    id: "f2",
    author: "David Kim",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100",
    content: "Just smashed my 200 IM personal best by 1.2 seconds using Coach Block's race-pace taper suggestions! Trust the taper!",
    likes: 24,
    comments: 2,
    timeAgo: "4 hours ago",
    hasSwimBadge: "PR Smash"
  },
  {
    id: "f3",
    author: "Elena Rostova",
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100",
    content: "Beautiful sunrise swim at Aquatic Park. Cold water but great for active recovery.",
    likes: 12,
    comments: 0,
    timeAgo: "1 day ago"
  }
];

export default function CommunityView() {
  const [activeTab, setActiveTab] = useState<"feed" | "leaderboard" | "clubs" | "profile">("feed");
  const [feed, setFeed] = useState<FeedItem[]>(FEED_ITEMS);
  const [postText, setPostText] = useState("");
  const [joinedClub, setJoinedClub] = useState(true);

  const handlePostSubmit = () => {
    if (!postText.trim()) return;
    const newItem: FeedItem = {
      id: `f-${Date.now()}`,
      author: "Alex Rivera (Me)",
      avatarUrl: INITIAL_PROFILE.avatarUrl,
      content: postText,
      likes: 0,
      comments: 0,
      timeAgo: "Just now"
    };
    setFeed([newItem, ...feed]);
    setPostText("");
  };

  const handleLike = (id: string) => {
    setFeed(feed.map(item => item.id === id ? { ...item, likes: item.likes + 1 } : item));
  };

  return (
    <div className="bg-white border border-hairline-on-canvas/80 rounded-2xl p-8 shadow-sm" id="community-workspace">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-canvas-raised pb-6 mb-8 gap-4">
        <div>
          <h2 className="text-xl font-display font-bold text-surface flex items-center gap-2">
            <Users className="w-5 h-5 text-accent-active" />
            Swimmer Guild — Prototype
          </h2>
          <p className="text-ink-muted-on-canvas text-xs mt-1">
            Preview future community, coach-sharing and club-challenge concepts. This page uses local demonstration data only.
          </p>
        </div>

        {/* TABS */}
        <div className="flex bg-canvas-raised p-1.5 rounded-xl border border-hairline-on-canvas/60 text-xs self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("feed")}
            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === "feed" ? "bg-white text-surface shadow-xs" : "text-ink-muted-on-canvas hover:text-surface"
            }`}
          >
            Local Feed
          </button>
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === "leaderboard" ? "bg-white text-surface shadow-xs" : "text-ink-muted-on-canvas hover:text-surface"
            }`}
          >
            Leaderboard
          </button>
          <button
            onClick={() => setActiveTab("clubs")}
            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === "clubs" ? "bg-white text-surface shadow-xs" : "text-ink-muted-on-canvas hover:text-surface"
            }`}
          >
            Club Matches
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === "profile" ? "bg-white text-surface shadow-xs" : "text-ink-muted-on-canvas hover:text-surface"
            }`}
          >
            My Profile
          </button>
        </div>
      </div>

      {/* LOCAL FEED TAB */}
      {activeTab === "feed" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="community-feed-grid">
          {/* Post and Feed list (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Create Post */}
            <div className="bg-canvas/50 p-5 rounded-2xl border border-hairline-on-canvas space-y-3">
              <textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="Share your daily training set summary or ask local athletes for tips..."
                rows={2}
                className="w-full bg-white border border-hairline-on-canvas rounded-xl p-3 text-xs text-surface-raised focus:outline-none focus:ring-1 focus:ring-disabled"
              />
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-ink-muted-on-canvas font-mono font-medium">LOCAL DEMO POST — NOT PUBLISHED</span>
                <button
                  onClick={handlePostSubmit}
                  className="bg-surface hover:bg-surface-raised text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm"
                >
                  Post Swim Log
                </button>
              </div>
            </div>

            {/* Feed List */}
            <div className="space-y-4">
              {feed.map((item) => (
                <div key={item.id} className="bg-white border border-hairline-on-canvas p-5 rounded-2xl space-y-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <img src={item.avatarUrl} alt={item.author} className="w-9 h-9 rounded-full object-cover border border-hairline-on-canvas" referrerPolicy="no-referrer" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-surface-raised">{item.author}</span>
                        {item.hasSwimBadge && (
                          <span className="bg-canvas text-accent-active text-[9px] px-2 py-0.5 rounded-md border border-canvas-raised font-bold font-mono">
                            {item.hasSwimBadge}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-ink-muted-on-canvas font-mono">{item.timeAgo}</span>
                    </div>
                  </div>

                  <p className="text-xs text-ink-muted-on-canvas leading-relaxed font-medium">{item.content}</p>

                  <div className="flex items-center gap-4 pt-3 border-t border-canvas-raised text-ink-muted-on-canvas">
                    <button
                      onClick={() => handleLike(item.id)}
                      className="flex items-center gap-1.5 text-[11px] hover:text-accent-active transition font-semibold"
                    >
                      <Heart className="w-3.5 h-3.5" />
                      {item.likes} Likes
                    </button>
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {item.comments} Comments
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Joined Club info (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-canvas/50 p-5 rounded-2xl border border-hairline-on-canvas space-y-4">
              <div className="flex items-center gap-2 text-accent-active">
                <Shield className="w-5 h-5" />
                <h3 className="font-display font-bold text-surface-raised text-sm">My Swim Club</h3>
              </div>

              {joinedClub ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-surface-raised">SF TriMasters Club</h4>
                    <span className="text-[10px] text-ink-muted-on-canvas font-mono">San Francisco, CA • Example roster</span>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-hairline-on-canvas shadow-2xs text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-ink-muted-on-canvas">Club Rank:</span>
                      <span className="font-bold text-accent-active">#2 Regional</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-muted-on-canvas">Monthly Volume:</span>
                      <span className="font-mono font-bold text-ink-on-canvas">342.8k yards</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-ink-muted-on-canvas leading-relaxed font-medium">
                    Prototype preview only. Production club links, permissions and shared volume require accounts and a backend.
                  </p>
                </div>
              ) : (
                <div className="text-center py-4 space-y-3">
                  <p className="text-xs text-ink-muted-on-canvas italic">You aren’t in a club yet.</p>
                  <button
                    onClick={() => setJoinedClub(true)}
                    className="w-full bg-white hover:bg-canvas text-surface-raised border border-hairline-on-canvas p-2.5 rounded-xl text-xs font-bold transition shadow-2xs"
                  >
                    Join SF TriMasters Club
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LEADERBOARD TAB */}
      {activeTab === "leaderboard" && (
        <div className="space-y-6" id="leaderboard-panel">
          <div className="flex items-center gap-2 border-b border-canvas-raised pb-3 justify-between">
            <h3 className="text-sm font-display font-bold text-surface-raised flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-accent-active" />
              Regional Distance Leaderboard (Monthly Yards)
            </h3>
            <span className="text-[10px] text-ink-muted-on-canvas font-mono font-medium">DEMONSTRATION DATA</span>
          </div>

          <div className="bg-white rounded-2xl border border-hairline-on-canvas overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas text-ink-muted-on-canvas font-mono text-[9px] border-b border-hairline-on-canvas font-bold">
                <tr>
                  <th className="p-4 text-center">RANK</th>
                  <th className="p-4">SWIMMER</th>
                  <th className="p-4">CLUB</th>
                  <th className="p-4 text-right">MONTHLY VOLUME</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-canvas-raised text-ink-on-canvas">
                {LEADERBOARD.map((swimmer) => (
                  <tr key={swimmer.rank} className={`hover:bg-canvas/50 transition-colors ${swimmer.name === "Alex Rivera" ? "bg-canvas/20 font-bold" : ""}`}>
                    <td className="p-4 text-center font-bold font-mono">
                      {swimmer.rank === 1 ? "🥇" : swimmer.rank === 2 ? "🥈" : swimmer.rank === 3 ? "🥉" : swimmer.rank}
                    </td>
                    <td className="p-4 flex items-center gap-3">
                      <img src={swimmer.avatarUrl} alt={swimmer.name} className="w-7 h-7 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                      <span className="font-semibold text-surface-raised">{swimmer.name} {swimmer.name === "Alex Rivera" && "(Me)"}</span>
                    </td>
                    <td className="p-4 text-ink-muted-on-canvas">{swimmer.clubName}</td>
                    <td className="p-4 text-right font-mono font-bold text-accent-active">{swimmer.score.toLocaleString()} yards</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CLUBS TAB */}
      {activeTab === "clubs" && (
        <div className="space-y-6" id="clubs-tab">
          <div className="bg-canvas/50 p-5 rounded-xl border border-hairline-on-canvas text-xs text-ink-muted-on-canvas leading-relaxed flex items-center gap-3">
            <Award className="w-5 h-5 text-accent-active shrink-0" />
            <span>
              <strong>Concept preview:</strong> Club challenges could compare agreed team metrics after consent, identity and anti-gaming controls are implemented.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CLUB_MATCHES.map((challenge) => (
              <div key={challenge.id} className="bg-white border border-hairline-on-canvas p-5 rounded-2xl space-y-4 shadow-2xs">
                <div className="flex justify-between items-start gap-4">
                  <span className="text-xs font-bold text-surface-raised leading-relaxed line-clamp-1">{challenge.title}</span>
                  <span className="text-[9px] font-mono font-bold bg-canvas-raised text-ink-muted-on-canvas rounded-md px-2 py-0.5 whitespace-nowrap shrink-0 border border-hairline-on-canvas/60">
                    Ends: {challenge.deadline}
                  </span>
                </div>

                <div className="space-y-3.5">
                  {/* Progress A */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono font-medium">
                      <span className="text-ink-muted-on-canvas">{challenge.clubA}</span>
                      <span className="text-surface-raised font-bold">{challenge.progressA}%</span>
                    </div>
                    <div className="w-full bg-canvas-raised rounded-full h-2">
                      <div className="bg-surface-raised h-2 rounded-full" style={{ width: `${challenge.progressA}%` }} />
                    </div>
                  </div>

                  {/* VS Divider */}
                  <div className="text-center font-mono text-[9px] text-ink-muted-on-canvas font-bold">VS</div>

                  {/* Progress B */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono font-medium">
                      <span className="text-ink-muted-on-canvas">{challenge.clubB}</span>
                      <span className="text-accent-active font-bold">{challenge.progressB}%</span>
                    </div>
                    <div className="w-full bg-canvas-raised rounded-full h-2">
                      <div className="bg-accent h-2 rounded-full" style={{ width: `${challenge.progressB}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PROFILE TAB */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="athlete-public-profile">
          {/* Badge grid (4 cols) */}
          <div className="lg:col-span-4 bg-canvas/50 p-6 rounded-2xl border border-hairline-on-canvas space-y-4">
            <div className="text-center">
              <img src={INITIAL_PROFILE.avatarUrl} alt="Alex Rivera" className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-accent" referrerPolicy="no-referrer" />
              <h3 className="text-md font-display font-bold mt-3 text-ink-on-canvas">{INITIAL_PROFILE.name}</h3>
              <span className="text-xs text-accent-active font-bold">{INITIAL_PROFILE.clubName}</span>
            </div>

            <div className="border-t border-hairline-on-canvas pt-5 space-y-3">
              <span className="text-[10px] text-ink-muted-on-canvas font-mono uppercase block font-bold">EARNED ATHLETE BADGES</span>
              <div className="space-y-2.5">
                {INITIAL_PROFILE.badges.map((badge, i) => (
                  <div key={i} className="flex gap-2.5 items-start bg-white p-3 rounded-xl border border-hairline-on-canvas shadow-2xs text-xs">
                    <span className="text-lg">{badge.icon}</span>
                    <div>
                      <span className="font-bold text-surface-raised block">{badge.name}</span>
                      <p className="text-[10px] text-ink-muted-on-canvas mt-0.5 leading-relaxed">{badge.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Personal Bests (8 cols) */}
          <div className="lg:col-span-8 bg-canvas/50 p-6 rounded-2xl border border-hairline-on-canvas space-y-6">
            <h3 className="text-xs text-ink-muted-on-canvas font-mono uppercase tracking-wider font-bold">Athlete Personal Bests (PBs)</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {INITIAL_PROFILE.personalBests.map((pb, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-hairline-on-canvas shadow-2xs">
                  <span className="text-[9px] text-ink-muted-on-canvas font-mono block uppercase font-bold">{pb.stroke} {pb.distance}m</span>
                  <span className="text-xl font-display font-bold text-accent-active block mt-1">{pb.time}</span>
                  <span className="text-[9px] text-ink-muted-on-canvas block mt-1 font-mono font-bold">EXAMPLE PB</span>
                </div>
              ))}
            </div>

            <div className="bg-white p-4 rounded-xl border border-hairline-on-canvas shadow-2xs space-y-2 text-xs">
              <span className="font-bold text-surface-raised block">Coach Assignments Link</span>
              <p className="text-ink-muted-on-canvas leading-relaxed text-[11px] font-medium">
                A future shared-account version could let an authorized coach reference athlete-entered best times while building lane targets. This prototype does not publish or synchronize these records.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
