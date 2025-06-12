// src/utils/constants.js - UPDATED with new roles and makerspace scheduling

import { Building2, Users, Calendar, ClipboardList, Settings, BookOpen, UserCheck, Clock, Car, Briefcase, Wrench, Package } from 'lucide-react';

// UPDATED: User roles with new positions
export const USER_ROLES = {
  ADMIN: 'admin',
  COACH: 'coach',
  SCHEDULER: 'scheduler',
  CLIENT: 'client',
  // NEW ROLES
  MERCHANDISE_COORDINATOR: 'merchandise_coordinator', // Kameron
  PROGRAM_ADMIN_COORDINATOR: 'program_admin_coordinator', // Josh
  ADMIN_DEV_COORDINATOR: 'admin_dev_coordinator', // Connie
  VOCATIONAL_DEV_COORDINATOR: 'vocational_dev_coordinator', // Scott
  EXECUTIVE_DIRECTOR: 'executive_director',
  DIRECTOR_ORG_DEV: 'director_org_dev',
  DIRECTOR_PROGRAM_DEV: 'director_program_dev'
};

// Coach type definitions (unchanged)
export const COACH_TYPES = {
  SUCCESS: 'success',
  GRACE: 'grace'
};

// NEW: Makerspace time slots (same as regular coaching slots)
export const MAKERSPACE_TIME_SLOTS = [
  { id: '8-10', label: '8:00 AM - 10:00 AM PST', start: '8:00 AM PST', end: '10:00 AM PST' },
  { id: '10-12', label: '10:00 AM - 12:00 PM PST', start: '10:00 AM PST', end: '12:00 PM PST' },
  { id: '1230-230', label: '12:30 PM - 2:30 PM PST', start: '12:30 PM PST', end: '2:30 PM PST' }
];

// NEW: Makerspace request status
export const MAKERSPACE_REQUEST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  DECLINED: 'declined',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// NEW: Walkthrough types
export const WALKTHROUGH_TYPES = [
  { id: 'new_client', label: 'New Client Orientation' },
  { id: 'equipment_training', label: 'Equipment Training' },
  { id: 'safety_training', label: 'Safety Training' },
  { id: 'general_tour', label: 'General Tour' },
  { id: 'business_consultation', label: 'Business Consultation' },
  { id: 'other', label: 'Other' }
];

// Program definitions (unchanged)
export const PROGRAMS = {
  LIMITLESS: 'limitless',
  NEW_OPTIONS: 'new-options', 
  BRIDGES: 'bridges',
  GRACE: 'grace'
};

// Time slots for regular scheduling (unchanged)
export const TIME_SLOTS = [
  { id: '8-10', label: '8:00 AM - 10:00 AM PST', start: '8:00 AM PST', end: '10:00 AM PST' },
  { id: '10-12', label: '10:00 AM - 12:00 PM PST', start: '10:00 AM PST', end: '12:00 PM PST' },
  { id: '1230-230', label: '12:30 PM - 2:30 PM PST', start: '12:30 PM PST', end: '2:30 PM PST' }
];

// NEW: Special time slots for FlexibleScheduleManager (not shown in main interface)
export const SPECIAL_TIME_SLOTS = [
  // Early morning slots
  { id: '7-9', label: '7:00 AM - 9:00 AM PST', start: '7:00 AM PST', end: '9:00 AM PST', type: 'early' },
  { id: '730-930', label: '7:30 AM - 9:30 AM PST', start: '7:30 AM PST', end: '9:30 AM PST', type: 'early' },
  
  // Extended afternoon slots
  { id: '2-4', label: '2:00 PM - 4:00 PM PST', start: '2:00 PM PST', end: '4:00 PM PST', type: 'extended' },
  { id: '3-5', label: '3:00 PM - 5:00 PM PST', start: '3:00 PM PST', end: '5:00 PM PST', type: 'extended' },
  
  // Weekend/Event slots
  { id: 'weekend-morning', label: 'Weekend Morning Event (9:00 AM - 12:00 PM)', start: '9:00 AM PST', end: '12:00 PM PST', type: 'weekend' },
  { id: 'weekend-afternoon', label: 'Weekend Afternoon Event (1:00 PM - 4:00 PM)', start: '1:00 PM PST', end: '4:00 PM PST', type: 'weekend' },
  
  // Custom slot
  { id: 'custom', label: 'Custom Time Slot', start: 'Custom', end: 'Custom', type: 'custom' }
];

