const { User } = require('../models');
const { sendOTP } = require('../services/smsService'); // You'll need to implement this
const { Op } = require('sequelize');

class AuthController {
  // Register new user
  static async register(req, res) {
    try {
      const { 
        user_type, 
        phone_number, 
        email, 
        password, 
        name, 
        location 
      } = req.body;

      // Validate required fields
      if (!user_type || !phone_number || !password || !name) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: user_type, phone_number, password, name'
        });
      }

      // Validate user type
      if (!['farmer', 'buyer'].includes(user_type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user_type. Must be either "farmer" or "buyer"'
        });
      }

      // Validate password strength
      const passwordValidation = User.validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Password does not meet requirements',
          errors: passwordValidation.errors
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { phone_number },
            ...(email ? [{ email }] : [])
          ]
        }
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User already exists with this phone number or email'
        });
      }

      // Create new user
      const user = await User.create({
        user_type,
        phone_number,
        email: email || null,
        password_hash: password, // Will be hashed by the beforeCreate hook
        name,
        location: location || null
      });

      // Generate OTP for verification
      const otp = user.generateOTP();
      await user.save();

      // Send OTP via SMS
      if (process.env.NODE_ENV !== 'test') {
        try {
          await sendOTP(phone_number, otp);
        } catch (smsError) {
          console.error('Failed to send OTP:', smsError);
          // Continue with registration but notify about SMS issue
        }
      }

      res.status(201).json({
        success: true,
        message: 'User registered successfully. Please verify your phone number with the OTP sent.',
        data: {
          user_id: user.id,
          phone_number: user.phone_number,
          user_type: user.user_type,
          is_verified: user.is_verified,
          ...(process.env.NODE_ENV === 'test' && { otp }),
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during registration'
      });
    }
  }

  // Verify OTP
  static async verifyOTP(req, res) {
    try {
      const { phone_number, otp } = req.body;

      if (!phone_number || !otp) {
        return res.status(400).json({
          success: false,
          message: 'Phone number and OTP are required'
        });
      }

      const user = await User.findOne({ where: { phone_number } });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.is_verified) {
        return res.status(400).json({
          success: false,
          message: 'User is already verified'
        });
      }

      if (!user.validateOTP(otp)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP'
        });
      }

      // Mark user as verified and clear OTP
      user.is_verified = true;
      user.clearOTP();
      await user.save();

      // Generate tokens
      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();
      user.updateLastLogin();
      await user.save();

      res.json({
        success: true,
        message: 'Phone number verified successfully',
        data: {
          user: {
            id: user.id,
            phone_number: user.phone_number,
            email: user.email,
            name: user.name,
            user_type: user.user_type,
            location: user.location,
            is_verified: user.is_verified
          },
          tokens: {
            access_token: accessToken,
            refresh_token: refreshToken,
            token_type: 'Bearer',
            expires_in: 900 // 15 minutes in seconds
          }
        }
      });
    } catch (error) {
      console.error('OTP verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during OTP verification'
      });
    }
  }

  // Login user
  static async login(req, res) {
    try {
      const { phone_number, password } = req.body;

      if (!phone_number || !password) {
        return res.status(400).json({
          success: false,
          message: 'Phone number and password are required'
        });
      }

      // Find user by phone number
      const user = await User.findOne({ where: { phone_number } });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Validate password
      const isValidPassword = await user.validatePassword(password);
      
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Generate tokens
      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();
      user.updateLastLogin();
      await user.save();

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            phone_number: user.phone_number,
            email: user.email,
            name: user.name,
            user_type: user.user_type,
            location: user.location,
            is_verified: user.is_verified
          },
          tokens: {
            access_token: accessToken,
            refresh_token: refreshToken,
            token_type: 'Bearer',
            expires_in: 900 // 15 minutes in seconds
          }
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during login'
      });
    }
  }

  // Refresh access token
  static async refreshToken(req, res) {
    try {
      // user is already attached by validateRefreshToken middleware
      const user = req.user;

      // Generate new access token
      const accessToken = user.generateAccessToken();
      
      // Optionally generate new refresh token (for security)
      const refreshToken = user.generateRefreshToken();
      await user.save();

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          tokens: {
            access_token: accessToken,
            refresh_token: refreshToken,
            token_type: 'Bearer',
            expires_in: 900 // 15 minutes in seconds
          }
        }
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during token refresh'
      });
    }
  }

  // Resend OTP
  static async resendOTP(req, res) {
    try {
      const { phone_number } = req.body;

      if (!phone_number) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required'
        });
      }

      const user = await User.findOne({ where: { phone_number } });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.is_verified) {
        return res.status(400).json({
          success: false,
          message: 'User is already verified'
        });
      }

      // Generate new OTP
      const otp = user.generateOTP();
      await user.save();

      // Send OTP via SMS
      try {
        await sendOTP(phone_number, otp);
      } catch (smsError) {
        console.error('Failed to send OTP:', smsError);
        return res.status(500).json({
          success: false,
          message: 'Failed to send OTP. Please try again later.'
        });
      }

      res.json({
        success: true,
        message: 'OTP sent successfully'
      });
    } catch (error) {
      console.error('Resend OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while resending OTP'
      });
    }
  }

  // Forgot password - initiate reset
  static async forgotPassword(req, res) {
    try {
      const { phone_number } = req.body;

      if (!phone_number) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required'
        });
      }

      const user = await User.findOne({ where: { phone_number } });

      if (!user) {
        // Don't reveal if user exists or not for security
        return res.json({
          success: true,
          message: 'If an account with this phone number exists, you will receive an OTP shortly.'
        });
      }

      // Generate OTP for password reset
      const otp = user.generateOTP();
      await user.save();

      // Send OTP via SMS
      try {
        await sendOTP(phone_number, otp, 'Your password reset OTP is: ');
      } catch (smsError) {
        console.error('Failed to send password reset OTP:', smsError);
      }

      res.json({
        success: true,
        message: 'If an account with this phone number exists, you will receive an OTP shortly.'
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during password reset request'
      });
    }
  }

  // Reset password with OTP
  static async resetPassword(req, res) {
    try {
      const { phone_number, otp, new_password } = req.body;

      if (!phone_number || !otp || !new_password) {
        return res.status(400).json({
          success: false,
          message: 'Phone number, OTP, and new password are required'
        });
      }

      // Validate new password strength
      const passwordValidation = User.validatePasswordStrength(new_password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'New password does not meet requirements',
          errors: passwordValidation.errors
        });
      }

      const user = await User.findOne({ where: { phone_number } });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!user.validateOTP(otp)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP'
        });
      }

      // Reset password and clear OTP
      user.password_hash = new_password; // Will be hashed by beforeUpdate hook
      user.clearOTP();
      user.refresh_token = null; // Invalidate all existing refresh tokens
      await user.save();

      res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during password reset'
      });
    }
  }

  // Logout user
  static async logout(req, res) {
    try {
      const user = await User.findByPk(req.user.id);
      
      if (user) {
        // Clear refresh token to invalidate it
        user.refresh_token = null;
        await user.save();
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during logout'
      });
    }
  }

  // Get current user profile
  static async getProfile(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password_hash', 'otp_code', 'otp_expires', 'refresh_token'] }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          user
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching profile'
      });
    }
  }
}

module.exports = AuthController;
