import { QuantumAI } from './openai';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  reporter: string;
  storyPoints: number;
  labels: string[];
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  comments: TaskComment[];
  timeTracking: {
    estimated: number; // hours
    logged: number; // hours
    remaining: number; // hours
  };
  dependencies: string[]; // task IDs
  githubIssue?: {
    owner: string;
    repo: string;
    number: number;
  };
}

export interface TaskComment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  owner: string;
  team: string[];
  budget: {
    allocated: number;
    spent: number;
    currency: string;
  };
  timeline: {
    startDate: string;
    endDate: string;
    milestones: Milestone[];
  };
  tasks: Task[];
  githubRepo?: {
    owner: string;
    repo: string;
    url: string;
  };
  sla: {
    responseTime: number; // hours
    resolutionTime: number; // hours
    uptime: number; // percentage
  };
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  tasks: string[]; // task IDs
  completionPercentage: number;
}

export interface FreelancerProfile {
  id: string;
  name: string;
  email: string;
  skills: string[];
  hourlyRate: number;
  availability: 'available' | 'busy' | 'unavailable';
  rating: number;
  completedProjects: number;
  specializations: string[];
  location: string;
  timezone: string;
}

export interface ProjectMatch {
  freelancer: FreelancerProfile;
  score: number;
  reasoning: string;
  skillMatch: number;
  availabilityMatch: number;
  budgetMatch: number;
  locationMatch: number;
}

