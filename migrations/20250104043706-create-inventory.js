'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Inventories', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      ProductName: {
        type: Sequelize.STRING,
        allowNull: false,  // Ensure product name is not null
      },
      Description: {
        type: Sequelize.STRING
      },
      ProductImage: {
        type: Sequelize.STRING
      },
      ProductCategoryName: {
        type: Sequelize.STRING,
        allowNull: false,  // Ensure product category is not null
      },
      ModelNumber: {
        type: Sequelize.STRING
      },
      SerialNumber: {
        type: Sequelize.STRING
      },
      StockLevel: {
        type: Sequelize.INTEGER,
        allowNull: false,  // Ensure stock level is not null
      },
      ReorderPoint: {
        type: Sequelize.INTEGER
      },
      SupplierName: {
        type: Sequelize.STRING
      },
      SupplierMail: {
        type: Sequelize.STRING
      },
      SupplierContact: {
        type: Sequelize.STRING
      },
      OrderDate: {
        type: Sequelize.DATE
      },
      Quantity: {
        type: Sequelize.INTEGER
      },
      OrderStatus: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Inventories');
  }
};
