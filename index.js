require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { UserModel, TodoModel } = require("./db");
const mongoose = require("mongoose");
const { auth, JWT_SECRET } = require("./auth");
const app = express();
const noOfRounds = parseInt(process.env.NO_OF_ROUNDS);
app.use(express.json());
const connectionString = process.env.DATABASE_URL;
const port = process.env.PORT;
const { z } = require("zod"); // importing zod.

(async () => {
  // console.log(connectionString);
  await mongoose.connect(connectionString);
})();
// this line is very important as this will allow us to connect to the database and the last line /todo-app-database is for denoting the database we need to connect to.

const passwordValidate = (password) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{3,}$/;
  return regex.test(password);
};

app.post("/signup", async (req, res) => {
  const requiredBody = z.object({
    email: z.string().email(),
    password: z.string().min(3).max(40).refine(passwordValidate, {
      error:
        "The Password must contain at least 1 uppercase, 1 lowercase, 1 number and 1 special character.",
    }),
    name: z.string().min(3).max(50),
  });

  const { data, success, error } = requiredBody.safeParse(req.body);
  if (!success) {
    res.status(400).json({
      error: error.issues[0].error,
    });
    return;
  }

  const { email, password, name } = data;

  const hashedPassword = await bcrypt.hash(password, noOfRounds);
  // this hashed password will gets add inside the database in the password field.

  // this .create method will create a new user in the database. and this returns a promise which can be handled by .then syntax.
  UserModel.create({ email, password: hashedPassword, name })
    .then(() => {
      res.status(200).json({
        message: "User SignedUp Successfully",
      });
    })
    .catch((err) => {
      res.status(409).json({
        Error: err.errmsg,
      });
    })
    .finally(() => {
      console.log("The event has been Settled.");
    });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // here user.password will have the encypted password, and this will be compared with the password given by the user through body.

  const user = await UserModel.findOne({ email });

  if (!user) {
    res.status(403).json({
      message: "User does not exist",
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  // console.log(isMatch);

  if (isMatch) {
    // if user exits, returns a token..
    const token = jwt.sign(
      {
        userId: user._id.toString(), // this typecasting is important.
      },
      JWT_SECRET
    );

    res.status(200).json({
      token: token,
    });
  } else {
    res.status(403).json({
      message: "invalid credentials",
    });
  }
});

app.use(auth); // this is a middleware which will check if the user is authenticated or not for /todo and /todos.

app.post("/todo", (req, res) => {
  const userId = req.userId;
  const { title, done } = req.body;

  TodoModel.create({ title, done, userId })
    .then(() => {
      res.status(200).json({
        message: "Todo created successfully",
      });
    })
    .catch((err) => {
      res.status(409).json({
        Error: err.errmsg,
      });
    });
});

app.get("/todos", (req, res) => {
  const userId = req.userId;

  TodoModel.find({ userId })
    .then((todos) => {
      const filteredTodos = todos.map((todo) => ({
        title: todo.title,
        done: todo.done,
        objectId: todo._id.toString(),
      }));

      res.status(200).json({
        todos: filteredTodos,
      });
    })
    .catch((err) => {
      res.status(409).json({
        Error: err.errmsg,
      });
    });
});

app.post("/toggle", async (req, res) => {
  const userId = req.userId;
  const { objId } = req.body;

  /*
  // for testing purpose where it is finding the correct Todo Item or not.
  TodoModel.find({ userId, _id: objId })
    .then((todo) => {
      res.status(200).json({
        todo,
      });
    })
    .catch((err) => {
      res.status(400).json({
        Msg: "Somethings Wrong..!",
      });
    });
    */

  try {
    const data = await TodoModel.find({ userId, _id: objId });
    const taskStatus = data[0].done;

    await TodoModel.findByIdAndUpdate(objId, { done: !taskStatus });

    res.status(200).json({
      Msg: "update Done.!",
    });
  } catch (err) {
    res.status(400).json({
      Error: "Something went wrong, Kindly contact the Developer.!",
    });
  }
});

app.get("/singleTodo", (req, res) => {
  const userId = req.userId;
  const { objId } = req.body;
  TodoModel.find({ userId, _id: objId })
    .then((todo) => {
      res.status(200).json({
        todo,
      });
    })
    .catch((err) => {
      res.status(400).json({
        Msg: "Somethings Wrong..!",
      });
    });
});

app.listen(port, () => {
  console.log("Server running on port " + port);
});
