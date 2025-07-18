'use client';

import { useState } from 'react';
import { 
  Settings, 
  Grid3X3, 
  List, 
  Palette, 
  Bell, 
  Eye, 
  EyeOff,
  Save,
  RotateCcw,
  Monitor,
  Sun,
  Moon,
  Layout,
  X,
  Plus,
  Minus,
  Move,
  Check
} from 'lucide-react';
import { useDashboardSettings } from './project-context';

interface DashboardCustomizationProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVAILABLE_WIDGETS = [
  { id: 'recent_projects', name: 'Recent Projects', description: 'Show your most recent projects' },
  { id: 'upcoming_deadlines', name: 'Upcoming Deadlines', description: 'Projects due soon' },
  { id: 'team_activity', name: 'Team Activity', description: 'Recent team member activities' },
  { id: 'budget_overview', name: 'Budget Overview', description: 'Financial summary' },
  { id: 'performance_metrics', name: 'Performance Metrics', description: 'Your performance stats' },
  { id: 'notifications', name: 'Notifications', description: 'Recent notifications' },
  { id: 'quick_actions', name: 'Quick Actions', description: 'Frequently used actions' },
  { id: 'project_progress', name: 'Project Progress', description: 'Overall progress tracking' },
  { id: 'skill_recommendations', name: 'Skill Recommendations', description: 'Suggested skills to learn' },
  { id: 'marketplace_highlights', name: 'Marketplace Highlights', description: 'Featured projects and developers' }
];

