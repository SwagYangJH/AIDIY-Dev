import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { tw } from "@twind/core";

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const labelColors = ["#696EFF", "#FF85B8"];

const WeeklyProgress = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const selectedChores = state?.selectedChores || [];
  const goal = state?.goal || {};
  const [completedChores, setCompletedChores] = useState([]);

  const toggleComplete = (name) => {
    setCompletedChores((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  return (
    <div className={tw("min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 px-4 py-6")}>
      {/* Header */}
      <div className={tw("max-w-4xl mx-auto bg-white p-4 rounded-xl shadow-md mb-6")}>
        <h2 className={tw("text-lg font-bold text-purple-700 mb-1")}>🏆 WEEKLY ADVENTURE PROGRESS</h2>
        <p className={tw("text-sm text-gray-500 mb-2")}>Let’s start this amazing adventure ✨</p>
        <div className={tw("w-full bg-gray-200 h-3 rounded-full mb-2")}>
          <div
            className={tw("bg-blue-400 h-3 rounded-full")}
            style={{ width: `${(completedChores.length / selectedChores.length) * 100}%` }}
          />
        </div>
        <p className={tw("text-sm font-semibold")}>
          ⭐ {completedChores.length} of {selectedChores.length} Missions Completed
        </p>
      </div>

      {/* Chore Cards */}
      <div className={tw("max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6")}>
        {selectedChores.map((chore, index) => {
          const isCompleted = completedChores.includes(chore.name);
          const day = dayLabels[index % 7];
          const labelColor = labelColors[index % labelColors.length];

          return (
            <div
              key={index}
              className={tw(
                `rounded-xl bg-white shadow-md border ${
                  isCompleted ? "border-green-500" : "border-gray-300"
                }`
              )}
            >
              {/* Full-width Day Label Bar */}
              <div
                className={tw("w-full py-1 text-center text-white text-xs font-bold rounded-t-xl")}
                style={{ backgroundColor: labelColor }}
              >
                {day}
              </div>

              {/* Card Content */}
              <div className={tw("p-4")}>
                {/* Checkbox + Task Name */}
                <div className={tw("flex items-center mb-2")}>
                  <input
                    type="checkbox"
                    checked={isCompleted}
                    onChange={() => toggleComplete(chore.name)}
                    className={tw("mr-2 w-4 h-4")}
                  />
                  <h3
                    className={tw(
                      `font-bold text-blue-800 mb-1 ${
                        isCompleted ? "line-through text-gray-500" : ""
                      }`
                    )}
                  >
                    {chore.name}
                  </h3>
                </div>

                {/* Description */}
                <p className={tw("text-sm text-gray-600 mb-1")}>{chore.description}</p>

                {/* Meta Info */}
                <div className={tw("flex justify-between items-center text-sm mb-2")}>
                  <span className={tw("text-green-600 font-semibold")}>💰 ${chore.amount}</span>
                  <span className={tw("text-blue-500")}>⏰ {chore.time}</span>
                </div>

                {/* Guide Me Button */}
                <button
                  onClick={() => navigate("/chat")}
                  className={tw(
                    "px-4 py-1 bg-primary-turquoise text-white rounded-md text-sm mt-2 hover:opacity-90"
                  )}
                >
                  Guide Me AiDIY
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Buttons */}
      <div className={tw("mt-10 text-center flex flex-wrap justify-center gap-4")}>
        <button
          onClick={() => navigate(-1)}
          className={tw(
            "px-6 py-2 bg-gradient-to-r from-yellow-400 to-pink-300 text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
          )}
        >
          ✏️ Edit My Mission List
        </button>
        <button
          onClick={() => navigate("/kid-dashboard")}
          className={tw(
            "px-6 py-2 bg-gradient-to-r from-purple-400 to-blue-500 text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
          )}
        >
          🏠 Return To Home Page
        </button>
      </div>
    </div>
  );
};

export default WeeklyProgress;
