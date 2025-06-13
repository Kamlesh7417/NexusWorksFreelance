export function LearningCard() {
  return (
    <div className="nexus-card">
      <h2>Learning & Shadowing Hub</h2>
      <p>AI-generated learning paths based on market demand.</p>
      <ul>
        <li>Current Path: Quantum Programming</li>
        <li>Progress: 62%</li>
        <li>Shadowing Slots: 3 Available</li>
      </ul>
      <div className="w-full h-[200px] bg-gradient-to-r from-green-600 to-teal-500 mt-4 rounded-lg relative transform rotate-x-15 animate-pulse shadow-lg shadow-green-600/50 flex items-center justify-center">
        <span className="text-white text-xl text-center">
          Quantum Coding Sandbox<br />[Holographic Environment]
        </span>
        <div className="nexus-project-controls">
          <button className="nexus-project-btn">Start Coding</button>
          <button className="nexus-project-btn">Test Algorithm</button>
        </div>
      </div>
      <button className="nexus-action-btn">Start Learning</button>
      <button className="nexus-action-btn ml-2">Join Shadowing</button>
    </div>
  );
}