// NEW: Get all time slots (core + special) for special scheduling
export const getAllTimeSlots = () => {
  return [...TIME_SLOTS, ...SPECIAL_TIME_SLOTS];
};

// Default time slots for different program types (core slots only)
export const DEFAULT_TIME_SLOTS_BY_PROGRAM = {
  'limitless': ['8-10', '10-12', '1230-230'],
  'new-options': ['8-10', '10-12', '1230-230'],
  'bridges': ['8-10', '10-12', '1230-230'], 
  'grace': [] // Grace doesn't use individual scheduling
};

// Working days including weekends for special events
export const ALL_WORKING_DAYS = [
  { id: 'monday', label: 'Monday', weekday: true },
  { id: 'tuesday', label: 'Tuesday', weekday: true },
  { id: 'wednesday', label: 'Wednesday', weekday: true },
  { id: 'thursday', label: 'Thursday', weekday: true },
  { id: 'friday', label: 'Friday', weekday: true },
  { id: 'saturday', label: 'Saturday', weekday: false },
  { id: 'sunday', label: 'Sunday', weekday: false }
];

// Default working days by program (weekdays only for normal scheduling)
export const DEFAULT_WORKING_DAYS_BY_PROGRAM = {
  'limitless': ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  'new-options': ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  'bridges': ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  'grace': [] // Grace doesn't use individual scheduling
};

