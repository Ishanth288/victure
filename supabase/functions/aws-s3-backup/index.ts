import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

interface BackupRequest {
  backup_type: 'full' | 'user_specific' | 'auth_only'
  user_id?: string
  include_auth_data?: boolean
}

interface BackupLog {
  backup_date: string
  backup_type: string
  status: string
  file_name: string
  total_records: number
  user_id?: string
  s3_url?: string
}

// AWS S3 Upload Function
async function uploadToS3(data: any, fileName: string): Promise<string> {
  const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID!
  const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY!
  const AWS_REGION = process.env.AWS_REGION || 'ap-south-1'
  const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'victure-backup'
  
  console.log('AWS Configuration:', {
    hasAccessKey: !!AWS_ACCESS_KEY_ID,
    hasSecretKey: !!AWS_SECRET_ACCESS_KEY,
    region: AWS_REGION,
    bucket: S3_BUCKET_NAME
  })
  
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS credentials not configured')
  }

  const jsonString = JSON.stringify(data, null, 2)
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(jsonString)
  
  // Create AWS signature v4
  const timestamp = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '')
  const date = timestamp.substr(0, 8)
  
  const host = `${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com`
  const url = `https://${host}/${fileName}`
  
  // Create canonical request
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:UNSIGNED-PAYLOAD\nx-amz-date:${timestamp}\n`
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date'
  const canonicalRequest = `PUT\n/${fileName}\n\n${canonicalHeaders}\n${signedHeaders}\nUNSIGNED-PAYLOAD`
  
  // Create string to sign
  const algorithm = 'AWS4-HMAC-SHA256'
  const credentialScope = `${date}/${AWS_REGION}/s3/aws4_request`
  const stringToSign = `${algorithm}\n${timestamp}\n${credentialScope}\n${await sha256(canonicalRequest)}`
  
  // Calculate signature
  const signingKey = await getSignatureKey(AWS_SECRET_ACCESS_KEY, date, AWS_REGION, 's3')
  const signature = await hmacSha256(signingKey, stringToSign)
  
  // Create authorization header
  const authorization = `${algorithm} Credential=${AWS_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
  
  // Upload to S3
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Host': host,
      'X-Amz-Date': timestamp,
      'X-Amz-Content-Sha256': 'UNSIGNED-PAYLOAD',
      'Authorization': authorization,
      'Content-Type': 'application/json',
      'Content-Length': dataBuffer.length.toString()
    },
    body: dataBuffer
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`S3 upload failed: ${response.status} ${response.statusText} - ${errorText}`)
  }
  
  return url
}

