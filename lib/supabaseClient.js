// lib/supabaseClient.js - Simple REST API client for Supabase

const supabaseUrl = 'https://nvqrptokmwdhvpiufrad.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52cXJwdG9rbXdkaHZwaXVmcmFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzU0ODUsImV4cCI6MjA3MTYxMTQ4NX0.yvFalmZE7Xpvo_j6wzRj44Pa7Bx9LQegcyLzbz3QL5s'

class SupabaseQueryBuilder {
  constructor(table) {
    this.table = table;
    this.selectFields = '*';
    this.filters = [];
    this.orderBy = null;
    this.limitCount = null;
    this.method = 'GET';
    this.insertData = null;
    this.singleResult = false;
  }

  select(fields = '*') {
    this.selectFields = fields;
    return this;
  }

  eq(column, value) {
    this.filters.push(`${column}=eq.${encodeURIComponent(value)}`);
    return this;
  }

  ilike(column, value) {
    this.filters.push(`${column}=ilike.${encodeURIComponent(value)}`);
    return this;
  }

  gte(column, value) {
    this.filters.push(`${column}=gte.${encodeURIComponent(value)}`);
    return this;
  }

  lte(column, value) {
    this.filters.push(`${column}=lte.${encodeURIComponent(value)}`);
    return this;
  }

  or(filterString) {
    this.filters.push(`or=(${filterString})`);
    return this;
  }

  order(column, options = {}) {
    const direction = options.ascending === false ? 'desc' : 'asc';
    this.orderBy = `${column}.${direction}`;
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.singleResult = true;
    return this;
  }

  insert(data) {
    this.method = 'POST';
    this.insertData = data;
    return this;
  }

  update(data) {
    this.method = 'PATCH';
    this.insertData = data;
    return this;
  }

  delete() {
    this.method = 'DELETE';
    return this;
  }

  // Build the URL for the request
  buildUrl() {
    let url = `${supabaseUrl}/rest/v1/${this.table}`;
    
    const params = new URLSearchParams();
    
    // Add select fields (for POST/PATCH, this tells Supabase what to return)
    if (this.selectFields && this.selectFields !== '*') {
      params.append('select', this.selectFields);
    } else if (this.method === 'POST' || this.method === 'PATCH') {
      // For insert/update, include select=* to get the created/updated row
      params.append('select', '*');
    }
    
    // Add filters
    this.filters.forEach(filter => {
      const [key, value] = filter.split('=');
      params.append(key, value);
    });
    
    // Add order
    if (this.orderBy) {
      params.append('order', this.orderBy);
    }
    
    // Add limit
    if (this.limitCount) {
      params.append('limit', this.limitCount);
    }

    const paramString = params.toString();
    if (paramString) {
      url += '?' + paramString;
    }

    return url;
  }

  // Build request options
  buildRequestOptions() {
    // Get auth token from session storage if available
    let authToken = supabaseAnonKey;
    try {
      const authData = sessionStorage.getItem('auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        if (parsed.session && parsed.session.access_token) {
          authToken = parsed.session.access_token;
        }
      }
    } catch (e) {
      // If session parsing fails, fall back to anon key
      console.warn('Could not read auth session, using anon key:', e);
    }

    const options = {
      method: this.method,
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    };

    if (this.insertData && (this.method === 'POST' || this.method === 'PATCH')) {
      options.body = JSON.stringify(this.insertData);
    }

    return options;
  }
}

