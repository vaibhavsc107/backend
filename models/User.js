const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {
        type: String,
        required: true  // Fix: 'require' → 'required'
    },
    email: {
        type: String,
        required: true, // Fix: 'require' → 'required'
        unique: true   // Fix: 'require: unique' → 'unique: true'
    },
    password: {
        type: String,
        required: true  // Fix: 'require' → 'required'
    }
});

const UserModel = mongoose.model('Users', UserSchema);
module.exports = UserModel;  // Fix: Capitalized 'User' for convention
