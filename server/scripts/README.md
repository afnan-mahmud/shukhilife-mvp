# Database Seeding Scripts

This directory contains scripts to populate your MongoDB Atlas database with initial data for testing and development.

## Scripts Available

### 1. `seedDatabase.js` - Complete Database Seeding
Populates the entire database with comprehensive test data.

**What it seeds:**
- **Users**: 5 users (1 admin, 3 support, 1 packaging)
- **Products**: 8 sample products with images and descriptions
- **Orders**: 50 sample orders with realistic data
- **Settings**: Application settings and configuration

**Features:**
- Realistic order data with various statuses
- Random assignment to support users
- Steadfast integration data (30% of orders)
- Customer notes and order history
- Revenue calculations and statistics

### 2. `seedAdmin.js` - Admin User Only
Creates only the admin user for basic setup.

## Usage

### Prerequisites
1. Ensure your MongoDB Atlas connection string is correct in the script
2. Make sure all required dependencies are installed:
   ```bash
   npm install
   ```

### Running the Complete Seeding Script

```bash
# Navigate to server directory
cd server

# Run the complete seeding script
npm run seed:database
```

### Running Admin-Only Seeding

```bash
# Navigate to server directory
cd server

# Run admin seeding only
npm run seed:admin
```

## Sample Data Generated

### Users (5 total)
- **Admin**: admin@ecommerce-lite.com / AdminPass123
- **Support 1**: support1@ecommerce-lite.com / SupportPass123
- **Support 2**: support2@ecommerce-lite.com / SupportPass123
- **Support 3**: support3@ecommerce-lite.com / SupportPass123
- **Packaging**: packaging@ecommerce-lite.com / PackagingPass123

### Products (8 total)
- Wireless Headphones - $29.99
- Smart Watch - $199.99
- Bluetooth Speaker - $79.99
- Gaming Keyboard - $129.99
- Wireless Mouse - $49.99
- USB-C Hub - $39.99
- Laptop Stand - $24.99
- Phone Case - $19.99

### Orders (50 total)
- Various statuses: pending, confirmed, completed, canceled, etc.
- Random quantities (1-5 items per order)
- Realistic customer data and addresses
- 30% have Steadfast integration data
- Random notes and order history
- Distributed among support users

### Settings
- Round-robin assignment tracking
- Application version
- Maintenance mode settings

## Database Statistics

After seeding, the script displays:
- Total users by role
- Product count
- Order count by status
- Steadfast integration count
- Total revenue from completed orders

## Safety Features

- **Clear Database**: Removes all existing data before seeding
- **Error Handling**: Comprehensive error handling and logging
- **Connection Management**: Proper MongoDB connection handling
- **Validation**: Data validation before insertion

## Customization

To modify the seeded data:

1. **Users**: Edit the `sampleUsers` array
2. **Products**: Edit the `sampleProducts` array
3. **Orders**: Modify the order generation logic in `seedOrders()`
4. **Customers**: Update the `sampleCustomers` and `sampleAddresses` arrays

## Troubleshooting

### Connection Issues
- Verify your MongoDB Atlas connection string
- Check network access and IP whitelist
- Ensure the database user has proper permissions

### Memory Issues
- For large datasets, consider reducing the number of orders
- Monitor memory usage during seeding

### Data Issues
- Check console output for specific error messages
- Verify all required fields are present in sample data

## Production Warning

⚠️ **DO NOT run this script on production databases!**

This script is designed for development and testing only. It will:
- Clear all existing data
- Insert test data
- Overwrite any existing configuration

## Support

If you encounter issues:
1. Check the console output for error messages
2. Verify your MongoDB connection string
3. Ensure all dependencies are installed
4. Check that your MongoDB Atlas cluster is accessible
