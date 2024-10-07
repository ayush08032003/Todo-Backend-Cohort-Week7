const mongoose = require("mongoose");

const ObjectId = mongoose.ObjectId;
const Schema = mongoose.Schema;

const User = new Schema({
  // this is more of a better practice to use this type of schema, as this makes the email input unique and put more constraints in it.
  email: { type: String, unique: true },
  password: String,
  name: String,
});

const Todo = Schema({
  title: String,
  done: Boolean,
  userId: ObjectId,
});

// User Model, "users" represents the collections made inside the mongoose DB and User represents the schema.
const UserModel = mongoose.model("users", User);
const TodoModel = mongoose.model("todos", Todo);

// now export these modals as an object so that they can be used further, by importing.
module.exports = { UserModel, TodoModel };
