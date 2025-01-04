/* eslint-disable */
"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // Define any associations here if needed
    }

    static addUser({ firstname, lastname, email, password, role }) {
      return this.create({ firstname, lastname, email, password, role });
    }

    static async getUser(userId) {
      return this.findByPk(userId);
    }

    static getAllUsers() {
      return this.findAll();
    }
  }

  User.init(
    {
      firstname: DataTypes.STRING,
      lastname: DataTypes.STRING,
      email: {
        type: DataTypes.STRING,
        unique: true,  // Email should be unique
        allowNull: false,  // Email cannot be null
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,  // Password cannot be null
      },
      role: {
        type: DataTypes.ENUM('admin', 'manager', 'staff', 'customer'),  // Added 'customer' role
        defaultValue: 'staff',  // Default role is staff
        allowNull: false,  // Role cannot be null
      },
    },
    {
      sequelize,
      modelName: "User",
    }
  );

  return User;
};