// UPDATED: Navigation function with new roles and makerspace functionality
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
        { id: 'my-goals', label: 'My Goals', icon: ClipboardList }
      ];
    } else {
      // Regular client (Limitless/New Options/Bridges) - ADD MAKERSPACE REQUEST
      const items = [
        { id: 'dashboard', label: 'Dashboard', icon: Building2 },
        { id: 'my-schedule', label: 'My Schedule', icon: Calendar },
        { id: 'my-tasks', label: 'My Tasks', icon: Clock },
        { id: 'my-goals', label: 'My Goals', icon: ClipboardList },
        { id: 'makerspace-request', label: 'Request Makerspace Time', icon: Wrench }, // NEW
        { id: 'resources', label: 'Resources', icon: BookOpen }
      ];
      
      // Add internships tab for Bridges clients
      if (userProfile.program === 'bridges') {
        items.splice(4, 0, { id: 'my-internships', label: 'My Internships', icon: Briefcase });
      }
      
      return items;
    }
  }

  // NEW: Merchandise Coordinator (Kameron) - Special navigation
  if (role === USER_ROLES.MERCHANDISE_COORDINATOR) {
    return [
      { id: 'dashboard', label: 'Makerspace Dashboard', icon: Building2 },
      { id: 'makerspace-schedule', label: 'Makerspace Schedule', icon: Calendar },
      { id: 'makerspace-requests', label: 'Time Requests', icon: ClipboardList },
      { id: 'walkthrough-schedule', label: 'Walkthrough Schedule', icon: UserCheck },
      { id: 'production-tracking', label: 'Production Tracking', icon: Package },
      { id: 'mileage', label: 'Mileage Tracker', icon: Car },
      { id: 'resources', label: 'Resources', icon: BookOpen }
    ];
  }

  // Grace Coach navigation items (unchanged)
  if (role === USER_ROLES.COACH && coachType === COACH_TYPES.GRACE) {
    return [
      { id: 'dashboard', label: 'Grace Dashboard', icon: Building2 },
      { id: 'grace-schedule', label: 'Grace Schedule', icon: Calendar },
      { id: 'grace-attendance', label: 'Grace Attendance', icon: UserCheck },
      { id: 'clients', label: 'Grace Participants', icon: Users },
      { id: 'mileage', label: 'Mileage Tracker', icon: Car }, 
      { id: 'resources', label: 'Resources', icon: BookOpen }
    ];
  }

  // Success Coach navigation items (unchanged)
  if (role === USER_ROLES.COACH && coachType === COACH_TYPES.SUCCESS) {
    return [
      { id: 'dashboard', label: 'Dashboard', icon: Building2 },
      { id: 'schedule', label: 'My Schedule', icon: Calendar },
      { id: 'daily-tasks', label: 'Daily Tasks', icon: Clock },
      { id: 'clients', label: 'Clients', icon: Users },
      { id: 'mileage', label: 'Mileage Tracker', icon: Car }, 
      { id: 'resources', label: 'Resources', icon: BookOpen }
    ];
  }

  // Regular Coach (without specific type - defaults to success coach behavior)
  if (role === USER_ROLES.COACH) {
    return [
      { id: 'dashboard', label: 'Dashboard', icon: Building2 },
      { id: 'schedule', label: 'My Schedule', icon: Calendar },
      { id: 'daily-tasks', label: 'Daily Tasks', icon: Clock },
      { id: 'clients', label: 'Clients', icon: Users },
      { id: 'mileage', label: 'Mileage Tracker', icon: Car }, 
      { id: 'resources', label: 'Resources', icon: BookOpen }
    ];
  }

  // NEW: Full access roles (Josh, Connie, Scott, Directors) - Get all tabs like admin
  const FULL_ACCESS_ROLES = [
    USER_ROLES.PROGRAM_ADMIN_COORDINATOR,
    USER_ROLES.ADMIN_DEV_COORDINATOR, 
    USER_ROLES.VOCATIONAL_DEV_COORDINATOR,
    USER_ROLES.EXECUTIVE_DIRECTOR,
    USER_ROLES.DIRECTOR_ORG_DEV,
    USER_ROLES.DIRECTOR_PROGRAM_DEV
  ];

  if (FULL_ACCESS_ROLES.includes(role)) {
    return [
      { id: 'dashboard', label: 'Dashboard', icon: Building2 },
      { id: 'schedule', label: 'Schedule', icon: Calendar },
      { id: 'daily-tasks', label: 'Daily Tasks', icon: Clock },
      { id: 'monthly-schedule', label: 'Monthly View', icon: Calendar },
      { id: 'clients', label: 'Clients', icon: Users },
      { id: 'grace-attendance', label: 'Grace Attendance', icon: UserCheck },
      { id: 'makerspace-overview', label: 'Makerspace Overview', icon: Wrench }, // NEW
      { id: 'mileage', label: 'Mileage Tracker', icon: Car },
      { id: 'resources', label: 'Resources', icon: BookOpen },
      { id: 'admin', label: 'Admin Panel', icon: Settings }
    ];
  }

  // Scheduler navigation items (unchanged but add makerspace overview)
  if (role === USER_ROLES.SCHEDULER) {
    return [
      { id: 'dashboard', label: 'Dashboard', icon: Building2 },
      { id: 'schedule', label: 'Schedule', icon: Calendar },
      { id: 'daily-tasks', label: 'Daily Tasks', icon: Clock },
      { id: 'monthly-schedule', label: 'Monthly View', icon: Calendar },
      { id: 'clients', label: 'Clients', icon: Users },
      { id: 'grace-attendance', label: 'Grace Attendance', icon: UserCheck },
      { id: 'makerspace-overview', label: 'Makerspace Overview', icon: Wrench }, // NEW
      { id: 'mileage', label: 'Mileage Tracker', icon: Car }, 
      { id: 'resources', label: 'Resources', icon: BookOpen }
    ];
  }

  // Admin navigation items (updated with makerspace)
  if (role === USER_ROLES.ADMIN) {
    return [
      { id: 'dashboard', label: 'Dashboard', icon: Building2 },
      { id: 'schedule', label: 'Schedule', icon: Calendar },
      { id: 'daily-tasks', label: 'Daily Tasks', icon: Clock },
      { id: 'monthly-schedule', label: 'Monthly View', icon: Calendar },
      { id: 'clients', label: 'Clients', icon: Users },
      { id: 'grace-attendance', label: 'Grace Attendance', icon: UserCheck },
      { id: 'makerspace-overview', label: 'Makerspace Overview', icon: Wrench }, // NEW
      { id: 'mileage', label: 'Mileage Tracker', icon: Car },
      { id: 'resources', label: 'Resources', icon: BookOpen },
      { id: 'admin', label: 'Admin Panel', icon: Settings },
    ];
  }

  return [];
};

