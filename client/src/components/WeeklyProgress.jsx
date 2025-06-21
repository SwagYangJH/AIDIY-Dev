import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { tw } from "@twind/core";
import CelebrationEffect from "./CelebrationEffect";

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const labelColors = ["#696EFF", "#FF85B8"];

const WeeklyProgress = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const selectedChores = state?.selectedChores || [];
  const goal = state?.goal || {};
  const [completedChores, setCompletedChores] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const toggleComplete = (name) => {
    const wasCompleted = completedChores.includes(name);
    
    setCompletedChores((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
    
    // Show celebration only when completing (not uncompleting)
    if (!wasCompleted) {
      setShowCelebration(true);
    }
  };

  const handleSubmitProgress = async () => {
    if (completedChores.length === 0) {
      alert('Please complete at least one chore before submitting!');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const token = sessionStorage.getItem('app_token');
      const completedChoreDetails = selectedChores.filter(chore => 
        completedChores.includes(chore.name)
      );
      
      const submissionData = {
        goalId: goal._id || goal.id,
        completedChores: completedChoreDetails,
        totalEarned: completedChoreDetails.reduce((sum, chore) => sum + chore.amount, 0),
        submissionDate: new Date().toISOString()
      };

      const response = await fetch('http://localhost:5500/api/goals/submit-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submissionData)
      });

      const data = await response.json();
      
      if (data.success) {
        setHasSubmitted(true);
        alert('🎉 Great job! Your progress has been submitted to your parents for approval!');
        
        // Set a flag to trigger refresh in KidDashboard
        sessionStorage.setItem('refreshKidDashboard', 'true');
      } else {
        alert('Failed to submit progress. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting progress:', error);
      alert('Failed to submit progress. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
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

      {/* Submit Progress Section */}
      {completedChores.length > 0 && !hasSubmitted && (
        <div className={tw("mt-8 max-w-4xl mx-auto bg-white rounded-3xl shadow-lg p-6 border-2 border-green-200")}>
          <div className={tw("text-center")}>
            <div className={tw("text-4xl mb-4")}>🎯</div>
            <h3 className={tw("text-xl font-bold text-gray-800 mb-2")}>Ready to submit your progress?</h3>
            <p className={tw("text-gray-600 mb-4")}>
              You've completed {completedChores.length} task{completedChores.length > 1 ? 's' : ''} and earned ${selectedChores.filter(c => completedChores.includes(c.name)).reduce((sum, c) => sum + c.amount, 0).toFixed(2)}!
            </p>
            <button
              onClick={handleSubmitProgress}
              disabled={isSubmitting}
              className={tw(`px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold text-lg rounded-2xl hover:shadow-xl transform hover:scale-105 transition-all ${
                isSubmitting ? 'opacity-70 cursor-not-allowed transform-none' : ''
              }`)}
            >
              {isSubmitting ? (
                <>
                  <span className={tw("animate-spin mr-2")}>⏳</span>
                  Submitting...
                </>
              ) : (
                <>
                  🚀 Submit My Progress to Parents
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {hasSubmitted && (
        <div className={tw("mt-8 max-w-4xl mx-auto bg-gradient-to-r from-green-400 to-blue-500 rounded-3xl shadow-lg p-6 text-white text-center")}>
          <div className={tw("text-6xl mb-4")}>🎉</div>
          <h3 className={tw("text-2xl font-bold mb-2")}>Awesome Work!</h3>
          <p className={tw("text-lg mb-4")}>
            Your parents will review your completed tasks and update your savings!
          </p>
          <div className={tw("text-xl font-bold mb-6")}>
            💰 You earned ${selectedChores.filter(c => completedChores.includes(c.name)).reduce((sum, c) => sum + c.amount, 0).toFixed(2)} this week!
          </div>
          <button
            onClick={() => navigate("/kid-dashboard")}
            className={tw(
              "px-8 py-4 bg-white text-green-600 font-bold text-lg rounded-2xl hover:shadow-xl transform hover:scale-105 transition-all"
            )}
          >
            🏠 View Updated Dashboard
          </button>
        </div>
      )}

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

      {/* Celebration Effect */}
      <CelebrationEffect 
        isVisible={showCelebration} 
        onComplete={() => setShowCelebration(false)}
      />
    </div>
  );
};

export default WeeklyProgress;
