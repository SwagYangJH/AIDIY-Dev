import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { tw } from "@twind/core";

// Static list of suggested chores (for when parent hasn't assigned specific chores)
const defaultChoresList = [
  {
    name: "🛏️ Make Your Bed",
    description: "Start your day like a superhero",
    amount: 5,
    time: "5 min",
    difficulty: "☺️ Easy",
  },
  {
    name: "🍽 Load Dishwasher",
    description: "Be a Kitchen Helper Hero!",
    amount: 5,
    time: "10 min",
    difficulty: "☺️ Easy",
  },
  {
    name: "🧹 Vacuum Living Room",
    description: "Dance while you clean!",
    amount: 5,
    time: "15 min",
    difficulty: "💪 Medium",
  },
  {
    name: "📚 Organize Bookshelf",
    description: "Sort and organize your books",
    amount: 5,
    time: "20 min",
    difficulty: "💪 Medium",
  },
  {
    name: "🛁 Clean Bathroom",
    description: "Wipe down surfaces and scrub the tub",
    amount: 5,
    time: "8 min",
    difficulty: "☺️ Easy",
  },
  {
    name: "🧺 Fold Laundry",
    description: "Fold and put away clean clothes",
    amount: 5,
    time: "25 min",
    difficulty: "💪 Medium",
  },
];

