import express from "express"
import mongoose from "mongoose"
import jwt from "jsonwebtoken";
import dotenv from "dotenv"
import bcrypt from "bcrypt"
import cors from "cors"

dotenv.config();
const PORT = process.env.PORT || 800;
const app = express();

app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Database is connected"))
    .catch((e) => console.log("db connecting error", e.message))

const userSchema = new mongoose.Schema({
    userName: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    tasks: [{
        title: { type: String },
        description: { type: String },
        completed: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
    }
    ]
})

const User = mongoose.model("User", userSchema);

app.post("/user/register", async (req, res) => {
    const { userName, email, password } = req.body;
    try {
        const user = await User.findOne({ email: email });
        if (user) {
            return res.status(400).json({ success: false, message: "User Already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const usr = new User({
            userName,
            email,
            password: hashedPassword
        });
        console.log(process.env.JWT_SECRET);

        const token = jwt.sign({ id: usr._id }, process.env.JWT_SECRET , { expiresIn: "7d" });
        await usr.save();

        const { password: userPassword, ...safeuser } = usr._doc;

        res.status(201).json({ 
            success: true, 
            message: "user has been registered successfully", 
            user: safeuser, 
            token 
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post("/user/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User Not found Please register" })
        }
        const isPassMatch = await bcrypt.compare(password, user.password)
        if (!isPassMatch) {
            return res.status(401).json({ succes: false, message: "email or password didn't match" })
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
        const {password:userPass, ...safeuser}=user._doc;
        res.status(201).json({ success: true, message: "user logged in successfully", token, user:safeuser })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

const userAuth = async (req, res, next) => {
    try {
        const token = req.headers?.authorization?.split(" ")[1];
        if (!token) return res.status(404).json({ success: false, message: "token is not found" });
        const decode = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decode.id);
        if (!user) {
            return res.status(400).json({ success: true, message: "user not found with this token" });
        }
        req.user = user;
        next();
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

app.post("/user/add-task", userAuth, async (req, res) => {
    try {
        const { title, description } = req.body;
        if (!title || !description) return res.status(400).json({ succes: false, message: "tasks title and description must be present" });
        const newTask = {
            title,
            description
        }
        req.user.tasks.push(newTask);
        await req.user.save();
        res.status(201).json({ success: true, message: "task has been added", user: req.user.tasks[req.user.tasks.length - 1] })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
})

app.delete("/user/delete-task/:taskId", userAuth, async (req, res) => {
    try {
        const { taskId } = req.params;

        const task = req.user.tasks.id(taskId);
        if (!task) {
            return res.status(404).json({ success: false, message: "Task not found" });
        }

        task.deleteOne();
        await req.user.save();

        res.status(200).json({ success: true, message: "Task deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.put("/user/update-task/:taskId", userAuth, async (req, res) => {
    try {
        const { taskId } = req.params;
        const { title, description, completed = false } = req.body;

        const task = req.user.tasks.id(taskId);
        if (!task) {
            return res.status(404).json({ success: false, message: "Task not found" });
        }

        if(!task.title==undefined)task.title = title;
        task.description = description;
        task.completed = completed;

        await req.user.save();

        res.status(200).json({
            success: true,
            message: "Task updated successfully",
            task
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get("/user/tasks", userAuth, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      tasks: req.user.tasks
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


app.get("/", (req, res) => {
    res.send(`<h1 style={background:gray,border:1px solid red}>Your server is working.....</h1>`)
})

app.listen(PORT, () => {
    console.log(`Your server is running on http://localhost:${PORT}`);
})