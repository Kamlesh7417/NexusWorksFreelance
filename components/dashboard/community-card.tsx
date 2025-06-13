export function CommunityCard() {
  const events = [
    {
      title: "AI Innovation Hackathon",
      desc: "Oct 15 | Online Metaverse | Prize: 2,000 WORK"
    },
    {
      title: "Quantum Security Workshop", 
      desc: "Oct 22 | Hybrid (NYC + Virtual) | Free Entry"
    },
    {
      title: "Sustainable Tech Challenge",
      desc: "Nov 5 | Online | Prize: 5,000 WORK"
    }
  ];

  return (
    <div className="nexus-card">
      <h2>Community & Impact</h2>
      <p>Join global events in metaverse spaces.</p>
      <ul>
        <li>Upcoming Events: 5</li>
        <li>Your Impact Score: 780</li>
        <li>SDG Contributions: 3 Goals</li>
      </ul>
      <div className="w-full h-[200px] bg-gradient-to-r from-purple-600 to-blue-500 mt-4 rounded-lg relative flex items-center justify-center">
        <div className="w-[150px] h-[150px] rounded-full bg-black/30 border-4 border-cyan-500/50 flex items-center justify-center animate-spin" style={{ animationDuration: '10s' }}>
          <div className="text-white text-xl text-center">Enter Metaverse</div>
        </div>
        <div className="absolute bottom-2 w-[90%] bg-black/50 border border-cyan-500/30 rounded-lg p-2 text-xs">
          <div className="flex justify-between mb-1">
            <span>1. QuantumCoders</span>
            <span>12,450 pts</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>2. DataWizards</span>
            <span>11,980 pts</span>
          </div>
          <div className="flex justify-between">
            <span>3. Design Innovators</span>
            <span>10,750 pts</span>
          </div>
        </div>
      </div>
      <div className="max-h-[150px] overflow-y-auto mt-4">
        {events.map((event, index) => (
          <div key={index} className="bg-white/5 border border-cyan-500/20 p-2 mb-2 rounded-lg">
            <div className="text-cyan-400 text-sm font-semibold">{event.title}</div>
            <div className="text-xs">{event.desc}</div>
          </div>
        ))}
      </div>
      <div className="nexus-progress-container mt-4">
        <div className="nexus-progress-label">
          <span>Sustainability</span>
          <span>78%</span>
        </div>
        <div className="nexus-progress-bar">
          <div className="nexus-progress" style={{ width: '78%' }}></div>
        </div>
        <div className="nexus-progress-label mt-2">
          <span>Education</span>
          <span>65%</span>
        </div>
        <div className="nexus-progress-bar">
          <div className="nexus-progress" style={{ width: '65%' }}></div>
        </div>
      </div>
      <button className="nexus-action-btn">Join Events</button>
      <button className="nexus-action-btn ml-2">RSVP Hackathon</button>
    </div>
  );
}