# Email Service Setup Guide

## Overview
The Student Progress Tracker now includes a professional email service that sends beautifully formatted HTML reports directly from the application. This guide will help you set up the email functionality.

## Features
- 📧 **Professional HTML Emails**: Rich, responsive email templates with charts and analytics
- 🎨 **Beautiful Design**: Modern styling with progress bars, metrics, and color-coded status indicators
- 📊 **Complete Analytics**: Full student progress data including tasks, attendance, and subject performance
- 🔒 **Secure**: Only admins and teachers can send reports, with proper authentication
- 📱 **Mobile Responsive**: Emails look great on all devices
- 💾 **Fallback Support**: Automatically falls back to mailto if service is unavailable

## Setup Instructions

### 1. Sign up for Resend
1. Go to [resend.com](https://resend.com)
2. Create a free account (10,000 emails/month free tier)
3. Verify your email address

### 2. Configure Your Domain (Optional but Recommended)
1. In Resend dashboard, go to "Domains"
2. Add your school's domain (e.g., `yourschool.edu`)
3. Follow DNS verification steps
4. This allows emails to be sent from `reports@yourschool.edu`

### 3. Get Your API Key
1. In Resend dashboard, go to "API Keys"
2. Create a new API key
3. Copy the key (starts with `re_`)

### 4. Configure Supabase Environment Variables
1. Go to your Supabase project dashboard
2. Navigate to Settings > Environment Variables
3. Add a new environment variable:
   - **Name**: `RESEND_API_KEY`
   - **Value**: Your Resend API key from step 3

### 5. Update the Email Domain (Optional)
If you configured a custom domain in step 2, update the Edge Function:

1. Open `supabase/functions/send-student-report/index.ts`
2. Find line ~390: `from: 'Student Progress Reports <reports@yourdomain.com>'`
3. Replace `yourdomain.com` with your actual domain

### 6. Deploy the Edge Function
```bash
# Deploy the new email function
npx supabase functions deploy send-student-report

# Or deploy all functions
npx supabase functions deploy
```

## Testing the Email Service

### 1. Test Basic Functionality
1. Log in as an admin or teacher
2. Go to Analytics → Click any student row
3. Enter an email address in the "Share via Email" section
4. Click "Send Report"
5. Check if the email was received

### 2. Test Fallback Behavior
To test the mailto fallback (when email service is unavailable):
1. Temporarily remove the `RESEND_API_KEY` environment variable
2. Try sending an email - it should fall back to opening your email client
3. Restore the environment variable when done testing

## Email Template Preview

The sent emails include:
- **Header**: Professional header with school branding
- **Student Info**: Name, grade, report date
- **Key Metrics**: Total tasks, completion rate, attendance rate, active subjects
- **Progress Bar**: Visual representation of overall progress
- **Task Breakdown**: Completed, working, need help, ready for review
- **Subject Performance**: Detailed breakdown by subject with completion rates
- **Attendance Summary**: Days present, absent, attendance rate
- **Smart Insights**: Automatic recommendations based on performance
- **Footer**: Professional footer with privacy notice

## Troubleshooting

### Email Not Sending
1. **Check API Key**: Ensure `RESEND_API_KEY` is correctly set in Supabase
2. **Check Domain**: Make sure the `from` email domain is verified in Resend
3. **Check Permissions**: Ensure you're logged in as admin or teacher
4. **Check Logs**: View Supabase Edge Function logs for detailed error messages

### Email Going to Spam
1. **Domain Verification**: Use a verified domain instead of the default
2. **SPF/DKIM**: Configure proper DNS records (Resend provides these)
3. **Content**: The current template is designed to avoid spam filters

### Recipients Not Receiving Emails
1. **Check Spelling**: Verify email addresses are correct
2. **Check Spam Folder**: Emails might be filtered
3. **Domain Reputation**: New domains may have delivery issues initially

## Security Considerations

- ✅ Only authenticated users with admin/teacher roles can send emails
- ✅ Email content is sanitized and templated
- ✅ API keys are stored securely in Supabase environment variables
- ✅ Sensitive student data is only included in the report itself

## Cost Considerations

- **Resend Free Tier**: 10,000 emails/month
- **Paid Plans**: Start at $20/month for 50,000 emails
- **Typical Usage**: Small school (100 students) ≈ 400-800 emails/month

## Alternative Email Services

If you prefer a different email service, you can modify the Edge Function to use:
- **SendGrid**: Popular alternative with good deliverability
- **AWS SES**: Cost-effective for high volume
- **Mailgun**: Developer-friendly with good documentation
- **Postmark**: Excellent for transactional emails

Simply replace the Resend API calls in the Edge Function with your preferred service's API.

## Support

If you encounter issues:
1. Check the Supabase Edge Function logs
2. Verify your Resend account status
3. Test with the mailto fallback to ensure the UI works
4. Contact your system administrator for assistance with DNS/domain setup

---

**Happy emailing! 📧✨** 