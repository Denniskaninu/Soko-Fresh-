const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_type: {
      type: DataTypes.ENUM('farmer', 'buyer'),
      allowNull: false,
    },
    phone_number: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        is: /^[+]?[\d\s\-\(\)]{10,}$/ // Basic phone validation
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 100]
      }
    },
    location: {
      type: DataTypes.JSON,
      allowNull: true, // {lat, lng, address}
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // Add OTP fields for verification
    otp_code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    otp_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Add refresh token field
    refresh_token: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'users',
    timestamps: false,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password_hash) {
          user.password_hash = await bcrypt.hash(user.password_hash, 12);
        }
        user.updated_at = new Date();
      },
      beforeUpdate: async (user) => {
        if (user.changed('password_hash')) {
          user.password_hash = await bcrypt.hash(user.password_hash, 12);
        }
        user.updated_at = new Date();
      }
    }
  });

  // Instance methods for authentication
  User.prototype.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.password_hash);
  };

  User.prototype.generateAccessToken = function() {
    return jwt.sign(
      { 
        id: this.id, 
        user_type: this.user_type,
        phone_number: this.phone_number,
        is_verified: this.is_verified
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
  };

  User.prototype.generateRefreshToken = function() {
    const refreshToken = jwt.sign(
      { 
        id: this.id,
        tokenVersion: Date.now() // Add version to invalidate old tokens
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    this.refresh_token = refreshToken;
    return refreshToken;
  };

  User.prototype.generateOTP = function() {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.otp_code = otp;
    this.otp_expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    return otp;
  };

  User.prototype.validateOTP = function(otp) {
    if (!this.otp_code || !this.otp_expires) {
      return false;
    }
    
    if (new Date() > this.otp_expires) {
      return false;
    }
    
    return this.otp_code === otp;
  };

  User.prototype.clearOTP = function() {
    this.otp_code = null;
    this.otp_expires = null;
  };

  User.prototype.updateLastLogin = function() {
    this.last_login = new Date();
  };

  // Static methods
  User.validatePasswordStrength = function(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
    
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (!hasUpperCase) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumbers) {
      errors.push('Password must contain at least one number');
    }
    if (!hasSpecialChar) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  User.associate = (models) => {
    User.hasOne(models.Farmer, { foreignKey: 'user_id' });
    User.hasOne(models.Buyer, { foreignKey: 'user_id' });
  };

  return User;
};