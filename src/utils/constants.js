// src/utils/constants.js - Fixed with separate time blocks for tasks

import { Building2, Users, Calendar, ClipboardList, Settings, BookOpen, UserCheck, Clock } from 'lucide-react';

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  COACH: 'coach',
  SCHEDULER: 'scheduler',
  CLIENT: 'client'
};

// Coach type definitions
export const COACH_TYPES = {
  SUCCESS: 'success',
  GRACE: 'grace'
};

// Program definitions
export const PROGRAMS = {
  LIMITLESS: 'limitless',
  NEW_OPTIONS: 'new-options', 
  BRIDGES: 'bridges',
  GRACE: 'grace'
};

// EXISTING: Time slots for coaching sessions (2-hour blocks)
export const TIME_SLOTS = [
  { id: '8-10', label: '8:00 AM - 10:00 AM PST', start: '8:00 AM PST', end: '10:00 AM PST' },
  { id: '10-12', label: '10:00 AM - 12:00 PM PST', start: '10:00 AM PST', end: '12:00 PM PST' },
  { id: '1230-230', label: '12:30 PM - 2:30 PM PST', start: '12:30 PM PST', end: '2:30 PM PST' }
];

// NEW: Time blocks for task scheduling (30-minute blocks)
export const TIME_BLOCKS = [
  { id: '800', label: '8:00 AM', time: '8:00' },
  { id: '830', label: '8:30 AM', time: '8:30' },
  { id: '900', label: '9:00 AM', time: '9:00' },
  { id: '930', label: '9:30 AM', time: '9:30' },
  { id: '1000', label: '10:00 AM', time: '10:00' },
  { id: '1030', label: '10:30 AM', time: '10:30' },
  { id: '1100', label: '11:00 AM', time: '11:00' },
  { id: '1130', label: '11:30 AM', time: '11:30' },
  { id: '1200', label: '12:00 PM', time: '12:00' },
  { id: '1230', label: '12:30 PM', time: '12:30' },
  { id: '1300', label: '1:00 PM', time: '1:00' },
  { id: '1330', label: '1:30 PM', time: '1:30' },
  { id: '1400', label: '2:00 PM', time: '2:00' },
  { id: '1430', label: '2:30 PM', time: '2:30' }
];

// Business types for Limitless program
export const BUSINESS_TYPES = [
  'Custom Mug Designer',
  'Custom Product Creator', 
  'Clothing Designer',
  'Custom Clothing Designer',
  'eBay Reseller',
  'Vending Machine Business Owner',
  'Other'
];

// Equipment options for business operations
export const EQUIPMENT_OPTIONS = [
  'Heat Press',
  'Embroidery Machine', 
  'Mug Heat Press',
  'Vending Machines',
  'None'
];

// Program definitions (expanded)
export const PROGRAMS_DETAILED = [
  { id: 'limitless', name: 'Limitless', description: 'Business Owners' },
  { id: 'new-options', name: 'New Options', description: 'Jobs in the Community' },
  { id: 'bridges', name: 'Bridges', description: 'Transitioning & Job Skills Development' },
  { id: 'grace', name: 'Grace', description: 'Enrichment Program' }
];

// Coach type definitions (expanded)
export const COACH_TYPES_DETAILED = [
  { id: 'success', name: 'Success Coach', programs: ['limitless', 'new-options', 'bridges'] },
  { id: 'grace', name: 'Grace Coach', programs: ['grace'] }
];

