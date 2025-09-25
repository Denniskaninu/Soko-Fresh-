'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      user_type: {
        type: Sequelize.ENUM('farmer', 'buyer'),
        allowNull: false
      },
      phone_number: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      password_hash: {
        type: Sequelize.STRING,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      location: {
        type: Sequelize.JSON,
        allowNull: true
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      otp_code: {
        type: Sequelize.STRING,
        allowNull: true
      },
      otp_expires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      refresh_token: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      last_login: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('users', ['phone_number'], {
      name: 'users_phone_number_idx',
      unique: true
    });

    await queryInterface.addIndex('users', ['email'], {
      name: 'users_email_idx',
      unique: true,
      where: {
        email: {
          [Sequelize.Op.ne]: null
        }
      }
    });

    await queryInterface.addIndex('users', ['user_type'], {
      name: 'users_user_type_idx'
    });

    await queryInterface.addIndex('users', ['is_verified'], {
      name: 'users_is_verified_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('users', 'users_phone_number_idx');
    await queryInterface.removeIndex('users', 'users_email_idx');
    await queryInterface.removeIndex('users', 'users_user_type_idx');
    await queryInterface.removeIndex('users', 'users_is_verified_idx');

    // Drop the table
    await queryInterface.dropTable('users');

    // Drop the enum type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_user_type";');
  }
};