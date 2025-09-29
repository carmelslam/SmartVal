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
    
    // Add select fields
    if (this.selectFields !== '*') {
      params.append('select', this.selectFields);
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

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.supabase = supabase;  // Main export for SmartPartsSearchService
  window.supabaseClient = supabase;  // Backup export
  window.supabaseUrl = supabaseUrl;
  console.log('✅ Supabase client loaded and available at window.supabase');
}