// NEW: Helper functions for makerspace access
export const canAccessMakerspaceRequests = (userProfile) => {
  if (!userProfile) return false;
  
  const { role } = userProfile;
  
  // Only merchandise coordinator can manage makerspace requests
  return role === USER_ROLES.MERCHANDISE_COORDINATOR;
};

export const canRequestMakerspaceTime = (userProfile) => {
  if (!userProfile) return false;
  
  const { role } = userProfile;
  
  // Only regular clients (not Grace) can request makerspace time
  if (role !== USER_ROLES.CLIENT) return false;
  if (userProfile.program === 'grace') return false;
  
  return true;
};

export const canViewMakerspaceOverview = (userProfile) => {
  if (!userProfile) return false;
  
  const { role } = userProfile;
  
  // All staff except basic coaches can view makerspace overview
  const allowedRoles = [
    USER_ROLES.ADMIN,
    USER_ROLES.SCHEDULER,
    USER_ROLES.MERCHANDISE_COORDINATOR,
    USER_ROLES.PROGRAM_ADMIN_COORDINATOR,
    USER_ROLES.ADMIN_DEV_COORDINATOR,
    USER_ROLES.VOCATIONAL_DEV_COORDINATOR,
    USER_ROLES.EXECUTIVE_DIRECTOR,
    USER_ROLES.DIRECTOR_ORG_DEV,
    USER_ROLES.DIRECTOR_PROGRAM_DEV
  ];
  
  return allowedRoles.includes(role);
};

// Helper function to check if user can access mileage tracking (UPDATED)
export const canAccessMileageTracking = (userProfile) => {
  if (!userProfile) return false;
  
  const { role } = userProfile;
  
  // All staff roles can access mileage tracking
  const allowedRoles = [
    USER_ROLES.COACH,
    USER_ROLES.ADMIN,
    USER_ROLES.SCHEDULER,
    USER_ROLES.MERCHANDISE_COORDINATOR,
    USER_ROLES.PROGRAM_ADMIN_COORDINATOR,
    USER_ROLES.ADMIN_DEV_COORDINATOR,
    USER_ROLES.VOCATIONAL_DEV_COORDINATOR,
    USER_ROLES.EXECUTIVE_DIRECTOR,
    USER_ROLES.DIRECTOR_ORG_DEV,
    USER_ROLES.DIRECTOR_PROGRAM_DEV
  ];
  
  return allowedRoles.includes(role);
};