// Navigation items for different user roles
export const getNavigationItemsForUser = (userProfile) => {
  if (!userProfile) return [];

  const { role, coachType } = userProfile;

  // Client navigation items
  if (role === USER_ROLES.CLIENT) {
    // Check if Grace client
    const isGraceClient = userProfile.program === 'grace' || 
                         (userProfile.clients && userProfile.clients.some(c => c.program === 'grace'));
    
    if (isGraceClient) {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: Building2 },
        { id: 'my-schedule', label: 'My Schedule', icon: Calendar },
        { id: 'my-goals', label: 'My Goals', icon: ClipboardList },
        { id: 'resources', label: 'Resources', icon: BookOpen }
      ];
    } else {
      // Regular client (Limitless/New Options/Bridges)
      return [
        { id: 'dashboard', label: 'Dashboard', icon: Building2 },
        { id: 'my-schedule', label: 'My Schedule', icon: Calendar },
        { id: 'my-tasks', label: 'My Tasks', icon: Clock }, // Task system for regular clients
        { id: 'my-goals', label: 'My Goals', icon: ClipboardList },
        { id: 'resources', label: 'Resources', icon: BookOpen }
      ];
    }
  }

  // Grace Coach navigation items
  if (role === USER_ROLES.COACH && coachType === COACH_TYPES.GRACE) {
    return [
      { id: 'dashboard', label: 'Grace Dashboard', icon: Building2 },
      { id: 'grace-schedule', label: 'Grace Schedule', icon: Calendar },
      { id: 'grace-attendance', label: 'Grace Attendance', icon: UserCheck },
      { id: 'clients', label: 'Grace Participants', icon: Users },
      { id: 'resources', label: 'Resources', icon: BookOpen }
    ];
  }

  // Success Coach navigation items
  if (role === USER_ROLES.COACH && coachType === COACH_TYPES.SUCCESS) {
    return [
      { id: 'dashboard', label: 'Dashboard', icon: Building2 },
      { id: 'schedule', label: 'My Schedule', icon: Calendar },
      { id: 'daily-tasks', label: 'Daily Tasks', icon: Clock }, // Task scheduling for success coaches
      { id: 'clients', label: 'Clients', icon: Users },
      { id: 'resources', label: 'Resources', icon: BookOpen }
    ];
  }

  // Regular Coach (without specific type - defaults to success coach behavior)
  if (role === USER_ROLES.COACH) {
    return [
      { id: 'dashboard', label: 'Dashboard', icon: Building2 },
      { id: 'schedule', label: 'My Schedule', icon: Calendar },
      { id: 'daily-tasks', label: 'Daily Tasks', icon: Clock }, // Task scheduling
      { id: 'clients', label: 'Clients', icon: Users },
      { id: 'resources', label: 'Resources', icon: BookOpen }
    ];
  }

  // Scheduler navigation items
  if (role === USER_ROLES.SCHEDULER) {
    return [
      { id: 'dashboard', label: 'Dashboard', icon: Building2 },
      { id: 'schedule', label: 'Schedule', icon: Calendar },
      { id: 'daily-tasks', label: 'Daily Tasks', icon: Clock }, // Task scheduling for schedulers
      { id: 'monthly-schedule', label: 'Monthly View', icon: Calendar },
      { id: 'clients', label: 'Clients', icon: Users },
      { id: 'grace-attendance', label: 'Grace Attendance', icon: UserCheck },
      { id: 'resources', label: 'Resources', icon: BookOpen }
    ];
  }

  // Admin navigation items
  if (role === USER_ROLES.ADMIN) {
    return [
      { id: 'dashboard', label: 'Dashboard', icon: Building2 },
      { id: 'schedule', label: 'Schedule', icon: Calendar },
      { id: 'daily-tasks', label: 'Daily Tasks', icon: Clock }, // Task scheduling for admins
      { id: 'monthly-schedule', label: 'Monthly View', icon: Calendar },
      { id: 'clients', label: 'Clients', icon: Users },
      { id: 'grace-attendance', label: 'Grace Attendance', icon: UserCheck },
      { id: 'admin', label: 'Admin Panel', icon: Settings },
      { id: 'resources', label: 'Resources', icon: BookOpen }
    ];
  }

  return [];
};

// Helper function to check if user can access Grace attendance
export const canAccessGraceAttendance = (userProfile) => {
  if (!userProfile) return false;
  
  const { role, coachType } = userProfile;
  
  // Admins and schedulers can access
  if (role === USER_ROLES.ADMIN || role === USER_ROLES.SCHEDULER) {
    return true;
  }
  
  // Grace coaches can access
  if (role === USER_ROLES.COACH && coachType === COACH_TYPES.GRACE) {
    return true;
  }
  
  return false;
};

// Helper function to check if user can access task scheduling
export const canAccessTaskScheduling = (userProfile) => {
  if (!userProfile) return false;
  
  const { role, coachType } = userProfile;
  
  // Admins and schedulers can access
  if (role === USER_ROLES.ADMIN || role === USER_ROLES.SCHEDULER) {
    return true;
  }
  
  // Success coaches can access (not Grace coaches - they don't use the daily task system)
  if (role === USER_ROLES.COACH && (coachType === COACH_TYPES.SUCCESS || !coachType)) {
    return true;
  }
  
  return false;
};

// Helper function to check if client can access tasks
export const canAccessClientTasks = (userProfile, clientData = null) => {
  if (!userProfile) return false;
  
  // Only clients can access their own tasks
  if (userProfile.role !== USER_ROLES.CLIENT) return false;
  
  // Grace clients don't use the daily task system
  if (clientData && clientData.program === 'grace') return false;
  if (userProfile.program === 'grace') return false;
  
  return true;
};

