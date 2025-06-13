export function AnalyticsCard() {
  const chartData = [60, 75, 85, 70, 90, 80];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

  return (
    <div className="nexus-card">
      <h2>Neural Analytics</h2>
      <p>Track skill growth, earnings, and market trends.</p>
      <div className="nexus-analytics-chart">
        <div className="nexus-chart-bars">
          {chartData.map((height, index) => (
            <div 
              key={index}
              className="nexus-bar" 
              style={{ height: `${height}%` }}
            ></div>
          ))}
        </div>
        <div className="nexus-chart-labels">
          {months.map((month, index) => (
            <span key={index}>{month}</span>
          ))}
        </div>
      </div>
      <div className="nexus-analytics-stats">
        <div className="nexus-stat-box">
          <div className="nexus-stat-number">$12,450</div>
          <div>Total Earnings</div>
        </div>
        <div className="nexus-stat-box">
          <div className="nexus-stat-number">87%</div>
          <div>Project Completion</div>
        </div>
        <div className="nexus-stat-box">
          <div className="nexus-stat-number">+18%</div>
          <div>Skill Growth</div>
        </div>
        <div className="nexus-stat-box">
          <div className="nexus-stat-number">Top 5%</div>
          <div>Quantum Demand</div>
        </div>
      </div>
      <div className="nexus-skill-tracker">
        {['Quantum', 'AI', 'Blockchain', 'Design', 'Leadership', 'Communication'].map((skill, index) => (
          <div key={index}>
            <div className="nexus-skill-bar">
              <div className="nexus-skill-progress" style={{ width: `${[85, 78, 92, 65, 88, 72][index]}%` }}></div>
            </div>
            <div className="nexus-skill-label">{skill}</div>
          </div>
        ))}
      </div>
      <button className="nexus-action-btn">View Insights</button>
    </div>
  );
}