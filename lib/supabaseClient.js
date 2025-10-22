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
    const options = {
      method: this.method,
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
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
export const supabase = {
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
        return { 
          data: { 
            session: authData.session || null 
          }, 
          error: null 
        };
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
    
    const response = await fetch(url, options);
    
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

// Export for debugging
if (typeof window !== 'undefined') {
  window.supabaseClient = supabase;
  window.supabaseUrl = supabaseUrl;
}