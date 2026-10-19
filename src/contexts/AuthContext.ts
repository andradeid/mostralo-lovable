import { createContext } from 'react';
import type { AuthContextType } from '@/hooks/use-auth';

// Keep context identity outside the refreshable provider/hook module.
// The type-only import is erased and introduces no runtime dependency cycle.
export const AuthContext = createContext<AuthContextType | undefined>(undefined);