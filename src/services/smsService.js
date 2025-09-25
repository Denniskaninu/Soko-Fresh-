// SMS Service - You can integrate with providers like Twilio, Africa's Talking, etc.

const sendOTP = async (phoneNumber, otp, customMessage = '') => {
  try {
    // Format phone number before sending
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
    
    // Validate the formatted phone number
    if (!validatePhoneNumber(formattedPhoneNumber)) {
      throw new Error(`Invalid phone number format: ${phoneNumber}`);
    }
    
    const message = customMessage || `Your GreenTrust verification code is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`;
    
    console.log(`SMS Service - Sending OTP to ${formattedPhoneNumber}: ${otp}`);
    
    // For development/testing - just log the OTP
    if (process.env.NODE_ENV === 'development') {
      console.log(`📱 SMS to ${formattedPhoneNumber}: ${message}`);
      return Promise.resolve({ success: true, message: 'OTP sent (development mode)' });
    }

    // Example: Twilio implementation
    if (process.env.SMS_PROVIDER === 'twilio') {
      return await sendViaTwilio(formattedPhoneNumber, message);
    }
    
    // Example: Africa's Talking implementation (popular in Kenya)
    if (process.env.SMS_PROVIDER === 'africas_talking') {
      return await sendViaAfricasTalking(formattedPhoneNumber, message);
    }

    // Default: Mock implementation
    return await mockSMSService(formattedPhoneNumber, message);
    
  } catch (error) {
    console.error('SMS Service Error:', error);
    throw new Error('Failed to send SMS');
  }
};

// Twilio implementation example
const sendViaTwilio = async (phoneNumber, message) => {
  const twilio = require('twilio');
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });
    
    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error('Twilio Error:', error);
    throw error;
  }
};

// Africa's Talking implementation example - FIXED
// Africa's Talking implementation example - FIXED
// Africa's Talking implementation example - FIXED for sender ID
const sendViaAfricasTalking = async (phoneNumber, message) => {
  const AfricasTalking = require('africastalking');

  // Validate required environment variables
  if (!process.env.AFRICAS_TALKING_API_KEY || !process.env.AFRICAS_TALKING_USERNAME) {
    throw new Error('Africa\'s Talking API credentials are missing');
  }

  const africasTalking = AfricasTalking({
    apiKey: process.env.AFRICAS_TALKING_API_KEY,
    username: process.env.AFRICAS_TALKING_USERNAME
  });

  const sms = africasTalking.SMS;

  try {
    const smsOptions = {
      to: phoneNumber,
      message: message
    };

    // Only add 'from' if you have a registered sender ID
    if (process.env.AFRICAS_TALKING_SHORTCODE) {
      smsOptions.from = process.env.AFRICAS_TALKING_SHORTCODE;
    }
    // If no shortcode, Africa's Talking will use your username automatically

    console.log('Sending SMS with options:', {
      to: phoneNumber,
      from: smsOptions.from || 'default (username)',
      messageLength: message.length
    });

    const result = await sms.send(smsOptions);
    
    console.log('Africa\'s Talking Response:', result);
    
    // Check if SMS was sent successfully
    if (result.SMSMessageData && result.SMSMessageData.Recipients && result.SMSMessageData.Recipients.length > 0) {
      return { success: true, result };
    } else {
      throw new Error(`SMS failed: ${result.SMSMessageData?.Message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Africa\'s Talking Error:', error);
    throw error;
  }
};

// Mock SMS service for testing
const mockSMSService = async (phoneNumber, message) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log(`🔔 Mock SMS sent to ${phoneNumber}: ${message}`);
  
  return { 
    success: true, 
    messageId: 'mock_' + Date.now(),
    message: 'SMS sent successfully (mock)' 
  };
};

// Validate phone number format - IMPROVED
const validatePhoneNumber = (phoneNumber) => {
  // Remove all non-digit characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // Check if it's a valid international format
  const internationalRegex = /^\+[1-9]\d{1,14}$/;
  
  // Check if it's a valid Kenyan number
  const kenyaRegex = /^(\+254)[7-9]\d{8}$/;
  
  return internationalRegex.test(cleaned) && kenyaRegex.test(cleaned);
};

// Format phone number to international format - IMPROVED
const formatPhoneNumber = (phoneNumber) => {
  let cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // Handle Kenyan numbers specifically
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    // Convert 0710996532 to +254710996532
    cleaned = '+254' + cleaned.substring(1);
  } else if (cleaned.startsWith('254') && !cleaned.startsWith('+254') && cleaned.length === 12) {
    // Convert 254710996532 to +254710996532
    cleaned = '+' + cleaned;
  } else if (cleaned.startsWith('7') && cleaned.length === 9) {
    // Convert 710996532 to +254710996532
    cleaned = '+254' + cleaned;
  } else if (!cleaned.startsWith('+')) {
    // If no country code and not starting with 0, assume it needs +254
    if (cleaned.length === 9 && cleaned.match(/^[7-9]/)) {
      cleaned = '+254' + cleaned;
    }
  }
  
  return cleaned;
};

module.exports = {
  sendOTP,
  validatePhoneNumber,
  formatPhoneNumber
};