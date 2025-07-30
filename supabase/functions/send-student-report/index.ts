import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// HTML email template for student progress report
const createEmailTemplate = (studentData: any, analytics: any) => {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Progress Report - ${studentData.name}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 28px;
            font-weight: 600;
        }
        .header p {
            margin: 0;
            opacity: 0.9;
            font-size: 16px;
        }
        .content {
            padding: 30px 20px;
        }
        .student-info {
            background-color: #f1f5f9;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid #3b82f6;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 15px;
            margin: 25px 0;
        }
        .metric-card {
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 5px;
        }
        .metric-label {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .section {
            margin: 30px 0;
        }
        .section-title {
            font-size: 20px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e2e8f0;
        }
        .progress-bar {
            width: 100%;
            height: 8px;
            background-color: #e2e8f0;
            border-radius: 4px;
            overflow: hidden;
            margin: 10px 0;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #10b981 0%, #059669 100%);
            transition: width 0.3s ease;
        }
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 12px;
            margin: 15px 0;
        }
        .status-item {
            padding: 12px;
            border-radius: 6px;
            text-align: center;
            font-size: 14px;
        }
        .status-completed {
            background-color: #d1fae5;
            color: #065f46;
        }
        .status-working {
            background-color: #dbeafe;
            color: #1e40af;
        }
        .status-help {
            background-color: #fed7d7;
            color: #991b1b;
        }
        .status-review {
            background-color: #fef3c7;
            color: #92400e;
        }
        .subject-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            background-color: #f8fafc;
            border-radius: 6px;
            margin-bottom: 10px;
            border-left: 3px solid #3b82f6;
        }
        .subject-name {
            font-weight: 500;
            color: #1e293b;
        }
        .subject-stats {
            font-size: 14px;
            color: #64748b;
        }
        .attendance-summary {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #bae6fd;
        }
        .footer {
            background-color: #f1f5f9;
            padding: 20px;
            text-align: center;
            font-size: 14px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
        }
        .footer a {
            color: #3b82f6;
            text-decoration: none;
        }
        .highlight {
            background-color: #fef3c7;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 500;
        }
        @media only screen and (max-width: 600px) {
            .metrics-grid {
                grid-template-columns: repeat(2, 1fr);
            }
            .status-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Student Progress Report</h1>
            <p>Academic Performance Summary</p>
        </div>

        <div class="content">
            <div class="student-info">
                <h2 style="margin: 0 0 10px 0; color: #1e293b;">👨‍🎓 ${studentData.name}</h2>
                <p style="margin: 0; color: #64748b;">
                    <strong>Report Date:</strong> ${currentDate}<br>
                    ${studentData.grade ? `<strong>Grade:</strong> ${studentData.grade}<br>` : ''}
                    ${studentData.email ? `<strong>Email:</strong> ${studentData.email}` : ''}
                </p>
            </div>

            <!-- Key Metrics -->
            <div class="section">
                <h3 class="section-title">📈 Key Performance Metrics</h3>
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-value">${analytics.totalTasks}</div>
                        <div class="metric-label">Total Tasks</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${analytics.completionRate}%</div>
                        <div class="metric-label">Completion Rate</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${analytics.attendanceRate}%</div>
                        <div class="metric-label">Attendance Rate</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${analytics.subjectCount}</div>
                        <div class="metric-label">Active Subjects</div>
                    </div>
                </div>

                <!-- Overall Progress Bar -->
                <div style="margin-top: 20px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span style="font-weight: 500;">Overall Progress</span>
                        <span style="color: #10b981; font-weight: 600;">${analytics.completionRate}% Complete</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${analytics.completionRate}%;"></div>
                    </div>
                </div>
            </div>

            <!-- Task Status Breakdown -->
            <div class="section">
                <h3 class="section-title">📋 Task Status Breakdown</h3>
                <div class="status-grid">
                    <div class="status-item status-completed">
                        <div style="font-weight: bold; font-size: 18px;">${analytics.tasksByStatus.completed.length}</div>
                        <div>✅ Completed</div>
                    </div>
                    <div class="status-item status-working">
                        <div style="font-weight: bold; font-size: 18px;">${analytics.tasksByStatus.working.length}</div>
                        <div>⚡ Working</div>
                    </div>
                    <div class="status-item status-help">
                        <div style="font-weight: bold; font-size: 18px;">${analytics.tasksByStatus.needHelp.length}</div>
                        <div>🆘 Need Help</div>
                    </div>
                    <div class="status-item status-review">
                        <div style="font-weight: bold; font-size: 18px;">${analytics.tasksByStatus.readyReview.length}</div>
                        <div>👀 Ready Review</div>
                    </div>
                </div>
            </div>

            <!-- Subject Performance -->
            <div class="section">
                <h3 class="section-title">📚 Performance by Subject</h3>
                ${Object.entries(analytics.tasksBySubject).map(([subject, data]: [string, any]) => {
                  const completionRate = Math.round((data.completed / data.total) * 100) || 0;
                  return `
                    <div class="subject-item">
                        <div>
                            <div class="subject-name">${subject}</div>
                            <div class="subject-stats">${data.completed}/${data.total} tasks completed</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: bold; color: ${completionRate >= 80 ? '#059669' : completionRate >= 60 ? '#d97706' : '#dc2626'};">
                                ${completionRate}%
                            </div>
                            <div style="font-size: 12px; color: #64748b;">
                                ${completionRate >= 80 ? 'Excellent' : completionRate >= 60 ? 'Good' : 'Needs Focus'}
                            </div>
                        </div>
                    </div>
                  `;
                }).join('')}
            </div>

            <!-- Attendance Summary -->
            <div class="section">
                <h3 class="section-title">📅 Attendance Summary</h3>
                <div class="attendance-summary">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; text-align: center;">
                        <div>
                            <div style="font-size: 24px; font-weight: bold; color: #059669;">${analytics.presentDays}</div>
                            <div style="color: #064e3b;">Days Present</div>
                        </div>
                        <div>
                            <div style="font-size: 24px; font-weight: bold; color: #dc2626;">${analytics.totalAttendanceDays - analytics.presentDays}</div>
                            <div style="color: #7f1d1d;">Days Absent</div>
                        </div>
                        <div>
                            <div style="font-size: 24px; font-weight: bold; color: #1d4ed8;">${analytics.attendanceRate}%</div>
                            <div style="color: #1e40af;">Attendance Rate</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Insights & Recommendations -->
            ${analytics.completionRate >= 80 ? `
            <div class="section">
                <h3 class="section-title">🌟 Highlights</h3>
                <div style="background-color: #d1fae5; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
                    <p style="margin: 0; color: #064e3b;">
                        <strong>Excellent Performance!</strong> ${studentData.name} is demonstrating outstanding academic progress with a <span class="highlight">${analytics.completionRate}% completion rate</span>. Keep up the great work!
                    </p>
                </div>
            </div>
            ` : analytics.tasksByStatus.needHelp.length > 0 ? `
            <div class="section">
                <h3 class="section-title">💡 Recommendations</h3>
                <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                    <p style="margin: 0; color: #92400e;">
                        <strong>Support Needed:</strong> ${studentData.name} currently has <span class="highlight">${analytics.tasksByStatus.needHelp.length} task${analytics.tasksByStatus.needHelp.length > 1 ? 's' : ''}</span> where they need assistance. Consider scheduling extra support or review sessions.
                    </p>
                </div>
            </div>
            ` : ''}
        </div>

        <div class="footer">
            <p>This report was automatically generated by the <strong>Student Progress Tracking System</strong></p>
            <p>Generated on ${currentDate} | For questions, please contact your child's teacher</p>
            <p style="margin-top: 15px; font-size: 12px; color: #94a3b8;">
                🔒 This report contains confidential student information and should be handled according to your school's privacy policy.
            </p>
        </div>
    </div>
</body>
</html>
  `;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the request is from an authenticated user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user has admin or teacher role
    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'teacher'])
      .single()

    if (!userRole) {
      return new Response(
        JSON.stringify({ error: 'Admin or teacher access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { recipientEmail, studentData, analytics, senderName } = await req.json()

    if (!recipientEmail || !studentData || !analytics) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Resend API key from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not found in environment variables')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the email HTML
    const emailHtml = createEmailTemplate(studentData, analytics)

    // Send email using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Student Progress Reports <reports@yourdomain.com>', // You'll need to configure this domain
        to: [recipientEmail],
        subject: `📊 Student Progress Report - ${studentData.name}`,
        html: emailHtml,
        text: `
Student Progress Report for ${studentData.name}

Generated on: ${new Date().toLocaleDateString()}

KEY METRICS:
• Total Tasks: ${analytics.totalTasks}
• Completion Rate: ${analytics.completionRate}%
• Attendance Rate: ${analytics.attendanceRate}%
• Active Subjects: ${analytics.subjectCount}

TASK BREAKDOWN:
• Completed: ${analytics.tasksByStatus.completed.length}
• Working: ${analytics.tasksByStatus.working.length}
• Need Help: ${analytics.tasksByStatus.needHelp.length}
• Ready for Review: ${analytics.tasksByStatus.readyReview.length}

SUBJECT PERFORMANCE:
${Object.entries(analytics.tasksBySubject).map(([subject, data]: [string, any]) => 
  `• ${subject}: ${data.completed}/${data.total} completed (${Math.round((data.completed / data.total) * 100) || 0}%)`
).join('\n')}

ATTENDANCE:
• Present: ${analytics.presentDays} out of ${analytics.totalAttendanceDays} days
• Rate: ${analytics.attendanceRate}%

This report was generated by the Student Progress Tracking System.
For questions, please contact your child's teacher.
        `.trim(),
        reply_to: user.email || undefined
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text()
      console.error('Resend API error:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: errorData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const emailResult = await emailResponse.json()
    console.log('Email sent successfully:', emailResult)

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResult.id,
        message: `Progress report sent successfully to ${recipientEmail}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 