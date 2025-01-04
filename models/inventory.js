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
      return this.create(productData);  // Creates and returns a new Inventory record
    }

    static updateProduct(productId, updateData) {
      return this.update(updateData, {
        where: { id: productId },
      });
    }

    static deleteProduct(productId) {
      return this.destroy({
        where: { id: productId },
      });
    }
  }

  Inventory.init(
    {
      ProductName: {
        type: DataTypes.STRING,
        allowNull: false,  // Product name is mandatory
      },
      Description: DataTypes.STRING,
      ProductImage: DataTypes.STRING,
      ProductCategoryName: {
        type: DataTypes.STRING,
        allowNull: false,  // Product category is mandatory
      },
      ModelNumber: DataTypes.STRING,
      SerialNumber: DataTypes.STRING,
      StockLevel: {
        type: DataTypes.INTEGER,
        allowNull: false,  // Stock level is mandatory
        validate: {
          min: 0,
        },
      },
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
          key: 'id',
        },
        allowNull: false,
      }
    },
    {
      sequelize,
      modelName: 'Inventory',
    }
  );

  return Inventory;
};