// Simple Supabase client that mimics the official API
// SESSION 76: Changed from export to const for regular script tag loading
const supabase = {
  from(table) {
    return {
      select: (fields = '*') => {
        const builder = new SupabaseQueryBuilder(table);
        builder.select(fields);
        
        return {
          eq: (column, value) => {
            builder.eq(column, value);
            return createQueryMethods(builder);
          },
          ilike: (column, value) => {
            builder.ilike(column, value);
            return createQueryMethods(builder);
          },
          gte: (column, value) => {
            builder.gte(column, value);
            return createQueryMethods(builder);
          },
          lte: (column, value) => {
            builder.lte(column, value);
            return createQueryMethods(builder);
          },
          or: (filterString) => {
            builder.or(filterString);
            return createQueryMethods(builder);
          },
          order: (column, options) => {
            builder.order(column, options);
            return createQueryMethods(builder);
          },
          limit: (count) => {
            builder.limit(count);
            return createQueryMethods(builder);
          },
          single: () => {
            builder.single();
            return createQueryMethods(builder);
          },
          then: (onResolve, onReject) => {
            return executeQuery(builder).then(onResolve, onReject);
          }
        };
      },
      
      insert: (data) => {
        const builder = new SupabaseQueryBuilder(table);
        builder.insert(data);
        return {
          select: (fields = '*') => {
            builder.selectFields = fields;
            return {
              single: () => {
                builder.singleResult = true;
                return {
                  then: (onResolve, onReject) => {
                    return executeQuery(builder).then(onResolve, onReject);
                  }
                };
              },
              then: (onResolve, onReject) => {
                return executeQuery(builder).then(onResolve, onReject);
              }
            };
          },
          then: (onResolve, onReject) => {
            return executeQuery(builder).then(onResolve, onReject);
          }
        };
      },
      
      update: (data) => {
        const builder = new SupabaseQueryBuilder(table);
        builder.update(data);
        return createQueryMethods(builder);
      },
      
      delete: () => {
        const builder = new SupabaseQueryBuilder(table);
        builder.method = 'DELETE';
        return createQueryMethods(builder);
      }
    };
  },
  
  // Real-time subscriptions (simplified for now)
  channel: (name) => {
    return {
      on: () => ({ subscribe: () => {} }),
      unsubscribe: () => {}
    };
  },
  
  // RPC (Remote Procedure Call) for calling PostgreSQL functions
  rpc: async (functionName, params = {}) => {
    try {
      const url = `${supabaseUrl}/rest/v1/rpc/${functionName}`;
      
      const options = {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      };
      
      console.log(`🔍 Supabase RPC call: ${functionName}`, params);
      
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Supabase RPC error ${response.status}:`, errorText);
        return { 
          data: null, 
          error: { 
            message: `RPC call failed: ${response.status} ${errorText}`,
            code: response.status.toString()
          } 
        };
      }
      
      const data = await response.json();
      return { data, error: null };
      
    } catch (error) {
      console.error('❌ Supabase RPC error:', error);
      return { 
        data: null, 
        error: { 
          message: error.message,
          code: 'NETWORK_ERROR'
        } 
      };
    }
  },
  
  // Auth API for Supabase Authentication
  auth: {
    // Sign in with email and password
    signInWithPassword: async ({ email, password }) => {
      try {
        const url = `${supabaseUrl}/auth/v1/token?grant_type=password`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'apikey': supabaseAnonKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ Auth sign in error:', errorData);
          return { 
            data: { user: null, session: null }, 
            error: { 
              message: errorData.error_description || errorData.msg || 'Login failed',
              status: response.status
            } 
          };
        }
        
        const data = await response.json();
        console.log('✅ Auth sign in successful');
        
        return { 
          data: {
            user: data.user,
            session: {
              access_token: data.access_token,
              refresh_token: data.refresh_token,
              expires_in: data.expires_in,
              token_type: data.token_type
            }
          }, 
          error: null 
        };
      } catch (error) {
        console.error('❌ Auth sign in error:', error);
        return { 
          data: { user: null, session: null }, 
          error: { message: error.message } 
        };
      }
    },
    
    // Sign out
    signOut: async () => {
      try {
        const session = sessionStorage.getItem('auth');
        if (!session) {
          return { error: null };
        }
        
        const authData = JSON.parse(session);
        const accessToken = authData.session?.access_token;
        
        if (accessToken) {
          const url = `${supabaseUrl}/auth/v1/logout`;
          await fetch(url, {
            method: 'POST',
            headers: {
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${accessToken}`
            }
          });
        }
        
        sessionStorage.removeItem('auth');
        console.log('✅ Auth sign out successful');
        return { error: null };
      } catch (error) {
        console.error('❌ Auth sign out error:', error);
        sessionStorage.removeItem('auth');
        return { error: { message: error.message } };
      }
    },
    
    // Get current session
    getSession: async () => {
      try {
        const session = sessionStorage.getItem('auth');
        if (!session) {
          return { data: { session: null }, error: null };
        }

        const authData = JSON.parse(session);

        // Return session with user object included (matching official Supabase API)
        if (authData.session) {
          return {
            data: {
              session: {
                ...authData.session,
                user: authData.user || null  // Include user in session
              }
            },
            error: null
          };
        }

        return { data: { session: null }, error: null };
      } catch (error) {
        return { data: { session: null }, error: { message: error.message } };
      }
    },
    
    // Get current user
    getUser: async () => {
      try {
        const session = sessionStorage.getItem('auth');
        if (!session) {
          return { data: { user: null }, error: null };
        }
        
        const authData = JSON.parse(session);
        return { 
          data: { 
            user: authData.user || null 
          }, 
          error: null 
        };
      } catch (error) {
        return { data: { user: null }, error: { message: error.message } };
      }
    },
    
    // Reset password for email
    resetPasswordForEmail: async (email) => {
      try {
        const url = `${supabaseUrl}/auth/v1/recover`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'apikey': supabaseAnonKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ Password reset error:', errorData);
          return { 
            data: null, 
            error: { 
              message: errorData.error_description || errorData.msg || 'Password reset failed',
              status: response.status
            } 
          };
        }
        
        console.log('✅ Password reset email sent');
        return { data: {}, error: null };
      } catch (error) {
        console.error('❌ Password reset error:', error);
        return { data: null, error: { message: error.message } };
      }
    },
    
    // Update user password
    updateUser: async ({ password }) => {
      try {
        const session = sessionStorage.getItem('auth');
        if (!session) {
          return { 
            data: { user: null }, 
            error: { message: 'No active session' } 
          };
        }
        
        const authData = JSON.parse(session);
        const accessToken = authData.session?.access_token;
        
        const url = `${supabaseUrl}/auth/v1/user`;
        
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ password })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ Update user error:', errorData);
          return { 
            data: { user: null }, 
            error: { 
              message: errorData.error_description || errorData.msg || 'Update failed',
              status: response.status
            } 
          };
        }
        
        const data = await response.json();
        console.log('✅ User updated successfully');
        return { data: { user: data }, error: null };
      } catch (error) {
        console.error('❌ Update user error:', error);
        return { data: { user: null }, error: { message: error.message } };
      }
    },
    
    // Verify OTP (for recovery tokens)
    verifyOtp: async ({ token_hash, type }) => {
      try {
        console.log('🔑 Verifying OTP token...');
        
        const url = `${supabaseUrl}/auth/v1/verify`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'apikey': supabaseAnonKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            token_hash,
            type
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ Verify OTP error:', errorData);
          return { 
            data: null, 
            error: { 
              message: errorData.error_description || errorData.msg || 'Invalid or expired token'
            } 
          };
        }
        
        const data = await response.json();
        console.log('✅ OTP verified successfully');
        
        // Store session in sessionStorage
        const session = {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          token_type: data.token_type || 'bearer',
          expires_in: data.expires_in || 3600
        };
        
        const authData = {
          user: data.user,
          session,
          profile: null
        };
        
        sessionStorage.setItem('auth', JSON.stringify(authData));
        
        return { data: { user: data.user, session }, error: null };
      } catch (error) {
        console.error('❌ Verify OTP error:', error);
        return { data: null, error: { message: error.message } };
      }
    },
    
    // Set session from tokens (for email links)
    setSession: async ({ access_token, refresh_token }) => {
      try {
        console.log('🔑 Setting session from tokens...');
        console.log('🔍 Token type check - access_token:', access_token?.substring(0, 20) + '...');
        
        // For recovery tokens, we need to verify them using verifyOtp endpoint
        const url = `${supabaseUrl}/auth/v1/verify`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'apikey': supabaseAnonKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            token_hash: access_token,
            type: 'recovery'
          })
        });
        
        console.log('🔍 Verify response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Set session error:', errorText);
          return { 
            data: { user: null, session: null }, 
            error: { 
              message: 'Invalid or expired token',
              status: response.status
            } 
          };
        }
        
        const data = await response.json();
        console.log('🔍 Verify response data:', data);
        
        // Create session object from response
        const session = {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          token_type: data.token_type || 'bearer',
          expires_in: data.expires_in || 3600
        };
        
        // Store in sessionStorage
        const authData = {
          user: data.user,
          session,
          profile: null // Will be fetched separately by authService
        };
        
        sessionStorage.setItem('auth', JSON.stringify(authData));
        
        console.log('✅ Session set successfully from recovery token');
        return { 
          data: { user: data.user, session }, 
          error: null 
        };
      } catch (error) {
        console.error('❌ Set session error:', error);
        return { 
          data: { user: null, session: null }, 
          error: { message: error.message } 
        };
      }
    }
  },

  // SESSION 76: Auth API support (full authentication)
  auth: {
    signInWithPassword: async ({ email, password }) => {
      try {
        const url = `${supabaseUrl}/auth/v1/token?grant_type=password`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'apikey': supabaseAnonKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ Auth error:', errorData);
          return {
            data: { user: null, session: null },
            error: { message: errorData.error_description || errorData.msg || 'Login failed' }
          };
        }

        const data = await response.json();
        
        // Store auth data in sessionStorage
        sessionStorage.setItem('auth', JSON.stringify({
          session: {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            user: data.user
          }
        }));

        console.log('✅ Login successful:', data.user?.email);

        return {
          data: {
            user: data.user,
            session: {
              access_token: data.access_token,
              refresh_token: data.refresh_token,
              user: data.user
            }
          },
          error: null
        };
      } catch (error) {
        console.error('❌ Login error:', error);
        return {
          data: { user: null, session: null },
          error: { message: error.message }
        };
      }
    },

    signOut: async () => {
      try {
        sessionStorage.removeItem('auth');
        console.log('✅ Logged out');
        return { error: null };
      } catch (error) {
        return { error: { message: error.message } };
      }
    },

    getSession: async () => {
      try {
        const authData = sessionStorage.getItem('auth');
        if (!authData) {
          return { data: { session: null }, error: null };
        }
        
        const auth = JSON.parse(authData);
        return { 
          data: { 
            session: auth.session || null 
          }, 
          error: null 
        };
      } catch (error) {
        return { data: { session: null }, error: null };
      }
    },
    
    getUser: async () => {
      try {
        const { data } = await supabase.auth.getSession();
        return { 
          data: { user: data.session?.user || null }, 
          error: null 
        };
      } catch (error) {
        return { data: { user: null }, error: null };
      }
    },

    // SESSION 79: Add refresh token functionality
    refreshSession: async () => {
      try {
        console.log('🔄 Attempting to refresh session...');
        
        const authData = sessionStorage.getItem('auth');
        if (!authData) {
          console.error('❌ No auth data found');
          return { data: { session: null }, error: { message: 'No session to refresh' } };
        }
        
        const auth = JSON.parse(authData);
        const refreshToken = auth.session?.refresh_token;
        
        if (!refreshToken) {
          console.error('❌ No refresh token found');
          return { data: { session: null }, error: { message: 'No refresh token' } };
        }
        
        console.log('🔑 Using refresh token to get new access token...');
        
        const url = `${supabaseUrl}/auth/v1/token?grant_type=refresh_token`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'apikey': supabaseAnonKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ refresh_token: refreshToken })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ Refresh token failed:', errorData);
          return { 
            data: { session: null }, 
            error: { message: errorData.error_description || 'Token refresh failed' } 
          };
        }
        
        const data = await response.json();
        
        const newSession = {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          token_type: data.token_type || 'bearer',
          expires_in: data.expires_in || 3600,
          user: data.user
        };
        
        const newAuthData = {
          session: newSession,
          user: data.user,
          profile: auth.profile || null,
          assets: auth.assets || null  // 🔧 PHASE 10 FIX: Preserve user assets during refresh
        };
        
        sessionStorage.setItem('auth', JSON.stringify(newAuthData));
        
        console.log('✅ Session refreshed successfully');
        return { data: { session: newSession }, error: null };
        
      } catch (error) {
        console.error('❌ Error refreshing session:', error);
        return { data: { session: null }, error: { message: error.message } };
      }
    },

    onAuthStateChange: (callback) => {
      // Simple implementation - just return unsubscribe function
      return {
        data: { subscription: { unsubscribe: () => {} } }
      };
    }
  },

  // Storage API for file uploads
  storage: {
    from(bucketName) {
      const getAuthToken = () => {
        const authData = sessionStorage.getItem('auth');
        if (authData) {
          try {
            const parsed = JSON.parse(authData);
            return parsed.session?.access_token || supabaseAnonKey;
          } catch {
            return supabaseAnonKey;
          }
        }
        return supabaseAnonKey;
      };

      return {
        // Upload a file to storage
        upload: async (path, file) => {
          try {
            const url = `${supabaseUrl}/storage/v1/object/${bucketName}/${path}`;
            let token = getAuthToken();

            console.log(`📤 Uploading file to: ${bucketName}/${path}`);

            let response = await fetch(url, {
              method: 'POST',
              headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${token}`
              },
              body: file
            });

            // SESSION 79: Auto-refresh on JWT expiry (check both 400 and 401)
            let wasRetried = false;
            if (!response.ok && (response.status === 400 || response.status === 401)) {
              const errorText = await response.text();
              if (errorText.includes('JWT expired') || errorText.includes('expired') || errorText.includes('exp')) {
                console.warn('⚠️ JWT expired during upload, refreshing...');
                const { data: sessionData, error: refreshError } = await supabase.auth.refreshSession();
                
                if (!refreshError && sessionData.session) {
                  console.log('✅ Session refreshed, retrying upload...');
                  token = sessionData.session.access_token;
                  wasRetried = true;
                  
                  response = await fetch(url, {
                    method: 'POST',
                    headers: {
                      'apikey': supabaseAnonKey,
                      'Authorization': `Bearer ${token}`
                    },
                    body: file
                  });
                  
                  console.log('🔄 Retry response status:', response.status);
                } else {
                  console.error('❌ Session refresh failed:', refreshError);
                }
              }
            }

            if (!response.ok) {
              let errorText;
              // Only read text if we didn't already read it during retry check
              if (wasRetried) {
                try {
                  errorText = await response.text();
                } catch (e) {
                  errorText = 'Upload failed after retry';
                }
              } else {
                errorText = 'Upload failed - check authentication';
              }
              console.error(`❌ Storage upload error ${response.status}:`, errorText);
              return {
                data: null,
                error: {
                  message: `Upload failed: ${response.status} ${errorText}`,
                  code: response.status.toString()
                }
              };
            }

            const data = await response.json();
            console.log('✅ File uploaded successfully');
            return { data, error: null };

          } catch (error) {
            console.error('❌ Storage upload error:', error);
            return {
              data: null,
              error: {
                message: error.message,
                code: 'UPLOAD_ERROR'
              }
            };
          }
        },

        // Get public URL for a file
        getPublicUrl: (path) => {
          const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${path}`;
          console.log(`🔗 Generated public URL: ${publicUrl}`);
          return {
            data: { publicUrl }
          };
        },

        // Create signed URL for private buckets (with expiration)
        createSignedUrl: async (path, expiresIn = 3600) => {
          try {
            const url = `${supabaseUrl}/storage/v1/object/sign/${bucketName}/${path}`;
            let token = getAuthToken();

            console.log(`🔐 Creating signed URL for: ${bucketName}/${path}`);

            let response = await fetch(url, {
              method: 'POST',
              headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ expiresIn })
            });

            // SESSION 79: Auto-refresh on JWT expiry
            if (!response.ok && response.status === 401) {
              const errorText = await response.text();
              if (errorText.includes('JWT expired') || errorText.includes('expired')) {
                console.warn('⚠️ JWT expired, refreshing for signed URL...');
                const { data: sessionData, error: refreshError } = await supabase.auth.refreshSession();
                
                if (!refreshError && sessionData.session) {
                  console.log('✅ Session refreshed, retrying signed URL...');
                  token = sessionData.session.access_token;
                  
                  response = await fetch(url, {
                    method: 'POST',
                    headers: {
                      'apikey': supabaseAnonKey,
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ expiresIn })
                  });
                }
              }
            }

            if (!response.ok) {
              const errorText = await response.text();
              console.error(`❌ Signed URL error ${response.status}:`, errorText);
              return {
                data: null,
                error: {
                  message: `Signed URL failed: ${response.status} ${errorText}`,
                  code: response.status.toString()
                }
              };
            }

            const data = await response.json();
            const signedUrl = `${supabaseUrl}/storage/v1${data.signedURL}`;

            console.log('✅ Signed URL created');
            return {
              data: { signedUrl },
              error: null
            };
          } catch (error) {
            console.error('❌ Signed URL error:', error);
            return {
              data: null,
              error: {
                message: error.message,
                code: 'SIGNED_URL_ERROR'
              }
            };
          }
        },

        // Delete a file from storage
        remove: async (paths) => {
          try {
            const pathsArray = Array.isArray(paths) ? paths : [paths];
            const url = `${supabaseUrl}/storage/v1/object/${bucketName}`;
            const token = getAuthToken();

            console.log(`🗑️ Deleting files from: ${bucketName}`, pathsArray);

            const response = await fetch(url, {
              method: 'DELETE',
              headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ prefixes: pathsArray })
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error(`❌ Storage delete error ${response.status}:`, errorText);
              return {
                data: null,
                error: {
                  message: `Delete failed: ${response.status} ${errorText}`,
                  code: response.status.toString()
                }
              };
            }

            const data = await response.json();
            console.log('✅ File(s) deleted successfully');
            return { data, error: null };

          } catch (error) {
            console.error('❌ Storage delete error:', error);
            return {
              data: null,
              error: {
                message: error.message,
                code: 'DELETE_ERROR'
              }
            };
          }
        }
      };
    }
  }
};