// Task-related constants
export const TASK_TYPES = [
  { id: 'business-work', label: 'Business Work', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'skill-building', label: 'Skill Building', color: 'bg-green-100 text-green-800 border-green-200' },
  { id: 'coaching', label: 'Coaching Session', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'break', label: 'Break', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { id: 'meeting', label: 'Meeting', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { id: 'independent', label: 'Independent Work', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  { id: 'assessment', label: 'Assessment', color: 'bg-red-100 text-red-800 border-red-200' }
];

export const TASK_PRIORITIES = [
  { id: 'low', label: 'Low', color: 'text-gray-600' },
  { id: 'medium', label: 'Medium', color: 'text-blue-600' },
  { id: 'high', label: 'High', color: 'text-red-600' }
];

// Program colors and styling
export const PROGRAM_COLORS = {
  'limitless': {
    bg: 'bg-[#BED2D8]',
    text: 'text-[#292929]',
    primary: '#6D858E',
    badge: 'L'
  },
  'new-options': {
    bg: 'bg-[#BED2D8]',
    text: 'text-[#292929]',
    primary: '#6D858E',
    badge: 'NO'
  },
  'bridges': {
    bg: 'bg-[#BED2D8]',
    text: 'text-[#292929]',
    primary: '#5A4E69',
    badge: 'B'
  },
  'grace': {
    bg: 'bg-[#F5F5F5]',
    text: 'text-[#292929]',
    primary: '#9B97A2',
    badge: 'G'
  }
};

// File type icons
export const FILE_ICONS = {
  document: '📄',
  image: '🖼️',
  spreadsheet: '📊',
  design: '🎨',
  archive: '📦',
  code: '💻',
  default: '📎'
};

// App theme colors
export const THEME_COLORS = {
  primary: '#6D858E',
  secondary: '#5A4E69',
  accent: '#BED2D8',
  text: {
    primary: '#292929',
    secondary: '#707070',
    muted: '#9B97A2'
  },
  background: {
    primary: '#F5F5F5',
    card: '#FFFFFF',
    accent: '#BED2D8'
  }
};

// Resource categories
export const RESOURCE_CATEGORIES = {
  STAFF: {
    'Business Development for Adults with Disabilities': [
      'ABLE Account Setup for Business Savings',
      'Disability Employment Incentives (WOTC)',
      'Vocational Rehabilitation Business Resources',
      'Assistive Technology for Business Operations',
      'Social Security Work Incentives (PASS Plans)'
    ],
    'Adaptive Business Tools': [
      'Accessible Point of Sale Systems',
      'Voice Recognition Software for Business',
      'Visual Schedule Templates',
      'Communication Support Tools',
      'Adaptive Workspace Setup Guide'
    ],
    'Marketing & Sales Support': [
      'Simple Social Media Templates',
      'Customer Communication Scripts',
      'Business Card Design Templates',
      'Online Store Setup Guide',
      'Local Market Research Tools'
    ],
    'Financial Management': [
      'Simple Bookkeeping Systems',
      'Tax Preparation Resources',
      'Business Banking Guide',
      'Grant Opportunities for Disabled Entrepreneurs',
      'Pricing Strategy Worksheets'
    ]
  },
  CLIENT: {
    'Getting Started': [
      'Setting Up Your Workspace',
      'Basic Business Planning',
      'Understanding Your Equipment',
      'Safety Guidelines'
    ],
    'Marketing Your Business': [
      'Creating Social Media Posts',
      'Taking Good Product Photos',
      'Pricing Your Products',
      'Customer Service Tips'
    ],
    'Managing Your Business': [
      'Keeping Track of Orders',
      'Managing Your Time',
      'Setting Daily Goals',
      'Celebrating Your Success'
    ]
  }
};

// Equipment business type reference
export const EQUIPMENT_BUSINESS_REFERENCE = {
  'Heat Press Businesses': [
    'Custom mugs and tumblers',
    'T-shirt and clothing design',
    'Tote bags and accessories',
    'Personalized gifts'
  ],
  'Embroidery Businesses': [
    'Custom coasters',
    'Embroidered clothing',
    'Monogrammed items',
    'Patches and badges'
  ],
  'Online Businesses': [
    'eBay reselling',
    'Vending machine routes',
    'Digital product sales',
    'Service-based businesses'
  ]
};

// Default values
export const DEFAULTS = {
  CLIENT: {
    name: '',
    email: '',
    phone: '',
    jobGoal: '',
    businessName: '',
    equipment: '',
    strengths: '',
    challenges: '',
    coachingApproach: '',
    businessDescription: '',
    currentGoals: '',
    program: 'limitless',
    progress: 0,
    status: 'Active'
  },
  COACH: {
    name: '',
    email: '',
    uid: '',
    role: 'coach',
    coachType: 'success'
  }
};

// Password generation characters
export const PASSWORD_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

// File extension mappings
export const FILE_TYPE_MAPPINGS = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
  spreadsheet: ['xlsx', 'xls', 'csv'],
  design: ['ai', 'psd', 'sketch', 'figma'],
  archive: ['zip', 'rar', '7z', 'tar', 'gz'],
  code: ['html', 'css', 'js', 'jsx', 'py', 'php', 'rb']
};