export class ProjectManager {
  static async createProject(projectData: Partial<Project>): Promise<Project> {
    const project: Project = {
      id: `proj_${Date.now()}`,
      name: projectData.name || 'Untitled Project',
      description: projectData.description || '',
      status: 'planning',
      owner: projectData.owner || 'current_user',
      team: projectData.team || [],
      budget: projectData.budget || { allocated: 0, spent: 0, currency: 'USD' },
      timeline: projectData.timeline || {
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        milestones: []
      },
      tasks: [],
      sla: projectData.sla || { responseTime: 24, resolutionTime: 72, uptime: 99.9 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...projectData
    };

    // Generate initial tasks using AI
    if (project.description) {
      const analysis = await QuantumAI.analyzeProject(project.description);
      project.tasks = analysis.jiraStories.map(story => this.createTaskFromStory(story, project.id));
      
      // Create milestones based on tasks
      project.timeline.milestones = this.generateMilestones(project.tasks);
    }

    return project;
  }

  static createTaskFromStory(story: any, projectId: string): Task {
    return {
      id: `${projectId}_${story.id}`,
      title: story.title,
      description: story.description,
      status: 'todo',
      priority: story.priority,
      reporter: 'ai_system',
      storyPoints: story.storyPoints,
      labels: story.acceptanceCriteria || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: [],
      timeTracking: {
        estimated: story.storyPoints * 4, // 4 hours per story point
        logged: 0,
        remaining: story.storyPoints * 4
      },
      dependencies: []
    };
  }

  static generateMilestones(tasks: Task[]): Milestone[] {
    const milestones: Milestone[] = [];
    const taskGroups = this.groupTasksByPriority(tasks);

    Object.entries(taskGroups).forEach(([priority, groupTasks], index) => {
      const milestone: Milestone = {
        id: `milestone_${index + 1}`,
        name: `${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority Tasks`,
        description: `Complete all ${priority} priority tasks`,
        dueDate: new Date(Date.now() + (index + 1) * 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        tasks: groupTasks.map(t => t.id),
        completionPercentage: 0
      };
      milestones.push(milestone);
    });

    return milestones;
  }

  static groupTasksByPriority(tasks: Task[]): Record<string, Task[]> {
    return tasks.reduce((groups, task) => {
      const priority = task.priority;
      if (!groups[priority]) groups[priority] = [];
      groups[priority].push(task);
      return groups;
    }, {} as Record<string, Task[]>);
  }

  static calculateDynamicPricing(project: Project, urgency: number = 50): number {
    const basePrice = project.tasks.reduce((sum, task) => sum + (task.storyPoints * 100), 0);
    const complexityFactor = this.calculateComplexity(project);
    const urgencyMultiplier = 1 + (urgency / 100);
    const teamSizeMultiplier = 1 + (project.team.length * 0.1);
    
    return Math.round(basePrice * complexityFactor * urgencyMultiplier * teamSizeMultiplier);
  }

  static calculateComplexity(project: Project): number {
    const taskComplexity = project.tasks.reduce((sum, task) => {
      const priorityWeight = { low: 1, medium: 1.5, high: 2, critical: 3 };
      return sum + (task.storyPoints * priorityWeight[task.priority]);
    }, 0);

    const avgComplexity = taskComplexity / Math.max(project.tasks.length, 1);
    return Math.min(Math.max(avgComplexity / 10, 1), 3); // Scale between 1-3
  }

  static async matchFreelancers(project: Project, freelancers: FreelancerProfile[]): Promise<ProjectMatch[]> {
    const requiredSkills = this.extractRequiredSkills(project);
    const budget = project.budget.allocated;
    
    const matches = freelancers.map(freelancer => {
      const skillMatch = this.calculateSkillMatch(requiredSkills, freelancer.skills);
      const availabilityMatch = freelancer.availability === 'available' ? 100 : 
                               freelancer.availability === 'busy' ? 50 : 0;
      const budgetMatch = this.calculateBudgetMatch(budget, freelancer.hourlyRate, project.tasks);
      const locationMatch = 80; // Assume remote work compatibility
      
      const score = (skillMatch * 0.4) + (availabilityMatch * 0.3) + (budgetMatch * 0.2) + (locationMatch * 0.1);
      
      return {
        freelancer,
        score: Math.round(score),
        reasoning: this.generateMatchReasoning(skillMatch, availabilityMatch, budgetMatch),
        skillMatch,
        availabilityMatch,
        budgetMatch,
        locationMatch
      };
    });

    return matches.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  static extractRequiredSkills(project: Project): string[] {
    const skills = new Set<string>();
    
    // Extract from task labels and descriptions
    project.tasks.forEach(task => {
      task.labels.forEach(label => skills.add(label));
      
      // Simple keyword extraction
      const keywords = ['react', 'node', 'python', 'javascript', 'typescript', 'ai', 'ml', 'blockchain'];
      keywords.forEach(keyword => {
        if (task.description.toLowerCase().includes(keyword)) {
          skills.add(keyword);
        }
      });
    });

    return Array.from(skills);
  }

  static calculateSkillMatch(required: string[], freelancerSkills: string[]): number {
    if (required.length === 0) return 100;
    
    const matches = required.filter(skill => 
      freelancerSkills.some(fSkill => 
        fSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(fSkill.toLowerCase())
      )
    );
    
    return Math.round((matches.length / required.length) * 100);
  }

  static calculateBudgetMatch(projectBudget: number, hourlyRate: number, tasks: Task[]): number {
    const estimatedHours = tasks.reduce((sum, task) => sum + task.timeTracking.estimated, 0);
    const estimatedCost = hourlyRate * estimatedHours;
    
    if (estimatedCost <= projectBudget) return 100;
    if (estimatedCost <= projectBudget * 1.2) return 80;
    if (estimatedCost <= projectBudget * 1.5) return 60;
    return 30;
  }

  static generateMatchReasoning(skillMatch: number, availabilityMatch: number, budgetMatch: number): string {
    const reasons = [];
    
    if (skillMatch >= 80) reasons.push("excellent skill alignment");
    else if (skillMatch >= 60) reasons.push("good skill match");
    else reasons.push("partial skill overlap");
    
    if (availabilityMatch === 100) reasons.push("immediately available");
    else if (availabilityMatch === 50) reasons.push("limited availability");
    else reasons.push("currently unavailable");
    
    if (budgetMatch >= 80) reasons.push("within budget");
    else if (budgetMatch >= 60) reasons.push("slightly over budget");
    else reasons.push("budget concerns");
    
    return reasons.join(", ");
  }

  static calculateProjectProgress(project: Project): number {
    if (project.tasks.length === 0) return 0;
    
    const completedTasks = project.tasks.filter(task => task.status === 'done').length;
    return Math.round((completedTasks / project.tasks.length) * 100);
  }

  static estimateProjectTimeline(project: Project): { estimatedDays: number; criticalPath: string[] } {
    const totalHours = project.tasks.reduce((sum, task) => sum + task.timeTracking.estimated, 0);
    const estimatedDays = Math.ceil(totalHours / 8); // 8 hours per day
    
    // Simple critical path calculation (tasks with dependencies)
    const criticalPath = project.tasks
      .filter(task => task.dependencies.length > 0 || task.priority === 'critical')
      .map(task => task.id);
    
    return { estimatedDays, criticalPath };
  }

  static generateSLAReport(project: Project): {
    responseTimeCompliance: number;
    resolutionTimeCompliance: number;
    overdueTasks: number;
    riskLevel: 'low' | 'medium' | 'high';
  } {
    const now = new Date();
    const overdueTasks = project.tasks.filter(task => {
      if (!task.dueDate) return false;
      return new Date(task.dueDate) < now && task.status !== 'done';
    }).length;

    const responseTimeCompliance = Math.max(0, 100 - (overdueTasks * 10));
    const resolutionTimeCompliance = Math.max(0, 100 - (overdueTasks * 15));
    
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (overdueTasks > 5) riskLevel = 'high';
    else if (overdueTasks > 2) riskLevel = 'medium';

    return {
      responseTimeCompliance,
      resolutionTimeCompliance,
      overdueTasks,
      riskLevel
    };
  }
}