import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { tw } from '@twind/core';

const HomePage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className={tw('min-h-screen')}>
      {/* Navigation */}
      <nav className={tw('fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-100 z-50')}>
        <div className={tw('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8')}>
          <div className={tw('flex items-center justify-between h-20')}>
            <Link to="/" className={tw('flex items-center space-x-2')}>
              <span className={tw('text-3xl')}>🎯</span>
              <span className={tw('text-2xl font-bold text-gray-800')}>AIDIY</span>
            </Link>
            
            <div className={tw(`md:flex items-center space-x-8 ${isMenuOpen ? 'flex' : 'hidden'}`)}>
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
            </div>
            
            <button onClick={toggleMenu} className={tw('md:hidden')}>
              <div className={tw('space-y-1.5')}>
                <span className={tw('block w-6 h-0.5 bg-gray-800')}></span>
                <span className={tw('block w-6 h-0.5 bg-gray-800')}></span>
                <span className={tw('block w-6 h-0.5 bg-gray-800')}></span>
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={tw('pt-32 pb-20 bg-gradient-to-br from-primary-turquoise to-primary-turquoise-dark overflow-hidden')}>
        <div className={tw('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8')}>
          <div className={tw('grid grid-cols-1 lg:grid-cols-2 gap-12 items-center')}>
            <div className={tw('text-white')}>
              <h1 className={tw('text-5xl lg:text-6xl font-bold leading-tight mb-6')}>
                Let Kids Explore <span className={tw('text-accent-pink')}>AI</span> in a 
                <br />
                <span className={tw('text-accent-pink')}>Safe</span> Environment
              </h1>
              <p className={tw('text-xl opacity-90 mb-8 leading-relaxed')}>
                AIDIY is an AI learning platform designed for children, allowing them to safely 
                learn and explore artificial intelligence through interactive experiences and parental monitoring.
              </p>
              <div className={tw('flex flex-col sm:flex-row gap-4')}>
                <Link to="/login" className={tw('px-8 py-4 bg-white text-primary-turquoise rounded-full font-semibold text-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-center')}>
                  Get Started
                </Link>
                <Link to="/features" className={tw('px-8 py-4 bg-transparent border-2 border-white text-white rounded-full font-semibold text-lg hover:bg-white hover:text-primary-turquoise transition-all duration-300 text-center')}>
                  Learn More
                </Link>
              </div>
            </div>
            <div className={tw('relative h-96 lg:h-[500px]')}>
              <div className={tw('absolute inset-0 flex items-center justify-center')}>
                <div className={tw('text-6xl absolute top-10 left-20 animate-float')}>🤖</div>
                <div className={tw('text-6xl absolute top-32 right-10 animate-float')} style={{ animationDelay: '1s' }}>🎨</div>
                <div className={tw('text-6xl absolute bottom-32 left-10 animate-float')} style={{ animationDelay: '2s' }}>🧠</div>
                <div className={tw('text-5xl absolute top-60 right-32 animate-float')} style={{ animationDelay: '3s' }}>⭐</div>
                <div className={tw('text-6xl absolute bottom-10 right-20 animate-float')} style={{ animationDelay: '4s' }}>🚀</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={tw('py-20 bg-gray-50')}>
        <div className={tw('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8')}>
          <h2 className={tw('text-4xl font-bold text-center text-gray-800 mb-12')}>Why Choose AIDIY?</h2>
          <div className={tw('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8')}>
            <div className={tw('bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100')}>
              <div className={tw('text-5xl mb-4')}>🛡️</div>
              <h3 className={tw('text-xl font-bold text-gray-800 mb-3')}>Safety First</h3>
              <p className={tw('text-gray-600 leading-relaxed')}>Comprehensive parental monitoring system ensures children learn AI technology in a safe environment.</p>
            </div>
            <div className={tw('bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100')}>
              <div className={tw('text-5xl mb-4')}>🎮</div>
              <h3 className={tw('text-xl font-bold text-gray-800 mb-3')}>Interactive Learning</h3>
              <p className={tw('text-gray-600 leading-relaxed')}>Gamified approach makes it easy for children to understand complex AI concepts.</p>
            </div>
            <div className={tw('bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100')}>
              <div className={tw('text-5xl mb-4')}>👨‍👩‍👧‍👦</div>
              <h3 className={tw('text-xl font-bold text-gray-800 mb-3')}>Family Friendly</h3>
              <p className={tw('text-gray-600 leading-relaxed')}>Support multiple child profiles, parents can easily monitor each child's learning progress.</p>
            </div>
            <div className={tw('bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100')}>
              <div className={tw('text-5xl mb-4')}>🎯</div>
              <h3 className={tw('text-xl font-bold text-gray-800 mb-3')}>Personalized</h3>
              <p className={tw('text-gray-600 leading-relaxed')}>Customize learning content and difficulty based on child's age and interests.</p>
            </div>
            <div className={tw('bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100')}>
              <div className={tw('text-5xl mb-4')}>📱</div>
              <h3 className={tw('text-xl font-bold text-gray-800 mb-3')}>Cross-Platform</h3>
              <p className={tw('text-gray-600 leading-relaxed')}>Supports phones, tablets and computers, learn anytime, anywhere.</p>
            </div>
            <div className={tw('bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100')}>
              <div className={tw('text-5xl mb-4')}>🏆</div>
              <h3 className={tw('text-xl font-bold text-gray-800 mb-3')}>Achievement System</h3>
              <p className={tw('text-gray-600 leading-relaxed')}>Motivate children to continue learning and exploring through rewards and achievements.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={tw('py-20 bg-gradient-to-r from-accent-pink to-pink-300')}>
        <div className={tw('max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8')}>
          <h2 className={tw('text-4xl font-bold text-gray-800 mb-4')}>Ready to Start the AI Learning Journey?</h2>
          <p className={tw('text-xl text-gray-700 mb-8')}>Join thousands of families and let children explore the infinite possibilities of AI in a safe environment.</p>
          <Link to="/login" className={tw('inline-block px-8 py-4 bg-gradient-to-r from-primary-turquoise to-primary-turquoise-dark text-white rounded-full font-semibold text-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300')}>
            Start Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={tw('bg-gray-800 text-white py-12')}>
        <div className={tw('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8')}>
          <div className={tw('grid grid-cols-1 md:grid-cols-4 gap-8 mb-8')}>
            <div>
              <h4 className={tw('text-lg font-bold mb-4')}>AIDIY</h4>
              <p className={tw('text-gray-400')}>AI learning platform designed for children</p>
            </div>
            <div>
              <h4 className={tw('text-lg font-bold mb-4 text-primary-turquoise')}>Product</h4>
              <ul className={tw('space-y-2')}>
                <li><Link to="/features" className={tw('text-gray-400 hover:text-primary-turquoise transition-colors')}>Features</Link></li>
                <li><Link to="/pricing" className={tw('text-gray-400 hover:text-primary-turquoise transition-colors')}>Pricing</Link></li>
                <li><Link to="/safety" className={tw('text-gray-400 hover:text-primary-turquoise transition-colors')}>Safety</Link></li>
              </ul>
            </div>
            <div>
              <h4 className={tw('text-lg font-bold mb-4 text-primary-turquoise')}>Support</h4>
              <ul className={tw('space-y-2')}>
                <li><Link to="/help" className={tw('text-gray-400 hover:text-primary-turquoise transition-colors')}>Help Center</Link></li>
                <li><Link to="/contact" className={tw('text-gray-400 hover:text-primary-turquoise transition-colors')}>Contact Us</Link></li>
                <li><Link to="/faq" className={tw('text-gray-400 hover:text-primary-turquoise transition-colors')}>FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className={tw('text-lg font-bold mb-4 text-primary-turquoise')}>Company</h4>
              <ul className={tw('space-y-2')}>
                <li><Link to="/about" className={tw('text-gray-400 hover:text-primary-turquoise transition-colors')}>About Us</Link></li>
                <li><Link to="/privacy" className={tw('text-gray-400 hover:text-primary-turquoise transition-colors')}>Privacy Policy</Link></li>
                <li><Link to="/terms" className={tw('text-gray-400 hover:text-primary-turquoise transition-colors')}>Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className={tw('border-t border-gray-700 pt-8 text-center')}>
            <p className={tw('text-gray-400')}>&copy; 2024 AIDIY. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage; 