export function DashboardCustomization({ isOpen, onClose }: DashboardCustomizationProps) {
  const { settings, updateSettings } = useDashboardSettings();
  const [tempSettings, setTempSettings] = useState(settings);
  const [activeTab, setActiveTab] = useState<'layout' | 'widgets' | 'appearance'>('layout');

  if (!isOpen) return null;

  const handleSave = () => {
    updateSettings(tempSettings);
    onClose();
  };

  const handleReset = () => {
    const defaultSettings = {
      layout: 'grid' as const,
      theme: 'dark' as const,
      showNotifications: true,
      showQuickStats: true,
      defaultView: 'overview' as const,
      sidebarCollapsed: false,
      customWidgets: ['recent_projects', 'upcoming_deadlines', 'team_activity']
    };
    setTempSettings(defaultSettings);
  };

  const toggleWidget = (widgetId: string) => {
    const currentWidgets = tempSettings.customWidgets || [];
    const updatedWidgets = currentWidgets.includes(widgetId)
      ? currentWidgets.filter(id => id !== widgetId)
      : [...currentWidgets, widgetId];
    
    setTempSettings(prev => ({ ...prev, customWidgets: updatedWidgets }));
  };

  const moveWidget = (widgetId: string, direction: 'up' | 'down') => {
    const currentWidgets = [...(tempSettings.customWidgets || [])];
    const currentIndex = currentWidgets.indexOf(widgetId);
    
    if (direction === 'up' && currentIndex > 0) {
      [currentWidgets[currentIndex], currentWidgets[currentIndex - 1]] = 
      [currentWidgets[currentIndex - 1], currentWidgets[currentIndex]];
    } else if (direction === 'down' && currentIndex < currentWidgets.length - 1) {
      [currentWidgets[currentIndex], currentWidgets[currentIndex + 1]] = 
      [currentWidgets[currentIndex + 1], currentWidgets[currentIndex]];
    }
    
    setTempSettings(prev => ({ ...prev, customWidgets: currentWidgets }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900/95 backdrop-blur-lg border border-white/20 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Settings size={24} className="text-cyan-400" />
            <h2 className="text-xl font-semibold text-white">Dashboard Customization</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar */}
          <div className="w-64 border-r border-white/10 p-4">
            <div className="space-y-2">
              {[
                { id: 'layout', name: 'Layout', icon: Layout },
                { id: 'widgets', name: 'Widgets', icon: Grid3X3 },
                { id: 'appearance', name: 'Appearance', icon: Palette }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id 
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon size={18} />
                    {tab.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Layout Tab */}
            {activeTab === 'layout' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Layout Options</h3>
                  
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                      { id: 'grid', name: 'Grid', icon: Grid3X3, description: 'Card-based grid layout' },
                      { id: 'list', name: 'List', icon: List, description: 'Compact list view' },
                      { id: 'compact', name: 'Compact', icon: Layout, description: 'Dense information display' }
                    ].map(layout => {
                      const Icon = layout.icon;
                      return (
                        <button
                          key={layout.id}
                          onClick={() => setTempSettings(prev => ({ ...prev, layout: layout.id as any }))}
                          className={`p-4 rounded-lg border transition-all ${
                            tempSettings.layout === layout.id
                              ? 'border-cyan-500/40 bg-cyan-500/20 text-cyan-400'
                              : 'border-white/20 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <Icon size={24} className="mx-auto mb-2" />
                          <div className="font-medium">{layout.name}</div>
                          <div className="text-xs opacity-80 mt-1">{layout.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-semibold text-white mb-3">Default View</h4>
                  <select
                    value={tempSettings.defaultView}
                    onChange={(e) => setTempSettings(prev => ({ ...prev, defaultView: e.target.value as any }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="overview" className="bg-gray-900">Overview</option>
                    <option value="projects" className="bg-gray-900">Projects</option>
                    <option value="tasks" className="bg-gray-900">Tasks</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-white">Display Options</h4>
                  
                  <label className="flex items-center justify-between">
                    <div>
                      <span className="text-white">Show Quick Stats</span>
                      <div className="text-sm text-gray-400">Display summary statistics at the top</div>
                    </div>
                    <button
                      onClick={() => setTempSettings(prev => ({ ...prev, showQuickStats: !prev.showQuickStats }))}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        tempSettings.showQuickStats ? 'bg-cyan-500' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                        tempSettings.showQuickStats ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </label>

                  <label className="flex items-center justify-between">
                    <div>
                      <span className="text-white">Collapse Sidebar</span>
                      <div className="text-sm text-gray-400">Start with sidebar collapsed</div>
                    </div>
                    <button
                      onClick={() => setTempSettings(prev => ({ ...prev, sidebarCollapsed: !prev.sidebarCollapsed }))}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        tempSettings.sidebarCollapsed ? 'bg-cyan-500' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                        tempSettings.sidebarCollapsed ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </label>
                </div>
              </div>
            )}

            {/* Widgets Tab */}
            {activeTab === 'widgets' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Dashboard Widgets</h3>
                  <p className="text-gray-400 mb-4">Choose which widgets to display on your dashboard</p>
                </div>

                {/* Active Widgets */}
                <div>
                  <h4 className="text-md font-semibold text-white mb-3">Active Widgets</h4>
                  <div className="space-y-2">
                    {(tempSettings.customWidgets || []).map((widgetId, index) => {
                      const widget = AVAILABLE_WIDGETS.find(w => w.id === widgetId);
                      if (!widget) return null;
                      
                      return (
                        <div key={widgetId} className="flex items-center justify-between p-3 bg-white/5 border border-white/20 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => moveWidget(widgetId, 'up')}
                                disabled={index === 0}
                                className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <Plus size={12} className="rotate-45" />
                              </button>
                              <button
                                onClick={() => moveWidget(widgetId, 'down')}
                                disabled={index === (tempSettings.customWidgets || []).length - 1}
                                className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <Minus size={12} />
                              </button>
                            </div>
                            <Move size={16} className="text-gray-400" />
                            <div>
                              <div className="text-white font-medium">{widget.name}</div>
                              <div className="text-sm text-gray-400">{widget.description}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleWidget(widgetId)}
                            className="p-2 text-red-400 hover:text-red-300 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Available Widgets */}
                <div>
                  <h4 className="text-md font-semibold text-white mb-3">Available Widgets</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {AVAILABLE_WIDGETS.filter(widget => !(tempSettings.customWidgets || []).includes(widget.id)).map(widget => (
                      <div key={widget.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/20 rounded-lg">
                        <div>
                          <div className="text-white font-medium">{widget.name}</div>
                          <div className="text-sm text-gray-400">{widget.description}</div>
                        </div>
                        <button
                          onClick={() => toggleWidget(widget.id)}
                          className="p-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Appearance Settings</h3>
                </div>

                <div>
                  <h4 className="text-md font-semibold text-white mb-3">Theme</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: 'dark', name: 'Dark', icon: Moon, description: 'Dark theme' },
                      { id: 'light', name: 'Light', icon: Sun, description: 'Light theme' },
                      { id: 'auto', name: 'Auto', icon: Monitor, description: 'System preference' }
                    ].map(theme => {
                      const Icon = theme.icon;
                      return (
                        <button
                          key={theme.id}
                          onClick={() => setTempSettings(prev => ({ ...prev, theme: theme.id as any }))}
                          className={`p-4 rounded-lg border transition-all ${
                            tempSettings.theme === theme.id
                              ? 'border-cyan-500/40 bg-cyan-500/20 text-cyan-400'
                              : 'border-white/20 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <Icon size={24} className="mx-auto mb-2" />
                          <div className="font-medium">{theme.name}</div>
                          <div className="text-xs opacity-80 mt-1">{theme.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-white">Notifications</h4>
                  
                  <label className="flex items-center justify-between">
                    <div>
                      <span className="text-white">Show Notifications</span>
                      <div className="text-sm text-gray-400">Display notification badges and alerts</div>
                    </div>
                    <button
                      onClick={() => setTempSettings(prev => ({ ...prev, showNotifications: !prev.showNotifications }))}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        tempSettings.showNotifications ? 'bg-cyan-500' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                        tempSettings.showNotifications ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            <RotateCcw size={16} />
            Reset to Default
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200"
            >
              <Save size={16} />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}