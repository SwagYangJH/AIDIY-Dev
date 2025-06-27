// ChoreQuest.jsx - Updated version with goal assignment functionality

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
  const [loading, setLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);

  // If goal is not approved, prevent access
  useEffect(() => {
    if (!goal || goal.status !== "approved") {
      alert("This goal is not approved yet.");
      navigate(-1);
    }
  }, [goal, navigate]);

  // Fetch chores assigned to this child
  useEffect(() => {
    if (goal && goal.status === "approved") {
      const fetchChores = async () => {
        setLoading(true);
        try {
          const token = sessionStorage.getItem('app_token');
          
          // Direct API call - the backend will determine the kid from the token
          const response = await fetch('http://localhost:5500/api/chores', {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          const data = await response.json();
          console.log("Fetched chores:", data);
          
          if (data.success && data.chores) {
            // Filter out completed chores and only show assigned ones that aren't already assigned to a goal
            const assignedChores = data.chores.filter(
              chore => (chore.status === 'Assigned' || chore.status === 'pending') && !chore.assigned_goal_id
            );
            
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
              // Prefix title with an emoji based on category
              const prefix = chore.category && emojiMap[chore.category] ? emojiMap[chore.category] + ' ' : '';
              
              // Map difficulty to child-friendly format with emoji
              let diffLabel;
              if (chore.difficulty.toLowerCase() === 'easy') diffLabel = '☺️ Easy';
              else if (chore.difficulty.toLowerCase() === 'medium') diffLabel = '💪 Medium';
              else if (chore.difficulty.toLowerCase() === 'hard') diffLabel = '🔥 Hard';
              else diffLabel = chore.difficulty;
              
              return {
                id: chore.id, // Keep the chore ID for tracking
                name: prefix + chore.title,
                description: chore.description,
                amount: Math.round(chore.reward), // round reward to nearest whole number
                difficulty: diffLabel,
                dueDate: chore.dueDate,
                status: chore.status,
                category: chore.category
              };
            });
            
            if (convertedChores.length > 0) {
              // If there are assigned chores, show only those
              setAllChores(convertedChores);
              // Pre-select all assigned chores
              setSelectedChores(convertedChores);
            } else {
              // If no assigned chores, show default suggestions
              console.log("No assigned chores found, showing default suggestions");
              setAllChores(defaultChoresList);
            }
          } else {
            console.log("No chores data received, showing default suggestions");
            setAllChores(defaultChoresList);
          }
        } catch (err) {
          console.error("Failed to fetch chores:", err);
          // On error, show default suggestions
          setAllChores(defaultChoresList);
        } finally {
          setLoading(false);
        }
      };
      
      fetchChores();
    }
  }, [goal]);

  const weeklyTarget = goal ? (goal.amount / goal.duration).toFixed(2) : 0;
  const earnedSoFar = selectedChores.reduce((sum, c) => sum + c.amount, 0);

  const toggleChore = (chore) => {
    setSelectedChores((prev) => {
      const exists = prev.find((c) => c.name === chore.name);
      if (exists) {
        // Remove chore if already selected
        return prev.filter((c) => c.name !== chore.name);
      } else {
        return [...prev, chore];
      }
    });
  };

  const handleLaunchMission = async () => {
    if (selectedChores.length === 0) {
      alert("Please select at least one chore!");
      return;
    }

    setIsAssigning(true);
    
    try {
      const token = sessionStorage.getItem('app_token');
      
      // Get the IDs of selected chores
      const choreIds = selectedChores
        .filter(chore => chore.id) // Only chores that have IDs (from database)
        .map(chore => chore.id);
      
      if (choreIds.length > 0) {
        // Assign these chores to the goal
        const response = await fetch('http://localhost:5500/api/chores/assign-to-goal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            goalId: goal._id || goal.id,
            choreIds: choreIds
          })
        });

        const data = await response.json();
        
        if (!data.success) {
          console.error("Failed to assign chores to goal:", data.error);
        }
      }
      
      // Navigate to weekly progress with selected chores
      navigate("/weekly-progress", { state: { selectedChores, goal } });
      
    } catch (error) {
      console.error("Error assigning chores to goal:", error);
      // Still navigate even if assignment fails
      navigate("/weekly-progress", { state: { selectedChores, goal } });
    } finally {
      setIsAssigning(false);
    }
  };

  // Styles for difficulty badges
  const easyStyle = { backgroundColor: "#DCFCE7", color: "#22C55E", borderColor: "#187235" };
  const mediumStyle = { backgroundColor: "#FCEDDC", color: "#C57E22", borderColor: "#C57E22" };
  const hardStyle = { backgroundColor: "#FEE2E2", color: "#DC2626", borderColor: "#DC2626" };

  if (loading) {
    return (
      <div className={tw("min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center")}>
        <div className={tw("text-xl font-semibold text-purple-700")}>Loading your chores...</div>
      </div>
    );
  }

  return (
    <div className={tw("min-h-screen bg-gradient-to-br from-purple-100 to-blue-100")}>
      <div className={tw("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6")}>
        <h1 className={tw("text-2xl font-bold text-center text-black-800 mb-4")}>
          Chore Quest
        </h1>
        <p className={tw("text-sm text-center text-gray-500 mb-10")}>
          Pick your missions to earn ${weeklyTarget}/week for "{goal?.title}"
        </p>

        {/* Weekly Target Progress Bar */}
        <div className={tw("mb-6 bg-white p-4 rounded-xl shadow")}>
          <h2 className={tw("text-lg font-bold text-black-700 text-center mb-6")}>
            🚀 Keep Picking Chores To Reach Your Goal
          </h2>
          <div className={tw("w-full bg-gray-200 h-3 rounded-full")}>
            <div
              className={tw("bg-green-400 h-3 rounded-full transition-all duration-500")}
              style={{ width: `${Math.min((earnedSoFar / weeklyTarget) * 100, 100)}%` }}
            />
          </div>
          <p className={tw("mt-2 text-lg font-bold text-purple-700 text-right")}>
            $ {earnedSoFar.toFixed(2)} / $ {weeklyTarget} <br />
            <span className={tw("text-sm text-gray-500")}>
              Your Weekly Goal!
            </span>
          </p>
        </div>

        {/* Show message if no chores available */}
        {allChores.length === 0 ? (
          <div className={tw("text-center py-10")}>
            <p className={tw("text-lg text-gray-600 mb-4")}>
              No chores have been assigned to you yet!
            </p>
            <p className={tw("text-sm text-gray-500")}>
              Ask your parent to assign some chores for this goal.
            </p>
          </div>
        ) : (
          <>
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
                    key={chore.id || index}
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
                      {/* Show due date if available */}
                      {chore.dueDate && (
                        <span
                          className={tw("text-xs font-medium rounded-full px-2 py-1 flex items-center gap-1 border")}
                          style={{ backgroundColor: "#D9E1FF", color: "#2235C5", borderColor: "#2235C5" }}
                        >
                          📅 {new Date(chore.dueDate).toLocaleDateString()}
                        </span>
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
                onClick={handleLaunchMission}
                disabled={selectedChores.length === 0 || isAssigning}
                className={tw(
                  `px-20 py-3 rounded text-white font-semibold text-lg transition-all ${
                    selectedChores.length === 0 || isAssigning
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-teal-400 to-purple-500 hover:opacity-90"
                  }`
                )}
              >
                {isAssigning ? "🚀 Launching..." : "🎯 Launch My Mission"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChoreQuest;