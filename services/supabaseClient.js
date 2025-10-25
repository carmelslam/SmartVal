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
    this.upsertConflict = null; // SESSION 39: For upsert conflict resolution
    this.params = new URLSearchParams(); // SESSION 40: Initialize params for upsert
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
    // Don't encode the % wildcards, only encode the inner content
    if (value.startsWith('%') && value.endsWith('%')) {
      const innerValue = value.slice(1, -1);
      // For Hebrew text, we need to ensure proper UTF-8 encoding
      const encodedInner = encodeURIComponent(innerValue);
      this.filters.push(`${column}=ilike.%${encodedInner}%`);
    } else {
      const encodedValue = encodeURIComponent(value);
      this.filters.push(`${column}=ilike.${encodedValue}`);
    }
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

  not(column, operator, value) {
    this.filters.push(`${column}=not.${operator}.${encodeURIComponent(value)}`);
    return this;
  }

  or(conditions) {
    // Handle OR conditions like: "col1.ilike.%term%,col2.ilike.%term%"
    this.filters.push(`or=(${conditions})`);
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

  // SESSION 39: Add upsert support for PostgreSQL ON CONFLICT
  upsert(data, options = {}) {
    this.method = 'POST';
    this.insertData = data;
    this.upsertConflict = options.onConflict || null; // Column(s) to check for conflict
    return this;
  }

  delete() {
    this.method = 'DELETE';
    return this;
  }

  // Build the URL for the request
  buildUrl() {
    let url = `${supabaseUrl}/rest/v1/${this.table}`;
    
    // SESSION 40: Use this.params (class property) instead of local variable
    this.params = new URLSearchParams(); // Reset params each time
    
    // Add select fields
    if (this.selectFields !== '*') {
      this.params.append('select', this.selectFields);
    }
    
    // Add filters
    this.filters.forEach(filter => {
      const [key, value] = filter.split('=');
      this.params.append(key, value);
    });
    
    // Add order
    if (this.orderBy) {
      this.params.append('order', this.orderBy);
    }
    
    // Add limit
    if (this.limitCount) {
      this.params.append('limit', this.limitCount);
    }
    
    // SESSION 40 FIX: Add on_conflict for UPSERT **BEFORE** converting to string
    if (this.upsertConflict && this.method === 'POST') {
      this.params.append('on_conflict', this.upsertConflict);
    }

    const paramString = this.params.toString();
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
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json',
        'Accept-Charset': 'utf-8',
        'Prefer': 'return=representation'
      }
    };

    // SESSION 40 FIX: Add upsert Prefer header with correct PostgREST syntax
    if (this.upsertConflict && this.method === 'POST') {
      // PostgREST requires: resolution=merge-duplicates AND return=representation
      options.headers['Prefer'] = 'resolution=merge-duplicates,return=representation';
      // NOTE: on_conflict param is added in buildUrl() before URL is finalized
    }

    if (this.insertData && (this.method === 'POST' || this.method === 'PATCH')) {
      options.body = JSON.stringify(this.insertData);
    }

    return options;
  }
}

