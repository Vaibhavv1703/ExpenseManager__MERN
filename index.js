require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const path = require("path");
const methodOverride = require("method-override");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;

const app = express();

app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
	session({
		secret: process.env.SESSION_SECRET || "supersecret",
		resave: false,
		saveUninitialized: false,
		store: MongoStore.create({
			mongoUrl: process.env.MONGODB_URI,
		}),
		cookie: {
			maxAge: 1000 * 60 * 60 * 24, // 1 day
		},
	})
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

async function main() {
	try {
		await mongoose.connect(process.env.MONGODB_URI);
		await mongoose.connection.db.admin().command({ ping: 1 });
		console.log("MongoDB connected successfully");
	} catch (err) {
		console.error("MongoDB connection failed:", err);
		process.exit(1);
	}
}

const PORT = process.env.PORT || 8080;
main().then(() => {
	app.listen(PORT, () => {
		console.log(`Server running on port ${PORT}`);
		console.log("http://localhost:8080/");
	});
});

const userSchema = new mongoose.Schema({
	name: { type: String, required: true },
	email: { type: String, required: true },
	pass: { type: String, required: true }
});
const User = mongoose.model("User", userSchema);

const dataSchema = new mongoose.Schema({
	userID: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	payee: String,
	amount: { type: Number, required: true },
	date: { type: String, required: true },
});
const Data = mongoose.model("Data", dataSchema);


app.get("/", async (req, res) => {
	if (!req.session.userID) {
		return res.redirect("/signin");
	}
	const userData = await Data.find({userID: req.session.userID});

	res.render("home.ejs", {userData, uID: req.session.userID,});
});

app.get("/signin", (req, res) => {
	res.render("signin.ejs");
});

app.get("/signup", (req, res) => {
	res.render("signup.ejs");
});

app.post("/signup", async (req, res) => {
	const { name, email, password } = req.body;

	const existingUser = await User.findOne({ email });
	if (existingUser) {
		return res.send("User already exists");
	}

	const newUser = ({name, email, pass:password});
	await newUser.save();

	res.redirect("/signin");
});

app.post("/signin", async (req, res) => {
	const { email, password } = req.body;

	const user = await User.findOne({ email, pass: password });
	if (!user) {
		return res.send("No user found");
	}

	req.session.userID = user._id;
	res.redirect("/");
});

// app.get("/add-transaction", (req, res) => {

// });