export function NotificationsCard() {
  const notifications = [
    {
      title: "Project Update",
      message: 'Your bid for "AI Healthcare Dashboard" was accepted. Start date: Oct 10.',
      time: "Today, 9:45 AM"
    },
    {
      title: "AI Mentor Tip",
      message: "Your skill in Quantum Programming is trending. Explore 3 new projects in the marketplace.",
      time: "Yesterday, 3:20 PM"
    },
    {
      title: "Community Alert",
      message: "AI Innovation Hackathon tomorrow. Join Team QuantumCoders?",
      time: "Yesterday, 11:10 AM"
    },
    {
      title: "Token Earnings",
      message: "You've earned 200 WORK tokens for completing a learning module.",
      time: "Oct 8, 5:30 PM"
    },
    {
      title: "Profile Feedback",
      message: 'Sofia Mendes left a 5-star rating: "Excellent collaboration on AI project!"',
      time: "Oct 7, 2:15 PM"
    }
  ];

  return (
    <div className="nexus-card">
      <h2>Notifications Center</h2>
      <p>Stay updated with project alerts and community messages.</p>
      <div className="max-h-[300px] overflow-y-auto mt-4">
        {notifications.map((notification, index) => (
          <div key={index} className="bg-white/5 border border-cyan-500/20 p-3 mb-2 rounded-lg hover:bg-white/10 transition-colors">
            <div className="text-cyan-400 font-semibold mb-1">{notification.title}</div>
            <div className="text-sm mb-1">{notification.message}</div>
            <div className="text-xs opacity-70">{notification.time}</div>
          </div>
        ))}
      </div>
      <button className="nexus-action-btn">View All</button>
    </div>
  );
}