// Simple Supabase client that mimics the official API
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
          not: (column, operator, value) => {
            builder.not(column, operator, value);
            return createQueryMethods(builder);
          },
          or: (conditions) => {
            builder.or(conditions);
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
            builder.select(fields);
            return {
              single: () => {
                builder.single();
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
      
      // SESSION 39: Add upsert method to supabase.from() API
      upsert: (data, options = {}) => {
        const builder = new SupabaseQueryBuilder(table);
        builder.upsert(data, options);
        return {
          select: (fields = '*') => {
            builder.select(fields);
            return {
              single: () => {
                builder.single();
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
  
  // RPC (Remote Procedure Call) support for PostgreSQL functions
  rpc: async (functionName, params = {}) => {
    try {
      const url = `${supabaseUrl}/rest/v1/rpc/${functionName}`;
      const options = {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(params)
      };

      console.log(`🔍 Supabase RPC request:`, functionName, params);
      
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Supabase RPC error ${response.status}:`, errorText);
        return { 
          data: null, 
          error: { 
            message: `RPC ${functionName} failed: ${response.status} ${errorText}`,
            code: response.status.toString()
          } 
        };
      }

      const data = await response.json();
      console.log(`✅ RPC ${functionName} success:`, data?.length || 0, 'results');
      
      return { data, error: null };
      
    } catch (error) {
      console.error('❌ RPC request error:', error);
      return { 
        data: null, 
        error: { 
          message: error.message,
          code: 'NETWORK_ERROR'
        } 
      };
    }
  },

  // Real-time subscriptions (simplified for now)
  channel: (name) => {
    return {
      on: () => ({ subscribe: () => {} }),
      unsubscribe: () => {}
    };
  },

  // SESSION 76: Auth API support (for invoice module)
  auth: {
    getSession: async () => {
      try {
        const url = `${supabaseUrl}/auth/v1/user`;
        const token = localStorage.getItem('supabase.auth.token');
        
        if (!token) {
          return { data: { session: null }, error: null };
        }

        const response = await fetch(url, {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          return { data: { session: null }, error: null };
        }

        const user = await response.json();
        return { 
          data: { 
            session: { user } 
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
    }
  },

  // SESSION 29: Storage API support
  storage: {
    from: (bucketName) => {
      return {
        upload: async (path, file, options = {}) => {
          try {
            const url = `${supabaseUrl}/storage/v1/object/${bucketName}/${path}`;
            const formData = new FormData();
            formData.append('file', file);

            const headers = {
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${supabaseAnonKey}`
            };

            if (options.contentType) {
              headers['Content-Type'] = options.contentType;
            }

            if (options.upsert) {
              headers['x-upsert'] = 'true';
            }

            console.log(`📤 SESSION 29: Uploading to storage: ${bucketName}/${path}`);

            const response = await fetch(url, {
              method: 'POST',
              headers: headers,
              body: file
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error(`❌ SESSION 29: Storage upload error ${response.status}:`, errorText);
              return {
                data: null,
                error: {
                  message: `Storage upload failed: ${response.status} ${errorText}`,
                  code: response.status.toString()
                }
              };
            }

            const data = await response.json();
            console.log(`✅ SESSION 29: Storage upload successful:`, data);
            return { data, error: null };

          } catch (error) {
            console.error('❌ SESSION 29: Storage upload error:', error);
            return {
              data: null,
              error: {
                message: error.message,
                code: 'NETWORK_ERROR'
              }
            };
          }
        },

        getPublicUrl: (path) => {
          const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${path}`;
          console.log(`🔗 SESSION 29: Generated public URL:`, publicUrl);
          return {
            data: {
              publicUrl: publicUrl
            }
          };
        },

        download: async (path) => {
          try {
            const url = `${supabaseUrl}/storage/v1/object/${bucketName}/${path}`;
            const response = await fetch(url, {
              headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`
              }
            });

            if (!response.ok) {
              const errorText = await response.text();
              return {
                data: null,
                error: {
                  message: `Download failed: ${response.status} ${errorText}`,
                  code: response.status.toString()
                }
              };
            }

            const blob = await response.blob();
            return { data: blob, error: null };

          } catch (error) {
            return {
              data: null,
              error: {
                message: error.message,
                code: 'NETWORK_ERROR'
              }
            };
          }
        },

        remove: async (paths) => {
          try {
            const url = `${supabaseUrl}/storage/v1/object/${bucketName}`;
            const response = await fetch(url, {
              method: 'DELETE',
              headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ prefixes: paths })
            });

            if (!response.ok) {
              const errorText = await response.text();
              return {
                data: null,
                error: {
                  message: `Remove failed: ${response.status} ${errorText}`,
                  code: response.status.toString()
                }
              };
            }

            const data = await response.json();
            return { data, error: null };

          } catch (error) {
            return {
              data: null,
              error: {
                message: error.message,
                code: 'NETWORK_ERROR'
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
    not: (column, operator, value) => {
      builder.not(column, operator, value);
      return createQueryMethods(builder);
    },
    or: (conditions) => {
      builder.or(conditions);
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
    console.log(`🔍 Request URL breakdown:`, {
      table: builder.table,
      filters: builder.filters,
      selectFields: builder.selectFields
    });
    
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

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.supabase = supabase;  // Main export for SmartPartsSearchService
  window.supabaseClient = supabase;  // Backup export
  window.supabaseUrl = supabaseUrl;
  console.log('✅ Supabase client loaded and available at window.supabase');
}