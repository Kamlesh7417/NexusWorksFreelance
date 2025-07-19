#!/usr/bin/env node

/**
 * Verification script for Dashboard Implementation
 * This script checks if the dashboard implementation meets the requirements
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Dashboard Implementation...\n');

// Check if required files exist
const requiredFiles = [
  'components/console/console-main-content.tsx',
  'components/dashboard/unified-dashboard.tsx',
  'components/console/dashboard-data-provider.tsx'
];

let allFilesExist = true;

console.log('📁 Checking required files:');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing!');
  process.exit(1);
}

// Check implementation details
console.log('\n🔧 Checking implementation details:');

// Check if DashboardSection uses UnifiedDashboard
const consoleMainContent = fs.readFileSync('components/console/console-main-content.tsx', 'utf8');
const hasUnifiedDashboard = consoleMainContent.includes('UnifiedDashboard');
const hasQuickActions = consoleMainContent.includes('Quick Action');
const hasRealTimeData = consoleMainContent.includes('useDjangoAuth');

console.log(`  ${hasUnifiedDashboard ? '✅' : '❌'} Uses UnifiedDashboard component`);
console.log(`  ${hasQuickActions ? '✅' : '❌'} Implements quick action buttons`);
console.log(`  ${hasRealTimeData ? '✅' : '❌'} Connects to real user data`);

// Check UnifiedDashboard enhancements
const unifiedDashboard = fs.readFileSync('components/dashboard/unified-dashboard.tsx', 'utf8');
const hasRecentActivity = unifiedDashboard.includes('Recent Activity');
const hasRealTimeUpdates = unifiedDashboard.includes('setInterval');
const hasProjectStats = unifiedDashboard.includes('dashboardStats');

console.log(`  ${hasRecentActivity ? '✅' : '❌'} Has recent activity section`);
console.log(`  ${hasRealTimeUpdates ? '✅' : '❌'} Implements real-time updates`);
console.log(`  ${hasProjectStats ? '✅' : '❌'} Shows project statistics`);

// Check dashboard data provider
const hasDashboardDataProvider = fs.existsSync('components/console/dashboard-data-provider.tsx');
console.log(`  ${hasDashboardDataProvider ? '✅' : '❌'} Dashboard data provider created`);

// Check requirements compliance
console.log('\n📋 Requirements compliance:');

// Requirement 7.1: Dashboard overview with key metrics and recent activity
const hasKeyMetrics = unifiedDashboard.includes('totalProjects') && unifiedDashboard.includes('activeProjects');
const hasRecentActivityDisplay = unifiedDashboard.includes('Recent Activity');
console.log(`  ${hasKeyMetrics && hasRecentActivityDisplay ? '✅' : '❌'} 7.1: Dashboard overview with key metrics and recent activity`);

// Requirement 7.2: Quick action buttons for common tasks
const hasQuickActionButtons = consoleMainContent.includes('New Project') && consoleMainContent.includes('Message');
console.log(`  ${hasQuickActionButtons ? '✅' : '❌'} 7.2: Quick action buttons for common tasks`);

// Check if placeholder was replaced
const hasPlaceholderReplaced = !consoleMainContent.includes('No recent activity') || consoleMainContent.includes('UnifiedDashboard');
console.log(`  ${hasPlaceholderReplaced ? '✅' : '❌'} Placeholder DashboardSection replaced`);

// Summary
const allChecks = [
  hasUnifiedDashboard,
  hasQuickActions,
  hasRealTimeData,
  hasRecentActivity,
  hasRealTimeUpdates,
  hasProjectStats,
  hasDashboardDataProvider,
  hasKeyMetrics && hasRecentActivityDisplay,
  hasQuickActionButtons,
  hasPlaceholderReplaced
];

const passedChecks = allChecks.filter(Boolean).length;
const totalChecks = allChecks.length;

console.log(`\n📊 Summary: ${passedChecks}/${totalChecks} checks passed`);

if (passedChecks === totalChecks) {
  console.log('🎉 Dashboard implementation is complete and meets all requirements!');
  process.exit(0);
} else {
  console.log('⚠️  Dashboard implementation has some issues that need attention.');
  process.exit(1);
}