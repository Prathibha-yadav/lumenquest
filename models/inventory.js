// models/inventory.js
'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Inventory extends Model {
    static associate(models) {
      Inventory.belongsTo(models.User, {
        foreignKey: "userId",
      });    
    }

    static addProduct(productData) {
      // You can either use this static method or use the create method directly in the route
      return this.create(productData);  // Creates and returns a new Inventory record
    }
  }

  Inventory.init({
    ProductName: DataTypes.STRING,
    Description: DataTypes.STRING,
    ProductImage: DataTypes.STRING,
    ProductCategoryName: DataTypes.STRING,
    ModelNumber: DataTypes.STRING,
    SerialNumber: DataTypes.STRING,
    StockLevel: DataTypes.INTEGER,
    ReorderPoint: DataTypes.INTEGER,
    SupplierName: DataTypes.STRING,
    SupplierMail: DataTypes.STRING,
    SupplierContact: DataTypes.STRING,
    OrderDate: DataTypes.DATE,
    Quantity: DataTypes.INTEGER,
    OrderStatus: DataTypes.STRING,
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',  // The model we're referencing (Users table)
        key: 'id'
      },
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Inventory',
  });

  return Inventory;
};