// Helper functions for AWS signature
async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function hmacSha256(key: Uint8Array, message: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyObject = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', keyObject, encoder.encode(message))
  const signatureArray = Array.from(new Uint8Array(signature))
  return signatureArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string): Promise<Uint8Array> {
  const encoder = new TextEncoder()
  
  const kDate = await crypto.subtle.importKey(
    'raw',
    encoder.encode('AWS4' + key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const kDateSig = await crypto.subtle.sign('HMAC', kDate, encoder.encode(dateStamp))
  
  const kRegion = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(kDateSig),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const kRegionSig = await crypto.subtle.sign('HMAC', kRegion, encoder.encode(regionName))
  
  const kService = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(kRegionSig),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const kServiceSig = await crypto.subtle.sign('HMAC', kService, encoder.encode(serviceName))
  
  const kSigning = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(kServiceSig),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const kSigningSig = await crypto.subtle.sign('HMAC', kSigning, encoder.encode('aws4_request'))
  
  return new Uint8Array(kSigningSig)
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { backup_type, user_id, include_auth_data = false }: BackupRequest = await req.json()
    
    console.log(`Starting ${backup_type} backup to AWS S3`, { user_id, include_auth_data })
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    let fileName = `backup-${backup_type}-${timestamp}.json`
    let totalRecords = 0
    let backupData: any = {}
    
    // Core tables to backup
    const coreTables = ['bills', 'patients', 'inventory', 'purchase_orders', 'medicine_returns', 'system_settings']
    
    try {
      if (backup_type === 'user_specific' && user_id) {
        // User-specific backup
        fileName = `user-backup-${user_id}-${timestamp}.json`
        
        for (const table of coreTables) {
          try {
            let query = supabase.from(table).select('*')
            
            // Apply user filter for tables that have user_id
            if (['bills', 'patients', 'inventory', 'purchase_orders', 'medicine_returns'].includes(table)) {
              query = query.eq('user_id', user_id)
            }
            
            const { data, error } = await query
            
            if (error) {
              console.error(`Error fetching ${table}:`, error)
              continue
            }
            
            if (data && data.length > 0) {
              backupData[table] = data
              totalRecords += data.length
              console.log(`Backed up ${data.length} records from ${table} for user ${user_id}`)
            }
          } catch (tableError) {
            console.error(`Error processing table ${table}:`, tableError)
          }
        }
        
        // Include user profile if requested
        if (include_auth_data) {
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user_id)
            
            if (!profileError && profileData) {
              backupData.user_profile = profileData
              totalRecords += profileData.length
            }
          } catch (profileError) {
            console.error('Error fetching user profile:', profileError)
          }
        }
        
      } else if (backup_type === 'auth_only') {
        // Authentication data only backup
        fileName = `auth-backup-${timestamp}.json`
        
        try {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
          
          if (!profilesError && profilesData) {
            backupData.profiles = profilesData
            totalRecords += profilesData.length
          }
          
          // Get user metadata from auth.users (limited access)
          const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers()
          
          if (!usersError && usersData.users) {
            // Only include essential user data, not sensitive info
            backupData.auth_users = usersData.users.map(user => ({
              id: user.id,
              email: user.email,
              created_at: user.created_at,
              updated_at: user.updated_at,
              email_confirmed_at: user.email_confirmed_at,
              last_sign_in_at: user.last_sign_in_at
            }))
            totalRecords += usersData.users.length
          }
        } catch (authError) {
          console.error('Error fetching auth data:', authError)
        }
        
      } else {
        // Full backup - all data organized by user
        fileName = `full-backup-${timestamp}.json`
        
        // Get all users first
        const { data: allUsers, error: usersError } = await supabase.auth.admin.listUsers()
        
        if (usersError) {
          throw new Error(`Failed to fetch users: ${usersError.message}`)
        }
        
        backupData.users = {}
        
        // Backup data for each user
        for (const user of allUsers.users) {
          backupData.users[user.id] = {
            user_info: {
              id: user.id,
              email: user.email,
              created_at: user.created_at,
              updated_at: user.updated_at,
              email_confirmed_at: user.email_confirmed_at,
              last_sign_in_at: user.last_sign_in_at
            },
            data: {}
          }
          
          // Get user profile
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
            
            if (profileData && profileData.length > 0) {
              backupData.users[user.id].data.profile = profileData[0]
              totalRecords += 1
            }
          } catch (error) {
            console.error(`Error fetching profile for user ${user.id}:`, error)
          }
          
          // Get user-specific data from core tables
          for (const table of coreTables) {
            try {
              let query = supabase.from(table).select('*')
              
              // Apply user filter for tables that have user_id
              if (['bills', 'patients', 'inventory', 'purchase_orders', 'medicine_returns'].includes(table)) {
                query = query.eq('user_id', user.id)
              }
              
              const { data, error } = await query
              
              if (!error && data && data.length > 0) {
                backupData.users[user.id].data[table] = data
                totalRecords += data.length
              }
            } catch (tableError) {
              console.error(`Error processing table ${table} for user ${user.id}:`, tableError)
            }
          }
        }
        
        // Add system-wide data (not user-specific)
        try {
          const { data: systemSettings } = await supabase
            .from('system_settings')
            .select('*')
          
          if (systemSettings && systemSettings.length > 0) {
            backupData.system_settings = systemSettings
            totalRecords += systemSettings.length
          }
        } catch (error) {
          console.error('Error fetching system settings:', error)
        }
      }
      
      // Add metadata to backup
      backupData.backup_metadata = {
        backup_type,
        timestamp,
        total_records: totalRecords,
        user_id: user_id || null,
        include_auth_data,
        version: '3.0',
        storage: 'aws-s3'
      }
      
      // Upload to AWS S3
      console.log(`Uploading backup to S3: ${fileName}`)
      const s3Url = await uploadToS3(backupData, fileName)
      console.log(`Backup uploaded successfully to S3: ${s3Url}`)
      
      // Log the backup operation
      const backupLog: BackupLog = {
        backup_date: new Date().toISOString(),
        backup_type,
        status: 'completed',
        file_name: fileName,
        total_records: totalRecords,
        user_id: user_id || undefined,
        s3_url: s3Url
      }
      
      // Try to insert backup log
      try {
        await supabase.from('backup_logs').insert(backupLog)
      } catch (logError) {
        console.warn('Could not log backup (backup_logs table might not exist):', logError)
      }
      
      console.log(`AWS S3 backup completed: ${fileName}, ${totalRecords} total records, URL: ${s3Url}`)
      
      return new Response(
        JSON.stringify({
          success: true,
          message: `${backup_type} backup completed successfully and uploaded to AWS S3`,
          file_name: fileName,
          total_records: totalRecords,
          s3_url: s3Url,
          backup_size: JSON.stringify(backupData).length
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
      
    } catch (backupError) {
      console.error('Backup operation failed:', backupError)
      
      // Log failed backup
      try {
        await supabase.from('backup_logs').insert({
          backup_date: new Date().toISOString(),
          backup_type,
          status: 'failed',
          file_name: fileName,
          total_records: 0,
          user_id: user_id || null,
          s3_url: null
        })
      } catch (logError) {
        console.warn('Could not log failed backup:', logError)
      }
      
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Backup operation failed',
          error: backupError.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }
    
  } catch (error) {
    console.error('Request processing error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Request processing failed',
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})