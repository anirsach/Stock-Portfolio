const mongoose = require('mongoose');
const { Schema } = mongoose;

const assetSchema = new Schema({
    name: String,
    price: Number,
    quantity: Number,
    cprice: Number,
    assetPL: {
        type: Number,
        default: 0
    }
})

module.exports = mongoose.model('Asset', assetSchema);