// Helper function to check if user can access Grace attendance (UPDATED)
export const canAccessGraceAttendance = (userProfile) => {
  if (!userProfile) return false;
  
  const { role, coachType } = userProfile;
  
  // Admins, schedulers, and new coordinator roles can access
  const allowedRoles = [
    USER_ROLES.ADMIN,
    USER_ROLES.SCHEDULER,
    USER_ROLES.PROGRAM_ADMIN_COORDINATOR,
    USER_ROLES.ADMIN_DEV_COORDINATOR,
    USER_ROLES.VOCATIONAL_DEV_COORDINATOR,
    USER_ROLES.EXECUTIVE_DIRECTOR,
    USER_ROLES.DIRECTOR_ORG_DEV,
    USER_ROLES.DIRECTOR_PROGRAM_DEV
  ];
  
  if (allowedRoles.includes(role)) {
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
  
  // Admins, schedulers, and new coordinator roles can access
  const allowedRoles = [
    USER_ROLES.ADMIN,
    USER_ROLES.SCHEDULER,
    USER_ROLES.PROGRAM_ADMIN_COORDINATOR,
    USER_ROLES.ADMIN_DEV_COORDINATOR,
    USER_ROLES.VOCATIONAL_DEV_COORDINATOR,
    USER_ROLES.EXECUTIVE_DIRECTOR,
    USER_ROLES.DIRECTOR_ORG_DEV,
    USER_ROLES.DIRECTOR_PROGRAM_DEV
  ];
  
  if (allowedRoles.includes(role)) {
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

// Helper function to check if client can access internships
export const canAccessInternships = (userProfile, clientData = null) => {
  if (!userProfile) return false;
  
  // Only clients can access their own internships
  if (userProfile.role !== USER_ROLES.CLIENT) return false;
  
  // Only Bridges clients use internships
  if (clientData && clientData.program === 'bridges') return true;
  if (userProfile.program === 'bridges') return true;
  
  return false;
};

// Helper function to check if user can manage internships
export const canManageInternships = (userProfile) => {
  if (!userProfile) return false;
  
  const { role, coachType } = userProfile;
  
  // Admins, schedulers, and new coordinator roles can manage
  const allowedRoles = [
    USER_ROLES.ADMIN,
    USER_ROLES.SCHEDULER,
    USER_ROLES.PROGRAM_ADMIN_COORDINATOR,
    USER_ROLES.ADMIN_DEV_COORDINATOR,
    USER_ROLES.VOCATIONAL_DEV_COORDINATOR,
    USER_ROLES.EXECUTIVE_DIRECTOR,
    USER_ROLES.DIRECTOR_ORG_DEV,
    USER_ROLES.DIRECTOR_PROGRAM_DEV
  ];
  
  if (allowedRoles.includes(role)) {
    return true;
  }
  
  // Success coaches can manage (they work with Bridges participants)
  if (role === USER_ROLES.COACH && (coachType === COACH_TYPES.SUCCESS || !coachType)) {
    return true;
  }
  
  return false;
};

// UPDATED: Coach types with new roles included
export const COACH_TYPES_DETAILED = [
  { id: 'success', name: 'Success Coach', programs: ['limitless', 'new-options', 'bridges'] },
  { id: 'grace', name: 'Grace Coach', programs: ['grace'] },
  { id: 'merchandise_coordinator', name: 'Merchandise Coordinator', programs: ['limitless'] },
  { id: 'program_admin_coordinator', name: 'Program Admin Coordinator', programs: ['limitless', 'new-options', 'bridges', 'grace'] },
  { id: 'admin_dev_coordinator', name: 'Admin Development Coordinator', programs: ['limitless', 'new-options', 'bridges', 'grace'] },
  { id: 'vocational_dev_coordinator', name: 'Vocational Development Coordinator', programs: ['limitless', 'new-options', 'bridges'] },
  { id: 'executive_director', name: 'Executive Director', programs: ['limitless', 'new-options', 'bridges', 'grace'] },
  { id: 'director_org_dev', name: 'Director of Organizational Development', programs: ['limitless', 'new-options', 'bridges', 'grace'] },
  { id: 'director_program_dev', name: 'Director of Program Development', programs: ['limitless', 'new-options', 'bridges', 'grace'] }
];

// NEW: Default makerspace request object
export const DEFAULT_MAKERSPACE_REQUEST = {
  clientId: '',
  clientName: '',
  date: '',
  timeSlot: '',
  purpose: '',
  equipment: [],
  estimatedDuration: '',
  notes: '',
  status: 'pending',
  requestedAt: null,
  reviewedAt: null,
  reviewedBy: '',
  coordinatorNotes: ''
};

// NEW: Default walkthrough object
export const DEFAULT_WALKTHROUGH = {
  clientId: '',
  clientName: '',
  date: '',
  timeSlot: '', 
  type: '',
  description: '',
  equipment: [],
  notes: '',
  status: 'scheduled',
  createdAt: null,
  completedAt: null
};

// NEW: Makerspace equipment categories
export const MAKERSPACE_EQUIPMENT = [
  { id: 'heat_press', label: 'Heat Press', category: 'printing' },
  { id: 'embroidery_machine', label: 'Embroidery Machine', category: 'sewing' },
  { id: 'mug_press', label: 'Mug Heat Press', category: 'printing' },
  { id: 'vinyl_cutter', label: 'Vinyl Cutter', category: 'cutting' },
  { id: 'sublimation_printer', label: 'Sublimation Printer', category: 'printing' },
  { id: 'sewing_machine', label: 'Sewing Machine', category: 'sewing' },
  { id: 'computer_design', label: 'Design Computer', category: 'digital' },
  { id: 'laminator', label: 'Laminator', category: 'finishing' },
  { id: 'cutting_mat', label: 'Cutting Mat & Tools', category: 'cutting' },
  { id: 'general_workspace', label: 'General Workspace', category: 'workspace' }
];

// NEW: Equipment categories for filtering
export const EQUIPMENT_CATEGORIES = [
  { id: 'printing', label: 'Printing Equipment', color: 'bg-blue-100 text-blue-800' },
  { id: 'sewing', label: 'Sewing Equipment', color: 'bg-green-100 text-green-800' },
  { id: 'cutting', label: 'Cutting Equipment', color: 'bg-purple-100 text-purple-800' },
  { id: 'digital', label: 'Digital Equipment', color: 'bg-orange-100 text-orange-800' },
  { id: 'finishing', label: 'Finishing Equipment', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'workspace', label: 'Workspace', color: 'bg-gray-100 text-gray-800' }
];

// Time blocks for task scheduling (30-minute intervals within core hours)
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

// Internship status options for Bridges participants
export const INTERNSHIP_STATUS = {
  PLANNED: 'planned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Internship types/categories
export const INTERNSHIP_TYPES = [
  { id: 'office', label: 'Office/Administrative' },
  { id: 'retail', label: 'Retail/Customer Service' },
  { id: 'food_service', label: 'Food Service' },
  { id: 'warehouse', label: 'Warehouse/Logistics' },
  { id: 'healthcare', label: 'Healthcare Support' },
  { id: 'education', label: 'Educational Support' },
  { id: 'nonprofit', label: 'Nonprofit Organization' },
  { id: 'manufacturing', label: 'Manufacturing' },
  { id: 'technology', label: 'Technology' },
  { id: 'other', label: 'Other' }
];

// Internship schedule patterns
export const INTERNSHIP_SCHEDULES = [
  { id: 'daily', label: 'Daily (30 days)', description: 'Monday-Friday for 6 weeks' },
  { id: 'weekly_1', label: 'Once per week (30 weeks)', description: 'One day per week for 30 weeks' },
  { id: 'weekly_2', label: 'Twice per week (15 weeks)', description: 'Two days per week for 15 weeks' },
  { id: 'weekly_3', label: 'Three times per week (10 weeks)', description: 'Three days per week for 10 weeks' },
  { id: 'custom', label: 'Custom Schedule', description: 'Flexible schedule totaling 30 business days' }
];

// Task-related constants
export const TASK_TYPES = [
  { id: 'business-work', label: 'Business Work', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'skill-building', label: 'Skill Building', color: 'bg-green-100 text-green-800 border-green-200' },
  { id: 'coaching', label: 'Coaching Session', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'internship', label: 'Internship Work', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { id: 'break', label: 'Break', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { id: 'meeting', label: 'Meeting', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { id: 'independent', label: 'Independent Work', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  { id: 'assessment', label: 'Assessment', color: 'bg-red-100 text-red-800 border-red-200' }
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

// Mileage tracking constants
export const MILEAGE_PURPOSES = [
  { id: 'business', label: 'Business', deductible: true },
  { id: 'personal', label: 'Personal', deductible: false }
];

export const MILEAGE_CATEGORIES = [
  { id: 'client_visit', label: 'Client Visit' },
  { id: 'office_meeting', label: 'Office Meeting' },
  { id: 'training', label: 'Training' },
  { id: 'internship_visit', label: 'Internship Site Visit' },
  { id: 'errand', label: 'Work Errand' },
  { id: 'other', label: 'Other' }
];

// Common places frequently visited by ITG coaches
export const COMMON_PLACES = [
  { id: 'office', name: 'ITG Office', address: '1830 Truxtun Avenue, Bakersfield, CA' },
  { id: 'michael_girgis', name: 'Michael Girgis', address: '14404 Fremantle Ct, Bakersfield, CA' },
  { id: 'three_way', name: 'Three Way', address: '5401 Wible Rd, Bakersfield, CA' },
  { id: 'ford', name: 'Ford', address: '2001 Oak St, Bakersfield, CA' },
  { id: 'luis_ceron', name: 'Luis Ceron', address: '12401 Lincolnshire Dr, Bakersfield, CA' },
  { id: 'mare', name: 'MARE', address: '18200 Johnson Rd, Bakersfield, CA' },
  { id: 'airien_villanueva', name: 'Airien Villanueva', address: '9709 Cobble Creek, Bakersfield, CA' },
  { id: 'bakersfield_roasting', name: 'Bakersfield Roasting', address: '6501 Schirra Ct, Bakersfield, CA' },
  { id: 'city_serve', name: 'City Serve', address: '3201 F Street, Bakersfield, CA' },
  { id: 'dorthy_pastry', name: 'Dorthy Pastry', address: '2452 Pine St, Bakersfield, CA' },
  { id: 'smart_and_final', name: 'Smart & Final', address: '1725 Golden State Hwy, Bakersfield, CA' },
  { id: 'costco', name: 'Costco', address: '3800 Rosedale Hwy, Bakersfield, CA' },
  { id: 'winco', name: 'Winco', address: '4200 Coffee Rd, Bakersfield, CA' },
  { id: 'wateria', name: 'Wateria', address: '3420 Stine Rd, Bakersfield, CA' }
];

// Common business purposes for mileage records
export const COMMON_PURPOSES = [
  'Client pick up',
  'Client drop off', 
  'Shopping',
  'Traveling to office',
  'Internship site visit',
  'Job coach support',
  'Other business-related travel'
];

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
    ],
    'Internship Management': [
      'Internship Site Development Guide',
      'Job Coach Training Materials',
      'Workplace Accommodation Resources',
      'Internship Evaluation Tools',
      'Transition Planning Resources'
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
    ],
    'Internship Success': [
      'Preparing for Your Internship',
      'Workplace Communication Skills',
      'Time Management at Work',
      'Building Professional Relationships'
    ]
  }
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
  },
  INTERNSHIP: {
    clientId: '',
    companyName: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    position: '',
    type: '',
    description: '',
    startDate: '',
    endDate: '',
    workingDays: [],
    timeSlots: [],
    totalBusinessDays: 30,
    completedDays: 0,
    status: 'planned',
    schedule: 'custom',
    skills: [],
    notes: '',
    evaluations: []
  }
};

// Validation constants
export const MILEAGE_VALIDATION = {
  MAX_MILES_PER_TRIP: 1000,
  MIN_MILES_PER_TRIP: 0.001,
  MAX_DAYS_BACK: 365,
  REQUIRED_FIELDS: ['date', 'startLocation', 'endLocation', 'purpose', 'mileage'],
  PRECISION_DECIMALS: 3,
  DECIMAL_STEP: 0.001,
  PAYMENT_PRECISION: 3
};

export const MILEAGE_FORMATS = {
  DISPLAY: 3,
  PAYMENT: 3,
  INPUT_STEP: '0.001',
  INPUT_PLACEHOLDER: '0.000'
};

export const INTERNSHIP_VALIDATION = {
  MIN_BUSINESS_DAYS: 1,
  MAX_BUSINESS_DAYS: 50,
  REQUIRED_FIELDS: ['companyName', 'position', 'type', 'startDate', 'schedule'],
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_NOTES_LENGTH: 2000
};

// File type icons and mappings
export const FILE_ICONS = {
  document: '📄',
  image: '🖼️',
  spreadsheet: '📊',
  design: '🎨',
  archive: '📦',
  code: '💻',
  default: '📎'
};

export const FILE_TYPE_MAPPINGS = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
  spreadsheet: ['xlsx', 'xls', 'csv'],
  design: ['ai', 'psd', 'sketch', 'figma'],
  archive: ['zip', 'rar', '7z', 'tar', 'gz'],
  code: ['html', 'css', 'js', 'jsx', 'py', 'php', 'rb']
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

// Password generation characters
export const PASSWORD_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

// Helper functions
export const getTimeSlotsByProgram = (program) => {
  return DEFAULT_TIME_SLOTS_BY_PROGRAM[program] || DEFAULT_TIME_SLOTS_BY_PROGRAM.limitless;
};

export const getWorkingDaysByProgram = (program) => {
  return DEFAULT_WORKING_DAYS_BY_PROGRAM[program] || DEFAULT_WORKING_DAYS_BY_PROGRAM.limitless;
};