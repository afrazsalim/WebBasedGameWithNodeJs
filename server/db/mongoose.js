var mongoose = require("mongoose");
mongoose.Promise = global.Promise;
mongoose.connect("mongodb+srv://users:ironnic77@cluster0-v9n32.gcp.mongodb.net/test?retryWrites=true", { useNewUrlParser: true });

module.exports = {
	mongoose
};
