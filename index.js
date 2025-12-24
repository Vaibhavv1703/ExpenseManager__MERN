require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const path = require("path");
const methodOverride = require("method-override");

const app = express();

app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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
	name: {
		type: String,
		required: true,
	},
	email: {
		type: String,
		required: true,
	},
	pass: {
		type: String,
		required: true,
	},
});
const User = mongoose.model("User", userSchema);

const dataSchema = new mongoose.Schema({
	userID: {
		type: String,
		required: true,
	},
	payee: {
		type: String,
	},
	amount: {
		type: Number,
		required: true,
	},
	date: {
		type: String,
		required: true,
	},
});
const Data = mongoose.model("Data", dataSchema);

// var uID = "694a974fb7761ab3a8ed68d5";
var uID;

app.get("/", (req, res) => {
	if (uID != null) {
		Data.find({ userID: `${uID}` }).then((userData) => {
			res.render("home.ejs", { userData, uID});
		});
	} else {
		res.redirect("/signin");
	}
});

app.get("/signin", (req, res) => {
	uID = null;
	res.render("signin.ejs");
});

app.get("/signup", (req, res) => {
	uID = null;
	res.render("signup.ejs");
});

app.post("/signup", (req, res) => {
	let { name: formName, email: formEmail, password: formPass } = req.body;
	User.find({ email: formEmail }).then((data) => {
		if (data.length != 0) {
			res.send("User already exists");
		} else {
			const newUser = new User({
				name: formName,
				email: formEmail,
				pass: formPass,
			});
			newUser.save();
			res.redirect("/signin");
		}
	});
});

app.post("/signin", (req, res) => {
	let { email: formEmail, password: formPassword } = req.body;
	User.find({ email: formEmail, pass: formPassword }).then((data) => {
		if (data.length == 0) {
			uID = null;
			res.send("No user found");
		} else {
			uID = data[0]["id"];
			res.redirect("/");
		}
	});
});

// app.get("/add-transaction", (req, res) => {

// });