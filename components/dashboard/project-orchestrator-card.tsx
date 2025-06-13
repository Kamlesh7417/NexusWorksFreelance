'use client';

import { useState } from 'react';

export function ProjectOrchestratorCard() {
  const [tasks] = useState([
    {
      id: "JIRA-123",
      name: "UI Wireframe Design",
      assignee: "Marcus Tan",
      status: "Completed"
    },
    {
      id: "JIRA-124", 
      name: "Backend API Integration",
      assignee: "You",
      status: "In Progress"
    },
    {
      id: "JIRA-125",
      name: "AI Prediction Module", 
      assignee: "Sofia Mendes",
      status: "Not Started"
    },
    {
      id: "JIRA-126",
      name: "User Testing",
      assignee: "Pending Allocation",
      status: "Pending"
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-400';
      case 'In Progress': return 'text-yellow-400';
      case 'Not Started': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="nexus-card">
      <h2>AI Project Orchestrator</h2>
      <p>Fully automated project management with real-time task allocation and dynamic pricing.</p>
      <ul>
        <li>Active Projects: 2</li>
        <li>Next Deadline: 3 Days</li>
        <li>AI Efficiency: 92%</li>
      </ul>
      <div className="bg-white/5 border border-cyan-500/30 rounded-lg p-4 mt-4">
        <div className="font-bold text-cyan-400 mb-3">Current Project: AI Healthcare Dashboard</div>
        <div className="max-h-[200px] overflow-y-auto">
          {tasks.map((task, index) => (
            <div key={index} className="bg-cyan-500/10 border border-cyan-500/20 p-3 mb-2 rounded-md text-sm flex justify-between">
              <span>Task {index + 1}: {task.name} ({task.id})</span>
              <span className={getStatusColor(task.status)}>
                Assigned: {task.assignee} ({task.status})
              </span>
            </div>
          ))}
        </div>
        <div className="text-yellow-400 text-center mt-3">
          Dynamic Pricing: $3,200 (Base: $2,800 + Urgency: $400)
        </div>
        <button className="nexus-action-btn mt-2">View Documentation</button>
      </div>
      <button className="nexus-action-btn">Manage Projects</button>
      <button className="nexus-action-btn ml-2">Refresh AI Allocation</button>
    </div>
  );
}