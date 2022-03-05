const mongoose = require('mongoose');
const { Schema } = mongoose;

const portfolioSchema = new Schema({
    user: String,
    password: String,
    capital: Number,
    asset: [{ type: Schema.Types.ObjectId, ref: 'Asset' }]
})

module.exports = mongoose.model('portfolio', portfolioSchema);