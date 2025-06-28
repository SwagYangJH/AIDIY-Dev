import React, { useState } from "react";
import { Link } from "react-router-dom";
import { tw } from "@twind/core";
// import KidCashImage from '../images/your-image.png'; // adjust the path if needed
import KidCash from '../images/kidcash.png'; // adjust the path as needed
import aidiyLogo from '../images/aidiy_logo.png';



const HomePage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className={tw("min-h-screen")}>
      {/* Navigation */}
      <nav className={tw('fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-100 z-50')}>
        <div className={tw('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8')}>
          <div className={tw('flex items-center justify-between h-20')}>
            <Link to="/" className={tw('flex items-center space-x-2')}>
              <img 
                src={aidiyLogo} 
                alt="AiDIY" 
                className="h-20 w-auto"
              />
            </Link>

            {/* <div className={tw(`md:flex items-center space-x-8 ${isMenuOpen ? 'flex' : 'hidden'}`)}>
              <Link to="/features" className={tw('text-gray-700 hover:text-primary-turquoise font-medium transition-colors')}>
                Features
              </Link>
              <Link to="/about" className={tw('text-gray-700 hover:text-primary-turquoise font-medium transition-colors')}>
                About Us
              </Link>
              <Link to="/contact" className={tw('text-gray-700 hover:text-primary-turquoise font-medium transition-colors')}>
                Contact
              </Link>
              <Link to="/login" className={tw('bg-gradient-to-r from-primary-turquoise to-primary-turquoise-dark text-white px-6 py-2 rounded-full font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300')}>
                Login
              </Link>
            </div> */}

            <button onClick={toggleMenu} className={tw("md:hidden")}>
              <div className={tw("space-y-1.5")}>
                <span className={tw("block w-6 h-0.5 bg-gray-800")}></span>
                <span className={tw("block w-6 h-0.5 bg-gray-800")}></span>
                <span className={tw("block w-6 h-0.5 bg-gray-800")}></span>
              </div>
            </button>
          </div>
        </div>
      </nav>
      Hero Section
      <section
        className={tw("pt-32 pb-20 overflow-hidden")}
        style={{
          // background: "linear-gradient(to bottom right,rgb(145, 84, 152), #008080)", // turquoise shades gradient
          background: "linear-gradient(to bottom right,rgb(183, 115, 190),rgb(30, 234, 234))"
        }}
      >
        <div className={tw("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8")}>
          {/* Text and Button + Image Side-by-Side */}
          <div className={tw("text-white text-center lg:text-left")}>
            <h1
              className={tw(
                "text-[42px] sm:text-[48px] lg:text-[58px] font-extrabold mr-6 mb-6"
              )}
              style={{
                fontFamily: "Nunito, sans-serif",
                color: "#4f3727",
              }}
            >
              AiDIY – Your Life Skills Buddy
            </h1>

            <div
              className={tw(
                "flex flex-col lg:flex-row items-center justify-between"
              )}
            >
              {/* Left side: paragraph and button */}
              <div className={tw("lg:w-1/2 text-center lg:text-left")}>
                <p
                  className={tw(
                    "text-base sm:text-lg lg:text-xl opacity-90 mb-8 leading-relaxed text-[#4f3727] text-justify"
                  )}
                >
                  Meet AiDIY — Your friendly AI buddy that makes learning about
                  money more fun. Kids learn by doing; this DIY concept helps
                  kids make smart money choices. AiDIY guides kids through
                  real-world challenges with a voice they trust and a vibe they
                  love — and that parents can trust. Designed for curious minds
                  aged 8–16, AiDIY grows with your child—adapting to their pace,
                  cheering them on, and celebrating every milestone. Let’s build
                  a generation that’s financially wise, independent, and ready
                  for life — with a little help from their favorite money coach
                  — AiDIY.
                </p>

                <div
                  className={tw(
                    "flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                  )}
                >
                  <Link
                    to="/login"
                    className={tw(
                      "shadow-lg transform hover:scale-105 hover:shadow-xl transition-all duration-300 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                    style={{
                      width: "180px",
                      height: "59px",
                      borderRadius: "10px",
                      background: "linear-gradient(to right, #2dd4bf, #a855f7)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid black",
                      color: "black",
                      textAlign: "center",
                    }}
                  >
                    Lets Begin
                  </Link>
                </div>
              </div>

              {/* Right side: image */}
              {/* <div className={tw("lg:w-1/2 mt-10 lg:mt-0 flex justify-center")}>
                <img
                  src={KidCash}
                  alt="A sample"
                  className={tw("w-150 h-auto rounded-lg shadow-lg")}
                />
              </div> */}
            </div>
          </div>

          <section className={tw("py-20")}>
            <div className={tw("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8")}>
              <h2
                className={tw(
                  "text-4xl font-bold text-center text-[#4f3727] mb-12"
                )}
              >
                Set Goals. Hit Milestones. Build Money Smart Skills with
                Confidence
              </h2>

              {/* Kid Block Group */}
              <div
                className={tw(
                  "bg-white rounded-t-[20px] overflow-hidden shadow-lg"
                )}
              >
                <div className={tw("grid grid-cols-1 md:grid-cols-3")}>
                  <div
                    className={tw(
                      "bg-[#E0F7FA] p-8 border-b md:border-b-0 md:border-r border-white"
                    )}
                  >
                    <h3
                      className={tw("text-2xl font-bold text-[#0a2150] mb-4")}
                    >
                      ⭐ Goal Setting
                    </h3>
                    <p className={tw("text-[#0a2150] text-base")}>
                      Smart, age-appropriate money missions tailored to skill
                      level.
                    </p>
                  </div>
                  <div
                    className={tw(
                      "bg-[#F1F8E9] p-8 border-b md:border-b-0 md:border-r border-white"
                    )}
                  >
                    <h3
                      className={tw("text-2xl font-bold text-[#0a2150] mb-4")}
                    >
                      📊 Progress Tracking
                    </h3>
                    <p className={tw("text-[#0a2150] text-base")}>
                      XP points, skill streaks, and achievement boards to boost
                      engagement.
                    </p>
                  </div>
                  <div className={tw("bg-[#FFF3E0] p-8")}>
                    <h3
                      className={tw("text-2xl font-bold text-[#0a2150] mb-4")}
                    >
                      🏅 Milestone Rewards
                    </h3>
                    <p className={tw("text-[#0a2150] text-base")}>
                      Digital badges, praise from Aidie, and optional parent-set
                      rewards.
                    </p>
                  </div>
                </div>
              </div>

              {/* Parent Block Group */}
              <div
                className={tw(
                  "bg-white rounded-b-[20px] overflow-hidden shadow-lg"
                )}
              >
                <div className={tw("grid grid-cols-1 md:grid-cols-3")}>
                  <div
                    className={tw(
                      "bg-[#E8EAF6] p-8 border-b md:border-b-0 md:border-r border-white"
                    )}
                  >
                    <h3
                      className={tw("text-2xl font-bold text-[#0a2150] mb-4")}
                    >
                      🔐 Safe by Design
                    </h3>
                    <p className={tw("text-[#0a2150] text-base")}>
                      COPPA-compliant, privacy-first, and voice-controlled for
                      secure fun.
                    </p>
                  </div>
                  <div
                    className={tw(
                      "bg-[#FCE4EC] p-8 border-b md:border-b-0 md:border-r border-white"
                    )}
                  >
                    <h3
                      className={tw("text-2xl font-bold text-[#0a2150] mb-4")}
                    >
                      📈 Progress Dashboard
                    </h3>
                    <p className={tw("text-[#0a2150] text-base")}>
                      Stay informed with insights, skill tracking, and
                      reflection logs.
                    </p>
                  </div>
                  <div className={tw("bg-[#E0F2F1] p-8")}>
                    <h3
                      className={tw("text-2xl font-bold text-[#0a2150] mb-4")}
                    >
                      💼 Parent Tools
                    </h3>
                    <p className={tw("text-[#0a2150] text-base")}>
                      Approve challenges, add incentives, and access growth
                      reports.
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA Below the Blocks */}
              <div className={tw("mt-16 text-center")}>
                <h3 className={tw("text-3xl font-bold text-[#0a2150] mb-6")}>
                  Ready to raise a financially confident kid?
                </h3>
                <Link
                  to="/login"
                  className={tw(
                    "inline-block px-8 py-4 text-white font-semibold text-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                  )}
                  style={{
                    background: "linear-gradient(to right, #2dd4bf, #a855f7)",
                    borderRadius: "10px",
                    border: "1px solid black",
                    color: "black",
                  }}
                >
                  Get Started for Free
                </Link>
              </div>
            </div>
          </section>

          {/* Purple Box Section */}
          <div className={tw("mt-28 flex justify-center")}>
            <div
              className={tw(
                "bg-[#F8ECFF] rounded-[5px] w-full max-w-[1650px] h-[600px] sm:h-[800px] lg:h-[1087px] px-6 sm:px-12 py-10 sm:py-16 flex flex-col justify-center items-center text-center"
              )}
            >
              <h2
                className={tw(
                  "text-[28px] sm:text-[36px] lg:text-[48px] font-bold text-black font-inter mb-6"
                )}
              >
                Interactive Learning Adventures
              </h2>
              <p
                className={tw(
                  "text-[16px] sm:text-[18px] lg:text-[20px] text-black font-dm-sans max-w-3xl mb-10"
                )}
              >
                Join friends on money missions, manage your own virtual bank,
                and unlock real-world skills—one adventure at a time!
              </p>

              <div
                className={tw(
                  "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 w-full max-w-6xl"
                )}
              >
                {/* Box 1 */}
                <div
                  className={tw(
                    "bg-white rounded-2xl shadow-lg p-8 flex flex-col text-left relative w-[350px] h-[470px]"
                  )}
                >
                  <div
                    className={tw(
                      "absolute top-0 left-0 w-full h-2 bg-[#40E0D0] rounded-t-2xl"
                    )}
                  ></div>

                  <div className={tw("text-5xl mb-4 mt-12")}>💰</div>

                  <h3
                    className={tw(
                      "text-[24px] font-bold text-black font-inter mb-3"
                    )}
                  >
                    Virtual Bank
                  </h3>

                  <p
                    className={tw(
                      "text-[22px]/70 text-black font-dm-sans font-medium mb-8"
                    )}
                  >
                    Explore an interactive financial world with real-time
                    balance tracking and personalized accounts.
                  </p>
                </div>

                <div
                  className={tw(
                    "bg-white rounded-2xl shadow-lg p-8 flex flex-col text-left relative w-[350px] h-[470px]"
                  )}
                >
                  <div
                    className={tw(
                      "absolute top-0 left-0 w-full h-2 bg-[#40E0D0] rounded-t-2xl"
                    )}
                  ></div>

                  <div className={tw("text-5xl mb-4 mt-12")}>🛒</div>

                  <h3
                    className={tw(
                      "text-[24px] font-bold text-black font-inter mb-3"
                    )}
                  >
                    Money Missions
                  </h3>

                  <p
                    className={tw(
                      "text-[22px]/70 text-black font-dm-sans font-medium mb-8"
                    )}
                  >
                    Follow guides through exciting challenges with audio and
                    written instructions.
                  </p>
                </div>

                <div
                  className={tw(
                    "bg-white rounded-2xl shadow-lg p-8 flex flex-col text-left relative w-[350px] h-[470px]"
                  )}
                >
                  <div
                    className={tw(
                      "absolute top-0 left-0 w-full h-2 bg-[#40E0D0] rounded-t-2xl"
                    )}
                  ></div>

                  <div className={tw("text-5xl mb-4 mt-12")}>📈</div>

                  <h3
                    className={tw(
                      "text-[24px] font-bold text-black font-inter mb-3"
                    )}
                  >
                    Skill Building
                  </h3>

                  <p
                    className={tw(
                      "text-[22px]/70 text-black font-dm-sans font-medium mb-8"
                    )}
                  >
                    Master 75+ financial terms through engaging activities and
                    earn completion certificates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Features Section */}
      <section className={tw("py-20 bg-gray-50")}>
        <div className={tw("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8")}>
          <h2
            className={tw("text-4xl font-bold text-center text-gray-800 mb-12")}
          >
            Interactive Learning Adventures
          </h2>
          <div
            className={tw(
              "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            )}
          >
            <div
              className={tw(
                "bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100"
              )}
            >
              <div className={tw("text-5xl mb-4")}>🛡️</div>
              <h3 className={tw("text-xl font-bold text-gray-800 mb-3")}>
                Safety First
              </h3>
              <p className={tw("text-gray-600 leading-relaxed")}>
                Comprehensive parental monitoring system ensures children learn
                AI technology in a safe environment.
              </p>
            </div>
            <div
              className={tw(
                "bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100"
              )}
            >
              <div className={tw("text-5xl mb-4")}>🎮</div>
              <h3 className={tw("text-xl font-bold text-gray-800 mb-3")}>
                Interactive Learning
              </h3>
              <p className={tw("text-gray-600 leading-relaxed")}>
                Gamified approach makes it easy for children to understand
                complex AI concepts.
              </p>
            </div>
            <div
              className={tw(
                "bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100"
              )}
            >
              <div className={tw("text-5xl mb-4")}>👨‍👩‍👧‍👦</div>
              <h3 className={tw("text-xl font-bold text-gray-800 mb-3")}>
                Family Friendly
              </h3>
              <p className={tw("text-gray-600 leading-relaxed")}>
                Support multiple child profiles, parents can easily monitor each
                child's learning progress.
              </p>
            </div>
            <div
              className={tw(
                "bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100"
              )}
            >
              <div className={tw("text-5xl mb-4")}>🎯</div>
              <h3 className={tw("text-xl font-bold text-gray-800 mb-3")}>
                Personalized
              </h3>
              <p className={tw("text-gray-600 leading-relaxed")}>
                Customize learning content and difficulty based on child's age
                and interests.
              </p>
            </div>
            <div
              className={tw(
                "bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100"
              )}
            >
              <div className={tw("text-5xl mb-4")}>📱</div>
              <h3 className={tw("text-xl font-bold text-gray-800 mb-3")}>
                Cross-Platform
              </h3>
              <p className={tw("text-gray-600 leading-relaxed")}>
                Supports phones, tablets and computers, learn anytime, anywhere.
              </p>
            </div>
            <div
              className={tw(
                "bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100"
              )}
            >
              <div className={tw("text-5xl mb-4")}>🏆</div>
              <h3 className={tw("text-xl font-bold text-gray-800 mb-3")}>
                Achievement System
              </h3>
              <p className={tw("text-gray-600 leading-relaxed")}>
                Motivate children to continue learning and exploring through
                rewards and achievements.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section
        className={tw("py-20 bg-gradient-to-r from-accent-pink to-pink-300")}
      >
        <div
          className={tw("max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8")}
        >
          <h2 className={tw("text-4xl font-bold text-gray-800 mb-4")}>
            Ready to Start the AI Learning Journey?
          </h2>
          <p className={tw("text-xl text-gray-700 mb-8")}>
            Join thousands of families and let children explore the infinite
            possibilities of AI in a safe environment.
          </p>
          <Link
            to="/login"
            className={tw(
              "inline-block px-8 py-4 bg-gradient-to-r from-primary-turquoise to-primary-turquoise-dark text-white rounded-full font-semibold text-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            )}
          >
            Start Now
          </Link>
        </div>
      </section>
      {/* Footer */}
      <footer className={tw("bg-gray-800 text-white py-12")}>
        <div className={tw("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8")}>
          <div className={tw("grid grid-cols-1 md:grid-cols-4 gap-8 mb-8")}>
            <div>
              <h4 className={tw("text-lg font-bold mb-4")}>AiDIY</h4>
              <p className={tw("text-gray-400")}>
                AI learning platform designed for children
              </p>
            </div>
            <div>
              <h4
                className={tw("text-lg font-bold mb-4 text-primary-turquoise")}
              >
                Product
              </h4>
              <ul className={tw("space-y-2")}>
                <li>
                  <Link
                    to="/features"
                    className={tw(
                      "text-gray-400 hover:text-primary-turquoise transition-colors"
                    )}
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    to="/pricing"
                    className={tw(
                      "text-gray-400 hover:text-primary-turquoise transition-colors"
                    )}
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    to="/safety"
                    className={tw(
                      "text-gray-400 hover:text-primary-turquoise transition-colors"
                    )}
                  >
                    Safety
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4
                className={tw("text-lg font-bold mb-4 text-primary-turquoise")}
              >
                Support
              </h4>
              <ul className={tw("space-y-2")}>
                <li>
                  <Link
                    to="/help"
                    className={tw(
                      "text-gray-400 hover:text-primary-turquoise transition-colors"
                    )}
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className={tw(
                      "text-gray-400 hover:text-primary-turquoise transition-colors"
                    )}
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/faq"
                    className={tw(
                      "text-gray-400 hover:text-primary-turquoise transition-colors"
                    )}
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4
                className={tw("text-lg font-bold mb-4 text-primary-turquoise")}
              >
                Company
              </h4>
              <ul className={tw("space-y-2")}>
                <li>
                  <Link
                    to="/about"
                    className={tw(
                      "text-gray-400 hover:text-primary-turquoise transition-colors"
                    )}
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy"
                    className={tw(
                      "text-gray-400 hover:text-primary-turquoise transition-colors"
                    )}
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms"
                    className={tw(
                      "text-gray-400 hover:text-primary-turquoise transition-colors"
                    )}
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className={tw("border-t border-gray-700 pt-8 text-center")}>
            <p className={tw("text-gray-400")}>
              &copy; 2024 AiDIY. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