const ChoreQuest = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { goal } = location.state || {};

  const [allChores, setAllChores] = useState(defaultChoresList);
  const [selectedChores, setSelectedChores] = useState([]);

  // If goal is not approved, prevent access
  useEffect(() => {
    if (!goal || goal.status !== "approved") {
      alert("This goal is not approved yet.");
      navigate(-1);
    }
  }, [goal, navigate]);

  // Fetch chores assigned to this child (if any) and integrate into chore list
  useEffect(() => {
    if (goal && goal.status === "approved") {
      // Determine the child's username (assuming goal contains child identifier)
      const childUsername = goal.kid_username || goal.username;
      if (!childUsername) return;
      const token = sessionStorage.getItem('app_token');
      fetch(`http://localhost:5500/api/chores?kid=${childUsername}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            // Filter out chores that are already completed
            const assignedChores = data.chores.filter(chore => chore.status !== 'completed');
            // Convert each assigned chore to match the format of defaultChoresList
            const emojiMap = {
              Cleaning: '🧹',
              Kitchen: '🍳',
              Outdoor: '🌳',
              Organization: '📦',
              'Pet Care': '🐕',
              Other: '📝'
            };
            const convertedChores = assignedChores.map(chore => {
              // Prefix title with an emoji based on category, if available
              const prefix = chore.category && emojiMap[chore.category] ? emojiMap[chore.category] + ' ' : '';
              // Map difficulty to child-friendly format with emoji
              let diffLabel;
              if (chore.difficulty.toLowerCase() === 'easy') diffLabel = '☺️ Easy';
              else if (chore.difficulty.toLowerCase() === 'medium') diffLabel = '💪 Medium';
              else if (chore.difficulty.toLowerCase() === 'hard') diffLabel = '🔥 Hard';
              return {
                name: prefix + chore.title,
                description: chore.description,
                amount: Math.round(chore.reward),  // round reward to nearest whole number for display
                // no time (use dueDate instead if present)
                difficulty: diffLabel || chore.difficulty
              };
            });
            // Merge assigned chores with default suggestions, avoiding duplicates by name
            const filteredDefaults = defaultChoresList.filter(dc => 
              !convertedChores.some(ac => ac.name === dc.name)
            );
            const mergedList = [...convertedChores, ...filteredDefaults];
            setAllChores(mergedList);
            // Pre-select all assigned chores in the list
            setSelectedChores(prevSelected => {
              const preselected = convertedChores;
              // Avoid duplicating if some were already selected
              const combined = [...prevSelected];
              preselected.forEach(pc => {
                if (!combined.find(c => c.name === pc.name)) {
                  combined.push(pc);
                }
              });
              return combined;
            });
          }
        })
        .catch(err => console.error("Failed to fetch child's chores:", err));
    }
  }, [goal]);

  const weeklyTarget = goal ? (goal.amount / goal.duration).toFixed(2) : 0;
  const earnedSoFar = selectedChores.reduce((sum, c) => sum + c.amount, 0);

  const toggleChore = (chore) => {
    setSelectedChores((prev) => {
      const exists = prev.find((c) => c.name === chore.name);
      if (exists) {
        // Remove chore if already selected (allow deselecting if not mandatory)
        return prev.filter((c) => c.name !== chore.name);
      } else {
        return [...prev, chore];
      }
    });
  };

  // Styles for difficulty badges
  const easyStyle = { backgroundColor: "#DCFCE7", color: "#22C55E", borderColor: "#187235" };
  const mediumStyle = { backgroundColor: "#FCEDDC", color: "#C57E22", borderColor: "#C57E22" };
  const hardStyle = { backgroundColor: "#FEE2E2", color: "#DC2626", borderColor: "#DC2626" };

  return (
    <div className={tw("min-h-screen bg-gradient-to-br from-purple-100 to-blue-100")}>
      <div className={tw("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6")}>
        <h1 className={tw("text-2xl font-bold text-center text-black-800 mb-4")}>
          Chore Quest
        </h1>
        <p className={tw("text-sm text-center text-gray-500 mb-10")}>
          Pick your missions to earn ${weeklyTarget}/week
        </p>

        {/* Weekly Target Progress Bar */}
        <div className={tw("mb-6 bg-white p-4 rounded-xl shadow")}>
          <h2 className={tw("text-lg font-bold text-black-700 text-center mb-6")}>
            🚀 Keep Picking Chores To Reach Your Goal
          </h2>
          <div className={tw("w-full bg-gray-200 h-3 rounded-full")}>
            <div
              className={tw("bg-green-400 h-3 rounded-full")}
              style={{ width: `${(earnedSoFar / weeklyTarget) * 100}%` }}
            />
          </div>
          <p className={tw("mt-2 text-lg font-bold text-purple-700 text-right")}>
            $ {earnedSoFar.toFixed(2)} / $ {weeklyTarget} <br />
            <span className={tw("text-sm text-gray-500")}>
              Your Weekly Goal!
            </span>
          </p>
        </div>

        {/* Chore Selection Grid */}
        <div className={tw("grid grid-cols-1 md:grid-cols-3 gap-8 mb-8")}>
          {allChores.map((chore, index) => {
            const selected = !!selectedChores.find((c) => c.name === chore.name);
            // Determine difficulty badge style
            let diffStyleObj;
            if (chore.difficulty.includes('Hard')) diffStyleObj = hardStyle;
            else if (chore.difficulty.includes('Medium')) diffStyleObj = mediumStyle;
            else diffStyleObj = easyStyle;
            return (
              <div
                key={index}
                onClick={() => toggleChore(chore)}
                className={tw(
                  `p-4 border rounded-xl shadow cursor-pointer transition-transform hover:scale-105 ${
                    selected ? "bg-green-100 border-green-400" : "bg-white"
                  }`
                )}
              >
                <h3 className={tw("font-bold text-lg text-black-800")}>
                  {chore.name}
                </h3>
                <p className={tw("text-sm text-left text-gray-500 mb-10")}>
                  {chore.description}
                </p>
                {/* Amount and Time/Due aligned */}
                <div className={tw("flex items-center justify-between mb-2")}>
                  <span
                    className={tw("px-3 text-sm rounded-full font-bold text-green-600")}
                    style={{ backgroundColor: "#DCFCE7" }}
                  >
                    $ {chore.amount}.00
                  </span>
                  {/* Show time if available, otherwise due date if available */}
                  {chore.time ? (
                    <span
                      className={tw("text-xs font-medium rounded-full px-2 py-1 flex items-center gap-1 border")}
                      style={{ backgroundColor: "#D9E1FF", color: "#2235C5", borderColor: "#2235C5" }}
                    >
                      ⏰ {chore.time}
                    </span>
                  ) : chore.dueDate ? (
                    <span
                      className={tw("text-xs font-medium rounded-full px-2 py-1 flex items-center gap-1 border")}
                      style={{ backgroundColor: "#D9E1FF", color: "#2235C5", borderColor: "#2235C5" }}
                    >
                      📅 {new Date(chore.dueDate).toLocaleDateString()}
                    </span>
                  ) : (
                    <span />
                  )}
                </div>
                {/* Difficulty badge */}
                <span
                  className={tw("text-xs font-medium rounded-full px-2 py-1 border")}
                  style={diffStyleObj}
                >
                  {chore.difficulty}
                </span>
              </div>
            );
          })}
        </div>

        {/* Launch Mission Button */}
        <div className={tw("text-center")}>
          <button
            onClick={() => navigate("/weekly-progress", { state: { selectedChores, goal } })}
            disabled={selectedChores.length === 0}
            className={tw(
              `px-20 py-3 rounded text-white font-semibold text-lg transition-all ${
                selectedChores.length === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-teal-400 to-purple-500 hover:opacity-90"
              }`
            )}
          >
            🎯 Launch My Mission
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChoreQuest;
