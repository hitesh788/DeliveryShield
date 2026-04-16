const mongoose = require('mongoose');

// Schema definitions (shared across dynamic models)
const claimSchema = require('../models/Claim').schema;
const transactionSchema = require('../models/Transaction').schema;

/**
 * Vault Utility: Creates user-specific collections for high-sensitivity data.
 * Each user gets their own dedicated sub-ledger in the database.
 */
const getVaultModel = (userId, type) => {
    if (!userId) throw new Error("UserId required for vault access");

    // Clean userId for collection naming (remove special chars if any)
    const cleanId = userId.toString().replace(/[^a-z0-9]/gi, '_');

    let schema;
    let baseName;

    if (type === 'Claim') {
        schema = claimSchema;
        baseName = 'claims_vault';
    } else if (type === 'Transaction') {
        schema = transactionSchema;
        baseName = 'transactions_vault';
    } else {
        throw new Error("Invalid vault type");
    }

    const collectionName = `${baseName}_${cleanId}`;

    // Check if model already exists in Mongoose to prevent re-compilation errors
    if (mongoose.models[collectionName]) {
        return mongoose.models[collectionName];
    }

    return mongoose.model(collectionName, schema, collectionName);
};

module.exports = { getVaultModel };
