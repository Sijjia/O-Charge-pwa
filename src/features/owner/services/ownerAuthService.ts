/**
 * Owner Authentication Service
 * Handles authentication for station owners/operators through Supabase Auth
 */

import { supabase } from '@/shared/config/supabase';
import { logger } from '@/shared/utils/logger';
import type { OwnerUser, OwnerRole } from '../stores/ownerAuthStore';

export interface OwnerAuthResponse {
  success: boolean;
  owner?: OwnerUser;
  session?: {
    access_token: string;
    refresh_token: string;
  };
  error?: string;
}

export class OwnerAuthService {
  private static instance: OwnerAuthService;

  private constructor() {}

  static getInstance(): OwnerAuthService {
    if (!OwnerAuthService.instance) {
      OwnerAuthService.instance = new OwnerAuthService();
    }
    return OwnerAuthService.instance;
  }

  /**
   * Sign in owner with email and password
   */
  async signIn(email: string, password: string): Promise<OwnerAuthResponse> {
    try {
      // Authenticate with Supabase
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {
        logger.error('[OwnerAuthService] Sign in failed', { email, error: authError });
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Authentication failed: No user returned');
      }

      // Set backend evp_access cookie for API calls
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        await fetch(`${apiUrl}/api/v1/auth/login`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        logger.debug('[OwnerAuthService] Backend cookie set');
      } catch (cookieErr) {
        logger.warn('[OwnerAuthService] Failed to set backend cookie', cookieErr);
      }

      // Fetch owner data from users table
      const { data: ownerData, error: ownerError } = await supabase
        .from('users')
        .select('id, email, role, is_active, created_at')
        .eq('id', authData.user.id)
        .single();

      if (ownerError) {
        logger.error('[OwnerAuthService] Failed to fetch owner data', {
          userId: authData.user.id,
          error: ownerError,
        });
        throw ownerError;
      }

      if (!ownerData) {
        throw new Error('Owner not found in users table');
      }

      if (!ownerData.is_active) {
        throw new Error('Account is inactive. Please contact support.');
      }

      // Get owner's stations and locations count
      const [stationsResult, locationsResult] = await Promise.all([
        supabase
          .from('stations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', ownerData.id),
        supabase
          .from('locations')
          .select('id', { count: 'exact', head: true })
          .or(`user_id.eq.${ownerData.id},admin_id.eq.${ownerData.id}`),
      ]);

      const ownerUser: OwnerUser = {
        ...ownerData,
        stations_count: stationsResult.count || 0,
        locations_count: locationsResult.count || 0,
      };

      logger.info('[OwnerAuthService] Sign in successful', {
        email,
        role: ownerUser.role,
      });

      return {
        success: true,
        owner: ownerUser,
        session: authData.session
          ? {
              access_token: authData.session.access_token,
              refresh_token: authData.session.refresh_token,
            }
          : undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      logger.error('[OwnerAuthService] Sign in error', { email, error: errorMessage });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Sign out owner
   */
  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      logger.info('[OwnerAuthService] Sign out successful');
    } catch (error) {
      logger.error('[OwnerAuthService] Sign out failed', error);
      throw error;
    }
  }

  /**
   * Refresh owner session and data
   */
  async refreshSession(): Promise<OwnerAuthResponse> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        return {
          success: false,
          error: 'No active session',
        };
      }

      // Fetch fresh owner data
      const { data: ownerData, error } = await supabase
        .from('users')
        .select('id, email, role, is_active, created_at')
        .eq('id', session.user.id)
        .single();

      if (error || !ownerData) {
        throw new Error('Failed to fetch owner data');
      }

      if (!ownerData.is_active) {
        await this.signOut();
        throw new Error('Account has been deactivated');
      }

      // Get counts
      const [stationsResult, locationsResult] = await Promise.all([
        supabase
          .from('stations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', ownerData.id),
        supabase
          .from('locations')
          .select('id', { count: 'exact', head: true })
          .or(`user_id.eq.${ownerData.id},admin_id.eq.${ownerData.id}`),
      ]);

      const ownerUser: OwnerUser = {
        ...ownerData,
        stations_count: stationsResult.count || 0,
        locations_count: locationsResult.count || 0,
      };

      logger.debug('[OwnerAuthService] Session refreshed');

      return {
        success: true,
        owner: ownerUser,
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        },
      };
    } catch (error) {
      logger.error('[OwnerAuthService] Session refresh failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Session refresh failed',
      };
    }
  }

  /**
   * Get current authenticated owner
   */
  async getCurrentOwner(): Promise<OwnerUser | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return null;
      }

      const { data: ownerData, error } = await supabase
        .from('users')
        .select('id, email, role, is_active, created_at')
        .eq('id', user.id)
        .single();

      if (error || !ownerData) {
        return null;
      }

      if (!ownerData.is_active) {
        return null;
      }

      // Get counts
      const [stationsResult, locationsResult] = await Promise.all([
        supabase
          .from('stations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', ownerData.id),
        supabase
          .from('locations')
          .select('id', { count: 'exact', head: true })
          .or(`user_id.eq.${ownerData.id},admin_id.eq.${ownerData.id}`),
      ]);

      return {
        ...ownerData,
        stations_count: stationsResult.count || 0,
        locations_count: locationsResult.count || 0,
      };
    } catch (error) {
      logger.error('[OwnerAuthService] Get current owner failed', error);
      return null;
    }
  }

  /**
   * NOTE: Owner registration is done manually by superadmin
   * This method is provided for reference but should NOT be exposed in UI
   *
   * To create a new owner:
   * 1. Superadmin creates owner in Supabase Auth Dashboard
   * 2. Set user_metadata: { user_type: 'admin' } or { user_type: 'operator' }
   * 3. Trigger handle_new_user() will automatically create record in public.users
   */
  async createOwnerManually(
    email: string,
    password: string,
    role: OwnerRole = 'admin'
  ): Promise<OwnerAuthResponse> {
    try {
      // This should ONLY be called by superadmin
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: role, // Important! Trigger uses this to route to users table
            name: email.split('@')[0],
          },
        },
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Failed to create user');
      }

      // Wait for trigger to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Fetch created owner data
      const { data: ownerData, error: ownerError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (ownerError || !ownerData) {
        throw new Error('Failed to create owner record. Trigger may have failed.');
      }

      logger.info('[OwnerAuthService] Owner created manually', {
        email,
        role,
      });

      return {
        success: true,
        owner: {
          ...ownerData,
          stations_count: 0,
          locations_count: 0,
        },
        session: authData.session
          ? {
              access_token: authData.session.access_token,
              refresh_token: authData.session.refresh_token,
            }
          : undefined,
      };
    } catch (error) {
      logger.error('[OwnerAuthService] Manual owner creation failed', {
        email,
        error,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Owner creation failed',
      };
    }
  }
}

export const ownerAuthService = OwnerAuthService.getInstance();
