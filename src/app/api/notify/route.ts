import { NextResponse } from 'next/server';
import { connectToDatabase } from '../utils/mongodb';

// Your email to receive notifications
const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL || 'your-email@example.com';

// Free notification service endpoint (EmailJS)
const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID || 'service_id';
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || 'template_id';
const EMAILJS_USER_ID = process.env.EMAILJS_USER_ID || 'user_id';
const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY || '';

export async function POST(req: Request) {
  console.log('🔔 Notification endpoint called');
  console.log('📧 Recipient email:', RECIPIENT_EMAIL);
  console.log('🔑 EmailJS Service ID:', EMAILJS_SERVICE_ID);
  console.log('🔑 EmailJS Template ID:', EMAILJS_TEMPLATE_ID);
  console.log('🔑 EmailJS User ID:', EMAILJS_USER_ID);
  console.log('🔑 EmailJS Private Key:', EMAILJS_PRIVATE_KEY ? 'Provided' : 'Not provided');
  
  try {
    const { sender, message = 'is waiting for you in the chat!' } = await req.json();
    console.log(`📝 Notification from ${sender}: ${message}`);
    
    // Store notification in MongoDB
    try {
      const { db } = await connectToDatabase();
      const notification = {
        sender,
        message,
        timestamp: new Date(),
        read: false
      };
      await db.collection('notifications').insertOne(notification);
      console.log('💾 Notification saved to MongoDB');
    } catch (dbError: any) {
      console.error('❌ MongoDB error:', dbError);
      // Continue even if DB fails - we still want to try sending the email
    }
    
    // Prepare EmailJS request
    const emailJSPayload = {
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_USER_ID,
      accessToken: EMAILJS_PRIVATE_KEY, // Add private key for strict mode
      template_params: {
        email: RECIPIENT_EMAIL,
        from_name: sender,
        message: message,
        app_url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      }
    };
    
    console.log('📤 Sending email with payload:', JSON.stringify(emailJSPayload, null, 2));
    
    // Send notification using EmailJS (free for low volume)
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailJSPayload)
    });
    
    const responseStatus = response.status;
    const responseText = await response.text();
    
    console.log(`📬 EmailJS Response Status: ${responseStatus}`);
    console.log(`📬 EmailJS Response Body: ${responseText}`);
    
    if (!response.ok) {
      throw new Error(`EmailJS returned ${responseStatus}: ${responseText}`);
    }
    
    console.log('✅ Notification sent successfully');
    return NextResponse.json({ 
      status: 'success', 
      message: 'Notification sent',
      details: {
        emailStatus: responseStatus,
        emailResponse: responseText,
        recipient: RECIPIENT_EMAIL,
        sender: sender
      }
    });
  } catch (error: any) {
    console.error('❌ Notification error:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
