// Client exports
export { supabase, createServerClient } from './client';

// Service exports
export { TicketService } from './services/TicketService';
export type { 
  Ticket, 
  TicketInsert, 
  TicketUpdate, 
  TicketStatus, 
  TicketPriority,
  TicketWithRelations,
  CreateTicketParams,
  SearchTicketParams,
  TicketStats
} from './services/TicketService';

// Hook exports
export { useUser } from './hooks/useUser';
export { useUser as useAuthUser, useAuth } from './hooks/useAuth';
export * from './hooks/useTickets';
export * from './hooks/useRealtimeTickets';
export * from './hooks/useUsers';
export * from './hooks/useLabels';
export * from './hooks/useTasks';
export * from './hooks/useTeams';
export * from './hooks/useTicketCounts';
export * from './hooks/useSendEmailReply';

// Type exports
export type { Database } from './types/database.types';

export * from './types/database.types'; 