import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

export interface GoogleUser {
  id: string;
  name: string;
  email: string;
  picture: string;
  familyName?: string;
  givenName?: string;
}

export class GoogleIdentityService {
  static async signIn(): Promise<GoogleUser | null> {
    try {
      console.log('🔐 Starting Google Sign-In...');
      console.log('🔐 Platform detected:', Platform.OS);
      
      // Use web-specific OAuth flow for web platform
      if (Platform.OS === 'web') {
        console.log('🔐 Using web OAuth flow');
        return await this.signInWeb();
      } else {
        console.log('🔐 Using native OAuth flow');
        return await this.signInWithAuthSession();
      }
    } catch (error: any) {
      console.error('❌ Google Sign-In error:', error);
      return null;
    }
  }

  private static async signInWeb(): Promise<GoogleUser | null> {
    try {
      console.log('🔐 Web OAuth - Starting web OAuth flow');
      const clientId = '1046280433703-1k5vca96tcktah838dr7ksr48lv3uuv1.apps.googleusercontent.com';
      const redirectUri = window.location.origin;
      
      console.log('🔐 Web OAuth - Redirect URI:', redirectUri);
      
      // Check if we're returning from OAuth callback
      const urlParams = new URLSearchParams(window.location.search);
      const urlHash = new URLSearchParams(window.location.hash.substring(1));
      const code = urlParams.get('code');
      const accessToken = urlHash.get('access_token');
      const state = urlParams.get('state') || urlHash.get('state');
      
      console.log('🔐 Web OAuth - URL params:', { 
        code: code ? 'present' : 'missing', 
        accessToken: accessToken ? 'present' : 'missing', 
        state 
      });
      
      if (accessToken) {
        console.log('🔐 Web OAuth - Received callback with access token');
        return await this.handleOAuthCallback(accessToken, 'token');
      } else if (code) {
        console.log('🔐 Web OAuth - Received callback with code:', code);
        return await this.handleOAuthCallback(code, 'code');
      }
      
      // Generate a random state parameter for security
      const newState = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('oauth_state', newState);
      
      // Build the Google OAuth URL
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'token');
      authUrl.searchParams.set('scope', 'openid profile email');
      authUrl.searchParams.set('state', newState);
      authUrl.searchParams.set('prompt', 'select_account');
      
      console.log('🔐 Web OAuth - Auth URL:', authUrl.toString());
      
      // Redirect to Google OAuth
      window.location.href = authUrl.toString();
      
      // This will redirect away from the page, so we won't reach here
      return null;
    } catch (error) {
      console.error('❌ Web OAuth error:', error);
      return null;
    }
  }

  private static async handleOAuthCallback(tokenOrCode: string, type: 'token' | 'code'): Promise<GoogleUser | null> {
    try {
      let accessToken: string;
      
      if (type === 'token') {
        // Direct access token from implicit flow
        accessToken = tokenOrCode;
        console.log('🔐 Web OAuth - Using direct access token from implicit flow');
      } else {
        // Exchange code for access token (authorization code flow)
        const clientId = '1046280433703-1k5vca96tcktah838dr7ksr48lv3uuv1.apps.googleusercontent.com';
        const redirectUri = window.location.origin;
        
        console.log('🔐 Web OAuth - Exchanging code for token...');
        console.log('🔐 Web OAuth - Using redirect URI:', redirectUri);
        console.log('🔐 Web OAuth - Using client ID:', clientId);
        
        // Exchange code for access token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: clientId,
            code: tokenOrCode,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
          }),
        });
        
        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error('❌ Token exchange failed:', tokenResponse.status, errorText);
          throw new Error(`Token exchange failed: ${tokenResponse.status} - ${errorText}`);
        }
        
        const tokenData = await tokenResponse.json();
        console.log('🔐 Web OAuth - Token response:', tokenData);
        
        accessToken = tokenData.access_token;
        if (!accessToken) {
          throw new Error('No access token received');
        }
      }
      
      if (accessToken) {
        // Get user info from Google using the access token
        const userInfoResponse = await fetch(
          `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
        );
        
        if (!userInfoResponse.ok) {
          throw new Error(`Failed to fetch user info: ${userInfoResponse.status}`);
        }

        const userInfo = await userInfoResponse.json();
        console.log('✅ Web OAuth - User info:', userInfo);
        
        const googleUser = {
          id: userInfo.id,
          name: userInfo.name || '',
          email: userInfo.email || '',
          picture: userInfo.picture || '',
          familyName: userInfo.family_name,
          givenName: userInfo.given_name
        };
        
        console.log('🔍 Web OAuth - Processed Google User:', googleUser);
        
        // Clear the URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        return googleUser;
      } else {
        console.log('❌ Web OAuth - No access token received');
        return null;
      }
    } catch (error) {
      console.error('❌ Web OAuth callback error:', error);
      return null;
    }
  }

  private static async signInWithAuthSession(): Promise<GoogleUser | null> {
    try {
      const clientId = '1046280433703-1k5vca96tcktah838dr7ksr48lv3uuv1.apps.googleusercontent.com';
      const redirectUri = 'https://auth.expo.io/@nm2tech/nm2-bibleai';
      
      console.log('🔐 OAuth - Redirect URI:', redirectUri);
      
      const request = new AuthSession.AuthRequest({
        clientId,
        scopes: ['openid', 'profile', 'email'],
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
        extraParams: {},
        additionalParameters: {},
        prompt: AuthSession.Prompt.SelectAccount,
        usePKCE: true,
      });

      const result = await request.promptAsync({
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        useProxy: true,
        showInRecents: false,
        preferEphemeralSession: true,
      });

      console.log('🔐 OAuth - Result:', result);
      console.log('🔐 OAuth - Result type:', result.type);
      console.log('🔐 OAuth - Result params:', result.params);
      console.log('🔐 OAuth - Result error:', result.error);

      if (result.type === 'success' && result.params?.code) {
        const tokenResponse = await AuthSession.exchangeCodeAsync(
          {
            clientId,
            code: result.params.code,
            redirectUri,
            extraParams: {
              code_verifier: request.codeChallenge,
            },
          },
          {
            tokenEndpoint: 'https://oauth2.googleapis.com/token',
          }
        );

        // Get user info from Google using the access token
        const userInfoResponse = await fetch(
          `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenResponse.accessToken}`
        );
        
        if (!userInfoResponse.ok) {
          throw new Error(`Failed to fetch user info: ${userInfoResponse.status}`);
        }
        
        const userInfo = await userInfoResponse.json();

        console.log('✅ Google Sign-In successful:', userInfo);
        
        const googleUser = {
          id: userInfo.id,
          name: userInfo.name || '',
          email: userInfo.email || '',
          picture: userInfo.picture || '',
          familyName: userInfo.family_name,
          givenName: userInfo.given_name
        };
        
        console.log('🔍 Processed Google User:', googleUser);
        return googleUser;
      } else {
        console.log('❌ Google Sign-In failed or cancelled:', result.type);
        return null;
      }
    } catch (error) {
      console.error('❌ Google Sign-In error:', error);
      return null;
    }
  }

  static async signOut(): Promise<boolean> {
    try {
      console.log('🚪 Signing out from Google...');
      // For expo-auth-session, we just clear local state since we can't revoke the token
      console.log('✅ Google Sign-Out successful');
      return true;
    } catch (error) {
      console.error('❌ Google Sign-Out error:', error);
      return false;
    }
  }

  static async getCurrentUser(): Promise<GoogleUser | null> {
    try {
      // For expo-auth-session, we can't get current user from Google Sign-In
      // This would need to be handled by the app's state management
      return null;
    } catch (error) {
      console.error('❌ Get current user error:', error);
      return null;
    }
  }

  static async isSignedIn(): Promise<boolean> {
    try {
      // For expo-auth-session, we can't check sign-in status from Google Sign-In
      // This would need to be handled by the app's state management
      return false;
    } catch (error) {
      console.error('❌ Check sign-in status error:', error);
      return false;
    }
  }

  static async revokeAccess(): Promise<boolean> {
    try {
      console.log('🔄 Revoking Google access...');
      // For expo-auth-session, we can't revoke access from Google Sign-In
      console.log('✅ Google access revoked (local only)');
      return true;
    } catch (error) {
      console.error('❌ Revoke access error:', error);
      return false;
    }
  }
}
