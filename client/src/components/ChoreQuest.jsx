import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { tw } from "@twind/core";

const choresList = [
  {
    name: "🛏️ Make Your Bed",
    description: "Start your day like a superhero",
    amount: 5,
    time: "5 min",
    difficulty: "☺️ Easy",
  },
  {
    name: "🍽 Load Dishwasher",
    description: "Be a kitchen Helper Hero!",
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
    description: "Start your day like a super hero",
    amount: 5,
    time: "20 min",
    difficulty: "💪 Medium",
  },
  {
    name: "🛁 Clean Bathroom",
    description: "Start Your day like a super hero",
    amount: 5,
    time: "8 min",
    difficulty: "☺️ Easy",
  },
  {
    name: "🧺 Fold Laundry",
    description: "Start you day like a super hero",
    amount: 5,
    time: "25 min",
    difficulty: "💪 Medium",
  },
];

const ChoreQuest = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { goal } = location.state || {}; // goal is passed from the previous page
  const [selectedChores, setSelectedChores] = useState([]);

  useEffect(() => {
    if (!goal || goal.status !== "approved") {
      alert("This goal is not approved yet.");
      navigate(-1); // Go back
    }
  }, [goal, navigate]);

  const weeklyTarget = goal ? (goal.amount / goal.duration).toFixed(2) : 0;
  const earnedSoFar = selectedChores.reduce((sum, c) => sum + c.amount, 0);

  const toggleChore = (chore) => {
    setSelectedChores((prev) => {
      const exists = prev.find((c) => c.name === chore.name);
      return exists
        ? prev.filter((c) => c.name !== chore.name)
        : [...prev, chore];
    });
  };

  return (
      
    <div
      className={tw(
        "min-h-screen bg-gradient-to-br from-purple-100 to-blue-100"
      )}
    >
        
      <div className={tw("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6")}>
        <h1 className={tw("text-2xl font-bold text-center text-black-800 mb-4")}>
          Chore Quest
        </h1>
        <p className={tw("text-sm text-center text-gray-500 mb-10")}>
          Pick your missions to earn ${weeklyTarget}/Week{" "}
        </p>

        {/* Weekly Target Progress Bar */}
        <div className={tw("mb-6 bg-white p-4 rounded-xl shadow ")}>
          <h2
            className={tw(
              "text-lg font-bold text-black-700 text-center mb-6"
            )}
          >
            🚀 Keep Picking Chores To Reach Your Goal
          </h2>

          <div className={tw("w-full bg-gray-200 h-3 rounded-full")}>
            <div
              className={tw("bg-green-400 h-3 rounded-full")}
              style={{ width: `${(earnedSoFar / weeklyTarget) * 100}%` }}
            />
          </div>
          <p
            className={tw("mt-2 text-lg font-bold text-purple-700 text-right")}
          >
            $ {earnedSoFar.toFixed(2)} / $ {weeklyTarget} <br />
            <span className={tw("text-sm text-gray-500")}>
              Your Weekly Goal!
            </span>
          </p>
        </div>

        {/* Chore Selection */}
        <div className={tw("grid grid-cols-1 md:grid-cols-3 gap-8 mb-8")}>
          {choresList.map((chore, index) => {
            const selected = selectedChores.find((c) => c.name === chore.name);
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
                {/* Amount and Time aligned */}
                <div className={tw("flex items-center justify-between mb-2")}>
                  <span className={tw("px-3 text-sm rounded-full font-bold text-green-600")}
                    style={{
                      backgroundColor: "#DCFCE7",
                    }}
                    >
                    $ {chore.amount}.00
                  </span>
                  <span
                    className={tw(
                      "text-xs font-medium rounded-full px-2 py-1 flex items-center gap-1"
                    )}
                    style={{
                      backgroundColor: "#D9E1FF",
                      color: "#2235C5",
                    }}
                  >
                    ⏰ {chore.time}
                  </span>
                </div>
                {chore.difficulty === "💪 Medium" ? (
                  <span
                    className={tw(
                      "text-xs font-medium rounded-full px-2 py-1 border"
                    )}
                    style={{
                      backgroundColor: "#FCEDDC",
                      color: "#C57E22",
                      borderColor: "#C57E22",
                    }}
                  >
                    💪 Medium
                  </span>
                ) : (
                  <span
                    className={tw(
                      "text-xs font-medium rounded-full px-2 py-1 border"
                    )}
                    style={{
                      backgroundColor: "#DCFCE7",
                      color: "#22C55E",
                      borderColor: "#187235",
                    }}
                  >
                    ☺️ Easy
                  </span>
                )}
                
              </div>
            );
          })}
        </div>

        {/* Launch Mission Button */}
        <div className={tw("text-center")}>
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
    </div>
  );
};

export default ChoreQuest;