// Create query methods that can be chained
function createQueryMethods(builder) {
  return {
    eq: (column, value) => {
      builder.eq(column, value);
      return createQueryMethods(builder);
    },
    ilike: (column, value) => {
      builder.ilike(column, value);
      return createQueryMethods(builder);
    },
    gte: (column, value) => {
      builder.gte(column, value);
      return createQueryMethods(builder);
    },
    lte: (column, value) => {
      builder.lte(column, value);
      return createQueryMethods(builder);
    },
    or: (filterString) => {
      builder.or(filterString);
      return createQueryMethods(builder);
    },
    order: (column, options) => {
      builder.order(column, options);
      return createQueryMethods(builder);
    },
    limit: (count) => {
      builder.limit(count);
      return createQueryMethods(builder);
    },
    select: (fields = '*') => {
      builder.selectFields = fields;
      return createQueryMethods(builder);
    },
    single: () => {
      builder.single();
      return createQueryMethods(builder);
    },
    then: (onResolve, onReject) => {
      return executeQuery(builder).then(onResolve, onReject);
    }
  };
}

// Execute the query
async function executeQuery(builder) {
  try {
    const url = builder.buildUrl();
    const options = builder.buildRequestOptions();
    
    console.log(`🔍 Supabase ${builder.method} request:`, url);
    
    let response = await fetch(url, options);
    
    // SESSION 79: Auto-refresh on JWT expiry (401)
    if (!response.ok && response.status === 401) {
      const errorText = await response.text();
      
      if (errorText.includes('JWT expired') || errorText.includes('PGRST303')) {
        console.warn('⚠️ JWT expired, attempting to refresh session...');
        
        const { data: sessionData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (!refreshError && sessionData.session) {
          console.log('✅ Session refreshed, retrying request...');
          
          const newOptions = builder.buildRequestOptions();
          response = await fetch(url, newOptions);
          
          if (!response.ok) {
            const retryErrorText = await response.text();
            console.error(`❌ Supabase error ${response.status} after refresh:`, retryErrorText);
            return { 
              data: null, 
              error: { 
                message: `Supabase request failed after refresh: ${response.status} ${retryErrorText}`,
                code: response.status.toString()
              } 
            };
          }
        } else {
          console.error('❌ Failed to refresh session:', refreshError);
          return {
            data: null,
            error: {
              message: 'Session expired and refresh failed. Please log in again.',
              code: '401'
            }
          };
        }
      }
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Supabase error ${response.status}:`, errorText);
      return { 
        data: null, 
        error: { 
          message: `Supabase request failed: ${response.status} ${errorText}`,
          code: response.status.toString()
        } 
      };
    }

    const data = await response.json();
    
    // Handle single result
    if (builder.singleResult) {
      if (!data || data.length === 0) {
        return {
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' }
        };
      }
      return { data: data[0], error: null };
    }

    return { data, error: null };
    
  } catch (error) {
    console.error('❌ Supabase request error:', error);
    return { 
      data: null, 
      error: { 
        message: error.message,
        code: 'NETWORK_ERROR'
      } 
    };
  }
}

// Export for debugging and global access
if (typeof window !== 'undefined') {
  window.supabase = supabase;  // Primary export for compatibility
  window.supabaseClient = supabase;  // Backup export
  window.supabaseUrl = supabaseUrl;
  console.log('✅ Supabase client loaded and available at window.supabase');
}

// SESSION 76: Export for ES6 modules
// This file can be loaded as either a module or script tag
// When loaded as script tag, the export statement is ignored
export { supabase, supabaseUrl };