/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Users, Award, Trophy, MapPin, Heart, MessageSquare, Plus, Check, Star, Shield, ArrowRight } from "lucide-react";
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
    { name: "Lactate Champ", icon: "⚡", desc: "Completed 3 safety-audited threshold sprints under goal cycles." },
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
    content: "Outstanding threshold set swam by everyone today! Paces were sharp. Make sure to check the active leaderboards — Alex and Marcus are neck-and-neck!",
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
    <div className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm" id="community-workspace">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-6 mb-8 gap-4">
        <div>
          <h2 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Swimmer Guild
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Discover local swimming clubs, track informal leaderboards, and coordinate club vs. club challenges.
          </p>
        </div>

        {/* TABS */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200/60 text-xs self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("feed")}
            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === "feed" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Local Feed
          </button>
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === "leaderboard" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Leaderboard
          </button>
          <button
            onClick={() => setActiveTab("clubs")}
            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === "clubs" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Club Matches
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === "profile" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
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
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="Share your daily training set summary or ask local athletes for tips..."
                rows={2}
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300"
              />
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-mono font-medium">POSTING TO SF TRI-COMMUNITY</span>
                <button
                  onClick={handlePostSubmit}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm"
                >
                  Post Swim Log
                </button>
              </div>
            </div>

            {/* Feed List */}
            <div className="space-y-4">
              {feed.map((item) => (
                <div key={item.id} className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <img src={item.avatarUrl} alt={item.author} className="w-9 h-9 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{item.author}</span>
                        {item.hasSwimBadge && (
                          <span className="bg-indigo-50 text-indigo-700 text-[9px] px-2 py-0.5 rounded-md border border-indigo-100 font-bold font-mono">
                            {item.hasSwimBadge}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{item.timeAgo}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-medium">{item.content}</p>

                  <div className="flex items-center gap-4 pt-3 border-t border-slate-100 text-slate-500">
                    <button
                      onClick={() => handleLike(item.id)}
                      className="flex items-center gap-1.5 text-[11px] hover:text-indigo-600 transition font-semibold"
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
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 text-indigo-600">
                <Shield className="w-5 h-5" />
                <h3 className="font-display font-bold text-slate-800 text-sm">My Swim Club</h3>
              </div>

              {joinedClub ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">SF TriMasters Club</h4>
                    <span className="text-[10px] text-slate-400 font-mono">San Francisco, CA • 42 Active Athletes</span>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Club Rank:</span>
                      <span className="font-bold text-indigo-600">#2 Regional</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Monthly Volume:</span>
                      <span className="font-mono font-bold text-slate-700">342.8k yards</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    You are linked to this roster. Your daily yards automatically contribute to the July Summer Volume Clash.
                  </p>
                </div>
              ) : (
                <div className="text-center py-4 space-y-3">
                  <p className="text-xs text-slate-500 italic">You aren't in a club yet.</p>
                  <button
                    onClick={() => setJoinedClub(true)}
                    className="w-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 p-2.5 rounded-xl text-xs font-bold transition shadow-2xs"
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
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 justify-between">
            <h3 className="text-sm font-display font-bold text-slate-800 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-indigo-600" />
              Regional Distance Leaderboard (Monthly Yards)
            </h3>
            <span className="text-[10px] text-slate-400 font-mono font-medium">UPDATED 15 MINS AGO</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-mono text-[9px] border-b border-slate-200 font-bold">
                <tr>
                  <th className="p-4 text-center">RANK</th>
                  <th className="p-4">SWIMMER</th>
                  <th className="p-4">CLUB</th>
                  <th className="p-4 text-right">MONTHLY VOLUME</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {LEADERBOARD.map((swimmer) => (
                  <tr key={swimmer.rank} className={`hover:bg-slate-50/50 transition-colors ${swimmer.name === "Alex Rivera" ? "bg-indigo-50/20 font-bold" : ""}`}>
                    <td className="p-4 text-center font-bold font-mono">
                      {swimmer.rank === 1 ? "🥇" : swimmer.rank === 2 ? "🥈" : swimmer.rank === 3 ? "🥉" : swimmer.rank}
                    </td>
                    <td className="p-4 flex items-center gap-3">
                      <img src={swimmer.avatarUrl} alt={swimmer.name} className="w-7 h-7 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                      <span className="font-semibold text-slate-800">{swimmer.name} {swimmer.name === "Alex Rivera" && "(Me)"}</span>
                    </td>
                    <td className="p-4 text-slate-500">{swimmer.clubName}</td>
                    <td className="p-4 text-right font-mono font-bold text-indigo-600">{swimmer.score.toLocaleString()} yards</td>
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
          <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200 text-xs text-slate-500 leading-relaxed flex items-center gap-3">
            <Award className="w-5 h-5 text-indigo-600 shrink-0" />
            <span>
              <strong>Club-vs-Club Matches:</strong> Inter-club challenges allow local master teams to compete over total weekly yards, specific sprint cycle relay goals, and median RPE load metrics.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CLUB_MATCHES.map((challenge) => (
              <div key={challenge.id} className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-2xs">
                <div className="flex justify-between items-start gap-4">
                  <span className="text-xs font-bold text-slate-800 leading-relaxed line-clamp-1">{challenge.title}</span>
                  <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-600 rounded-md px-2 py-0.5 whitespace-nowrap shrink-0 border border-slate-200/60">
                    Ends: {challenge.deadline}
                  </span>
                </div>

                <div className="space-y-3.5">
                  {/* Progress A */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono font-medium">
                      <span className="text-slate-600">{challenge.clubA}</span>
                      <span className="text-slate-800 font-bold">{challenge.progressA}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-slate-800 h-2 rounded-full" style={{ width: `${challenge.progressA}%` }} />
                    </div>
                  </div>

                  {/* VS Divider */}
                  <div className="text-center font-mono text-[9px] text-slate-400 font-bold">VS</div>

                  {/* Progress B */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono font-medium">
                      <span className="text-slate-600">{challenge.clubB}</span>
                      <span className="text-indigo-600 font-bold">{challenge.progressB}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${challenge.progressB}%` }} />
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
          <div className="lg:col-span-4 bg-slate-50/50 p-6 rounded-2xl border border-slate-200 space-y-4">
            <div className="text-center">
              <img src={INITIAL_PROFILE.avatarUrl} alt="Alex Rivera" className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-indigo-600" referrerPolicy="no-referrer" />
              <h3 className="text-md font-display font-bold mt-3 text-slate-850">{INITIAL_PROFILE.name}</h3>
              <span className="text-xs text-indigo-600 font-bold">{INITIAL_PROFILE.clubName}</span>
            </div>

            <div className="border-t border-slate-200 pt-5 space-y-3">
              <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold">EARNED ATHLETE BADGES</span>
              <div className="space-y-2.5">
                {INITIAL_PROFILE.badges.map((badge, i) => (
                  <div key={i} className="flex gap-2.5 items-start bg-white p-3 rounded-xl border border-slate-200 shadow-2xs text-xs">
                    <span className="text-lg">{badge.icon}</span>
                    <div>
                      <span className="font-bold text-slate-800 block">{badge.name}</span>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{badge.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Personal Bests (8 cols) */}
          <div className="lg:col-span-8 bg-slate-50/50 p-6 rounded-2xl border border-slate-200 space-y-6">
            <h3 className="text-xs text-slate-400 font-mono uppercase tracking-wider font-bold">Athlete Personal Bests (PBs)</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {INITIAL_PROFILE.personalBests.map((pb, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[9px] text-slate-400 font-mono block uppercase font-bold">{pb.stroke} {pb.distance}m</span>
                  <span className="text-xl font-display font-extrabold text-indigo-600 block mt-1">{pb.time}</span>
                  <span className="text-[9px] text-slate-400 block mt-1 font-mono font-bold">VERIFIED COMPETITION</span>
                </div>
              ))}
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2 text-xs">
              <span className="font-bold text-slate-800 block">Coach Assignments Link</span>
              <p className="text-slate-500 leading-relaxed text-[11px] font-medium">
                Your linked coach, <strong>Sarah G.</strong>, can view these personal best milestones directly to scale your lactate threshold intervals in Swim Studio.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
