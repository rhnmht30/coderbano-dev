require("dotenv").config();
const bcrypt = require("bcryptjs");
const axios = require("axios");

module.exports.register = async (req, res) => {
	let { handle, email, password } = req.body;
	let api;
	try {
		api = await axios.get(
			`https://codeforces.com/api/user.info?handles=${handle}`
		);
	} catch (err) {
		api = err.response;
	}
	if (api.data.status === "OK") {
		let user = await User.findOne({ $or: [{ email }, { handle }] });
		if (user) {
			return res.status(406).json({
				message: "Email/Handle already in use",
				error: false,
				data: null
			});
		} else {
			let salt = await bcrypt.genSalt();
			password = await bcrypt.hash(password, salt);
			let newUser = { handle, password, email };
			await User.create(newUser);
			return res.status(200).json({
				message: "success",
				error: false,
				data: null
			});
		}
	} else {
		res.status(406).json({
			message: "Invalid Codeforces handle",
			error: true,
			data: api.data
		});
	}
};

module.exports.login = async (req, res) => {
	let { email, password } = req.body;
	try {
		let user = await User.findOne({ email });
		if (user) {
			let isMatchPassword = await bcrypt.compare(password, user.password);
			if (isMatchPassword) {
				let token = user.generateAuthToken();
				return res
					.status(200)
					.header("x-auth-token", token)
					.json({
						message: "success",
						error: false,
						data: { user, token }
					});
			} else {
				return res.status(200).json({
					message: "invalid credentials",
					error: true,
					data: req.body
				});
			}
		} else {
			return res
				.status(200)
				.json({ message: "invalid user", error: true, data: null });
		}
	} catch (err) {
		return res
			.status(400)
			.json({ message: err.message, error: true, data: null });
	}
};
