/* eslint-disable */
"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Users", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      firstname: {
        type: Sequelize.STRING,
      },
      lastname: {
        type: Sequelize.STRING,
      },
      email: {
        type: Sequelize.STRING,
        unique: true,  // Email should be unique
        allowNull: false,  // Email cannot be null
      },
      role: {
        type: Sequelize.ENUM('admin', 'manager', 'staff', 'customer'), // Added 'customer' role
        defaultValue: 'staff',  // Default role is staff
        allowNull: false,  // Role cannot be null
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,  // Password cannot be null
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop the Users table and the ENUM type used for the role column
    await queryInterface.dropTable("Users");
  },
};
