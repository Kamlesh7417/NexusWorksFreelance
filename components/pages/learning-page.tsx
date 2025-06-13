'use client';

import { PageType } from '@/app/page';

interface LearningPageProps {
  onPageChange: (page: PageType) => void;
}

export function LearningPage({ onPageChange }: LearningPageProps) {
  return (
    <div>
      <div className="nexus-welcome-section">
        <h1>Learning & Shadowing Hub</h1>
        <p>Upskill with personalized learning paths and real-world shadowing opportunities.</p>
        <button 
          className="nexus-back-btn" 
          onClick={() => onPageChange('dashboard')}
        >
          Back to Dashboard
        </button>
      </div>

      <div className="nexus-dashboard">
        {/* Personalized Learning Paths */}
        <div className="nexus-card">
          <h2>Personalized Learning Paths</h2>
          <p>AI-curated courses based on your skills and market demand.</p>
          <ul>
            <li>Current Path: Quantum Programming</li>
            <li>Progress: 62%</li>
            <li>Recommended Modules: 5</li>
          </ul>
          <div className="nexus-hologram mt-4">
            Quantum Coding Sandbox<br />[Holographic Environment]
            <div className="nexus-project-controls">
              <button className="nexus-project-btn">Start Coding</button>
              <button className="nexus-project-btn">Test Algorithm</button>
            </div>
          </div>
          <button className="nexus-action-btn">Enroll in Course</button>
        </div>

        {/* Shadowing Opportunities */}
        <div className="nexus-card">
          <h2>Shadowing Opportunities</h2>
          <p>Join professionals in real-time to learn by doing.</p>
          <ul>
            <li>Available Slots: 3 Today</li>
            <li>Earnings Potential: 50-100 WORK per Session</li>
            <li>Active Mentors: 12</li>
          </ul>
          <div className="w-full h-[250px] bg-white/5 border border-cyan-500/30 rounded-lg mt-4 flex flex-col overflow-hidden">
            <div className="bg-cyan-500/20 p-2 text-center text-sm">
              Live Shadowing: Quantum Engineer in Zurich
            </div>
            <div className="flex flex-1 p-2">
              <div className="flex-1 bg-white/5 rounded-lg mr-2 flex items-center justify-center text-sm">
                Mentor's Workspace<br />[Live View]
              </div>
              <div className="flex-1 bg-white/5 rounded-lg p-2 font-mono text-xs overflow-auto">
                {`// Quantum algorithm simulation
function quantumSort(arr) {
  // Entanglement-based sorting
  qubits.entangle(arr);
  return qubits.measure();
}`}
              </div>
            </div>
            <div className="flex justify-center gap-2 p-2">
              <button className="nexus-project-btn">Ask Question</button>
              <button className="nexus-project-btn">Suggest Improvement</button>
            </div>
          </div>
          <button className="nexus-action-btn">Join Session</button>
        </div>

        {/* Learning Progress */}
        <div className="nexus-card">
          <h2>Learning Progress</h2>
          <p>Track your growth across enrolled courses and shadowing sessions.</p>
          <div className="nexus-progress-container mt-2">
            <div className="nexus-progress-label">
              <span>Quantum Programming</span>
              <span>62%</span>
            </div>
            <div className="nexus-progress-bar">
              <div className="nexus-progress" style={{ width: '62%' }}></div>
            </div>
            <div className="nexus-progress-label mt-2">
              <span>AI Development</span>
              <span>45%</span>
            </div>
            <div className="nexus-progress-bar">
              <div className="nexus-progress" style={{ width: '45%' }}></div>
            </div>
            <div className="nexus-progress-label mt-2">
              <span>Web Design Basics</span>
              <span>88%</span>
            </div>
            <div className="nexus-progress-bar">
              <div className="nexus-progress" style={{ width: '88%' }}></div>
            </div>
          </div>
          <button className="nexus-action-btn">View Certificates</button>
        </div>

        {/* Recommended Resources */}
        <div className="nexus-card">
          <h2>Recommended Resources</h2>
          <p>AI-selected resources to boost your learning journey.</p>
          <div className="max-h-[300px] overflow-y-auto mt-4">
            {[
              {
                title: "Quantum Computing Whitepaper",
                desc: "Format: PDF | Topic: Quantum Algorithms | Source: TechFuture Institute"
              },
              {
                title: "AI Ethics Webinar Replay",
                desc: "Format: Video | Duration: 1 hr | Source: Global AI Summit"
              },
              {
                title: "AR/VR Design Toolkit",
                desc: "Format: Downloadable Assets | Topic: Design | Source: CreativeVR Hub"
              }
            ].map((resource, index) => (
              <div key={index} className="bg-white/5 border border-cyan-500/20 p-3 mb-2 rounded-lg">
                <div className="text-cyan-400 font-semibold mb-1">{resource.title}</div>
                <div className="text-sm opacity-80">{resource.desc}</div>
              </div>
            ))}
          </div>
          <button className="nexus-action-btn">Access Resources</button>
        </div>
      </div>
    </div>
  );
}